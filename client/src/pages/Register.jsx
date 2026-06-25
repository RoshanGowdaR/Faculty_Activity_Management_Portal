import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Register = ({ navigateToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [deptsRes, desigsRes] = await Promise.all([
          axios.get('http://localhost:5000/api/master/departments'),
          axios.get('http://localhost:5000/api/master/designations')
        ]);
        setDepartments(deptsRes.data);
        setDesignations(desigsRes.data);
        if (deptsRes.data.length > 0) setDepartment(deptsRes.data[0].name);
        if (desigsRes.data.length > 0) setDesignation(desigsRes.data[0].name);
      } catch (err) {
        console.error('Error fetching registration options:', err);
      }
    };
    fetchMasterData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!department || !designation) {
      setError('Please select a department and designation.');
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post('http://localhost:5000/api/auth/register', {
        name,
        email,
        password,
        employee_id: employeeId,
        department,
        designation
      });
      setSuccess(res.data.message);
      // clear inputs
      setName('');
      setEmail('');
      setPassword('');
      setEmployeeId('');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" style={{ paddingTop: '50px', paddingBottom: '50px' }}>
      <div className="auth-card glass-panel" style={{ maxWidth: '560px' }}>
        <div className="auth-header">
          <h2 className="auth-logo">Faculty Registration</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Submit your details for administrator verification
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
                Go to Sign In
              </button>
            </div>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="Dr. John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">College Email ID</label>
              <input
                type="email"
                className="form-input"
                placeholder="john.doe@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Employee ID</label>
              <input
                type="text"
                className="form-input"
                placeholder="EMP12345"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Department</label>
                <select 
                  className="form-select"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  required
                >
                  {departments.length === 0 ? (
                    <option value="">No departments available</option>
                  ) : (
                    departments.map(d => (
                      <option key={d._id} value={d.name}>{d.name}</option>
                    ))
                  )}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Designation</label>
                <select
                  className="form-select"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  required
                >
                  {designations.length === 0 ? (
                    <option value="">No designations available</option>
                  ) : (
                    designations.map(d => (
                      <option key={d._id} value={d.name}>{d.name}</option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Create secure password"
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
              {loading ? 'Submitting registration...' : 'Register'}
            </button>
          </form>
        )}

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <strong 
              style={{ color: 'var(--primary)', cursor: 'pointer' }} 
              onClick={navigateToLogin}
            >
              Sign In
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
};

export default Register;
