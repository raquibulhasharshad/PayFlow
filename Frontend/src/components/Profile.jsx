import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, Lock, Key, ShieldCheck, Loader2, X } from 'lucide-react';
import '../styles/profile.css';

const Profile = () => {
  const { user, updateProfile, deactivateAccount, logout } = useAuth();
  const navigate = useNavigate();
  
  // Profile Update Form
  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    mobileNumber: user?.mobileNumber || ''
  });
  const [profileError, setProfileError] = useState('');
  const [profileFieldErrors, setProfileFieldErrors] = useState({});
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Deactivate Modal state
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivateEmail, setDeactivateEmail] = useState('');
  const [deactivatePassword, setDeactivatePassword] = useState('');
  const [deactivateError, setDeactivateError] = useState('');
  const [deactivateLoading, setDeactivateLoading] = useState(false);

  // Password Change Form
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordFieldErrors, setPasswordFieldErrors] = useState({});
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // PIN Change Form
  const [pinData, setPinData] = useState({
    currentPassword: '',
    currentTransactionPin: '',
    newTransactionPin: '',
    confirmNewTransactionPin: ''
  });
  const [pinError, setPinError] = useState('');
  const [pinFieldErrors, setPinFieldErrors] = useState({});
  const [pinSuccess, setPinSuccess] = useState('');
  const [pinLoading, setPinLoading] = useState(false);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileFieldErrors(prev => ({ ...prev, [name]: '' }));
    if (name === 'mobileNumber') {
      setProfileData(prev => ({ ...prev, [name]: value.replace(/\D/g, '') }));
    } else {
      setProfileData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordFieldErrors(prev => ({ ...prev, [name]: '' }));
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handlePinChange = (e) => {
    const { name, value } = e.target;
    setPinFieldErrors(prev => ({ ...prev, [name]: '' }));
    if (name === 'currentTransactionPin' || name === 'newTransactionPin' || name === 'confirmNewTransactionPin') {
      setPinData(prev => ({ ...prev, [name]: value.replace(/\D/g, '') }));
    } else {
      setPinData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const errors = {};
    let isValid = true;

    if (!profileData.fullName.trim()) {
      errors.fullName = 'Full Name is required';
      isValid = false;
    }
    if (!profileData.email.trim()) {
      errors.email = 'Email Address is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(profileData.email)) {
      errors.email = 'Email address is invalid';
      isValid = false;
    }
    if (!profileData.mobileNumber.trim()) {
      errors.mobileNumber = 'Mobile Number is required';
      isValid = false;
    } else if (!/^\d{10}$/.test(profileData.mobileNumber)) {
      errors.mobileNumber = 'Mobile number must be exactly 10 digits';
      isValid = false;
    }

    setProfileFieldErrors(errors);
    if (!isValid) return;

    setProfileError('');
    setProfileSuccess('');
    setProfileLoading(true);

    const result = await updateProfile({
      fullName: profileData.fullName.trim(),
      email: profileData.email.trim(),
      mobileNumber: profileData.mobileNumber.trim()
    });

    setProfileLoading(false);
    if (result.success) {
      setProfileSuccess('Profile details updated successfully!');
    } else {
      const err = result.error || '';
      if (err.toLowerCase().includes('email')) {
        setProfileFieldErrors(prev => ({ ...prev, email: err }));
      } else if (err.toLowerCase().includes('mobile') || err.toLowerCase().includes('phone')) {
        setProfileFieldErrors(prev => ({ ...prev, mobileNumber: err }));
      } else {
        setProfileError(err);
      }
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    const errors = {};
    let isValid = true;

    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current Password is required';
      isValid = false;
    }
    if (!passwordData.newPassword) {
      errors.newPassword = 'New Password is required';
      isValid = false;
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
      isValid = false;
    }
    if (!passwordData.confirmNewPassword) {
      errors.confirmNewPassword = 'Confirm Password is required';
      isValid = false;
    } else if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      errors.confirmNewPassword = 'Passwords do not match';
      isValid = false;
    }

    setPasswordFieldErrors(errors);
    if (!isValid) return;

    setPasswordError('');
    setPasswordSuccess('');
    setPasswordLoading(true);

    const result = await updateProfile({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
      confirmNewPassword: passwordData.confirmNewPassword
    });

    setPasswordLoading(false);
    if (result.success) {
      setPasswordSuccess('Password updated successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } else {
      setPasswordError(result.error);
    }
  };

  const handleUpdatePin = async (e) => {
    e.preventDefault();
    const errors = {};
    let isValid = true;

    if (!pinData.currentPassword) {
      errors.currentPassword = 'Account Password is required';
      isValid = false;
    }
    if (!pinData.currentTransactionPin) {
      errors.currentTransactionPin = 'Current PIN is required';
      isValid = false;
    }
    if (!pinData.newTransactionPin) {
      errors.newTransactionPin = 'New PIN is required';
      isValid = false;
    } else if (!/^\d{4,6}$/.test(pinData.newTransactionPin)) {
      errors.newTransactionPin = 'New PIN must be 4 to 6 digits';
      isValid = false;
    }
    if (!pinData.confirmNewTransactionPin) {
      errors.confirmNewTransactionPin = 'Confirm New PIN is required';
      isValid = false;
    } else if (pinData.newTransactionPin !== pinData.confirmNewTransactionPin) {
      errors.confirmNewTransactionPin = 'PINs do not match';
      isValid = false;
    }

    setPinFieldErrors(errors);
    if (!isValid) return;

    setPinError('');
    setPinSuccess('');
    setPinLoading(true);

    const result = await updateProfile({
      currentPassword: pinData.currentPassword,
      currentTransactionPin: pinData.currentTransactionPin.trim(),
      newTransactionPin: pinData.newTransactionPin.trim(),
      confirmNewTransactionPin: pinData.confirmNewTransactionPin.trim()
    });

    setPinLoading(false);
    if (result.success) {
      setPinSuccess('Transaction PIN updated successfully!');
      setPinData({ currentPassword: '', currentTransactionPin: '', newTransactionPin: '', confirmNewTransactionPin: '' });
    } else {
      setPinError(result.error);
    }
  };

  const handleDeactivateSubmit = async (e) => {
    e.preventDefault();
    if (!deactivatePassword) {
      setDeactivateError('Account password is required.');
      return;
    }
    setDeactivateError('');
    setDeactivateLoading(true);

    const result = await deactivateAccount(user?.email, deactivatePassword);
    setDeactivateLoading(false);

    if (result.success) {
      setShowDeactivateModal(false);
      logout();
      navigate('/login');
    } else {
      setDeactivateError(result.error);
    }
  };

  return (
    <div className="main-content">
      {/* Profile Page Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-title)' }}>Profile Settings</h1>
        <p style={{ color: 'var(--text-muted)' }}>Manage your personal details, credentials, and wallet PIN security.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }} className="profile-grid">
        {/* Left Column: Personal Information */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-title)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <User style={{ color: 'var(--color-primary)', width: '1.25rem', height: '1.25rem' }} />
            Personal Details
          </h3>

          {profileSuccess && <div className="alert alert-success" style={{ padding: '0.75rem' }}>{profileSuccess}</div>}
          {profileError && <div className="alert alert-danger" style={{ padding: '0.75rem' }}>{profileError}</div>}

          <form onSubmit={handleUpdateProfile}>
            <div className="form-group">
              <label className="form-label">Username (Read-Only)</label>
              <div className="form-control-icon-wrapper">
                <input
                  type="text"
                  className="form-control"
                  value={user?.username || ''}
                  disabled
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                />
                <User className="form-icon" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div className="form-control-icon-wrapper">
                <input
                  type="text"
                  name="fullName"
                  className="form-control"
                  placeholder="John Doe"
                  value={profileData.fullName}
                  onChange={handleProfileChange}
                  disabled={profileLoading}
                />
                <User className="form-icon" />
              </div>
              {profileFieldErrors.fullName && (
                <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block', textAlign: 'left' }}>
                  {profileFieldErrors.fullName}
                </span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="form-control-icon-wrapper">
                <input
                  type="email"
                  name="email"
                  className="form-control"
                  placeholder="john@example.com"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  disabled={profileLoading}
                />
                <Mail className="form-icon" />
              </div>
              {profileFieldErrors.email && (
                <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block', textAlign: 'left' }}>
                  {profileFieldErrors.email}
                </span>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Mobile Number</label>
              <div className="form-control-icon-wrapper">
                <input
                  type="text"
                  name="mobileNumber"
                  maxLength="10"
                  className="form-control"
                  placeholder="10-digit number"
                  value={profileData.mobileNumber}
                  onChange={handleProfileChange}
                  disabled={profileLoading}
                />
                <Phone className="form-icon" />
              </div>
              {profileFieldErrors.mobileNumber && (
                <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block', textAlign: 'left' }}>
                  {profileFieldErrors.mobileNumber}
                </span>
              )}
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={profileLoading}>
              {profileLoading ? (
                <>
                  <Loader2 className="animate-spin" style={{ width: '1.25rem', height: '1.25rem', animation: 'spin 1s linear infinite' }} />
                  Saving Details...
                </>
              ) : (
                'Save Profile Changes'
              )}
            </button>

            <button 
              type="button" 
              onClick={() => {
                setDeactivateEmail(user?.email || '');
                setShowDeactivateModal(true);
              }} 
              className="btn" 
              style={{ 
                width: '100%', 
                marginTop: '0.75rem', 
                background: 'rgba(244, 63, 94, 0.1)', 
                color: 'var(--danger)', 
                border: '1px solid rgba(244, 63, 94, 0.3)' 
              }}
            >
              Deactivate Account
            </button>
          </form>
        </div>

        {/* Right Column: Credential Management */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Card 1: Change Account Password */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-title)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Lock style={{ color: 'var(--color-secondary)', width: '1.25rem', height: '1.25rem' }} />
              Change Password
            </h3>

            {passwordSuccess && <div className="alert alert-success" style={{ padding: '0.75rem' }}>{passwordSuccess}</div>}
            {passwordError && <div className="alert alert-danger" style={{ padding: '0.75rem' }}>{passwordError}</div>}

            <form onSubmit={handleUpdatePassword}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <div className="form-control-icon-wrapper">
                  <input
                    type="password"
                    name="currentPassword"
                    className="form-control"
                    placeholder="Enter current password"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    disabled={passwordLoading}
                  />
                  <Lock className="form-icon" />
                </div>
                {passwordFieldErrors.currentPassword && (
                  <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block', textAlign: 'left' }}>
                    {passwordFieldErrors.currentPassword}
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="sub-grid">
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    className="form-control"
                    placeholder="Min 8 chars"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    disabled={passwordLoading}
                  />
                  {passwordFieldErrors.newPassword && (
                    <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block', textAlign: 'left' }}>
                      {passwordFieldErrors.newPassword}
                    </span>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <input
                    type="password"
                    name="confirmNewPassword"
                    className="form-control"
                    placeholder="Confirm new password"
                    value={passwordData.confirmNewPassword}
                    onChange={handlePasswordChange}
                    disabled={passwordLoading}
                  />
                  {passwordFieldErrors.confirmNewPassword && (
                    <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block', textAlign: 'left' }}>
                      {passwordFieldErrors.confirmNewPassword}
                    </span>
                  )}
                </div>
              </div>

              <button type="submit" className="btn btn-secondary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={passwordLoading}>
                {passwordLoading ? 'Updating Password...' : 'Change Password'}
              </button>
            </form>
          </div>

          {/* Card 2: Change Transaction PIN */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.2rem', fontFamily: 'var(--font-title)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Key style={{ color: 'var(--warning)', width: '1.25rem', height: '1.25rem' }} />
              Reset Wallet PIN
            </h3>

            {pinSuccess && <div className="alert alert-success" style={{ padding: '0.75rem' }}>{pinSuccess}</div>}
            {pinError && <div className="alert alert-danger" style={{ padding: '0.75rem' }}>{pinError}</div>}

            <form onSubmit={handleUpdatePin}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="sub-grid">
                <div className="form-group">
                  <label className="form-label">Account Password</label>
                  <div className="form-control-icon-wrapper">
                    <input
                      type="password"
                      name="currentPassword"
                      className="form-control"
                      placeholder="Account Password"
                      value={pinData.currentPassword}
                      onChange={handlePinChange}
                      disabled={pinLoading}
                    />
                    <Lock className="form-icon" />
                  </div>
                  {pinFieldErrors.currentPassword && (
                    <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block', textAlign: 'left' }}>
                      {pinFieldErrors.currentPassword}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Current PIN</label>
                  <div className="form-control-icon-wrapper">
                    <input
                      type="password"
                      name="currentTransactionPin"
                      maxLength="6"
                      placeholder="Current transaction PIN"
                      className="form-control"
                      value={pinData.currentTransactionPin}
                      onChange={handlePinChange}
                      disabled={pinLoading}
                    />
                    <Key className="form-icon" />
                  </div>
                  {pinFieldErrors.currentTransactionPin && (
                    <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block', textAlign: 'left' }}>
                      {pinFieldErrors.currentTransactionPin}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="sub-grid">
                <div className="form-group">
                  <label className="form-label">New PIN</label>
                  <div className="form-control-icon-wrapper">
                    <input
                      type="password"
                      name="newTransactionPin"
                      maxLength="6"
                      placeholder="4 to 6 digit PIN"
                      className="form-control"
                      value={pinData.newTransactionPin}
                      onChange={handlePinChange}
                      disabled={pinLoading}
                    />
                    <ShieldCheck className="form-icon" />
                  </div>
                  {pinFieldErrors.newTransactionPin && (
                    <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block', textAlign: 'left' }}>
                      {pinFieldErrors.newTransactionPin}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm New PIN</label>
                  <div className="form-control-icon-wrapper">
                    <input
                      type="password"
                      name="confirmNewTransactionPin"
                      maxLength="6"
                      placeholder="Repeat PIN"
                      className="form-control"
                      value={pinData.confirmNewTransactionPin}
                      onChange={handlePinChange}
                      disabled={pinLoading}
                    />
                    <ShieldCheck className="form-icon" />
                  </div>
                  {pinFieldErrors.confirmNewTransactionPin && (
                    <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block', textAlign: 'left' }}>
                      {pinFieldErrors.confirmNewTransactionPin}
                    </span>
                  )}
                </div>
              </div>

              <button type="submit" className="btn btn-secondary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={pinLoading}>
                {pinLoading ? 'Updating PIN...' : 'Reset Wallet PIN'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Deactivate Account Confirmation Modal */}
      {showDeactivateModal && (
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
          <div className="glass-card" style={{ width: '100%', maxWidth: '440px', position: 'relative' }}>
            <button
              onClick={() => setShowDeactivateModal(false)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X style={{ width: '1.25rem', height: '1.25rem' }} />
            </button>

            <h2 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-title)', marginBottom: '0.5rem', textAlign: 'center', color: 'var(--danger)' }}>
              Deactivate Account
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem', textAlign: 'center' }}>
              Deactivating your account will hide your profile from recipient searches. Your transaction history will remain intact.
            </p>

            {deactivateError && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{deactivateError}</div>}

            <form onSubmit={handleDeactivateSubmit}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Email Address (Read-Only)</label>
                <div className="form-control-icon-wrapper">
                  <input
                    type="email"
                    className="form-control"
                    value={user?.email || ''}
                    disabled
                    style={{ opacity: 0.6, cursor: 'not-allowed' }}
                  />
                  <Mail className="form-icon" />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Account Password</label>
                <div className="form-control-icon-wrapper">
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Enter account password"
                    value={deactivatePassword}
                    onChange={(e) => setDeactivatePassword(e.target.value)}
                    disabled={deactivateLoading}
                  />
                  <Lock className="form-icon" />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowDeactivateModal(false)} className="btn btn-secondary" style={{ flex: 1 }} disabled={deactivateLoading}>
                  Cancel
                </button>
                <button type="submit" className="btn" style={{ flex: 1, background: 'var(--danger)', color: 'white' }} disabled={deactivateLoading}>
                  {deactivateLoading ? <Loader2 className="animate-spin" style={{ width: '1.2rem', height: '1.2rem' }} /> : 'Confirm Deactivate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
