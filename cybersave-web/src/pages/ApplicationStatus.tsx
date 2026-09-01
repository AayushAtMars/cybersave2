import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, FileText, ArrowRight, Home } from 'lucide-react';

const ApplicationStatus = () => {
  const { id } = useParams();

  return (
    <div className="max-w-2xl mx-auto py-12 flex flex-col items-center text-center">
      {/* Success Animation Container */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-status-success rounded-full blur-2xl opacity-20 animate-pulse"></div>
        <div className="w-24 h-24 bg-status-success-bg rounded-full flex items-center justify-center border-4 border-status-success relative z-10">
          <CheckCircle2 size={48} className="text-status-success" />
        </div>
      </div>

      <h1 className="text-3xl font-bold text-text-primary mb-2">Application Submitted!</h1>
      <p className="text-text-secondary max-w-md mx-auto mb-8">
        Your application has been successfully submitted to the respective government portal for processing.
      </p>

      <div className="w-full glass rounded-2xl p-6 border border-border mb-8 text-left space-y-4">
        <div className="flex justify-between items-center border-b border-border pb-4">
          <span className="text-text-secondary">Application ID</span>
          <span className="font-mono font-bold text-primary">{id || 'APP-987654321'}</span>
        </div>
        <div className="flex justify-between items-center border-b border-border pb-4">
          <span className="text-text-secondary">Status</span>
          <span className="px-3 py-1 bg-status-pending-bg text-status-pending rounded-full text-xs font-bold">
            Under Review
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-text-secondary">Estimated Completion</span>
          <span className="font-semibold text-text-primary">5-7 Business Days</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full">
        <Link 
          to="/dashboard"
          className="flex-1 flex justify-center items-center py-3 bg-surface border border-border text-text-primary font-semibold rounded-xl hover:bg-surface-alt transition-colors"
        >
          <Home size={18} className="mr-2" /> Back to Dashboard
        </Link>
        <Link 
          to={`/applications/${id || '123'}`}
          className="flex-1 flex justify-center items-center py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors shadow-sm"
        >
          Track Status <ArrowRight size={18} className="ml-2" />
        </Link>
      </div>
    </div>
  );
};

export default ApplicationStatus;
