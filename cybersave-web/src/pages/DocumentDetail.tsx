import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Download, FileText, CheckCircle2, Share2, Trash2 } from 'lucide-react';

const DocumentDetail = () => {
  const { docId } = useParams();

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/dashboard" className="p-2 bg-surface hover:bg-surface-alt rounded-full text-text-secondary hover:text-primary transition-colors border border-border">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Aadhaar Card</h1>
            <p className="text-sm text-text-secondary mt-1">Uploaded on Oct 12, 2026</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button className="p-2 bg-surface hover:bg-surface-alt border border-border rounded-lg text-text-secondary hover:text-primary transition-colors">
            <Share2 size={20} />
          </button>
          <button className="p-2 bg-surface hover:bg-status-error-bg border border-border rounded-lg text-text-secondary hover:text-status-error transition-colors">
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document Viewer (Placeholder) */}
        <div className="lg:col-span-2 glass rounded-2xl p-2 border border-border bg-surface-alt min-h-[500px] flex flex-col">
          <div className="flex justify-end p-2">
            <button className="flex items-center text-sm font-medium text-text-secondary hover:text-primary transition-colors bg-surface px-3 py-1.5 rounded-lg border border-border">
              <Download size={16} className="mr-2" /> Download PDF
            </button>
          </div>
          <div className="flex-1 border border-border/50 rounded-xl bg-white m-2 flex items-center justify-center text-text-muted flex-col">
            <FileText size={64} className="mb-4 opacity-20" />
            <p>Document Viewer Preview</p>
            <p className="text-xs mt-2">document_{docId || 'preview'}.pdf</p>
          </div>
        </div>

        {/* Document Meta */}
        <div className="space-y-6">
          <div className="glass rounded-2xl p-6 border border-border">
            <h3 className="text-lg font-bold text-text-primary mb-4">Document Details</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-text-secondary mb-1">Document Type</p>
                <p className="font-semibold text-text-primary">Proof of Identity (POI)</p>
              </div>
              <div>
                <p className="text-sm text-text-secondary mb-1">Status</p>
                <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-status-success-bg text-status-success">
                  <CheckCircle2 size={14} className="mr-1" /> Verified
                </div>
              </div>
              <div>
                <p className="text-sm text-text-secondary mb-1">Linked Applications</p>
                <Link to="/applications/123" className="text-primary hover:underline font-medium text-sm">
                  APP-987654321
                </Link>
              </div>
              <div>
                <p className="text-sm text-text-secondary mb-1">File Size</p>
                <p className="font-semibold text-text-primary">1.2 MB</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentDetail;
