import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  User, 
  Send, 
  ShieldCheck, 
  IndianRupee, 
  CheckCircle, 
  XCircle, 
  ArrowLeft, 
  Wallet,
  Loader2,
  RefreshCw
} from 'lucide-react';
import '../styles/transfer.css';

const Transfer = () => {
  const { user, fetchWithAuth } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0.00);

  // Search recipient states
  const [searchBy, setSearchBy] = useState('fullName');
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchedUser, setSearchedUser] = useState(null);
  const [searchError, setSearchError] = useState('');

  // Transfer states
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Transaction result
  const [successTx, setSuccessTx] = useState(null);

  const fetchBalance = async () => {
    try {
      const res = await fetchWithAuth('/api/wallets/balance');
      if (res.ok) {
        const data = await res.json();
        setBalance(data.balance);
      }
    } catch (e) {
      console.error("Failed to load balance", e);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
  };

  const performSearch = async (query, by) => {
    if (!query) {
      setSearchResults([]);
      setSearchError('');
      return;
    }

    setSearching(true);
    setSearchError('');
    setSearchResults([]);

    try {
      const res = await fetchWithAuth(`/api/auth/users/search?by=${by}&query=${encodeURIComponent(query)}`);
      if (!res.ok) {
        const text = await res.text();
        setSearchError(text || 'Failed to search for user.');
      } else {
        const data = await res.json(); // List of users: [ { id, username, email, fullName, mobileNumber } ]
        
        // Filter out ourselves
        const filtered = data.filter(u => u.username !== user.username);
        
        if (filtered.length === 0) {
          setSearchError('No matching users found.');
        } else {
          setSearchResults(filtered);
        }
      }
    } catch (e) {
      setSearchError('Failed to communicate with authorization service.');
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch(searchQuery.trim(), searchBy);
      } else {
        setSearchResults([]);
        setSearchError('');
      }
    }, 400); // 400ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, searchBy]);

  const handleSelectRecipient = (recipient) => {
    setSearchedUser(recipient);
    setSearchResults([]);
    setSearchQuery('');
    setError('');
  };

  const handleClearRecipient = () => {
    setSearchedUser(null);
    setSearchResults([]);
    setAmount('');
    setPin('');
    setError('');
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    const amtNum = parseFloat(amount);
    
    if (isNaN(amtNum) || amtNum <= 0) {
      setError('Please enter a valid amount greater than zero.');
      return;
    }

    if (amtNum > balance) {
      setError('Insufficient wallet balance.');
      return;
    }

    if (!/^\d{4,6}$/.test(pin)) {
      setError('Transaction PIN must be a 4 to 6 digit number.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const res = await fetchWithAuth('/api/transactions', {
        method: 'POST',
        body: JSON.stringify({
          toUsername: searchedUser.username,
          amount: amtNum,
          transactionPin: pin.trim()
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        setError(errText || 'Transaction failed. Please check your PIN and try again.');
      } else {
        const txResult = await res.json();
        setSuccessTx(txResult);
      }
    } catch (e) {
      setError('Network error. Failed to initiate transfer.');
    } finally {
      setSubmitting(false);
    }
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

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(val || 0);
  };

  // Success Screen View
  if (successTx) {
    return (
      <div className="main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <div className="glass-card success-card" style={{ maxWidth: '480px', width: '100%', textAlign: 'center', animation: 'scaleUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
          <div className="success-icon-wrapper">
            <CheckCircle className="success-icon" />
          </div>
          
          <h2 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-title)', marginBottom: '0.5rem' }}>Transfer Successful</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Your funds have been transferred successfully.</p>
          
          <div className="receipt-container">
            <div className="receipt-row">
              <span className="receipt-lbl">Transaction ID</span>
              <span className="receipt-val" style={{ fontFamily: 'monospace' }}>{successTx.id}</span>
            </div>
            <div className="receipt-row">
              <span className="receipt-lbl">Recipient</span>
              <span className="receipt-val">@{successTx.toUsername}</span>
            </div>
            <div className="receipt-row">
              <span className="receipt-lbl">Amount Transferred</span>
              <span className="receipt-val highlight-amount">{formatCurrency(successTx.amount)}</span>
            </div>
            <div className="receipt-row">
              <span className="receipt-lbl">Timestamp</span>
              <span className="receipt-val">{formatDateTime(successTx.createdAt)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button 
              onClick={() => {
                setSuccessTx(null);
                setSearchedUser(null);
                setSearchQuery('');
                setAmount('');
                setPin('');
                navigate('/');
              }} 
              className="btn btn-secondary" 
              style={{ flex: '1' }}
            >
              Dashboard
            </button>
            <button 
              onClick={() => {
                setSuccessTx(null);
                setSearchedUser(null);
                setSearchQuery('');
                setAmount('');
                setPin('');
                fetchBalance();
              }} 
              className="btn btn-primary" 
              style={{ flex: '1' }}
            >
              New Transfer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-title)' }}>Transfer Funds</h1>
          <p style={{ color: 'var(--text-muted)' }}>Send money instantly to other PayFlow accounts.</p>
        </div>
        
        {/* Wallet Balance Info badge */}
        <div className="balance-info-pill">
          <Wallet className="balance-icon" />
          <div style={{ textAlign: 'right' }}>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Wallet Balance</span>
            <span style={{ fontWeight: '700', fontSize: '1rem' }}>{formatCurrency(balance)}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }} className="transfer-grid">
        {/* Step 1: Search Recipient */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', fontFamily: 'var(--font-title)' }}>1. Find Recipient</h3>
          
          {/* If recipient is already selected, display detail block and clear trigger */}
          {searchedUser ? (
            <div style={{ animation: 'slideIn 0.3s ease-out' }}>
              <div className="searched-user-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div className="user-avatar" style={{ width: '2.5rem', height: '2.5rem', fontSize: '0.85rem', background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)', borderRadius: '50%', color: '#fff', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', fontWeight: '700' }}>
                    {searchedUser.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span style={{ display: 'block', fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.95rem' }}>{searchedUser.fullName}</span>
                    <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>@{searchedUser.username} • {searchedUser.email} • {searchedUser.mobileNumber}</span>
                  </div>
                </div>
                <button type="button" onClick={handleClearRecipient} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                  Change
                </button>
              </div>
            </div>
          ) : (
            <>
              <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Search Criteria</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {['fullName', 'username', 'email', 'mobileNumber'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        className={`btn ${searchBy === type ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ flex: '1', padding: '0.5rem', fontSize: '0.8rem' }}
                        onClick={() => {
                          setSearchBy(type);
                          setSearchQuery('');
                          setSearchResults([]);
                          setSearchError('');
                        }}
                      >
                        {type === 'mobileNumber' ? 'Mobile' : type === 'fullName' ? 'Name' : type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Search Query</label>
                  <div className="form-control-icon-wrapper">
                    <input
                      type="text"
                      className="form-control"
                      placeholder={
                        searchBy === 'username' ? 'e.g. johndoe' :
                        searchBy === 'email' ? 'e.g. john@example.com' :
                        searchBy === 'fullName' ? 'e.g. John Doe' :
                        'e.g. 9876543210'
                      }
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      required
                    />
                    {searching ? (
                      <Loader2 className="form-icon animate-spin" style={{ width: '1.2rem', height: '1.2rem', animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <Search className="form-icon" />
                    )}
                  </div>
                </div>
              </form>

              {searchError && (
                <div className="alert alert-danger" style={{ margin: 0 }}>
                  <XCircle style={{ flexShrink: 0 }} />
                  <span>{searchError}</span>
                </div>
              )}

              {/* Partial Search matches lists */}
              {searchResults.length > 0 && (
                <div style={{ animation: 'slideIn 0.3s ease-out' }}>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Select Recipient</h4>
                  <div className="search-results-list">
                    {searchResults.map((item) => (
                      <div 
                        key={item.id} 
                        className="search-result-item"
                        onClick={() => handleSelectRecipient(item)}
                      >
                        <div className="user-details">
                          <div className="user-avatar">
                            {item.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div className="user-info">
                            <span className="user-name">{item.fullName}</span>
                            <span className="user-meta">@{item.username} • {item.email} • {item.mobileNumber}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Step 2: Payment Parameters */}
        <div className="glass-card" style={{ position: 'relative' }}>
          {!searchedUser && (
            <div className="overlay-lock">
              <p>Search and select a recipient to unlock transfer details.</p>
            </div>
          )}

          <h3 style={{ fontSize: '1.2rem', marginBottom: '1.2rem', fontFamily: 'var(--font-title)' }}>2. Transfer Details</h3>
          
          {error && (
            <div className="alert alert-danger">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleTransfer}>
            <div className="form-group">
              <label className="form-label">Transfer Amount (₹)</label>
              <div className="form-control-icon-wrapper">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  className="form-control"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={submitting || !searchedUser}
                  required
                />
                <IndianRupee className="form-icon" />
              </div>
              {parseFloat(amount) > balance && (
                <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block', textAlign: 'left' }}>
                  Amount not availale in bankaccount
                </span>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label className="form-label">Secure Transaction PIN</label>
              <div className="form-control-icon-wrapper">
                <input
                  type="password"
                  maxLength="6"
                  placeholder="Enter PIN"
                  className="form-control"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  disabled={submitting || !searchedUser}
                  required
                />
                <ShieldCheck className="form-icon" />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '0.85rem' }} 
              disabled={submitting || !searchedUser || !amount || !pin}
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" style={{ width: '1.2rem', height: '1.2rem', animation: 'spin 1s linear infinite' }} />
                  Processing Payment...
                </>
              ) : (
                <>
                  <Send style={{ width: '1.2rem', height: '1.2rem' }} /> Send Funds
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Transfer;
