import React, { useState } from 'react';
import { Search, Book, MessageCircle, Phone, ChevronRight, FileQuestion } from 'lucide-react';
import { Link } from 'react-router-dom';

const HelpCenter = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const faqs = [
    { q: 'How long does Aadhaar address update take?', a: 'Typically 5-7 working days.' },
    { q: 'What documents are valid for Address Proof?', a: 'Utility bills, passport, bank passbook, or Voter ID.' },
    { q: 'Can I cancel my application after payment?', a: 'No, once submitted to the portal it cannot be cancelled.' },
    { q: 'Why is my document rejected?', a: 'Common reasons include blurriness, mismatch of names, or expired validity.' }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-text-primary">How can we help you?</h1>
        <div className="max-w-xl mx-auto relative">
          <input 
            type="text" 
            placeholder="Search for articles, questions..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-surface border border-border focus:border-primary focus:ring-2 focus:ring-primary shadow-sm transition-all"
          />
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text-muted" size={24} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-6 rounded-2xl border border-border flex flex-col items-center text-center hover:border-primary/50 transition-colors cursor-pointer group">
          <div className="w-12 h-12 rounded-xl bg-primary-ghost flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
            <Book size={24} />
          </div>
          <h3 className="font-bold text-text-primary">Knowledge Base</h3>
          <p className="text-sm text-text-secondary mt-2">Read our guides and articles to learn more about our services.</p>
        </div>

        <div className="glass p-6 rounded-2xl border border-border flex flex-col items-center text-center hover:border-primary/50 transition-colors cursor-pointer group">
          <div className="w-12 h-12 rounded-xl bg-status-success-bg flex items-center justify-center text-status-success mb-4 group-hover:scale-110 transition-transform">
            <MessageCircle size={24} />
          </div>
          <h3 className="font-bold text-text-primary">Live Chat</h3>
          <p className="text-sm text-text-secondary mt-2">Chat with our AI bot or a human agent for quick resolutions.</p>
        </div>

        <div className="glass p-6 rounded-2xl border border-border flex flex-col items-center text-center hover:border-primary/50 transition-colors cursor-pointer group">
          <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center text-warning mb-4 group-hover:scale-110 transition-transform">
            <Phone size={24} />
          </div>
          <h3 className="font-bold text-text-primary">Phone Support</h3>
          <p className="text-sm text-text-secondary mt-2">Call us directly if you have an urgent query regarding an application.</p>
        </div>
      </div>

      <div className="glass rounded-3xl border border-border p-6 md:p-8">
        <div className="flex items-center space-x-3 mb-6">
          <FileQuestion className="text-primary" size={24} />
          <h3 className="text-xl font-bold text-text-primary">Frequently Asked Questions</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="p-4 bg-surface rounded-xl border border-border hover:border-primary/30 transition-colors cursor-pointer">
              <h4 className="font-semibold text-text-primary mb-2">{faq.q}</h4>
              <p className="text-sm text-text-secondary">{faq.a}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-8 text-center border-t border-border pt-6">
          <Link to="/articles" className="inline-flex items-center text-primary font-semibold hover:text-primary-dark transition-colors">
            View All FAQs <ChevronRight size={18} className="ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;
