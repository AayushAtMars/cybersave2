import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, Search, Menu, X, ChevronDown, MapPin, HelpCircle } from 'lucide-react';
import navbarLogo from '../../assets/navbarLogo.svg';
import { useAuthStore } from '../store/authStore';

const navLinks = [
  { name: 'Home', path: '/dashboard' },
  { name: 'Services', path: '/services' },
  { name: 'Applications', path: '/applications/123' },
  { name: 'Documents', path: '/documents/doc-123' },
  { name: 'Wallet', path: '/wallet' },
  { name: 'Schemes', path: '/schemes' },
];

const Navbar = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = useAuthStore((state) => state.user);

  const userName = user?.name || 'Guest User';
  const userAvatar = user?.avatar;
  const initial = userName.charAt(0).toUpperCase();

  return (
    <header
      className="sticky top-0 z-50 w-full bg-white py-3"
      style={{ borderBottom: '1px solid #E8EFFF', boxShadow: '0 1px 6px rgba(37,99,235,0.07)' }}
    >
      <div className="w-full px-20 lg:px-20 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center shrink-0">
          <img src={navbarLogo} alt="CyberSave" className="h-15 w-auto object-contain" />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-6 xl:gap-12">
          {navLinks.map((link) => {
            const isActive =
              link.path === '/dashboard'
                ? location.pathname === '/dashboard'
                : location.pathname.startsWith(link.path);
            return (
              <Link
                key={link.name}
                to={link.path}
                className="text-md transition-colors whitespace-nowrap"
                style={{
                  color: isActive ? '#3B82F6' : '#64748b',
                  fontWeight: isActive ? 600 : 500,
                }}
              >
                {link.name}
              </Link>
            );
          })}

          {/* Find Centre pill */}
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:opacity-90"
            style={{ backgroundColor: '#DBEAFE', color: '#2563EB' }}
          >
            <MapPin size={14} /> Find Centre
          </button>
        </nav>

        {/* Right icons */}
        <div className="flex items-center gap-6 shrink-0">
          <div className="flex items-center gap-6">
            {/* Search */}
            <button className="text-slate-500 hover:text-slate-700 transition-colors">
              <Search size={19} />
            </button>

            {/* Bell */}
            <button className="relative text-slate-500 hover:text-slate-700 transition-colors">
              <Bell size={19} />
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full ring-1 ring-white"></span>
            </button>

            {/* Help */}
            <button className="text-slate-500 hover:text-slate-700 transition-colors">
              <HelpCircle size={19} />
            </button>
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-slate-200" />

          {/* User */}
          <button className="flex items-center gap-2 hover:bg-slate-50 rounded-lg p-1 transition-colors">
            {userAvatar ? (
              <img
                src={userAvatar}
                alt="User"
                className="w-8 h-8 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold shrink-0">
                {initial}
              </div>
            )}
            <div className="hidden md:flex items-center gap-1 text-left">
              <span className="text-sm font-semibold text-slate-700">{userName}</span>
              <ChevronDown size={14} className="text-slate-400" />
            </div>
          </button>

          {/* Mobile menu btn */}
          <button
            className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg ml-1"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              {link.name}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
};

export default Navbar;

