import React, { useState, useEffect, useRef } from 'react';
import { adminClient } from '../api/client';
import { useAdminStore } from '../store/adminStore';

// ── Toggle Switch Component ──────────────────────────────────────────────────
function Toggle({ checked, onChange, id }: { checked: boolean; onChange: (val: boolean) => void; id: string }) {
  return (
    <div
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: '44px',
        height: '24px',
        borderRadius: '12px',
        backgroundColor: checked ? '#2563EB' : '#CBD5E1',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background 0.25s ease',
        flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute',
        top: '2px',
        left: checked ? '22px' : '2px',
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        backgroundColor: '#FFFFFF',
        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        transition: 'left 0.22s ease',
      }} />
    </div>
  );
}

// ── Eye icon toggle for password fields ────────────────────────────────────
function PasswordInput({
  id, placeholder, value, onChange, style,
}: {
  id: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  style?: React.CSSProperties;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div style={{ position: 'relative', ...style }}>
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '10px 38px 10px 12px',
          border: '1.5px solid #E2E8F0',
          borderRadius: '9px',
          fontSize: '13.5px',
          color: '#0F172A',
          outline: 'none',
          boxSizing: 'border-box' as const,
          backgroundColor: '#FFFFFF',
        }}
      />
      <button
        type="button"
        onClick={() => setVisible(v => !v)}
        style={{
          position: 'absolute',
          right: '10px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#94A3B8',
          padding: 0,
          display: 'flex',
        }}
      >
        {visible ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        )}
      </button>
    </div>
  );
}

