import React, { useState, useEffect, useCallback } from 'react';
import { adminClient } from '../api/client';

interface AuditLogEntry {
  _id: string;
  timestamp: string;
  userId?: string;
  userName: string;
  userRole: string;
  action: string;
  category: string;
  resource: string;
  ipAddress: string;
  status: 'success' | 'failed' | 'warning';
}

interface AuditStats {
  totalEvents: number;
  loginActivities: number;
  documentActions: number;
  systemChanges: number;
}

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'All Events' },
  { value: 'login', label: 'Login Activities' },
  { value: 'document', label: 'Document Actions' },
  { value: 'system', label: 'System Changes' },
  { value: 'support', label: 'Support' },
  { value: 'user', label: 'User Actions' },
  { value: 'payment', label: 'Payments' },
];

const DATE_RANGE_OPTIONS = [
  { value: '24h', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '', label: 'All Time' },
];

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, React.CSSProperties> = {
    success: { backgroundColor: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0' },
    failed: { backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' },
    warning: { backgroundColor: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A' },
  };
  return (
    <span style={{
      ...styles[status] ?? styles.warning,
      padding: '2px 10px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: 700,
      textTransform: 'capitalize' as const,
      display: 'inline-block',
    }}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function StatCard({
  title,
  value,
  icon,
  iconBg,
  iconColor,
  subtitle,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  subtitle: string;
}) {
  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      padding: '22px 24px',
      borderRadius: '16px',
      border: '1.5px solid #E2E8F0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
      flex: 1,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' as const, letterSpacing: '0.07em' }}>{title}</span>
        <div style={{ width: '34px', height: '34px', borderRadius: '9px', backgroundColor: iconBg, color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: '30px', fontWeight: 850, color: '#0F172A', lineHeight: 1.1 }}>{value.toLocaleString()}</div>
      <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>{subtitle}</div>
    </div>
  );
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [stats, setStats] = useState<AuditStats>({ totalEvents: 0, loginActivities: 0, documentActions: 0, systemChanges: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [dateRange, setDateRange] = useState('24h');
  const [exporting, setExporting] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: '8',
        category,
        dateRange,
      };
      if (search) params.search = search;

      const { data } = await adminClient.get('/auth/admin/audit-logs', { params });
      if (data.success) {
        setLogs(data.data.items);
        setTotal(data.data.total);
        setTotalPages(data.data.totalPages);
        setStats(data.data.stats);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [page, category, dateRange, search]);

  useEffect(() => {
    const timer = setTimeout(fetchLogs, search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [fetchLogs]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const rows = [
        ['Timestamp', 'User', 'Action', 'Resource', 'IP Address', 'Status'],
        ...logs.map(l => [
          new Date(l.timestamp).toLocaleString(),
          l.userName,
          l.action,
          l.resource,
          l.ipAddress,
          l.status,
        ]),
      ];
      const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const formatTimestamp = (ts: string) => {
    const d = new Date(ts);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    const secs = String(d.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${mins}:${secs}`;
  };

  return (
    <div style={{ padding: '32px', backgroundColor: '#F8FAFC', minHeight: '100%' }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: '13px', color: '#64748B', marginBottom: '10px' }}>
        <span style={{ color: '#2563EB', cursor: 'pointer', fontWeight: 600 }}>Dashboard</span>
        <span style={{ margin: '0 6px' }}>→</span>
        <span style={{ color: '#0F172A', fontWeight: 700 }}>Audit Log</span>
      </div>

      {/* Page Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 850, color: '#0F172A', margin: 0 }}>System Audit Log</h1>
        <p style={{ fontSize: '13.5px', color: '#64748B', margin: '6px 0 0 0', fontWeight: 500 }}>
          Real-time security auditing, event compliance tracking, and administrative change monitor.
        </p>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '28px', flexWrap: 'wrap' }}>
        <StatCard
          title="Total Events"
          value={stats.totalEvents}
          subtitle="Across all system layers"
          iconBg="#EFF6FF"
          iconColor="#2563EB"
          icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
        />
        <StatCard
          title="Login Activities"
          value={stats.loginActivities}
          subtitle="User portals & APIs"
          iconBg="#F0FDF4"
          iconColor="#16A34A"
          icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
        />
        <StatCard
          title="Document Actions"
          value={stats.documentActions}
          subtitle="Downloads, uploads & edits"
          iconBg="#FFF7ED"
          iconColor="#EA580C"
          icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
        />
        <StatCard
          title="System Changes"
          value={stats.systemChanges}
          subtitle="Config & access rules"
          iconBg="#FEF2F2"
          iconColor="#DC2626"
          icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
        />
      </div>

      {/* Filters + Export Row */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        border: '1.5px solid #E2E8F0',
        padding: '20px 24px',
        marginBottom: '4px',
      }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
            <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              id="audit-search"
              placeholder="Search logs..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              style={{
                width: '100%',
                paddingLeft: '36px',
                paddingRight: '12px',
                paddingTop: '9px',
                paddingBottom: '9px',
                border: '1.5px solid #E2E8F0',
                borderRadius: '9px',
                fontSize: '13.5px',
                color: '#0F172A',
                outline: 'none',
                boxSizing: 'border-box' as const,
              }}
            />
          </div>

          {/* Category filter */}
          <div style={{ position: 'relative' }}>
            <select
              id="audit-category"
              value={category}
              onChange={e => { setCategory(e.target.value); setPage(1); }}
              style={{
                padding: '9px 32px 9px 12px',
                border: '1.5px solid #E2E8F0',
                borderRadius: '9px',
                fontSize: '13.5px',
                color: '#0F172A',
                backgroundColor: '#FFFFFF',
                appearance: 'none' as const,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {CATEGORY_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>Category: {o.label}</option>
              ))}
            </select>
            <svg style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
          </div>

          {/* User: All Users — just shows label (filtering by userId requires further integration) */}
          <div style={{ position: 'relative' }}>
            <select
              id="audit-user"
              style={{
                padding: '9px 32px 9px 12px',
                border: '1.5px solid #E2E8F0',
                borderRadius: '9px',
                fontSize: '13.5px',
                color: '#0F172A',
                backgroundColor: '#FFFFFF',
                appearance: 'none' as const,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">User: All Users</option>
            </select>
            <svg style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
          </div>

          {/* Date Range filter */}
          <div style={{ position: 'relative' }}>
            <select
              id="audit-date-range"
              value={dateRange}
              onChange={e => { setDateRange(e.target.value); setPage(1); }}
              style={{
                padding: '9px 32px 9px 12px',
                border: '1.5px solid #E2E8F0',
                borderRadius: '9px',
                fontSize: '13.5px',
                color: '#0F172A',
                backgroundColor: '#FFFFFF',
                appearance: 'none' as const,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {DATE_RANGE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>Date Range: {o.label}</option>
              ))}
            </select>
            <svg style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
          </div>

          {/* Export Button */}
          <button
            id="export-audit-log-btn"
            onClick={handleExport}
            disabled={exporting || logs.length === 0}
            style={{
              marginLeft: 'auto',
              padding: '9px 20px',
              backgroundColor: '#2563EB',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '9px',
              fontSize: '13.5px',
              fontWeight: 700,
              cursor: 'pointer',
              opacity: exporting || logs.length === 0 ? 0.6 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            {exporting ? 'Exporting...' : 'Export Audit Log'}
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '0 0 16px 16px',
        border: '1.5px solid #E2E8F0',
        borderTop: 'none',
        overflow: 'hidden',
      }}>
        {/* Table Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '180px 1fr 1fr 1fr 130px 100px',
          padding: '12px 24px',
          borderBottom: '1.5px solid #E2E8F0',
          backgroundColor: '#F8FAFC',
        }}>
          {['Timestamp', 'User', 'Action', 'Resource', 'IP Address', 'Status'].map(col => (
            <span key={col} style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{col}</span>
          ))}
        </div>

        {/* Table Body */}
        {loading ? (
          <div style={{ padding: '64px', textAlign: 'center' as const, color: '#64748B', fontSize: '14px' }}>
            <div style={{ marginBottom: '14px', display: 'flex', justifyContent: 'center' }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '14px',
                backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>Loading audit logs...</div>
            <div style={{ fontSize: '13px' }}>Fetching records from server</div>
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '64px', textAlign: 'center' as const, color: '#64748B' }}>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
              <div style={{
                width: '60px', height: '60px', borderRadius: '16px',
                backgroundColor: '#F8FAFC', border: '1.5px solid #E2E8F0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>No audit events yet</div>
            <div style={{ fontSize: '13px' }}>Events will appear here as operators log in, documents are uploaded, and tickets are raised.</div>
          </div>
        ) : (
          logs.map((log, idx) => (
            <div
              key={log._id}
              style={{
                display: 'grid',
                gridTemplateColumns: '180px 1fr 1fr 1fr 130px 100px',
                padding: '14px 24px',
                borderBottom: idx < logs.length - 1 ? '1px solid #F1F5F9' : 'none',
                alignItems: 'center',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <span style={{ fontSize: '12.5px', color: '#475569', fontFamily: 'monospace' }}>{formatTimestamp(log.timestamp)}</span>
              <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#0F172A' }}>{log.userName}</span>
              <span style={{ fontSize: '13.5px', color: '#334155' }}>{log.action}</span>
              <span style={{ fontSize: '13px', color: '#64748B' }}>{log.resource}</span>
              <span style={{ fontSize: '12.5px', color: '#64748B', fontFamily: 'monospace' }}>{log.ipAddress}</span>
              <StatusBadge status={log.status} />
            </div>
          ))
        )}

        {/* Pagination Footer */}
        {!loading && logs.length > 0 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 24px',
            borderTop: '1.5px solid #E2E8F0',
          }}>
            <span style={{ fontSize: '13px', color: '#64748B' }}>
              Showing {((page - 1) * 8) + 1}–{Math.min(page * 8, total)} of {total.toLocaleString()} logged events
            </span>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <button
                id="audit-prev-btn"
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page === 1}
                style={{
                  padding: '6px 14px',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: '7px',
                  backgroundColor: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                  color: page === 1 ? '#94A3B8' : '#374151',
                }}
              >
                Previous
              </button>

              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const p = i + 1;
                const isActive = p === page;
                return (
                  <button
                    key={p}
                    id={`audit-page-${p}-btn`}
                    onClick={() => setPage(p)}
                    style={{
                      width: '34px',
                      height: '34px',
                      border: isActive ? 'none' : '1.5px solid #E2E8F0',
                      borderRadius: '7px',
                      backgroundColor: isActive ? '#2563EB' : '#FFFFFF',
                      color: isActive ? '#FFFFFF' : '#374151',
                      fontSize: '13px',
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                    }}
                  >
                    {p}
                  </button>
                );
              })}

              <button
                id="audit-next-btn"
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                style={{
                  padding: '6px 14px',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: '7px',
                  backgroundColor: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: page === totalPages ? 'not-allowed' : 'pointer',
                  color: page === totalPages ? '#94A3B8' : '#374151',
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
