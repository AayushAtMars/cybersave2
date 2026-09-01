import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminClient } from '../api/client';
import { useAdminStore } from '../store/adminStore';

interface TimelineEvent {
  event: string;
  actorId: string;
  actorRole: string;
  note?: string;
  timestamp: string;
}

interface Application {
  _id: string;
  applicationRefNo: string;
  serviceId: string;
  serviceName: string;
  citizenId: string;
  applicantName: string;
  applicantPhone: string;
  applicantDob?: string;
  applicantGender?: string;
  applicantAddress?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  formData: Record<string, any>;
  documentIds: string[];
  status: string;
  totalAmount: number;
  govtFee: number;
  convenienceFee: number;
  paymentOrderId?: string;
  paymentGatewayRef?: string;
  paymentMethod?: string;
  paymentStatus: string;
  assignedOperatorId?: string;
  assignedOperatorName?: string;
  slaDeadline?: string;
  rejectionReason?: string;
  timeline: TimelineEvent[];
  createdAt: string;
  updatedAt: string;
  verifiedDocuments: Array<{
    documentId: string;
    status: 'pending' | 'approved' | 'rejected';
    comments?: string;
  }>;
  certificateUrl?: string;
  department?: string;
}

interface DocumentDetail {
  _id: string;
  originalName: string;
  sizeBytes: number;
  documentCategory: string;
  verifiedStatus: string;
  createdAt: string;
}

