import React, { useEffect, useState } from 'react';
import { adminClient } from '../api/client';

interface RequiredDocument {
  name: string;
  mandatory: boolean;
  acceptedFormats: string[];
  maxSizeMb: number;
}

interface Service {
  _id: string;
  name: string;
  category: string;
  description?: string;
  department: string;
  govtFee: number;
  convenienceFee: number;
  slaHours: number;
  isActive: boolean;
  formFields?: any[];
  eligibility?: string[];
  requiredDocuments?: RequiredDocument[];
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal open states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Selected Service for edit/view
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  // Form Fields State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('aadhaar');
  const [department, setDepartment] = useState('');
  const [govtFee, setGovtFee] = useState(0);
  const [convenienceFee, setConvenienceFee] = useState(0);
  const [slaHours, setSlaHours] = useState(24);
  const [eligibility, setEligibility] = useState('');
  const [requiredDocs, setRequiredDocs] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [visualFields, setVisualFields] = useState<any[]>([]);

  // Search Filter & Pagination State
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'Aadhaar Services': true // Expand first group by default
  });

  const fetchServices = async () => {
    setLoading(true);
    try {
      const { data } = await adminClient.get('/services?all=true&limit=100');
      setServices(data.data.items || []);
    } catch (err) {
      console.error('Failed to fetch services', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  // Google Forms helpers
  const addVisualField = () => {
    setVisualFields(prev => [
      ...prev,
      {
        key: `field_${Date.now()}`,
        label: 'New Field',
        type: 'text',
        required: true,
        placeholder: '',
        options: []
      }
    ]);
  };

  const updateVisualField = (index: number, keyStr: string, value: any) => {
    setVisualFields(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [keyStr]: value };
      if (keyStr === 'label' && next[index].key.startsWith('field_')) {
        next[index].key = value
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '_')
          .substring(0, 20);
      }
      return next;
    });
  };

  const removeVisualField = (index: number) => {
    setVisualFields(prev => prev.filter((_, i) => i !== index));
  };

  const handleEditClick = (s: Service) => {
    setSelectedService(s);
    setName(s.name);
    setDescription(s.description || '');
    setCategory(s.category || 'gov_scheme');
    setDepartment(s.department || '');
    setGovtFee(s.govtFee / 100);
    setConvenienceFee(s.convenienceFee / 100);
    setSlaHours(s.slaHours || 24);
    setEligibility((s.eligibility || []).join(', '));
    setRequiredDocs((s.requiredDocuments || []).map(d => d.name).join(', '));
    setIsActive(s.isActive);
    setVisualFields(s.formFields || []);
    
    setIsEditModalOpen(true);
  };

  const handleViewClick = (s: Service) => {
    setSelectedService(s);
    setIsViewModalOpen(true);
  };

  const handleAddNewSubService = (group: any) => {
    setName('');
    setDescription('');
    
    let catSlug = 'gov_scheme';
    if (group.name === 'Aadhaar Services') catSlug = 'aadhaar';
    else if (group.name === 'PAN Card Services') catSlug = 'pan';
    else if (group.name === 'Birth & Death Registration') catSlug = 'certificate';

    setCategory(catSlug);
    setDepartment(group.department || '');
    setGovtFee(0);
    setConvenienceFee(0);
    setSlaHours(24);
    setEligibility('Indian Citizen');
    setRequiredDocs('Aadhaar Card');
    setIsActive(true);
    setVisualFields([
      { key: 'applicantName', label: 'Applicant Full Name', type: 'text', required: true, placeholder: 'Enter Full Name' }
    ]);

    setIsCreateModalOpen(true);
  };

  const handleAddNewClick = () => {
    setName('');
    setDescription('');
    setCategory('aadhaar');
    setDepartment('');
    setGovtFee(0);
    setConvenienceFee(0);
    setSlaHours(24);
    setEligibility('Indian Citizen');
    setRequiredDocs('Aadhaar Card');
    setIsActive(true);
    setVisualFields([
      { key: 'applicantName', label: 'Applicant Full Name', type: 'text', required: true, placeholder: 'Enter Full Name' }
    ]);

    setIsCreateModalOpen(true);
  };

  // Submit Edit Form
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;
    try {
      const eligibilityArr = eligibility.split(',').map(item => item.trim()).filter(item => item.length > 0);
      const reqDocs = requiredDocs
        .split(',')
        .map(name => ({
          name: name.trim(),
          mandatory: true,
          acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
          maxSizeMb: 5
        }))
        .filter(d => d.name.length > 0);

      await adminClient.patch(`/services/${selectedService._id}`, {
        name,
        description,
        category,
        department,
        govtFee: govtFee * 100,
        convenienceFee: convenienceFee * 100,
        slaHours,
        isActive,
        eligibility: eligibilityArr,
        requiredDocuments: reqDocs,
        formFields: visualFields
      });

      alert('Service configurations updated successfully');
      setIsEditModalOpen(false);
      fetchServices();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update service config');
    }
  };

  // Submit Create Form
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const reqDocs = requiredDocs
        .split(',')
        .map(name => ({
          name: name.trim(),
          mandatory: true,
          acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'],
          maxSizeMb: 5
        }))
        .filter(d => d.name.length > 0);

      if (reqDocs.length === 0) {
        alert('Please specify at least one required document.');
        return;
      }

      const eligibilityArr = eligibility.split(',').map(item => item.trim()).filter(item => item.length > 0);

      await adminClient.post('/services', {
        name,
        description,
        category,
        department,
        govtFee: govtFee * 100,
        convenienceFee: convenienceFee * 100,
        slaHours,
        isActive,
        eligibility: eligibilityArr,
        requiredDocuments: reqDocs,
        formFields: visualFields
      });

      alert('New service successfully created');
      setIsCreateModalOpen(false);
      fetchServices();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create service');
    }
  };

  // Group services dynamically by category
  const getGroupedServices = () => {
    return services.reduce((acc, s) => {
      const nameLower = s.name.toLowerCase();
      const cat = s.category || 'gov_scheme';
      
      let groupName = 'Government Schemes';
      let dept = s.department || 'Government of India';

      if (cat === 'aadhaar') {
        groupName = 'Aadhaar Services';
        dept = 'Ministry of Electronics & IT (UIDAI)';
      } else if (cat === 'pan') {
        groupName = 'PAN Card Services';
        dept = 'Income Tax Department';
      } else if (cat === 'certificate' || cat === 'certificates') {
        groupName = 'Birth & Death Registration';
        dept = 'Municipal Corporations';
      } else if (nameLower.includes('aeps') || nameLower.includes('balance') || nameLower.includes('statement')) {
        groupName = 'Banking Services (AEPS)';
        dept = 'NPCI Aadhaar Enabled Payments';
      } else if (nameLower.includes('insurance') || nameLower.includes('pmsby') || nameLower.includes('pmjjby')) {
        groupName = 'Subsidized Insurance';
        dept = 'Government Insurance Schemes';
      } else if (nameLower.includes('scholarship') || nameLower.includes('education')) {
        groupName = 'Scholarships & Education';
        dept = 'Ministry of Education';
      } else if (nameLower.includes('pension') || nameLower.includes('atal') || nameLower.includes('ignoaps')) {
        groupName = 'Pension Schemes';
        dept = 'PFRDA Old Age Pension';
      } else if (nameLower.includes('shramik') || nameLower.includes('nrega') || nameLower.includes('job card')) {
        groupName = 'Employment Services';
        dept = 'Labour & Rural Employment';
      } else if (nameLower.includes('itr') || nameLower.includes('gst') || nameLower.includes('tax')) {
        groupName = 'Taxation Services';
        dept = 'Income Tax & GST Portals';
      } else if (nameLower.includes('electricity') || nameLower.includes('utility') || nameLower.includes('bill')) {
        groupName = 'Utility Bills';
        dept = 'State & Central Utilities';
      } else if (nameLower.includes('kisan')) {
        groupName = 'Agriculture Schemes';
        dept = 'Department of Agriculture';
      } else if (nameLower.includes('ayushman') || nameLower.includes('pm-jay') || nameLower.includes('health')) {
        groupName = 'Health Services';
        dept = 'National Health Authority';
      } else {
        groupName = 'Government Schemes';
        dept = 'National Payments Corporation of India';
      }

      if (!acc[groupName]) {
        acc[groupName] = {
          name: groupName,
          department: dept,
          status: 'Active',
          items: []
        };
      }
      acc[groupName].items.push(s);

      const hasInactive = acc[groupName].items.some(item => !item.isActive);
      acc[groupName].status = hasInactive ? 'Maintenance' : 'Active';

      return acc;
    }, {} as Record<string, { name: string; department: string; status: string; items: Service[] }>);
  };

  const grouped = getGroupedServices();

  // Search filter matching category or name
  const filteredGroupKeys = Object.keys(grouped).filter(key => {
    if (!search) return true;
    const group = grouped[key];
    const matchGroup = group.name.toLowerCase().includes(search.toLowerCase()) || group.department.toLowerCase().includes(search.toLowerCase());
    const matchItems = group.items.some(item => item.name.toLowerCase().includes(search.toLowerCase()));
    return matchGroup || matchItems;
  });

  // Calculate statistics metrics
  const totalServices = services.length;
  const activeServices = services.filter(s => s.isActive).length;
  const underMaintenance = services.filter(s => !s.isActive).length;

  return (
    <div style={{ padding: '24px 32px', backgroundColor: '#F8FAFC', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Breadcrumb Path */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748B', marginBottom: '16px' }}>
        <span>Dashboard</span>
        <span>➔</span>
        <span style={{ color: '#2563EB', fontWeight: 600 }}>Services</span>
      </div>

      {/* Main Title & Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>Government Services Directory</h1>
          <p style={{ color: '#64748B', fontSize: '14.5px', marginTop: '4px', margin: 0 }}>Configure and deploy workflows, processing rules, and document requirements for citizen portals.</p>
        </div>
        
        <button
          onClick={handleAddNewClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            border: 'none',
            borderRadius: '10px',
            backgroundColor: '#2563EB',
            color: '#FFFFFF',
            fontSize: '13.5px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(37,99,235,0.2)'
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add New Service
        </button>
      </div>

      {/* Metrics Row (4 columns matching screenshot) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'TOTAL SERVICES', val: totalServices.toString(), sub: 'Across 8 departments', iconBg: '#EFF6FF', iconColor: '#2563EB', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
          { label: 'ACTIVE SERVICES', val: activeServices.toString(), sub: 'Operational online', iconBg: '#ECFDF5', iconColor: '#10B981', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> },
          { label: 'UNDER MAINTENANCE', val: underMaintenance.toString(), sub: 'Temporary system hold', iconBg: '#FFFBEB', iconColor: '#F59E0B', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> },
          { label: 'TOTAL REQUESTS YTD', val: '1,48,291', sub: 'SLA compliance rate 98.4%', iconBg: '#EFF6FF', iconColor: '#2563EB', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> }
        ].map((c, i) => (
          <div key={i} style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: '16px', border: '1.5px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', letterSpacing: '0.06em' }}>{c.label}</span>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', backgroundColor: c.iconBg, color: c.iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {c.icon}
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '26px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.03em' }}>{c.val}</span>
            </div>
            <span style={{ fontSize: '12.5px', color: '#94A3B8', marginTop: '6px', display: 'block' }}>{c.sub}</span>
          </div>
        ))}
      </div>

      {/* Categories filter and Configuration Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1.5px solid #E2E8F0', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '240px' }}>
            <input
              type="text"
              placeholder="Filter categories..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                border: '1.5px solid #E2E8F0',
                borderRadius: '8px',
                fontSize: '13.5px',
                outline: 'none',
                backgroundColor: '#FFFFFF',
                color: '#0F172A'
              }}
            />
            <span style={{ position: 'absolute', left: '12px', top: '10px', color: '#94A3B8' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </span>
          </div>

          <button style={{
            padding: '8px 16px',
            border: '1.5px solid #E2E8F0',
            borderRadius: '8px',
            backgroundColor: '#F8FAFC',
            color: '#334155',
            fontSize: '13.5px',
            fontWeight: 700,
            cursor: 'pointer'
          }}>
            All Services Mode
          </button>
        </div>

        <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748B' }}>
          {filteredGroupKeys.length} Main Categories Configured
        </span>
      </div>

      {/* Accordion Service Groups */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>Loading Government Services...</div>
        ) : filteredGroupKeys.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1.5px solid #E2E8F0' }}>No categories match your search filters.</div>
        ) : (
          (() => {
            const limit = 4;
            const paginatedKeys = filteredGroupKeys.slice((page - 1) * limit, page * limit);
            return paginatedKeys.map(key => {
              const group = grouped[key];
            const isExpanded = !!expandedGroups[group.name];
            
            return (
              <div key={group.name} style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1.5px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.01)' }}>
                {/* Accordion Group Header */}
                <div
                  onClick={() => toggleGroup(group.name)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '20px 24px',
                    cursor: 'pointer',
                    userSelect: 'none',
                    backgroundColor: isExpanded ? '#F8FAFC' : '#FFFFFF',
                    borderBottom: isExpanded ? '1.5px solid #E2E8F0' : 'none',
                    transition: 'background-color 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      backgroundColor: '#EFF6FF',
                      color: '#2563EB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {group.name.includes('Aadhaar') ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      ) : group.name.includes('PAN') ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="16" rx="2" ry="2"/><line x1="7" y1="8" x2="17" y2="8"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="7" y1="16" x2="13" y2="16"/></svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                      )}
                    </div>
                    
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', margin: 0 }}>{group.name}</h3>
                      <span style={{ fontSize: '12px', color: '#64748B', marginTop: '2px', display: 'block' }}>{group.department}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{
                      fontSize: '11.5px',
                      fontWeight: 700,
                      backgroundColor: '#EFF6FF',
                      color: '#2563EB',
                      padding: '3px 8px',
                      borderRadius: '6px'
                    }}>
                      {group.items.length} Sub-services
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddNewSubService(group);
                      }}
                      style={{
                        padding: '4px 10px',
                        backgroundColor: '#EFF6FF',
                        color: '#2563EB',
                        border: '1.5px solid #BFDBFE',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ marginRight: '2px' }}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      Add Sub-service
                    </button>

                    <span style={{
                      fontSize: '11.5px',
                      fontWeight: 700,
                      backgroundColor: group.status === 'Active' ? '#E6FDF3' : '#FFFBEB',
                      color: group.status === 'Active' ? '#10B981' : '#F59E0B',
                      padding: '3px 8px',
                      borderRadius: '6px'
                    }}>
                      {group.status}
                    </span>

                    <span style={{ color: '#64748B' }}>
                      {isExpanded ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15"/></svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                      )}
                    </span>
                  </div>
                </div>

                {/* Sub-services table list inside accordion group */}
                {isExpanded && (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1.5px solid #E2E8F0' }}>
                          <th style={{ padding: '12px 24px', fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sub-service Name</th>
                          <th style={{ padding: '12px 24px', fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</th>
                          <th style={{ padding: '12px 24px', fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SLA</th>
                          <th style={{ padding: '12px 24px', fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Govt Fee</th>
                          <th style={{ padding: '12px 24px', fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                          <th style={{ padding: '12px 24px', fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', width: '160px' }}>Actions</th>
                        </tr>
                      </thead>
                      
                      <tbody>
                        {group.items.map(s => {
                          const formattedSla = s.slaHours >= 24 ? `${Math.ceil(s.slaHours / 24)} Days` : `${s.slaHours} Hours`;
                          const formattedFee = s.govtFee === 0 ? 'FREE' : `₹${s.govtFee / 100}`;
                          
                          return (
                            <tr key={s._id} style={{ borderBottom: '1.5px solid #F1F5F9' }}>
                              <td style={{ padding: '14px 24px', fontSize: '13.5px', fontWeight: 700, color: '#0F172A' }}>{s.name}</td>
                              
                              <td style={{ padding: '14px 24px' }}>
                                <span style={{
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  backgroundColor: '#F1F5F9',
                                  color: '#475569',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  textTransform: 'uppercase'
                                }}>
                                  Identity
                                </span>
                              </td>
                              
                              <td style={{ padding: '14px 24px', fontSize: '13.5px', color: '#475569' }}>{formattedSla}</td>
                              
                              <td style={{ padding: '14px 24px', fontSize: '13.5px', fontWeight: 700, color: s.govtFee === 0 ? '#10B981' : '#0F172A' }}>{formattedFee}</td>
                              
                              <td style={{ padding: '14px 24px' }}>
                                <span style={{
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  backgroundColor: s.isActive ? '#E6FDF3' : '#FEE2E2',
                                  color: s.isActive ? '#10B981' : '#EF4444',
                                  padding: '3px 8px',
                                  borderRadius: '6px'
                                }}>
                                  {s.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              
                              <td style={{ padding: '14px 24px' }}>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button
                                    onClick={() => handleEditClick(s)}
                                    style={{
                                      padding: '5px 12px',
                                      border: '1.5px solid #E2E8F0',
                                      borderRadius: '6px',
                                      backgroundColor: '#FFFFFF',
                                      color: '#334155',
                                      fontSize: '12.5px',
                                      fontWeight: 700,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleViewClick(s)}
                                    style={{
                                      padding: '5px 12px',
                                      border: 'none',
                                      borderRadius: '6px',
                                      backgroundColor: '#2563EB',
                                      color: '#FFFFFF',
                                      fontSize: '12.5px',
                                      fontWeight: 700,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    View
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
            });
          })()
        )}
      </div>

      {/* Pagination Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', padding: '14px 24px', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1.5px solid #E2E8F0' }}>
        <span style={{ fontSize: '13px', color: '#64748B' }}>
          Showing {filteredGroupKeys.length === 0 ? 0 : (page - 1) * 4 + 1}-{Math.min(page * 4, filteredGroupKeys.length)} of {filteredGroupKeys.length} categories with {services.length} services
        </span>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setPage(p => Math.max(p - 1, 1))}
            disabled={page === 1}
            style={{
              padding: '6px 12px',
              border: '1.5px solid #E2E8F0',
              borderRadius: '6px',
              backgroundColor: '#FFFFFF',
              fontSize: '12.5px',
              fontWeight: 600,
              color: '#64748B',
              cursor: page === 1 ? 'default' : 'pointer',
              opacity: page === 1 ? 0.5 : 1
            }}
          >
            Previous
          </button>
          
          {Array.from({ length: Math.ceil(filteredGroupKeys.length / 4) }, (_, i) => i + 1).map(pageNum => (
            <button
              key={pageNum}
              onClick={() => setPage(pageNum)}
              style={{
                width: '28px',
                height: '28px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: page === pageNum ? '#2563EB' : '#FFFFFF',
                color: page === pageNum ? '#FFFFFF' : '#475569',
                borderWidth: page === pageNum ? '0' : '1px',
                borderStyle: 'solid',
                borderColor: '#E2E8F0',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {pageNum}
            </button>
          ))}

          <button
            onClick={() => setPage(p => Math.min(p + 1, Math.ceil(filteredGroupKeys.length / 4)))}
            disabled={page === Math.ceil(filteredGroupKeys.length / 4) || Math.ceil(filteredGroupKeys.length / 4) === 0}
            style={{
              padding: '6px 12px',
              border: '1.5px solid #E2E8F0',
              borderRadius: '6px',
              backgroundColor: '#FFFFFF',
              fontSize: '12.5px',
              fontWeight: 600,
              color: '#64748B',
              cursor: page === Math.ceil(filteredGroupKeys.length / 4) ? 'default' : 'pointer',
              opacity: page === Math.ceil(filteredGroupKeys.length / 4) ? 0.5 : 1
            }}
          >
            Next
          </button>
        </div>
      </div>

      {/* Edit / Configuration Modal */}
      {isEditModalOpen && selectedService && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1.5px solid #F1F5F9', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Configure Service: {selectedService.name}</h3>
              <button onClick={() => setIsEditModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Service Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required style={{ padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '14.5px', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Govt Fee (₹)</label>
                  <input type="number" step="0.01" value={govtFee} onChange={e => setGovtFee(parseFloat(e.target.value))} required style={{ padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '14.5px', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Convenience Fee (₹)</label>
                  <input type="number" step="0.01" value={convenienceFee} onChange={e => setConvenienceFee(parseFloat(e.target.value))} required style={{ padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '14.5px', outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SLA Hours</label>
                  <input type="number" value={slaHours} onChange={e => setSlaHours(parseInt(e.target.value, 10))} required style={{ padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '14.5px', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</label>
                  <select value={isActive ? 'true' : 'false'} onChange={e => setIsActive(e.target.value === 'true')} style={{ padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '14.5px', outline: 'none', backgroundColor: '#FFFFFF' }}>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Eligibility Criteria (comma-separated)</label>
                <input type="text" value={eligibility} onChange={e => setEligibility(e.target.value)} required style={{ padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '14.5px', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Required Documents (comma-separated)</label>
                <input type="text" value={requiredDocs} onChange={e => setRequiredDocs(e.target.value)} required style={{ padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '14.5px', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Application Form Fields</label>
                  <button
                    type="button"
                    onClick={addVisualField}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#2563EB',
                      color: '#FFFFFF',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Add Field
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '240px', overflowY: 'auto', padding: '4px', border: '1.5px solid #E2E8F0', borderRadius: '8px' }}>
                  {visualFields.length === 0 ? (
                    <span style={{ fontSize: '13px', color: '#64748B', textAlign: 'center', padding: '12px 0' }}>No custom fields added yet.</span>
                  ) : (
                    visualFields.map((field, idx) => (
                      <div key={idx} style={{ padding: '12px', border: '1.5px solid #F1F5F9', backgroundColor: '#F8FAFC', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative' }}>
                        <button
                          type="button"
                          onClick={() => removeVisualField(idx)}
                          style={{
                            position: 'absolute',
                            right: '8px',
                            top: '8px',
                            border: 'none',
                            background: 'none',
                            color: '#EF4444',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 700
                          }}
                        >
                          ✕
                        </button>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>Field Label</span>
                          <input
                            type="text"
                            value={field.label}
                            onChange={e => updateVisualField(idx, 'label', e.target.value)}
                            placeholder="e.g. Applicant Name"
                            style={{ padding: '8px 12px', border: '1.5px solid #E2E8F0', borderRadius: '6px', fontSize: '13px', outline: 'none', backgroundColor: '#FFFFFF' }}
                          />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>Field Type</span>
                          <select
                            value={field.type}
                            onChange={e => updateVisualField(idx, 'type', e.target.value)}
                            style={{ padding: '8px 12px', border: '1.5px solid #E2E8F0', borderRadius: '6px', fontSize: '13px', outline: 'none', backgroundColor: '#FFFFFF' }}
                          >
                            <option value="text">Text</option>
                            <option value="number">Number</option>
                            <option value="date">Date</option>
                            <option value="aadhaar">Aadhaar</option>
                            <option value="pan">PAN Card</option>
                            <option value="phone">Phone</option>
                            <option value="select">Select</option>
                          </select>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>Placeholder</span>
                          <input
                            type="text"
                            value={field.placeholder || ''}
                            onChange={e => updateVisualField(idx, 'placeholder', e.target.value)}
                            placeholder="e.g. Enter value"
                            style={{ padding: '8px 12px', border: '1.5px solid #E2E8F0', borderRadius: '6px', fontSize: '13px', outline: 'none', backgroundColor: '#FFFFFF' }}
                          />
                        </div>

                        {field.type === 'select' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>Options (comma-separated)</span>
                            <input
                              type="text"
                              value={Array.isArray(field.options) ? field.options.join(', ') : (field.options || '')}
                              onChange={e => updateVisualField(idx, 'options', e.target.value.split(',').map(o => o.trim()).filter(Boolean))}
                              placeholder="e.g. Male, Female, Other"
                              style={{ padding: '8px 12px', border: '1.5px solid #E2E8F0', borderRadius: '6px', fontSize: '13px', outline: 'none', backgroundColor: '#FFFFFF' }}
                            />
                          </div>
                        )}

                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#475569', fontWeight: 600, cursor: 'pointer', marginTop: '4px' }}>
                          <input
                            type="checkbox"
                            checked={!!field.required}
                            onChange={e => updateVisualField(idx, 'required', e.target.checked)}
                            style={{ width: '15px', height: '15px' }}
                          />
                          Required Field
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={() => setIsEditModalOpen(false)} style={{ flex: 1, padding: '12px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', fontWeight: 700, backgroundColor: '#FFFFFF', color: '#475569', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, backgroundColor: '#2563EB', color: '#FFFFFF', cursor: 'pointer' }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Service Modal */}
      {isCreateModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1.5px solid #F1F5F9', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Add New Service / Scheme</h3>
              <button onClick={() => setIsCreateModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Service Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Passport Re-issue" style={{ padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '14.5px', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</label>
                <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} required placeholder="Brief description of the service" style={{ padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '14.5px', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)} required style={{ padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '14.5px', outline: 'none', backgroundColor: '#FFFFFF' }}>
                  <option value="aadhaar">Aadhaar</option>
                  <option value="pan">PAN Card</option>
                  <option value="certificate">Certificate / Registry</option>
                  <option value="gov_scheme">Government Scheme (Banking, Pension, Tax, Insurance, Utilities, etc.)</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Department</label>
                <input type="text" value={department} onChange={e => setDepartment(e.target.value)} required placeholder="e.g. Ministry of External Affairs" style={{ padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '14.5px', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Govt Fee (₹)</label>
                  <input type="number" step="0.01" value={govtFee} onChange={e => setGovtFee(parseFloat(e.target.value))} required style={{ padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '14.5px', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Convenience Fee (₹)</label>
                  <input type="number" step="0.01" value={convenienceFee} onChange={e => setConvenienceFee(parseFloat(e.target.value))} required style={{ padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '14.5px', outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SLA Hours</label>
                  <input type="number" value={slaHours} onChange={e => setSlaHours(parseInt(e.target.value, 10))} required style={{ padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '14.5px', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</label>
                  <select value={isActive ? 'true' : 'false'} onChange={e => setIsActive(e.target.value === 'true')} style={{ padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '14.5px', outline: 'none', backgroundColor: '#FFFFFF' }}>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Eligibility Criteria (comma-separated)</label>
                <input type="text" value={eligibility} onChange={e => setEligibility(e.target.value)} required style={{ padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '14.5px', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Required Documents (comma-separated)</label>
                <input type="text" value={requiredDocs} onChange={e => setRequiredDocs(e.target.value)} required style={{ padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '14.5px', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Application Form Fields</label>
                  <button
                    type="button"
                    onClick={addVisualField}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#2563EB',
                      color: '#FFFFFF',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Add Field
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '240px', overflowY: 'auto', padding: '4px', border: '1.5px solid #E2E8F0', borderRadius: '8px' }}>
                  {visualFields.length === 0 ? (
                    <span style={{ fontSize: '13px', color: '#64748B', textAlign: 'center', padding: '12px 0' }}>No custom fields added yet.</span>
                  ) : (
                    visualFields.map((field, idx) => (
                      <div key={idx} style={{ padding: '12px', border: '1.5px solid #F1F5F9', backgroundColor: '#F8FAFC', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative' }}>
                        <button
                          type="button"
                          onClick={() => removeVisualField(idx)}
                          style={{
                            position: 'absolute',
                            right: '8px',
                            top: '8px',
                            border: 'none',
                            background: 'none',
                            color: '#EF4444',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 700
                          }}
                        >
                          ✕
                        </button>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>Field Label</span>
                          <input
                            type="text"
                            value={field.label}
                            onChange={e => updateVisualField(idx, 'label', e.target.value)}
                            placeholder="e.g. Applicant Name"
                            style={{ padding: '8px 12px', border: '1.5px solid #E2E8F0', borderRadius: '6px', fontSize: '13px', outline: 'none', backgroundColor: '#FFFFFF' }}
                          />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>Field Type</span>
                          <select
                            value={field.type}
                            onChange={e => updateVisualField(idx, 'type', e.target.value)}
                            style={{ padding: '8px 12px', border: '1.5px solid #E2E8F0', borderRadius: '6px', fontSize: '13px', outline: 'none', backgroundColor: '#FFFFFF' }}
                          >
                            <option value="text">Text</option>
                            <option value="number">Number</option>
                            <option value="date">Date</option>
                            <option value="aadhaar">Aadhaar</option>
                            <option value="pan">PAN Card</option>
                            <option value="phone">Phone</option>
                            <option value="select">Select</option>
                          </select>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>Placeholder</span>
                          <input
                            type="text"
                            value={field.placeholder || ''}
                            onChange={e => updateVisualField(idx, 'placeholder', e.target.value)}
                            placeholder="e.g. Enter value"
                            style={{ padding: '8px 12px', border: '1.5px solid #E2E8F0', borderRadius: '6px', fontSize: '13px', outline: 'none', backgroundColor: '#FFFFFF' }}
                          />
                        </div>

                        {field.type === 'select' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>Options (comma-separated)</span>
                            <input
                              type="text"
                              value={Array.isArray(field.options) ? field.options.join(', ') : (field.options || '')}
                              onChange={e => updateVisualField(idx, 'options', e.target.value.split(',').map(o => o.trim()).filter(Boolean))}
                              placeholder="e.g. Male, Female, Other"
                              style={{ padding: '8px 12px', border: '1.5px solid #E2E8F0', borderRadius: '6px', fontSize: '13px', outline: 'none', backgroundColor: '#FFFFFF' }}
                            />
                          </div>
                        )}

                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#475569', fontWeight: 600, cursor: 'pointer', marginTop: '4px' }}>
                          <input
                            type="checkbox"
                            checked={!!field.required}
                            onChange={e => updateVisualField(idx, 'required', e.target.checked)}
                            style={{ width: '15px', height: '15px' }}
                          />
                          Required Field
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="button" onClick={() => setIsCreateModalOpen(false)} style={{ flex: 1, padding: '12px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', fontWeight: 700, backgroundColor: '#FFFFFF', color: '#475569', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, backgroundColor: '#2563EB', color: '#FFFFFF', cursor: 'pointer' }}>Create Service</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details View Modal */}
      {isViewModalOpen && selectedService && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '480px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1.5px solid #F1F5F9', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Service Details</h3>
              <button onClick={() => setIsViewModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: 0 }}>{selectedService.name}</h4>
                <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px', margin: 0 }}>{selectedService.department}</p>
              </div>

              {selectedService.description && (
                <div>
                  <h5 style={{ fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', margin: 0, marginBottom: '6px' }}>Description</h5>
                  <p style={{ fontSize: '13.5px', color: '#334155', margin: 0, lineHeight: 1.5 }}>{selectedService.description}</p>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div>
                  <h5 style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', margin: 0 }}>Govt Fee</h5>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', marginTop: '4px', margin: 0 }}>₹{selectedService.govtFee / 100}</p>
                </div>
                <div>
                  <h5 style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', margin: 0 }}>Conv. Fee</h5>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', marginTop: '4px', margin: 0 }}>₹{selectedService.convenienceFee / 100}</p>
                </div>
                <div>
                  <h5 style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', margin: 0 }}>SLA</h5>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', marginTop: '4px', margin: 0 }}>{selectedService.slaHours >= 24 ? `${Math.ceil(selectedService.slaHours / 24)} Days` : `${selectedService.slaHours}h`}</p>
                </div>
              </div>

              {selectedService.eligibility && selectedService.eligibility.length > 0 && (
                <div>
                  <h5 style={{ fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', margin: 0, marginBottom: '6px' }}>Eligibility</h5>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13.5px', color: '#334155', lineHeight: 1.5 }}>
                    {selectedService.eligibility.map((el, i) => <li key={i}>{el}</li>)}
                  </ul>
                </div>
              )}

              {selectedService.requiredDocuments && selectedService.requiredDocuments.length > 0 && (
                <div>
                  <h5 style={{ fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', margin: 0, marginBottom: '6px' }}>Required Documents</h5>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {selectedService.requiredDocuments.map((doc, i) => (
                      <span key={i} style={{ fontSize: '12px', fontWeight: 600, color: '#2563EB', backgroundColor: '#EFF6FF', padding: '4px 8px', borderRadius: '6px' }}>{doc.name}</span>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={() => setIsViewModalOpen(false)} style={{ padding: '12px', backgroundColor: '#F1F5F9', border: 'none', borderRadius: '8px', color: '#334155', fontWeight: 700, fontSize: '14px', cursor: 'pointer', marginTop: '8px' }}>Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
