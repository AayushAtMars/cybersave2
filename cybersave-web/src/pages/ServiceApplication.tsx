import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, CheckCircle2, ShieldCheck, ChevronRight, FileText } from 'lucide-react';

// Steps for a generic service application
const STEPS = ['Document Upload', 'OTP Verification', 'Review & Submit'];

const ServiceApplication = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  // Mock service data based on serviceId
  const serviceName = serviceId === 'aadhaar' ? 'Aadhaar Address Update' 
    : serviceId === 'pan' ? 'PAN Card Correction'
    : 'Service Application';

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final submit
      navigate(`/application-status/12345`);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button onClick={prevStep} className="p-2 bg-surface hover:bg-surface-alt rounded-full text-text-secondary hover:text-primary transition-colors border border-border">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{serviceName}</h1>
          <p className="text-sm text-text-secondary mt-1">Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep]}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 w-full h-1 bg-border -z-10 transform -translate-y-1/2"></div>
        {STEPS.map((step, index) => (
          <div key={index} className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
              index < currentStep ? 'bg-status-success text-white' : 
              index === currentStep ? 'bg-primary text-white ring-4 ring-primary-ghost' : 
              'bg-surface border border-border text-text-muted'
            }`}>
              {index < currentStep ? <CheckCircle2 size={16} /> : index + 1}
            </div>
            <span className={`text-xs mt-2 font-medium ${index <= currentStep ? 'text-text-primary' : 'text-text-muted'}`}>
              {step}
            </span>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="glass rounded-2xl p-6 md:p-8 border border-white/50 shadow-sm relative overflow-hidden">
        {currentStep === 0 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center pb-4 border-b border-border">
              <h2 className="text-xl font-bold text-text-primary">Upload Documents</h2>
              <p className="text-sm text-text-secondary mt-2">Please upload clear copies of the required documents.</p>
            </div>
            
            <div className="space-y-4">
              <div className="border-2 border-dashed border-primary/40 bg-primary-ghost/30 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-primary-ghost/50 transition-colors">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm text-primary">
                  <Upload size={28} />
                </div>
                <h3 className="font-semibold text-text-primary">Proof of Identity (POI)</h3>
                <p className="text-xs text-text-secondary mt-1">JPEG, PNG or PDF (Max 2MB)</p>
              </div>

              <div className="border-2 border-dashed border-border bg-surface rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-surface-alt transition-colors text-text-muted hover:text-primary hover:border-primary/40">
                <Upload size={28} className="mb-4" />
                <h3 className="font-semibold">Proof of Address (POA)</h3>
                <p className="text-xs mt-1">JPEG, PNG or PDF (Max 2MB)</p>
              </div>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center pb-4 border-b border-border">
              <h2 className="text-xl font-bold text-text-primary">Verify OTP</h2>
              <p className="text-sm text-text-secondary mt-2">Enter the 6-digit code sent to your registered mobile number.</p>
            </div>
            
            <div className="flex justify-center space-x-3 py-6">
              {[1, 2, 3, 4, 5, 6].map((idx) => (
                <input 
                  key={idx}
                  type="text" 
                  maxLength={1}
                  className="w-12 h-14 text-center text-xl font-bold bg-surface border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  placeholder="-"
                />
              ))}
            </div>
            
            <div className="text-center">
              <button className="text-primary text-sm font-semibold hover:text-primary-dark transition-colors">
                Resend Code
              </button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center pb-4 border-b border-border">
              <h2 className="text-xl font-bold text-text-primary">Review & Submit</h2>
              <p className="text-sm text-text-secondary mt-2">Please verify all details before final submission.</p>
            </div>
            
            <div className="bg-surface-alt p-4 rounded-xl space-y-4">
              <div className="flex justify-between border-b border-border pb-3">
                <span className="text-text-secondary">Service</span>
                <span className="font-semibold text-text-primary">{serviceName}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-3">
                <span className="text-text-secondary">Processing Fee</span>
                <span className="font-semibold text-text-primary">₹50.00</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-text-secondary">Documents</span>
                <span className="font-semibold text-status-success flex items-center">
                  <CheckCircle2 size={16} className="mr-1" /> 2 Uploaded
                </span>
              </div>
            </div>

            <div className="flex items-start space-x-3 bg-primary-ghost p-4 rounded-xl text-sm">
              <ShieldCheck className="text-primary shrink-0 mt-0.5" size={20} />
              <p className="text-text-primary">
                By submitting this application, I declare that all information provided is true and correct to the best of my knowledge.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex justify-between items-center pt-4">
        <button 
          onClick={prevStep}
          className={`px-6 py-3 font-semibold rounded-xl transition-colors ${currentStep === 0 ? 'text-text-muted invisible' : 'text-text-secondary bg-surface border border-border hover:bg-surface-alt'}`}
        >
          Back
        </button>
        <button 
          onClick={nextStep}
          className="flex items-center px-8 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark hover:shadow-lg transition-all"
        >
          {currentStep === STEPS.length - 1 ? 'Submit Application' : 'Continue'}
          <ChevronRight size={18} className="ml-2" />
        </button>
      </div>
    </div>
  );
};

export default ServiceApplication;
