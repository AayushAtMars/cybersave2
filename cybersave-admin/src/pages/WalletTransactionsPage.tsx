import React, { useState, useEffect, useCallback } from 'react';
import { adminClient } from '../api/client';

interface Transaction {
  _id: string;
  walletId: string;
  citizenId: string;
  applicationId?: string;
  type: string;
  amount: number;
  description: string;
  status: string;
  createdAt: string;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, React.CSSProperties> = {
    completed: { backgroundColor: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0' },
    pending: { backgroundColor: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A' },
    failed: { backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' },
    refunded: { backgroundColor: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0' },
  };
  return (
    <span style={{
      ...styles[status] ?? styles.pending,
      padding: '2px 10px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: 700,
      textTransform: 'capitalize' as const,
      display: 'inline-block',
    }}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function WalletTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: '15',
      };

      const { data } = await adminClient.get('/payments/admin/transactions', { params });
      if (data.success) {
        setTransactions(data.data.items);
        setTotal(data.data.total);
        setTotalPages(data.data.totalPages);
      }
    } catch (err) {
      console.error('Error fetching wallet transactions:', err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const formatTimestamp = (ts: string) => {
    const d = new Date(ts);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
  };

  const formatCurrency = (paise: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(paise / 100);
  };

  return (
    <div style={{ padding: '32px', backgroundColor: '#F8FAFC', minHeight: '100%' }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: '13px', color: '#64748B', marginBottom: '10px' }}>
        <span style={{ color: '#2563EB', cursor: 'pointer', fontWeight: 600 }}>Dashboard</span>
        <span style={{ margin: '0 6px' }}>→</span>
        <span style={{ color: '#0F172A', fontWeight: 700 }}>Transactions</span>
      </div>

      {/* Page Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 850, color: '#0F172A', margin: 0 }}>All Transactions</h1>
        <p style={{ fontSize: '13.5px', color: '#64748B', margin: '6px 0 0 0', fontWeight: 500 }}>
          Monitor all platform transactions, including wallet top-ups and service payments.
        </p>
      </div>

      {/* Logs Table */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        border: '1.5px solid #E2E8F0',
        overflow: 'hidden',
      }}>
        {/* Table Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '180px 2fr 1.5fr 1fr 100px',
          padding: '12px 24px',
          borderBottom: '1.5px solid #E2E8F0',
          backgroundColor: '#F8FAFC',
        }}>
          {['Timestamp', 'Description', 'Citizen ID', 'Amount', 'Status'].map(col => (
            <span key={col} style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{col}</span>
          ))}
        </div>

        {/* Table Body */}
        {loading ? (
          <div style={{ padding: '64px', textAlign: 'center' as const, color: '#64748B', fontSize: '14px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A', marginBottom: '4px' }}>Loading transactions...</div>
          </div>
        ) : transactions.length === 0 ? (
          <div style={{ padding: '64px', textAlign: 'center' as const, color: '#64748B' }}>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>No transactions found</div>
            <div style={{ fontSize: '13px' }}>There are no transactions recorded yet.</div>
          </div>
        ) : (
          transactions.map((txn, idx) => (
            <div
              key={txn._id}
              style={{
                display: 'grid',
                gridTemplateColumns: '180px 2fr 1.5fr 1fr 100px',
                padding: '14px 24px',
                borderBottom: idx < transactions.length - 1 ? '1px solid #F1F5F9' : 'none',
                alignItems: 'center',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <span style={{ fontSize: '12.5px', color: '#475569', fontFamily: 'monospace' }}>{formatTimestamp(txn.createdAt)}</span>
              <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#0F172A' }}>{txn.description}</span>
              <span style={{ fontSize: '12px', color: '#64748B', fontFamily: 'monospace' }}>{txn.citizenId}</span>
              <span style={{ fontSize: '13.5px', fontWeight: 700, color: txn.type === 'credit' ? '#16A34A' : '#475569' }}>
                {txn.type === 'credit' ? '+' : '-'}{formatCurrency(txn.amount)}
              </span>
              <StatusBadge status={txn.status} />
            </div>
          ))
        )}

        {/* Pagination Footer */}
        {!loading && transactions.length > 0 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 24px',
            borderTop: '1.5px solid #E2E8F0',
          }}>
            <span style={{ fontSize: '13px', color: '#64748B' }}>
              Showing {((page - 1) * 15) + 1}–{Math.min(page * 15, total)} of {total.toLocaleString()} transactions
            </span>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <button
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page === 1}
                style={{
                  padding: '6px 14px',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: '7px',
                  backgroundColor: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                  color: page === 1 ? '#94A3B8' : '#374151',
                }}
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                style={{
                  padding: '6px 14px',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: '7px',
                  backgroundColor: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: page === totalPages ? 'not-allowed' : 'pointer',
                  color: page === totalPages ? '#94A3B8' : '#374151',
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
