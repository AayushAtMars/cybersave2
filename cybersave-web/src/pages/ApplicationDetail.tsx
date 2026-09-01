import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle2, FileText, Download } from 'lucide-react';

const ApplicationDetail = () => {
  const { appId } = useParams();

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center space-x-4">
        <Link to="/dashboard" className="p-2 bg-surface hover:bg-surface-alt rounded-full text-text-secondary hover:text-primary transition-colors border border-border">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-text-primary">Aadhaar Address Update</h1>
            <span className="px-3 py-1 bg-status-inProgress-bg text-status-inProgress rounded-full text-xs font-bold border border-status-inProgress/20">
              In Progress
            </span>
          </div>
          <p className="text-sm text-text-secondary mt-1">Application ID: {appId || 'APP-987654321'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Status Timeline */}
          <div className="glass rounded-2xl p-6 border border-border">
            <h3 className="text-lg font-bold text-text-primary mb-6">Application Tracker</h3>
            
            <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-border">
              {/* Step 1 */}
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-surface bg-status-success text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                  <CheckCircle2 size={16} />
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-border bg-surface shadow-sm">
                  <div className="flex items-center justify-between space-x-2 mb-1">
                    <div className="font-bold text-text-primary">Application Submitted</div>
                    <time className="font-medium text-xs text-text-muted">Oct 12</time>
                  </div>
                  <div className="text-text-secondary text-sm">Your application and documents were received.</div>
                </div>
              </div>
              
              {/* Step 2 */}
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-surface bg-primary text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                  <Clock size={16} />
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-primary/20 bg-primary-ghost shadow-sm">
                  <div className="flex items-center justify-between space-x-2 mb-1">
                    <div className="font-bold text-primary">Document Verification</div>
                    <time className="font-medium text-xs text-primary/60">Currently</time>
                  </div>
                  <div className="text-primary/80 text-sm">Government officials are reviewing your uploaded proofs.</div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-surface bg-surface-alt text-text-muted shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                  <div className="w-2 h-2 bg-text-muted rounded-full"></div>
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-border bg-surface/50 opacity-50">
                  <div className="flex items-center justify-between space-x-2 mb-1">
                    <div className="font-bold text-text-primary">Final Approval</div>
                  </div>
                  <div className="text-text-secondary text-sm">Waiting for document verification to complete.</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass rounded-2xl p-6 border border-border">
            <h3 className="text-lg font-bold text-text-primary mb-4">Payment Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Government Fee</span>
                <span className="font-medium text-text-primary">₹50.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Platform Fee</span>
                <span className="font-medium text-text-primary">₹0.00</span>
              </div>
              <div className="flex justify-between border-t border-border pt-3 mt-3">
                <span className="font-bold text-text-primary">Total Paid</span>
                <span className="font-bold text-status-success">₹50.00</span>
              </div>
            </div>
            <button className="w-full mt-6 py-2 bg-surface border border-border rounded-lg text-sm font-medium text-text-secondary hover:text-primary transition-colors flex items-center justify-center">
              <Download size={16} className="mr-2" /> Download Receipt
            </button>
          </div>

          <div className="glass rounded-2xl p-6 border border-border">
            <h3 className="text-lg font-bold text-text-primary mb-4">Uploaded Documents</h3>
            <div className="space-y-3">
              <Link to="/documents/doc-123" className="flex items-center p-3 rounded-xl border border-border bg-surface hover:border-primary/40 transition-colors group">
                <div className="w-10 h-10 rounded-lg bg-primary-ghost flex items-center justify-center text-primary mr-3">
                  <FileText size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">Aadhaar_Front.jpg</p>
                  <p className="text-xs text-text-secondary">Proof of Identity</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetail;
