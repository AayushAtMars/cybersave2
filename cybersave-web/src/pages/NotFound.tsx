import React from 'react';
import { FileQuestion, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Decorative Elements */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary-dark rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>

      <div className="glass p-8 md:p-12 rounded-3xl border border-white/50 text-center max-w-md relative z-10 shadow-xl">
        <div className="w-24 h-24 bg-surface rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-border">
          <FileQuestion size={40} className="text-primary" />
        </div>
        
        <h1 className="text-4xl font-extrabold text-text-primary mb-2">404</h1>
        <h2 className="text-xl font-bold text-text-primary mb-4">Page Not Found</h2>
        
        <p className="text-text-secondary mb-8">
          The page you are looking for doesn't exist, has been moved, or is temporarily unavailable.
        </p>

        <Link 
          to="/dashboard"
          className="w-full flex items-center justify-center py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-all shadow-md hover:shadow-lg"
        >
          <Home size={18} className="mr-2" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
