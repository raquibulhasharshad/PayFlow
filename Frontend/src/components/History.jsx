import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ArrowUpRight, ArrowDownLeft, Clock, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const History = () => {
  const { user, fetchWithAuth } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);

  const fetchTransactions = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await fetchWithAuth('/api/transactions');
      if (res.ok) {
        const data = await res.json();
        // Sort transactions by date (newest first)
        const sorted = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setTransactions(sorted);
      }
    } catch (e) {
      console.error("Failed to load transaction history", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(val || 0);
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return `${day}/${month}/${year}, ${time}`;
  };

  if (loading) {
    return (
      <div className="main-content" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="skeleton" style={{ width: '250px', height: '2.5rem' }}></div>
          <div className="skeleton" style={{ width: '40px', height: '2.5rem' }}></div>
        </div>
        <div className="skeleton" style={{ height: '400px', borderRadius: '20px' }}></div>
      </div>
    );
  }

  return (
    <div className="main-content">
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={() => navigate('/')} 
            className="btn btn-secondary" 
            style={{ padding: '0.5rem', minWidth: 'auto', borderRadius: '50%' }}
            title="Back to Dashboard"
          >
            <ArrowLeft style={{ width: '1.2rem', height: '1.2rem' }} />
          </button>
          <div>
            <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-title)' }}>Transaction History</h1>
            <p style={{ color: 'var(--text-muted)' }}>Detailed ledger of all your incoming and outgoing transfers.</p>
          </div>
        </div>
        <button 
          onClick={() => fetchTransactions(true)} 
          className="btn btn-secondary" 
          style={{ padding: '0.6rem', minWidth: '40px' }}
          disabled={refreshing}
          title="Refresh History"
        >
          <RefreshCw className={refreshing ? 'animate-spin' : ''} style={{ width: '1.2rem', height: '1.2rem', animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
        </button>
      </div>

      {/* Main Ledger Card */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-title)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock style={{ width: '1.25rem', height: '1.25rem', color: 'var(--color-primary)' }} />
          All Transactions
        </h3>

        {transactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
            <AlertCircle style={{ width: '3rem', height: '3rem', margin: '0 auto 1rem auto', opacity: '0.3', display: 'block' }} />
            <p>No transaction history recorded yet.</p>
          </div>
        ) : (
          <div className="transaction-list">
            {transactions.map((tx) => {
              const isSelf = tx.fromUsername === tx.toUsername;
              const isDebit = !isSelf && tx.fromUsername === user?.username;
              return (
                <div 
                  key={tx.id} 
                  className="transaction-item"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedTx(tx)}
                  title="Click to view receipt"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div className={`tx-icon ${isSelf ? 'tx-credit' : isDebit ? 'tx-debit' : 'tx-credit'}`}>
                      {isSelf ? <ArrowDownLeft /> : isDebit ? <ArrowUpRight /> : <ArrowDownLeft />}
                    </div>
                    <div>
                      <span className="tx-title">
                        {isSelf ? 'Self Transfer (Add Money)' : isDebit ? `To: @${tx.toUsername}` : `From: @${tx.fromUsername}`}
                      </span>
                      <span className="tx-time">{formatDateTime(tx.createdAt)}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={`tx-amount ${isSelf ? 'amount-credit' : isDebit ? 'amount-debit' : 'amount-credit'}`}>
                      {isSelf ? '+' : isDebit ? '-' : '+'}{formatCurrency(tx.amount)}
                    </span>
                    <span className="tx-status-badge" style={
                      tx.status === 'FAILED' 
                        ? { color: 'var(--danger)', background: 'rgba(244, 63, 94, 0.1)' } 
                        : tx.status === 'PENDING'
                          ? { color: 'var(--warning)', background: 'rgba(245, 158, 11, 0.1)' }
                          : {}
                    }>
                      {tx.status || 'SUCCESS'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Transaction Details Modal */}
      {selectedTx && (
        <div className="modal-overlay" onClick={() => setSelectedTx(null)}>
          <div className="glass-card modal-content" onClick={(e) => e.stopPropagation()} style={{ animation: 'scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)', maxWidth: '420px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-title)' }}>Transaction Receipt</h3>
              <button onClick={() => setSelectedTx(null)} className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', minWidth: 'auto' }}>✕</button>
            </div>
            
            <div className="receipt-container" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Transaction ID</span>
                <span style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>{selectedTx.id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>From</span>
                <span style={{ color: 'var(--text-primary)' }}>@{selectedTx.fromUsername}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>To</span>
                <span style={{ color: 'var(--text-primary)' }}>@{selectedTx.toUsername}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Amount</span>
                <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{formatCurrency(selectedTx.amount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Date & Time</span>
                <span style={{ color: 'var(--text-primary)' }}>{formatDateTime(selectedTx.createdAt)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Status</span>
                <span className="tx-status-badge" style={
                  selectedTx.status === 'FAILED' 
                    ? { color: 'var(--danger)', background: 'rgba(244, 63, 94, 0.1)', margin: 0 } 
                    : selectedTx.status === 'PENDING'
                      ? { color: 'var(--warning)', background: 'rgba(245, 158, 11, 0.1)', margin: 0 }
                      : { margin: 0 }
                }>
                  {selectedTx.status || 'SUCCESS'}
                </span>
              </div>
              {selectedTx.failureReason && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Reason</span>
                  <span style={{ color: 'var(--danger)', fontWeight: '600' }}>{selectedTx.failureReason}</span>
                </div>
              )}
            </div>

            <button onClick={() => setSelectedTx(null)} className="btn btn-primary" style={{ width: '100%' }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;
