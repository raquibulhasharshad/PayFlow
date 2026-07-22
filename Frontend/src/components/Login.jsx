import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Loader2, CreditCard } from 'lucide-react';
import ReactivateModal from './ReactivateModal';
import '../styles/auth.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDeactivated, setIsDeactivated] = useState(false);
  const [showReactivateModal, setShowReactivateModal] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    let hasError = false;

    if (!username.trim()) {
      setUsernameError('Username is required.');
      hasError = true;
    } else {
      setUsernameError('');
    }

    if (!password) {
      setPasswordError('Password is required.');
      hasError = true;
    } else {
      setPasswordError('');
    }

    if (hasError) return;

    setError('');
    setIsDeactivated(false);
    setLoading(true);

    const result = await login(username.trim(), password);
    setLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
      if (result.error && result.error.toLowerCase().includes('deactivated')) {
        setIsDeactivated(true);
      }
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">
            <CreditCard className="form-icon" style={{ position: 'static', transform: 'none', color: 'var(--color-primary)', width: '2.5rem', height: '2.5rem' }} />
            <span>PayFlow</span>
          </div>
          <p className="auth-subtitle">Secure Digital Wallet & Loyalty Portal</p>
        </div>

        <div className="glass-card" style={{ animation: 'slideIn 0.4s ease-out' }}>
          <h2 style={{ marginBottom: '1.5rem', textAlign: 'center', fontFamily: 'var(--font-title)' }}>Sign In</h2>
          
          {error && (
            <div className="alert alert-danger" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left' }}>
              <span>{error}</span>
              {isDeactivated && (
                <button
                  type="button"
                  onClick={() => setShowReactivateModal(true)}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', alignSelf: 'flex-start' }}
                >
                  Reactivate Account Now
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Username or Mobile Number</label>
              <div className="form-control-icon-wrapper">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter username or mobile"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (e.target.value.trim()) setUsernameError('');
                  }}
                  disabled={loading}
                />
                <User className="form-icon" />
              </div>
              {usernameError && (
                <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block', textAlign: 'left' }}>
                  {usernameError}
                </span>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label className="form-label">Password</label>
              <div className="form-control-icon-wrapper">
                <input
                  type="password"
                  className="form-control"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (e.target.value) setPasswordError('');
                  }}
                  disabled={loading}
                />
                <Lock className="form-icon" />
              </div>
              {passwordError && (
                <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block', textAlign: 'left' }}>
                  {passwordError}
                </span>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.85rem' }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" style={{ width: '1.2rem', height: '1.2rem', animation: 'spin 1s linear infinite' }} />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">
              Create one now
            </Link>
          </p>
        </div>
      </div>

      <ReactivateModal 
        isOpen={showReactivateModal} 
        onClose={() => setShowReactivateModal(false)} 
        initialEmail={username.includes('@') ? username : ''} 
      />
    </div>
  );
};

export default Login;
