import React, { useState } from 'react';
import axios from 'axios';

const Login = ({ onLoginSuccess, navigateToRegister, navigateToForgot }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      onLoginSuccess(res.data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card glass-panel">
        <div className="auth-header">
          <h2 className="auth-logo">Faculty Portal</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Sign in to manage academic and professional submissions
          </p>
        </div>

        {error && (
          <div className="badge badge-rejected" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', marginBottom: '20px', display: 'block', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">College Email ID</label>
            <input
              type="email"
              className="form-input"
              placeholder="name@college.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '10px' }}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
          <span 
            style={{ color: 'var(--primary)', cursor: 'pointer' }} 
            onClick={navigateToForgot}
          >
            Forgot Password?
          </span>
          <span style={{ color: 'var(--text-muted)' }}>
            New?{' '}
            <strong 
              style={{ color: 'var(--primary)', cursor: 'pointer' }} 
              onClick={navigateToRegister}
            >
              Register Here
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
};

export default Login;
