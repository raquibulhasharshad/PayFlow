import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { 
  Wallet, 
  Award, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  ArrowRight, 
  RefreshCw, 
  Clock, 
  TrendingUp,
  Bell
} from 'lucide-react';
import '../styles/dashboard.css';

const Dashboard = () => {
  const { user, fetchWithAuth, notifications, setNotifications, unreadCount, setUnreadCount } = useAuth();
  const [wallet, setWallet] = useState({ balance: 0.00 });
  const [rewards, setRewards] = useState({ balance: 0 });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Credit Wallet Modal state
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditError, setCreditError] = useState('');
  const [creditLoading, setCreditLoading] = useState(false);

  const fetchData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    
    try {
      // Fetch Wallet Balance
      const walletRes = await fetchWithAuth('/api/wallets/balance');
      if (walletRes.ok) {
        const walletData = await walletRes.json();
        setWallet(walletData);
      }

      // Fetch Rewards Balance
      const rewardsRes = await fetchWithAuth('/api/rewards/balance');
      if (rewardsRes.ok) {
        const rewardsData = await rewardsRes.json();
        setRewards(rewardsData);
      }

      // Fetch Transaction History
      const txRes = await fetchWithAuth('/api/transactions');
      if (txRes.ok) {
        const txData = await txRes.json();
        // Sort transactions by createdAt (newest first)
        const sortedTx = txData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setTransactions(sortedTx.slice(0, 2)); // Get 2 most recent
      }
    } catch (e) {
      console.error("Failed to load dashboard data", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // SSE connection is managed globally in AuthContext

  const handleCreditWallet = async (e) => {
    e.preventDefault();
    const amountNum = parseFloat(creditAmount);
    
    if (isNaN(amountNum) || amountNum <= 0) {
      setCreditError('Please enter a valid credit amount greater than 0.');
      return;
    }

    setCreditError('');
    setCreditLoading(true);

    try {
      const res = await fetchWithAuth(`/api/wallets/credit?amount=${amountNum}`, {
        method: 'POST'
      });

      if (!res.ok) {
        const errorText = await res.text();
        setCreditError(errorText || 'Failed to credit wallet.');
      } else {
        // Successful credit
        const data = await res.json();
        
        // Record deposit transaction in backend
        try {
          const depositRes = await fetchWithAuth(`/api/transactions/deposit?amount=${amountNum}`, {
            method: 'POST'
          });
          if (depositRes.ok) {
            const txData = await depositRes.json();
            setSelectedTx(txData); // Automatically show receipt
          }
        } catch (txErr) {
          console.error("Failed to record deposit transaction", txErr);
        }

        setWallet(prev => ({ ...prev, balance: data.newBalance }));
        setCreditAmount('');
        setShowCreditModal(false);
        // Refresh transactions to display the top-up
        fetchData(true);
      }
    } catch (e) {
      setCreditError('Server connection failed. Could not credit wallet.');
    } finally {
      setCreditLoading(false);
    }
  };

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
          <div className="skeleton" style={{ width: '200px', height: '2.5rem' }}></div>
          <div className="skeleton" style={{ width: '40px', height: '2.5rem' }}></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }} className="dash-grid">
          <div className="skeleton" style={{ height: '240px', borderRadius: '20px' }}></div>
          <div className="skeleton" style={{ height: '240px', borderRadius: '20px' }}></div>
        </div>
        <div className="skeleton" style={{ height: '350px', borderRadius: '20px' }}></div>
      </div>
    );
  }

  return (
    <div className="main-content">
      {/* Top dashboard header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-title)' }}>Welcome, {user?.fullName || 'User'}!</h1>
          <p style={{ color: 'var(--text-muted)' }}>Here is your financial status overview for today.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => {
                setShowNotifications(!showNotifications);
                setUnreadCount(0); // clear unread count on open
              }} 
              className="btn btn-secondary" 
              style={{ padding: '0.6rem', minWidth: '40px', position: 'relative' }}
              title="Notifications"
            >
              <Bell style={{ width: '1.2rem', height: '1.2rem' }} />
              {unreadCount > 0 && (
                <span style={{ 
                  position: 'absolute', 
                  top: '-4px', 
                  right: '-4px', 
                  background: 'var(--danger)', 
                  color: 'white', 
                  borderRadius: '50%', 
                  fontSize: '0.65rem', 
                  padding: '2px 6px', 
                  fontWeight: '700',
                  boxShadow: '0 0 10px rgba(244, 63, 94, 0.5)'
                }}>
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Menu */}
            {showNotifications && (
              <div className="glass-card notification-dropdown" style={{ 
                position: 'absolute', 
                right: 0, 
                top: 'calc(100% + 10px)', 
                width: '320px', 
                maxHeight: '400px', 
                overflowY: 'auto', 
                zIndex: 100, 
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
                border: '1px solid var(--border-glass)',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                animation: 'slideIn 0.2s ease-out'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>
                  <span style={{ fontWeight: '700', fontSize: '0.9rem', fontFamily: 'var(--font-title)' }}>Notifications</span>
                  {notifications.length > 0 && (
                    <button 
                      onClick={() => setNotifications([])} 
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer' }}
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No new notifications
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {notifications.map((n, i) => (
                      <div key={i} style={{ 
                        padding: '0.75rem', 
                        borderRadius: '8px', 
                        background: 'rgba(255,255,255,0.01)', 
                        border: '1px solid var(--border-glass)',
                        fontSize: '0.8rem',
                        lineHeight: '1.4',
                        textAlign: 'left'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                          <span style={{ 
                            fontWeight: '600', 
                            color: n.type === 'SUCCESS' ? 'var(--success)' : n.type === 'ERROR' ? 'var(--danger)' : n.type === 'REWARD' ? 'var(--warning)' : 'var(--text-primary)' 
                          }}>
                            {n.title}
                          </span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                            {new Date(parseInt(n.timestamp)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p style={{ color: 'var(--text-muted)', margin: 0 }}>{n.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <button 
            onClick={() => fetchData(true)} 
            className="btn btn-secondary" 
            style={{ padding: '0.6rem', minWidth: '40px' }}
            disabled={refreshing}
            title="Refresh dashboard"
          >
            <RefreshCw className={refreshing ? 'animate-spin' : ''} style={{ width: '1.2rem', height: '1.2rem', animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      {/* Main card grid widgets */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '2rem' }} className="dash-grid">
        {/* Wallet Balance widget */}
        <div className="glass-card balance-card-glow" style={{ position: 'relative', overflow: 'hidden', minHeight: '220px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ position: 'relative', zIndex: '2' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span className="card-lbl">Available Balance</span>
              <div className="card-badge-container">
                <Wallet style={{ color: 'var(--color-primary)', width: '1.35rem', height: '1.35rem' }} />
              </div>
            </div>
            <h2 style={{ fontSize: '3rem', fontWeight: '800', fontFamily: 'var(--font-title)', letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #fff 0%, #cbd5e1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {formatCurrency(wallet.balance)}
            </h2>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', position: 'relative', zIndex: '2' }} className="button-group">
            <button onClick={() => setShowCreditModal(true)} className="btn btn-primary" style={{ flex: '1' }}>
              <Plus style={{ width: '1.2rem', height: '1.2rem' }} /> Add Money
            </button>
            <Link to="/transfer" className="btn btn-secondary" style={{ flex: '1', display: 'inline-flex' }}>
              <ArrowRight style={{ width: '1.2rem', height: '1.2rem' }} /> Send Money
            </Link>
          </div>

          {/* Decorative glowing background gradients for card */}
          <div style={{ position: 'absolute', right: '-10%', bottom: '-20%', width: '180px', height: '180px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139, 92, 246, 0.25) 0%, rgba(0,0,0,0) 70%)', zIndex: '1' }}></div>
        </div>

        {/* Loyalty/Rewards Balance widget */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
              <span className="card-lbl">Loyalty Rewards</span>
              <div className="card-badge-container" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
                <Award style={{ color: 'var(--warning)', width: '1.35rem', height: '1.35rem' }} />
              </div>
            </div>
            
            <h2 style={{ fontSize: '2.5rem', fontWeight: '800', fontFamily: 'var(--font-title)', color: 'var(--warning)' }}>
              {rewards.balance || 0}
            </h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Points Earned</span>
          </div>

          <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-glass)', paddingTop: '1rem' }}>
            <Link to="/rewards" className="rewards-link" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--color-secondary)', fontWeight: '600' }}>
              <span>View Rewards Tiers</span>
              <ArrowRight style={{ width: '1rem', height: '1rem' }} />
            </Link>
          </div>

          {/* Decorative background glow */}
          <div style={{ position: 'absolute', right: '-10%', bottom: '-20%', width: '120px', height: '120px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, rgba(0,0,0,0) 70%)', zIndex: '1' }}></div>
        </div>
      </div>

      {/* Recent transactions sub-table list */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-title)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock style={{ width: '1.25rem', height: '1.25rem', color: 'var(--color-primary)' }} />
            Recent Activity
          </h3>
          <Link to="/history" className="rewards-link" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            View Full History
          </Link>
        </div>

        {transactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <TrendingUp style={{ width: '2.5rem', height: '2.5rem', margin: '0 auto 1rem auto', opacity: '0.3', display: 'block' }} />
            <p>No transaction activity found. Initiate your first transfer to see records here!</p>
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
                        {isSelf ? 'Self Transfer (Add Money)' : isDebit ? `To: ${tx.toUsername}` : `From: ${tx.fromUsername}`}
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

      {/* Transaction Receipt Modal */}
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

      {/* Credit Wallet popup glass modal */}
      {showCreditModal && (
        <div className="modal-overlay">
          <div className="glass-card modal-content" style={{ animation: 'slideIn 0.3s ease-out', maxWidth: '420px', width: '100%' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontFamily: 'var(--font-title)' }}>Add Funds to Wallet</h3>
            
            {creditError && (
              <div className="alert alert-danger" style={{ padding: '0.75rem', marginBottom: '1rem' }}>
                <span>{creditError}</span>
              </div>
            )}

            <form onSubmit={handleCreditWallet}>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Top-Up Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="Enter amount (e.g. 50.00)"
                  className="form-control"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  disabled={creditLoading}
                  required
                  autoFocus
                />
              </div>

              {/* Predefined quick select amounts */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {[100, 500, 1000, 2000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    className="btn btn-secondary"
                    style={{ flex: '1', padding: '0.5rem', fontSize: '0.85rem' }}
                    onClick={() => setCreditAmount(amt.toString())}
                    disabled={creditLoading}
                  >
                    +₹{amt}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowCreditModal(false);
                    setCreditAmount('');
                    setCreditError('');
                  }} 
                  className="btn btn-secondary" 
                  style={{ flex: '1' }}
                  disabled={creditLoading}
                >
                  Cancel
                </button>
                
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: '1' }}
                  disabled={creditLoading}
                >
                  {creditLoading ? 'Crediting...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
