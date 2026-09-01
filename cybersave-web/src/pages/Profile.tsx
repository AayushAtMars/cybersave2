import React from 'react';
import { Settings, LogOut, ChevronRight, User as UserIcon, Shield, CreditCard, HelpCircle, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';

const Profile = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
        <div className="w-24 h-24 bg-primary rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-primary/20">
          AD
        </div>
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-2xl font-bold text-text-primary">Alex Doe</h1>
          <p className="text-text-secondary mt-1">alex.doe@example.com</p>
          <div className="inline-flex items-center mt-3 px-3 py-1 rounded-full bg-warning/10 text-warning text-sm font-semibold border border-warning/20">
            <Shield size={14} className="mr-1" /> Premium Member
          </div>
        </div>
        <button className="px-6 py-2 bg-surface border border-border hover:bg-surface-alt rounded-xl font-medium text-text-primary transition-colors">
          Edit Profile
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="glass rounded-2xl border border-border overflow-hidden">
            <div className="p-4 bg-surface-alt border-b border-border font-bold text-text-primary">
              Account Settings
            </div>
            <div className="divide-y divide-border">
              {[
                { icon: UserIcon, label: 'Personal Information', path: '#' },
                { icon: CreditCard, label: 'Payment Methods', path: '/wallet' },
                { icon: Shield, label: 'Security & Privacy', path: '#' },
                { icon: Bell, label: 'Notifications', path: '#' },
              ].map((item, idx) => (
                <Link key={idx} to={item.path} className="flex items-center justify-between p-4 hover:bg-surface-alt transition-colors group bg-surface">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-ghost flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                      <item.icon size={20} />
                    </div>
                    <span className="font-medium text-text-primary">{item.label}</span>
                  </div>
                  <ChevronRight size={20} className="text-text-muted group-hover:text-primary transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass rounded-2xl border border-border overflow-hidden">
            <div className="p-4 bg-surface-alt border-b border-border font-bold text-text-primary">
              Support & About
            </div>
            <div className="divide-y divide-border">
              {[
                { icon: HelpCircle, label: 'Help Center', path: '/help' },
                { icon: Settings, label: 'App Settings', path: '#' },
              ].map((item, idx) => (
                <Link key={idx} to={item.path} className="flex items-center justify-between p-4 hover:bg-surface-alt transition-colors group bg-surface">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-surface-alt border border-border flex items-center justify-center text-text-secondary group-hover:bg-surface group-hover:text-primary transition-colors">
                      <item.icon size={20} />
                    </div>
                    <span className="font-medium text-text-primary">{item.label}</span>
                  </div>
                  <ChevronRight size={20} className="text-text-muted group-hover:text-primary transition-colors" />
                </Link>
              ))}
              <button className="w-full flex items-center justify-between p-4 hover:bg-status-error-bg transition-colors group bg-surface">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-status-error-bg flex items-center justify-center text-status-error">
                    <LogOut size={20} />
                  </div>
                  <span className="font-medium text-status-error">Log Out</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
