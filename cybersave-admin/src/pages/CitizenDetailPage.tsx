import React, { useEffect, useState } from 'react';
import { adminClient } from '../api/client';

interface Citizen {
  id: string;
  name: string;
  phone: string;
  email?: string;
  dob?: string;
  age?: number;
  gender?: string;
  avatar?: string;
  aadhaarMasked?: string;
  panMasked?: string;
  state?: string;
  district?: string;
  address?: { line1: string; line2?: string; city: string; state: string; pincode: string };
  isVerified: boolean;
  isActive: boolean;
  sessions?: Array<{ id: string; device: string; location: string; ip: string; lastActive: string }>;
  createdAt: string;
  updatedAt: string;
}

interface Document {
  _id: string;
  originalName: string;
  documentCategory: string;
  verifiedStatus: 'verified' | 'pending' | 'rejected' | 'uploaded';
  sizeBytes: number;
  createdAt: string;
}

interface Application {
  _id: string;
  serviceName?: string;
  status: string;
  totalAmount?: number;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  citizenId: string;
  onBack: () => void;
}

function Tab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px 18px',
        border: 'none',
        background: 'none',
        fontSize: '13.5px',
        fontWeight: active ? 700 : 500,
        color: active ? '#2563EB' : '#64748B',
        borderBottom: active ? '2px solid #2563EB' : '2px solid transparent',
        cursor: 'pointer',
        whiteSpace: 'nowrap' as const,
      }}
    >
      {label}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    verified:   { bg: '#F0FDF4', color: '#15803D', label: 'Verified' },
    pending:    { bg: '#FFFBEB', color: '#B45309', label: 'Pending Review' },
    rejected:   { bg: '#FEF2F2', color: '#DC2626', label: 'Rejected' },
    uploaded:   { bg: '#EFF6FF', color: '#2563EB', label: 'Uploaded' },
    completed:  { bg: '#F0FDF4', color: '#15803D', label: 'Completed' },
    in_progress: { bg: '#EFF6FF', color: '#2563EB', label: 'In Progress' },
    submitted:  { bg: '#FFFBEB', color: '#B45309', label: 'Submitted' },
    draft:      { bg: '#F8FAFC', color: '#475569', label: 'Draft' },
  };
  const s = map[status?.toLowerCase()] ?? { bg: '#F1F5F9', color: '#475569', label: status };
  return (
    <span style={{
      padding: '3px 10px',
      borderRadius: '20px',
      fontSize: '11.5px',
      fontWeight: 700,
      backgroundColor: s.bg,
      color: s.color,
    }}>
      {s.label}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div style={{ marginBottom: '18px' }}>
      <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' as const, marginBottom: '4px', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: '14px', color: '#0F172A', fontWeight: 500 }}>{value || '—'}</div>
    </div>
  );
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

function capitalize(str?: string | null): string {
  if (!str) return '—';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const DocIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
  </svg>
);

