import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EditProfile = ({ user, onProfileUpdate }) => {
  const [name, setName] = useState(user?.name || '');
  const [employeeId, setEmployeeId] = useState(user?.employee_id || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [designation, setDesignation] = useState(user?.designation || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMaster = async () => {
      try {
        const [deptsRes, desigsRes] = await Promise.all([
          axios.get('http://localhost:5000/api/master/departments'),
          axios.get('http://localhost:5000/api/master/designations')
        ]);
        setDepartments(deptsRes.data);
        setDesignations(desigsRes.data);
      } catch (err) {
        console.error('Error fetching profile master:', err);
      }
    };
    fetchMaster();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');

    if (password && password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const payload = { name, employee_id: employeeId, department, designation };
      if (password) {
        payload.password = password;
      }

      const res = await axios.put('http://localhost:5000/api/auth/profile', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess(res.data.message);
      onProfileUpdate(res.data.user);
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content-pane" style={{ maxWidth: '800px' }}>
      <div className="glass-panel">
        <div className="card-header" style={{ padding: '24px 28px', borderBottom: '1px solid var(--border-color)' }}>
          <h2 className="header-title">My Profile Settings</h2>
        </div>
        <div className="card-body">
          {success && <div className="badge badge-approved" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', marginBottom: '20px', display: 'block', textAlign: 'center' }}>{success}</div>}
          {error && <div className="badge badge-rejected" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', marginBottom: '20px', display: 'block', textAlign: 'center' }}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input 
                type="text" 
                className="form-input" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Employee ID</label>
              <input 
                type="text" 
                className="form-input" 
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
                  {departments.map(d => (
                    <option key={d._id} value={d.name}>{d.name}</option>
                  ))}
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
                  {designations.map(d => (
                    <option key={d._id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <h3 style={{ fontSize: '1rem', marginTop: '32px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>Security Settings</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">New Password (leave empty to keep current)</label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
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
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '20px' }} disabled={loading}>
              {loading ? 'Updating Profile...' : 'Save Settings'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
