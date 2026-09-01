import React from 'react';
import { ArrowLeft, CheckCircle2, Clock, FileText, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const IdentityServices = () => {
  const identityServicesList = [
    {
      title: 'Aadhaar Address Update',
      description: 'Update your residential address in Aadhaar using valid proof.',
      duration: '5-7 Days',
      price: '₹50',
      tag: 'Popular',
      path: '/services/identity/aadhaar',
    },
    {
      title: 'PAN Card Name Correction',
      description: 'Correct spelling mistakes or change name after marriage.',
      duration: '10-15 Days',
      price: '₹107',
      path: '/services/identity/pan',
    },
    {
      title: 'Passport Renewal',
      description: 'Renew your expired or soon-to-expire passport.',
      duration: 'Varies',
      price: '₹1500',
      path: '/services/identity/passport',
    },
    {
      title: 'Voter ID Application',
      description: 'Apply for a new Voter ID card online.',
      duration: '30 Days',
      price: 'Free',
      path: '/services/identity/voter',
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Link to="/services" className="p-2 bg-surface hover:bg-surface-alt rounded-full text-text-secondary hover:text-primary transition-colors border border-border">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Identity Services</h1>
          <p className="text-sm text-text-secondary mt-1">Manage and update your core identity documents.</p>
        </div>
      </div>

      <div className="mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {identityServicesList.map((service, index) => (
            <div key={index} className="glass rounded-2xl p-6 border border-border hover:shadow-lg transition-all flex flex-col h-full bg-surface relative overflow-hidden">
              {service.tag && (
                <div className="absolute top-4 right-4 bg-primary-ghost text-primary text-xs font-bold px-2 py-1 rounded-md">
                  {service.tag}
                </div>
              )}
              
              <div className="w-12 h-12 bg-primary-ghost rounded-xl flex items-center justify-center text-primary mb-4">
                <FileText size={24} />
              </div>
              
              <h3 className="text-lg font-bold text-text-primary mb-2">{service.title}</h3>
              <p className="text-sm text-text-secondary flex-1">{service.description}</p>
              
              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-sm">
                <div className="flex items-center space-x-1 text-text-muted">
                  <Clock size={16} />
                  <span>{service.duration}</span>
                </div>
                <div className="font-semibold text-text-primary">
                  {service.price}
                </div>
              </div>
              
              <Link 
                to={service.path}
                className="mt-4 w-full flex items-center justify-center space-x-2 bg-surface border border-border hover:border-primary hover:text-primary text-text-primary font-medium py-2.5 rounded-xl transition-colors"
              >
                <span>Apply Now</span>
                <ChevronRight size={16} />
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Trust & Safety Section */}
      <div className="mt-10 p-6 glass rounded-2xl border border-status-success/20 bg-status-success-bg flex items-start space-x-4">
        <CheckCircle2 className="text-status-success shrink-0 mt-1" size={24} />
        <div>
          <h4 className="text-status-success font-bold text-lg">Govt. Verified Provider</h4>
          <p className="text-text-secondary text-sm mt-1">All applications are processed through official government portals. Your data is encrypted and never shared with third parties.</p>
        </div>
      </div>
    </div>
  );
};

export default IdentityServices;
