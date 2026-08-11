import React, { useEffect, useState } from 'react';
import { adminClient } from '../api/client';

interface SystemNotification {
  _id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [priorityFilter, setPriorityFilter] = useState('All Priorities');
  const [page, setPage] = useState(1);

  // Preference Settings State
  const [isPrefsModalOpen, setIsPrefsModalOpen] = useState(false);
  const [prefs, setPrefs] = useState({
    securityAlerts: true,
    systemUpdates: true,
    paymentReminders: true,
    complianceSync: true,
    emailChannel: true,
    smsChannel: false,
    inAppChannel: true,
  });

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data } = await adminClient.get('/notifications/admin');
      setNotifications(data.data.items || []);
    } catch (err) {
      console.error('Failed to fetch system notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const savedPrefs = localStorage.getItem('notification_preferences');
    if (savedPrefs) {
      try {
        setPrefs(JSON.parse(savedPrefs));
      } catch (e) {
        console.error(e);
      }
    }

    // Listen for custom trigger to mark all as read from the topbar
    const handleMarkAllRead = async () => {
      try {
        await adminClient.post('/notifications/admin/read-all');
        fetchNotifications();
      } catch (err) {
        console.error('Failed to mark all as read', err);
      }
    };
    window.addEventListener('mark-all-notifications-read', handleMarkAllRead);
    return () => window.removeEventListener('mark-all-notifications-read', handleMarkAllRead);
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await adminClient.patch(`/notifications/admin/${id}/read`);
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark alert as read', err);
    }
  };

  const handleView = (n: SystemNotification) => {
    alert(`[Notification Detail]\n\nID: ${getNtfId(n)}\nCategory: ${getCategoryLabel(n.type)}\n\nTitle: ${n.title}\nDescription: ${n.body}`);
    if (!n.read) {
      handleMarkRead(n._id);
    }
  };

  // Helper mappings
  const getNtfId = (n: SystemNotification) => {
    // Generate simulated ID based on database timestamps to look clean and static
    const year = new Date(n.createdAt).getFullYear();
    const indexStr = n._id.slice(-2).toUpperCase();
    return `NTF-${year}-${indexStr}`;
  };

  const getCategoryLabel = (type: string) => {
    return type.toUpperCase().replace(/_/g, ' ');
  };

  const getPriority = (type: string) => {
    if (type === 'security_alert') return 'High';
    if (type === 'expiry_warning' || type === 'payment_reminder') return 'Medium';
    return 'Low';
  };

  const getRelativeTime = (createdAt: string) => {
    const diffMs = Date.now() - new Date(createdAt).getTime();
    const diffMins = Math.floor(diffMs / (60 * 1000));
    const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

    if (diffMins < 60) return `${Math.max(diffMins, 1)} mins ago`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  };

  const getIconConfig = (type: string) => {
    switch (type) {
      case 'security_alert':
        return {
          bg: '#FEE2E2',
          color: '#EF4444',
          svg: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          )
        };
      case 'expiry_warning':
      case 'payment_reminder':
        return {
          bg: '#FFFBEB',
          color: '#F59E0B',
          svg: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          )
        };
      case 'document_verification':
      case 'system_update':
      case 'compliance_sync':
        return {
          bg: '#E6FDF3',
          color: '#10B981',
          svg: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          )
        };
      default:
        return {
          bg: '#EFF6FF',
          color: '#2563EB',
          svg: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
          )
        };
    }
  };

  // Filter Logic
  const filteredAlerts = notifications.filter(n => {
    const matchesSearch = 
      n.title.toLowerCase().includes(search.toLowerCase()) || 
      n.body.toLowerCase().includes(search.toLowerCase()) ||
      n.type.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = categoryFilter === 'All Categories' || getCategoryLabel(n.type) === categoryFilter.toUpperCase();
    const matchesPriority = priorityFilter === 'All Priorities' || getPriority(n.type) === priorityFilter;

    return matchesSearch && matchesCategory && matchesPriority;
  });

  // Pagination
  const limit = 8;
  const totalPages = Math.ceil(filteredAlerts.length / limit);
  const paginatedAlerts = filteredAlerts.slice((page - 1) * limit, page * limit);

  // Stats Card Counts
  const totalNotifications = notifications.length;
  const unreadCount = notifications.filter(n => !n.read).length;
  const successCount = notifications.filter(n => ['document_verification', 'system_update', 'compliance_sync'].includes(n.type)).length;
  const pendingCount = notifications.filter(n => ['document_upload'].includes(n.type)).length;

  return (
    <div style={{ padding: '32px', backgroundColor: '#F8FAFC', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      {/* Breadcrumbs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748B', fontWeight: 600 }}>
          <span>Dashboard</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          <span style={{ color: '#2563EB' }}>Notifications</span>
        </div>
        <button
          onClick={() => setIsPrefsModalOpen(true)}
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
          Preferences Settings
        </button>
      </div>

      {/* Page Title */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 850, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>Notification Center</h1>
        <p style={{ fontSize: '14.5px', color: '#64748B', marginTop: '4px', fontWeight: 500 }}>Monitor system activity, security alerts, driver updates, and real-time operations.</p>
      </div>

      {/* Stats Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        {/* Total Notifications */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '16px', border: '1.5px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.01)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>All Notifications</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            </div>
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 850, color: '#0F172A', margin: 0 }}>{totalNotifications}</h2>
          <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: 550, marginTop: '4px', display: 'block' }}>Total history</span>
        </div>

        {/* Unread Alerts */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '16px', border: '1.5px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.01)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Unread Alerts</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#FEE2E2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 850, color: '#0F172A', margin: 0 }}>{unreadCount}</h2>
          <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: 550, marginTop: '4px', display: 'block' }}>Action required</span>
        </div>

        {/* Success Logs */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '16px', border: '1.5px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.01)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Success Logs</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#E6FDF3', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 850, color: '#0F172A', margin: 0 }}>{successCount}</h2>
          <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: 550, marginTop: '4px', display: 'block' }}>System verified</span>
        </div>

        {/* Pending Checks */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '16px', border: '1.5px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.01)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending Checks</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#FFFBEB', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 850, color: '#0F172A', margin: 0 }}>{pendingCount}</h2>
          <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: 550, marginTop: '4px', display: 'block' }}>Awaiting system sync</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px', padding: '16px 20px', backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1.5px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              placeholder="Filter alerts or category..."
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

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
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
            <option value="All Categories">All Categories</option>
            <option value="Security Alert">Security Alert</option>
            <option value="Expiry Warning">Expiry Warning</option>
            <option value="Document Verification">Document Verification</option>
            <option value="Document Upload">Document Upload</option>
            <option value="Payment Reminder">Payment Reminder</option>
            <option value="System Update">System Update</option>
            <option value="Support Tickets">Support Tickets</option>
            <option value="Compliance Sync">Compliance Sync</option>
          </select>

          {/* Priority Dropdown */}
          <select
            value={priorityFilter}
            onChange={e => { setPriorityFilter(e.target.value); setPage(1); }}
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
            <option value="All Priorities">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748B' }}>
          Showing {filteredAlerts.length === 0 ? 0 : (page - 1) * limit + 1}-{Math.min(page * limit, filteredAlerts.length)} of {filteredAlerts.length}
        </span>
      </div>

      {/* Notifications List Container */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', fontSize: '14.5px', color: '#64748B', fontWeight: 600 }}>Loading system notifications...</div>
        ) : filteredAlerts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1.5px solid #E2E8F0' }}>
            <span style={{ fontSize: '14.5px', color: '#64748B', fontWeight: 600 }}>No alerts match your filter criteria.</span>
          </div>
        ) : (
          paginatedAlerts.map(n => {
            const iconConf = getIconConfig(n.type);
            const ntfId = getNtfId(n);
            
            return (
              <div
                key={n._id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  border: '1.5px solid #E2E8F0',
                  padding: '20px 24px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.01)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px',
                  justifyContent: 'space-between',
                  position: 'relative',
                  opacity: n.read ? 0.8 : 1,
                  transition: 'opacity 0.2s'
                }}
              >
                {/* Left side info block */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: 0 }}>
                  {/* Unread blue dot indicator */}
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: n.read ? 'transparent' : '#2563EB', flexShrink: 0 }} />

                  {/* Icon badge */}
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      backgroundColor: iconConf.bg,
                      color: iconConf.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    {iconConf.svg}
                  </div>

                  {/* Message body */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B' }}>{ntfId}</span>
                      <span style={{ fontSize: '3px', color: '#64748B' }}>●</span>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: iconConf.color, letterSpacing: '0.02em' }}>{getCategoryLabel(n.type)}</span>
                    </div>
                    <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', margin: 0, lineHeight: 1.3 }}>{n.title}</h4>
                    <p style={{ fontSize: '13px', color: '#64748B', fontWeight: 550, margin: '4px 0 0 0', lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {n.body}
                    </p>
                  </div>
                </div>

                {/* Right side controls block */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
                  <span style={{ fontSize: '12.5px', color: '#94A3B8', fontWeight: 600 }}>{getRelativeTime(n.createdAt)}</span>
                  
                  <button
                    onClick={() => handleView(n)}
                    style={{
                      padding: '6px 14px',
                      backgroundColor: '#FFFFFF',
                      border: '1.5px solid #E2E8F0',
                      borderRadius: '8px',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      color: '#475569',
                      cursor: 'pointer'
                    }}
                  >
                    View
                  </button>

                  <button
                    onClick={() => handleMarkRead(n._id)}
                    disabled={n.read}
                    style={{
                      width: '32px',
                      height: '32px',
                      backgroundColor: n.read ? '#F1F5F9' : '#FFFFFF',
                      border: '1.5px solid #E2E8F0',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: n.read ? 'default' : 'pointer',
                      color: n.read ? '#94A3B8' : '#10B981'
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          }))}
        </div>

      {/* Pagination Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1.5px solid #E2E8F0' }}>
        <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>
          Showing {filteredAlerts.length} active alerts
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
      {/* Preferences Settings Modal */}
      {isPrefsModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', display: 'flex', alignItems: 'center', zIndex: 1000, justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', width: '100%', maxWidth: '480px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1.5px solid #F1F5F9', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Notification Preferences</h3>
              <button onClick={() => setIsPrefsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: '16px', fontWeight: 'bold' }}>
                ✕
              </button>
            </div>

            {/* Alert Categories settings */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>Event Categories</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  { key: 'securityAlerts', label: 'Security Alerts', desc: 'Critical alerts (suspicious logins, threats).' },
                  { key: 'systemUpdates', label: 'System & Document Updates', desc: 'Alerts on document approvals and operator registration.' },
                  { key: 'paymentReminders', label: 'Payments & Billings', desc: 'Reminders about billing updates and gateway transactions.' },
                  { key: 'complianceSync', label: 'Compliance Auditing', desc: 'Logs on external compliance sync and exports.' },
                ].map(item => (
                  <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '13.5px', fontWeight: 750, color: '#1E293B', display: 'block' }}>{item.label}</span>
                      <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginTop: '2px' }}>{item.desc}</span>
                    </div>
                    <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '20px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={(prefs as any)[item.key]}
                        onChange={e => setPrefs(prev => ({ ...prev, [item.key]: e.target.checked }))}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: (prefs as any)[item.key] ? '#2563EB' : '#CBD5E1',
                        borderRadius: '20px', transition: '0.2s',
                        display: 'flex', alignItems: 'center', padding: '2px'
                      }}>
                        <span style={{
                          width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#FFFFFF',
                          transition: '0.2s', transform: (prefs as any)[item.key] ? 'translateX(20px)' : 'translateX(0)'
                        }} />
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Notification channels settings */}
            <div style={{ marginBottom: '24px', borderTop: '1.5px solid #F1F5F9', paddingTop: '16px' }}>
              <h4 style={{ fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>Dispatch Channels</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  { key: 'inAppChannel', label: 'In-App Alerts', desc: 'Receive real-time notifications in Notification Center.' },
                  { key: 'emailChannel', label: 'Email Notifications', desc: 'Send daily summary logs to Rajesh Kumar.' },
                  { key: 'smsChannel', label: 'SMS Alerts', desc: 'Push immediate SMS on High priority security incidents.' },
                ].map(item => (
                  <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '13.5px', fontWeight: 750, color: '#1E293B', display: 'block' }}>{item.label}</span>
                      <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginTop: '2px' }}>{item.desc}</span>
                    </div>
                    <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '20px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={(prefs as any)[item.key]}
                        onChange={e => setPrefs(prev => ({ ...prev, [item.key]: e.target.checked }))}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: (prefs as any)[item.key] ? '#2563EB' : '#CBD5E1',
                        borderRadius: '20px', transition: '0.2s',
                        display: 'flex', alignItems: 'center', padding: '2px'
                      }}>
                        <span style={{
                          width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#FFFFFF',
                          transition: '0.2s', transform: (prefs as any)[item.key] ? 'translateX(20px)' : 'translateX(0)'
                        }} />
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  localStorage.setItem('notification_preferences', JSON.stringify(prefs));
                  setIsPrefsModalOpen(false);
                  alert('Notification preferences saved successfully!');
                }}
                style={{ flex: 1, padding: '10px', backgroundColor: '#2563EB', color: '#FFFFFF', fontWeight: 700, borderRadius: '8px', border: 'none', cursor: 'pointer' }}
              >
                Save Preferences
              </button>
              <button
                onClick={() => setIsPrefsModalOpen(false)}
                style={{ flex: 1, padding: '10px', backgroundColor: '#F1F5F9', color: '#475569', fontWeight: 700, borderRadius: '8px', border: '1.5px solid #E2E8F0', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
