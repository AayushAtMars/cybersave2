import React, { useState } from 'react';
import { Fingerprint } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSendOtp, useVerifyOtp } from '../api/auth';

const Login = () => {
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'MOBILE' | 'OTP'>('MOBILE');
  
  const navigate = useNavigate();
  
  const sendOtpMutation = useSendOtp();
  const verifyOtpMutation = useVerifyOtp();

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (mobile.length !== 10) return;
    
    sendOtpMutation.mutate(
      { phone: mobile },
      {
        onSuccess: (data) => {
          console.log('OTP sent:', data);
          setStep('OTP');
        },
        onError: (err) => {
          console.error('Failed to send OTP', err);
          alert('Failed to send OTP. Please try again.');
        }
      }
    );
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) return;
    
    verifyOtpMutation.mutate(
      { phone: mobile, otp },
      {
        onSuccess: () => {
          navigate('/dashboard');
        },
        onError: (err) => {
          console.error('Failed to verify OTP', err);
          alert('Invalid OTP. Please try again.');
        }
      }
    );
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ background: '#FFFFFF' }}>

      {/* ══════════════════════════════════════════
          LEFT PANEL  – pure white, logo + tagline
      ══════════════════════════════════════════ */}
      <div
        className="hidden md:flex flex-col w-[52%] h-full"
        style={{ background: '#FFFFFF' }}
      >
        {/* Logo — large, centred vertically in top ~60 % of panel */}
        <div className="flex flex-1 items-center justify-center">
          <img
            src="/logo.svg"
            alt="CyberSave"
            style={{ width: '340px', height: 'auto' }}
            className="object-contain"
          />
        </div>

        {/* Tagline — flush bottom-left */}
        <div className="px-16 pb-20">
          <h1
            className="font-extrabold leading-tight"
            style={{ fontSize: '2.6rem', color: '#1B39CC', lineHeight: 1.2 }}
          >
            All Government Services,<br />One Portal
          </h1>
          <p className="mt-3 text-sm" style={{ color: '#94A3B8', fontWeight: 500 }}>
            Ministry of Electronics & IT Initiative
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          RIGHT PANEL – deep blue gradient + form
      ══════════════════════════════════════════ */}
      <div
        className="w-full md:w-[48%] h-full flex items-center justify-center relative overflow-hidden"
        style={{
          background:
            'linear-gradient(150deg, #4B6EF5 0%, #2344D6 25%, #1532BF 55%, #0E23A8 80%, #0A1D9E 100%)',
          borderRadius: '52px 0 0 52px',
        }}
      >
        {/* Ambient top-right highlight */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 55% 40% at 90% 10%, rgba(100,140,255,0.30) 0%, transparent 70%)',
          }}
        />
        {/* Ambient bottom-right shadow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 50% 35% at 95% 95%, rgba(5,10,70,0.45) 0%, transparent 70%)',
          }}
        />

        {/* Content column */}
        <div className="relative z-10 w-full px-14 py-12" style={{ maxWidth: '480px' }}>

          {/* Mobile-only logo */}
          <div className="md:hidden flex justify-center mb-8">
            <img src="/logo.svg" alt="CyberSave" style={{ width: '140px' }} className="brightness-0 invert" />
          </div>

          {/* Heading */}
          <h2
            className="font-extrabold text-white mb-1.5"
            style={{ fontSize: '2.1rem', lineHeight: 1.15 }}
          >
            Welcome Back
          </h2>
          <p className="text-sm mb-8" style={{ color: 'rgba(185,205,255,0.85)' }}>
            Sign in to safely access your e-gov portal
          </p>

          {/* ─── Form Card ─── */}
          <div
            className="rounded-2xl p-7"
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1.5px solid rgba(255,255,255,0.28)',
              backdropFilter: 'blur(12px)',
            }}
          >
            {step === 'MOBILE' ? (
              <form onSubmit={handleSendOtp}>

                {/* Label */}
                <p
                  className="text-xs font-semibold mb-2.5"
                  style={{ color: 'rgba(210,228,255,0.95)', letterSpacing: '0.02em' }}
                >
                  Mobile Number
                </p>

                {/* Phone input */}
                <div
                  className="flex items-stretch rounded-xl mb-4 overflow-hidden"
                  style={{
                    background: 'rgba(255,255,255,0.10)',
                    border: '1px solid rgba(255,255,255,0.25)',
                  }}
                >
                  {/* Country code */}
                  <div
                    className="flex items-center gap-2 px-4 py-3.5 shrink-0"
                    style={{ borderRight: '1px solid rgba(255,255,255,0.22)' }}
                  >
                    <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>🇮🇳</span>
                    <span className="text-white font-semibold" style={{ fontSize: '0.875rem' }}>
                      +91
                    </span>
                  </div>

                  <input
                    type="tel"
                    required
                    value={mobile}
                    onChange={(e) =>
                      setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))
                    }
                    className="flex-1 bg-transparent text-white px-4 py-3.5 focus:outline-none"
                    style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.95)' }}
                    placeholder="98765 43210"
                    disabled={sendOtpMutation.isPending}
                  />
                </div>

                {/* Send OTP button */}
                <button
                  type="submit"
                  disabled={sendOtpMutation.isPending || mobile.length !== 10}
                  className="w-full py-3.5 rounded-xl font-bold transition-all duration-200 hover:brightness-105 active:scale-[0.98] shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                  style={{
                    background: '#FFFFFF',
                    color: '#1B39CC',
                    fontSize: '0.9rem',
                    letterSpacing: '0.01em',
                  }}
                >
                  {sendOtpMutation.isPending ? 'Sending...' : 'Send OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp}>
                <p
                  className="text-xs font-semibold mb-2.5"
                  style={{ color: 'rgba(210,228,255,0.95)', letterSpacing: '0.02em' }}
                >
                  Enter OTP sent to +91 {mobile}
                </p>

                <div
                  className="flex items-stretch rounded-xl mb-4 overflow-hidden"
                  style={{
                    background: 'rgba(255,255,255,0.10)',
                    border: '1px solid rgba(255,255,255,0.25)',
                  }}
                >
                  <input
                    type="text"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="flex-1 bg-transparent text-white px-4 py-3.5 focus:outline-none tracking-widest text-center"
                    style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.95)' }}
                    placeholder="••••••"
                    disabled={verifyOtpMutation.isPending}
                  />
                </div>

                <button
                  type="submit"
                  disabled={verifyOtpMutation.isPending || otp.length < 4}
                  className="w-full py-3.5 rounded-xl font-bold transition-all duration-200 hover:brightness-105 active:scale-[0.98] shadow-lg disabled:opacity-70 disabled:cursor-not-allowed mb-3"
                  style={{
                    background: '#FFFFFF',
                    color: '#1B39CC',
                    fontSize: '0.9rem',
                    letterSpacing: '0.01em',
                  }}
                >
                  {verifyOtpMutation.isPending ? 'Verifying...' : 'Verify OTP'}
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setStep('MOBILE');
                    setOtp('');
                  }}
                  className="w-full py-2 text-white text-sm opacity-80 hover:opacity-100"
                >
                  Change Mobile Number
                </button>
              </form>
            )}

            {step === 'MOBILE' && (
              <>
                {/* or divider */}
                <div className="flex items-center gap-3 my-6">
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.22)' }} />
                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: 'rgba(180,205,255,0.55)',
                      letterSpacing: '0.08em',
                      fontWeight: 500,
                    }}
                  >
                    or
                  </span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.22)' }} />
                </div>

                {/* Biometric */}
                <div className="flex flex-col items-center gap-3">
                  <button
                    type="button"
                    className="flex items-center justify-center rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
                    style={{
                      width: '56px',
                      height: '56px',
                      background: 'rgba(255,255,255,0.12)',
                      border: '1.5px solid rgba(255,255,255,0.30)',
                    }}
                  >
                    <Fingerprint size={26} color="white" strokeWidth={1.5} />
                  </button>
                  <span
                    style={{
                      fontSize: '0.78rem',
                      color: 'rgba(190,215,255,0.85)',
                      fontWeight: 500,
                      textAlign: 'center',
                    }}
                  >
                    Login with Fingerprint / Face ID
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Register link */}
          <p
            className="mt-7 text-center"
            style={{ fontSize: '0.85rem', color: 'rgba(190,215,255,0.70)' }}
          >
            New user?{' '}
            <a
              href="#"
              className="font-bold text-white hover:underline"
            >
              Register Now
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
