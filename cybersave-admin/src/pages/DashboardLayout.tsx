import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { useAdminStore } from '../store/adminStore';
import { adminClient } from '../api/client';
import DashboardHome from './DashboardHome';
import ApplicationsQueuePage from './ApplicationsQueuePage';
import ApplicationVerifyDetailsPage from './ApplicationVerifyDetailsPage';
import OperatorsPage from './OperatorsPage';
import CitizensPage from './CitizensPage';
import ServicesPage from './ServicesPage';
import TicketsPage from './TicketsPage';
import NotificationsPage from './NotificationsPage';
import AnalyticsPage from './AnalyticsPage';
import AuditLogsPage from './AuditLogsPage';
import SettingsPage from './SettingsPage';
import logo from '../../assets/dashboard-logo.png';

// SVG Icons
const Icons = {
  Dashboard: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" /><rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" /></svg>
  ),
  UserManagement: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
  ),
  Applications: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
  ),
  Services: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
  ),
  Operators: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="8" y1="20" x2="16" y2="20" /><line x1="12" y1="4" x2="12" y2="20" /></svg>
  ),
  Transactions: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
  ),
  Notifications: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
  ),
  SupportTickets: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
  ),
  Analytics: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
  ),
  AuditLogs: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
  ),
  Settings: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
  ),
  Collapse: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
  ),
  Expand: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
  ),
  Search: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
  ),
  Sun: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
  )
};

const navItems = [
  { to: '/', label: 'Dashboard', icon: Icons.Dashboard, end: true },
  { to: '/citizens', label: 'User Management', icon: Icons.UserManagement },
  { to: '/applications', label: 'Applications', icon: Icons.Applications },
  { to: '/services', label: 'Services', icon: Icons.Services },
  { to: '/operators', label: 'Operators', icon: Icons.Operators },
  { to: '/notifications', label: 'Notifications', icon: Icons.Notifications },
  { to: '/tickets', label: 'Support Tickets', icon: Icons.SupportTickets },
  { to: '/analytics', label: 'Analytics', icon: Icons.Analytics },
  { to: '/audit-logs', label: 'Audit Logs', icon: Icons.AuditLogs },
  { to: '/settings', label: 'Settings', icon: Icons.Settings },
];

