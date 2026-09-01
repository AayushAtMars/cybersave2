import React from 'react';
import { Fingerprint, Landmark, Scale, FileText, ChevronRight, ShieldCheck, HeartPulse } from 'lucide-react';
import { Link } from 'react-router-dom';

const Services = () => {
  const serviceCategories = [
    {
      title: 'Identity Services',
      description: 'Aadhaar, PAN, Passport, and other identity documents',
      icon: Fingerprint,
      path: '/services/identity',
      color: 'text-primary',
      bg: 'bg-primary-ghost'
    },
    {
      title: 'Financial & Tax',
      description: 'Income Tax, GST, EPF, and banking services',
      icon: Landmark,
      path: '/services/finance',
      color: 'text-status-success',
      bg: 'bg-status-success-bg'
    },
    {
      title: 'Legal & Compliance',
      description: 'Business registration, legal documentation',
      icon: Scale,
      path: '/services/legal',
      color: 'text-warning',
      bg: 'bg-warning/10'
    },
    {
      title: 'Health & Insurance',
      description: 'Health ID, insurance policies, medical records',
      icon: HeartPulse,
      path: '/services/health',
      color: 'text-status-error',
      bg: 'bg-status-error-bg'
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Services Directory</h1>
          <p className="text-text-secondary mt-1">Explore and manage all your government and legal services.</p>
        </div>
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search services..." 
            className="pl-10 pr-4 py-2 w-full md:w-64 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary bg-surface transition-shadow shadow-sm"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FileText className="h-5 w-5 text-text-muted" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {serviceCategories.map((category, index) => (
          <Link 
            key={index} 
            to={category.path}
            className="group glass p-6 rounded-2xl border border-border hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 relative overflow-hidden flex items-start"
          >
            {/* Decorative gradient blob on hover */}
            <div className="absolute -inset-4 bg-gradient-to-r from-primary-light to-primary opacity-0 group-hover:opacity-5 transition-opacity blur-2xl"></div>
            
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${category.bg}`}>
              <category.icon size={28} className={category.color} />
            </div>
            
            <div className="ml-5 flex-1">
              <h3 className="text-lg font-bold text-text-primary group-hover:text-primary transition-colors">
                {category.title}
              </h3>
              <p className="text-sm text-text-secondary mt-1 leading-relaxed">
                {category.description}
              </p>
            </div>
            
            <div className="self-center ml-2 opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all">
              <ChevronRight className="text-primary" size={24} />
            </div>
          </Link>
        ))}
      </div>
      
      {/* Popular Services Banner */}
      <div className="mt-12 glass-dark bg-text-primary rounded-2xl p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-primary opacity-30 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-3">
              <ShieldCheck className="text-status-success" size={24} />
              <span className="text-sm font-semibold tracking-wider text-status-success uppercase">Most Requested</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">Aadhaar Address Update</h2>
            <p className="text-text-muted max-w-lg">
              Update your Aadhaar address completely online. Fast, secure, and hassle-free processing with CyberSave guarantee.
            </p>
          </div>
          <Link to="/services/identity/aadhaar" className="bg-primary hover:bg-primary-light text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-primary/30 transition-all shrink-0">
            Apply Now
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Services;
