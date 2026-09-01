import React from 'react';
import { Plus, ArrowUpRight, ArrowDownLeft, Wallet as WalletIcon, CreditCard, CheckCircle2 } from 'lucide-react';

const Wallet = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Main Wallet Card */}
        <div className="flex-1 rounded-3xl p-8 bg-gradient-to-br from-primary-dark via-primary to-primary-light text-white relative overflow-hidden shadow-xl shadow-primary/20">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-white opacity-10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-32 h-32 bg-primary-dark opacity-50 rounded-full blur-xl"></div>
          
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start mb-8">
              <div>
                <p className="text-primary-ghost text-sm font-medium mb-1">Total Balance</p>
                <h1 className="text-4xl font-extrabold tracking-tight">₹ 2,450.00</h1>
              </div>
              <WalletIcon size={32} className="opacity-80" />
            </div>
            
            <div className="flex space-x-4 mt-4">
              <button className="flex-1 bg-white text-primary font-bold py-3 px-4 rounded-xl shadow-sm hover:bg-surface-alt transition-colors flex items-center justify-center">
                <Plus size={20} className="mr-2" /> Add Money
              </button>
              <button className="flex-1 bg-primary-dark/40 border border-white/20 text-white font-bold py-3 px-4 rounded-xl hover:bg-primary-dark/60 transition-colors flex items-center justify-center backdrop-blur-sm">
                <ArrowUpRight size={20} className="mr-2" /> Withdraw
              </button>
            </div>
          </div>
        </div>

        {/* Saved Cards / Payment Methods */}
        <div className="md:w-80 glass rounded-3xl p-6 border border-border">
          <h3 className="text-lg font-bold text-text-primary mb-4">Payment Methods</h3>
          <div className="space-y-4">
            <div className="p-4 border border-primary bg-primary-ghost rounded-xl flex items-center justify-between relative overflow-hidden">
              <div className="absolute right-0 top-0 w-16 h-full bg-primary/5 -skew-x-12 transform origin-top"></div>
              <div className="flex items-center space-x-3 relative z-10">
                <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center text-primary">
                  <CreditCard size={20} />
                </div>
                <div>
                  <p className="font-semibold text-text-primary text-sm">•••• 4242</p>
                  <p className="text-xs text-text-secondary">Expires 12/28</p>
                </div>
              </div>
              <CheckCircle2 size={20} className="text-primary relative z-10" />
            </div>

            <button className="w-full p-4 border border-dashed border-border hover:border-primary/50 bg-surface hover:bg-surface-alt rounded-xl flex items-center justify-center text-text-secondary hover:text-primary transition-all">
              <Plus size={20} className="mr-2" />
              <span className="font-medium text-sm">Add New Card</span>
            </button>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="glass rounded-3xl p-6 md:p-8 border border-border">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-text-primary">Recent Transactions</h3>
          <button className="text-primary text-sm font-semibold hover:text-primary-dark transition-colors">
            View All
          </button>
        </div>

        <div className="space-y-4">
          {[
            { title: 'Aadhaar Update Fee', date: 'Oct 12, 2026', amount: '-₹50.00', type: 'debit' },
            { title: 'Wallet Topup', date: 'Oct 10, 2026', amount: '+₹1,000.00', type: 'credit' },
            { title: 'Passport Application', date: 'Sep 25, 2026', amount: '-₹1500.00', type: 'debit' },
          ].map((tx, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 bg-surface rounded-xl border border-border hover:border-primary/30 transition-colors">
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  tx.type === 'credit' ? 'bg-status-success-bg text-status-success' : 'bg-surface-alt text-text-secondary border border-border'
                }`}>
                  {tx.type === 'credit' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary">{tx.title}</h4>
                  <p className="text-xs text-text-secondary">{tx.date}</p>
                </div>
              </div>
              <div className={`font-bold ${tx.type === 'credit' ? 'text-status-success' : 'text-text-primary'}`}>
                {tx.amount}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Wallet;
