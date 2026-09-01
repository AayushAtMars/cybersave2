import React from 'react';

const Footer = () => {
  return (
    <footer style={{ background: '#0F172A', borderTop: '1px solid #1E293B' }}>
      <div className="w-full px-8 lg:px-16 py-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-8">
          <div className="col-span-2 md:col-span-1">
            <img src="/logo.svg" alt="CyberSave" className="h-9 w-auto mb-3 brightness-0 invert" />
            <p className="text-[11px] text-slate-500 leading-relaxed">India's trusted digital gateway for government services.</p>
          </div>
          {[
            { heading: 'Services',  links: ['Aadhaar', 'PAN Card', 'Passport', 'Voter ID', 'ITR'] },
            { heading: 'Support',   links: ['Help Center', 'Track App', 'Contact Us', 'FAQ'] },
            { heading: 'Company',   links: ['About', 'Privacy', 'Terms', 'Careers'] },
            { heading: 'Connect',   links: ['Twitter', 'LinkedIn', 'Facebook', 'Instagram'] },
          ].map((col) => (
            <div key={col.heading}>
              <h4 className="text-xs font-bold text-slate-300 mb-3">{col.heading}</h4>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l}><a href="#" className="text-[11px] text-slate-500 hover:text-slate-300">{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-800 pt-5 flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-[11px] text-slate-600">© 2026 CyberSave. All rights reserved. Ministry of Electronics & IT.</p>
          <div className="flex gap-4">
            {['Privacy', 'Terms', 'Cookies'].map((l) => (
              <a key={l} href="#" className="text-[11px] text-slate-600 hover:text-slate-400">{l}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
