import React, { useState, useEffect } from 'react';
import { adminClient } from '../api/client';

interface SubService {
  name: string;
  code: string;
  status: 'Active' | 'Inactive';
}

interface FormField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date' | 'aadhaar' | 'email' | 'phone' | 'file' | 'checkbox' | 'radio';
  placeholder: string;
  required: boolean;
  options?: string[];
  validationRule?: string;
}

interface RequiredDocument {
  name: string;
  acceptedFormats: string[];
  maxSizeMb: number;
  mandatory: boolean;
}

interface AdditionalCharge {
  name: string;
  amount: number;
  condition: string;
}

interface ServiceConfigWizardProps {
  onClose: () => void;
  onSave: () => void;
  initialCategory?: string;
  initialDepartment?: string;
}

export default function ServiceConfigWizard({ onClose, onSave, initialCategory, initialDepartment }: ServiceConfigWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Main Service State
  const [serviceName, setServiceName] = useState('');
  const [serviceCategory, setServiceCategory] = useState(
    initialCategory === 'aadhaar' ? 'Aadhaar Services' :
    initialCategory === 'pan' ? 'PAN Card Services' :
    initialCategory === 'certificate' ? 'Certificates' : 'Government Schemes'
  );
  const [serviceCode, setServiceCode] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [description, setDescription] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Step 2: Sub-Services State
  const [subServices, setSubServices] = useState<SubService[]>([]);
  const [showSubServiceModal, setShowSubServiceModal] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [newSubCode, setNewSubCode] = useState('');
  const [newSubStatus, setNewSubStatus] = useState<'Active' | 'Inactive'>('Active');
  const [editingSubIndex, setEditingSubIndex] = useState<number | null>(null);

  // Step 3: Overview State
  const [displayName, setDisplayName] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [detailedDesc, setDetailedDesc] = useState('');
  const [serviceType, setServiceType] = useState('Online Only');
  const [tat, setTat] = useState('3-5 business days');
  const [departmentArea, setDepartmentArea] = useState(initialDepartment || '');
  const [teamPermissions, setTeamPermissions] = useState<string[]>([]);
  const [newPermission, setNewPermission] = useState('');
  const [searchTags, setSearchTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  // Step 4: Form Builder State
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [selectedFieldIndex, setSelectedFieldIndex] = useState<number>(-1);

  // Step 5: Required Documents State
  const [requiredDocs, setRequiredDocs] = useState<RequiredDocument[]>([]);
  const [showDocModal, setShowDocModal] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [newDocFormats, setNewDocFormats] = useState<string[]>(['PDF']);
  const [newDocSize, setNewDocSize] = useState(5);
  const [newDocMandatory, setNewDocMandatory] = useState(true);
  const [editingDocIndex, setEditingDocIndex] = useState<number | null>(null);

  // Step 6: Pricing State
  const [serviceFee, setServiceFee] = useState(150);
  const [applyGst, setApplyGst] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState<string[]>(['Online Payment', 'UPI']);
  const [refundPolicy, setRefundPolicy] = useState('Non-refundable after processing starts');
  const [additionalCharges, setAdditionalCharges] = useState<AdditionalCharge[]>([]);
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [newChargeName, setNewChargeName] = useState('');
  const [newChargeAmount, setNewChargeAmount] = useState(50);
  const [newChargeCondition, setNewChargeCondition] = useState('');
  const [editingChargeIndex, setEditingChargeIndex] = useState<number | null>(null);

  // Step 7: Publish State (Pre-Publish Checklist resolved dynamically)
  const [portalVisibility, setPortalVisibility] = useState('All Citizens (Public Access)');
  const [effectiveDate, setEffectiveDate] = useState('Immediately upon publishing');
  const [notifyUsers, setNotifyUsers] = useState(true);
  const [targetEnvironment, setTargetEnvironment] = useState('Production (Live Portal)');

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingIcon(true);
    try {
      const urlRes = await adminClient.post('/documents/upload-url', {
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
        documentCategory: 'photo'
      });
      
      if (!urlRes.data?.success) {
        throw new Error(urlRes.data?.error || 'Failed to get upload URL');
      }
      
      const { uploadUrl, token, storageKey } = urlRes.data.data;
      
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type || 'application/octet-stream'
        }
      });
      
      if (!uploadRes.ok) {
        throw new Error('Supabase Storage upload failed');
      }
      
      const confirmRes = await adminClient.post('/documents/confirm', { storageKey });
      if (!confirmRes.data?.success) {
        throw new Error(confirmRes.data?.error || 'Failed to confirm document upload');
      }
      
      const documentId = confirmRes.data.data.document.id;
      
      const downloadRes = await adminClient.get(`/documents/${documentId}/download-url`);
      if (!downloadRes.data?.success) {
        throw new Error(downloadRes.data?.error || 'Failed to retrieve download URL');
      }
      
      const downloadUrl = downloadRes.data.data.downloadUrl;
      setIconUrl(downloadUrl);
    } catch (err: any) {
      alert('Error uploading icon: ' + err.message);
    } finally {
      setIsUploadingIcon(false);
    }
  };

  // Auto-generate service code when service name changes
  useEffect(() => {
    if (serviceName && serviceName !== 'Address Update') {
      const code = 'CS-' + serviceName.toUpperCase().replace(/\s+/g, '-').substring(0, 8) + '-' + Math.floor(100 + Math.random() * 900);
      setServiceCode(code);
    }
  }, [serviceName]);

  // Auto-generate sub-service code when sub-service name changes (only for new items)
  useEffect(() => {
    if (newSubName && editingSubIndex === null) {
      const formatted = newSubName
        .toUpperCase()
        .replace(/[^A-Z0-9\s]/g, '')
        .trim()
        .split(/\s+/)
        .map(w => w.substring(0, 4))
        .join('-');
      setNewSubCode(`CS-${formatted}`);
    }
  }, [newSubName, editingSubIndex]);

  const handleNext = () => {
    setCurrentStep(prev => {
      if (initialCategory && prev === 1) return 3; // Skip Step 2 in sub-service mode
      return prev < 7 ? prev + 1 : prev;
    });
  };

  const handleBack = () => {
    setCurrentStep(prev => {
      if (initialCategory && prev === 3) return 1; // Skip Step 2 in sub-service mode
      return prev > 1 ? prev - 1 : prev;
    });
  };

  // Add/Edit Sub Service
  const saveSubService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName || !newSubCode) return;
    if (editingSubIndex !== null) {
      const updated = [...subServices];
      updated[editingSubIndex] = { name: newSubName, code: newSubCode, status: newSubStatus };
      setSubServices(updated);
    } else {
      setSubServices([...subServices, { name: newSubName, code: newSubCode, status: newSubStatus }]);
    }
    setNewSubName('');
    setNewSubCode('');
    setNewSubStatus('Active');
    setEditingSubIndex(null);
    setShowSubServiceModal(false);
  };

  // Add/Edit Document Requirement
  const saveDocRequirement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName) return;
    if (editingDocIndex !== null) {
      const updated = [...requiredDocs];
      updated[editingDocIndex] = { name: newDocName, acceptedFormats: newDocFormats, maxSizeMb: newDocSize, mandatory: newDocMandatory };
      setRequiredDocs(updated);
    } else {
      setRequiredDocs([...requiredDocs, { name: newDocName, acceptedFormats: newDocFormats, maxSizeMb: newDocSize, mandatory: newDocMandatory }]);
    }
    setNewDocName('');
    setNewDocFormats(['PDF']);
    setNewDocSize(5);
    setNewDocMandatory(true);
    setEditingDocIndex(null);
    setShowDocModal(false);
  };

  // Add/Edit Additional Charge
  const saveAdditionalCharge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChargeName || newChargeAmount <= 0) return;
    if (editingChargeIndex !== null) {
      const updated = [...additionalCharges];
      updated[editingChargeIndex] = { name: newChargeName, amount: newChargeAmount, condition: newChargeCondition };
      setAdditionalCharges(updated);
    } else {
      setAdditionalCharges([...additionalCharges, { name: newChargeName, amount: newChargeAmount, condition: newChargeCondition }]);
    }
    setNewChargeName('');
    setNewChargeAmount(50);
    setNewChargeCondition('');
    setEditingChargeIndex(null);
    setShowChargeModal(false);
  };

  // Form Builder clicks to add elements
  const addFormFieldElement = (type: FormField['type']) => {
    const defaultLabels: Record<FormField['type'], string> = {
      text: 'Custom Text Field',
      number: 'Custom Number Field',
      select: 'Custom Dropdown Field',
      date: 'Custom Date Field',
      aadhaar: 'Aadhaar Card Field',
      email: 'Custom Email Field',
      phone: 'Custom Phone Field',
      file: 'Custom File Field',
      checkbox: 'Custom Checkbox Field',
      radio: 'Custom Radio Field'
    };
    const key = 'custom_' + Date.now();
    const newField: FormField = {
      key,
      label: defaultLabels[type],
      type,
      placeholder: 'Enter value',
      required: true
    };
    if (type === 'select') {
      newField.options = ['Option 1', 'Option 2'];
    }
    setFormFields([...formFields, newField]);
    setSelectedFieldIndex(formFields.length);
  };

  // Move form elements up/down
  const moveField = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === formFields.length - 1) return;
    
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const updated = [...formFields];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    
    setFormFields(updated);
    setSelectedFieldIndex(targetIdx);
  };

  // Delete form element
  const deleteField = (index: number) => {
    const updated = formFields.filter((_, i) => i !== index);
    setFormFields(updated);
    setSelectedFieldIndex(updated.length > 0 ? Math.max(0, index - 1) : -1);
  };

  const handlePublish = async () => {
    setIsSubmitting(true);
    try {
      // Map category
      let cat = 'gov_scheme';
      const catLower = serviceCategory.toLowerCase();
      if (catLower.includes('aadhaar')) {
        cat = 'aadhaar';
      } else if (catLower.includes('pan')) {
        cat = 'pan';
      } else if (catLower.includes('certificate')) {
        cat = 'certificate';
      } else if (catLower.includes('scheme') || catLower.includes('gov')) {
        cat = 'gov_scheme';
      }

      // Convert pricing convenience fee
      const computedGovtFee = serviceFee * 100;
      const computedConvenienceFee = applyGst ? Math.round(serviceFee * 0.18 * 100) : 0;

      // Map required docs
      const mappedDocs = requiredDocs.map(d => ({
        name: d.name,
        mandatory: d.mandatory,
        acceptedFormats: d.acceptedFormats.map(f => f.toLowerCase()),
        maxSizeMb: d.maxSizeMb
      }));

      // Map form fields
      const mappedFields = formFields.map(f => ({
        key: f.key,
        label: f.label,
        type: f.type,
        placeholder: f.placeholder,
        required: f.required,
        options: f.options
      }));

      // Map sub-services
      const mappedSubServices = subServices.map(s => ({
        name: s.name,
        code: s.code,
        isActive: s.status === 'Active'
      }));

      await adminClient.post('/services', {
        name: serviceName,
        description: description || shortDesc,
        category: cat,
        department: departmentArea || 'Operations',
        govtFee: computedGovtFee,
        convenienceFee: computedConvenienceFee,
        slaHours: 24,
        isActive: isActive,
        eligibility: ['Indian Citizen'],
        requiredDocuments: mappedDocs,
        formFields: mappedFields,
        subServices: mappedSubServices,
        iconUrl: iconUrl,
        displayName: displayName,
        detailedDescription: detailedDesc,
        serviceType: serviceType,
        tat: tat,
        teamPermissions: teamPermissions,
        searchTags: searchTags,
        paymentMethods: paymentMethods,
        refundPolicy: refundPolicy,
        additionalCharges: additionalCharges
      });

      onSave();
    } catch (err: any) {
      const details = err.response?.data?.details
        ? '\n' + err.response.data.details.map((d: any) => `- ${d.field}: ${d.message}`).join('\n')
        : '';
      alert('Error publishing service: ' + (err.response?.data?.error || err.message) + details);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculations
  const totalCitizenPrice = applyGst ? Math.round(serviceFee * 1.18) : serviceFee;

  const steps = initialCategory ? [
    { step: 1, label: 'Sub Service' },
    { step: 3, label: 'Overview' },
    { step: 4, label: 'Form Builder' },
    { step: 5, label: 'Documents' },
    { step: 6, label: 'Pricing' },
    { step: 7, label: 'Publish' }
  ] : [
    { step: 1, label: 'Main Service' },
    { step: 2, label: 'Sub Service' },
    { step: 3, label: 'Overview' },
    { step: 4, label: 'Form Builder' },
    { step: 5, label: 'Documents' },
    { step: 6, label: 'Pricing' },
    { step: 7, label: 'Publish' }
  ];

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return initialCategory ? 'Sub-Service Configuration' : 'Main Service Configuration';
      case 2: return 'Sub-Service Association';
      case 3: return 'Service Overview & Information';
      case 4: return 'Interface Form Builder';
      case 5: return 'Required Documents Configuration';
      case 6: return 'Service Pricing Configuration';
      case 7: return 'Publish Service';
      default: return 'Service Configuration';
    }
  };

  const getStepSubtitle = () => {
    switch (currentStep) {
      case 1: return initialCategory ? 'Define general attributes for this sub-service flow.' : 'Select or create the foundational parent category for this service.';
      case 2: return 'Group granular update flows and procedures under the master parent service.';
      case 3: return 'Document external public descriptors and metrics for end-users.';
      case 4: return 'Formulate and sequence data capture inputs required from applicants.';
      case 5: return 'Identify physical file attachments applicants must upload.';
      case 6: return 'Configure base fee, regional taxes, and additional processing charges for the service.';
      case 7: return 'Validate final system checks, set release parameters, and push the service to citizen portal.';
      default: return 'Configure and set details.';
    }
  };

  const getStepInstruction = () => {
    const totalSteps = initialCategory ? 6 : 7;
    const currentDisplayStep = initialCategory 
      ? (currentStep === 1 ? 1 : currentStep - 1)
      : currentStep;
    switch (currentStep) {
      case 1: return `Step 1 of ${totalSteps}: Establish sub-service container attributes.`;
      case 2: return `Step 2 of ${totalSteps}: Bind child actions to parent container.`;
      case 3: return `Step ${currentDisplayStep} of ${totalSteps}: Establish core service details and tagging.`;
      case 4: return `Step ${currentDisplayStep} of ${totalSteps}: Establish input form design variables.`;
      case 5: return `Step ${currentDisplayStep} of ${totalSteps}: Establish applicant document file checklist.`;
      case 6: return `Step ${currentDisplayStep} of ${totalSteps}: Configure base fee and taxes.`;
      case 7: return `Step ${totalSteps} of ${totalSteps}: Push live to citizen portal.`;
      default: return '';
    }
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
      padding: '32px', gap: '28px', width: '100%', boxSizing: 'border-box',
      fontFamily: "'Plus Jakarta Sans', sans-serif", backgroundColor: '#F9FAFB', minHeight: '100vh'
    }}>
      {/* Header bar actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        {/* Breadcrumbs */}
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '0px', gap: '8px', height: '16px' }}>
          <span style={{ fontFamily: 'inherit', fontWeight: 400, fontSize: '13px', color: '#6B7280', cursor: 'pointer' }} onClick={onClose}>Dashboard</span>
          <span style={{ color: '#6B7280', fontSize: '12px' }}>➔</span>
          <span style={{ fontFamily: 'inherit', fontWeight: 400, fontSize: '13px', color: '#6B7280', cursor: 'pointer' }} onClick={onClose}>Services</span>
          <span style={{ color: '#6B7280', fontSize: '12px' }}>➔</span>
          <span style={{ fontFamily: 'inherit', fontWeight: 400, fontSize: '13px', color: '#6B7280' }}>Create New Service</span>
          <span style={{ color: '#6B7280', fontSize: '12px' }}>➔</span>
          <span style={{ fontFamily: 'inherit', fontWeight: 500, fontSize: '13px', color: '#111827' }}>{steps.find(s => s.step === currentStep)?.label}</span>
        </div>
        <button onClick={onClose} style={{
          border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF', padding: '8px 16px',
          borderRadius: '8px', fontSize: '13px', fontWeight: 700, color: '#475569', cursor: 'pointer',
          fontFamily: 'inherit'
        }}>
          Cancel
        </button>
      </div>

      {/* Page Header text */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '0px', gap: '4px' }}>
        <h1 style={{ fontFamily: 'inherit', fontWeight: 700, fontSize: '28px', lineHeight: '34px', color: '#111827', margin: 0 }}>
          {getStepTitle()}
        </h1>
        <p style={{ fontFamily: 'inherit', fontWeight: 400, fontSize: '14px', lineHeight: '17px', color: '#6B7280', margin: 0 }}>
          {getStepSubtitle()}
        </p>
      </div>

      {/* Stepper bar */}
      <div style={{
        boxSizing: 'border-box', display: 'flex', flexDirection: 'row',
        alignItems: 'center', padding: '12px', gap: '10px', width: '100%',
        height: '42px', backgroundColor: '#FFFFFF',
        border: '1px solid #E5E7EB', borderRadius: '8px'
      }}>
        {steps.map((item, index) => {
          const stepNum = item.step;
          const isActiveStep = currentStep === stepNum;
          const isCompletedStep = currentStep > stepNum;
          const labelNum = index + 1;
          return (
            <div key={stepNum} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '6px', flex: 1 }}>
              {/* Step Circle indicator */}
              <div style={{
                display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
                width: '18px', height: '18px', borderRadius: '9px',
                backgroundColor: isCompletedStep ? '#10B981' : (isActiveStep ? '#2563EB' : '#E5E7EB')
              }}>
                <span style={{
                  fontFamily: 'inherit', fontWeight: 600, fontSize: '11px', lineHeight: '13px',
                  color: (isActiveStep || isCompletedStep) ? '#FFFFFF' : '#6B7280'
                }}>
                  {isCompletedStep ? '✓' : labelNum}
                </span>
              </div>
              {/* Step Label */}
              <span style={{
                fontFamily: 'inherit', fontWeight: (isActiveStep || isCompletedStep) ? 600 : 500,
                fontSize: '12px', lineHeight: '15px',
                color: (isActiveStep || isCompletedStep) ? '#2563EB' : '#6B7280',
                whiteSpace: 'nowrap'
              }}>
                {item.label}
              </span>
              {index < steps.length - 1 && <div style={{ height: '1px', border: '1px solid #E5E7EB', flex: 1, margin: '0 4px' }} />}
            </div>
          );
        })}
      </div>

      {/* Config Card Frame */}
      <div style={{
        boxSizing: 'border-box', display: 'flex', flexDirection: 'column',
        alignItems: 'flex-start', padding: '24px', gap: '20px', width: '100%',
        backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB',
        borderRadius: '12px'
      }}>
        <span style={{ fontFamily: 'inherit', fontWeight: 600, fontSize: '16px', lineHeight: '19px', color: '#111827' }}>
          {initialCategory ? 'Sub-Service General Information' : 'Main Service General Information'}
        </span>
        <div style={{ width: '100%', height: '1px', backgroundColor: '#E5E7EB' }} />

        {/* Step specific bodies rendered inside card */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '0px', gap: '20px', width: '100%' }}>

          {/* STEP 1 BODY */}
          {currentStep === 1 && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontFamily: 'inherit', fontWeight: 600, fontSize: '13px', color: '#374151' }}>Service Name</span>
                  <span style={{ color: '#991B1B', fontWeight: 600 }}>*</span>
                </div>
                <input type="text" value={serviceName} onChange={e => setServiceName(e.target.value)} required style={{
                  boxSizing: 'border-box', padding: '12px 16px', width: '100%', height: '41px',
                  backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px',
                  fontFamily: 'inherit', fontSize: '14px', color: '#111827', outline: 'none'
                }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontFamily: 'inherit', fontWeight: 600, fontSize: '13px', color: '#374151' }}>Service Category</span>
                  <span style={{ color: '#991B1B', fontWeight: 600 }}>*</span>
                </div>
                <select value={serviceCategory} onChange={e => setServiceCategory(e.target.value)} style={{
                  boxSizing: 'border-box', padding: '10px 16px', width: '100%', height: '41px',
                  backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px',
                  fontFamily: 'inherit', fontSize: '14px', color: '#111827', outline: 'none'
                }}>
                  <option>Aadhaar Services</option>
                  <option>PAN Card Services</option>
                  <option>Certificates</option>
                  <option>Government Schemes</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                <span style={{ fontFamily: 'inherit', fontWeight: 600, fontSize: '13px', color: '#374151' }}>Service Code (Auto-Generated)</span>
                <input type="text" value={serviceCode} readOnly style={{
                  boxSizing: 'border-box', padding: '12px 16px', width: '100%', height: '41px',
                  backgroundColor: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '8px',
                  fontFamily: 'inherit', fontSize: '14px', color: '#6B7280', outline: 'none'
                }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                <span style={{ fontFamily: 'inherit', fontWeight: 600, fontSize: '13px', color: '#374151' }}>Status</span>
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px', height: '20px' }}>
                  <div onClick={() => setIsActive(!isActive)} style={{
                    display: 'flex', flexDirection: 'row', justifyContent: isActive ? 'flex-end' : 'flex-start',
                    alignItems: 'center', padding: '2px', width: '40px', height: '20px',
                    backgroundColor: isActive ? '#10B981' : '#D1D5DB', borderRadius: '10px', cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#FFFFFF' }} />
                  </div>
                  <span style={{ fontFamily: 'inherit', fontWeight: 500, fontSize: '14px', color: '#111827' }}>Active</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                <span style={{ fontFamily: 'inherit', fontWeight: 600, fontSize: '13px', color: '#374151' }}>Description</span>
                <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} style={{
                  boxSizing: 'border-box', padding: '12px 16px', width: '100%', height: '80px',
                  backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px',
                  fontFamily: 'inherit', fontSize: '14px', color: '#111827', outline: 'none', resize: 'none'
                }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                <span style={{ fontFamily: 'inherit', fontWeight: 600, fontSize: '13px', color: '#374151' }}>Icon Upload</span>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleIconUpload}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    boxSizing: 'border-box', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', padding: '24px 0px', gap: '8px', width: '100%',
                    height: '140px', backgroundColor: '#F9FAFB', border: '1px dashed #E5E7EB',
                    borderRadius: '8px', cursor: 'pointer'
                  }}
                >
                  {isUploadingIcon ? (
                    <span style={{ fontSize: '14px', color: '#6B7280' }}>Uploading icon...</span>
                  ) : iconUrl ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <img src={iconUrl} alt="Uploaded Icon" style={{ width: '48px', height: '48px', objectFit: 'contain', borderRadius: '8px' }} />
                      <span style={{ fontSize: '12px', color: '#10B981', fontWeight: 600 }}>✓ Uploaded successfully (Click to change)</span>
                    </div>
                  ) : (
                    <>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                      <span style={{ fontFamily: 'inherit', fontWeight: 600, fontSize: '14px', color: '#2563EB' }}>Click to upload icon file</span>
                      <span style={{ fontFamily: 'inherit', fontWeight: 400, fontSize: '12px', color: '#6B7280' }}>PNG, JPG up to 1MB (Optimal size 48x48px)</span>
                    </>
                  )}
                </div>
              </div>
            </>
          )}

          {/* STEP 2 BODY: Sub-services */}
          {currentStep === 2 && (
            <div style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#374151' }}>Configured Sub-Services</span>
                <button onClick={() => { setEditingSubIndex(null); setNewSubName(''); setNewSubCode(''); setNewSubStatus('Active'); setShowSubServiceModal(true); }} style={{
                  padding: '8px 14px', border: 'none', backgroundColor: '#2563EB', color: '#FFFFFF',
                  borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit'
                }}>
                  + Add Sub Service
                </button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }}>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase' }}>Sub Service Name</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase' }}>Code</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', width: '100px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subServices.map((sub, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #E5E7EB' }}>
                      <td style={{ padding: '12px 16px', fontSize: '13.5px', fontWeight: 700, color: '#111827' }}>{sub.name}</td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#475569', fontFamily: 'monospace' }}>{sub.code}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 700,
                          backgroundColor: sub.status === 'Active' ? '#EFF6FF' : '#F3F4F6',
                          color: sub.status === 'Active' ? '#2563EB' : '#4B5563'
                        }}>
                          {sub.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                          <button 
                            onClick={() => { setEditingSubIndex(idx); setNewSubName(sub.name); setNewSubCode(sub.code); setNewSubStatus(sub.status); setShowSubServiceModal(true); }} 
                            title="Edit"
                            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          <button 
                            onClick={() => setSubServices(subServices.filter((_, i) => i !== idx))} 
                            title="Delete"
                            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* STEP 3 BODY: Overview */}
          {currentStep === 3 && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', width: '100%' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Display Name *</label>
                  <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} required style={{ padding: '10px 14px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', outline: 'none', backgroundColor: '#F9FAFB', fontFamily: 'inherit' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Short Description *</label>
                  <input type="text" value={shortDesc} onChange={e => setShortDesc(e.target.value)} required style={{ padding: '10px 14px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', outline: 'none', backgroundColor: '#F9FAFB', fontFamily: 'inherit' }} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Detailed Description (Rich Text Area)</label>
                <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden', width: '100%' }}>
                  <div style={{ display: 'flex', gap: '10px', padding: '8px 12px', borderBottom: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }}>
                    <button type="button" style={{ fontWeight: 800, border: 'none', background: 'none', cursor: 'pointer', padding: '4px' }}>B</button>
                    <button type="button" style={{ fontStyle: 'italic', border: 'none', background: 'none', cursor: 'pointer', padding: '4px' }}>I</button>
                    <button type="button" style={{ textDecoration: 'underline', border: 'none', background: 'none', cursor: 'pointer', padding: '4px' }}>U</button>
                  </div>
                  <textarea rows={3} value={detailedDesc} onChange={e => setDetailedDesc(e.target.value)} style={{ padding: '10px 14px', border: 'none', width: '100%', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', width: '100%' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Service Type *</label>
                  <select value={serviceType} onChange={e => setServiceType(e.target.value)} style={{ padding: '10px 14px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', outline: 'none', backgroundColor: '#F9FAFB', fontFamily: 'inherit' }}>
                    <option>Online Only</option>
                    <option>Walk-in Only</option>
                    <option>Hybrid</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Estimated Turnaround Time (TAT) *</label>
                  <input type="text" value={tat} onChange={e => setTat(e.target.value)} required style={{ padding: '10px 14px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', outline: 'none', backgroundColor: '#F9FAFB', fontFamily: 'inherit' }} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Department Area</label>
                <select value={departmentArea} onChange={e => setDepartmentArea(e.target.value)} style={{ padding: '10px 14px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', outline: 'none', backgroundColor: '#F9FAFB', fontFamily: 'inherit' }}>
                  <option>Ministry of Internal Coordinates</option>
                  <option>State Revenue Department</option>
                  <option>Ministry of Finance</option>
                  <option>Central Registry Office</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Assigned Team Permissions</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '10px 14px', border: '1px solid #E5E7EB', borderRadius: '8px', backgroundColor: '#F9FAFB', width: '100%', boxSizing: 'border-box' }}>
                  {teamPermissions.map((perm, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#EFF6FF', color: '#2563EB', padding: '4px 10px', borderRadius: '100px', fontSize: '12.5px', fontWeight: 600 }}>
                      <span>{perm}</span>
                      <span onClick={() => setTeamPermissions(teamPermissions.filter((_, i) => i !== idx))} style={{ cursor: 'pointer', fontWeight: 800, color: '#3B82F6' }}>×</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input 
                      type="text" 
                      placeholder="Add..." 
                      value={newPermission} 
                      onChange={e => setNewPermission(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && newPermission.trim()) {
                          e.preventDefault();
                          setTeamPermissions([...teamPermissions, newPermission.trim()]);
                          setNewPermission('');
                        }
                      }}
                      style={{ border: 'none', background: 'none', outline: 'none', fontSize: '12.5px', width: '80px', color: '#374151' }} 
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Search Optimization Tags</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '10px 14px', border: '1px solid #E5E7EB', borderRadius: '8px', backgroundColor: '#F9FAFB', width: '100%', boxSizing: 'border-box' }}>
                  {searchTags.map((tag, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#F3F4F6', color: '#4B5563', padding: '4px 10px', borderRadius: '100px', fontSize: '12.5px', fontWeight: 500 }}>
                      <span>{tag}</span>
                      <span onClick={() => setSearchTags(searchTags.filter((_, i) => i !== idx))} style={{ cursor: 'pointer', fontWeight: 800, color: '#9CA3AF' }}>×</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input 
                      type="text" 
                      placeholder="Add..." 
                      value={newTag} 
                      onChange={e => setNewTag(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && newTag.trim()) {
                          e.preventDefault();
                          setSearchTags([...searchTags, newTag.trim()]);
                          setNewTag('');
                        }
                      }}
                      style={{ border: 'none', background: 'none', outline: 'none', fontSize: '12.5px', width: '80px', color: '#374151' }} 
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* STEP 4 BODY: Form Builder */}
          {currentStep === 4 && (
            <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 280px', gap: '20px', width: '100%', minHeight: '480px' }}>
              {/* Left Column: Available Elements */}
              <div style={{
                boxSizing: 'border-box', border: '1px solid #E5E7EB', borderRadius: '12px',
                padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px',
                backgroundColor: '#FFFFFF'
              }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>Available Elements</span>
                {[
                  { type: 'text', label: 'Text Input' },
                  { type: 'number', label: 'Number Input' },
                  { type: 'email', label: 'Email Address' },
                  { type: 'phone', label: 'Phone Field' },
                  { type: 'date', label: 'Date Picker' },
                  { type: 'select', label: 'Dropdown Select' },
                  { type: 'file', label: 'File Upload' },
                  { type: 'checkbox', label: 'Checkbox Option' },
                  { type: 'radio', label: 'Radio Control' }
                ].map((el) => (
                  <button 
                    key={el.type} 
                    type="button" 
                    onClick={() => addFormFieldElement(el.type as any)} 
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
                      border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '13.5px',
                      fontWeight: 600, color: '#374151', backgroundColor: '#FFFFFF',
                      cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseOver={e => e.currentTarget.style.borderColor = '#2563EB'}
                    onMouseOut={e => e.currentTarget.style.borderColor = '#E5E7EB'}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" style={{ transform: 'rotate(90deg)' }}><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
                    <span>{el.label}</span>
                  </button>
                ))}
              </div>

              {/* Middle: Form Workspace Sandbox */}
              <div style={{
                boxSizing: 'border-box', border: '1px solid #E5E7EB', borderRadius: '12px',
                padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px',
                backgroundColor: '#FFFFFF', overflowY: 'auto'
              }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>Form Workspace Sandbox</span>
                {formFields.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '10px', minHeight: '300px' }}>
                    <span style={{ fontSize: '13px', color: '#94A3B8' }}>Your workspace is empty. Click an element on the left to add it here.</span>
                  </div>
                ) : (
                  formFields.map((field, idx) => {
                    const isSelected = selectedFieldIndex === idx;
                    const displayType = field.type === 'text' ? 'Text Input' :
                                        field.type === 'number' ? 'Number Input' :
                                        field.type === 'email' ? 'Email Address' :
                                        field.type === 'phone' ? 'Phone Field' :
                                        field.type === 'date' ? 'Date Picker' :
                                        field.type === 'select' ? 'Dropdown Select' :
                                        field.type === 'file' ? 'File Upload' :
                                        field.type === 'checkbox' ? 'Checkbox Option' : 'Radio Control';
                    return (
                      <div 
                        key={field.key} 
                        onClick={() => setSelectedFieldIndex(idx)} 
                        style={{
                          boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '14px 18px', border: isSelected ? '1.5px solid #2563EB' : '1px solid #E5E7EB',
                          borderRadius: '8px', backgroundColor: '#FFFFFF', cursor: 'pointer',
                          boxShadow: isSelected ? '0px 4px 10px rgba(37, 99, 235, 0.05)' : 'none',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          {/* Drag handle icon */}
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5"><circle cx="9" cy="5" r="1.2"/><circle cx="9" cy="12" r="1.2"/><circle cx="9" cy="19" r="1.2"/><circle cx="15" cy="5" r="1.2"/><circle cx="15" cy="12" r="1.2"/><circle cx="15" cy="19" r="1.2"/></svg>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>
                              {field.label} {field.required && <span style={{ color: '#DC2626' }}>*</span>}
                            </span>
                            <span style={{ fontSize: '12px', color: '#6B7280' }}>{displayType}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                          <button 
                            type="button"
                            onClick={() => setSelectedFieldIndex(idx)} 
                            title="Edit Properties"
                            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          <button 
                            type="button"
                            onClick={() => deleteField(idx)} 
                            title="Delete"
                            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Right: Properties Panel */}
              <div style={{
                boxSizing: 'border-box', border: '1px solid #E5E7EB', borderRadius: '12px',
                padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px',
                backgroundColor: '#FFFFFF'
              }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#111827', marginBottom: '4px' }}>Properties Panel</span>
                {selectedFieldIndex !== -1 && formFields[selectedFieldIndex] ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>Field Display Label</label>
                      <input 
                        type="text" 
                        value={formFields[selectedFieldIndex].label} 
                        onChange={e => {
                          const updated = [...formFields];
                          updated[selectedFieldIndex].label = e.target.value;
                          setFormFields(updated);
                        }} 
                        style={{ boxSizing: 'border-box', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '13.5px', fontFamily: 'inherit', outline: 'none', backgroundColor: '#F9FAFB' }} 
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>Helper / Placeholder</label>
                      <input 
                        type="text" 
                        value={formFields[selectedFieldIndex].placeholder} 
                        onChange={e => {
                          const updated = [...formFields];
                          updated[selectedFieldIndex].placeholder = e.target.value;
                          setFormFields(updated);
                        }} 
                        style={{ boxSizing: 'border-box', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '13.5px', fontFamily: 'inherit', outline: 'none', backgroundColor: '#F9FAFB' }} 
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>Validation Controls</span>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: '#374151', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={formFields[selectedFieldIndex].required} 
                          onChange={e => {
                            const updated = [...formFields];
                            updated[selectedFieldIndex].required = e.target.checked;
                            setFormFields(updated);
                          }} 
                          style={{ width: '16px', height: '16px' }}
                        /> 
                        Mandatory Required Field
                      </label>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <select 
                        value={formFields[selectedFieldIndex].validationRule || 'None'} 
                        onChange={e => {
                          const updated = [...formFields];
                          updated[selectedFieldIndex].validationRule = e.target.value;
                          setFormFields(updated);
                        }} 
                        style={{ boxSizing: 'border-box', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '13.5px', fontFamily: 'inherit', outline: 'none', backgroundColor: '#F9FAFB', cursor: 'pointer' }}
                      >
                        <option>None</option>
                        <option>Exact 6 Digit Number</option>
                        <option>Email Format</option>
                        <option>Phone Number Format</option>
                        <option>Aadhaar Format</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: '200px' }}>
                    <span style={{ fontSize: '13px', color: '#94A3B8', textAlign: 'center' }}>Select a field in the sandbox to customize its properties.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 5 BODY: Documents */}
          {currentStep === 5 && (
            <div style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#374151' }}>Document Requirements</span>
                <button onClick={() => { setEditingDocIndex(null); setNewDocName(''); setNewDocFormats(['PDF']); setNewDocSize(5); setNewDocMandatory(true); setShowDocModal(true); }} style={{
                  padding: '8px 14px', border: 'none', backgroundColor: '#2563EB', color: '#FFFFFF',
                  borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit'
                }}>
                  + Add Required Document
                </button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }}>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase' }}>Document Type</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase' }}>Allowed Formats</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase' }}>Max Size</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase' }}>Mandatory</th>
                    <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', width: '100px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requiredDocs.map((doc, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #E5E7EB' }}>
                      <td style={{ padding: '12px 16px', fontSize: '13.5px', fontWeight: 700, color: '#111827' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                          <span>{doc.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#475569' }}>{doc.acceptedFormats.join(', ')}</td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#475569' }}>{doc.maxSizeMb} MB</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700,
                          backgroundColor: doc.mandatory ? '#FEE2E2' : '#F3F4F6',
                          color: doc.mandatory ? '#EF4444' : '#475569'
                        }}>
                          {doc.mandatory ? 'Required' : 'Optional'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                          <button 
                            onClick={() => { setEditingDocIndex(idx); setNewDocName(doc.name); setNewDocFormats(doc.acceptedFormats); setNewDocSize(doc.maxSizeMb); setNewDocMandatory(doc.mandatory); setShowDocModal(true); }} 
                            title="Edit"
                            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          <button 
                            onClick={() => setRequiredDocs(requiredDocs.filter((_, i) => i !== idx))} 
                            title="Delete"
                            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* STEP 6 BODY: Pricing */}
          {currentStep === 6 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', width: '100%' }}>
              {/* Left Column: Base Pricing & Payment Settings */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Base Pricing Card */}
                <div style={{
                  boxSizing: 'border-box', border: '1px solid #E5E7EB', borderRadius: '12px',
                  padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px',
                  backgroundColor: '#FFFFFF'
                }}>
                  <span style={{ fontSize: '14.5px', fontWeight: 700, color: '#111827' }}>Base Pricing</span>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>Service Fee (₹)</label>
                    <input 
                      type="number" 
                      value={serviceFee} 
                      onChange={e => setServiceFee(parseFloat(e.target.value) || 0)} 
                      style={{ boxSizing: 'border-box', padding: '10px 14px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', backgroundColor: '#FFFFFF', fontFamily: 'inherit', outline: 'none' }} 
                    />
                  </div>

                  {/* Apply GST 18% switch toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#111827' }}>Apply Taxes (GST 18%)</span>
                      <span style={{ fontSize: '12px', color: '#6B7280' }}>Standard tax charge computed dynamically</span>
                    </div>
                    <div 
                      onClick={() => setApplyGst(!applyGst)} 
                      style={{
                        width: '46px', height: '24px', borderRadius: '100px',
                        backgroundColor: applyGst ? '#2563EB' : '#D1D5DB',
                        position: 'relative', cursor: 'pointer', transition: 'background-color 0.2s ease'
                      }}
                    >
                      <div style={{
                        width: '18px', height: '18px', borderRadius: '50%',
                        backgroundColor: '#FFFFFF', position: 'absolute', top: '3px',
                        left: applyGst ? '25px' : '3px', transition: 'left 0.2s ease',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
                      }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid #F3F4F6' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#374151' }}>Total Citizen Price</span>
                    <strong style={{ fontSize: '20px', color: '#2563EB' }}>₹{totalCitizenPrice}</strong>
                  </div>
                </div>

                {/* Payment Settings Card */}
                <div style={{
                  boxSizing: 'border-box', border: '1px solid #E5E7EB', borderRadius: '12px',
                  padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px',
                  backgroundColor: '#FFFFFF'
                }}>
                  <span style={{ fontSize: '14.5px', fontWeight: 700, color: '#111827' }}>Payment Settings</span>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>Accepted Payment Methods</span>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '4px' }}>
                      {['Online Payment', 'UPI', 'Demand Draft', 'Cash at Counter'].map(method => {
                        const isChecked = paymentMethods.includes(method);
                        return (
                          <label key={method} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: '#374151', cursor: 'pointer' }}>
                            <input 
                              type="checkbox" 
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setPaymentMethods(paymentMethods.filter(m => m !== method));
                                } else {
                                  setPaymentMethods([...paymentMethods, method]);
                                }
                              }}
                              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                            />
                            {method}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>Refund & Cancellation Policy</span>
                    <select 
                      value={refundPolicy} 
                      onChange={e => setRefundPolicy(e.target.value)} 
                      style={{ boxSizing: 'border-box', padding: '10px 14px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px', outline: 'none', backgroundColor: '#F9FAFB', fontFamily: 'inherit', cursor: 'pointer' }}
                    >
                      <option>Non-refundable after processing starts</option>
                      <option>100% refund before operator review</option>
                      <option>No refunds under any conditions</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Right Column: Additional Charges Table */}
              <div style={{
                boxSizing: 'border-box', border: '1px solid #E5E7EB', borderRadius: '12px',
                padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px',
                backgroundColor: '#FFFFFF', height: 'fit-content'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14.5px', fontWeight: 700, color: '#111827' }}>Additional Charges Table</span>
                  <button 
                    onClick={() => { setEditingChargeIndex(null); setNewChargeName(''); setNewChargeAmount(50); setNewChargeCondition(''); setShowChargeModal(true); }} 
                    style={{
                      padding: '6px 12px', border: 'none', backgroundColor: '#EFF6FF', color: '#2563EB',
                      borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit'
                    }}
                  >
                    + Add Charge
                  </button>
                </div>
                
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E5E7EB', backgroundColor: '#F9FAFB' }}>
                      <th style={{ padding: '10px 12px', fontSize: '11px', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase' }}>Name</th>
                      <th style={{ padding: '10px 12px', fontSize: '11px', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase' }}>Amount</th>
                      <th style={{ padding: '10px 12px', fontSize: '11px', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase' }}>Condition</th>
                      <th style={{ padding: '10px 12px', fontSize: '11px', fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', width: '80px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {additionalCharges.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ padding: '24px', fontSize: '12.5px', color: '#9CA3AF', textAlign: 'center' }}>No additional charges configured.</td>
                      </tr>
                    ) : (
                      additionalCharges.map((ch, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #E5E7EB' }}>
                          <td style={{ padding: '12px', fontSize: '13px', fontWeight: 600, color: '#111827' }}>{ch.name}</td>
                          <td style={{ padding: '12px', fontSize: '13.5px', fontWeight: 700, color: '#111827' }}>₹{ch.amount}</td>
                          <td style={{ padding: '12px', fontSize: '12px', color: '#6B7280' }}>{ch.condition}</td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', alignItems: 'center' }}>
                              <button 
                                onClick={() => { setEditingChargeIndex(idx); setNewChargeName(ch.name); setNewChargeAmount(ch.amount); setNewChargeCondition(ch.condition); setShowChargeModal(true); }} 
                                title="Edit"
                                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                              </button>
                              <button 
                                onClick={() => setAdditionalCharges(additionalCharges.filter((_, i) => i !== idx))} 
                                title="Delete"
                                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 7 BODY: Publish */}
          {currentStep === 7 && (
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', width: '100%' }}>
                {/* Left Card: Checklist */}
                <div style={{
                  boxSizing: 'border-box', border: '1px solid #E5E7EB', borderRadius: '12px',
                  padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px',
                  backgroundColor: '#FFFFFF'
                }}>
                  <span style={{ fontSize: '14.5px', fontWeight: 700, color: '#111827' }}>Pre-Publish Readiness Checklist</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      { label: 'Main Service definition registered', ok: !!serviceName },
                      { label: 'Sub Service configuration finalized', ok: subServices.length > 0 },
                      { label: 'Overview information complete', ok: !!displayName && !!shortDesc },
                      { label: `Citizen Form Schema validated (${formFields.length} inputs)`, ok: formFields.length > 0 },
                      { label: `Attachment requirements assigned (${requiredDocs.length} files)`, ok: requiredDocs.length > 0 },
                      { label: `Base pricing & tax configurations complete (₹${totalCitizenPrice})`, ok: serviceFee > 0 },
                      { label: 'Approval routing workflow compiled (5 nodes)', ok: true }
                    ].map((chk, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                        <span style={{ color: '#374151', fontWeight: 500 }}>{chk.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Card: Publishing Options */}
                <div style={{
                  boxSizing: 'border-box', border: '1px solid #E5E7EB', borderRadius: '12px',
                  padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px',
                  backgroundColor: '#FFFFFF'
                }}>
                  <span style={{ fontSize: '14.5px', fontWeight: 700, color: '#111827' }}>Publishing Options</span>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>Portal Visibility</label>
                    <select value={portalVisibility} onChange={e => setPortalVisibility(e.target.value)} style={{ boxSizing: 'border-box', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '13.5px', backgroundColor: '#FFFFFF', fontFamily: 'inherit', cursor: 'pointer', outline: 'none' }}>
                      <option>All Citizens (Public Access)</option>
                      <option>Internal Operators Only</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>Effective Date</label>
                    <div style={{ position: 'relative', width: '100%' }}>
                      <input 
                        type="text" 
                        value={effectiveDate} 
                        onChange={e => setEffectiveDate(e.target.value)} 
                        style={{ boxSizing: 'border-box', width: '100%', padding: '10px 12px', paddingRight: '40px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '13.5px', backgroundColor: '#FFFFFF', fontFamily: 'inherit', outline: 'none' }} 
                      />
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" style={{ position: 'absolute', right: '12px', top: '12px' }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '4px 0px' }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13.5px', color: '#374151', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={notifyUsers} 
                        onChange={e => setNotifyUsers(e.target.checked)} 
                        style={{ width: '16px', height: '16px', marginTop: '3px', cursor: 'pointer' }} 
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontWeight: 600, color: '#111827' }}>Notify Citizens & Staff</span>
                        <span style={{ fontSize: '11.5px', color: '#6B7280' }}>Dispatches automatic SMS/Email updates about the new service.</span>
                      </div>
                    </label>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid #F3F4F6', paddingTop: '14px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>Target Environment</span>
                    <div style={{ display: 'flex', gap: '20px', marginTop: '4px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', color: '#374151', cursor: 'pointer' }}>
                        <input 
                          type="radio" 
                          name="env"
                          checked={targetEnvironment === 'Production (Live Portal)'} 
                          onChange={() => setTargetEnvironment('Production (Live Portal)')} 
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }} 
                        />
                        Production (Live Portal)
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', color: '#374151', cursor: 'pointer' }}>
                        <input 
                          type="radio" 
                          name="env"
                          checked={targetEnvironment === 'Staging Sandbox'} 
                          onChange={() => setTargetEnvironment('Staging Sandbox')} 
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }} 
                        />
                        Staging Sandbox
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Warning Banner */}
              <div style={{
                boxSizing: 'border-box', display: 'flex', gap: '12px', padding: '16px',
                backgroundColor: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: '8px', width: '100%', marginTop: '24px'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.5" style={{ flexShrink: 0, marginTop: '2px' }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                <span style={{ fontSize: '13px', color: '#92400E', lineHeight: '18px' }}>
                  <strong>Warning:</strong> Publishing this service makes it visible and accessible to over 10M+ citizens instantly on the main portal. Ensure all SLA constraints and verification authorities are properly notified.
                </span>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Bottom Actions Row */}
      <div style={{
        display: 'flex', flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', padding: '0px', width: '100%', height: '41px'
      }}>
        {/* Step status label */}
        <span style={{ fontFamily: 'inherit', fontWeight: 400, fontSize: '14px', color: '#6B7280' }}>
          {getStepInstruction()}
        </span>

        {/* Save Buttons */}
        {currentStep === 7 ? (
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '16px' }}>
            <span 
              onClick={handleBack} 
              style={{ fontSize: '14px', color: '#2563EB', textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }}
            >
              Back to Preview
            </span>
            <button 
              type="button"
              style={{
                boxSizing: 'border-box', display: 'flex', flexDirection: 'row', alignItems: 'center',
                padding: '12px 20px', backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB',
                borderRadius: '8px', fontFamily: 'inherit', fontWeight: 600, fontSize: '14px',
                color: '#374151', cursor: 'pointer'
              }}
            >
              Schedule for Later
            </button>
            <button 
              onClick={handlePublish} 
              disabled={isSubmitting} 
              style={{
                display: 'flex', flexDirection: 'row', alignItems: 'center',
                padding: '12px 24px', gap: '8px', backgroundColor: '#2563EB',
                borderRadius: '8px', fontFamily: 'inherit', fontWeight: 600, fontSize: '14px',
                color: '#FFFFFF', border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}
            >
              {isSubmitting ? 'Publishing...' : 'Publish Service'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '0px', gap: '16px' }}>
            {currentStep > 1 && (
              <button onClick={handleBack} style={{
                boxSizing: 'border-box', display: 'flex', flexDirection: 'row', alignItems: 'flex-start',
                padding: '12px 20px', backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB',
                borderRadius: '8px', fontFamily: 'inherit', fontWeight: 600, fontSize: '14px',
                color: '#374151', cursor: 'pointer'
              }}>
                Back
              </button>
            )}
            <button style={{
              boxSizing: 'border-box', display: 'flex', flexDirection: 'row', alignItems: 'flex-start',
              padding: '12px 20px', backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB',
              borderRadius: '8px', fontFamily: 'inherit', fontWeight: 600, fontSize: '14px',
              color: '#374151', cursor: 'pointer'
            }}>
              Save as Draft
            </button>
            <button onClick={handleNext} style={{
              display: 'flex', flexDirection: 'row', alignItems: 'center',
              padding: '12px 24px', gap: '8px', backgroundColor: '#2563EB',
              borderRadius: '8px', fontFamily: 'inherit', fontWeight: 600, fontSize: '14px',
              color: '#FFFFFF', border: 'none', cursor: 'pointer'
            }}>
              Save & Continue
            </button>
          </div>
        )}
      </div>

      {/* Popups (inline absolute overlay) */}
      {showSubServiceModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 10000
        }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '440px' }}>
            <h3 style={{ fontSize: '16.5px', fontWeight: 800, color: '#0F172A', marginBottom: '16px', marginTop: 0 }}>
              {editingSubIndex !== null ? 'Edit Sub-Service' : 'Add New Sub-Service'}
            </h3>
            <form onSubmit={saveSubService} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>Sub-Service Name</label>
                <input type="text" required value={newSubName} onChange={e => setNewSubName(e.target.value)} style={{ padding: '8px 12px', border: '1.5px solid #E2E8F0', borderRadius: '6px', fontSize: '13.5px', outline: 'none', fontFamily: 'inherit' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>Sub-Service Code</label>
                <input type="text" required value={newSubCode} onChange={e => setNewSubCode(e.target.value)} style={{ padding: '8px 12px', border: '1.5px solid #E2E8F0', borderRadius: '6px', fontSize: '13.5px', outline: 'none', fontFamily: 'inherit' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>Status</label>
                <select value={newSubStatus} onChange={e => setNewSubStatus(e.target.value as any)} style={{ padding: '8px 12px', border: '1.5px solid #E2E8F0', borderRadius: '6px', fontSize: '13.5px', outline: 'none', backgroundColor: '#FFFFFF', fontFamily: 'inherit' }}>
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowSubServiceModal(false)} style={{ padding: '8px 14px', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '13px', color: '#475569', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 16px', border: 'none', borderRadius: '6px', fontSize: '13px', color: '#FFFFFF', backgroundColor: '#2563EB', cursor: 'pointer', fontFamily: 'inherit' }}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDocModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 10000
        }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '440px' }}>
            <h3 style={{ fontSize: '16.5px', fontWeight: 800, color: '#0F172A', marginBottom: '16px', marginTop: 0 }}>
              {editingDocIndex !== null ? 'Edit Document Requirement' : 'Add Document Requirement'}
            </h3>
            <form onSubmit={saveDocRequirement} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>Document Name</label>
                <input type="text" required value={newDocName} onChange={e => setNewDocName(e.target.value)} style={{ padding: '8px 12px', border: '1.5px solid #E2E8F0', borderRadius: '6px', fontSize: '13.5px', outline: 'none', fontFamily: 'inherit' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>Allowed Formats</label>
                <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                  {['PDF', 'JPG', 'PNG'].map(fmt => (
                    <label key={fmt} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#475569', cursor: 'pointer' }}>
                      <input type="checkbox" checked={newDocFormats.includes(fmt)} onChange={e => {
                        if (e.target.checked) setNewDocFormats([...newDocFormats, fmt]);
                        else setNewDocFormats(newDocFormats.filter(f => f !== fmt));
                      }} />
                      {fmt}
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>Max Size (MB)</label>
                <input type="number" required value={newDocSize} onChange={e => setNewDocSize(parseInt(e.target.value) || 1)} style={{ padding: '8px 12px', border: '1.5px solid #E2E8F0', borderRadius: '6px', fontSize: '13.5px', outline: 'none', fontFamily: 'inherit' }} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#475569', fontWeight: 650, cursor: 'pointer' }}>
                <input type="checkbox" checked={newDocMandatory} onChange={e => setNewDocMandatory(e.target.checked)} />
                Mandatory Attachment
              </label>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowDocModal(false)} style={{ padding: '8px 14px', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '13px', color: '#475569', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 16px', border: 'none', borderRadius: '6px', fontSize: '13px', color: '#FFFFFF', backgroundColor: '#2563EB', cursor: 'pointer', fontFamily: 'inherit' }}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showChargeModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 10000
        }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '440px' }}>
            <h3 style={{ fontSize: '16.5px', fontWeight: 800, color: '#0F172A', marginBottom: '16px', marginTop: 0 }}>
              {editingChargeIndex !== null ? 'Edit Additional Charge' : 'Add Additional Charge'}
            </h3>
            <form onSubmit={saveAdditionalCharge} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>Charge Name</label>
                <input type="text" required value={newChargeName} onChange={e => setNewChargeName(e.target.value)} style={{ padding: '8px 12px', border: '1.5px solid #E2E8F0', borderRadius: '6px', fontSize: '13.5px', outline: 'none', fontFamily: 'inherit' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>Amount (₹)</label>
                <input type="number" required value={newChargeAmount} onChange={e => setNewChargeAmount(parseFloat(e.target.value) || 0)} style={{ padding: '8px 12px', border: '1.5px solid #E2E8F0', borderRadius: '6px', fontSize: '13.5px', outline: 'none', fontFamily: 'inherit' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>Condition / Trigger</label>
                <input type="text" value={newChargeCondition} onChange={e => setNewChargeCondition(e.target.value)} style={{ padding: '8px 12px', border: '1.5px solid #E2E8F0', borderRadius: '6px', fontSize: '13.5px', outline: 'none', fontFamily: 'inherit' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowChargeModal(false)} style={{ padding: '8px 14px', border: '1px solid #E2E8F0', borderRadius: '6px', fontSize: '13px', color: '#475569', backgroundColor: '#FFFFFF', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 16px', border: 'none', borderRadius: '6px', fontSize: '13px', color: '#FFFFFF', backgroundColor: '#2563EB', cursor: 'pointer', fontFamily: 'inherit' }}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
