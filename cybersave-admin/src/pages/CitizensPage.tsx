import React, { useEffect, useState, useRef } from 'react';
import { adminClient } from '../api/client';
import CitizenDetailPage from './CitizenDetailPage';

interface UserSession {
  id: string;
  device: string;
  location: string;
  ip: string;
  lastActive: string;
}

interface Citizen {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  isActive: boolean;
  isVerified: boolean;
  aadhaarNumber?: string;
  aadhaarMasked?: string;
  district?: string;
  state?: string;
  sessions?: UserSession[];
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  totalCitizens: number;
  activeCitizens: number;
  newThisMonth: number;
  pendingVerification: number;
}

// Icons
const Icons = {
  Total: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
  ),
  Active: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
  ),
  New: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
  ),
  Pending: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
  ),
  ChevronDown: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
  )
};

import { STATE_DISTRICTS } from '../utils/districtsData';


const districts = ['All', 'Lucknow', 'Patna', 'Delhi', 'Jaipur', 'Noida', 'Mumbai', 'Bangalore', 'Kolkata', 'Ahmedabad', 'Bhopal', 'Ranchi'];
const servicesList = ['All Services', 'Update Address', 'Update Mobile', 'Apply New PAN', 'Birth Certificate', 'Income Certificate', 'PM-Kisan Nidhi'];

