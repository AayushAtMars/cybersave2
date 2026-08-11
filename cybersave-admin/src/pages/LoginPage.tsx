import React, { useState } from 'react';
import { useAdminStore } from '../store/adminStore';
import { adminClient } from '../api/client';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [btnHovered, setBtnHovered] = useState(false);
  const setAuth = useAdminStore((s) => s.setAuth);
  const navigate = useNavigate();

  React.useEffect(() => {
    const checkTurnstile = setInterval(() => {
      if ((window as any).turnstile) {
        clearInterval(checkTurnstile);
        (window as any).turnstile.render('#turnstile-container', {
          sitekey: '1x00000000000000000000AA',
          callback: (token: string) => {
            setCaptchaToken(token);
          },
          'expired-callback': () => {
            setCaptchaToken('');
          },
          'error-callback': () => {
            setCaptchaToken('');
          }
        });
      }
    }, 100);
    return () => clearInterval(checkTurnstile);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!captchaToken) {
      setError('Please complete the captcha verification.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await adminClient.post('/auth/operator/login', { 
        email, 
        password,
        captchaToken
      });
      setAuth(data.data.operator, data.data.accessToken);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Login failed. Please check your credentials.');
      if ((window as any).turnstile) {
        (window as any).turnstile.reset();
      }
      setCaptchaToken('');
    } finally {
      setLoading(false);
    }
  };

  const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );

  const EyeOffIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
      <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
      <line x1="2" y1="2" x2="22" y2="22"/>
    </svg>
  );

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FFFFFF',
      padding: '24px',
      fontFamily: "'Plus Jakarta Sans', sans-serif"
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        padding: '32px 0px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        {/* Logo Container */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '28px',
          width: '100%'
        }}>
          <img 
            src={logo} 
            alt="CyberSave Logo" 
            style={{ 
              height: '56px', 
              objectFit: 'contain',
              maxWidth: '100%'
            }} 
          />
        </div>

        {/* Heading */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: 700, 
            color: '#0F172A',
            letterSpacing: '-0.025em',
            margin: '0 0 8px 0'
          }}>
            Welcome Back
          </h1>
          <p style={{ 
            color: '#64748B', 
            fontSize: '14px', 
            margin: 0,
            lineHeight: '1.5'
          }}>
            Operator & Admin Portal
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            width: '100%',
            padding: '12px 16px',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FCA5A5',
            borderRadius: '8px',
            color: '#991B1B',
            fontSize: '13.5px',
            marginBottom: '20px',
            lineHeight: '1.4'
          }}>
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
          {/* Email Input Group */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ 
              fontSize: '12px', 
              fontWeight: 600, 
              color: '#475569',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Email Address
            </label>
            <input 
              type="email" 
              placeholder="name@cybersave.in" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              required
              style={{ 
                padding: '12px 16px', 
                border: emailFocused ? '1.5px solid #2563EB' : '1.5px solid #E2E8F0', 
                borderRadius: '8px', 
                fontSize: '15px',
                color: '#0F172A',
                backgroundColor: '#FFFFFF',
                outline: 'none',
                boxShadow: emailFocused ? '0 0 0 3px rgba(37, 99, 235, 0.12)' : 'none',
                transition: 'all 0.2s ease'
              }} 
            />
          </div>

          {/* Password Input Group */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ 
              fontSize: '12px', 
              fontWeight: 600, 
              color: '#475569',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Password
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                required
                style={{ 
                  width: '100%',
                  padding: '12px 48px 12px 16px', 
                  border: passwordFocused ? '1.5px solid #2563EB' : '1.5px solid #E2E8F0', 
                  borderRadius: '8px', 
                  fontSize: '15px',
                  color: '#0F172A',
                  backgroundColor: '#FFFFFF',
                  outline: 'none',
                  boxShadow: passwordFocused ? '0 0 0 3px rgba(37, 99, 235, 0.12)' : 'none',
                  transition: 'all 0.2s ease'
                }} 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '14px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94A3B8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px',
                  borderRadius: '4px',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#475569')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          {/* Turnstile Captcha Widget */}
          <div 
            id="turnstile-container" 
            style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              width: '100%',
              margin: '8px 0',
              minHeight: '65px'
            }}
          />

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading}
            onMouseEnter={() => setBtnHovered(true)}
            onMouseLeave={() => setBtnHovered(false)}
            style={{ 
              marginTop: '10px',
              padding: '14px', 
              background: loading ? '#64748B' : (btnHovered ? '#1E40AF' : '#2563EB'), 
              color: '#FFFFFF', 
              border: 'none', 
              borderRadius: '8px', 
              fontSize: '15px', 
              fontWeight: 600, 
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s ease',
              boxShadow: btnHovered ? '0 4px 12px rgba(37, 99, 235, 0.2)' : 'none'
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Footer info */}
        <p style={{ 
          marginTop: '40px', 
          color: '#94A3B8', 
          fontSize: '12px',
          textAlign: 'center'
        }}>
          Authorized access only. All activities are logged.
        </p>
      </div>
    </div>
  );
}
