import React, { useEffect, useState } from 'react';
import { adminClient } from '../api/client';
import ServiceConfigWizard from './ServiceConfigWizard';

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
  const [showWizard, setShowWizard] = useState(false);
  const [wizardCategory, setWizardCategory] = useState<string | undefined>(undefined);
  const [wizardDepartment, setWizardDepartment] = useState<string | undefined>(undefined);

  // Selected Service for deletion
  const [selectedService, setSelectedService] = useState<Service | null>(null);

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

  // Delete service handler
  const handleDeleteClick = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this service configuration?')) return;
    try {
      await adminClient.delete(`/services/${id}`);
      alert('Service deleted successfully');
      fetchServices();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete service');
    }
  };

  const handleAddNewSubService = (group: any) => {
    let catSlug = 'gov_scheme';
    if (group.name === 'Aadhaar Services') catSlug = 'aadhaar';
    else if (group.name === 'PAN Card Services') catSlug = 'pan';
    else if (group.name === 'Birth & Death Registration') catSlug = 'certificate';

    setWizardCategory(catSlug);
    setWizardDepartment(group.department || '');
    setShowWizard(true);
  };

  const handleAddNewClick = () => {
    setShowWizard(true);
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

  if (showWizard) {
    return (
      <ServiceConfigWizard 
        onClose={() => { setShowWizard(false); setWizardCategory(undefined); setWizardDepartment(undefined); }} 
        onSave={() => { setShowWizard(false); setWizardCategory(undefined); setWizardDepartment(undefined); fetchServices(); }} 
        initialCategory={wizardCategory}
        initialDepartment={wizardDepartment}
      />
    );
  }

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
                                    onClick={() => handleDeleteClick(s._id)}
                                    style={{
                                      padding: '5px 12px',
                                      border: 'none',
                                      borderRadius: '6px',
                                      backgroundColor: '#EF4444',
                                      color: '#FFFFFF',
                                      fontSize: '12.5px',
                                      fontWeight: 700,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Delete
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

      {/* Old modals completely removed in favor of premium config wizard */}

    </div>
  );
}
