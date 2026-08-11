import React, { useEffect, useState } from 'react';
import { adminClient } from '../api/client';
import { useAdminStore } from '../store/adminStore';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
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

interface Stats {
  totalApplications: number;
  pendingReview: number;
  completedCount: number;
  slaBreached: number;
  totalRevenue: number;
  revenueToday: number;
  onlineRevenueToday: number;
  cashRevenueToday: number;
  applicationsToday: number;
  completedToday: number;
  rejectedToday: number;
  categoryDistribution: Array<{ name: string; count: number }>;
  recentApplications: ApplicationItem[];
  revenueOverview: Array<{ day: string; revenue: number }>;
  applicationTrends: Array<{ day: string; completed: number; pending: number; rejected: number }>;
  operatorLogs: OperatorLogItem[];
  activeCentres: number;
}

const COLORS = ['#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#EFF6FF'];

export default function DashboardHome() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const user = useAdminStore((s) => s.user);

  useEffect(() => {
    adminClient.get('/applications/admin/stats')
      .then(({ data }) => setStats(data.data))
      .catch((err) => console.error('Failed to load stats', err))
      .finally(() => setLoading(false));
  }, []);

  // Format today's date
  const todayFormatted = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  if (loading || !stats) {
    return (
      <div style={{ padding: 40, textAlign: 'center', fontSize: '15px', color: '#64748B', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        Loading dashboard metrics...
      </div>
    );
  }

  // Calculate some fallback percentages for donut chart if no applications exist
  const donutData = stats.categoryDistribution?.length > 0
    ? stats.categoryDistribution.map((item) => ({ name: item.name, value: item.count }))
    : [
        { name: 'Aadhaar', value: 35 },
        { name: 'PAN Card', value: 22 },
        { name: 'Certificates', value: 18 },
        { name: 'Banking', value: 15 },
        { name: 'Other', value: 10 }
      ];

  const totalDonutSum = donutData.reduce((acc, curr) => acc + curr.value, 0) || 1;

  // Format currency in Indian standard (Rupees)
  const formatRupees = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Get status color helper
  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return { bg: '#F0FDF4', color: '#16A34A' };
      case 'rejected':
        return { bg: '#FEF2F2', color: '#DC2626' };
      case 'in_review':
      case 'under_review':
      case 'in review':
        return { bg: '#EFF6FF', color: '#2563EB' };
      case 'pending':
      case 'docs_pending':
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
            Good Morning, {user?.name?.split(' ')[0] || 'Rajesh'}
          </h1>
          <p style={{ color: '#64748B', fontSize: '14px', margin: '4px 0 0 0', fontWeight: 500 }}>
            Here's your operational overview for today
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

      {/* Grid of 6 Metrics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        {/* Card 1: Revenue Today */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '20px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Revenue Today</span>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '14px', margin: 'auto', fontWeight: 'bold' }}>₹</span>
            </div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A' }}>
            {formatRupees(stats.revenueToday)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: '#16A34A' }}>
            <span>↑ +12.5%</span>
          </div>
        </div>

        {/* Card 2: Applications Today */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '20px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Applications Today</span>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ margin: 'auto' }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
            </div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A' }}>
            {stats.applicationsToday.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#2563EB' }}>
            Normal
          </div>
        </div>

        {/* Card 3: Pending Applications */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '20px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending Requests</span>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#FFFBEB', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ margin: 'auto' }}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            </div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A' }}>
            {stats.pendingReview.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: stats.pendingReview > 20 ? '#DC2626' : '#D97706' }}>
            {stats.pendingReview > 20 ? 'High load' : 'Normal'}
          </div>
        </div>

        {/* Card 4: Completed Today */}
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
            94% rate
          </div>
        </div>

        {/* Card 5: Rejected Today */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '20px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rejected Today</span>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ margin: 'auto' }}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A' }}>
            {stats.rejectedToday.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>
            Manual review
          </div>
        </div>

        {/* Card 6: Active Centres */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '20px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Centres</span>
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#EFF6FF', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ margin: 'auto' }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
            </div>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A' }}>
            {stats.activeCentres.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#16A34A' }}>
            Live now
          </div>
        </div>
      </div>

      {/* Row 2: Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        {/* Revenue Overview */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Revenue Overview</h3>
              <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0 0' }}>7-day digital service transactions</p>
            </div>
            <div style={{ display: 'flex', gap: '4px', fontSize: '12px', fontWeight: 700 }}>
              <span style={{ padding: '4px 8px', backgroundColor: '#EFF6FF', color: '#2563EB', borderRadius: '4px', cursor: 'pointer' }}>7 Days</span>
              <span style={{ padding: '4px 8px', color: '#64748B', borderRadius: '4px', cursor: 'pointer' }}>30 Days</span>
            </div>
          </div>
          <div style={{ height: '220px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.revenueOverview} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="day" tickLine={false} axisLine={false} style={{ fontSize: '12px', fill: '#94A3B8', fontWeight: 600 }} />
                <YAxis tickLine={false} axisLine={false} style={{ fontSize: '12px', fill: '#94A3B8', fontWeight: 600 }} tickFormatter={(v) => `₹${v/1000}k`} />
                <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Revenue']} contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontFamily: "'Plus Jakarta Sans', sans-serif" }} />
                <Line type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#FFFFFF' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Application Trends */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', margin: 0 }}>Application Trends</h3>
              <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0 0' }}>Daily status of citizen certificates & updates</p>
            </div>
            <div style={{ display: 'flex', gap: '12px', fontSize: '11px', fontWeight: 700 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#16A34A' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#16A34A' }} />Completed</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#D97706' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#D97706' }} />Pending</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#DC2626' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#DC2626' }} />Rejected</div>
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
                <Bar dataKey="rejected" fill="#DC2626" radius={[4, 4, 0, 0]} maxBarSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Service Share, Collections & Operator logs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        marginBottom: '32px'
      }}>
        {/* Service Share Donut */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', marginBottom: '20px' }}>Service Share</h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
            <div style={{ width: '140px', height: '140px', position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius={45} outerRadius={60} paddingAngle={3} dataKey="value">
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Plus Jakarta Sans', sans-serif"
              }}>
                <span style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A' }}>100%</span>
              </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {donutData.slice(0, 5).map((item, index) => {
                const percent = Math.round((item.value / totalDonutSum) * 100);
                return (
                  <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontWeight: 600 }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: COLORS[index % COLORS.length] }} />
                      <span>{item.name}</span>
                    </div>
                    <span style={{ fontWeight: 700, color: '#0F172A' }}>{percent}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Collections Summary Card */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', justifyTracks: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Collections Summary</h3>
            <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Collections Today</span>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#0F172A', margin: '8px 0 20px 0', letterSpacing: '-0.02em' }}>
              {formatRupees(stats.revenueToday)}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                <span>Online Payments ({stats.revenueToday > 0 ? Math.round((stats.onlineRevenueToday / stats.revenueToday) * 100) : 66}%)</span>
                <span style={{ fontWeight: 700, color: '#0F172A' }}>{formatRupees(stats.onlineRevenueToday)}</span>
              </div>
              <div style={{ height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${stats.revenueToday > 0 ? (stats.onlineRevenueToday / stats.revenueToday) * 100 : 66}%`, backgroundColor: '#2563EB', borderRadius: '4px' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                <span>Cash Collections ({stats.revenueToday > 0 ? Math.round((stats.cashRevenueToday / stats.revenueToday) * 100) : 34}%)</span>
                <span style={{ fontWeight: 700, color: '#0F172A' }}>{formatRupees(stats.cashRevenueToday)}</span>
              </div>
              <div style={{ height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${stats.revenueToday > 0 ? (stats.cashRevenueToday / stats.revenueToday) * 100 : 34}%`, backgroundColor: '#10B981', borderRadius: '4px' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Operator Logs Card */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', marginBottom: '20px' }}>Operator Logs</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '200px', overflowY: 'auto' }}>
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
                No recent operator logs.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 4: Recent Service Applications Table */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '24px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>Recent Service Applications</h3>
            <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0 0' }}>Real-time incoming government & financial services requests</p>
          </div>
          <Link to="/applications" style={{ fontSize: '13px', fontWeight: 700, color: '#2563EB', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>View All</span>
            <span>→</span>
          </Link>
        </div>

        {/* Table container */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Application ID</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Citizen Name</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Service</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fee Amount</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date Submitted</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentApplications?.map((app) => {
                const statusStyle = getStatusStyle(app.status);
                const submitDate = new Intl.DateTimeFormat('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }).format(new Date(app.createdAt));

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
                    <td style={{ padding: '16px', fontSize: '13.5px', fontWeight: 700, color: '#0F172A' }}>
                      {formatRupees(app.totalAmount)}
                    </td>
                    <td style={{ padding: '16px', fontSize: '13px', color: '#64748B', fontWeight: 500 }}>
                      {submitDate}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <Link to={`/applications/verify/${app._id}`} style={{
                        textDecoration: 'none',
                        color: '#64748B',
                        fontWeight: 700,
                        fontSize: '18px',
                        cursor: 'pointer',
                        padding: '4px 8px'
                      }} title="Review Application">
                        •••
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {(!stats.recentApplications || stats.recentApplications.length === 0) && (
                <tr>
                  <td colSpan={7} style={{ padding: '32px', textAlign: 'center', fontSize: '14px', color: '#64748B', fontWeight: 500 }}>
                    No recent applications found.
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