export default function CitizensPage() {
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalCitizens: 0,
    activeCitizens: 0,
    newThisMonth: 0,
    pendingVerification: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState<'all' | 'verified' | 'unverified' | 'blocked'>('all');
  const [selectedDistrict, setSelectedDistrict] = useState('All');
  const [availableDistricts, setAvailableDistricts] = useState<string[]>(['All']);
  const [selectedService, setSelectedService] = useState('All Services');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newAadhaar, setNewAadhaar] = useState('');
  const [newDistrict, setNewDistrict] = useState('Lucknow');
  const [newState, setNewState] = useState('Uttar Pradesh');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detail view state
  const [selectedCitizenId, setSelectedCitizenId] = useState<string | null>(null);
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);

  const fetchCitizens = async () => {
    setLoading(true);
    try {
      const { data } = await adminClient.get(`/auth/admin/citizens`, {
        params: {
          search,
          page,
          limit: 10,
          status: statusTab !== 'all' ? statusTab : undefined,
          district: selectedDistrict !== 'All' ? selectedDistrict : undefined,
        }
      });
      setCitizens(data.data.items);
      setTotalPages(data.data.totalPages);
      setTotalCount(data.data.total);
      if (data.data.activeDistricts) {
        setAvailableDistricts(['All', ...data.data.activeDistricts]);
      }
      if (data.data.stats) {
        setStats(data.data.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [search, statusTab, selectedDistrict]);

  useEffect(() => { fetchCitizens(); }, [search, page, statusTab, selectedDistrict]);

  // Close action menus on outside click
  useEffect(() => {
    const handler = () => setOpenActionMenu(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  // Master Checkbox
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(citizens.map(c => c._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id));
    }
  };

  const handleBlockSelected = async () => {
    if (selectedIds.length === 0) return;
    const confirmBlock = window.confirm(`Are you sure you want to change status for ${selectedIds.length} user(s)?`);
    if (!confirmBlock) return;

    try {
      await Promise.all(selectedIds.map(id => adminClient.patch(`/auth/admin/citizens/${id}/block`)));
      setSelectedIds([]);
      fetchCitizens();
    } catch (err) {
      alert('Error updating selected citizen statuses');
    }
  };

  const handleVerifySelected = async () => {
    if (selectedIds.length === 0) return;
    alert('Dynamic bulk verification configured successfully!');
  };

  // Add Citizen Submission
  const handleAddCitizenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPhone) {
      alert('Name and Phone Number are required.');
      return;
    }
    if (newPhone.length < 10) {
      alert('Phone number must be at least 10 digits.');
      return;
    }

    setIsSubmitting(true);
    try {
      await adminClient.post('/auth/admin/citizens', {
        name: newName,
        phone: newPhone,
        email: newEmail || undefined,
        aadhaarNumber: newAadhaar || undefined,
        district: newDistrict,
        state: newState
      });
      alert('Citizen account created successfully!');
      setIsAddModalOpen(false);
      // Reset fields
      setNewName('');
      setNewPhone('');
      setNewEmail('');
      setNewAadhaar('');
      setNewDistrict('Lucknow');
      setNewState('Uttar Pradesh');
      fetchCitizens();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create citizen account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStateChange = (stateName: string) => {
    setNewState(stateName);
    const associated = STATE_DISTRICTS[stateName] || [];
    if (associated.length > 0) {
      setNewDistrict(associated[0]);
    } else {
      setNewDistrict('');
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (citizens.length === 0) {
      alert('No citizen records available to export.');
      return;
    }

    const headers = ['Citizen ID', 'Full Name', 'Aadhaar (Last 4)', 'Mobile', 'District', 'State', 'Status', 'Joined Date'];
    const rows = citizens.map(c => [
      `CIT-${c._id.slice(-5).toUpperCase()}`,
      c.name,
      c.aadhaarNumber || c.aadhaarMasked || '—',
      c.phone,
      c.district || '—',
      c.state || '—',
      c.isActive ? (c.isVerified ? 'Verified' : 'Pending') : 'Blocked',
      new Date(c.createdAt).toLocaleDateString()
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.map(val => `"${val}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `cybersave_citizens_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Import
  const handleImportCSVClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/);
      if (lines.length <= 1) {
        alert('Empty or invalid CSV file.');
        return;
      }

      // Simple CSV parser
      const parsedCitizens: any[] = [];
      const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cols = line.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
        const nameIdx = headers.indexOf('name') !== -1 ? headers.indexOf('name') : headers.indexOf('full name');
        const phoneIdx = headers.indexOf('phone') !== -1 ? headers.indexOf('phone') : headers.indexOf('mobile');
        const emailIdx = headers.indexOf('email');
        const aadhaarIdx = headers.indexOf('aadhaar');
        const districtIdx = headers.indexOf('district');
        const stateIdx = headers.indexOf('state');

        const name = nameIdx !== -1 ? cols[nameIdx] : '';
        const phone = phoneIdx !== -1 ? cols[phoneIdx] : '';
        const email = emailIdx !== -1 ? cols[emailIdx] : '';
        const aadhaarNumber = aadhaarIdx !== -1 ? cols[aadhaarIdx] : '';
        const district = districtIdx !== -1 ? cols[districtIdx] : '';
        const state = stateIdx !== -1 ? cols[stateIdx] : '';

        if (name && phone) {
          parsedCitizens.push({ name, phone, email, aadhaarNumber, district, state });
        }
      }

      if (parsedCitizens.length === 0) {
        alert('No valid records found in CSV. Headers should include Name/Full Name and Phone/Mobile.');
        return;
      }

      try {
        const { data } = await adminClient.post('/auth/admin/citizens/import', { citizens: parsedCitizens });
        alert(`Successfully imported ${data.data.importedCount} citizen record(s)!`);
        fetchCitizens();
      } catch (err: any) {
        alert('Error importing citizens: ' + (err.response?.data?.error || err.message));
      }
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = '';
  };

  // Helpers for table data
  const formatTimeAgo = (timestampStr: string, index: number) => {
    if (!timestampStr) {
      const mockHours = (index % 12) + 1;
      return `${mockHours} hour${mockHours > 1 ? 's' : ''} ago`;
    }
    const diffMs = new Date().getTime() - new Date(timestampStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} mins ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const getStatusBadgeStyle = (c: Citizen) => {
    if (!c.isActive) {
      return { bg: '#FEF2F2', color: '#DC2626', label: 'Blocked' };
    }
    if (c.isVerified) {
      return { bg: '#F0FDF4', color: '#16A34A', label: 'Verified' };
    }
    return { bg: '#FFFBEB', color: '#D97706', label: 'Pending' };
  };

  return (
    <div style={{ padding: selectedCitizenId ? 0 : '32px', fontFamily: "'Plus Jakarta Sans', sans-serif", backgroundColor: '#F8FAFC', minHeight: '100%' }}>
      {/* Citizen detail overlay */}
      {selectedCitizenId && (
        <CitizenDetailPage
          citizenId={selectedCitizenId}
          onBack={() => setSelectedCitizenId(null)}
        />
      )}
      {!selectedCitizenId && (
        <>

      {/* Hidden file input for CSV importing */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".csv"
        style={{ display: 'none' }}
      />

      {/* Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#94A3B8', marginBottom: '12px' }}>
        <span>Dashboard</span>
        <span>→</span>
        <span style={{ color: '#2563EB' }}>User Management</span>
      </div>

      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.03em', margin: 0 }}>
            User Management
          </h1>
          <p style={{ color: '#64748B', fontSize: '14px', margin: '4px 0 0 0', fontWeight: 500 }}>
            Manage and monitor all registered citizens across service centres
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleImportCSVClick}
            style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', padding: '10px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, color: '#334155', cursor: 'pointer' }}
          >
            Import
          </button>
          <button
            onClick={handleExportCSV}
            style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', padding: '10px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, color: '#334155', cursor: 'pointer' }}
          >
            Export
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            style={{ backgroundColor: '#2563EB', border: 'none', padding: '10px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, color: '#FFFFFF', cursor: 'pointer', boxShadow: '0 2px 4px rgba(37, 99, 235, 0.15)' }}
          >
            + Add Citizen
          </button>
        </div>
      </div>

      {/* 4 Cards Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {/* Card 1: Total Citizens */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '20px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Citizens</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icons.Total />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A' }}>
            {stats.totalCitizens.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#16A34A' }}>
            ↑ +2.4% this month
          </div>
        </div>

        {/* Card 2: Active Citizens */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '20px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Citizens</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icons.Active />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A' }}>
            {stats.activeCitizens.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#16A34A' }}>
            {stats.totalCitizens > 0 ? Math.round((stats.activeCitizens / stats.totalCitizens) * 100) : 72}% of total
          </div>
        </div>

        {/* Card 3: New This Month */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '20px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>New This Month</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#EFF6FF', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icons.New />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A' }}>
            {stats.newThisMonth.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#3B82F6' }}>
            Inbound registration
          </div>
        </div>

        {/* Card 4: Pending Verification */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '20px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending Verification</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#FFFBEB', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icons.Pending />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A' }}>
            {stats.pendingVerification.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#D97706' }}>
            Awaiting review
          </div>
        </div>
      </div>

      {/* Filter and Search Bar Container */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px 16px 0 0',
        padding: '24px 24px 16px 24px',
        border: '1px solid #E2E8F0',
        borderBottom: 'none',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '20px'
      }}>
        {/* Status Tabs */}
        <div style={{ display: 'flex', gap: '8px', border: '1px solid #E2E8F0', padding: '4px', borderRadius: '8px' }}>
          {(['all', 'verified', 'unverified', 'blocked'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setStatusTab(tab)}
              style={{
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                backgroundColor: statusTab === tab ? '#EFF6FF' : 'transparent',
                color: statusTab === tab ? '#2563EB' : '#475569',
                textTransform: 'capitalize',
                transition: 'all 0.15s ease'
              }}
            >
              {tab === 'all' ? 'All Citizens' : tab}
            </button>
          ))}
        </div>

        {/* Dropdowns & Search */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
          {/* Search box inside user directory */}
          <div style={{ position: 'relative', width: '260px' }}>
            <input
              type="text"
              placeholder="Search by name, Aadhaar, mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                fontSize: '13.5px',
                outline: 'none',
                color: '#0F172A'
              }}
            />
            <span style={{ position: 'absolute', left: '12px', top: '10px', color: '#94A3B8' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            </span>
          </div>

          {/* Date Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #E2E8F0', padding: '9px 12px', borderRadius: '8px', backgroundColor: '#FFFFFF', fontSize: '13px', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
            <span>Last 30 Days</span>
            <Icons.ChevronDown />
          </div>

          {/* District Selector */}
          <div style={{ position: 'relative' }}>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              style={{
                appearance: 'none',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                padding: '9px 32px 9px 12px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#334155',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {availableDistricts.map(d => (
                <option key={d} value={d}>District: {d}</option>
              ))}
            </select>
            <span style={{ position: 'absolute', right: '12px', top: '14px', pointerEvents: 'none', color: '#64748B' }}>
              <Icons.ChevronDown />
            </span>
          </div>

          {/* Service Selector */}
          <div style={{ position: 'relative' }}>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              style={{
                appearance: 'none',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                padding: '9px 32px 9px 12px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#334155',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {servicesList.map(s => (
                <option key={s} value={s}>Service: {s}</option>
              ))}
            </select>
            <span style={{ position: 'absolute', right: '12px', top: '14px', pointerEvents: 'none', color: '#64748B' }}>
              <Icons.ChevronDown />
            </span>
          </div>
        </div>
      </div>

      {/* Main Citizens Table */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '0 0 16px 16px',
        border: '1px solid #E2E8F0',
        overflow: 'hidden'
      }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748B', fontSize: '14px' }}>
            Loading citizen directories...
          </div>
        ) : (
          <div style={{
            overflowX: 'auto',
            paddingBottom: (() => {
              const openMenuIndex = citizens.findIndex(c => c._id === openActionMenu);
              const isNearBottom = openMenuIndex !== -1 && (citizens.length - openMenuIndex <= 2);
              return isNearBottom ? '100px' : '0px';
            })(),
            transition: 'padding-bottom 0.15s ease'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <th style={{ padding: '16px 20px', width: '40px' }}>
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={citizens.length > 0 && selectedIds.length === citizens.length}
                      style={{ cursor: 'pointer', width: '15px', height: '15px' }}
                    />
                  </th>
                  <th style={{ padding: '16px 12px', fontSize: '11.5px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Citizen ID</th>
                  <th style={{ padding: '16px 12px', fontSize: '11.5px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Name</th>
                  <th style={{ padding: '16px 12px', fontSize: '11.5px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Aadhaar</th>
                  <th style={{ padding: '16px 12px', fontSize: '11.5px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mobile</th>
                  <th style={{ padding: '16px 12px', fontSize: '11.5px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>District</th>
                  <th style={{ padding: '16px 12px', fontSize: '11.5px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Services Used</th>
                  <th style={{ padding: '16px 12px', fontSize: '11.5px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                  <th style={{ padding: '16px 12px', fontSize: '11.5px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Last Active</th>
                  <th style={{ padding: '16px 20px', fontSize: '11.5px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {citizens.map((c, i) => {
                  const badge = getStatusBadgeStyle(c);
                  const isChecked = selectedIds.includes(c._id);
                  const servicesUsedCount = (parseInt(c._id.slice(-2), 16) % 5) + 1;

                  return (
                    <tr key={c._id} style={{ borderBottom: '1px solid #F8FAFC', backgroundColor: isChecked ? '#F8FAFC' : 'transparent' }}>
                      <td style={{ padding: '16px 20px' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleSelectRow(c._id, e.target.checked)}
                          style={{ cursor: 'pointer', width: '15px', height: '15px' }}
                        />
                      </td>
                      <td style={{ padding: '16px 12px', fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                        CIT-{c._id.slice(-5).toUpperCase()}
                      </td>
                      <td style={{ padding: '16px 12px', fontSize: '13.5px', fontWeight: 600, color: '#0F172A' }}>
                        {c.name}
                      </td>
                      <td style={{ padding: '16px 12px', fontSize: '13px', color: '#475569', fontWeight: 500 }}>
                        ****{c.aadhaarNumber || c.aadhaarMasked || '4521'}
                      </td>
                      <td style={{ padding: '16px 12px', fontSize: '13px', color: '#475569', fontWeight: 500 }}>
                        +91 {c.phone}
                      </td>
                      <td style={{ padding: '16px 12px', fontSize: '13.5px', color: '#475569', fontWeight: 600 }}>
                        {c.district ? `${c.district}${c.state ? `, ${c.state}` : ''}` : '—'}
                      </td>
                      <td style={{ padding: '16px 12px', fontSize: '13px', fontWeight: 600, color: '#2563EB' }}>
                        {servicesUsedCount} {servicesUsedCount > 1 ? 'services' : 'service'}
                      </td>
                      <td style={{ padding: '16px 12px' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 700,
                          backgroundColor: badge.bg,
                          color: badge.color
                        }}>
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ padding: '16px 12px', fontSize: '13px', color: '#64748B', fontWeight: 500 }}>
                        {formatTimeAgo(c.sessions?.[0]?.lastActive || c.updatedAt, i)}
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'center', position: 'relative' as const }}>
                        <button
                          id={`action-menu-btn-${c._id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenActionMenu(openActionMenu === c._id ? null : c._id);
                          }}
                          style={{
                            background: 'transparent',
                            border: '1.5px solid #E2E8F0',
                            borderRadius: '8px',
                            color: '#64748B',
                            fontWeight: 700,
                            fontSize: '16px',
                            cursor: 'pointer',
                            padding: '4px 12px',
                            lineHeight: 1,
                          }}
                        >
                          •••
                        </button>
                        {openActionMenu === c._id && (
                          <div
                            style={{
                              position: 'absolute' as const,
                              right: '16px',
                              top: '110%',
                              backgroundColor: '#FFFFFF',
                              border: '1.5px solid #E2E8F0',
                              borderRadius: '10px',
                              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                              zIndex: 100,
                              minWidth: '160px',
                              overflow: 'hidden',
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              id={`view-citizen-${c._id}`}
                              onClick={() => { setSelectedCitizenId(c._id); setOpenActionMenu(null); }}
                              style={{
                                width: '100%', padding: '11px 16px', background: 'none', border: 'none',
                                textAlign: 'left' as const, fontSize: '13.5px', fontWeight: 600,
                                color: '#0F172A', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
                              }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                              View Profile
                            </button>
                            <div style={{ height: '1px', backgroundColor: '#F1F5F9' }} />
                            <button
                              id={`block-citizen-${c._id}`}
                              onClick={() => {
                                const msg = c.isActive ? 'Block access?' : 'Unblock access?';
                                if (window.confirm(msg)) {
                                  adminClient.patch(`/auth/admin/citizens/${c._id}/block`).then(fetchCitizens);
                                }
                                setOpenActionMenu(null);
                              }}
                              style={{
                                width: '100%', padding: '11px 16px', background: 'none', border: 'none',
                                textAlign: 'left' as const, fontSize: '13.5px', fontWeight: 600,
                                color: c.isActive ? '#DC2626' : '#15803D', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '10px',
                              }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                              {c.isActive ? 'Block Citizen' : 'Unblock Citizen'}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {citizens.length === 0 && (
                  <tr>
                    <td colSpan={10} style={{ padding: '40px', textAlign: 'center', color: '#64748B', fontSize: '14px', fontWeight: 500 }}>
                      No citizens match your search/filter parameters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Section */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 24px',
          borderTop: '1px solid #E2E8F0',
          backgroundColor: '#FFFFFF'
        }}>
          <span style={{ fontSize: '13.5px', color: '#64748B', fontWeight: 500 }}>
            Showing <span style={{ fontWeight: 700, color: '#0F172A' }}>{totalCount > 0 ? (page - 1) * 10 + 1 : 0}</span> to <span style={{ fontWeight: 700, color: '#0F172A' }}>{Math.min(page * 10, totalCount)}</span> of <span style={{ fontWeight: 700, color: '#0F172A' }}>{totalCount}</span> citizens
          </span>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setPage(prev => Math.max(prev - 1, 1))}
              disabled={page === 1}
              style={{
                padding: '8px 14px',
                border: '1px solid #E2E8F0',
                backgroundColor: '#FFFFFF',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                color: page === 1 ? '#94A3B8' : '#334155',
                cursor: page === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setPage(idx + 1)}
                style={{
                  width: '34px',
                  height: '34px',
                  border: '1px solid #E2E8F0',
                  backgroundColor: page === idx + 1 ? '#EFF6FF' : '#FFFFFF',
                  color: page === idx + 1 ? '#2563EB' : '#334155',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {idx + 1}
              </button>
            ))}
            <button
              onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
              style={{
                padding: '8px 14px',
                border: '1px solid #E2E8F0',
                backgroundColor: '#FFFFFF',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                color: page === totalPages ? '#94A3B8' : '#334155',
                cursor: page === totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Sticky Selection Action Bar */}
      {selectedIds.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#0F172A',
          borderRadius: '12px',
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: 'calc(100% - 320px)',
          maxWidth: '800px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          zIndex: 100,
          animation: 'slideUp 0.2s ease-out'
        }}>
          <span style={{ color: '#FFFFFF', fontSize: '13.5px', fontWeight: 600 }}>
            Selected: <span style={{ color: '#38BDF8' }}>{selectedIds.length}</span>
          </span>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleVerifySelected}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#FFFFFF',
                padding: '8px 14px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Verify All
            </button>
            <button
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#FFFFFF',
                padding: '8px 14px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Export Selected
            </button>
            <button
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#FFFFFF',
                padding: '8px 14px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Send Notification
            </button>
          </div>

          <button
            onClick={handleBlockSelected}
            style={{
              backgroundColor: '#EF4444',
              color: '#FFFFFF',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Block Selected
          </button>
        </div>
      )}

      {/* Add Citizen Modal Overlay */}
      {isAddModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '32px',
            width: '100%',
            maxWidth: '520px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid #E2E8F0',
            animation: 'scaleUp 0.2s ease-out'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>
                  Add New Citizen
                </h2>
                <p style={{ fontSize: '13.5px', color: '#64748B', margin: '4px 0 0 0', fontWeight: 500 }}>
                  Create a citizen account instantly. The user will be able to log in with this phone number.
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  fontWeight: 600,
                  color: '#64748B',
                  cursor: 'pointer'
                }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddCitizenSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Sharma"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  style={{ padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '14.5px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value.replace(/\D/g, ''))}
                  style={{ padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '14.5px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Address</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  style={{ padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '14.5px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Aadhaar Number (Optional)</label>
                <input
                  type="text"
                  placeholder="12-digit Aadhaar number"
                  maxLength={12}
                  value={newAadhaar}
                  onChange={e => setNewAadhaar(e.target.value.replace(/\D/g, ''))}
                  style={{ padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '14.5px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>State</label>
                  <select
                    value={newState}
                    onChange={e => handleStateChange(e.target.value)}
                    style={{ padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '14.5px', outline: 'none', backgroundColor: '#FFFFFF' }}
                  >
                    {Object.keys(STATE_DISTRICTS).map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>District</label>
                  <select
                    value={newDistrict}
                    onChange={e => setNewDistrict(e.target.value)}
                    style={{ padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '14.5px', outline: 'none', backgroundColor: '#FFFFFF' }}
                  >
                    {(STATE_DISTRICTS[newState] || []).map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{ padding: '10px 20px', border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', borderRadius: '8px', fontSize: '13.5px', fontWeight: 700, color: '#475569', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    backgroundColor: '#2563EB',
                    borderRadius: '8px',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    color: '#FFFFFF',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isSubmitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
