import React, { useEffect, useState } from 'react';
import { adminClient } from '../api/client';
import { useAdminStore } from '../store/adminStore';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

interface ApplicationItem {
  _id: string;
  applicationRefNo: string;
  applicantName: string;
  serviceName: string;
  status: string;
  totalAmount: number;
  createdAt: string;
}

interface OperatorLogItem {
  applicationId: string;
  applicationRefNo: string;
  serviceName: string;
  applicantName: string;
  event: string;
  note?: string;
  actorId: string;
  timestamp: string;
}

interface OperatorStats {
  totalAssigned: number;
  pendingReview: number;
  completedCount: number;
  slaBreached: number;
  applicationsToday: number;
  completedToday: number;
  rejectedToday: number;
  recentApplications: ApplicationItem[];
  applicationTrends: Array<{ day: string; completed: number; pending: number; rejected: number }>;
  operatorLogs: OperatorLogItem[];
}

export default function OperatorDashboardHome() {
  const [stats, setStats] = useState<OperatorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const user = useAdminStore((s) => s.user);

  useEffect(() => {
    adminClient.get('/applications/operator/stats')
      .then(({ data }) => setStats(data.data))
      .catch((err) => console.error('Failed to load stats', err))
      .finally(() => setLoading(false));
  }, []);

  const todayFormatted = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  if (loading || !stats) {
    return (
      <div style={{ padding: 40, textAlign: 'center', fontSize: '15px', color: '#64748B', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        Loading your dashboard...
      </div>
    );
  }

  const formatRupees = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return { bg: '#F0FDF4', color: '#16A34A' };
      case 'rejected':
        return { bg: '#FEF2F2', color: '#DC2626' };
      case 'in_review':
      case 'under_review':
      case 'in review':
      case 'processing':
        return { bg: '#EFF6FF', color: '#2563EB' };
      case 'docs_pending':
        return { bg: '#FEFCE8', color: '#CA8A04' };
      case 'pending':
      case 'submitted':
      default:
        return { bg: '#FFFBEB', color: '#D97706' };
    }
  };

  const formatTimeAgo = (timestampStr: string) => {
    const diffMs = new Date().getTime() - new Date(timestampStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const getLogIconStyle = (event: string) => {
    const ev = event.toLowerCase();
    if (ev.includes('approve') || ev.includes('complete')) {
      return { bg: '#F0FDF4', color: '#16A34A', icon: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ margin: 'auto' }}><polyline points="20 6 9 17 4 12" /></svg>
      )};
    }
    if (ev.includes('reject')) {
      return { bg: '#FEF2F2', color: '#DC2626', icon: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ margin: 'auto' }}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
      )};
    }
    if (ev.includes('assign') || ev.includes('claim')) {
      return { bg: '#EFF6FF', color: '#2563EB', icon: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ margin: 'auto' }}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8" cy="7" r="4" /></svg>
      )};
    }
    return { bg: '#FFFBEB', color: '#D97706', icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ margin: 'auto' }}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
    )};
  };

  return (
    <div style={{ padding: '32px', fontFamily: "'Plus Jakarta Sans', sans-serif", backgroundColor: '#F8FAFC' }}>
      {/* Welcome Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.03em', margin: 0 }}>
            Hello, {user?.name?.split(' ')[0] || 'Operator'}
          </h1>
          <p style={{ color: '#64748B', fontSize: '14px', margin: '4px 0 0 0', fontWeight: 500 }}>
            Here is your daily task overview
          </p>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: '#FFFFFF',
          padding: '10px 16px',
          borderRadius: '8px',
          border: '1px solid #E2E8F0',
          fontSize: '13px',
          fontWeight: 700,
          color: '#334155'
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '4px' }}>
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          {todayFormatted}
        </div>
      </div>

      {/* Grid of Metrics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '20px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tasks Pending</span>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#FFFBEB', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ margin: 'auto' }}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            </div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A' }}>
            {stats.pendingReview.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: stats.pendingReview > 10 ? '#DC2626' : '#16A34A' }}>
            {stats.pendingReview > 10 ? 'High load' : 'On track'}
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '20px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completed Today</span>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ margin: 'auto' }}><polyline points="20 6 9 17 4 12" /></svg>
            </div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A' }}>
            {stats.completedToday.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#16A34A' }}>
            Great job!
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '20px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Assigned</span>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ margin: 'auto' }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
            </div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A' }}>
            {stats.totalAssigned.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#2563EB' }}>
            All time
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '20px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SLA Breached</span>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ margin: 'auto' }}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A' }}>
            {stats.slaBreached.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: stats.slaBreached > 0 ? '#DC2626' : '#16A34A' }}>
            {stats.slaBreached > 0 ? 'Requires action' : 'Perfect'}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        {/* Your Trends */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', margin: 0 }}>My Weekly Performance</h3>
              <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0 0' }}>Daily task completions</p>
            </div>
          </div>
          <div style={{ height: '220px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.applicationTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="day" tickLine={false} axisLine={false} style={{ fontSize: '12px', fill: '#94A3B8', fontWeight: 600 }} />
                <YAxis tickLine={false} axisLine={false} style={{ fontSize: '12px', fill: '#94A3B8', fontWeight: 600 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontFamily: "'Plus Jakarta Sans', sans-serif" }} />
                <Bar dataKey="completed" fill="#16A34A" radius={[4, 4, 0, 0]} maxBarSize={12} />
                <Bar dataKey="pending" fill="#D97706" radius={[4, 4, 0, 0]} maxBarSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Operator Logs Card */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', marginBottom: '20px' }}>Recent Activity</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '220px', overflowY: 'auto' }}>
            {stats.operatorLogs && stats.operatorLogs.length > 0 ? (
              stats.operatorLogs.map((log, index) => {
                const style = getLogIconStyle(log.event);
                return (
                  <div key={index} style={{ display: 'flex', gap: '12px', fontSize: '13px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: style.bg, color: style.color, display: 'flex', flexShrink: 0 }}>
                      {style.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: '#334155' }}>{log.event}</div>
                      <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                        {log.applicantName || 'Citizen'} ({log.serviceName}) {log.note ? ` - ${log.note}` : ''}
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>{formatTimeAgo(log.timestamp)}</span>
                  </div>
                );
              })
            ) : (
              <div style={{ fontSize: '13px', color: '#64748B', textAlign: 'center', padding: '20px 0' }}>
                No recent activity.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 4: Recent Assigned Applications Table */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>Recently Assigned to Me</h3>
            <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0 0' }}>Most recent applications waiting for your action</p>
          </div>
          <Link to="/applications" style={{ fontSize: '13px', fontWeight: 700, color: '#2563EB', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>View Queue</span>
            <span>→</span>
          </Link>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Application ID</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Citizen Name</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Service</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentApplications?.map((app) => {
                const statusStyle = getStatusStyle(app.status);
                
                return (
                  <tr key={app._id} style={{ borderBottom: '1px solid #F8FAFC' }}>
                    <td style={{ padding: '16px', fontSize: '13.5px', fontWeight: 700, color: '#0F172A' }}>
                      {app.applicationRefNo}
                    </td>
                    <td style={{ padding: '16px', fontSize: '13.5px', fontWeight: 600, color: '#475569' }}>
                      {app.applicantName || 'Citizen'}
                    </td>
                    <td style={{ padding: '16px', fontSize: '13.5px', fontWeight: 500, color: '#475569' }}>
                      {app.serviceName}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        backgroundColor: statusStyle.bg,
                        color: statusStyle.color,
                        fontSize: '12px',
                        fontWeight: 700,
                        textTransform: 'capitalize',
                        display: 'inline-block'
                      }}>
                        {app.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <Link to={`/applications/verify/${app._id}`} style={{
                        textDecoration: 'none',
                        color: '#2563EB',
                        backgroundColor: '#EFF6FF',
                        borderRadius: '6px',
                        fontWeight: 600,
                        fontSize: '12px',
                        cursor: 'pointer',
                        padding: '6px 12px',
                        display: 'inline-block'
                      }} title="Review Application">
                        Action
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {(!stats.recentApplications || stats.recentApplications.length === 0) && (
                <tr>
                  <td colSpan={5} style={{ padding: '32px', textAlign: 'center', fontSize: '14px', color: '#64748B', fontWeight: 500 }}>
                    No assigned applications found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
