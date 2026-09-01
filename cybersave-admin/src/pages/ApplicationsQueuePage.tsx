import React, { useEffect, useState } from 'react';
import { adminClient } from '../api/client';
import { Link } from 'react-router-dom';
import { useAdminStore } from '../store/adminStore';
import { STATE_DISTRICTS } from '../utils/districtsData';

interface Application {
  _id: string;
  applicationRefNo: string;
  serviceName: string;
  applicantName: string;
  status: string;
  slaDeadline?: string;
  createdAt: string;
  totalAmount: number;
  assignedOperatorId?: string;
  assignedOperatorName?: string;
}

interface Metrics {
  totalApplications: number;
  todayReceived: number;
  pendingReview: number;
  inProcessing: number;
  completedToday: number;
}

interface Pipeline {
  submitted: number;
  underReview: number;
  processing: number;
  approved: number;
  completed: number;
}

const CATEGORIES = [
  'All Applications',
  'Aadhaar Services',
  'PAN Card',
  'Certificates',
  'Banking',
  'Insurance',
  'Utility',
  'Other'
];

export default function ApplicationsQueuePage() {
  const user = useAdminStore((s) => s.user);
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Stats states
  const [metrics, setMetrics] = useState<Metrics>({
    totalApplications: 0,
    todayReceived: 0,
    pendingReview: 0,
    inProcessing: 0,
    completedToday: 0
  });

  const [pipeline, setPipeline] = useState<Pipeline>({
    submitted: 0,
    underReview: 0,
    processing: 0,
    approved: 0,
    completed: 0
  });

  // Filter States
  const [activeTab, setActiveTab] = useState('All Applications');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [assignedFilter, setAssignedFilter] = useState('all');

  // Table selection states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // New Application Modal Flow states
  const [isNewAppModalOpen, setIsNewAppModalOpen] = useState(false);
  const [newAppStep, setNewAppStep] = useState(1); // 1: Search, 2: Register, 3: Apply
  const [citizenPhone, setCitizenPhone] = useState('');
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [citizenId, setCitizenId] = useState('');
  
  // Citizen profile form
  const [citizenName, setCitizenName] = useState('');
  const [citizenEmail, setCitizenEmail] = useState('');
  const [citizenAadhaar, setCitizenAadhaar] = useState('');
  const [citizenState, setCitizenState] = useState('Uttar Pradesh');
  const [citizenDistrict, setCitizenDistrict] = useState('Lucknow');
  const [registeringCitizen, setRegisteringCitizen] = useState(false);

  // Service form
  const [services, setServices] = useState<any[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [submittingApp, setSubmittingApp] = useState(false);

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const { data } = await adminClient.get(`/applications/admin/all`, {
        params: {
          page,
          limit: 8,
          search: search || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          category: activeTab !== 'All Applications' ? activeTab : undefined,
          assigned: assignedFilter !== 'all' ? assignedFilter : undefined
        }
      });
      setApps(data.data.items);
      setTotalPages(data.data.totalPages);
      setTotalCount(data.data.total);
      if (data.data.metrics) setMetrics(data.data.metrics);
      if (data.data.pipeline) setPipeline(data.data.pipeline);
    } catch (err) {
      console.error('Failed to fetch applications', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const { data } = await adminClient.get('/services');
      setServices(data.data.items || []);
      if (data.data.items && data.data.items.length > 0) {
        setSelectedServiceId(data.data.items[0]._id);
      }
    } catch (err) {
      console.error('Failed to fetch services', err);
    }
  };

  const handleCheckPhone = async () => {
    if (!/^[6-9]\d{9}$/.test(citizenPhone)) {
      alert('Please enter a valid 10-digit mobile number');
      return;
    }
    setCheckingPhone(true);
    try {
      const { data } = await adminClient.get('/auth/admin/citizens', {
        params: { search: citizenPhone }
      });
      const exactMatch = data.data.items.find((c: any) => c.phone === `+91${citizenPhone}` || c.phone === citizenPhone);
      if (exactMatch) {
        setCitizenId(exactMatch.id);
        setCitizenName(exactMatch.name);
        setCitizenEmail(exactMatch.email || '');
        setCitizenAadhaar(exactMatch.aadhaarMasked || '');
        setCitizenState(exactMatch.state || 'Uttar Pradesh');
        setCitizenDistrict(exactMatch.district || 'Lucknow');
        await fetchServices();
        setNewAppStep(3);
      } else {
        setCitizenName('');
        setCitizenEmail('');
        setCitizenAadhaar('');
        setNewAppStep(2);
      }
    } catch (err) {
      console.error(err);
      alert('Error searching for citizen');
    } finally {
      setCheckingPhone(false);
    }
  };

  const handleRegisterCitizen = async () => {
    if (!citizenName.trim()) {
      alert('Please enter Full Name');
      return;
    }
    setRegisteringCitizen(true);
    try {
      const { data } = await adminClient.post('/auth/admin/citizens', {
        name: citizenName,
        phone: citizenPhone,
        email: citizenEmail || undefined,
        aadhaarNumber: citizenAadhaar || undefined,
        state: citizenState,
        district: citizenDistrict
      });
      setCitizenId(data.data.user.id);
      await fetchServices();
      setNewAppStep(3);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to register citizen profile');
    } finally {
      setRegisteringCitizen(false);
    }
  };

  const handleSubmitApplication = async () => {
    if (!selectedServiceId) {
      alert('Please select a service');
      return;
    }
    setSubmittingApp(true);
    try {
      await adminClient.post('/applications/admin/create', {
        citizenId,
        serviceId: selectedServiceId,
        applicantName: citizenName,
        applicantPhone: citizenPhone,
        applicantDob: dob || undefined,
        applicantGender: gender,
        applicantAddress: {
          line1: 'Walk-in Registration',
          city: citizenDistrict,
          state: citizenState,
          pincode: '110001'
        }
      });
      setIsNewAppModalOpen(false);
      setNewAppStep(1);
      setCitizenPhone('');
      setCitizenId('');
      setDob('');
      fetchApplications();
      alert('Application successfully created for citizen!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create application');
    } finally {
      setSubmittingApp(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, activeTab, assignedFilter, priorityFilter, dateFilter]);

  useEffect(() => {
    fetchApplications();
  }, [page, search, statusFilter, activeTab, assignedFilter, priorityFilter, dateFilter]);

  // Master Checkbox Toggle
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(apps.map(app => app._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id));
    }
  };

  // Status badge styling
  const getStatusBadge = (status: string) => {
    const formatted = status.replace('_', ' ');
    let bg = '#F1F5F9';
    let color = '#475569';

    if (status === 'submitted') {
      bg = '#F1F5F9';
      color = '#475569';
    } else if (status === 'under_review' || status === 'in_review') {
      bg = '#FEF3C7';
      color = '#D97706';
    } else if (status === 'processing') {
      bg = '#DBEAFE';
      color = '#2563EB';
    } else if (status === 'completed') {
      bg = '#D1FAE5';
      color = '#059669';
    } else if (status === 'rejected') {
      bg = '#FEE2E2';
      color = '#DC2626';
    } else if (status === 'docs_pending' || status === 'pending') {
      bg = '#FEF9C3';
      color = '#CA8A04';
    } else if (status === 'approved') {
      bg = '#E0F2FE';
      color = '#0369A1';
    }

    return (
      <span style={{
        padding: '5px 10px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: 600,
        backgroundColor: bg,
        color: color,
        textTransform: 'capitalize',
        display: 'inline-block'
      }}>
        {formatted}
      </span>
    );
  };

  // SLA formatting
  const getSlaBadge = (app: Application) => {
    if (app.status === 'completed' || app.status === 'rejected') {
      return <span style={{ color: '#94A3B8' }}>—</span>;
    }
    if (!app.slaDeadline) {
      return <span style={{ color: '#94A3B8' }}>24h 00m</span>;
    }
    const deadline = new Date(app.slaDeadline);
    const diffMs = deadline.getTime() - Date.now();
    
    if (diffMs < 0) {
      return <span style={{ color: '#EF4444', fontWeight: 700 }}>Expired</span>;
    }
    
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    
    const color = hours < 6 ? '#EF4444' : hours < 12 ? '#F59E0B' : '#10B981';
    return (
      <span style={{ color, fontWeight: 700 }}>
        {hours}h {mins}m
      </span>
    );
  };

  // Calculate dynamic priorities
  const getPriorityBadge = (app: Application) => {
    let type: 'High' | 'Medium' | 'Low' = 'Low';
    let dotColor = '#94A3B8';
    let textColor = '#64748B';

    if (app.serviceName.toLowerCase().includes('pan') || app.serviceName.toLowerCase().includes('mobile') || app.status === 'docs_pending') {
      type = 'High';
      dotColor = '#EF4444';
      textColor = '#991B1B';
    } else if (app.serviceName.toLowerCase().includes('address') || app.status === 'under_review') {
      type = 'Medium';
      dotColor = '#F59E0B';
      textColor = '#92400E';
    }

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: dotColor }} />
        <span style={{ fontSize: '13px', fontWeight: 600, color: textColor }}>{type}</span>
      </div>
    );
  };

  // Formatted date string
  const formatSubmittedDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const date = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear().toString().slice(-2);
    let hours = d.getHours();
    const mins = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${date} ${month} ${year}, ${hours}:${mins} ${ampm}`;
  };

  const getCitizenInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const handleExportReport = async () => {
    try {
      // Fetch up to 1000 items matching current filters for the export
      const { data } = await adminClient.get(`/applications/admin/all`, {
        params: {
          page: 1,
          limit: 1000,
          search: search || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          category: activeTab !== 'All Applications' ? activeTab : undefined,
          assigned: assignedFilter !== 'all' ? assignedFilter : undefined
        }
      });
      
      const exportApps = data?.data?.items || [];
      if (exportApps.length === 0) {
        alert('No data to export based on current filters.');
        return;
      }
      
      const csvHeader = 'App ID,Citizen,Service Type,Priority,Status,Assigned,Submitted,Amount\n';
      const csvRows = exportApps.map((app: Application) => {
        const appId = `"${app.applicationRefNo || ''}"`;
        const citizen = `"${app.applicantName || 'N/A'}"`;
        const service = `"${app.serviceName || ''}"`;
        const priority = `"${app.serviceName.toLowerCase().includes('pan') || app.serviceName.toLowerCase().includes('mobile') || app.status === 'docs_pending' ? 'High' : app.serviceName.toLowerCase().includes('address') || app.status === 'under_review' ? 'Medium' : 'Low'}"`;
        const status = `"${app.status ? app.status.replace('_', ' ') : ''}"`;
        const assigned = `"${app.assignedOperatorName || 'Unassigned'}"`;
        const submitted = `"${formatSubmittedDate(app.createdAt)}"`;
        const amount = `"${app.totalAmount || 0}"`;
        return [appId, citizen, service, priority, status, assigned, submitted, amount].join(',');
      });
      
      const csvString = csvHeader + csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Applications_Report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to export report', err);
      alert('Failed to export report. Please try again later.');
    }
  };

  return (
    <div style={{ padding: '24px 32px', backgroundColor: '#F8FAFC', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Breadcrumb Path */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748B', marginBottom: '16px' }}>
        <span>Dashboard</span>
        <span>➔</span>
        <span style={{ color: '#2563EB', fontWeight: 600 }}>Applications</span>
      </div>

      {/* Main Title & Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>Applications</h1>
          <p style={{ color: '#64748B', fontSize: '14.5px', marginTop: '4px', margin: 0 }}>Process and track all citizen service applications</p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={handleExportReport}
            style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            border: '1.5px solid #E2E8F0',
            borderRadius: '10px',
            backgroundColor: '#FFFFFF',
            color: '#334155',
            fontSize: '13.5px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            Export Report
          </button>
          
          <button
            onClick={() => {
              setIsNewAppModalOpen(true);
              setNewAppStep(1);
            }}
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
            New Application
          </button>
        </div>
      </div>

      {/* Metrics Row (5 columns matching the layout) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'TOTAL APPLICATIONS', val: metrics.totalApplications.toLocaleString(), sub: 'All-time received', iconBg: '#F1F5F9', iconColor: '#475569', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg> },
          { label: "TODAY'S RECEIVED", val: metrics.todayReceived.toLocaleString(), sub: 'vs yesterday', badge: '+8.3%', iconBg: '#ECFDF5', iconColor: '#10B981', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg> },
          { label: 'PENDING REVIEW', val: metrics.pendingReview.toLocaleString(), sub: 'Awaiting VLE check', alert: true, iconBg: '#FFFBEB', iconColor: '#F59E0B', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> },
          { label: 'IN PROCESSING', val: metrics.inProcessing.toLocaleString(), sub: 'Sent to department', iconBg: '#EFF6FF', iconColor: '#2563EB', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> },
          { label: 'COMPLETED TODAY', val: metrics.completedToday.toLocaleString(), sub: '68.6% completion rate', check: true, iconBg: '#F0FDF4', iconColor: '#16A34A', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> }
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
              {c.badge && (
                <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#10B981', backgroundColor: '#E6FDF3', padding: '2px 6px', borderRadius: '4px' }}>{c.badge}</span>
              )}
            </div>
            <span style={{ fontSize: '12.5px', color: '#94A3B8', marginTop: '6px', display: 'block' }}>{c.sub}</span>
          </div>
        ))}
      </div>

      {/* Live Application Pipeline Card */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1.5px solid #E2E8F0', padding: '20px 24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', margin: '0 0 20px 0' }}>Live Application Pipeline</h2>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {[
            { step: 'Submitted', count: pipeline.submitted, sub: 'Active' },
            { step: 'Under Review', count: pipeline.underReview, sub: 'Needs VLE' },
            { step: 'Processing', count: pipeline.processing, sub: 'At Dept' },
            { step: 'Approved', count: pipeline.approved, sub: 'Ready' },
            { step: 'Completed', count: pipeline.completed, sub: 'Archived' }
          ].map((s, idx, arr) => (
            <React.Fragment key={idx}>
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: '100px' }}>
                <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>{s.step}</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A' }}>{s.count}</span>
                  <span style={{ fontSize: '11.5px', color: '#94A3B8', fontWeight: 600 }}>{s.sub}</span>
                </div>
              </div>
              
              {idx < arr.length - 1 && (
                <div style={{ width: '80px', height: '3px', backgroundColor: '#F1F5F9', margin: '0 16px', flexShrink: 0, borderRadius: '2px' }} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Category Tabs list */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1.5px solid #E2E8F0', paddingBottom: '12px', marginBottom: '20px', overflowX: 'auto' }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '13.5px',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: activeTab === cat ? '#2563EB' : 'transparent',
              color: activeTab === cat ? '#FFFFFF' : '#64748B',
              transition: 'all 0.15s ease'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Dynamic Filters Bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <input
            type="text"
            placeholder="Search table..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 16px 10px 40px',
              border: '1.5px solid #E2E8F0',
              borderRadius: '10px',
              fontSize: '14px',
              outline: 'none',
              backgroundColor: '#FFFFFF',
              color: '#0F172A'
            }}
          />
          <span style={{ position: 'absolute', left: '14px', top: '13px', color: '#94A3B8' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </span>
        </div>

        {[
          { value: statusFilter, onChange: setStatusFilter, label: 'Status', opts: [{ v: 'all', l: 'All' }, { v: 'submitted', l: 'Submitted' }, { v: 'under_review', l: 'In Review' }, { v: 'processing', l: 'Processing' }, { v: 'approved', l: 'Approved' }, { v: 'completed', l: 'Completed' }, { v: 'rejected', l: 'Rejected' }, { v: 'docs_pending', l: 'Docs Pending' }] },
          { value: priorityFilter, onChange: setPriorityFilter, label: 'Priority', opts: [{ v: 'all', l: 'All' }, { v: 'high', l: 'High' }, { v: 'medium', l: 'Medium' }, { v: 'low', l: 'Low' }] },
          { value: dateFilter, onChange: setDateFilter, label: 'Date', opts: [{ v: 'all', l: 'Custom Date' }, { v: 'today', l: 'Today' }, { v: '7days', l: 'Last 7 Days' }, { v: '30days', l: 'Last 30 Days' }] },
          { value: assignedFilter, onChange: setAssignedFilter, label: 'Assigned', opts: [{ v: 'all', l: 'All' }, { v: 'assigned', l: 'Assigned' }, { v: 'unassigned', l: 'Unassigned' }] }
        ].map((f, idx) => (
          <div key={idx} style={{ position: 'relative' }}>
            <select
              value={f.value}
              onChange={e => f.onChange(e.target.value)}
              style={{
                padding: '10px 36px 10px 14px',
                border: '1.5px solid #E2E8F0',
                borderRadius: '10px',
                fontSize: '13.5px',
                fontWeight: 700,
                color: '#334155',
                outline: 'none',
                backgroundColor: '#FFFFFF',
                cursor: 'pointer',
                appearance: 'none',
                minWidth: '130px'
              }}
            >
              {f.opts.map(o => (
                <option key={o.v} value={o.v}>{f.label}: {o.l}</option>
              ))}
            </select>
            <span style={{ position: 'absolute', right: '12px', top: '14px', pointerEvents: 'none', color: '#64748B' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
            </span>
          </div>
        ))}
      </div>

      {/* Main Table Card */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1.5px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
        
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid #E2E8F0', borderTopColor: '#2563EB', animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '14px', color: '#64748B', fontWeight: 600 }}>Loading Service Applications...</span>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          </div>
        ) : apps.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 24px' }}>
            <span style={{ fontSize: '36px', display: 'block', marginBottom: '12px' }}>📋</span>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', margin: 0 }}>No applications found</h3>
            <p style={{ color: '#64748B', fontSize: '13.5px', marginTop: '4px', margin: 0 }}>Try adjusting your search query or filter tags.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1.5px solid #E2E8F0' }}>
                <th style={{ padding: '14px 20px', width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.length === apps.length}
                    onChange={handleSelectAll}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                </th>
                <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>App ID</th>
                <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Citizen</th>
                <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Service Type</th>
                <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Priority</th>
                <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assigned</th>
                <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Submitted</th>
                <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SLA</th>
                <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount</th>
                <th style={{ padding: '14px 20px', width: '50px' }} />
              </tr>
            </thead>
            
            <tbody>
              {apps.map(app => (
                <tr key={app._id} style={{ borderBottom: '1.5px solid #F1F5F9', verticalAlign: 'middle' }}>
                  <td style={{ padding: '14px 20px' }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(app._id)}
                      onChange={e => handleSelectItem(app._id, e.target.checked)}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                  </td>
                  
                  <td style={{ padding: '14px 20px' }}>
                    <Link to={`/applications/verify/${app._id}`} style={{ fontSize: '13.5px', fontWeight: 700, color: '#2563EB', textDecoration: 'none' }}>
                      {app.applicationRefNo}
                    </Link>
                  </td>
                  
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: '#EFF6FF',
                        color: '#2563EB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 700
                      }}>
                        {getCitizenInitials(app.applicantName || 'Citizen')}
                      </div>
                      <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#0F172A' }}>{app.applicantName || 'N/A'}</span>
                    </div>
                  </td>
                  
                  <td style={{ padding: '14px 20px', fontSize: '13.5px', color: '#475569' }}>{app.serviceName}</td>
                  
                  <td style={{ padding: '14px 20px' }}>{getPriorityBadge(app)}</td>
                  
                  <td style={{ padding: '14px 20px' }}>{getStatusBadge(app.status)}</td>
                  
                  <td style={{ padding: '14px 20px', fontSize: '13.5px', fontWeight: 500, color: '#475569' }}>
                    {app.assignedOperatorName || 'Unassigned'}
                  </td>
                  
                  <td style={{ padding: '14px 20px', fontSize: '13px', color: '#64748B' }}>
                    {formatSubmittedDate(app.createdAt)}
                  </td>
                  
                  <td style={{ padding: '14px 20px', fontSize: '13px' }}>{getSlaBadge(app)}</td>
                  
                  <td style={{ padding: '14px 20px', fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                    ₹{app.totalAmount.toLocaleString()}
                  </td>
                  
                  <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                    <Link to={`/applications/verify/${app._id}`} style={{ color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Footer Pagination Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', borderTop: '1.5px solid #E2E8F0', backgroundColor: '#FFFFFF' }}>
          <span style={{ fontSize: '13px', color: '#64748B' }}>
            Showing 1-{apps.length} of {totalCount} today's applications
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page === 1}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  border: '1.5px solid #E2E8F0',
                  backgroundColor: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: page === 1 ? 'default' : 'pointer',
                  opacity: page === 1 ? 0.5 : 1
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
              </button>

              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: page === p ? '#2563EB' : 'transparent',
                    color: page === p ? '#FFFFFF' : '#475569',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {p}
                </button>
              ))}

              <button
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  border: '1.5px solid #E2E8F0',
                  backgroundColor: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: page === totalPages ? 'default' : 'pointer',
                  opacity: page === totalPages ? 0.5 : 1
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748B' }}>
              <span>Rows per page:</span>
              <select style={{ padding: '4px 8px', border: '1.5px solid #E2E8F0', borderRadius: '6px', backgroundColor: '#FFFFFF', fontWeight: 600 }}>
                <option>8</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Batch Actions panel */}
      {selectedIds.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1.5px solid #E2E8F0',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          zIndex: 100,
          animation: 'slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={true}
              onChange={() => setSelectedIds([])}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '14.5px', fontWeight: 700, color: '#0F172A' }}>{selectedIds.length} applications selected</span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              border: '1.5px solid #E2E8F0',
              borderRadius: '8px',
              backgroundColor: '#FFFFFF',
              color: '#334155',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer'
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
              Batch Assign
            </button>

            <button style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              border: '1.5px solid #E2E8F0',
              borderRadius: '8px',
              backgroundColor: '#FFFFFF',
              color: '#EF4444',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer'
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Escalate Selected
            </button>

            <button style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: '#2563EB',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(37,99,235,0.1)'
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Bulk Approve
            </button>
          </div>
          <style>{`@keyframes slideUp { from { transform: translate(-50%, 20px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }`}</style>
        </div>
      )}

      {isNewAppModalOpen && (
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
            maxWidth: '520px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1.5px solid #F1F5F9' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                {newAppStep === 1 ? 'Step 1: Check Citizen Profile' : newAppStep === 2 ? 'Step 2: Register Citizen Profile' : 'Step 3: Select Service'}
              </h3>
              <button
                onClick={() => setIsNewAppModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px' }}>
              {newAppStep === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <p style={{ color: '#475569', fontSize: '14px', margin: 0 }}>
                    Enter the citizen's mobile number to search if they already have a registered profile.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mobile Number</label>
                    <input
                      type="text"
                      placeholder="Enter 10-digit mobile number"
                      maxLength={10}
                      value={citizenPhone}
                      onChange={e => setCitizenPhone(e.target.value.replace(/\D/g, ''))}
                      style={{ padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '14.5px', outline: 'none' }}
                    />
                  </div>
                  <button
                    onClick={handleCheckPhone}
                    disabled={checkingPhone}
                    style={{
                      padding: '12px',
                      backgroundColor: '#2563EB',
                      color: '#FFFFFF',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      marginTop: '8px'
                    }}
                  >
                    {checkingPhone ? 'Checking...' : 'Check Citizen Profile'}
                  </button>
                </div>
              )}

              {newAppStep === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ backgroundColor: '#FFFBEB', border: '1.5px solid #FDE68A', padding: '12px', borderRadius: '8px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ fontSize: '20px' }}>⚠️</span>
                    <span style={{ fontSize: '13px', color: '#92400E', fontWeight: 600 }}>Citizen not found. Please fill in details below to register their profile first.</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Priya Sharma"
                      value={citizenName}
                      onChange={e => setCitizenName(e.target.value)}
                      style={{ padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '14.5px', outline: 'none' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Address</label>
                    <input
                      type="email"
                      placeholder="name@example.com"
                      value={citizenEmail}
                      onChange={e => setCitizenEmail(e.target.value)}
                      style={{ padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '14.5px', outline: 'none' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Aadhaar Number (Optional)</label>
                    <input
                      type="text"
                      placeholder="12-digit Aadhaar number"
                      maxLength={12}
                      value={citizenAadhaar}
                      onChange={e => setCitizenAadhaar(e.target.value.replace(/\D/g, ''))}
                      style={{ padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '14.5px', outline: 'none' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                      <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>State</label>
                      <select
                        value={citizenState}
                        onChange={e => {
                          const val = e.target.value;
                          setCitizenState(val);
                          const associated = STATE_DISTRICTS[val] || [];
                          if (associated.length > 0) setCitizenDistrict(associated[0]);
                        }}
                        style={{ padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '14.5px', outline: 'none', backgroundColor: '#FFFFFF' }}
                      >
                        {Object.keys(STATE_DISTRICTS).map(st => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                      <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>District</label>
                      <select
                        value={citizenDistrict}
                        onChange={e => setCitizenDistrict(e.target.value)}
                        style={{ padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '14.5px', outline: 'none', backgroundColor: '#FFFFFF' }}
                      >
                        {(STATE_DISTRICTS[citizenState] || []).map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                    <button
                      onClick={() => setNewAppStep(1)}
                      style={{ padding: '10px 18px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '13.5px', fontWeight: 700, backgroundColor: '#FFFFFF', color: '#475569', cursor: 'pointer' }}
                    >
                      Back
                    </button>
                    <button
                      onClick={handleRegisterCitizen}
                      disabled={registeringCitizen}
                      style={{ padding: '10px 18px', border: 'none', borderRadius: '8px', fontSize: '13.5px', fontWeight: 700, backgroundColor: '#2563EB', color: '#FFFFFF', cursor: 'pointer' }}
                    >
                      {registeringCitizen ? 'Registering...' : 'Register Citizen'}
                    </button>
                  </div>
                </div>
              )}

              {newAppStep === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ backgroundColor: '#EFF6FF', border: '1.5px solid #BFDBFE', padding: '12px', borderRadius: '8px' }}>
                    <p style={{ margin: 0, fontSize: '13.5px', color: '#1E40AF', fontWeight: 700 }}>Citizen: {citizenName}</p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12.5px', color: '#1E40AF' }}>Phone: {citizenPhone}</p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Choose Service *</label>
                    <select
                      value={selectedServiceId}
                      onChange={e => setSelectedServiceId(e.target.value)}
                      style={{ padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '14.5px', outline: 'none', backgroundColor: '#FFFFFF' }}
                    >
                      {services.map(s => (
                        <option key={s._id} value={s._id}>{s.name} (Govt Fee: ₹{s.govtFee / 100})</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                      <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date of Birth</label>
                      <input
                        type="text"
                        placeholder="DD/MM/YYYY"
                        value={dob}
                        onChange={e => setDob(e.target.value)}
                        style={{ padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '14.5px', outline: 'none' }}
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                      <label style={{ fontSize: '12px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gender</label>
                      <select
                        value={gender}
                        onChange={e => setGender(e.target.value)}
                        style={{ padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '14.5px', outline: 'none', backgroundColor: '#FFFFFF' }}
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                    <button
                      onClick={() => setNewAppStep(1)}
                      style={{ padding: '10px 18px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '13.5px', fontWeight: 700, backgroundColor: '#FFFFFF', color: '#475569', cursor: 'pointer' }}
                    >
                      Back
                    </button>
                    <button
                      onClick={handleSubmitApplication}
                      disabled={submittingApp}
                      style={{ padding: '10px 18px', border: 'none', borderRadius: '8px', fontSize: '13.5px', fontWeight: 700, backgroundColor: '#2563EB', color: '#FFFFFF', cursor: 'pointer' }}
                    >
                      {submittingApp ? 'Submitting...' : 'Create Application'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