// ── Section Card ────────────────────────────────────────────────────────────
function SectionCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      borderRadius: '16px',
      border: '1.5px solid #E2E8F0',
      padding: '28px',
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── Toast Notification ──────────────────────────────────────────────────────
function Toast({ message, type, onDone }: { message: string; type: 'success' | 'error'; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div style={{
      position: 'fixed',
      top: '24px',
      right: '28px',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '12px 20px',
      borderRadius: '12px',
      backgroundColor: type === 'success' ? '#F0FDF4' : '#FEF2F2',
      border: `1.5px solid ${type === 'success' ? '#BBF7D0' : '#FECACA'}`,
      color: type === 'success' ? '#15803D' : '#DC2626',
      fontSize: '13.5px',
      fontWeight: 600,
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      animation: 'slideIn 0.25s ease',
    }}>
      {type === 'success' ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
      )}
      {message}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SETTINGS PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const user = useAdminStore(s => s.user);
  const setAuth = useAdminStore(s => s.setAuth);
  const accessToken = useAdminStore(s => s.accessToken);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // ── Profile state — initialize immediately from store so inputs are never blank ──
  const [profile, setProfile] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: '',
    role: user?.role ?? '',
    employeeId: '',
    department: '',
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [avatar, setAvatar] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Password state ───────────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // ── 2FA state ────────────────────────────────────────────────────────────
  const [twoFaEnabled, setTwoFaEnabled] = useState(false);
  const [twoFaLoading, setTwoFaLoading] = useState(false);

  // ── Notification prefs (localStorage) ───────────────────────────────────
  const [notifPrefs, setNotifPrefs] = useState({
    emailNotifications: true,
    pushNotifications: false,
    documentUploadAlerts: true,
    expiryReminders: true,
    systemUpdates: false,
  });

  // ── Localization prefs (localStorage) ────────────────────────────────────
  const [language, setLanguage] = useState('en-US');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [colorTheme, setColorTheme] = useState('system');

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  // ── Fetch current operator profile ──────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const { data } = await adminClient.get('/auth/admin/me');
        if (data.success) {
          const op = data.data;
          setProfile({
            name: op.name ?? '',
            email: op.email ?? '',
            phone: op.phone ?? '',
            role: op.role ?? '',
            employeeId: op.employeeId ?? '',
            department: op.department ?? '',
          });
          setAvatar(op.avatar ?? '');
          setTwoFaEnabled(op.twoFaEnabled ?? false);

          if (op.notificationPreferences) {
            setNotifPrefs(op.notificationPreferences);
          }
          if (op.localizationPreferences) {
            setLanguage(op.localizationPreferences.language ?? 'en-US');
            setTimezone(op.localizationPreferences.timezone ?? 'Asia/Kolkata');
            setColorTheme(op.localizationPreferences.colorTheme ?? 'system');
          }
        }
      } catch {
        // keep the store-initialized defaults already set
      }
    })();
  }, []);

  // ── Photo upload handlers ──────────────────────────────────────────────────
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 800 * 1024) {
      showToast('Image must be under 800KB', 'error');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
      showToast('Only JPG, PNG or GIF files are accepted', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAvatar(reader.result as string);
      showToast('Photo selected — click Save Profile Changes to apply', 'success');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemovePhoto = () => {
    setAvatar('');
    showToast('Photo removed — click Save Profile Changes to apply', 'success');
  };

  // ── Save profile ─────────────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    setProfileLoading(true);
    try {
      const { data } = await adminClient.patch('/auth/admin/me', {
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        avatar,
      });
      if (data.success) {
        // Update the store so the header reflects the new name and photo
        if (user && accessToken) {
          setAuth({ ...user, name: data.data.name, email: data.data.email, avatar: data.data.avatar }, accessToken);
        }
        showToast('Profile updated successfully', 'success');
      }
    } catch (err: any) {
      showToast(err?.response?.data?.error ?? 'Failed to update profile', 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  // ── Update password ──────────────────────────────────────────────────────
  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword) {
      showToast('Please fill in all password fields', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }
    if (newPassword.length < 8) {
      showToast('New password must be at least 8 characters', 'error');
      return;
    }
    setPasswordLoading(true);
    try {
      const { data } = await adminClient.patch('/auth/admin/me/password', {
        currentPassword,
        newPassword,
      });
      if (data.success) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        showToast('Password updated successfully', 'success');
      }
    } catch (err: any) {
      showToast(err?.response?.data?.error ?? 'Failed to update password', 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  // ── Toggle 2FA ────────────────────────────────────────────────────────────
  const handle2FAToggle = async (enabled: boolean) => {
    if (twoFaLoading) return;
    setTwoFaLoading(true);
    try {
      const { data } = await adminClient.patch('/auth/admin/me/2fa', { enabled });
      if (data.success) {
        setTwoFaEnabled(data.data.twoFaEnabled);
        showToast(`Two-Factor Authentication ${data.data.twoFaEnabled ? 'enabled' : 'disabled'}`, 'success');
      }
    } catch (err: any) {
      showToast(err?.response?.data?.error ?? 'Failed to update 2FA setting', 'error');
    } finally {
      setTwoFaLoading(false);
    }
  };

  // ── Save notification prefs ────────────────────────────────────────────────
  const updateNotifPref = async (key: keyof typeof notifPrefs, value: boolean) => {
    const updated = { ...notifPrefs, [key]: value };
    setNotifPrefs(updated);
    try {
      await adminClient.patch('/auth/admin/me', { notificationPreferences: updated });
      showToast('Notification preference saved', 'success');
    } catch {
      showToast('Failed to save notification preference', 'error');
    }
  };

  // ── Save locale prefs ─────────────────────────────────────────────────────
  const updateLocalePref = async (key: 'language' | 'timezone' | 'colorTheme', value: string) => {
    const updated = { language, timezone, colorTheme, [key]: value };
    if (key === 'language') setLanguage(value);
    if (key === 'timezone') setTimezone(value);
    if (key === 'colorTheme') setColorTheme(value);
    
    try {
      await adminClient.patch('/auth/admin/me', { localizationPreferences: updated });
      showToast('Preference saved', 'success');
    } catch {
      showToast('Failed to save preference', 'error');
    }
  };

  const roleLabel = (r: string) => {
    if (r === 'super_admin') return 'Super Admin';
    if (r === 'admin') return 'Admin';
    return 'Operator';
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    border: '1.5px solid #E2E8F0',
    borderRadius: '9px',
    fontSize: '13.5px',
    color: '#0F172A',
    outline: 'none',
    boxSizing: 'border-box',
    backgroundColor: '#FFFFFF',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 700,
    color: '#475569',
    marginBottom: '6px',
    display: 'block',
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '16.5px',
    fontWeight: 800,
    color: '#0F172A',
    margin: '0 0 4px 0',
  };

  const sectionSubStyle: React.CSSProperties = {
    fontSize: '13px',
    color: '#64748B',
    margin: '0 0 24px 0',
  };

  return (
    <div style={{ padding: '32px', backgroundColor: '#F8FAFC', minHeight: '100%' }}>
      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}

      {/* Breadcrumb */}
      <div style={{ fontSize: '13px', color: '#64748B', marginBottom: '10px' }}>
        <span style={{ color: '#2563EB', fontWeight: 600 }}>Dashboard</span>
        <span style={{ margin: '0 6px' }}>→</span>
        <span style={{ color: '#0F172A', fontWeight: 700 }}>Settings</span>
      </div>

      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 850, color: '#0F172A', margin: 0 }}>Portal Settings</h1>
        <p style={{ fontSize: '13.5px', color: '#64748B', margin: '6px 0 0 0' }}>
          Configure your account settings, notification parameters, security controls, and workflow preferences.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px', alignItems: 'start' }}>

        {/* ── LEFT COLUMN ──────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Profile Settings */}
          <SectionCard>
            <h2 style={sectionTitleStyle}>Profile Settings</h2>
            <p style={sectionSubStyle}>Manage your public profile identity and administrative metadata.</p>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif"
              style={{ display: 'none' }}
              onChange={handlePhotoChange}
            />

            {/* Avatar row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
              {avatar ? (
                <img
                  src={avatar}
                  alt="Profile"
                  style={{
                    width: '68px', height: '68px', borderRadius: '50%',
                    objectFit: 'cover', flexShrink: 0,
                    border: '2px solid #E2E8F0',
                  }}
                />
              ) : (
                <div style={{
                  width: '68px', height: '68px', borderRadius: '50%',
                  backgroundColor: '#2563EB', color: '#FFFFFF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '24px', fontWeight: 800, flexShrink: 0,
                  userSelect: 'none' as const,
                }}>
                  {profile.name ? profile.name.charAt(0).toUpperCase() : '?'}
                </div>
              )}
              <div>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '6px' }}>
                  <button
                    id="change-photo-btn"
                    type="button"
                    style={{
                      padding: '7px 16px',
                      backgroundColor: '#2563EB',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Change Photo
                  </button>
                  <button
                    id="remove-photo-btn"
                    type="button"
                    style={{
                      padding: '7px 16px',
                      backgroundColor: '#FFFFFF',
                      color: '#475569',
                      border: '1.5px solid #E2E8F0',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                    onClick={handleRemovePhoto}
                  >
                    Remove
                  </button>
                </div>
                <span style={{ fontSize: '12px', color: '#94A3B8' }}>JPG, GIF or PNG. Max size of 800K</span>
              </div>
            </div>

            {/* Profile form */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label htmlFor="profile-name" style={labelStyle}>Full Name</label>
                <input
                  id="profile-name"
                  value={profile.name}
                  onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                  style={inputStyle}
                />
              </div>
              <div>
                <label htmlFor="profile-email" style={labelStyle}>Email Address</label>
                <input
                  id="profile-email"
                  type="email"
                  value={profile.email}
                  onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                  style={inputStyle}
                />
              </div>
              <div>
                <label htmlFor="profile-phone" style={labelStyle}>Phone Number</label>
                <input
                  id="profile-phone"
                  type="tel"
                  placeholder="+91 XXXXX XXXXX"
                  value={profile.phone}
                  onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                  style={inputStyle}
                />
              </div>
              <div>
                <label htmlFor="profile-role" style={labelStyle}>Role / Designation</label>
                <input
                  id="profile-role"
                  value={roleLabel(profile.role)}
                  readOnly
                  style={{ ...inputStyle, backgroundColor: '#F8FAFC', color: '#64748B' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                id="save-profile-btn"
                onClick={handleSaveProfile}
                disabled={profileLoading}
                style={{
                  padding: '10px 24px',
                  backgroundColor: '#2563EB',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '9px',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  cursor: profileLoading ? 'not-allowed' : 'pointer',
                  opacity: profileLoading ? 0.7 : 1,
                }}
              >
                {profileLoading ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </SectionCard>

          {/* Security Credentials */}
          <SectionCard>
            <h2 style={sectionTitleStyle}>Security Credentials</h2>
            <p style={sectionSubStyle}>Update your security password and manage active multifactor authentication protocols.</p>

            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="current-password" style={labelStyle}>Current Password</label>
              <PasswordInput
                id="current-password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={setCurrentPassword}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label htmlFor="new-password" style={labelStyle}>New Password</label>
                <PasswordInput
                  id="new-password"
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={setNewPassword}
                />
              </div>
              <div>
                <label htmlFor="confirm-password" style={labelStyle}>Confirm New Password</label>
                <PasswordInput
                  id="confirm-password"
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button
                id="update-password-btn"
                onClick={handleUpdatePassword}
                disabled={passwordLoading}
                style={{
                  padding: '10px 24px',
                  backgroundColor: '#2563EB',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '9px',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  cursor: passwordLoading ? 'not-allowed' : 'pointer',
                  opacity: passwordLoading ? 0.7 : 1,
                }}
              >
                {passwordLoading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </SectionCard>
        </div>

        {/* ── RIGHT COLUMN ──────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Notification Preferences */}
          <SectionCard>
            <h2 style={sectionTitleStyle}>Notification Preferences</h2>
            <p style={{ ...sectionSubStyle, marginBottom: '20px' }}>
              Choose how and when you receive system and document-level alert signals.
            </p>

            {([
              { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive daily status logs and summary digests in your email inbox.' },
              { key: 'pushNotifications', label: 'Push Notifications', desc: 'Allow browser instant popups for critical document verifications.' },
              { key: 'documentUploadAlerts', label: 'Document Upload Alerts', desc: 'Get notified instantly when standard operators submit upload batches.' },
              { key: 'expiryReminders', label: 'Expiry Reminders', desc: 'Receive notice sequences 30 days before document validity expires.' },
              { key: 'systemUpdates', label: 'System Updates', desc: 'Stay informed about platform performance updates and regular system maintenance.' },
            ] as { key: keyof typeof notifPrefs; label: string; desc: string }[]).map(({ key, label, desc }, idx, arr) => (
              <div
                key={key}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  paddingBottom: idx < arr.length - 1 ? '16px' : 0,
                  marginBottom: idx < arr.length - 1 ? '16px' : 0,
                  borderBottom: idx < arr.length - 1 ? '1px solid #F1F5F9' : 'none',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0F172A', marginBottom: '3px' }}>{label}</div>
                  <div style={{ fontSize: '12px', color: '#64748B' }}>{desc}</div>
                </div>
                <Toggle
                  id={`notif-${key}`}
                  checked={notifPrefs[key]}
                  onChange={v => updateNotifPref(key, v)}
                />
              </div>
            ))}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