export default function DashboardLayout() {
  const user = useAdminStore((s) => s.user);
  const setAuth = useAdminStore((s) => s.setAuth);
  const accessToken = useAdminStore((s) => s.accessToken);
  const clearAuth = useAdminStore((s) => s.clearAuth);
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const { data } = await adminClient.get('/auth/admin/me');
        if (data.success && user && accessToken) {
          setAuth({ ...user, name: data.data.name, email: data.data.email, avatar: data.data.avatar }, accessToken);
        }
      } catch (err) {
        console.error("Failed to sync operator profile:", err);
      }
    };
    fetchMe();
  }, []);

  const displayUserName = user?.name || 'Rajesh Kumar';
  const displayUserRole = user?.role ? user.role.replace('_', ' ').toUpperCase() : 'SUPER ADMIN';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? 72 : 240,
        backgroundColor: '#FFFFFF',
        borderRight: '1px solid #E2E8F0',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s ease',
        height: '100vh',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        {/* Brand Logo Header */}
        <div style={{
          padding: collapsed ? '24px 0' : '24px 20px',
          display: 'flex',
          justifyContent: collapsed ? 'center' : 'flex-start',
          alignItems: 'center',
          borderBottom: '1px solid #F1F5F9',
          height: '80px',
          overflow: 'hidden'
        }}>
          {collapsed ? (
            <img src={logo} alt="CS Logo" style={{ height: '32px', width: '32px', objectFit: 'contain' }} />
          ) : (
            <img src={logo} alt="CyberSave Logo" style={{ height: '40px', objectFit: 'contain' }} />
          )}
        </div>

        {/* Navigation Items */}
        <nav style={{
          flex: 1,
          padding: '20px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          overflowY: 'auto'
        }}>
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={label}
              to={to}
              end={end}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'flex-start',
                gap: collapsed ? '0px' : '12px',
                padding: '10px 14px',
                borderRadius: '8px',
                color: isActive ? '#2563EB' : '#475569',
                backgroundColor: isActive ? '#EFF6FF' : 'transparent',
                borderLeft: isActive && !collapsed ? '3px solid #2563EB' : '3px solid transparent',
                fontSize: '14px',
                fontWeight: isActive ? 600 : 500,
                textDecoration: 'none',
                transition: 'all 0.15s ease'
              })}
              title={collapsed ? label : undefined}
            >
              <span style={{ display: 'flex', alignItems: 'center' }}>
                <Icon />
              </span>
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer actions */}
        <div style={{
          padding: '16px 12px',
          borderTop: '1px solid #F1F5F9',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: '12px',
              padding: '10px 14px',
              width: '100%',
              background: 'transparent',
              border: 'none',
              borderRadius: '8px',
              color: '#64748B',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <span>{collapsed ? <Icons.Expand /> : <Icons.Collapse />}</span>
            {!collapsed && <span>Collapse Menu</span>}
          </button>

          {/* Sign Out */}
          {!collapsed && (
            <button
              onClick={() => { clearAuth(); navigate('/login'); }}
              style={{
                width: '100%',
                background: '#FEF2F2',
                border: 'none',
                color: '#DC2626',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FEE2E2')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FEF2F2')}
            >
              Sign Out
            </button>
          )}
        </div>
      </aside>

      {/* Main Panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Header Bar */}
        <header style={{
          height: '80px',
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          position: 'sticky',
          top: 0,
          zIndex: 40
        }}>
          {/* Search Box */}
          <div style={{ position: 'relative', width: '380px', display: 'flex', alignItems: 'center' }}>
            <span style={{ position: 'absolute', left: '16px', display: 'flex', alignItems: 'center' }}>
              <Icons.Search />
            </span>
            <input
              type="text"
              placeholder="Search applications, citizens, operators..."
              style={{
                width: '100%',
                padding: '10px 16px 10px 48px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#0F172A',
                outline: 'none',
                transition: 'all 0.2s'
              }}
              onFocus={(e) => (e.target.style.borderColor = '#2563EB')}
              onBlur={(e) => (e.target.style.borderColor = '#E2E8F0')}
            />
          </div>

          {/* Right Profile Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            {/* Lang Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', color: '#475569', cursor: 'pointer', fontWeight: 600 }}>
              <span>EN</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
            </div>

            {/* Brightness sun */}
            <button style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <Icons.Sun />
            </button>

            {/* Notification bell badge */}
            <div style={{ position: 'relative', cursor: 'pointer', color: '#475569' }}>
              <Icons.Notifications />
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                backgroundColor: '#EF4444',
                color: '#FFFFFF',
                fontSize: '9px',
                fontWeight: 700,
                width: '15px',
                height: '15px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1.5px solid #FFFFFF'
              }}>
                12
              </span>
            </div>

            {/* Dynamic Header Action Button */}
            <button
              onClick={() => {
                if (window.location.pathname.endsWith('/operators')) {
                  window.dispatchEvent(new CustomEvent('open-add-operator-modal'));
                } else if (window.location.pathname.endsWith('/notifications')) {
                  window.dispatchEvent(new CustomEvent('mark-all-notifications-read'));
                } else if (window.location.pathname.endsWith('/tickets')) {
                  window.dispatchEvent(new CustomEvent('open-create-ticket-modal'));
                }
              }}
              style={{
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 18px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(37, 99, 235, 0.15)'
              }}
            >
              {window.location.pathname.endsWith('/operators') 
                ? 'Add New Operator' 
                : window.location.pathname.endsWith('/notifications') 
                ? 'Mark All as Read' 
                : window.location.pathname.endsWith('/tickets') 
                ? 'Create New Ticket'
                : 'Quick Actions'}
            </button>

            {/* User Profile */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderLeft: '1px solid #E2E8F0', paddingLeft: '24px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>{displayUserName}</div>
                <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 500, marginTop: '2px' }}>{displayUserRole}</div>
              </div>
              {/* Avatar Image (Simulated using dynamic Initials avatar if no image) */}
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={displayUserName}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '1px solid #BFDBFE'
                  }}
                />
              ) : (
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#EFF6FF',
                  color: '#2563EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '14px',
                  border: '1px solid #BFDBFE'
                }}>
                  {displayUserName.split(' ').map(n => n[0]).join('')}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Container */}
        <main style={{ flex: 1, overflowY: 'auto' }}>
          <Routes>
            <Route path="/" element={<DashboardHome />} />
            <Route path="/applications" element={<ApplicationsQueuePage />} />
            <Route path="/applications/verify/:id" element={<ApplicationVerifyDetailsPage />} />
            <Route path="/operators" element={<OperatorsPage />} />
            <Route path="/citizens" element={<CitizensPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/tickets" element={<TicketsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/audit-logs" element={<AuditLogsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