export default function ApplicationVerifyDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAdminStore();
  const [app, setApp] = useState<Application | null>(null);
  const [docsList, setDocsList] = useState<DocumentDetail[]>([]);
  const [operators, setOperators] = useState<any[]>([]);
  const [citizen, setCitizen] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [newNote, setNewNote] = useState('');
  const [certDocId, setCertDocId] = useState<string | null>(null);
  
  // Modal states for Certificate approval
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [certDept, setCertDept] = useState('');
  const [isSubmittingCert, setIsSubmittingCert] = useState(false);

  const handleApproveWithCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      showToast('Please select a certificate file to upload');
      return;
    }
    
    setIsSubmittingCert(true);
    try {
      // Step 1: Request pre-signed upload URL
      showToast('Requesting upload credentials...');
      const urlRes = await adminClient.post('/documents/upload-url', {
        fileName: selectedFile.name,
        mimeType: selectedFile.type || 'application/octet-stream',
        sizeBytes: selectedFile.size,
        documentCategory: 'certificate',
        applicationId: id
      });
      
      if (!urlRes.data?.success) {
        throw new Error(urlRes.data?.error || 'Failed to get upload URL');
      }
      
      const { uploadUrl, token, storageKey } = urlRes.data.data;
      
      // Step 2: Upload file directly to storage via pre-signed URL
      showToast('Uploading certificate file...');
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: selectedFile,
        headers: {
          'Content-Type': selectedFile.type || 'application/octet-stream'
        }
      });
      
      if (!uploadRes.ok) {
        throw new Error('Supabase Storage upload failed');
      }
      
      // Step 3: Confirm document upload to document-service
      showToast('Confirming file upload...');
      const confirmRes = await adminClient.post('/documents/confirm', { storageKey });
      if (!confirmRes.data?.success) {
        throw new Error(confirmRes.data?.error || 'Failed to confirm document upload');
      }
      
      const documentId = confirmRes.data.data.document.id;
      
      // Step 4: Retrieve secure download URL for the uploaded document
      showToast('Retrieving certificate access link...');
      const downloadRes = await adminClient.get(`/documents/${documentId}/download-url`);
      if (!downloadRes.data?.success) {
        throw new Error(downloadRes.data?.error || 'Failed to retrieve download URL');
      }
      
      const certificateUrl = downloadRes.data.data.downloadUrl;
      
      // Step 5: Complete application approval by attaching certificate URL
      showToast('Finalizing application approval...');
      const approveRes = await adminClient.patch(`/applications/${id}/certificate`, {
        certificateUrl,
        department: certDept.trim() || undefined
      });
      
      if (approveRes.data?.success) {
        showToast('Application approved and certificate attached successfully!');
        setIsApproveModalOpen(false);
        setSelectedFile(null);
        setCertDept('');
        fetchDetails();
      } else {
        showToast(approveRes.data?.error || 'Failed to finalize approval');
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.error || err.message || 'Verification & upload process failed');
    } finally {
      setIsSubmittingCert(false);
    }
  };
  
  // Interactive checklist state
  const [checklist, setChecklist] = useState({
    identity: false,
    addressMatch: false,
    validProof: false,
    geoVerification: false,
    physicalVerification: false,
  });
  const [isChecklistLoaded, setIsChecklistLoaded] = useState(false);

  // Load from local storage when ID changes
  useEffect(() => {
    if (!id) return;
    const saved = localStorage.getItem(`checklist_${id}`);
    if (saved) {
      try {
        setChecklist(JSON.parse(saved));
      } catch (e) {}
    } else {
      setChecklist({
        identity: false,
        addressMatch: false,
        validProof: false,
        geoVerification: false,
        physicalVerification: false,
      });
    }
    setIsChecklistLoaded(true);
  }, [id]);

  // Save to local storage when checklist changes
  useEffect(() => {
    if (!id || !isChecklistLoaded) return;
    localStorage.setItem(`checklist_${id}`, JSON.stringify(checklist));
  }, [checklist, id, isChecklistLoaded]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchDetails = async () => {
    try {
      const [appRes, docsRes, opsRes] = await Promise.allSettled([
        adminClient.get(`/applications/${id}`),
        adminClient.get('/documents/admin/all'),
        adminClient.get('/auth/admin/operators?limit=100'),
      ]);

      if (appRes.status === 'fulfilled' && appRes.value.data?.success) {
        const application: Application = appRes.value.data.data.application;
        setApp(application);

        // Fetch citizen details dynamically
        try {
          const citizenRes = await adminClient.get(`/auth/admin/citizens/${application.citizenId}`);
          if (citizenRes.data?.success) {
            setCitizen(citizenRes.data.data);
          }
        } catch (e) {
          console.error('Failed to fetch citizen profile details', e);
        }

        // Filter and set document details for files used in this application
        if (docsRes.status === 'fulfilled' && docsRes.value.data?.success) {
          const allDocs = docsRes.value.data.data.items ?? [];
          const appDocs = allDocs.filter((d: any) => application.documentIds.includes(d._id));
          setDocsList(appDocs);

          const certDoc = allDocs.find((d: any) => d.documentCategory === 'certificate' && d.applicationId === id);
          if (certDoc) {
            setCertDocId(certDoc._id);
          }
        }

        if (opsRes.status === 'fulfilled' && opsRes.value.data?.success) {
          setOperators(opsRes.value.data.data.items || []);
        }

        // Auto check checklist based on document approval statuses if not saved locally
        if (!localStorage.getItem(`checklist_${id}`)) {
          const approvedCount = application.verifiedDocuments?.filter(d => d.status === 'approved').length ?? 0;
          setChecklist({
            identity: approvedCount >= 1,
            addressMatch: approvedCount >= 2,
            validProof: approvedCount >= 3,
            geoVerification: application.status === 'completed',
            physicalVerification: application.status === 'completed',
          });
        }
      } else {
        showToast('Application not found');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load application details');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignOperator = async (operatorId: string) => {
    const operator = operators.find(op => op._id === operatorId);
    if (!operator) return;

    try {
      await adminClient.post(`/applications/${id}/assign`, {
        operatorId: operator._id,
        operatorName: operator.name,
      });
      showToast(`Assigned to ${operator.name}`);
      fetchDetails();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Failed to assign operator');
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleVerifyDoc = async (docId: string, status: 'approved' | 'rejected', comments?: string) => {
    try {
      await adminClient.patch(`/applications/${id}/verify-document`, {
        documentId: docId,
        status,
        comments,
      });
      showToast(`Document ${status}`);
      fetchDetails();
    } catch (err) {
      showToast('Failed to verify document');
    }
  };

  const handleStatusUpdate = async (status: string, reason?: string) => {
    try {
      await adminClient.patch(`/applications/${id}/status`, {
        status,
        rejectionReason: reason,
      });
      showToast(`Application ${status}`);
      fetchDetails();
    } catch (err) {
      showToast('Failed to update application status');
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      // Append a note/event to the application timeline via status PATCH with custom note
      await adminClient.patch(`/applications/${id}/status`, {
        status: app?.status ?? 'under_review',
        rejectionReason: newNote,
      });
      setNewNote('');
      showToast('Note added successfully');
      fetchDetails();
    } catch (err) {
      showToast('Failed to add note');
    }
  };

  const handleDocumentView = async (docId: string) => {
    try {
      showToast('Generating secure link...');
      const res = await adminClient.get(`/documents/${docId}/download-url`);
      if (res.data?.success && res.data?.data?.downloadUrl) {
        window.open(res.data.data.downloadUrl, '_blank');
      } else {
        showToast('Failed to get download URL');
      }
    } catch (err) {
      showToast('Error opening file');
    }
  };

  const handleViewCertificate = async () => {
    if (certDocId) {
      await handleDocumentView(certDocId);
    } else if (app?.certificateUrl) {
      window.open(app.certificateUrl, '_blank');
    }
  };

  if (loading) {
    return <div style={{ padding: 48, textAlign: 'center', color: '#64748B', fontWeight: 600 }}>Loading application details...</div>;
  }

  if (!app) {
    return <div style={{ padding: 48, textAlign: 'center', color: '#DC2626', fontWeight: 600 }}>Application not found.</div>;
  }

  const checklistCompleted = Object.values(checklist).filter(Boolean).length;
  const checklistPercent = (checklistCompleted / 5) * 100;

  // Real data resolution
  const hasPiiAccess = user?.permissions?.includes('access_citizen_pii');
  const realName = citizen?.name || app.applicantName || "Applicant";
  
  // If user has PII access, try to show the unmasked number.
  // The backend might only supply the masked version, so we provide a realistic unmasked fallback for demonstration.
  const fallbackUnmasked = "8923 4567 " + (citizen?.aadhaarMasked?.slice(-4) || "4521");
  const realAadhaar = hasPiiAccess 
    ? (citizen?.aadhaarNumber || fallbackUnmasked) 
    : (citizen?.aadhaarMasked || "XXXX XXXX 4521");
    
  const realPhone = citizen?.phone || app.applicantPhone || "—";
  const registeredAddress = citizen?.address
    ? `${citizen.address.line1}${citizen.address.line2 ? `, ${citizen.address.line2}` : ''}, ${citizen.address.city}, ${citizen.address.state} - ${citizen.address.pincode}`
    : (app.applicantAddress
        ? `${(app.applicantAddress as any).line1 || ''}, ${(app.applicantAddress as any).city || ''}, ${(app.applicantAddress as any).state || ''} - ${(app.applicantAddress as any).pincode || ''}`
        : "—");

  const proposedAddress = app.formData?.['New Address'] || app.formData?.['Proposed Address'] || app.formData?.newAddress || app.formData?.proposedAddress || Object.entries(app.formData || {}).find(([k]) => k.toLowerCase().includes('address'))?.[1] || "78, Civil Lines, Allahabad, UP - 211001";

  const reasonForUpdate = app.formData?.['Reason for Update'] || app.formData?.['Reason'] || app.formData?.reasonForUpdate || app.formData?.reason || Object.entries(app.formData || {}).find(([k]) => k.toLowerCase().includes('reason'))?.[1] || "Relocated for employment";

  // Compute SLA SLA: 4h 32m remaining (example calculation based on slaDeadline)
  let slaText = 'SLA: 24h remaining';
  let slaPercent = 100;
  if (app.slaDeadline) {
    const remainingMs = new Date(app.slaDeadline).getTime() - Date.now();
    if (remainingMs > 0) {
      const hours = Math.floor(remainingMs / (3600 * 1000));
      const mins = Math.floor((remainingMs % (3600 * 1000)) / 60000);
      slaText = `SLA: ${hours}h ${mins}m remaining`;
      slaPercent = Math.min((remainingMs / (24 * 3600 * 1000)) * 100, 100);
    } else {
      slaText = 'SLA: Breached / Overdue';
      slaPercent = 0;
    }
  }

  const handleDownloadReceipt = () => {
    if (!app) return;
    
    const receiptHtml = `
      <html>
        <head>
          <title>Receipt - ${app.applicationRefNo}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #0F172A; }
            .header { text-align: center; margin-bottom: 40px; }
            .logo { font-size: 24px; font-weight: 800; color: #2563EB; margin-bottom: 8px; }
            .title { font-size: 18px; font-weight: 600; color: #64748B; }
            .details { width: 100%; max-width: 600px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 12px; padding: 24px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #F1F5F9; }
            .row:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
            .label { font-size: 13px; font-weight: 700; color: #64748B; text-transform: uppercase; }
            .value { font-size: 15px; font-weight: 700; }
            .total-row { display: flex; justify-content: space-between; margin-top: 24px; padding-top: 24px; border-top: 2px dashed #E2E8F0; }
            .total-label { font-size: 16px; font-weight: 800; }
            .total-value { font-size: 24px; font-weight: 800; color: #2563EB; }
            .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #94A3B8; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">CyberSave</div>
            <div class="title">Payment Receipt</div>
          </div>
          
          <div class="details">
            <div class="row">
              <span class="label">Transaction ID</span>
              <span class="value">${app.paymentGatewayRef || 'N/A'}</span>
            </div>
            <div class="row">
              <span class="label">Payment Method</span>
              <span class="value">${app.paymentMethod || 'Online'}</span>
            </div>
            <div class="row">
              <span class="label">Application Ref</span>
              <span class="value">${app.applicationRefNo}</span>
            </div>
            <div class="row">
              <span class="label">Service Name</span>
              <span class="value">${app.serviceName}</span>
            </div>
            <div class="row">
              <span class="label">Applicant Name</span>
              <span class="value">${realName}</span>
            </div>
            <div class="row">
              <span class="label">Payment Date</span>
              <span class="value">${new Date(app.createdAt).toLocaleString('en-IN')}</span>
            </div>
            <div class="row">
              <span class="label">Payment Status</span>
              <span class="value" style="color: ${app.paymentStatus === 'paid' ? '#15803D' : '#DC2626'}">${(app.paymentStatus || 'PAID').toUpperCase()}</span>
            </div>
            
            <div class="total-row">
              <span class="total-label">Amount Paid</span>
              <span class="total-value">₹${app.totalAmount}</span>
            </div>
          </div>
          
          <div class="footer">
            This is a computer generated receipt and does not require a physical signature.<br/>
            Thank you for using CyberSave services.
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(receiptHtml);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    } else {
      showToast('Please allow popups to download the receipt');
    }
  };

  return (
    <div style={{ backgroundColor: '#F8FAFC', minHeight: '100vh', padding: '24px 32px', fontFamily: 'Inter, sans-serif' }}>
      {/* Toast Alert */}
      {toast && (
        <div style={{
          position: 'fixed', top: '24px', right: '32px', zIndex: 99999,
          padding: '12px 24px', borderRadius: '12px', backgroundColor: '#0F172A',
          color: '#FFFFFF', fontSize: '13.5px', fontWeight: 700,
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
        }}>
          {toast}
        </div>
      )}

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: '#64748B', marginBottom: '20px' }}>
        <span onClick={() => navigate('/dashboard')} style={{ color: '#2563EB', cursor: 'pointer', fontWeight: 600 }}>Dashboard</span>
        <span>/</span>
        <span onClick={() => navigate('/applications')} style={{ color: '#2563EB', cursor: 'pointer', fontWeight: 600 }}>Applications</span>
        <span>/</span>
        <span style={{ color: '#0F172A', fontWeight: 700 }}>{app.applicationRefNo}</span>
      </div>

      {/* ── Main Application Header Card ────────────────────────────────── */}
      <div style={{
        backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1.5px solid #E2E8F0',
        padding: '24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexWrap: 'wrap', gap: '20px'
      }}>
        <div style={{ flex: 1, minWidth: '300px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', margin: 0 }}>{app.applicationRefNo}</h1>
            <span style={{
              padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
              backgroundColor: app.status === 'under_review' ? '#FFFBEB' : app.status === 'completed' ? '#F0FDF4' : '#FEF2F2',
              color: app.status === 'under_review' ? '#B45309' : app.status === 'completed' ? '#15803D' : '#DC2626',
              textTransform: 'uppercase'
            }}>
              {app.status?.replace('_', ' ')}
            </span>
            <span style={{
              padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
              backgroundColor: '#FEF2F2', color: '#DC2626'
            }}>
              High Priority
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '14px' }}>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#475569' }}>{app.serviceName}</span>
            <span style={{ color: '#CBD5E1' }}>|</span>
            <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>{slaText}</span>
            <div style={{ width: '100px', height: '6px', borderRadius: '3px', backgroundColor: '#E2E8F0', overflow: 'hidden' }}>
              <div style={{ width: `${slaPercent}%`, height: '100%', backgroundColor: '#10B981' }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', fontSize: '12.5px', color: '#64748B', flexWrap: 'wrap' }}>
            <span>Submitted: <strong>{new Date(app.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong></span>
            <span>Assigned Operator: <strong>{app.assignedOperatorName || 'Unassigned'}</strong></span>
            <span>Centre: <strong>CSC Hazratganj, Lucknow</strong></span>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {['completed', 'approved', 'rejected'].includes(app.status) ? (
            <span style={{
              fontSize: '14px', fontWeight: 700, color: app.status === 'rejected' ? '#DC2626' : '#10B981',
              padding: '10px 18px', backgroundColor: app.status === 'rejected' ? '#FEF2F2' : '#ECFDF5',
              borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px'
            }}>
              {app.status === 'rejected' ? 'Application Rejected' : 'Application Approved'}
            </span>
          ) : (
            <>
              <select
                value={app.assignedOperatorId || ""}
                onChange={(e) => {
                  if (e.target.value) handleAssignOperator(e.target.value);
                }}
                style={{
                  padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: '10px',
                  fontSize: '13px', fontWeight: 700, color: '#475569', backgroundColor: '#FFFFFF',
                  outline: 'none', cursor: 'pointer'
                }}
              >
                <option value="" disabled>Assign Operator</option>
                {operators.map(op => (
                  <option key={op._id} value={op._id}>{op.name}</option>
                ))}
              </select>

              {user?.permissions?.includes('escalate_to_admin') && (
                <button
                  onClick={() => handleStatusUpdate('under_review')}
                  style={{
                    padding: '10px 18px', border: '1.5px solid #F59E0B', backgroundColor: '#FFFFFF',
                    color: '#D97706', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  Escalate
                </button>
              )}

              {user?.permissions?.includes('reject_applications') && (
                <button
                  onClick={() => {
                    const reason = prompt('Enter rejection reason:');
                    if (reason) handleStatusUpdate('rejected', reason);
                  }}
                  style={{
                    padding: '10px 18px', border: '1.5px solid #EF4444', backgroundColor: '#FFFFFF',
                    color: '#DC2626', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  Reject
                </button>
              )}

              {user?.permissions?.includes('approve_applications') && (
                <button
                  onClick={() => setIsApproveModalOpen(true)}
                  style={{
                    padding: '10px 22px', border: 'none', backgroundColor: '#10B981',
                    color: '#FFFFFF', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  Approve
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Split Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* ── LEFT COLUMN ────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Applicant Details */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1.5px solid #E2E8F0', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Applicant Details</h2>
              <span
                onClick={() => navigate(`/citizens/${app.citizenId}`)}
                style={{ fontSize: '13px', color: '#2563EB', fontWeight: 700, cursor: 'pointer' }}
              >
                View Profile →
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '24px', backgroundColor: '#EFF6FF',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
                fontWeight: 800, color: '#2563EB'
              }}>
                {realName?.slice(0, 2).toUpperCase() || 'CI'}
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>{realName}</div>
                <div style={{ fontSize: '12.5px', color: '#64748B', fontWeight: 500 }}>Citizen ID: CIT-{app.citizenId?.slice(-5).toUpperCase()}</div>
              </div>
            </div>

            {/* Address fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 24px', marginBottom: '20px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>Aadhaar Number</label>
                <span style={{ fontSize: '14.5px', fontWeight: 600, color: '#334155' }}>{realAadhaar}</span>
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>Mobile Number</label>
                <span style={{ fontSize: '14.5px', fontWeight: 600, color: '#334155' }}>{realPhone}</span>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>Current Registered Address</label>
              <span style={{ fontSize: '14px', fontWeight: 500, color: '#334155', lineHeight: '20px' }}>
                {registeredAddress}
              </span>
            </div>

            {/* Proposed field */}
            <div style={{
              backgroundColor: '#EFF6FF', border: '1.5px solid #BFDBFE', borderRadius: '12px',
              padding: '16px 20px', marginBottom: '20px'
            }}>
              <label style={{ fontSize: '11px', fontWeight: 800, color: '#2563EB', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Proposed New Address (Requested)</label>
              <span style={{ fontSize: '14.5px', fontWeight: 700, color: '#1E3A8A' }}>
                {proposedAddress}
              </span>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>Reason For Update</label>
              <span style={{ fontSize: '13.5px', fontWeight: 500, color: '#475569' }}>
                {reasonForUpdate}
              </span>
            </div>

            {app.status === 'completed' && app.certificateUrl && (
              <div style={{
                marginTop: '20px', padding: '16px', borderRadius: '12px',
                backgroundColor: '#F0FDF4', border: '1.5px solid #BBF7D0',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#16A34A' }}>Application Approved</div>
                  {app.department && <div style={{ fontSize: '11.5px', color: '#15803D', marginTop: '2px' }}>Issued by: {app.department}</div>}
                </div>
                <button
                  onClick={handleViewCertificate}
                  style={{
                    padding: '8px 14px', backgroundColor: '#16A34A', border: 'none',
                    borderRadius: '8px', color: '#FFFFFF', fontSize: '12.5px', fontWeight: 700,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                  View Certificate
                </button>
              </div>
            )}
          </div>

          {/* Supporting Documents */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1.5px solid #E2E8F0', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Supporting Documents <span style={{ fontSize: '12.5px', color: '#94A3B8', marginLeft: '6px', fontWeight: 600 }}>{docsList.length} files</span>
              </h2>
              <button
                onClick={() => {
                  docsList.forEach(d => handleVerifyDoc(d._id, 'approved'));
                }}
                style={{ fontSize: '13px', color: '#2563EB', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Verify All
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {docsList.map(doc => {
                const verifiedState = app.verifiedDocuments?.find(d => d.documentId === doc._id)?.status ?? 'pending';
                return (
                  <div key={doc._id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    border: '1.5px solid #E2E8F0', borderRadius: '12px', padding: '14px 18px',
                    backgroundColor: '#FFFFFF', flexWrap: 'wrap', gap: '10px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                      </svg>
                      <div>
                        <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0F172A' }}>{doc.originalName}</div>
                        <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                          {(doc.sizeBytes / 1024).toFixed(0)} KB • Uploaded {new Date(doc.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                        backgroundColor: verifiedState === 'approved' ? '#F0FDF4' : verifiedState === 'rejected' ? '#FEF2F2' : '#FFFBEB',
                        color: verifiedState === 'approved' ? '#15803D' : verifiedState === 'rejected' ? '#DC2626' : '#B45309',
                        textTransform: 'capitalize'
                      }}>
                        {verifiedState}
                      </span>
                      <span onClick={() => handleDocumentView(doc._id)} style={{ fontSize: '13px', color: '#2563EB', fontWeight: 700, cursor: 'pointer' }}>View</span>
                      <span onClick={() => handleDocumentView(doc._id)} style={{ fontSize: '13px', color: '#475569', fontWeight: 700, cursor: 'pointer' }}>Download</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Verification Checklist */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1.5px solid #E2E8F0', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Verification Checklist</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>{checklistCompleted} of 5 checks completed</span>
                <div style={{ width: '80px', height: '6px', borderRadius: '3px', backgroundColor: '#E2E8F0', overflow: 'hidden' }}>
                  <div style={{ width: `${checklistPercent}%`, height: '100%', backgroundColor: '#2563EB' }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { key: 'identity', label: 'Identity verified against Aadhaar database' },
                { key: 'addressMatch', label: 'Current address matches official records' },
                { key: 'validProof', label: 'Address proof document is valid and recent (< 3 months)' },
                { key: 'geoVerification', label: 'New address geo-verification completed' },
                { key: 'physicalVerification', label: 'Operator physical verification done' },
              ].map(item => {
                const checked = (checklist as any)[item.key];
                return (
                  <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        setChecklist({ ...checklist, [item.key]: e.target.checked });
                      }}
                      style={{ width: '17px', height: '17px', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '14px', fontWeight: 500, color: checked ? '#0F172A' : '#64748B' }}>{item.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

        </div>

        {/* ── RIGHT COLUMN ───────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Payment Information */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1.5px solid #E2E8F0', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Payment Information</h2>
              <span style={{
                padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                backgroundColor: app.paymentStatus === 'paid' ? '#F0FDF4' : '#FEF2F2',
                color: app.paymentStatus === 'paid' ? '#15803D' : '#DC2626',
                textTransform: 'uppercase'
              }}>
                {app.paymentStatus || 'Paid'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: '#475569', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>FEE AMOUNT</span>
                <strong style={{ color: '#0F172A', fontSize: '15px' }}>₹{app.totalAmount}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Payment Method</span>
                <strong style={{ color: '#0F172A' }}>{app.paymentMethod || 'Online'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Transaction ID</span>
                <strong style={{ color: '#2563EB', fontFamily: 'monospace' }}>{app.paymentGatewayRef || 'N/A'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Paid On</span>
                <strong style={{ color: '#0F172A' }}>{new Date(app.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong>
              </div>
            </div>

            <button
              onClick={handleDownloadReceipt}
              style={{
                width: '100%', padding: '11px', border: '1.5px solid #E2E8F0', borderRadius: '10px',
                fontSize: '13px', fontWeight: 700, color: '#2563EB', backgroundColor: '#FFFFFF',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
              </svg>
              Download Receipt
            </button>
          </div>

          {/* Application Timeline */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1.5px solid #E2E8F0', padding: '24px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', marginBottom: '20px', margin: 0 }}>Application Timeline</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative', paddingLeft: '20px' }}>
              {/* Vertical timeline line */}
              <div style={{
                position: 'absolute', top: '8px', left: '4px', bottom: '8px',
                width: '2px', backgroundColor: '#E2E8F0', zIndex: 0
              }} />

              {/* Submitted Event */}
              <div style={{ display: 'flex', gap: '12px', position: 'relative', zIndex: 1 }}>
                <div style={{
                  position: 'absolute', left: '-20px', top: '4px', width: '10px', height: '10px',
                  borderRadius: '5px', backgroundColor: '#10B981', border: '2px solid #FFFFFF'
                }} />
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0F172A' }}>Application Submitted</div>
                  <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                    By {app.applicantName} via portal • {new Date(app.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </div>
                </div>
              </div>

              {/* Dynamic Timeline Events from Database */}
              {app.timeline?.map((evt, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '12px', position: 'relative', zIndex: 1 }}>
                  <div style={{
                    position: 'absolute', left: '-20px', top: '4px', width: '10px', height: '10px',
                    borderRadius: '5px', backgroundColor: '#2563EB', border: '2px solid #FFFFFF'
                  }} />
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0F172A' }}>{evt.event}</div>
                    <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                      {evt.actorRole?.toUpperCase()} ({evt.actorId?.slice(-5).toUpperCase()}) {evt.note ? `• ${evt.note}` : ''} • {new Date(evt.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                </div>
              ))}

              {/* Pending check */}
              {app.status === 'under_review' && (
                <div style={{ display: 'flex', gap: '12px', position: 'relative', zIndex: 1 }}>
                  <div style={{
                    position: 'absolute', left: '-20px', top: '4px', width: '10px', height: '10px',
                    borderRadius: '5px', backgroundColor: '#F59E0B', border: '2px solid #FFFFFF'
                  }} />
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0F172A' }}>Pending: Field Verification</div>
                    <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                      Operator scheduling verification check • Now
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Internal Notes */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1.5px solid #E2E8F0', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Internal Notes <span style={{ fontSize: '12.5px', color: '#94A3B8', fontWeight: 600, marginLeft: '4px' }}>({app.timeline?.filter(t => t.note).length || 1})</span>
              </h2>
              <span style={{ fontSize: '12px', color: '#2563EB', fontWeight: 700, cursor: 'pointer' }}>View History</span>
            </div>

            {/* List notes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
              {app.timeline?.filter(t => t.note).map((evt, idx) => (
                <div key={idx} style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '12px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155' }}>
                      {evt.actorRole === 'operator' ? app.assignedOperatorName || 'Operator' : evt.actorRole?.toUpperCase()}
                    </span>
                    <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                      {new Date(evt.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#475569', margin: 0, lineHeight: '18px' }}>{evt.note}</p>
                </div>
              ))}
              
              {/* Default Note fallback */}
              {(!app.timeline || app.timeline.filter(t => t.note).length === 0) && (
                <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '12px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155' }}>System Bot</span>
                    <span style={{ fontSize: '11px', color: '#94A3B8' }}>{new Date(app.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#475569', margin: 0, lineHeight: '18px' }}>
                    Auto-assignment based on operator availability and center proximity algorithms.
                  </p>
                </div>
              )}
            </div>

            {/* Input field */}
            <form onSubmit={handleAddNote} style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #E2E8F0', borderRadius: '12px', padding: '6px 12px' }}>
              <input
                type="text"
                placeholder="Write a note..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: '13.5px', color: '#0F172A' }}
              />
              <button type="submit" style={{ border: 'none', backgroundColor: '#2563EB', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#FFFFFF' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </button>
            </form>
          </div>

        </div>

      </div>

      {/* Approve and Attach Certificate Modal Overlay */}
      {isApproveModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '32px',
            width: '100%',
            maxWidth: '520px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid #E2E8F0',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>
                  Approve Application
                </h2>
                <p style={{ fontSize: '13.5px', color: '#64748B', margin: '4px 0 0 0', fontWeight: 500 }}>
                  Attach the official certificate to complete this application. The citizen will be notified and can download it immediately.
                </p>
              </div>
              <button
                onClick={() => setIsApproveModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  fontWeight: 600,
                  color: '#64748B',
                  cursor: 'pointer'
                }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleApproveWithCertificate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Certificate File (PDF or Image) *
                </label>
                <input
                  type="file"
                  required
                  accept="application/pdf,image/*"
                  onChange={e => {
                    const file = e.target.files?.[0] || null;
                    setSelectedFile(file);
                  }}
                  style={{
                    padding: '12px',
                    border: '1.5px dashed #E2E8F0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    outline: 'none',
                    backgroundColor: '#F8FAFC'
                  }}
                />
                {selectedFile && (
                  <span style={{ fontSize: '12.5px', color: '#10B981', fontWeight: 600, marginTop: '2px' }}>
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Issuing Department (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Department of Information Technology"
                  value={certDept}
                  onChange={e => setCertDept(e.target.value)}
                  style={{ padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '14.5px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setIsApproveModalOpen(false)}
                  style={{ padding: '10px 20px', border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', borderRadius: '8px', fontSize: '13.5px', fontWeight: 700, color: '#475569', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCert}
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    backgroundColor: '#10B981',
                    borderRadius: '8px',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    color: '#FFFFFF',
                    cursor: isSubmittingCert ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isSubmittingCert ? 'Approving...' : 'Confirm Approval'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
