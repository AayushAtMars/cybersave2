import React, { useEffect, useState } from 'react';
import { adminClient } from '../api/client';

interface Message {
  senderId: string;
  senderRole: 'citizen' | 'operator' | 'system';
  message: string;
  timestamp: string;
}

interface Ticket {
  _id: string;
  citizenId: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'escalated';
  messages: Message[];
  assignedOperatorId?: string;
  assignedOperatorName?: string;
  category?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  attachmentUrl?: string;
  internalNotes?: { authorName: string; authorRole: string; note: string; timestamp: string }[];
  createdAt: string;
  updatedAt: string;
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isRespondModalOpen, setIsRespondModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Resolution form states
  const [isRespondPageOpen, setIsRespondPageOpen] = useState(false);
  const [resSummary, setResSummary] = useState('Google OAuth endpoint redirect URI mismatch identified and corrected. Client credentials updated in Google Cloud Console. Temporary direct portal redirect provided during investigation.');
  const [resCategory, setResCategory] = useState('Configuration Fix');
  const [resRootCause, setResRootCause] = useState('Third-Party Service Misconfiguration');
  const [resTime, setResTime] = useState('2 days, 4 hours');
  const [resTags, setResTags] = useState(['OAuth', 'Google SSO', '502-error']);
  const [notifyReporter, setNotifyReporter] = useState(true);
  const [csatSurvey, setCsatSurvey] = useState(true);

  // Filters State
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [priorityFilter, setPriorityFilter] = useState('All Priority');
  const [page, setPage] = useState(1);

