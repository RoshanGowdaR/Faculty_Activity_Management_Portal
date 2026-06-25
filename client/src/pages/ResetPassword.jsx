import React, { useState } from 'react';
import axios from 'axios';

const ResetPassword = ({ token, navigateToLogin }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post('http://localhost:5000/api/auth/reset-password', {
        token,
        password
      });
      setSuccess(res.data.message);
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card glass-panel">
        <div className="auth-header">
          <h2 className="auth-logo">Set New Password</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Choose a new secure password for your account
          </p>
        </div>

        {error && (
          <div className="badge badge-rejected" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', marginBottom: '20px', display: 'block', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {success && (
          <div className="badge badge-approved" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', marginBottom: '20px', display: 'block', textAlign: 'center' }}>
            {success}
            <div style={{ marginTop: '10px' }}>
              <button className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem' }} onClick={navigateToLogin}>
                Sign In Now
              </button>
            </div>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '10px' }}
              disabled={loading}
            >
              {loading ? 'Updating Password...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.85rem' }}>
          <span 
            style={{ color: 'var(--primary)', cursor: 'pointer' }} 
            onClick={navigateToLogin}
          >
            Back to Sign In
          </span>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
