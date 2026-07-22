import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Mail, Phone, Key, ShieldCheck, CreditCard, Loader2 } from 'lucide-react';
import ReactivateModal from './ReactivateModal';
import '../styles/auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    mobileNumber: '',
    password: '',
    confirmPassword: '',
    transactionPin: '',
    confirmPin: ''
  });
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isDeactivated, setIsDeactivated] = useState(false);
  const [showReactivateModal, setShowReactivateModal] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Clear error for this field
    setErrors(prev => ({ ...prev, [name]: '' }));
    
    // Allow numeric only fields for PIN and Mobile
    if (name === 'mobileNumber' || name === 'transactionPin' || name === 'confirmPin') {
      const cleanVal = value.replace(/\D/g, '');
      setFormData(prev => ({ ...prev, [name]: cleanVal }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const validateForm = () => {
    const tempErrors = {};
    let isValid = true;

    if (!formData.username.trim()) {
      tempErrors.username = 'Username is required';
      isValid = false;
    }
    if (!formData.fullName.trim()) {
      tempErrors.fullName = 'Full Name is required';
      isValid = false;
    }
    if (!formData.email.trim()) {
      tempErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      tempErrors.email = 'Email address is invalid';
      isValid = false;
    }
    if (!formData.mobileNumber.trim()) {
      tempErrors.mobileNumber = 'Mobile Number is required';
      isValid = false;
    } else if (!/^\d{10}$/.test(formData.mobileNumber)) {
      tempErrors.mobileNumber = 'Mobile number must be exactly 10 digits';
      isValid = false;
    }
    if (!formData.password) {
      tempErrors.password = 'Password is required';
      isValid = false;
    } else if (formData.password.length < 8) {
      tempErrors.password = 'Password must be at least 8 characters';
      isValid = false;
    }
    if (!formData.confirmPassword) {
      tempErrors.confirmPassword = 'Confirm Password is required';
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      tempErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }
    if (!formData.transactionPin.trim()) {
      tempErrors.transactionPin = 'Transaction PIN is required';
      isValid = false;
    } else if (!/^\d{4,6}$/.test(formData.transactionPin)) {
      tempErrors.transactionPin = 'Transaction PIN must be 4 to 6 digits';
      isValid = false;
    }
    if (!formData.confirmPin.trim()) {
      tempErrors.confirmPin = 'Confirm PIN is required';
      isValid = false;
    } else if (formData.transactionPin !== formData.confirmPin) {
      tempErrors.confirmPin = 'Transaction PINs do not match';
      isValid = false;
    }

    setErrors(tempErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setError('');
    setLoading(true);

    const submissionData = {
      username: formData.username.trim(),
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      mobileNumber: formData.mobileNumber.trim(),
      password: formData.password,
      transactionPin: formData.transactionPin.trim()
    };

    const result = await register(submissionData);
    setLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      const err = result.error || '';
      if (err.toLowerCase().includes('deactivated')) {
        setIsDeactivated(true);
        setError(err);
      } else if (err.toLowerCase().includes('username')) {
        setErrors(prev => ({ ...prev, username: err }));
      } else if (err.toLowerCase().includes('email')) {
        setErrors(prev => ({ ...prev, email: err }));
      } else if (err.toLowerCase().includes('mobile') || err.toLowerCase().includes('phone')) {
        setErrors(prev => ({ ...prev, mobileNumber: err }));
      } else {
        setError(err);
      }
    }
  };

  return (
    <div className="auth-wrapper" style={{ padding: '2rem 1rem' }}>
      <div className="auth-container" style={{ maxWidth: '580px' }}>
        <div className="auth-header">
          <div className="auth-logo">
            <CreditCard className="form-icon" style={{ position: 'static', transform: 'none', color: 'var(--color-primary)', width: '2.5rem', height: '2.5rem' }} />
            <span>PayFlow</span>
          </div>
          <p className="auth-subtitle">Create a secure account to start transferring funds</p>
        </div>

        <div className="glass-card">
          <h2 style={{ marginBottom: '1.5rem', textAlign: 'center', fontFamily: 'var(--font-title)' }}>Register Account</h2>
          
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="responsive-grid">
              <div className="form-group">
                <label className="form-label">Username</label>
                <div className="form-control-icon-wrapper">
                  <input
                    type="text"
                    name="username"
                    className="form-control"
                    placeholder="johndoe"
                    value={formData.username}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <User className="form-icon" />
                </div>
                {errors.username && (
                  <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block', textAlign: 'left' }}>
                    {errors.username}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div className="form-control-icon-wrapper">
                  <input
                    type="text"
                    name="fullName"
                    className="form-control"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <User className="form-icon" />
                </div>
                {errors.fullName && (
                  <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block', textAlign: 'left' }}>
                    {errors.fullName}
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="responsive-grid">
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div className="form-control-icon-wrapper">
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <Mail className="form-icon" />
                </div>
                {errors.email && (
                  <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block', textAlign: 'left' }}>
                    {errors.email}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Mobile Number</label>
                <div className="form-control-icon-wrapper">
                  <input
                    type="text"
                    name="mobileNumber"
                    maxLength="10"
                    className="form-control"
                    placeholder="10-digit number"
                    value={formData.mobileNumber}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <Phone className="form-icon" />
                </div>
                {errors.mobileNumber && (
                  <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block', textAlign: 'left' }}>
                    {errors.mobileNumber}
                  </span>
                )}
              </div>
            </div>

            <hr style={{ border: '0', borderTop: '1px solid var(--border-glass)', margin: '1rem 0 1.5rem 0' }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="responsive-grid">
              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="form-control-icon-wrapper">
                  <input
                    type="password"
                    name="password"
                    className="form-control"
                    placeholder="Min 8 characters"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <Lock className="form-icon" />
                </div>
                {errors.password && (
                  <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block', textAlign: 'left' }}>
                    {errors.password}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <div className="form-control-icon-wrapper">
                  <input
                    type="password"
                    name="confirmPassword"
                    className="form-control"
                    placeholder="Repeat password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <Lock className="form-icon" />
                </div>
                {errors.confirmPassword && (
                  <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block', textAlign: 'left' }}>
                    {errors.confirmPassword}
                  </span>
                )}
              </div>
            </div>

            <hr style={{ border: '0', borderTop: '1px solid var(--border-glass)', margin: '1.2rem 0 1.5rem 0' }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }} className="responsive-grid">
              <div className="form-group">
                <label className="form-label">Transaction PIN</label>
                <div className="form-control-icon-wrapper">
                  <input
                    type="password"
                    name="transactionPin"
                    maxLength="6"
                    placeholder="4 to 6 digit PIN"
                    className="form-control"
                    value={formData.transactionPin}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <Key className="form-icon" />
                </div>
                {errors.transactionPin && (
                  <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block', textAlign: 'left' }}>
                    {errors.transactionPin}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Confirm PIN</label>
                <div className="form-control-icon-wrapper">
                  <input
                    type="password"
                    name="confirmPin"
                    maxLength="6"
                    placeholder="Repeat PIN"
                    className="form-control"
                    value={formData.confirmPin}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <ShieldCheck className="form-icon" />
                </div>
                {errors.confirmPin && (
                  <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block', textAlign: 'left' }}>
                    {errors.confirmPin}
                  </span>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem' }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" style={{ width: '1.2rem', height: '1.2rem', animation: 'spin 1s linear infinite' }} />
                  Creating Account...
                </>
              ) : (
                'Register & Open Wallet'
              )}
            </button>
          </form>
        </div>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Sign In
            </Link>
          </p>
        </div>
      </div>

      <ReactivateModal 
        isOpen={showReactivateModal} 
        onClose={() => setShowReactivateModal(false)} 
        initialEmail={formData.email} 
      />
    </div>
  );
};

export default Register;