  // Create Modal Form State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createSubject, setCreateSubject] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createCategory, setCreateCategory] = useState('Technical');
  const [createPriority, setCreatePriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [createAssignedName, setCreateAssignedName] = useState('Unassigned');

  const fetchTickets = async () => {
    try {
      const { data } = await adminClient.get('/support/admin/tickets');
      setTickets(data.data.items || []);
      // If we are currently responding/viewing a ticket, refresh its detailed state
      if (selectedTicket) {
        const active = (data.data.items || []).find((t: Ticket) => t._id === selectedTicket._id);
        if (active) setSelectedTicket(active);
      }
    } catch (err) {
      console.error('Failed to fetch tickets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 5000); // refresh every 5s

    const handleOpenCreateModal = () => setIsCreateModalOpen(true);
    window.addEventListener('open-create-ticket-modal', handleOpenCreateModal);

    return () => {
      clearInterval(interval);
      window.removeEventListener('open-create-ticket-modal', handleOpenCreateModal);
    };
  }, [selectedTicket?._id]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;
    try {
      await adminClient.post(`/support/tickets/${selectedTicket._id}/reply`, {
        message: replyText,
      });
      setReplyText('');
      fetchTickets();
    } catch (err) {
      alert('Failed to send reply');
    }
  };
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminClient.post('/support/tickets', {
        subject: createSubject,
        description: createDescription,
        category: createCategory,
        priority: createPriority,
        assignedOperatorName: createAssignedName
      });
      alert('Support ticket created successfully');
      setIsCreateModalOpen(false);
      setCreateSubject('');
      setCreateDescription('');
      fetchTickets();
    } catch (err) {
      alert('Failed to create support ticket');
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: 'in_progress' | 'resolved' | 'closed' | 'escalated') => {
    try {
      // The status patch endpoint on support-service is /operator/tickets/:id/status
      await adminClient.patch(`/support/operator/tickets/${id}/status`, { status: newStatus });
      alert(`Ticket status updated to ${newStatus.toUpperCase()}`);
      fetchTickets();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  // Filter Logic
  const filteredTickets = tickets.filter(t => {
    const matchesSearch = 
      t.subject.toLowerCase().includes(search.toLowerCase()) || 
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t._id.toLowerCase().includes(search.toLowerCase()) ||
      (t.assignedOperatorName || '').toLowerCase().includes(search.toLowerCase());

    const matchesCategory = categoryFilter === 'All Categories' || t.category === categoryFilter;
    const matchesStatus = statusFilter === 'All Status' || t.status === statusFilter.toLowerCase().replace(' ', '_');
    const matchesPriority = priorityFilter === 'All Priority' || t.priority === priorityFilter.toLowerCase();

    return matchesSearch && matchesCategory && matchesStatus && matchesPriority;
  });

  // Pagination
  const limit = 9;
  const totalPages = Math.ceil(filteredTickets.length / limit);
  const paginatedTickets = filteredTickets.slice((page - 1) * limit, page * limit);

  // Stats Card Calculations
  const totalCount = tickets.length;
  const openCount = tickets.filter(t => t.status === 'open').length;
  const inProgressCount = tickets.filter(t => t.status === 'in_progress').length;
  const resolvedCount = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;

  const getTktIdStr = (t: Ticket) => {
    const year = new Date(t.createdAt).getFullYear();
    const indexStr = t._id.slice(-3).toUpperCase();
    return `TKT-${year}-${indexStr}`;
  };

  const getStatusBadgeStyles = (status: string) => {
    switch (status) {
      case 'open':
        return { bg: '#EFF6FF', color: '#2563EB' };
      case 'in_progress':
        return { bg: '#FFFBEB', color: '#F59E0B' };
      case 'resolved':
      case 'closed':
        return { bg: '#E6FDF3', color: '#10B981' };
      case 'escalated':
        return { bg: '#FEE2E2', color: '#EF4444' };
      default:
        return { bg: '#F1F5F9', color: '#475569' };
    }
  };

  const getPriorityBadgeStyles = (priority: string = 'medium') => {
    switch (priority.toLowerCase()) {
      case 'critical':
        return { bg: '#FEE2E2', color: '#EF4444' };
      case 'high':
        return { bg: '#FFF5F5', color: '#EF4444' };
      case 'medium':
        return { bg: '#EFF6FF', color: '#2563EB' };
      default:
        return { bg: '#F1F5F9', color: '#475569' };
    }
  };

  if (selectedTicket && isRespondPageOpen) {
    const tktId = getTktIdStr(selectedTicket);
    const statusBadge = getStatusBadgeStyles(selectedTicket.status);
    const priorityBadge = getPriorityBadgeStyles(selectedTicket.priority);
    const citizenInitials = 'JS';
    const agentInitials = selectedTicket.assignedOperatorName ? selectedTicket.assignedOperatorName.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2) : 'AS';

    const handleConfirmResolution = async () => {
      try {
        await adminClient.patch(`/support/operator/tickets/${selectedTicket._id}/status`, { status: 'resolved' });
        await adminClient.post(`/support/tickets/${selectedTicket._id}/reply`, {
          message: `✅ Ticket Resolved.\nResolution Summary: ${resSummary}\nCategory: ${resCategory}\nRoot Cause: ${resRootCause}`
        });
        alert('Ticket marked as RESOLVED and notifications dispatched!');
        setIsRespondPageOpen(false);
        fetchTickets();
      } catch (err) {
        alert('Failed to resolve support ticket');
      }
    };

    return (
      <div style={{ padding: '24px 32px', backgroundColor: '#F8FAFC', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
        {/* Breadcrumbs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748B', fontWeight: 600, marginBottom: '24px' }}>
          <span style={{ cursor: 'pointer' }} onClick={() => setIsRespondPageOpen(false)}>Dashboard</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          <span style={{ cursor: 'pointer' }} onClick={() => setIsRespondPageOpen(false)}>Support Tickets</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          <span style={{ cursor: 'pointer' }} onClick={() => setIsRespondPageOpen(false)}>Ticket #{tktId}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          <span style={{ color: '#2563EB' }}>Resolution</span>
        </div>

        {/* Resolve Ticket Title */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 850, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>Resolve Ticket #{tktId}</h1>
            <span style={{
              fontSize: '11px', fontWeight: 800, textTransform: 'capitalize',
              padding: '3px 8px', borderRadius: '6px',
              backgroundColor: statusBadge.bg, color: statusBadge.color
            }}>{selectedTicket.status.replace('_', ' ')}</span>
          </div>
        </div>

        {/* Main Grid Content */}
        <div style={{ display: 'grid', gridTemplateColumns: '7fr 3fr', gap: '24px', marginBottom: '28px' }}>
          {/* Left Column - Resolution Specs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Resolution Specifications</h3>

              {/* Summary Textarea */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>Resolution Summary</span>
                <textarea
                  value={resSummary}
                  onChange={e => setResSummary(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 16px', border: '1.5px solid #E2E8F0', borderRadius: '10px',
                    fontSize: '14px', minHeight: '110px', outline: 'none', fontFamily: 'inherit', resize: 'vertical',
                    lineHeight: 1.5, color: '#1E293B', fontWeight: 550
                  }}
                />
              </div>

              {/* Dropdowns row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>Resolution Category</span>
                  <select
                    value={resCategory}
                    onChange={e => setResCategory(e.target.value)}
                    style={{ padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', outline: 'none', backgroundColor: '#FFFFFF', fontWeight: 600, color: '#1E293B' }}
                  >
                    <option value="Configuration Fix">Configuration Fix</option>
                    <option value="Bug Fix">Bug Fix</option>
                    <option value="Documentation Update">Documentation Update</option>
                    <option value="Account Access Recovery">Account Access Recovery</option>
                    <option value="Server/Infrastructural Patch">Server/Infrastructural Patch</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>Root Cause</span>
                  <select
                    value={resRootCause}
                    onChange={e => setResRootCause(e.target.value)}
                    style={{ padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', outline: 'none', backgroundColor: '#FFFFFF', fontWeight: 600, color: '#1E293B' }}
                  >
                    <option value="Third-Party Service Misconfiguration">Third-Party Service Misconfiguration</option>
                    <option value="Code bug in redirect controller">Code bug in redirect controller</option>
                    <option value="Server downtime / timeout error">Server downtime / timeout error</option>
                    <option value="Missing profile access scope attributes">Missing profile access scope attributes</option>
                    <option value="User authentication failure">User authentication failure</option>
                  </select>
                </div>
              </div>

              {/* Time & Tags Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>Time to Resolution</span>
                  <input
                    type="text"
                    value={resTime}
                    onChange={e => setResTime(e.target.value)}
                    style={{ padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', outline: 'none', fontWeight: 600, color: '#1E293B' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>Internal Tags</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '6px 10px', border: '1.5px solid #E2E8F0', borderRadius: '8px', minHeight: '42px', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
                    {resTags.map(tag => (
                      <span key={tag} style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 700,
                        backgroundColor: '#F1F5F9', color: '#475569', padding: '3px 8px', borderRadius: '6px'
                      }}>
                        {tag}
                        <button type="button" onClick={() => setResTags(prev => prev.filter(t => t !== tag))} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94A3B8', fontWeight: 800, padding: 0 }}>×</button>
                      </span>
                    ))}
                    <input 
                      type="text"
                      placeholder="+ Add Tag"
                      onKeyDown={e => {
                        if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                          setResTags(prev => [...prev, e.currentTarget.value.trim()]);
                          e.currentTarget.value = '';
                        }
                      }}
                      style={{ border: 'none', outline: 'none', fontSize: '12.5px', color: '#475569', fontWeight: 600, width: '70px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '1px solid #F1F5F9', paddingTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', display: 'block' }}>Notify Reporter (John Smith) via Email</span>
                    <span style={{ fontSize: '12.5px', color: '#64748B', display: 'block', marginTop: '2px' }}>Send a summary and resolution notes immediately upon confirmation.</span>
                  </div>
                  <div 
                    onClick={() => setNotifyReporter(!notifyReporter)}
                    style={{
                      width: '44px', height: '24px', borderRadius: '12px',
                      backgroundColor: notifyReporter ? '#2563EB' : '#CBD5E1',
                      cursor: 'pointer', position: 'relative', transition: '0.2s'
                    }}
                  >
                    <div style={{
                      width: '18px', height: '18px', borderRadius: '9px', backgroundColor: '#FFFFFF',
                      position: 'absolute', top: '3px', left: notifyReporter ? '23px' : '3px',
                      transition: '0.2s'
                    }} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', display: 'block' }}>Customer Satisfaction Survey</span>
                    <span style={{ fontSize: '12.5px', color: '#64748B', display: 'block', marginTop: '2px' }}>Embed a CSAT rating block at the footer of the resolution email.</span>
                  </div>
                  <div 
                    onClick={() => setCsatSurvey(!csatSurvey)}
                    style={{
                      width: '44px', height: '24px', borderRadius: '12px',
                      backgroundColor: csatSurvey ? '#2563EB' : '#CBD5E1',
                      cursor: 'pointer', position: 'relative', transition: '0.2s'
                    }}
                  >
                    <div style={{
                      width: '18px', height: '18px', borderRadius: '9px', backgroundColor: '#FFFFFF',
                      position: 'absolute', top: '3px', left: csatSurvey ? '23px' : '3px',
                      transition: '0.2s'
                    }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions Card */}
            <div style={{
              backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '16px 24px',
              display: 'flex', gap: '12px', alignItems: 'center'
            }}>
              <button 
                onClick={handleConfirmResolution}
                style={{ padding: '12px 24px', backgroundColor: '#2563EB', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
              >
                Confirm Resolution
              </button>
              <button 
                onClick={() => { alert('Draft saved.'); setIsRespondPageOpen(false); }}
                style={{ padding: '12px 24px', backgroundColor: '#FFFFFF', color: '#475569', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
              >
                Save as Draft
              </button>
              <button 
                onClick={() => setIsRespondPageOpen(false)}
                style={{ background: 'none', border: 'none', color: '#64748B', fontSize: '14px', fontWeight: 700, cursor: 'pointer', marginLeft: '12px' }}
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Right Column - Summary & Preview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Ticket Summary */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: 0, marginBottom: '20px' }}>Ticket Summary</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 650, color: '#64748B' }}>Ticket ID</span>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>{tktId}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 650, color: '#64748B' }}>Priority</span>
                  <span style={{
                    fontSize: '11.5px', fontWeight: 800, textTransform: 'capitalize',
                    padding: '2px 6px', borderRadius: '4px',
                    backgroundColor: priorityBadge.bg, color: priorityBadge.color
                  }}>{selectedTicket.priority || 'medium'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 650, color: '#64748B' }}>Category</span>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>{selectedTicket.category || 'Technical'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 650, color: '#64748B' }}>Reporter</span>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>John Smith</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 650, color: '#64748B' }}>Assigned To</span>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>{selectedTicket.assignedOperatorName || 'Unassigned'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', fontWeight: 650, color: '#64748B' }}>Created</span>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>{new Date(selectedTicket.createdAt).toLocaleDateString('en-GB')}</span>
                </div>
                {selectedTicket.attachmentUrl && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #F1F5F9', paddingTop: '10px', marginTop: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 650, color: '#64748B' }}>Attachment</span>
                    <a href={selectedTicket.attachmentUrl} target="_blank" rel="noreferrer" style={{ fontSize: '13px', color: '#2563EB', fontWeight: 750, textDecoration: 'underline' }}>View Image/PDF</a>
                  </div>
                )}
              </div>
            </div>

            {/* Notification Preview */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Notification Preview</h3>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#2563EB', textTransform: 'uppercase' }}>Email Mockup</span>
              </div>

              <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', padding: '14px', backgroundColor: '#F8FAFC', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <span style={{ fontWeight: 700 }}>Subject:</span> Resolved: {selectedTicket.subject} (#{tktId})
                </div>
                <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <p style={{ margin: 0, fontWeight: 700 }}>Hello John Smith,</p>
                  <p style={{ margin: 0, color: '#475569', lineHeight: 1.4 }}>
                    Our technical support team has marked your issue as <span style={{ color: '#2563EB', fontWeight: 700 }}>Resolved</span>.
                  </p>
                  
                  {/* Summary Box */}
                  <div style={{ border: '1.5px solid #E2E8F0', borderRadius: '8px', padding: '10px', backgroundColor: '#FFFFFF', color: '#1E293B', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Resolution Summary:</span>
                    <span style={{ fontSize: '12.5px', fontWeight: 550, lineHeight: 1.4 }}>{resSummary}</span>
                  </div>

                  {csatSurvey && (
                    <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '10px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: 650 }}>How would you rate our support?</span>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', color: '#F59E0B', fontSize: '16px' }}>
                        <span>☆</span><span>☆</span><span>☆</span><span>☆</span><span>☆</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedTicket && isViewModalOpen) {
    const tktId = getTktIdStr(selectedTicket);
    const statusBadge = getStatusBadgeStyles(selectedTicket.status);
    const priorityBadge = getPriorityBadgeStyles(selectedTicket.priority);
    const citizenInitials = 'JS';
    const agentInitials = selectedTicket.assignedOperatorName ? selectedTicket.assignedOperatorName.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2) : 'AS';

    return (
      <div style={{ padding: '24px 32px', backgroundColor: '#F8FAFC', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
        {/* Breadcrumbs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748B', fontWeight: 600, marginBottom: '24px' }}>
          <span style={{ cursor: 'pointer' }} onClick={() => setIsViewModalOpen(false)}>Dashboard</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          <span style={{ cursor: 'pointer' }} onClick={() => setIsViewModalOpen(false)}>Support Tickets</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          <span style={{ color: '#2563EB' }}>Ticket #{tktId}</span>
        </div>

        {/* Ticket Title & Status */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 850, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>{selectedTicket.subject}</h1>
            <span style={{
              fontSize: '11px', fontWeight: 800, textTransform: 'capitalize',
              padding: '3px 8px', borderRadius: '6px',
              backgroundColor: statusBadge.bg, color: statusBadge.color
            }}>{selectedTicket.status.replace('_', ' ')}</span>
          </div>
          <p style={{ fontSize: '14.5px', color: '#64748B', marginTop: '6px', fontWeight: 550 }}>{selectedTicket.description}</p>
        </div>

        {/* Main Columns Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '7fr 3fr', gap: '24px', marginBottom: '28px' }}>
          {/* Left Column - Conversation Thread */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Conversation Thread Card */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: 0, marginBottom: '20px' }}>Conversation Thread</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                {selectedTicket.messages.map((m, idx) => {
                  const isOp = m.senderRole === 'operator';
                  const isBot = m.senderRole === 'system';
                  const senderName = isOp ? (selectedTicket.assignedOperatorName || 'Support Agent') : isBot ? 'System Bot' : 'John Smith';
                  const initials = senderName.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2);
                  
                  return (
                    <div key={idx} style={{ 
                      display: 'flex', gap: '14px', padding: '16px', 
                      backgroundColor: '#F8FAFC', border: '1.5px solid #F1F5F9', borderRadius: '12px' 
                    }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '18px',
                        backgroundColor: isOp ? '#EFF6FF' : '#F1F5F9',
                        color: isOp ? '#2563EB' : '#475569',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '13px', fontWeight: 700
                      }}>{initials}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>{senderName}</span>
                            {isOp && <span style={{ fontSize: '10px', fontWeight: 800, backgroundColor: '#EFF6FF', color: '#2563EB', padding: '1px 5px', borderRadius: '4px' }}>Agent</span>}
                            {!isOp && !isBot && <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748B' }}>Customer / Reporter</span>}
                          </div>
                          <span style={{ fontSize: '12px', color: '#64748B' }}>{new Date(m.timestamp).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p style={{ fontSize: '13.5px', color: '#334155', fontWeight: 550, margin: '8px 0 0 0', lineHeight: 1.4 }}>{m.message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Write a Response */}
              <div style={{ borderTop: '1.5px solid #F1F5F9', paddingTop: '20px' }}>
                <h4 style={{ fontSize: '14.5px', fontWeight: 800, color: '#0F172A', margin: 0, marginBottom: '12px' }}>Write a Response</h4>
                <textarea
                  placeholder={`Type your response to John Smith here...`}
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 16px', border: '1.5px solid #E2E8F0', borderRadius: '10px',
                    fontSize: '13.5px', minHeight: '100px', outline: 'none', fontFamily: 'inherit', resize: 'vertical'
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={{ padding: '8px 14px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '13px', fontWeight: 700, backgroundColor: '#FFFFFF', color: '#475569', cursor: 'pointer' }} onClick={() => alert("Draft saved locally.")}>Save Draft</button>
                    <button style={{ padding: '8px 18px', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, backgroundColor: '#2563EB', color: '#FFFFFF', cursor: 'pointer' }} onClick={async () => {
                      if (!replyText.trim()) return;
                      await adminClient.post(`/support/tickets/${selectedTicket._id}/reply`, { message: replyText });
                      setReplyText('');
                      fetchTickets();
                    }}>Send Reply</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Ticket Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: 0, marginBottom: '20px' }}>Ticket Details</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 650, color: '#64748B' }}>Ticket ID</span>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>{tktId}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 650, color: '#64748B' }}>Category</span>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>{selectedTicket.category || 'Technical'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 650, color: '#64748B' }}>Priority</span>
                  <span style={{
                    fontSize: '11px', fontWeight: 800, textTransform: 'capitalize',
                    padding: '2px 6px', borderRadius: '4px',
                    backgroundColor: priorityBadge.bg, color: priorityBadge.color
                  }}>{selectedTicket.priority || 'medium'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 650, color: '#64748B' }}>Created On</span>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>{new Date(selectedTicket.createdAt).toLocaleDateString('en-GB')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 650, color: '#64748B' }}>Last Updated</span>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>{new Date(selectedTicket.updatedAt).toLocaleDateString('en-GB')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 650, color: '#64748B' }}>Assigned To</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '12px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700 }}>{agentInitials}</div>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>{selectedTicket.assignedOperatorName || 'Unassigned'}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 650, color: '#64748B' }}>Reporter</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '12px', backgroundColor: '#F1F5F9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700 }}>{citizenInitials}</div>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>John Smith</span>
                  </div>
                </div>
                {selectedTicket.attachmentUrl && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 650, color: '#64748B' }}>Attachment</span>
                    <a href={selectedTicket.attachmentUrl} target="_blank" rel="noreferrer" style={{ fontSize: '13px', color: '#2563EB', fontWeight: 750, textDecoration: 'underline' }}>View Image/PDF</a>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button style={{ width: '100%', padding: '10px', border: 'none', borderRadius: '8px', fontSize: '13.5px', fontWeight: 700, backgroundColor: '#FEE2E2', color: '#EF4444', cursor: 'pointer' }} onClick={() => handleUpdateStatus(selectedTicket._id, 'escalated')}>Escalate Ticket</button>
                <button style={{ width: '100%', padding: '10px', border: 'none', borderRadius: '8px', fontSize: '13.5px', fontWeight: 700, backgroundColor: '#E6FDF3', color: '#10B981', cursor: 'pointer' }} onClick={() => handleUpdateStatus(selectedTicket._id, 'resolved')}>Mark as Resolved</button>
                <button style={{ width: '100%', padding: '10px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '13.5px', fontWeight: 700, backgroundColor: '#FFFFFF', color: '#475569', cursor: 'pointer' }} onClick={() => {
                  const agentName = window.prompt("Enter agent name to reassign to:");
                  if (agentName) {
                    adminClient.patch(`/support/operator/tickets/${selectedTicket._id}/reassign`, { assignedOperatorName: agentName }).then(() => {
                      alert(`Ticket reassigned to ${agentName}`);
                      fetchTickets();
                    }).catch(() => alert("Failed to reassign"));
                  }
                }}>Reassign Ticket</button>
              </div>
            </div>
          </div>
        </div>

        {/* Internal Team Notes & Activity */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Internal Team Notes & Activity</h3>
            <button style={{
              background: 'none', border: 'none', color: '#2563EB', fontSize: '13px', fontWeight: 750, cursor: 'pointer'
            }} onClick={() => {
              const noteText = window.prompt("Enter internal private note:");
              if (noteText) {
                adminClient.post(`/support/operator/tickets/${selectedTicket._id}/notes`, { note: noteText }).then(() => {
                  alert("Internal note added successfully!");
                  fetchTickets();
                }).catch(() => alert("Failed to add note"));
              }
            }}>
              + Add Private Note
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {(!selectedTicket.internalNotes || selectedTicket.internalNotes.length === 0) ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#64748B', border: '1.5px dashed #F1F5F9', borderRadius: '10px' }}>
                No private internal notes have been recorded for this ticket yet.
              </div>
            ) : (
              selectedTicket.internalNotes.map((note, idx) => (
                <div key={idx} style={{
                  backgroundColor: '#FFFBEB', border: '1.5px solid #FEF3C7', borderRadius: '12px', padding: '16px',
                  display: 'flex', flexDirection: 'column', gap: '6px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '14px' }}>📝</span>
                      <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#D97706' }}>Note by {note.authorName} ({note.authorRole})</span>
                    </div>
                    <span style={{ fontSize: '12px', color: '#64748B' }}>{new Date(note.timestamp).toLocaleString('en-GB')}</span>
                  </div>
                  <p style={{ fontSize: '13.5px', color: '#451A03', fontWeight: 550, margin: 0, lineHeight: 1.4 }}>{note.note}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px', backgroundColor: '#F8FAFC', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      {/* Breadcrumbs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748B', fontWeight: 600 }}>
          <span>Dashboard</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          <span style={{ color: '#2563EB' }}>Support Tickets</span>
        </div>
        <button
          onClick={() => {
            const header = ["Ticket ID,Subject,Category,Priority,Status,Assigned To,Created At"].join(",");
            const rows = tickets.map(t => `"${getTktIdStr(t)}","${t.subject?.replace(/"/g, '""')}","${t.category || ''}","${t.priority || ''}","${t.status}","${t.assignedOperatorName || 'Unassigned'}","${new Date(t.createdAt).toLocaleDateString('en-GB')}"`);
            const csvContent = header + "\n" + rows.join("\n");
            
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `tickets_report_${new Date().toISOString().slice(0,10)}.csv`);
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
        <h1 style={{ fontSize: '28px', fontWeight: 850, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>Support Ticket Management</h1>
        <p style={{ fontSize: '14.5px', color: '#64748B', marginTop: '4px', fontWeight: 500 }}>Track, manage, and resolve all customer support tickets efficiently.</p>
      </div>

      {/* Stats Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        {/* Total Tickets */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '16px', border: '1.5px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.01)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Tickets</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 850, color: '#0F172A', margin: 0 }}>{totalCount}</h2>
          <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: 550, marginTop: '4px', display: 'block' }}>Active & resolved</span>
        </div>

        {/* Open Tickets */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '16px', border: '1.5px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.01)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Open Tickets</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#FEE2E2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 850, color: '#0F172A', margin: 0 }}>{openCount}</h2>
          <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: 550, marginTop: '4px', display: 'block' }}>Awaiting response</span>
        </div>

        {/* In Progress */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '16px', border: '1.5px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.01)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>In Progress</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#FFFBEB', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 850, color: '#0F172A', margin: 0 }}>{inProgressCount}</h2>
          <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: 550, marginTop: '4px', display: 'block' }}>Being handled</span>
        </div>

        {/* Resolved */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '16px', border: '1.5px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.01)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Resolved</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#E6FDF3', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 850, color: '#0F172A', margin: 0 }}>{resolvedCount}</h2>
          <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: 550, marginTop: '4px', display: 'block' }}>Successfully closed</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px', padding: '16px 20px', backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1.5px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              placeholder="Filter tickets..."
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
            <option value="Technical">Technical</option>
            <option value="Billing">Billing</option>
            <option value="Account">Account</option>
            <option value="Performance">Performance</option>
            <option value="Communication">Communication</option>
          </select>

          {/* Status Dropdown */}
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
            <option value="All Status">All Status</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Escalated">Escalated</option>
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
            <option value="All Priority">All Priority</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748B' }}>
          Showing {filteredTickets.length === 0 ? 0 : (page - 1) * limit + 1}-{Math.min(page * limit, filteredTickets.length)} of {filteredTickets.length}
        </span>
      </div>

      {/* Tickets Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', fontSize: '14.5px', color: '#64748B', fontWeight: 600 }}>Loading tickets...</div>
      ) : filteredTickets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1.5px solid #E2E8F0' }}>
          <span style={{ fontSize: '14.5px', color: '#64748B', fontWeight: 600 }}>No tickets match your filter criteria.</span>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px', marginBottom: '28px' }}>
          {paginatedTickets.map(t => {
            const statusBadge = getStatusBadgeStyles(t.status);
            const priorityBadge = getPriorityBadgeStyles(t.priority);
            const tktId = getTktIdStr(t);

            return (
              <div key={t._id} style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1.5px solid #E2E8F0', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.01)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>{tktId}</span>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    textTransform: 'capitalize',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    backgroundColor: statusBadge.bg,
                    color: statusBadge.color
                  }}>
                    {t.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Ticket Title */}
                <div>
                  <h4 style={{ fontSize: '15.5px', fontWeight: 800, color: '#0F172A', margin: 0, lineHeight: 1.4 }}>{t.subject}</h4>
                </div>

                {/* Details List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1.5px solid #F1F5F9', borderBottom: '1.5px solid #F1F5F9', padding: '14px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#64748B', fontWeight: 650 }}>Category</span>
                    <span style={{ color: '#0F172A', fontWeight: 750 }}>{t.category || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', alignItems: 'center' }}>
                    <span style={{ color: '#64748B', fontWeight: 650 }}>Priority</span>
                    <span style={{
                      fontSize: '11.5px',
                      fontWeight: 800,
                      textTransform: 'capitalize',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: priorityBadge.bg,
                      color: priorityBadge.color
                    }}>{t.priority || 'medium'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#64748B', fontWeight: 650 }}>Created On</span>
                    <span style={{ color: '#0F172A', fontWeight: 750 }}>{new Date(t.createdAt).toLocaleDateString('en-GB')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#64748B', fontWeight: 650 }}>Last Updated</span>
                    <span style={{ color: '#0F172A', fontWeight: 750 }}>{new Date(t.updatedAt).toLocaleDateString('en-GB')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#64748B', fontWeight: 650 }}>Assigned To</span>
                    <span style={{ color: '#0F172A', fontWeight: 750 }}>{t.assignedOperatorName || 'Unassigned'}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => { setSelectedTicket(t); setIsViewModalOpen(true); }}
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
                    View
                  </button>
                  <button
                    onClick={() => { setSelectedTicket(t); setIsRespondPageOpen(true); }}
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
                    Respond
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
          Showing {filteredTickets.length} active tickets
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

      {/* View Ticket Details Modal */}
      {isViewModalOpen && selectedTicket && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', display: 'flex', alignItems: 'center', zIndex: 1000, justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', width: '100%', maxWidth: '500px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1.5px solid #F1F5F9', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Ticket Details</h3>
              <button onClick={() => setIsViewModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: '16px', fontWeight: 'bold' }}>
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748B' }}>Ticket ID</span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>{getTktIdStr(selectedTicket)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748B' }}>Status</span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'capitalize',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  backgroundColor: getStatusBadgeStyles(selectedTicket.status).bg,
                  color: getStatusBadgeStyles(selectedTicket.status).color
                }}>{selectedTicket.status}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Subject</span>
                <span style={{ fontSize: '14.5px', color: '#0F172A', fontWeight: 850 }}>{selectedTicket.subject}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Description</span>
                <p style={{ fontSize: '13.5px', color: '#334155', fontWeight: 550, margin: 0, lineHeight: 1.4 }}>{selectedTicket.description}</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px', paddingTop: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748B' }}>Category</span>
                <span style={{ fontSize: '13.5px', color: '#0F172A', fontWeight: 750 }}>{selectedTicket.category || 'Technical'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748B' }}>Priority</span>
                <span style={{
                  fontSize: '11.5px',
                  fontWeight: 800,
                  textTransform: 'capitalize',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: getPriorityBadgeStyles(selectedTicket.priority).bg,
                  color: getPriorityBadgeStyles(selectedTicket.priority).color
                }}>{selectedTicket.priority || 'medium'}</span>
              </div>
              {selectedTicket.attachmentUrl && (
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748B' }}>Attachment</span>
                  <a href={selectedTicket.attachmentUrl} target="_blank" rel="noreferrer" style={{ fontSize: '13px', color: '#2563EB', fontWeight: 750, textDecoration: 'underline' }}>View file</a>
                </div>
              )}
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

      {/* Respond/Chat Modal */}
      {isRespondModalOpen && selectedTicket && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', display: 'flex', alignItems: 'center', zIndex: 1000, justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', width: '100%', maxWidth: '580px', height: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1.5px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Respond to: {getTktIdStr(selectedTicket)}</h3>
                <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 550, marginTop: '2px', display: 'block' }}>Subject: {selectedTicket.subject}</span>
              </div>
              <button onClick={() => setIsRespondModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: '16px', fontWeight: 'bold' }}>
                ✕
              </button>
            </div>

            {/* Chat message thread */}
            <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#F8FAFC' }}>
              {selectedTicket.messages.map((m, idx) => {
                const isOp = m.senderRole === 'operator';
                const isBot = m.senderRole === 'system';
                return (
                  <div key={idx} style={{
                    alignSelf: isOp ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    fontSize: '13.5px',
                    fontWeight: 550,
                    background: isOp ? '#2563EB' : isBot ? '#E2E8F0' : '#FFFFFF',
                    color: isOp ? '#FFFFFF' : '#0F172A',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                    border: isOp ? 'none' : '1px solid #E2E8F0'
                  }}>
                    <div>{m.message}</div>
                    <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '4px', textAlign: 'right' }}>
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Change Status Action Row */}
            <div style={{ padding: '12px 20px', borderTop: '1.5px solid #F1F5F9', backgroundColor: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: 650 }}>Set ticket status:</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleUpdateStatus(selectedTicket._id, 'in_progress')} style={{ padding: '5px 10px', backgroundColor: '#FFFBEB', color: '#F59E0B', border: '1px solid #F59E0B', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>In Progress</button>
                <button onClick={() => handleUpdateStatus(selectedTicket._id, 'resolved')} style={{ padding: '5px 10px', backgroundColor: '#E6FDF3', color: '#10B981', border: '1px solid #10B981', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>Resolve</button>
                <button onClick={() => handleUpdateStatus(selectedTicket._id, 'escalated')} style={{ padding: '5px 10px', backgroundColor: '#FEE2E2', color: '#EF4444', border: '1px solid #EF4444', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>Escalate</button>
              </div>
            </div>

            {/* Input form */}
            <form onSubmit={handleReply} style={{ padding: '16px 20px', borderTop: '1.5px solid #F1F5F9', display: 'flex', gap: '12px', backgroundColor: '#FFFFFF' }}>
              <input
                type="text"
                placeholder="Type a response message..."
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                required
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: '8px',
                  fontSize: '13.5px',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#2563EB',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Create Ticket Modal */}
      {isCreateModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', display: 'flex', alignItems: 'center', zIndex: 1000, justifyContent: 'center' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', width: '100%', maxWidth: '480px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1.5px solid #F1F5F9', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', margin: 0 }}>Create Support Ticket</h3>
              <button onClick={() => setIsCreateModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', fontSize: '16px', fontWeight: 'bold' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTicket} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Subject</span>
                <input type="text" placeholder="e.g. Login Authentication Issue" value={createSubject} onChange={e => setCreateSubject(e.target.value)} required style={{ padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Description</span>
                <textarea placeholder="Provide detailed issue description..." value={createDescription} onChange={e => setCreateDescription(e.target.value)} required style={{ padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', outline: 'none', minHeight: '80px', fontFamily: 'inherit' }} />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Category</span>
                  <select value={createCategory} onChange={e => setCreateCategory(e.target.value)} style={{ padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', outline: 'none', backgroundColor: '#FFFFFF' }}>
                    <option value="Technical">Technical</option>
                    <option value="Billing">Billing</option>
                    <option value="Account">Account</option>
                    <option value="Performance">Performance</option>
                    <option value="Communication">Communication</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Priority</span>
                  <select value={createPriority} onChange={e => setCreatePriority(e.target.value as any)} style={{ padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', outline: 'none', backgroundColor: '#FFFFFF' }}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Assign To Agent</span>
                <input type="text" placeholder="e.g. Amit S." value={createAssignedName} onChange={e => setCreateAssignedName(e.target.value)} style={{ padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '14px', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="submit" style={{ flex: 1, padding: '12px', backgroundColor: '#2563EB', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
                  Create Ticket
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
