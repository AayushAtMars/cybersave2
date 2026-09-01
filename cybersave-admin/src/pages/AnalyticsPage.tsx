import React, { useEffect, useState } from 'react';
import { adminClient } from '../api/client';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface DocumentItem {
  _id: string;
  ownerId: string;
  ownerName?: string;
  originalName: string;
  documentCategory: string;
  verifiedStatus: string;
  sizeBytes: number;
  createdAt: string;
}

export default function AnalyticsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = async () => {
    try {
      const { data } = await adminClient.get('/documents/admin/all');
      setDocuments(data.data.items || []);
    } catch (err) {
      console.error('Failed to fetch documents for analytics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Stats calculations
  const totalDocs = documents.length;
  const verifiedCount = documents.filter(d => d.verifiedStatus === 'verified').length;
  const pendingCount = documents.filter(d => d.verifiedStatus === 'pending').length;
  const expiredCount = documents.filter(d => d.verifiedStatus === 'rejected').length;

  const getCategoryDisplay = (cat: string) => {
    switch (cat) {
      case 'id_proof':
        return 'Identity Proof';
      case 'address_proof':
        return 'Address Proof';
      case 'income_proof':
        return 'Financial / Income';
      case 'birth_proof':
      case 'certificate':
      case 'photo':
      case 'signature':
        return 'Certificates & Personal';
      case 'proof':
      case 'other':
      default:
        return 'Other Documents';
    }
  };

  const categories = ['Identity Proof', 'Address Proof', 'Financial / Income', 'Certificates & Personal', 'Other Documents'];
  const categoryCounts = categories.reduce((acc, cat) => {
    acc[cat] = 0;
    return acc;
  }, {} as Record<string, number>);

  documents.forEach(d => {
    const disp = getCategoryDisplay(d.documentCategory);
    if (categoryCounts[disp] !== undefined) {
      categoryCounts[disp]++;
    } else {
      categoryCounts['Other Documents']++;
    }
  });

  // Trend data: Group by month (Jan - Sep)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
  const trendData = monthNames.map((month, index) => {
    const currentYear = new Date().getFullYear();
    const uploads = documents.filter(d => {
      const dDate = new Date(d.createdAt);
      return dDate.getMonth() === index && dDate.getFullYear() === currentYear;
    }).length;

    const verifications = documents.filter(d => {
      const dDate = new Date(d.createdAt);
      return dDate.getMonth() === index && dDate.getFullYear() === currentYear && d.verifiedStatus === 'verified';
    }).length;

    return {
      name: month,
      Uploads: uploads,
      Verifications: verifications
    };
  });

  // Pie chart Status data
  const pieData = [
    { name: 'Verified', value: verifiedCount, color: '#10B981' },
    { name: 'Pending', value: pendingCount, color: '#F59E0B' },
    { name: 'Expired', value: expiredCount, color: '#EF4444' }
  ];

  const getDocIdStr = (doc: DocumentItem) => {
    const indexStr = doc._id.slice(-4).toUpperCase();
    switch (doc.documentCategory) {
      case 'id_proof': return `DOC-ID-${indexStr}`;
      case 'address_proof': return `DOC-ADDR-${indexStr}`;
      case 'income_proof': return `DOC-FIN-${indexStr}`;
      case 'certificate': return `DOC-CERT-${indexStr}`;
      case 'birth_proof': return `DOC-DOB-${indexStr}`;
      case 'photo': return `DOC-IMG-${indexStr}`;
      case 'signature': return `DOC-SIGN-${indexStr}`;
      case 'proof': return `DOC-PROOF-${indexStr}`;
      default: return `DOC-MISC-${indexStr}`;
    }
  };

  return (
    <div style={{ padding: '32px', backgroundColor: '#F8FAFC', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      {/* Breadcrumbs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748B', fontWeight: 600 }}>
          <span>Dashboard</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          <span style={{ color: '#2563EB' }}>Analytics</span>
        </div>
        <button
          onClick={() => {
            const header = ["Document ID,Name,Category,User,Uploaded Date,Status"].join(",");
            const rows = documents.map(d => `"${getDocIdStr(d)}","${d.originalName?.replace(/"/g, '""')}","${getCategoryDisplay(d.documentCategory)}","${(d.ownerName || 'Unknown').replace(/"/g, '""')}","${new Date(d.createdAt).toLocaleDateString('en-GB')}","${d.verifiedStatus}"`);
            const csvContent = header + "\n" + rows.join("\n");
            
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `platform_analytics_report_${new Date().toISOString().slice(0,10)}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
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
        <h1 style={{ fontSize: '28px', fontWeight: 850, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>Platform Analytics & Performance</h1>
        <p style={{ fontSize: '14.5px', color: '#64748B', marginTop: '4px', fontWeight: 500 }}>Observe real-time system uploads, file verifications, category metrics, and team operations.</p>
      </div>

      {/* Stats Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        {/* Total Documents */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '16px', border: '1.5px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.01)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Documents Uploaded</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 850, color: '#0F172A', margin: 0 }}>{totalDocs}</h2>
          <span style={{ fontSize: '12.5px', color: '#10B981', fontWeight: 700, marginTop: '4px', display: 'block' }}>+12% <span style={{ color: '#64748B', fontWeight: 550 }}>Across 6 categories</span></span>
        </div>

        {/* Verified Documents */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '16px', border: '1.5px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.01)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verified</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#E6FDF3', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 850, color: '#0F172A', margin: 0 }}>{verifiedCount}</h2>
          <span style={{ fontSize: '12.5px', color: '#10B981', fontWeight: 700, marginTop: '4px', display: 'block' }}>+4.2% <span style={{ color: '#64748B', fontWeight: 550 }}>Secured & validated</span></span>
        </div>

        {/* Pending Review */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '16px', border: '1.5px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.01)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending Review</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#FFFBEB', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 850, color: '#0F172A', margin: 0 }}>{pendingCount}</h2>
          <span style={{ fontSize: '12.5px', color: '#EF4444', fontWeight: 700, marginTop: '4px', display: 'block' }}>-1.5% <span style={{ color: '#64748B', fontWeight: 550 }}>In manual queue</span></span>
        </div>

        {/* Expired Documents */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '16px', border: '1.5px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.01)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Expired Documents</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#FEE2E2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 850, color: '#0F172A', margin: 0 }}>{expiredCount}</h2>
          <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: 550, marginTop: '4px', display: 'block' }}>Requires re-upload</span>
        </div>
      </div>

      {/* Document Activity Trends Chart Card */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1.5px solid #E2E8F0', padding: '24px', marginBottom: '28px', boxShadow: '0 1px 3px rgba(0,0,0,0.01)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h3 style={{ fontSize: '16.5px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Document Activity Trends</h3>
            <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 550, marginTop: '2px', display: 'block' }}>Daily uploads and verifications cycle over time</span>
          </div>
          <div style={{ display: 'flex', gap: '16px', fontSize: '12.5px', fontWeight: 700 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#2563EB' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2563EB' }} /> Uploads
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10B981' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }} /> Verifications
            </span>
          </div>
        </div>

        <div style={{ width: '100%', height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" stroke="#94A3B8" fontSize={11.5} fontWeight={600} tickLine={false} />
              <YAxis stroke="#94A3B8" fontSize={11.5} fontWeight={600} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontFamily: 'inherit', fontSize: '13px', fontWeight: 600 }} />
              <Line type="monotone" dataKey="Uploads" stroke="#2563EB" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="Verifications" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Breakdown Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px', marginBottom: '28px' }}>
        {/* Category Breakdown Progress Bars */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1.5px solid #E2E8F0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.01)' }}>
          <h3 style={{ fontSize: '16.5px', fontWeight: 800, color: '#0F172A', margin: '0 0 20px 0' }}>Category Breakdown</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {categories.map((cat) => {
              const count = categoryCounts[cat] || 0;
              const maxVal = Math.max(...Object.values(categoryCounts), 10);
              const percentage = Math.min((count / maxVal) * 100, 100);
              return (
                <div key={cat} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                  <span style={{ fontSize: '13.5px', fontWeight: 650, color: '#475569', width: '80px' }}>{cat}</span>
                  <div style={{ flex: 1, height: '8px', backgroundColor: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: '#2563EB', borderRadius: '4px' }} />
                  </div>
                  <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#0F172A', width: '24px', textAlign: 'right' }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status Distribution Pie Chart */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1.5px solid #E2E8F0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.01)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-start' }}>
            <h3 style={{ fontSize: '16.5px', fontWeight: 800, color: '#0F172A', margin: '0 0 12px 0' }}>Status Distribution</h3>
          </div>

          <div style={{ position: 'relative', width: '220px', height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* Absolute Donut Center Text */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
              <div style={{ fontSize: '28px', fontWeight: 850, color: '#0F172A' }}>{totalDocs}</div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' }}>Total</div>
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: '20px', marginTop: '16px', fontSize: '12.5px', fontWeight: 700 }}>
            {pieData.map(item => (
              <span key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: item.color }} /> {item.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity Log Table */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1.5px solid #E2E8F0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.01)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16.5px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Recent Activity Log</h3>
          <button
            onClick={() => alert('Viewing full Audit Trail settings')}
            style={{
              padding: '6px 12px',
              border: '1.5px solid #E2E8F0',
              borderRadius: '6px',
              backgroundColor: '#FFFFFF',
              fontSize: '12.5px',
              fontWeight: 700,
              color: '#475569',
              cursor: 'pointer'
            }}
          >
            View Audit Trail
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '20px 0', textAlign: 'center', color: '#64748B', fontWeight: 600 }}>Loading activity logs...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid #F1F5F9' }}>
                  <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Document ID</th>
                  <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Name</th>
                  <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</th>
                  <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>User</th>
                  <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Uploaded</th>
                  <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {documents.slice(0, 5).map((doc) => {
                  const displayCategory = getCategoryDisplay(doc.documentCategory);
                  const docId = getDocIdStr(doc);
                  const displayStatus = doc.verifiedStatus;

                  return (
                    <tr key={doc._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '16px', fontSize: '13px', color: '#64748B', fontWeight: 650 }}>{docId}</td>
                      <td style={{ padding: '16px', fontSize: '13.5px', color: '#0F172A', fontWeight: 800 }}>{doc.originalName}</td>
                      <td style={{ padding: '16px', fontSize: '13px', color: '#475569', fontWeight: 600 }}>{displayCategory}</td>
                      <td style={{ padding: '16px', fontSize: '13px', color: '#475569', fontWeight: 600 }}>{doc.ownerName || 'Unknown'}</td>
                      <td style={{ padding: '16px', fontSize: '13px', color: '#475569', fontWeight: 600 }}>{new Date(doc.createdAt).toLocaleDateString('en-GB')}</td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          textTransform: 'capitalize',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor: displayStatus === 'verified' ? '#E6FDF3' : displayStatus === 'pending' ? '#FFFBEB' : '#FEE2E2',
                          color: displayStatus === 'verified' ? '#10B981' : displayStatus === 'pending' ? '#F59E0B' : '#EF4444'
                        }}>
                          {displayStatus === 'rejected' ? 'Expired' : displayStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
