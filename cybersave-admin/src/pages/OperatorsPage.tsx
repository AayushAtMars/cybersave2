import React, { useEffect, useState } from 'react';
import { adminClient } from '../api/client';

interface Operator {
  _id: string;
  name: string;
  email: string;
  employeeId: string;
  department: string;
  role: 'operator' | 'admin' | 'super_admin';
  status: 'active' | 'pending' | 'suspended';
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export default function OperatorsPage() {
  const [ops, setOps] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [selectedOp, setSelectedOp] = useState<Operator | null>(null);

  // Filters State
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All Departments');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [page, setPage] = useState(1);

  // Form State for creating new operator
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [department, setDepartment] = useState('IT & Infrastructure');
  const [role, setRole] = useState<'operator' | 'admin' | 'super_admin'>('operator');
  const [permissions, setPermissions] = useState<string[]>(['verify_documents', 'approve_applications']);

  const fetchOperators = async () => {
    setLoading(true);
    try {
      const { data } = await adminClient.get('/auth/admin/operators?limit=100');
      setOps(data.data.items || []);
    } catch (err) {
      console.error('Failed to fetch operators', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperators();

    const handleOpenModal = () => setIsCreateModalOpen(true);
    window.addEventListener('open-add-operator-modal', handleOpenModal);
    return () => window.removeEventListener('open-add-operator-modal', handleOpenModal);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const perms = role === 'super_admin' 
        ? ['verify_documents', 'approve_applications', 'reject_applications', 'escalate_to_admin', 'access_citizen_pii', 'view_transactions', 'manage_tickets']
        : role === 'admin'
        ? ['verify_documents', 'approve_applications', 'reject_applications', 'escalate_to_admin']
        : ['verify_documents', 'approve_applications'];

      await adminClient.post('/auth/admin/operators', {
        name,
        email,
        employeeId,
        department,
        role,
        permissions: perms,
      });

      alert('Operator account created successfully');
      setIsCreateModalOpen(false);
      setName('');
      setEmail('');
      setEmployeeId('');
      fetchOperators();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create operator');
    }
  };

  const handleUpdateStatus = async (id: string, nextStatus: 'active' | 'suspended' | 'pending') => {
    try {
      await adminClient.patch(`/auth/admin/operators/${id}/status`, { status: nextStatus });
      alert(`Operator status updated to ${nextStatus}`);
      setIsAccessModalOpen(false);
      fetchOperators();
    } catch (err) {
      alert('Failed to update operator status');
    }
  };

  // Filter logic
  const filteredOps = ops.filter(o => {
    const matchesSearch = 
      o.name.toLowerCase().includes(search.toLowerCase()) || 
      o.email.toLowerCase().includes(search.toLowerCase()) ||
      o.employeeId.toLowerCase().includes(search.toLowerCase());

    const matchesDept = deptFilter === 'All Departments' || o.department === deptFilter;
    const matchesStatus = statusFilter === 'All Statuses' || o.status === statusFilter.toLowerCase();

    return matchesSearch && matchesDept && matchesStatus;
  });

  // Pagination logic
  const limit = 9;
  const totalPages = Math.ceil(filteredOps.length / limit);
  const paginatedOps = filteredOps.slice((page - 1) * limit, page * limit);

  // Stats
  const totalCount = ops.length;
  const activeCount = ops.filter(o => o.status === 'active').length;
  const pendingCount = ops.filter(o => o.status === 'pending').length;
  const suspendedCount = ops.filter(o => o.status === 'suspended').length;

  const getRoleLabel = (role: string) => {
    if (role === 'super_admin') return 'System Admin';
    if (role === 'admin') return 'Senior Analyst';
    return 'Field Operator';
  };

  const getInitials = (fullName: string) => {
    return fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getAvatarColor = (name: string) => {
    const colors = ['#2563EB', '#059669', '#D97706', '#DC2626', '#7C3AED', '#0891B2', '#DB2777', '#16A34A'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const getLastActiveText = (o: Operator) => {
    if (o.status === 'pending') return 'Never';
    const lastActiveSim = {
      'Arjun Mehta': '2 mins ago',
      'Elena Rostova': '1 hour ago',
      'Marcus Vance': '45 mins ago',
      'Chen Wei': '3 hours ago',
      'Tariq Al-Mansoor': '12 mins ago',
      'Emily Watson': '1 day ago',
      'Rahul Operator': '5 mins ago',
      'Super Admin': 'Just now'
    }[o.name];

    if (lastActiveSim) return lastActiveSim;
    if (o.status === 'suspended') return '5 days ago';
    return 'Active recently';
  };

  return (
    <div style={{ padding: '32px', backgroundColor: '#F8FAFC', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      {/* Breadcrumbs & Export */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748B', fontWeight: 600 }}>
          <span>Dashboard</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          <span style={{ color: '#2563EB' }}>Operators</span>
        </div>
        <button
          onClick={() => {
            const csvContent = "data:text/csv;charset=utf-8," 
              + ["Employee ID,Name,Email,Department,Role,Status"].join(",") + "\n"
              + ops.map(o => `"${o.employeeId}","${o.name}","${o.email}","${o.department}","${o.role}","${o.status}"`).join("\n");
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `operators_report_${new Date().toISOString().slice(0,10)}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: '#FFFFFF',
            border: '1.5px solid #E2E8F0',
            borderRadius: '8px',
            fontSize: '13.5px',
            fontWeight: 700,
            color: '#334155',
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
          }}
        >
          Export Report
        </button>
      </div>

      {/* Page Title */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 850, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>Operator Management Center</h1>
        <p style={{ fontSize: '14.5px', color: '#64748B', marginTop: '4px', fontWeight: 500 }}>Manage, monitor and track all platform operators and their access levels.</p>
      </div>

      {/* Stats Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        {/* Total Operators */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '16px', border: '1.5px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.01)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Operators</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 850, color: '#0F172A', margin: 0 }}>{totalCount}</h2>
          <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: 550, marginTop: '4px', display: 'block' }}>Active across portal</span>
        </div>

        {/* Active */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '16px', border: '1.5px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.01)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#E6FDF3', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 850, color: '#0F172A', margin: 0 }}>{activeCount}</h2>
          <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: 550, marginTop: '4px', display: 'block' }}>Secured & validated</span>
        </div>

        {/* Pending Approval */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '16px', border: '1.5px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.01)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending Approval</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#FFFBEB', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 850, color: '#0F172A', margin: 0 }}>{pendingCount}</h2>
          <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: 550, marginTop: '4px', display: 'block' }}>Awaiting validation</span>
        </div>

        {/* Suspended */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '16px', border: '1.5px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.01)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Suspended</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#FEE2E2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </div>
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 850, color: '#0F172A', margin: 0 }}>{suspendedCount}</h2>
          <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: 550, marginTop: '4px', display: 'block' }}>Access revoked</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px', padding: '16px 20px', backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1.5px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              placeholder="Filter operators..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                border: '1.5px solid #E2E8F0',
                borderRadius: '8px',
                fontSize: '13.5px',
                fontWeight: 600,
                color: '#1E293B',
                outline: 'none'
              }}
            />
            <span style={{ position: 'absolute', left: '12px', top: '10px', color: '#94A3B8' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </span>
          </div>

          {/* Department Filter */}
          <select
            value={deptFilter}
            onChange={e => { setDeptFilter(e.target.value); setPage(1); }}
            style={{
              padding: '9px 12px',
              border: '1.5px solid #E2E8F0',
              borderRadius: '8px',
              fontSize: '13.5px',
              fontWeight: 700,
              color: '#334155',
              outline: 'none',
              backgroundColor: '#FFFFFF',
              cursor: 'pointer'
            }}
          >
            <option value="All Departments">All Departments</option>
            <option value="IT & Infrastructure">IT & Infrastructure</option>
            <option value="Threat Intelligence">Threat Intelligence</option>
            <option value="Incident Response">Incident Response</option>
            <option value="Risk Assessment">Risk Assessment</option>
            <option value="Birth & Identity Verification">Birth & Identity Verification</option>
            <option value="IT Security Administration">IT Security Administration</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            style={{
              padding: '9px 12px',
              border: '1.5px solid #E2E8F0',
              borderRadius: '8px',
              fontSize: '13.5px',
              fontWeight: 700,
              color: '#334155',
              outline: 'none',
              backgroundColor: '#FFFFFF',
              cursor: 'pointer'
            }}
          >
            <option value="All Statuses">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>

        <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748B' }}>
          Showing {filteredOps.length === 0 ? 0 : (page - 1) * limit + 1}-{Math.min(page * limit, filteredOps.length)} of {filteredOps.length}
        </span>
      </div>

      {/* Operators Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', fontSize: '14.5px', color: '#64748B', fontWeight: 600 }}>Loading platform operators...</div>
      ) : filteredOps.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1.5px solid #E2E8F0' }}>
          <span style={{ fontSize: '14.5px', color: '#64748B', fontWeight: 600 }}>No operators match your filter criteria.</span>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px', marginBottom: '28px' }}>
          {paginatedOps.map(o => {
            const avatarColor = getAvatarColor(o.name);
            const initials = getInitials(o.name);
            
            return (
              <div key={o._id} style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1.5px solid #E2E8F0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.01)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Profile row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '24px', backgroundColor: avatarColor, color: '#FFFFFF', display: 'flex', alignItems: 'center', fontSize: '15px', fontWeight: 800, justifyContent: 'center' }}>
                      {initials}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '15.5px', fontWeight: 800, color: '#0F172A', margin: 0 }}>{o.name}</h4>
                      <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, display: 'block', marginTop: '2px' }}>{getRoleLabel(o.role)}</span>
                    </div>
                  </div>

                  <span style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    textTransform: 'capitalize',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    backgroundColor: o.status === 'active' ? '#E6FDF3' : o.status === 'suspended' ? '#FEE2E2' : '#FFFBEB',
                    color: o.status === 'active' ? '#10B981' : o.status === 'suspended' ? '#EF4444' : '#F59E0B'
                  }}>
                    {o.status}
                  </span>
                </div>

                {/* Details List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1.5px solid #F1F5F9', borderBottom: '1.5px solid #F1F5F9', padding: '14px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#64748B', fontWeight: 650 }}>Department</span>
                    <span style={{ color: '#0F172A', fontWeight: 750 }}>{o.department}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#64748B', fontWeight: 650 }}>Joined Date</span>
                    <span style={{ color: '#0F172A', fontWeight: 750 }}>{new Date(o.createdAt).toLocaleDateString('en-GB')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#64748B', fontWeight: 650 }}>Last Active</span>
                    <span style={{ color: '#0F172A', fontWeight: 750 }}>{getLastActiveText(o)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => { setSelectedOp(o); setIsViewModalOpen(true); }}
                    style={{
                      flex: 1,
                      padding: '8px 14px',
                      backgroundColor: '#FFFFFF',
                      border: '1.5px solid #E2E8F0',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: '#475569',
                      cursor: 'pointer'
                    }}
                  >
                    View Profile
                  </button>
                  <button
                    onClick={() => { setSelectedOp(o); setIsAccessModalOpen(true); }}
                    style={{
                      flex: 1,
                      padding: '8px 14px',
                      backgroundColor: '#2563EB',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: '#FFFFFF',
                      cursor: 'pointer'
                    }}
                  >
                    Manage Access
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1.5px solid #E2E8F0' }}>
        <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>
          Showing {filteredOps.length} active operators
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
              fontWeight: 650,
              color: '#64748B',
              cursor: page === 1 ? 'default' : 'pointer',
              opacity: page === 1 ? 0.5 : 1
            }}
          >
            Previous
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
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
                fontWeight: 750,
                cursor: 'pointer'
              }}
            >
              {pageNum}
            </button>
          ))}

          <button
            onClick={() => setPage(p => Math.min(p + 1, totalPages))}
            disabled={page === totalPages || totalPages === 0}
            style={{
              padding: '6px 12px',
              border: '1.5px solid #E2E8F0',
              borderRadius: '6px',
              backgroundColor: '#FFFFFF',
              fontSize: '12.5px',
              fontWeight: 650,
              color: '#64748B',
              cursor: page === totalPages ? 'default' : 'pointer',
              opacity: page === totalPages ? 0.5 : 1
            }}
          >
            Next
          </button>
        </div>
      </div>

      {/* View Profile Modal */}
      {isViewModalOpen && selectedOp && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', display: 'flex', alignItems: 'center', zIndex: 1000, justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', width: '100%', maxWidth: '480px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1.5px solid #F1F5F9', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Operator Profile</h3>
              <button onClick={() => setIsViewModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '32px', backgroundColor: getAvatarColor(selectedOp.name), color: '#FFFFFF', display: 'flex', alignItems: 'center', fontSize: '20px', fontWeight: 850, justifyContent: 'center' }}>
                {getInitials(selectedOp.name)}
              </div>
              <div style={{ textAlign: 'center' }}>
                <h4 style={{ fontSize: '18px', fontWeight: 850, color: '#0F172A', margin: 0 }}>{selectedOp.name}</h4>
                <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600, display: 'block', marginTop: '2px' }}>{getRoleLabel(selectedOp.role)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Employee ID</span>
                <span style={{ fontSize: '14px', color: '#0F172A', fontWeight: 700 }}>{selectedOp.employeeId}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Email Address</span>
                <span style={{ fontSize: '14px', color: '#0F172A', fontWeight: 700 }}>{selectedOp.email}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Department</span>
                <span style={{ fontSize: '14px', color: '#0F172A', fontWeight: 700 }}>{selectedOp.department}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Permissions</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                  {selectedOp.permissions.map(p => (
                    <span key={p} style={{ fontSize: '11px', fontWeight: 750, color: '#475569', backgroundColor: '#F1F5F9', padding: '3px 8px', borderRadius: '4px' }}>
                      {p.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsViewModalOpen(false)}
              style={{ width: '100%', padding: '10px', backgroundColor: '#F1F5F9', color: '#475569', fontWeight: 700, borderRadius: '8px', border: '1.5px solid #E2E8F0', cursor: 'pointer' }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Manage Access Modal */}
      {isAccessModalOpen && selectedOp && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', display: 'flex', alignItems: 'center', zIndex: 1000, justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', width: '100%', maxWidth: '440px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1.5px solid #F1F5F9', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Manage Access: {selectedOp.name}</h3>
              <button onClick={() => setIsAccessModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                ✕
              </button>
            </div>

            <p style={{ fontSize: '13.5px', color: '#64748B', fontWeight: 550, marginBottom: '20px' }}>
              Select a status for this operator. Suspended operators cannot log in or verify citizen applications.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              {/* Active */}
              <button
                onClick={() => handleUpdateStatus(selectedOp._id, 'active')}
                style={{
                  padding: '12px 16px',
                  backgroundColor: selectedOp.status === 'active' ? '#E6FDF3' : '#FFFFFF',
                  color: selectedOp.status === 'active' ? '#10B981' : '#475569',
                  border: selectedOp.status === 'active' ? '1.5px solid #10B981' : '1.5px solid #E2E8F0',
                  borderRadius: '10px',
                  fontWeight: 750,
                  fontSize: '14px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span>Active Status</span>
                {selectedOp.status === 'active' && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
              </button>

              {/* Pending */}
              <button
                onClick={() => handleUpdateStatus(selectedOp._id, 'pending')}
                style={{
                  padding: '12px 16px',
                  backgroundColor: selectedOp.status === 'pending' ? '#FFFBEB' : '#FFFFFF',
                  color: selectedOp.status === 'pending' ? '#F59E0B' : '#475569',
                  border: selectedOp.status === 'pending' ? '1.5px solid #F59E0B' : '1.5px solid #E2E8F0',
                  borderRadius: '10px',
                  fontWeight: 750,
                  fontSize: '14px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span>Pending Approval</span>
                {selectedOp.status === 'pending' && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
              </button>

              {/* Suspended */}
              <button
                onClick={() => handleUpdateStatus(selectedOp._id, 'suspended')}
                style={{
                  padding: '12px 16px',
                  backgroundColor: selectedOp.status === 'suspended' ? '#FEE2E2' : '#FFFFFF',
                  color: selectedOp.status === 'suspended' ? '#EF4444' : '#475569',
                  border: selectedOp.status === 'suspended' ? '1.5px solid #EF4444' : '1.5px solid #E2E8F0',
                  borderRadius: '10px',
                  fontWeight: 750,
                  fontSize: '14px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span>Suspended</span>
                {selectedOp.status === 'suspended' && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
              </button>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setIsAccessModalOpen(false)}
                style={{ flex: 1, padding: '10px', backgroundColor: '#F1F5F9', color: '#475569', fontWeight: 700, borderRadius: '8px', border: '1.5px solid #E2E8F0', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Operator Modal */}
      {isCreateModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', display: 'flex', alignItems: 'center', zIndex: 1000, justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', width: '100%', maxWidth: '480px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1.5px solid #F1F5F9', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Register New Operator</h3>
              <button onClick={() => setIsCreateModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Full Name</span>
                <input type="text" placeholder="e.g. Arjun Mehta" value={name} onChange={e => setName(e.target.value)} required style={{ padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Email Address</span>
                <input type="email" placeholder="e.g. arjun.mehta@cybersave.in" value={email} onChange={e => setEmail(e.target.value)} required style={{ padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Employee ID</span>
                <input type="text" placeholder="e.g. EMP-2024-002" value={employeeId} onChange={e => setEmployeeId(e.target.value)} required style={{ padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Department</span>
                  <select value={department} onChange={e => setDepartment(e.target.value)} style={{ padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', outline: 'none', backgroundColor: '#FFFFFF' }}>
                    <option value="IT & Infrastructure">IT & Infrastructure</option>
                    <option value="Threat Intelligence">Threat Intelligence</option>
                    <option value="Incident Response">Incident Response</option>
                    <option value="Risk Assessment">Risk Assessment</option>
                    <option value="Birth & Identity Verification">Birth & Identity Verification</option>
                    <option value="IT Security Administration">IT Security Administration</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Role</span>
                  <select value={role} onChange={e => setRole(e.target.value as any)} style={{ padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', outline: 'none', backgroundColor: '#FFFFFF' }}>
                    <option value="operator">Field Operator</option>
                    <option value="admin">Senior Analyst</option>
                    <option value="super_admin">System Admin</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="submit" style={{ flex: 1, padding: '12px', backgroundColor: '#2563EB', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
                  Register Account
                </button>
                <button type="button" onClick={() => setIsCreateModalOpen(false)} style={{ flex: 1, padding: '12px', backgroundColor: '#F1F5F9', border: '1.5px solid #E2E8F0', borderRadius: '8px', color: '#475569', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
