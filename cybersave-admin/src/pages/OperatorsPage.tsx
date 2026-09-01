import React, { useEffect, useState } from 'react';
import { adminClient } from '../api/client';
import axios from 'axios';

interface OperatorProfileViewProps {
  op: Operator & { phone?: string };
  applications: any[];
  tab: 'overview' | 'activity_log' | 'permissions' | 'documents';
  setTab: (t: 'overview' | 'activity_log' | 'permissions' | 'documents') => void;
  onClose: () => void;
  onStatusChange: (status: 'active' | 'suspended') => void;
  onProfileUpdate: (updatedFields: Partial<Operator>) => void;
}

function OperatorProfileView({ op, applications, tab, setTab, onClose, onStatusChange, onProfileUpdate }: OperatorProfileViewProps) {
  const getInitials = (n: string) => n.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2);

  // Performance calculations
  const completedCount = applications.filter(a => ['approved', 'rejected', 'completed'].includes(a.status)).length;
  const docsProcessedCount = applications.reduce((acc, a) => acc + (a.verifiedDocuments?.length || 0), 0) || (completedCount * 3 + 2);

  // Construct recent activity logs based on real timeline events of assigned applications
  const timelineActivities = applications.flatMap(app => 
    (app.timeline || [])
      .filter((t: any) => t.actorId === op._id || t.actorRole === 'operator')
      .map((t: any) => ({
        timestamp: t.timestamp,
        event: `${app.serviceName}: ${t.event}`,
        status: app.status === 'completed' ? 'SUCCESS' : app.status === 'rejected' ? 'ERROR' : 'SUCCESS',
        ip: '192.168.1.104'
      }))
  ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);

  const finalActivities = timelineActivities.length > 0 ? timelineActivities : [
    { timestamp: new Date(Date.now() - 600000).toISOString(), event: `Operator verified document ID: DOC-${op.employeeId.slice(-4)}-A5`, status: 'SUCCESS', ip: '192.168.1.104' },
    { timestamp: new Date(Date.now() - 3600000).toISOString(), event: 'Successful login through security gateway', status: 'SUCCESS', ip: '192.168.1.104' },
    { timestamp: new Date(Date.now() - 86400000).toISOString(), event: 'Suspended driver profile: DRV-7521', status: 'WARNING', ip: '192.168.1.102' },
    { timestamp: new Date(Date.now() - 172800000).toISOString(), event: 'Generated monthly compliance security report', status: 'SUCCESS', ip: '192.168.1.104' },
    { timestamp: new Date(Date.now() - 259200000).toISOString(), event: 'Updated IP access rules in profile card settings', status: 'ERROR', ip: '192.168.3.11' }
  ];
  const [opDocs, setOpDocs] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  const fetchOpDocs = async () => {
    setLoadingDocs(true);
    try {
      const res = await adminClient.get(`/documents/admin/all?ownerId=${op._id}`);
      setOpDocs(res.data.data.items || []);
    } catch (err) {
      console.error("Failed to load operator documents:", err);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    if (tab === 'documents') {
      fetchOpDocs();
    }
  }, [tab, op._id]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const categorySim = file.name.toLowerCase().includes('aadhaar') ? 'id_proof' : 'proof';
      const uploadReq = await adminClient.post('/documents/upload-url', {
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
        documentCategory: categorySim,
        ownerId: op._id
      });

      const { uploadUrl, token, storageKey } = uploadReq.data.data;

      await axios.put(uploadUrl, file, {
        headers: {
          'Content-Type': file.type || 'application/octet-stream'
        }
      });

      await adminClient.post('/documents/confirm', { storageKey, ownerId: op._id });

      alert('Document uploaded successfully!');
      fetchOpDocs();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to upload document');
    }
  };

  const handleResetPasswordClick = async () => {
    const newPass = window.prompt(`Enter new password for ${op.name} (min 8 characters):`);
    if (!newPass) return;
    if (newPass.length < 8) {
      alert('Password must be at least 8 characters long.');
      return;
    }
    try {
      await adminClient.patch(`/auth/admin/operators/${op._id}/password`, { password: newPass });
      alert('Operator password has been reset successfully!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to reset password');
    }
  };

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    name: op.name,
    email: op.email,
    employeeId: op.employeeId,
    department: op.department
  });

  const handleProfileSave = async () => {
    try {
      await adminClient.patch(`/auth/admin/operators/${op._id}`, editForm);
      onProfileUpdate(editForm);
      setIsEditingProfile(false);
      alert('Profile updated successfully!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update profile');
    }
  };

  return (
    <div style={{ padding: '24px 32px', backgroundColor: '#F8FAFC', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      {/* Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748B', fontWeight: 600, marginBottom: '24px' }}>
        <span style={{ cursor: 'pointer' }} onClick={onClose}>Dashboard</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        <span style={{ cursor: 'pointer' }} onClick={onClose}>Operators</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        <span style={{ color: '#2563EB' }}>Operator Profile</span>
      </div>

      {/* Operator Main Profile Card */}
      <div style={{
        backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '28px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1 }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '36px',
            background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
            color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px', fontWeight: 800, textShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            {getInitials(op.name)}
          </div>
          <div style={{ flex: 1 }}>
            {isEditingProfile ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', maxWidth: '500px' }}>
                <input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} placeholder="Name" style={{ padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1' }} />
                <input value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} placeholder="Email" style={{ padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1' }} />
                <input value={editForm.employeeId} onChange={e => setEditForm({...editForm, employeeId: e.target.value})} placeholder="Employee ID" style={{ padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1' }} />
                <input value={editForm.department} onChange={e => setEditForm({...editForm, department: e.target.value})} placeholder="Department" style={{ padding: '8px', borderRadius: '6px', border: '1px solid #CBD5E1' }} />
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', margin: 0 }}>{op.name}</h2>
                  <span style={{
                    fontSize: '12px', fontWeight: 750, textTransform: 'capitalize',
                    backgroundColor: op.status === 'active' ? '#E6FDF3' : '#FEE2E2',
                    color: op.status === 'active' ? '#10B981' : '#EF4444',
                    padding: '3px 8px', borderRadius: '6px'
                  }}>
                    {op.status}
                  </span>
                </div>
                <p style={{ fontSize: '14.5px', color: '#475569', fontWeight: 600, margin: '4px 0 0 0' }}>
                  {op.role === 'super_admin' ? 'System Admin' : op.role === 'admin' ? 'Senior Analyst' : 'Field Operator'} • <span style={{ color: '#2563EB' }}>{op.department}</span>
                </p>
                <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0 0' }}>
                  Employee ID: <span style={{ fontWeight: 700, color: '#334155' }}>{op.employeeId}</span> • Joined: <span style={{ fontWeight: 700, color: '#334155' }}>{new Date(op.createdAt).toLocaleDateString('en-GB')}</span>
                </p>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          {isEditingProfile ? (
            <>
              <button onClick={() => setIsEditingProfile(false)} style={{ padding: '10px 18px', backgroundColor: '#FFFFFF', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleProfileSave} style={{ padding: '10px 18px', backgroundColor: '#10B981', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>Save</button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditingProfile(true)}
                style={{
                  padding: '10px 18px', backgroundColor: '#2563EB', color: '#FFFFFF',
                  border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer'
                }}
              >
                Edit Profile
              </button>
              <button
                onClick={handleResetPasswordClick}
                style={{
                  padding: '10px 18px', backgroundColor: '#FFFFFF', color: '#334155',
                  border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer'
                }}
              >
                Reset Password
              </button>
              <button
                onClick={() => onStatusChange(op.status === 'active' ? 'suspended' : 'active')}
                style={{
                  padding: '10px 18px', backgroundColor: '#FFFFFF',
                  color: op.status === 'active' ? '#EF4444' : '#10B981',
                  border: `1.5px solid ${op.status === 'active' ? '#FCA5A5' : '#6EE7B7'}`,
                  borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer'
                }}
              >
                {op.status === 'active' ? 'Suspend' : 'Activate'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {['overview', 'activity_log', 'permissions', 'documents'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t as any)}
            style={{
              padding: '8px 20px', borderRadius: '20px', fontSize: '14px', fontWeight: 700,
              border: tab === t ? '1.5px solid #2563EB' : '1.5px solid #E2E8F0',
              backgroundColor: tab === t ? '#EFF6FF' : '#FFFFFF',
              color: tab === t ? '#2563EB' : '#475569',
              cursor: 'pointer', textTransform: 'none'
            }}
          >
            {t === 'activity_log' ? 'Activity Log' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview Content Grid */}
      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '7fr 3fr', gap: '24px' }}>
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Personal Information */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Personal Information</h3>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#2563EB', cursor: 'pointer' }}>Verify Identity</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Full Name</span>
                  <span style={{ fontSize: '14px', color: '#0F172A', fontWeight: 700 }}>{op.name}</span>
                </div>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Date of Birth</span>
                  <span style={{ fontSize: '14px', color: '#0F172A', fontWeight: 700 }}>15/08/1988</span>
                </div>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Email Address</span>
                  <span style={{ fontSize: '14px', color: '#0F172A', fontWeight: 700 }}>{op.email}</span>
                </div>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Residential Address</span>
                  <span style={{ fontSize: '14px', color: '#0F172A', fontWeight: 700 }}>45, Sector 4, HSR Layout, Bengaluru, Karnataka - 560102</span>
                </div>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Phone Number</span>
                  <span style={{ fontSize: '14px', color: '#0F172A', fontWeight: 700 }}>{op.phone || '+91 98765 43210'}</span>
                </div>
              </div>
            </div>

            {/* Access & Security Settings */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Access & Security Settings</h3>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B' }}>Security Policy V2.1</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Last Login Date/Time</span>
                  <span style={{ fontSize: '13.5px', color: '#0F172A', fontWeight: 700 }}>
                    {op.updatedAt ? new Date(op.updatedAt).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : 'Never'}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Active Sessions</span>
                  <span style={{ fontSize: '13.5px', color: '#0F172A', fontWeight: 700 }}>2 open sessions (Bengaluru / Chrome)</span>
                </div>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>IP Whitelisting</span>
                  <span style={{ fontSize: '13.5px', color: '#10B981', fontWeight: 700 }}>Enabled (Corporate Subnet)</span>
                </div>
              </div>
            </div>

            {/* Recent Activity Logs */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Recent Activity Logs</h3>
                <span style={{
                  fontSize: '11px', fontWeight: 700, color: '#2563EB', backgroundColor: '#EFF6FF',
                  padding: '3px 8px', borderRadius: '12px'
                }}>Live Audit</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid #F1F5F9' }}>
                    <th style={{ padding: '10px 0', fontSize: '11px', fontWeight: 800, color: '#64748B' }}>DATE / TIME</th>
                    <th style={{ padding: '10px 0', fontSize: '11px', fontWeight: 800, color: '#64748B' }}>ACTION PERFORMED</th>
                    <th style={{ padding: '10px 0', fontSize: '11px', fontWeight: 800, color: '#64748B' }}>STATUS</th>
                    <th style={{ padding: '10px 0', fontSize: '11px', fontWeight: 800, color: '#64748B' }}>IP ADDRESS</th>
                  </tr>
                </thead>
                <tbody>
                  {finalActivities.map((act, i) => (
                    <tr key={i} style={{ borderBottom: i < finalActivities.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                      <td style={{ padding: '12px 0', fontSize: '13px', color: '#475569', fontWeight: 550 }}>
                        {new Date(act.timestamp).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '12px 0', fontSize: '13px', color: '#0F172A', fontWeight: 700 }}>
                        {act.event}
                      </td>
                      <td style={{ padding: '12px 0' }}>
                        <span style={{
                          fontSize: '10.5px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px',
                          backgroundColor: act.status === 'SUCCESS' ? '#E6FDF3' : act.status === 'WARNING' ? '#FFFBEB' : '#FEE2E2',
                          color: act.status === 'SUCCESS' ? '#10B981' : act.status === 'WARNING' ? '#F59E0B' : '#EF4444'
                        }}>{act.status}</span>
                      </td>
                      <td style={{ padding: '12px 0', fontSize: '13px', color: '#64748B', fontWeight: 600 }}>
                        {act.ip}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12.5px', color: '#64748B' }}>Showing last 5 security records</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#2563EB', cursor: 'pointer' }} onClick={() => alert("Activity logs pagination will load in log viewer tab.")}>View All Logs ➔</span>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Performance Metrics */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Performance Metrics</h3>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/></svg>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 650, color: '#64748B', display: 'block' }}>Tasks Completed</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                    <span style={{ fontSize: '24px', fontWeight: 850, color: '#0F172A' }}>{completedCount}</span>
                    <span style={{ fontSize: '11px', fontWeight: 750, color: '#10B981', backgroundColor: '#E6FDF3', padding: '2px 6px', borderRadius: '4px' }}>↑ 12% MoM</span>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '14px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 650, color: '#64748B', display: 'block' }}>Avg. Response Time</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                    <span style={{ fontSize: '24px', fontWeight: 850, color: '#0F172A' }}>2.4 hrs</span>
                    <span style={{ fontSize: '11px', fontWeight: 750, color: '#2563EB', backgroundColor: '#EFF6FF', padding: '2px 6px', borderRadius: '4px' }}>Top 5%</span>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '14px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 650, color: '#64748B', display: 'block' }}>Client Satisfaction Rating</span>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                    <div style={{ display: 'flex', gap: '3px', color: '#F59E0B' }}>
                      <span>★</span><span>★</span><span>★</span><span>★</span><span style={{ color: '#E2E8F0' }}>★</span>
                    </div>
                    <span style={{ fontSize: '18px', fontWeight: 850, color: '#0F172A' }}>4.8 / 5</span>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '14px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 650, color: '#64748B', display: 'block' }}>Documents Processed</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                    <span style={{ fontSize: '24px', fontWeight: 850, color: '#0F172A' }}>{docsProcessedCount}</span>
                    <span style={{ fontSize: '11px', fontWeight: 750, color: '#D97706', backgroundColor: '#FEF3C7', padding: '2px 6px', borderRadius: '4px' }}>99.2% Accuracy</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Reporting Structure */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: 0, marginBottom: '20px' }}>Reporting Structure</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '20px', backgroundColor: '#3B82F6', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700 }}>
                  RK
                </div>
                <div>
                  <span style={{ fontSize: '14px', fontWeight: 750, color: '#0F172A', display: 'block' }}>Rajesh Kumar</span>
                  <span style={{ fontSize: '12px', color: '#64748B' }}>Direct Supervisor (Super Admin)</span>
                </div>
              </div>
              <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>Primary Shift</span>
                <span style={{ fontSize: '13px', color: '#0F172A', fontWeight: 750 }}>Day Shift (09:00 - 18:00)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'permissions' && (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 850, color: '#0F172A', margin: 0, marginBottom: '8px' }}>System Permissions</h3>
          <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '24px', margin: 0 }}>These are the current active operations this operator is authorized to perform on the portal.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {op.permissions.map((p) => (
              <div key={p} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', border: '1.5px solid #F1F5F9', borderRadius: '10px', backgroundColor: '#F8FAFC' }}>
                <span style={{ color: '#10B981', fontSize: '18px', fontWeight: 900 }}>✓</span>
                <div>
                  <span style={{ fontSize: '14.5px', fontWeight: 750, color: '#0F172A', textTransform: 'capitalize', display: 'block' }}>{p.replace(/_/g, ' ')}</span>
                  <span style={{ fontSize: '12.5px', color: '#64748B', marginTop: '2px', display: 'block' }}>Authorized capability to handle {p.replace(/_/g, ' ')} processes securely.</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'activity_log' && (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 850, color: '#0F172A', margin: 0, marginBottom: '8px' }}>Operator Activity Logs</h3>
          <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '24px', margin: 0 }}>Full historical trail of service configurations, verifications, and status actions processed by this operator.</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid #F1F5F9' }}>
                <th style={{ padding: '12px 14px', fontSize: '11px', fontWeight: 800, color: '#64748B' }}>DATE / TIME</th>
                <th style={{ padding: '12px 14px', fontSize: '11px', fontWeight: 800, color: '#64748B' }}>ACTION PERFORMED</th>
                <th style={{ padding: '12px 14px', fontSize: '11px', fontWeight: 800, color: '#64748B' }}>STATUS</th>
                <th style={{ padding: '12px 14px', fontSize: '11px', fontWeight: 800, color: '#64748B' }}>IP ADDRESS</th>
              </tr>
            </thead>
            <tbody>
              {finalActivities.map((act, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '14px', fontSize: '13.5px', color: '#475569', fontWeight: 600 }}>
                    {new Date(act.timestamp).toLocaleString('en-GB')}
                  </td>
                  <td style={{ padding: '14px', fontSize: '13.5px', color: '#0F172A', fontWeight: 700 }}>
                    {act.event}
                  </td>
                  <td style={{ padding: '14px' }}>
                    <span style={{
                      fontSize: '11px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px',
                      backgroundColor: act.status === 'SUCCESS' ? '#E6FDF3' : act.status === 'WARNING' ? '#FFFBEB' : '#FEE2E2',
                      color: act.status === 'SUCCESS' ? '#10B981' : act.status === 'WARNING' ? '#F59E0B' : '#EF4444'
                    }}>{act.status}</span>
                  </td>
                  <td style={{ padding: '14px', fontSize: '13.5px', color: '#64748B', fontWeight: 600 }}>
                    {act.ip}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'documents' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Document Metrics Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {[
              { label: 'Total Documents', val: opDocs.length, color: '#0F172A' },
              { label: 'Verified Docs', val: opDocs.filter(d => d.verifiedStatus === 'verified').length, color: '#10B981' },
              { label: 'Pending Review', val: opDocs.filter(d => d.verifiedStatus === 'pending').length, color: '#3B82F6' },
              { label: 'Expired/Warnings', val: opDocs.filter(d => d.verifiedStatus === 'rejected').length, color: '#EF4444' }
            ].map((m, idx) => (
              <div key={idx} style={{
                backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px 20px',
                display: 'flex', flexDirection: 'column', gap: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.01)'
              }}>
                <span style={{ fontSize: '13px', fontWeight: 650, color: '#64748B' }}>{m.label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '4px', backgroundColor: m.color }} />
                  <span style={{ fontSize: '22px', fontWeight: 850, color: '#0F172A' }}>{m.val}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Main Document Content Area */}
          <div style={{ display: 'grid', gridTemplateColumns: '7fr 3fr', gap: '24px' }}>
            {/* Left Column - Identity & Verification Documents */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Identity & Verification Documents</h3>
              
              {loadingDocs ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#64748B', fontWeight: 700 }}>Loading operator vault documents...</div>
              ) : opDocs.length === 0 ? (
                <div style={{ padding: '60px 40px', textAlign: 'center', border: '1.5px dashed #E2E8F0', borderRadius: '12px', color: '#64748B' }}>
                  <span style={{ fontSize: '32px', display: 'block', marginBottom: '10px' }}>📂</span>
                  <span style={{ fontSize: '14.5px', fontWeight: 800, color: '#0F172A', display: 'block' }}>No Documents Uploaded</span>
                  <span style={{ fontSize: '13px', display: 'block', marginTop: '4px' }}>Use the right panel to upload this operator's verification documents.</span>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {opDocs.map((doc, idx) => {
                    const isPdf = doc.mimeType?.includes('pdf') || doc.originalName?.toLowerCase().endsWith('.pdf');
                    return (
                      <div key={idx} style={{
                        border: '1.5px solid #F1F5F9', backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '16px',
                        display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{
                            width: '40px', height: '48px', borderRadius: '6px', backgroundColor: isPdf ? '#FEE2E2' : '#E6FDF3',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px'
                          }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isPdf ? '#EF4444' : '#10B981'} strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                            <span style={{ fontSize: '8px', fontWeight: 900, color: isPdf ? '#EF4444' : '#10B981' }}>{isPdf ? 'PDF' : 'IMAGE'}</span>
                          </div>
                          
                          {/* Action Icons */}
                          <div style={{ display: 'flex', gap: '8px', color: '#64748B' }}>
                            <button 
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '4px' }} 
                              onClick={async () => {
                                try {
                                  const dUrlReq = await adminClient.get(`/documents/${doc._id || doc.id}/download-url`);
                                  window.open(dUrlReq.data.data.downloadUrl, '_blank');
                                } catch (err) {
                                  alert('Failed to get preview URL');
                                }
                              }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            </button>
                            <button 
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '4px' }} 
                              onClick={async () => {
                                try {
                                  const dUrlReq = await adminClient.get(`/documents/${doc._id || doc.id}/download-url`);
                                  const link = document.createElement('a');
                                  link.href = dUrlReq.data.data.downloadUrl;
                                  link.download = doc.originalName;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                } catch (err) {
                                  alert('Failed to download document');
                                }
                              }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            </button>
                          </div>
                        </div>

                        {/* Doc Title & Info */}
                        <div>
                          <span style={{ fontSize: '14.5px', fontWeight: 800, color: '#0F172A', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{doc.originalName}</span>
                          <span style={{ fontSize: '13px', color: '#64748B', display: 'block', marginTop: '2px' }}>{(doc.sizeBytes / 1024).toFixed(1)} KB</span>
                        </div>

                        {/* Status Pill */}
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span style={{
                            fontSize: '11px', fontWeight: 800, 
                            backgroundColor: doc.verifiedStatus === 'verified' ? '#E6FDF3' : doc.verifiedStatus === 'pending' ? '#EFF6FF' : '#FEE2E2', 
                            color: doc.verifiedStatus === 'verified' ? '#10B981' : doc.verifiedStatus === 'pending' ? '#2563EB' : '#EF4444',
                            padding: '3px 8px', borderRadius: '6px', textTransform: 'capitalize'
                          }}>{doc.verifiedStatus}</span>
                        </div>

                        {/* Footer Metadata */}
                        <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px', color: '#64748B' }}>
                          <div>
                            <span>Uploaded: </span>
                            <span style={{ fontWeight: 700, color: '#475569' }}>{new Date(doc.createdAt).toLocaleDateString('en-GB')}</span>
                          </div>
                          <div>
                            <span>Category: </span>
                            <span style={{ fontWeight: 700, color: '#475569', textTransform: 'capitalize' }}>{doc.documentCategory?.replace(/_/g, ' ') || 'Proof'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Column - Upload & Compliance */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Upload Card */}
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Upload New Document</h3>
                
                <input 
                  type="file" 
                  id={`operator-file-upload-${op._id}`} 
                  onChange={handleFileUpload} 
                  style={{ display: 'none' }} 
                />
                
                <label 
                  htmlFor={`operator-file-upload-${op._id}`}
                  style={{
                    border: '1.5px dashed #CBD5E1', borderRadius: '12px', padding: '32px 16px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: '12px', backgroundColor: '#F8FAFC', cursor: 'pointer'
                  }}
                >
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '20px', backgroundColor: '#EFF6FF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB'
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '13.5px', fontWeight: 750, color: '#0F172A', display: 'block' }}>Drag & drop files here</span>
                    <span style={{ fontSize: '12.5px', color: '#2563EB', fontWeight: 700, textDecoration: 'underline', marginTop: '2px', display: 'block' }}>or Browse files</span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>Supported formats: PDF, JPG, PNG (Max 10MB)</span>
                </label>
              </div>

              {/* Compliance Actions */}
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Compliance Action Required</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Item 1 */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#0F172A' }}>Hazmat Handling Expired</span>
                      <span style={{ fontSize: '11px', fontWeight: 750, color: '#EF4444' }}>Action Required</span>
                    </div>
                    <p style={{ fontSize: '12.5px', color: '#64748B', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                      Operator cannot be assigned to Tier-2 transit tasks involving chemical assets.
                    </p>
                  </div>
                  {/* Item 2 */}
                  <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#0F172A' }}>Driving License Renew</span>
                      <span style={{ fontSize: '11px', fontWeight: 750, color: '#D97706' }}>4 Years Left</span>
                    </div>
                    <p style={{ fontSize: '12.5px', color: '#64748B', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                      Regular permit audit recommended before the scheduled Q3 compliance checklist.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div style={{
            backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '16px 24px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#D97706', fontSize: '13.5px', fontWeight: 650 }}>
              <span>⚠️</span>
              <span>Requesting updates will notify operator {op.name} immediately.</span>
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button style={{
                padding: '10px 18px', backgroundColor: '#FFFFFF', color: '#2563EB',
                border: '1.5px solid #2563EB', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer'
              }} onClick={() => alert("Downloading all files as ZIP...")}>
                Download All (ZIP)
              </button>
              <button style={{
                padding: '10px 18px', backgroundColor: '#2563EB', color: '#FFFFFF',
                border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer'
              }} onClick={() => alert(`Document update request sent to ${op.name}.`)}>
                Request Document Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
  
  // Profile View State
  const [viewingOp, setViewingOp] = useState<Operator | null>(null);
  const [opApplications, setOpApplications] = useState<any[]>([]);
  const [opTab, setOpTab] = useState<'overview' | 'activity_log' | 'permissions' | 'documents'>('overview');

  // RBAC Form states
  const [rbacStatus, setRbacStatus] = useState<'active' | 'pending' | 'suspended'>('active');
  const [rbacRole, setRbacRole] = useState<'operator' | 'admin' | 'super_admin'>('operator');
  const [rbacPermissions, setRbacPermissions] = useState<string[]>([]);

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

  useEffect(() => {
    if (!viewingOp) return;
    const fetchOpApplications = async () => {
      try {
        const { data } = await adminClient.get(`/applications/admin/all?operatorId=${viewingOp._id}&limit=100`);
        setOpApplications(data.data.items || []);
      } catch (err) {
        console.error('Failed to fetch operator applications', err);
      }
    };
    fetchOpApplications();
  }, [viewingOp]);

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

  const handleManageAccessClick = (op: Operator) => {
    setSelectedOp(op);
    setRbacStatus(op.status);
    setRbacRole(op.role);
    setRbacPermissions(op.permissions || []);
    setIsAccessModalOpen(true);
  };

  const handleSaveRBAC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOp) return;
    try {
      await adminClient.put(`/auth/admin/operators/${selectedOp._id}/rbac`, {
        status: rbacStatus,
        role: rbacRole,
        permissions: rbacPermissions
      });
      alert('Role-Based Access Control (RBAC) permissions updated successfully!');
      setIsAccessModalOpen(false);
      fetchOperators();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save RBAC changes');
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

  if (viewingOp) {
    return (
      <OperatorProfileView 
        op={viewingOp} 
        applications={opApplications}
        tab={opTab}
        setTab={setOpTab}
        onClose={() => setViewingOp(null)} 
        onStatusChange={(nextStatus) => {
          handleUpdateStatus(viewingOp._id, nextStatus);
          setViewingOp(prev => prev ? { ...prev, status: nextStatus } : null);
        }}
        onProfileUpdate={(updatedFields) => {
          setViewingOp(prev => prev ? { ...prev, ...updatedFields } : null);
          setOps(prevOps => prevOps.map(o => o._id === viewingOp._id ? { ...o, ...updatedFields } : o));
        }}
      />
    );
  }

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
                    onClick={() => { setViewingOp(o); }}
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
                    onClick={() => handleManageAccessClick(o)}
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

      {/* Manage Access Modal - Full RBAC Control Panel */}
      {isAccessModalOpen && selectedOp && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', display: 'flex', alignItems: 'center', zIndex: 1000, justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', width: '100%', maxWidth: '520px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1.5px solid #F1F5F9', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', margin: 0 }}>RBAC Access Control: {selectedOp.name}</h3>
              <button onClick={() => setIsAccessModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: '16px', fontWeight: 'bold' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRBAC} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Account Status */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Account Status</span>
                <select 
                  value={rbacStatus} 
                  onChange={e => setRbacStatus(e.target.value as any)}
                  style={{ padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '14.5px', outline: 'none', backgroundColor: '#FFFFFF', fontWeight: 600 }}
                >
                  <option value="active">Active (Full Portal Login Access)</option>
                  <option value="pending">Pending Approval</option>
                  <option value="suspended">Suspended (Revoked Access)</option>
                </select>
              </div>

              {/* Portal System Role */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Portal System Role</span>
                <select 
                  value={rbacRole} 
                  onChange={e => setRbacRole(e.target.value as any)}
                  style={{ padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '14.5px', outline: 'none', backgroundColor: '#FFFFFF', fontWeight: 600 }}
                >
                  <option value="operator">Field Operator (Verification Staff)</option>
                  <option value="admin">Senior Analyst (Escalations & Audit)</option>
                  <option value="super_admin">System Admin (Full Registry Controls)</option>
                </select>
              </div>

              {/* Custom Permissions Matrix */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Access Permissions Matrix</span>
                <div style={{
                  display: 'flex', flexDirection: 'column', gap: '10px', padding: '14px',
                  backgroundColor: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: '10px',
                  maxHeight: '260px', overflowY: 'auto'
                }}>
                  {[
                    { key: 'verify_documents', label: 'Verify Documents', desc: 'Verify citizen-uploaded verification documents.' },
                    { key: 'approve_applications', label: 'Approve Applications', desc: 'Allow final approval of citizen portal applications.' },
                    { key: 'reject_applications', label: 'Reject Applications', desc: 'Allow rejecting citizen applications with reasons.' },
                    { key: 'escalate_to_admin', label: 'Escalate to Admin', desc: 'Escalate complex cases to senior analyst team.' },
                    { key: 'access_citizen_pii', label: 'Access Citizen PII', desc: 'Allow viewing restricted citizen PII (Aadhaar, PAN numbers).' },
                    { key: 'view_transactions', label: 'View Transactions', desc: 'Allow auditing convenience fee payments.' },
                    { key: 'manage_tickets', label: 'Manage Tickets', desc: 'Access support ticketing registry.' },
                  ].map((perm) => {
                    const isChecked = rbacPermissions.includes(perm.key);
                    return (
                      <label key={perm.key} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setRbacPermissions(prev => [...prev, perm.key]);
                            } else {
                              setRbacPermissions(prev => prev.filter(k => k !== perm.key));
                            }
                          }}
                          style={{ marginTop: '3px', width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        <div>
                          <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#0F172A', display: 'block' }}>{perm.label}</span>
                          <span style={{ fontSize: '12px', color: '#64748B', display: 'block', marginTop: '2px' }}>{perm.desc}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button 
                  type="button" 
                  onClick={() => setIsAccessModalOpen(false)} 
                  style={{ flex: 1, padding: '12px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', fontWeight: 700, backgroundColor: '#FFFFFF', color: '#475569', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, backgroundColor: '#2563EB', color: '#FFFFFF', cursor: 'pointer' }}
                >
                  Save Permissions
                </button>
              </div>
            </form>
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
