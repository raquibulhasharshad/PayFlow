import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Key, X, Loader2, CheckCircle2 } from 'lucide-react';

const ReactivateModal = ({ isOpen, onClose, initialEmail = '', onReactivated }) => {
  const { reactivateAccount, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [transactionPin, setTransactionPin] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    let hasErr = false;
    const temp = {};
    if (!email.trim()) { temp.email = 'Email Address is required'; hasErr = true; }
    if (!password) { temp.password = 'Account Password is required'; hasErr = true; }
    if (!transactionPin.trim()) { temp.transactionPin = 'Transaction PIN is required'; hasErr = true; }
    
    setFieldErrors(temp);
    if (hasErr) return;

    setError('');
    setSuccess('');
    setLoading(true);

    const result = await reactivateAccount(email.trim(), password, transactionPin.trim());

    if (result.success) {
      setSuccess('Account reactivated! Logging you in...');
      const loginResult = await login(email.trim(), password);
      setLoading(false);
      if (loginResult.success) {
        setSuccess('');
        setPassword('');
        setTransactionPin('');
        setFieldErrors({});
        if (onReactivated) onReactivated();
        onClose();
        navigate('/');
      } else {
        setError('Account reactivated, but auto-login failed. Please sign in manually.');
      }
    } else {
      setLoading(false);
      const errStr = result.error || '';
      if (errStr.toLowerCase().includes('email')) {
        setFieldErrors(prev => ({ ...prev, email: errStr }));
      } else if (errStr.toLowerCase().includes('password')) {
        setFieldErrors(prev => ({ ...prev, password: errStr }));
      } else if (errStr.toLowerCase().includes('pin')) {
        setFieldErrors(prev => ({ ...prev, transactionPin: errStr }));
      } else {
        setError(errStr);
      }
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '440px', position: 'relative', animation: 'fadeIn 0.2s ease-out' }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X style={{ width: '1.25rem', height: '1.25rem' }} />
        </button>

        <h2 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-title)', marginBottom: '0.5rem', textAlign: 'center' }}>
          Reactivate Account
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem', textAlign: 'center' }}>
          Enter your registered email, password, and transaction PIN to reactivate your PayFlow account.
        </p>

        {error && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{error}</div>}
        {success && (
          <div className="alert alert-success" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 style={{ width: '1.2rem', height: '1.2rem' }} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Email Address</label>
            <div className="form-control-icon-wrapper">
              <input
                type="email"
                className="form-control"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setFieldErrors(prev => ({ ...prev, email: '' }));
                }}
                disabled={loading}
              />
              <Mail className="form-icon" />
            </div>
            {fieldErrors.email && (
              <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block', textAlign: 'left' }}>
                {fieldErrors.email}
              </span>
            )}
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Account Password</label>
            <div className="form-control-icon-wrapper">
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setFieldErrors(prev => ({ ...prev, password: '' }));
                }}
                disabled={loading}
              />
              <Lock className="form-icon" />
            </div>
            {fieldErrors.password && (
              <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block', textAlign: 'left' }}>
                {fieldErrors.password}
              </span>
            )}
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Transaction PIN</label>
            <div className="form-control-icon-wrapper">
              <input
                type="password"
                maxLength="6"
                className="form-control"
                placeholder="4 to 6 digit PIN"
                value={transactionPin}
                onChange={(e) => {
                  setTransactionPin(e.target.value.replace(/\D/g, ''));
                  setFieldErrors(prev => ({ ...prev, transactionPin: '' }));
                }}
                disabled={loading}
              />
              <Key className="form-icon" />
            </div>
            {fieldErrors.transactionPin && (
              <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block', textAlign: 'left' }}>
                {fieldErrors.transactionPin}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" style={{ width: '1.2rem', height: '1.2rem' }} /> : 'Reactivate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReactivateModal;