export default function CitizenDetailPage({ citizenId, onBack }: Props) {
  const [citizen, setCitizen] = useState<Citizen | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [blocking, setBlocking] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Notification Modal States
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');
  const [notifType, setNotifType] = useState('system');
  const [sendingNotif, setSendingNotif] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [citizenRes, docsRes, appsRes, txnsRes] = await Promise.allSettled([
          adminClient.get(`/auth/admin/citizens/${citizenId}`),
          adminClient.get(`/documents/admin/all`),
          adminClient.get(`/applications/admin/all`, { params: { citizenId } }),
          adminClient.get(`/payments/admin/transactions`, { params: { citizenId } }),
        ]);
        if (citizenRes.status === 'fulfilled' && citizenRes.value.data.success) {
          setCitizen(citizenRes.value.data.data);
        }
        if (docsRes.status === 'fulfilled' && docsRes.value.data.success) {
          const allDocs: Document[] = docsRes.value.data.data.items ?? [];
          setDocuments(allDocs.filter((d: any) => String(d.ownerId) === String(citizenId)));
        }
        if (appsRes.status === 'fulfilled' && appsRes.value.data.success) {
          setApplications(appsRes.value.data.data.items ?? []);
        }
        if (txnsRes.status === 'fulfilled' && txnsRes.value.data.success) {
          setTransactions(txnsRes.value.data.data.items ?? []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [citizenId]);

  const handleBlockToggle = async () => {
    if (!citizen) return;
    const msg = citizen.isActive ? 'Block this citizen?' : 'Unblock this citizen?';
    if (!window.confirm(msg)) return;
    setBlocking(true);
    try {
      await adminClient.patch(`/auth/admin/citizens/${citizenId}/block`);
      setCitizen(c => c ? { ...c, isActive: !c.isActive } : c);
      showToast(citizen.isActive ? 'Citizen blocked' : 'Citizen unblocked');
    } catch {
      showToast('Action failed');
    } finally {
      setBlocking(false);
    }
  };

  const handleViewDocument = async (docId: string) => {
    try {
      showToast('Generating secure link...');
      const res = await adminClient.get(`/documents/${docId}/download-url`);
      if (res.data?.success && res.data?.data?.downloadUrl) {
        window.open(res.data.data.downloadUrl, '_blank');
      } else {
        showToast('Failed to get document URL');
      }
    } catch (err: any) {
      console.error(err);
      showToast('Error opening document');
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifBody.trim()) {
      showToast('Please fill all fields');
      return;
    }
    setSendingNotif(true);
    try {
      await adminClient.post('/notifications/send', {
        citizenId,
        title: notifTitle,
        body: notifBody,
        type: notifType,
      });
      showToast('Notification sent successfully');
      setNotifTitle('');
      setNotifBody('');
      setNotifType('system');
      setShowNotifModal(false);
    } catch (err: any) {
      console.error(err);
      showToast('Failed to send notification');
    } finally {
      setSendingNotif(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#64748B' }}>
        <div style={{ fontSize: '14px', fontWeight: 600 }}>Loading citizen profile...</div>
      </div>
    );
  }

  if (!citizen) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#DC2626' }}>
        <div style={{ fontSize: '14px', fontWeight: 600 }}>Citizen not found.</div>
        <button onClick={onBack} style={{ marginTop: '16px', color: '#2563EB', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>← Go Back</button>
      </div>
    );
  }

  const initials = citizen.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const lastActive = citizen.sessions?.[0]?.lastActive
    ? timeAgo(citizen.sessions[0].lastActive)
    : timeAgo(citizen.updatedAt);

  const joinDate = formatDate(citizen.createdAt);

  return (
    <div style={{ backgroundColor: '#F8FAFC', minHeight: '100%', padding: '24px 32px' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', right: '28px', zIndex: 9999,
          padding: '12px 20px', borderRadius: '12px', backgroundColor: '#F0FDF4',
          border: '1.5px solid #BBF7D0', color: '#15803D', fontSize: '13.5px', fontWeight: 700,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        }}>
          {toast}
        </div>
      )}

      {/* Breadcrumb */}
      <div style={{ fontSize: '13px', color: '#64748B', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ color: '#2563EB', cursor: 'pointer', fontWeight: 600 }} onClick={onBack}>Dashboard</span>
        <span>→</span>
        <span style={{ color: '#2563EB', cursor: 'pointer', fontWeight: 600 }} onClick={onBack}>Citizen Management</span>
        <span>→</span>
        <span style={{ color: '#0F172A', fontWeight: 700 }}>{citizen.name}</span>
      </div>

      {/* Profile Header Card */}
      <div style={{
        backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1.5px solid #E2E8F0',
        padding: '24px 28px', marginBottom: '20px',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          {citizen.avatar ? (
            <img src={citizen.avatar} alt={citizen.name} style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #E2E8F0' }} />
          ) : (
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#2563EB',
              color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '22px', fontWeight: 800, flexShrink: 0,
            }}>
              {initials}
            </div>
          )}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', margin: 0 }}>{citizen.name}</h2>
              <span style={{
                padding: '2px 10px', borderRadius: '20px', fontSize: '11.5px', fontWeight: 700,
                backgroundColor: citizen.isVerified ? '#F0FDF4' : '#FEF9C3',
                color: citizen.isVerified ? '#15803D' : '#854D0E',
              }}>
                {citizen.isVerified ? 'Verified' : 'Unverified'}
              </span>
            </div>
            <div style={{ fontSize: '13px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' as const }}>
              <span>DT-{citizen.id.slice(-5).toUpperCase()}</span>
              <span>•</span>
              <span>Joined {joinDate}</span>
              {citizen.district && <><span>•</span><span>{citizen.district}, {citizen.state}</span></>}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' as const }}>
          <button
            id="view-edit-profile-btn"
            style={{
              padding: '9px 18px', border: '1.5px solid #E2E8F0', backgroundColor: '#FFFFFF',
              borderRadius: '9px', fontSize: '13px', fontWeight: 700, color: '#334155', cursor: 'pointer',
            }}
          >
            Edit Profile
          </button>
          <button
            id="toggle-block-btn"
            onClick={handleBlockToggle}
            disabled={blocking}
            style={{
              padding: '9px 18px', border: 'none',
              backgroundColor: citizen.isActive ? '#FEF2F2' : '#F0FDF4',
              borderRadius: '9px', fontSize: '13px', fontWeight: 700,
              color: citizen.isActive ? '#DC2626' : '#15803D',
              cursor: blocking ? 'not-allowed' : 'pointer',
              opacity: blocking ? 0.7 : 1,
            }}
          >
            {citizen.isActive ? 'Block Citizen' : 'Unblock Citizen'}
          </button>
          <button
            id="send-notification-btn"
            style={{
              padding: '9px 18px', border: 'none', backgroundColor: '#2563EB',
              borderRadius: '9px', fontSize: '13px', fontWeight: 700, color: '#FFFFFF', cursor: 'pointer',
            }}
            onClick={() => setShowNotifModal(true)}
          >
            Send Notification
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1.5px solid #E2E8F0', marginBottom: '20px' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', padding: '0 20px', overflowX: 'auto' as const }}>
          {['overview', 'services', 'documents', 'transactions', 'activity_log', 'notes'].map(tab => (
            <Tab key={tab} label={tab === 'activity_log' ? 'Activity Log' : tab.charAt(0).toUpperCase() + tab.slice(1)} active={activeTab === tab} onClick={() => setActiveTab(tab)} />
          ))}
        </div>

        <div style={{ padding: '24px' }}>
          {/* ── OVERVIEW TAB ──────────────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }}>
              {/* Left: Personal Info */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Personal Information</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
                  <InfoRow label="Full Name" value={citizen.name} />
                  <InfoRow label="Father's Name" value="—" />
                  <InfoRow
                    label="Date of Birth"
                    value={citizen.dob ? `${formatDate(citizen.dob)}${citizen.age ? ` (Age: ${citizen.age})` : ''}` : undefined}
                  />
                  <InfoRow label="Gender" value={capitalize(citizen.gender)} />
                  <InfoRow label="Aadhaar Number" value={citizen.aadhaarMasked ?? 'Not Provided'} />
                  <InfoRow label="PAN" value={citizen.panMasked ?? 'Not Provided'} />
                  <InfoRow label="Mobile" value={citizen.phone} />
                  <InfoRow label="Email" value={citizen.email} />
                </div>
                {citizen.address && (
                  <div style={{ marginTop: '4px' }}>
                    <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' as const, marginBottom: '4px', letterSpacing: '0.05em' }}>Address</div>
                    <div style={{ fontSize: '14px', color: '#0F172A', fontWeight: 500 }}>
                      {citizen.address.line1}{citizen.address.line2 ? `, ${citizen.address.line2}` : ''}, {citizen.address.city}, {citizen.address.state} - {citizen.address.pincode}
                    </div>
                  </div>
                )}

                {/* Recent Services / Applications */}
                <div style={{ marginTop: '28px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Recent Applications</h3>
                  </div>
                  {applications.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px', color: '#94A3B8', fontSize: '13px', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                      No applications found for this citizen.
                    </div>
                  ) : (
                    applications.slice(0, 5).map(app => (
                      <div key={app._id} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '14px 0', borderBottom: '1px solid #F1F5F9',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 12h6M9 15h4"/></svg>
                          </div>
                          <div>
                            <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0F172A' }}>{app.serviceName ?? 'Application'}</div>
                            <div style={{ fontSize: '12px', color: '#94A3B8' }}>{formatDate(app.createdAt)}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          {app.totalAmount != null && <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>₹{app.totalAmount}</span>}
                          <StatusBadge status={app.status} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Quick Stats */}
                <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '20px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A', margin: '0 0 14px 0' }}>Quick Stats</h4>
                  {[
                    { label: 'Total Services Used', value: applications.length.toString() },
                    { label: 'Total Amount Spent', value: `₹${applications.reduce((s, a) => s + (a.totalAmount ?? 0), 0).toLocaleString('en-IN')}` },
                    { label: 'Last Active', value: lastActive },
                    { label: 'Registered Centre', value: citizen.district ?? '—' },
                    { label: 'Assigned Operator', value: '—' },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: 500 }}>{label}</span>
                      <span style={{ fontSize: '13px', color: '#0F172A', fontWeight: 700, textAlign: 'right', maxWidth: '55%' }}>{value}</span>
                    </div>
                  ))}
                </div>

                {/* Uploaded Documents */}
                <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Uploaded Documents</h4>
                    <button onClick={() => setActiveTab('documents')} style={{ fontSize: '12px', color: '#2563EB', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>View All</button>
                  </div>
                  {documents.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: '12.5px', padding: '20px 0' }}>No documents uploaded</div>
                  ) : (
                    documents.slice(0, 5).map(doc => (
                      <div key={doc._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <DocIcon />
                          <div>
                            <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0F172A' }}>{doc.originalName}</div>
                            <div style={{ fontSize: '11px', color: '#94A3B8' }}>Uploaded {timeAgo(doc.createdAt)}</div>
                          </div>
                        </div>
                        <StatusBadge status={doc.verifiedStatus} />
                      </div>
                    ))
                  )}
                </div>

                {/* Recent Activity */}
                <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '20px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A', margin: '0 0 14px 0' }}>Recent Activity</h4>
                  {citizen.sessions && citizen.sessions.length > 0 ? (
                    citizen.sessions.slice(0, 5).map(session => (
                      <div key={session.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '12px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2563EB', marginTop: '5px', flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#0F172A' }}>Login from {session.device}</div>
                          <div style={{ fontSize: '11px', color: '#94A3B8' }}>{timeAgo(session.lastActive)} — {session.location}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: '#94A3B8', fontSize: '12.5px', textAlign: 'center', padding: '16px 0' }}>No recent activity</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── DOCUMENTS TAB ───────────────────────────────────────────────── */}
          {activeTab === 'documents' && (
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', margin: '0 0 16px 0' }}>Uploaded Documents</h3>
              {documents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px', color: '#94A3B8', fontSize: '14px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  No documents uploaded by this citizen.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F8FAFC' }}>
                      {['Document Name', 'Category', 'Size', 'Status', 'Uploaded', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', fontSize: '11.5px', fontWeight: 700, color: '#94A3B8', textAlign: 'left', borderBottom: '1px solid #E2E8F0', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map(doc => (
                      <tr key={doc._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '14px', fontSize: '13.5px', fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <DocIcon />
                          {doc.originalName}
                        </td>
                        <td style={{ padding: '14px', fontSize: '13px', color: '#475569', textTransform: 'capitalize' as const }}>{doc.documentCategory?.replace('_', ' ')}</td>
                        <td style={{ padding: '14px', fontSize: '13px', color: '#475569' }}>{(doc.sizeBytes / 1024).toFixed(0)} KB</td>
                        <td style={{ padding: '14px' }}><StatusBadge status={doc.verifiedStatus} /></td>
                        <td style={{ padding: '14px', fontSize: '13px', color: '#64748B' }}>{formatDate(doc.createdAt)}</td>
                        <td style={{ padding: '14px' }}>
                          <button
                            onClick={() => handleViewDocument(doc._id)}
                            style={{
                              padding: '5px 14px',
                              backgroundColor: '#EFF6FF',
                              color: '#2563EB',
                              border: '1.5px solid #BFDBFE',
                              borderRadius: '8px',
                              fontWeight: 700,
                              fontSize: '12px',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ── SERVICES TAB ───────────────────────────────────────────────── */}
          {activeTab === 'services' && (
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', margin: '0 0 16px 0' }}>Services Used</h3>
              {applications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px', color: '#94A3B8', fontSize: '14px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  No service applications found for this citizen.
                </div>
              ) : (
                applications.map(app => (
                  <div key={app._id} style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>{app.serviceName ?? 'Application'}</div>
                      <div style={{ fontSize: '12px', color: '#94A3B8' }}>Applied: {formatDate(app.createdAt)}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      {app.totalAmount != null && <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '14px' }}>₹{app.totalAmount}</span>}
                      <StatusBadge status={app.status} />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── TRANSACTIONS TAB ───────────────────────────────────────────── */}
          {activeTab === 'transactions' && (
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', margin: '0 0 16px 0' }}>Transaction History</h3>
              {transactions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px', color: '#94A3B8', fontSize: '14px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  No transaction records found for this citizen.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F8FAFC' }}>
                      {['Description', 'Type', 'Amount', 'Ref. ID', 'Status', 'Date'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', fontSize: '11.5px', fontWeight: 700, color: '#94A3B8', textAlign: 'left', borderBottom: '1px solid #E2E8F0', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(txn => {
                      const isCredit = txn.type?.toLowerCase() === 'credit';
                      return (
                        <tr key={txn._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '14px', fontSize: '13.5px', fontWeight: 700, color: '#0F172A' }}>
                            {txn.description}
                          </td>
                          <td style={{ padding: '14px', fontSize: '13px', fontWeight: 700, color: isCredit ? '#15803D' : '#DC2626' }}>
                            {txn.type?.toUpperCase()}
                          </td>
                          <td style={{ padding: '14px', fontSize: '13.5px', fontWeight: 700, color: '#0F172A' }}>
                            ₹{(txn.amount / 100).toFixed(2)}
                          </td>
                          <td style={{ padding: '14px', fontSize: '12px', color: '#64748B', fontFamily: 'monospace' }}>
                            {txn.razorpayPaymentId || '—'}
                          </td>
                          <td style={{ padding: '14px' }}>
                            <StatusBadge status={txn.status} />
                          </td>
                          <td style={{ padding: '14px', fontSize: '13px', color: '#64748B' }}>
                            {formatDate(txn.createdAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ── ACTIVITY LOG TAB ───────────────────────────────────────────── */}
          {activeTab === 'activity_log' && (
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', margin: '0 0 16px 0' }}>Login Sessions</h3>
              {(!citizen.sessions || citizen.sessions.length === 0) ? (
                <div style={{ textAlign: 'center', padding: '48px', color: '#94A3B8', fontSize: '14px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  No sessions recorded.
                </div>
              ) : (
                citizen.sessions.map(session => (
                  <div key={session.id} style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', marginBottom: '10px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#2563EB', marginTop: '4px', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>{session.device}</div>
                      <div style={{ fontSize: '12.5px', color: '#64748B' }}>IP: {session.ip} · {session.location} · {timeAgo(session.lastActive)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── NOTES TAB ───────────────────────────────────────────────────── */}
          {activeTab === 'notes' && (
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', margin: '0 0 16px 0' }}>Operator Notes</h3>
              <textarea
                placeholder="Add a note about this citizen..."
                style={{
                  width: '100%', height: '120px', padding: '12px', boxSizing: 'border-box' as const,
                  border: '1.5px solid #E2E8F0', borderRadius: '10px', fontSize: '13.5px', color: '#0F172A',
                  resize: 'vertical' as const, outline: 'none',
                }}
              />
              <div style={{ marginTop: '12px', textAlign: 'right' }}>
                <button
                  onClick={() => showToast('Note saved')}
                  style={{ padding: '9px 20px', backgroundColor: '#2563EB', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
                >
                  Save Note
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Notification Modal ────────────────────────────────────────── */}
      {showNotifModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)', zIndex: 10000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1.5px solid #E2E8F0',
            width: '460px', padding: '28px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
            display: 'flex', flexDirection: 'column', gap: '20px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Send Notification</h3>
              <button
                onClick={() => setShowNotifModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#94A3B8', fontWeight: 700 }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSendNotification} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>Notification Title</label>
                <input
                  type="text"
                  placeholder="e.g. Action Required"
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: '8px',
                    border: '1.5px solid #E2E8F0', fontSize: '13.5px', color: '#0F172A',
                    outline: 'none', boxSizing: 'border-box',
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>Message Body</label>
                <textarea
                  placeholder="Type message detail here..."
                  value={notifBody}
                  onChange={(e) => setNotifBody(e.target.value)}
                  style={{
                    width: '100%', height: '100px', padding: '10px 12px', borderRadius: '8px',
                    border: '1.5px solid #E2E8F0', fontSize: '13.5px', color: '#0F172A',
                    outline: 'none', boxSizing: 'border-box', resize: 'none',
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>Category Type</label>
                <select
                  value={notifType}
                  onChange={(e) => setNotifType(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: '8px',
                    border: '1.5px solid #E2E8F0', fontSize: '13.5px', color: '#0F172A',
                    outline: 'none', boxSizing: 'border-box', backgroundColor: '#FFFFFF',
                  }}
                >
                  <option value="system">System Status</option>
                  <option value="support">Help &amp; Support</option>
                  <option value="application_update">Application Update</option>
                  <option value="payment">Payments</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowNotifModal(false)}
                  style={{
                    padding: '10px 18px', border: '1.5px solid #E2E8F0', backgroundColor: '#FFFFFF',
                    borderRadius: '8px', fontSize: '13px', fontWeight: 700, color: '#475569', cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingNotif}
                  style={{
                    padding: '10px 22px', border: 'none', backgroundColor: '#2563EB',
                    borderRadius: '8px', fontSize: '13px', fontWeight: 700, color: '#FFFFFF',
                    cursor: sendingNotif ? 'not-allowed' : 'pointer', opacity: sendingNotif ? 0.7 : 1,
                  }}
                >
                  {sendingNotif ? 'Sending...' : 'Send'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
