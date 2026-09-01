import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, Layers, Wallet, Shield, ArrowRight, ChevronRight,
  CheckCircle2, Clock, Star, MapPin, Phone, MessageCircle,
  Fingerprint, HeartPulse, Scale, Landmark, Download, TrendingUp,
  Bell, Zap, Users, Award, Archive
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import heroImg from '../../assets/home/hero.svg';

/* ─── Tiny helpers ─── */
const StatusBadge = ({ status }: { status: string }) => {
  const m: Record<string, [string, string]> = {
    'In Progress': ['#2563EB', '#EFF6FF'],
    Completed: ['#16A34A', '#F0FDF4'],
    Pending: ['#D97706', '#FFFBEB'],
    Rejected: ['#DC2626', '#FEF2F2'],
    Verified: ['#16A34A', '#F0FDF4'],
  };
  const [color, bg] = m[status] || m['Pending'];
  return (
    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold" style={{ color, background: bg }}>
      {status}
    </span>
  );
};

const SectionHeader = ({ title, subtitle, action, actionPath }: any) => (
  <div className="flex items-end justify-between mb-4">
    <div>
      <h2 className="text-base font-extrabold text-slate-800">{title}</h2>
      {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
    </div>
    {action && (
      <Link to={actionPath || '#'} className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline">
        {action} <ChevronRight size={12} />
      </Link>
    )}
  </div>
);

/* ═══════════════════════════════════
   DASHBOARD
═══════════════════════════════════ */
const Dashboard = () => {
  const user = useAuthStore((s) => s.user);
  const firstName = user?.name?.split(' ')[0] || 'User';

  const { data: stats } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      const res = await apiClient.get('/applications/stats');
      return res.data.data;
    },
  });

  return (
    <div className="w-full bg-white">

      {/* ── HERO ──────────────────────────────── */}
      <section
        style={{
          background: 'linear-gradient(105deg, #F8FAFF 0%, #E6EFFF 50%, #C3D8FF 100%)',
        }}
      >
        <div className="w-full px-5 lg:px-40 py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-16 items-center">

          {/* Left */}
          <div className="lg:col-span-2 space-y-5">
            {/* Welcome tag */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold text-[#2563EB] tracking-wide uppercase">
                WELCOME BACK, {firstName}
              </span>
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                <span className={`w-1.5 h-1.5 rounded-full inline-block ${user?.isVerified ? 'bg-[#16A34A]' : 'bg-amber-500'}`} />
                {user?.isVerified ? 'Aadhaar Verified' : 'Action Required'}
              </span>
            </div>

            {/* Headline */}
            <div>
              <h1 className="text-[44px] lg:text-[52px] font-bold text-slate-900 leading-[1.1] tracking-tight">
                Everything Government.<br />
                <span className="text-[#2563EB]">One Secure Place.</span>
              </h1>
            </div>

            {/* Description */}
            <p className="text-[15px] lg:text-[16px] text-slate-500 leading-[1.6] max-w-xl pt-1 pb-2">
              Access, apply, and manage your essential Indian digital services, common service
              operations, certificates, and secure government locker documents from one unified,
              citizen-first platform.
            </p>

            {/* CTAs */}
            <div className="flex gap-4">
              <Link
                to="/services"
                className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-white font-semibold transition-all hover:shadow-md"
                style={{ background: '#2563EB', fontSize: '15px' }}
              >
                Explore Services <ArrowRight size={18} strokeWidth={2.5} />
              </Link>
              <Link
                to="/applications/123"
                className="flex items-center justify-center px-7 py-3.5 rounded-xl border border-slate-200 bg-white text-slate-800 font-semibold hover:border-slate-300 transition-colors shadow-sm"
                style={{ fontSize: '15px' }}
              >
                Track Application
              </Link>
            </div>
          </div>
          {/* Right – Hero Image */}
          <div className="lg:col-span-1 flex justify-end">
            <img
              src={heroImg}
              alt="CyberSave Security Shield"
              className="w-full max-w-[500px] h-auto object-contain rounded-[24px]"
              style={{ boxShadow: '0 20px 40px -12px rgba(37,99,235,0.15)' }}
            />
          </div>
        </div>
      </section>

      {/* ── STATS BAR ─────────────────────────── */}
      <section className="w-full bg-white" style={{ borderBottom: '1px solid #EEF2FF' }}>
        <div className="w-full px-8 lg:px-40 py-5 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: <FileText size={20} color="#2563EB" />,
              bg: '#EFF6FF',
              label: 'Active Applications',
              value: stats ? String(stats.activeApplications).padStart(2, '0') : '00',
            },
            {
              icon: <Archive size={20} color="#0EA5E9" />,
              bg: '#F0F9FF',
              label: 'Stored Documents',
              value: stats ? String(stats.storedDocuments).padStart(2, '0') : '00',
            },
            {
              icon: <Wallet size={20} color="#D97706" />,
              bg: '#FFFBEB',
              label: 'Payments This Month',
              value: stats ? `₹${stats.paymentsThisMonth.toLocaleString('en-IN')}` : '₹0',
            },
            {
              icon: <CheckCircle2 size={20} color="#16A34A" />,
              bg: '#F0FDF4',
              label: 'Services Completed',
              value: stats ? String(stats.servicesCompleted).padStart(2, '0') : '00',
            },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 rounded-xl bg-white hover:shadow-sm transition-all" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: s.bg }}>
                {s.icon}
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-400 leading-none">{s.label}</p>
                <p className="text-2xl font-extrabold text-slate-800 mt-1 leading-none">{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── MAIN BODY ─────────────────────────── */}
      <div className="w-full px-8 lg:px-16 py-8 space-y-10" style={{ background: '#F4F7FF' }}>

        {/* HOW CAN WE HELP */}
        <section>
          <SectionHeader
            title="How can we help today?"
            subtitle="Quick access to your most-used services"
          />
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
            {[
              { icon: <Fingerprint size={20} color="#2563EB" />, label: 'Aadhaar', path: '/services/identity/aadhaar', bg: '#EFF6FF' },
              { icon: <FileText size={20} color="#16A34A" />, label: 'PAN Card', path: '/services/identity/pan', bg: '#F0FDF4' },
              { icon: <FileText size={20} color="#D97706" />, label: 'Passport', path: '/services/identity/passport', bg: '#FFFBEB' },
              { icon: <Users size={20} color="#7C3AED" />, label: 'Voter ID', path: '/services/identity/voter', bg: '#F5F3FF' },
              { icon: <Landmark size={20} color="#0EA5E9" />, label: 'ITR', path: '/services/finance', bg: '#F0F9FF' },
              { icon: <HeartPulse size={20} color="#E11D48" />, label: 'Health ID', path: '/services/health', bg: '#FFF1F2' },
              { icon: <Scale size={20} color="#D97706" />, label: 'Legal', path: '/services/legal', bg: '#FFFBEB' },
              { icon: <Award size={20} color="#16A34A" />, label: 'Benefits', path: '#', bg: '#F0FDF4' },
              { icon: <Wallet size={20} color="#2563EB" />, label: 'Payments', path: '/wallet', bg: '#EFF6FF' },
              { icon: <Download size={20} color="#7C3AED" />, label: 'Documents', path: '/documents/doc-123', bg: '#F5F3FF' },
            ].map((s, i) => (
              <Link
                key={i}
                to={s.path}
                className="flex flex-col items-center gap-1.5 p-3 bg-white rounded-xl border border-slate-100 hover:border-blue-300 hover:shadow-sm transition-all group"
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: s.bg }}>
                  {s.icon}
                </div>
                <span className="text-[10px] font-semibold text-slate-500 group-hover:text-blue-600 text-center leading-tight">
                  {s.label}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* APPLICATIONS + QUICK APPLY */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <SectionHeader title="Your Applications" subtitle="Recent & active submissions" action="View All" actionPath="/applications/123" />
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              {[
                { title: 'Aadhaar Address Update', date: 'Oct 12, 2026', id: 'APP-001', status: 'In Progress' },
                { title: 'PAN Card Name Correction', date: 'Oct 08, 2026', id: 'APP-002', status: 'Completed' },
                { title: 'Passport Renewal', date: 'Sep 25, 2026', id: 'APP-003', status: 'Pending' },
                { title: 'Voter ID Update', date: 'Sep 18, 2026', id: 'APP-004', status: 'Completed' },
              ].map((app, i) => (
                <Link key={i} to={`/applications/${app.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors group border-b border-slate-50 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                      <FileText size={15} color="#2563EB" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700 group-hover:text-blue-600">{app.title}</p>
                      <p className="text-[10px] text-slate-400">{app.date} · {app.id}</p>
                    </div>
                  </div>
                  <StatusBadge status={app.status} />
                </Link>
              ))}
              <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100">
                <Link to="/services" className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600 hover:underline">
                  <Zap size={11} /> Apply for a new service
                </Link>
              </div>
            </div>
          </div>

          <div>
            <SectionHeader title="More Applications" subtitle="Other services" />
            <div className="space-y-2.5">
              {[
                { title: 'Aadhaar Address Update', path: '/services/identity/aadhaar', days: '5–7 days', fee: '₹50' },
                { title: 'PAN Card Correction', path: '/services/identity/pan', days: '10–15 days', fee: '₹107' },
                { title: 'Passport Renewal', path: '/services/identity/passport', days: 'Varies', fee: '₹1500' },
              ].map((s, i) => (
                <Link key={i} to={s.path}
                  className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-slate-100 hover:border-blue-300 hover:shadow-sm transition-all group"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-700 group-hover:text-blue-600">{s.title}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{s.days} · {s.fee}</p>
                  </div>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-500" />
                </Link>
              ))}
              <Link to="/services"
                className="flex items-center justify-center gap-1.5 w-full py-2 border-2 border-dashed border-blue-200 rounded-xl text-[11px] font-bold text-blue-500 hover:bg-blue-50 transition-colors"
              >
                Browse All <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>

        {/* EXPLORE SERVICES */}
        <section>
          <SectionHeader title="Explore CyberSave Services" subtitle="All categories in one place" action="View All" actionPath="/services" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Dark featured card */}
            <div
              className="rounded-2xl p-5 text-white relative overflow-hidden flex flex-col justify-between"
              style={{ background: 'linear-gradient(145deg,#0F2460,#1a3ac7)', minHeight: '180px' }}
            >
              <div className="absolute inset-0 opacity-10" style={{ background: 'radial-gradient(circle at 80% 10%,white,transparent 60%)' }} />
              <div>
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                  <Award size={18} color="white" />
                </div>
                <h3 className="text-base font-bold mb-1">Get Certified Instantly</h3>
                <p className="text-xs text-white/70 leading-relaxed">100% online certificate process. Delivery in 3–7 days.</p>
              </div>
              <Link to="/services" className="mt-4 inline-flex items-center gap-1.5 bg-white text-blue-700 text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-blue-50 transition-colors self-start">
                See Applications <ArrowRight size={11} />
              </Link>
            </div>

            {[
              { icon: <Fingerprint size={20} color="#2563EB" />, title: 'Identity Services', desc: 'Aadhaar, PAN, Passport & more.', path: '/services/identity', bg: '#EFF6FF', tags: ['Aadhaar', 'PAN', 'Passport'] },
              { icon: <Landmark size={20} color="#16A34A" />, title: 'Financial & Tax', desc: 'ITR, GST, banking and insurance.', path: '/services/finance', bg: '#F0FDF4', tags: ['ITR', 'GST', 'EPF'] },
              { icon: <HeartPulse size={20} color="#E11D48" />, title: 'Health Services', desc: 'Health ID, Ayushman Bharat & more.', path: '/services/health', bg: '#FFF1F2', tags: ['Health ID', 'ABHA'] },
              { icon: <Scale size={20} color="#D97706" />, title: 'Legal Services', desc: 'Business reg, docs & compliance.', path: '/services/legal', bg: '#FFFBEB', tags: ['MSME', 'GST Reg'] },
              { icon: <Users size={20} color="#7C3AED" />, title: 'Citizen Benefits', desc: 'Schemes, subsidies, social support.', path: '#', bg: '#F5F3FF', tags: ['PM-KISAN', 'PMAY'] },
            ].map((cat, i) => (
              <Link key={i} to={cat.path}
                className="bg-white rounded-2xl p-5 border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all group flex flex-col"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: cat.bg }}>
                  {cat.icon}
                </div>
                <h3 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 mb-1">{cat.title}</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed flex-1">{cat.desc}</p>
                <div className="flex gap-1.5 flex-wrap mt-3">
                  {cat.tags.map((t) => (
                    <span key={t} className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-medium">{t}</span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* DIGITAL DOCUMENTS */}
        <section>
          <SectionHeader title="Your Digital Documents" subtitle="All your verified documents" action="View All" actionPath="/documents/doc-123" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: 'Aadhaar Card', id: 'XXXX XXXX 4321', status: 'Verified', icon: <Fingerprint size={18} color="#2563EB" />, bg: '#EFF6FF' },
              { title: 'PAN Card', id: 'ABCDE1234F', status: 'Verified', icon: <FileText size={18} color="#16A34A" />, bg: '#F0FDF4' },
              { title: 'Passport', id: 'P1234567', status: 'Pending', icon: <FileText size={18} color="#D97706" />, bg: '#FFFBEB' },
              { title: 'Voter ID', id: 'ABC1234567', status: 'Verified', icon: <Users size={18} color="#7C3AED" />, bg: '#F5F3FF' },
            ].map((doc, i) => (
              <Link key={i} to="/documents/doc-123"
                className="bg-white rounded-2xl p-4 border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: doc.bg }}>
                    {doc.icon}
                  </div>
                  <StatusBadge status={doc.status} />
                </div>
                <p className="text-sm font-bold text-slate-700 group-hover:text-blue-600">{doc.title}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{doc.id}</p>
                <div className="mt-2.5 flex items-center gap-1 text-xs text-blue-500 font-semibold">
                  <Download size={11} /> Download
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* BENEFITS + PAYMENTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div>
            <SectionHeader title="Benefits You May Be Eligible For" action="View All" actionPath="#" />
            <div className="space-y-2.5">
              {[
                { title: 'PM Kisan Samman Nidhi', tag: 'Agriculture', desc: '₹6,000/year for farmers', c: '#16A34A', bg: '#F0FDF4' },
                { title: 'PMAY Urban Housing', tag: 'Housing', desc: 'Subsidy on home loans', c: '#2563EB', bg: '#EFF6FF' },
                { title: 'National Scholarship', tag: 'Education', desc: 'Merit-based scholarship', c: '#7C3AED', bg: '#F5F3FF' },
              ].map((b, i) => (
                <div key={i} className="bg-white rounded-xl px-4 py-3.5 border border-slate-100 flex items-center gap-3 hover:shadow-sm transition-all">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: b.bg }}>
                    <Award size={16} color={b.c} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-700">{b.title}</p>
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold" style={{ color: b.c, background: b.bg }}>{b.tag}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">{b.desc}</p>
                  </div>
                  <ChevronRight size={14} className="text-slate-300 shrink-0" />
                </div>
              ))}
            </div>
          </div>

          <div>
            <SectionHeader title="Your Payments" action="View All" actionPath="/wallet" />
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 font-medium">Total Spent</p>
                  <p className="text-xl font-extrabold text-slate-800">₹1,657</p>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                  <TrendingUp size={11} /> This Month
                </div>
              </div>
              {[
                { title: 'Aadhaar Update Fee', date: 'Oct 12', amount: '-₹50', color: '#DC2626' },
                { title: 'Wallet Topup', date: 'Oct 10', amount: '+₹1,000', color: '#16A34A' },
                { title: 'Passport Application', date: 'Sep 25', amount: '-₹1500', color: '#DC2626' },
              ].map((tx, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-100">
                      <Wallet size={13} color="#94A3B8" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{tx.title}</p>
                      <p className="text-[10px] text-slate-400">{tx.date}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold" style={{ color: tx.color }}>{tx.amount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SECURITY BANNER */}
        <section
          className="rounded-2xl p-7 relative overflow-hidden"
          style={{ background: 'linear-gradient(130deg, #0F2460 0%, #1a3ac7 60%, #2563EB 100%)', boxShadow: '0 8px 32px rgba(37,99,235,0.25)' }}
        >
          <div className="absolute inset-0 opacity-10" style={{ background: 'radial-gradient(circle at 80% 50%, white, transparent 50%)' }} />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-5">
            <div>
              <p className="text-[10px] text-blue-200 font-bold uppercase tracking-widest mb-1">Your Security Status</p>
              <h3 className="text-xl font-extrabold text-white mb-3">Your CyberSave account is secure</h3>
              <div className="flex items-center gap-5 flex-wrap">
                {['2FA Enabled', 'Documents Verified', 'No Active Threats'].map((item) => (
                  <div key={item} className="flex items-center gap-1.5 text-xs text-blue-100 font-medium">
                    <CheckCircle2 size={13} className="text-green-300" /> {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="w-16 h-16 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center shrink-0">
              <Shield size={32} color="white" strokeWidth={1.5} />
            </div>
          </div>
        </section>

        {/* NEED HELP + IN-PERSON */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div
              className="h-36 flex items-center justify-center relative"
              style={{ background: 'linear-gradient(135deg,#DBEAFE,#EFF6FF)' }}
            >
              <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: `radial-gradient(circle, #2563EB 1px, transparent 1px)`,
                backgroundSize: '22px 22px'
              }} />
              <div className="flex flex-col items-center gap-2 z-10">
                <div className="w-11 h-11 rounded-full bg-blue-600 flex items-center justify-center shadow-lg">
                  <MapPin size={20} color="white" />
                </div>
                <span className="text-xs font-bold text-blue-700 bg-white px-3 py-1 rounded-full shadow-sm">Find Nearest CSC</span>
              </div>
            </div>
            <div className="p-5">
              <h3 className="text-sm font-extrabold text-slate-800 mb-1">Need in-person help?</h3>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">Find your nearest Common Service Centre for assisted services.</p>
              <div className="flex gap-2">
                <button className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700">
                  <MapPin size={12} /> Find Centre
                </button>
                <button className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50">
                  <Phone size={12} /> Call Support
                </button>
              </div>
            </div>
          </div>

          <div
            className="rounded-2xl p-7 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg,#F0F9FF,#EFF6FF)', border: '1px solid #BFDBFE' }}
          >
            <div className="absolute right-0 bottom-0 opacity-5">
              <MessageCircle size={140} color="#2563EB" />
            </div>
            <div className="relative z-10">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center mb-3">
                <MessageCircle size={18} color="white" />
              </div>
              <h3 className="text-base font-extrabold text-slate-800 mb-2">Need help with a service?</h3>
              <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                Our AI assistant and human agents are ready to guide you through any government process.
              </p>
              <div className="flex gap-2">
                <Link to="/help" className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700">
                  Chat with Us
                </Link>
                <Link to="/help" className="px-4 py-2 border border-blue-200 text-blue-700 text-xs font-bold rounded-xl hover:bg-blue-50">
                  Read FAQs
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* RECOMMENDED */}
        <section>
          <SectionHeader title="Recommended for You" subtitle="Based on your profile" action="View All" actionPath="/services" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: 'EPFO UAN Activation', cat: 'Employment', days: '3–5 days', fee: 'Free', c: '#16A34A', bg: '#F0FDF4' },
              { title: 'Driving Licence Renewal', cat: 'Transport', days: '7–10 days', fee: '₹200', c: '#D97706', bg: '#FFFBEB' },
              { title: 'Birth Certificate', cat: 'Civil', days: '3 days', fee: 'Free', c: '#7C3AED', bg: '#F5F3FF' },
              { title: 'GST Registration', cat: 'Business', days: '5–7 days', fee: 'Free', c: '#0EA5E9', bg: '#F0F9FF' },
            ].map((r, i) => (
              <Link key={i} to="/services/apply/new"
                className="bg-white rounded-2xl p-4 border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ color: r.c, background: r.bg }}>{r.cat}</span>
                  <Star size={12} className="text-amber-400 fill-amber-400" />
                </div>
                <p className="text-sm font-bold text-slate-700 group-hover:text-blue-600 mb-2">{r.title}</p>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="flex items-center gap-1"><Clock size={10} /> {r.days}</span>
                  <span className="font-bold text-slate-600">{r.fee}</span>
                </div>
                <button className="mt-3 w-full py-1.5 text-xs font-bold text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50">
                  Apply Now
                </button>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
