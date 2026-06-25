import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Settings2, Grid, Award, Layers } from 'lucide-react';

const MasterDataManagement = () => {
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [categories, setCategories] = useState([]);

  // Form states
  const [newDept, setNewDept] = useState('');
  const [newDesig, setNewDesig] = useState('');
  const [newCat, setNewCat] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMasterData();
  }, []);

  const fetchMasterData = async () => {
    try {
      const [deptsRes, desigsRes, catsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/master/departments'),
        axios.get('http://localhost:5000/api/master/designations'),
        axios.get('http://localhost:5000/api/master/categories')
      ]);
      setDepartments(deptsRes.data);
      setDesignations(desigsRes.data);
      setCategories(catsRes.data);
    } catch (err) {
      console.error('Error fetching master settings:', err);
    }
  };

  const handleAddDept = async (e) => {
    e.preventDefault();
    if (!newDept.trim()) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/master/departments', { name: newDept }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewDept('');
      fetchMasterData();
    } catch (err) {
      setError(err.response?.data?.message || 'Error adding department');
    }
  };

  const handleDeleteDept = async (id) => {
    if (!window.confirm('Delete this department? Make sure no lecturers are currently associated with it.')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/master/departments/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchMasterData();
    } catch (err) {
      setError('Error deleting department.');
    }
  };

  const handleAddDesig = async (e) => {
    e.preventDefault();
    if (!newDesig.trim()) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/master/designations', { name: newDesig }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewDesig('');
      fetchMasterData();
    } catch (err) {
      setError(err.response?.data?.message || 'Error adding designation');
    }
  };

  const handleDeleteDesig = async (id) => {
    if (!window.confirm('Delete this designation? Make sure no lecturers are currently associated with it.')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/master/designations/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchMasterData();
    } catch (err) {
      setError('Error deleting designation.');
    }
  };

  const handleAddCat = async (e) => {
    e.preventDefault();
    if (!newCat.trim()) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/master/categories', { name: newCat }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewCat('');
      fetchMasterData();
    } catch (err) {
      setError(err.response?.data?.message || 'Error adding category');
    }
  };

  const handleDeleteCat = async (id) => {
    if (!window.confirm('Delete this activity category? Make sure no submissions are currently associated with it.')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/master/categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchMasterData();
    } catch (err) {
      setError('Error deleting category.');
    }
  };

  return (
    <div className="content-pane">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
        <Settings2 size={24} style={{ color: 'var(--primary)' }} />
        <h2 className="header-title" style={{ fontSize: '1.5rem' }}>Master Configuration Settings</h2>
      </div>

      {error && (
        <div className="badge badge-rejected" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', marginBottom: '24px', display: 'block', textAlign: 'center' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
        
        {/* 1. Departments Card */}
        <div className="glass-panel">
          <div className="card-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={18} style={{ color: 'var(--primary)' }} />
            <h3 className="header-title" style={{ fontSize: '1rem' }}>College Departments</h3>
          </div>
          <div className="card-body" style={{ padding: '20px 24px' }}>
            <form onSubmit={handleAddDept} style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Add Dept e.g. Biotechnology" 
                value={newDept}
                onChange={(e) => setNewDept(e.target.value)}
                required
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '10px 14px' }}>
                <Plus size={16} />
              </button>
            </form>

            <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {departments.map(d => (
                <div key={d._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                  <span style={{ fontSize: '0.9rem' }}>{d.name}</span>
                  <button className="btn btn-secondary" style={{ padding: '6px' }} onClick={() => handleDeleteDept(d._id)}>
                    <Trash2 size={12} style={{ color: 'var(--danger)' }} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Designations Card */}
        <div className="glass-panel">
          <div className="card-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={18} style={{ color: 'var(--primary)' }} />
            <h3 className="header-title" style={{ fontSize: '1rem' }}>Academic Designations</h3>
          </div>
          <div className="card-body" style={{ padding: '20px 24px' }}>
            <form onSubmit={handleAddDesig} style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Add Designation e.g. Dean" 
                value={newDesig}
                onChange={(e) => setNewDesig(e.target.value)}
                required
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '10px 14px' }}>
                <Plus size={16} />
              </button>
            </form>

            <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {designations.map(d => (
                <div key={d._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                  <span style={{ fontSize: '0.9rem' }}>{d.name}</span>
                  <button className="btn btn-secondary" style={{ padding: '6px' }} onClick={() => handleDeleteDesig(d._id)}>
                    <Trash2 size={12} style={{ color: 'var(--danger)' }} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Categories Card */}
        <div className="glass-panel">
          <div className="card-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Grid size={18} style={{ color: 'var(--primary)' }} />
            <h3 className="header-title" style={{ fontSize: '1rem' }}>Submission Categories</h3>
          </div>
          <div className="card-body" style={{ padding: '20px 24px' }}>
            <form onSubmit={handleAddCat} style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Add Category e.g. Books Published" 
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                required
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '10px 14px' }}>
                <Plus size={16} />
              </button>
            </form>

            <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {categories.map(c => (
                <div key={c._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                  <span style={{ fontSize: '0.9rem' }}>{c.name}</span>
                  <button className="btn btn-secondary" style={{ padding: '6px' }} onClick={() => handleDeleteCat(c._id)}>
                    <Trash2 size={12} style={{ color: 'var(--danger)' }} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MasterDataManagement;
