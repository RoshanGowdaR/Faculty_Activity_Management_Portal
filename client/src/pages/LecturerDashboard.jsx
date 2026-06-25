import React, { useState, useEffect } from 'react';
import axios from 'axios';
import confetti from 'canvas-confetti';
import { Plus, Edit, Trash2, Download, FileText, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import Modal from '../components/Modal';

const LecturerDashboard = ({ user }) => {
  const [submissions, setSubmissions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Filters
  const [filterCategory, setFilterCategory] = useState('');
  const [filterYear, setFilterYear] = useState('');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [currentSubmission, setCurrentSubmission] = useState(null);

  // Form State
  const [formCategory, setFormCategory] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formYear, setFormYear] = useState('');
  const [formFile, setFormFile] = useState(null);
  const [detailFields, setDetailFields] = useState({});
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchSubmissions();
    fetchCategories();
  }, [filterCategory, filterYear]);

  const fetchSubmissions = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = {};
      if (filterCategory) params.category = filterCategory;
      if (filterYear) params.academic_year = filterYear;

      const res = await axios.get('http://localhost:5000/api/submissions', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setSubmissions(res.data);
    } catch (err) {
      console.error('Error fetching submissions:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/master/categories');
      setCategories(res.data);
      if (res.data.length > 0 && !formCategory) {
        setFormCategory(res.data[0].name);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const handleOpenAdd = () => {
    setFormTitle('');
    setFormYear('2025-2026');
    setFormFile(null);
    setDetailFields({});
    setFormError('');
    if (categories.length > 0) {
      setFormCategory(categories[0].name);
    }
    setIsAddOpen(true);
  };

  const handleOpenEdit = (sub) => {
    setCurrentSubmission(sub);
    setFormTitle(sub.title);
    setFormCategory(sub.category);
    setFormYear(sub.academic_year);
    setFormFile(null);
    setDetailFields(sub.detail_fields || {});
    setFormError('');
    setIsEditOpen(true);
  };

  const handleDetailChange = (key, val) => {
    setDetailFields({ ...detailFields, [key]: val });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setFormError('File size exceeds the 5MB limit.');
        return;
      }
      setFormFile(file);
      setFormError('');
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formFile) {
      setFormError('Supporting document file is required.');
      return;
    }

    const formData = new FormData();
    formData.append('category', formCategory);
    formData.append('title', formTitle);
    formData.append('academic_year', formYear);
    formData.append('file', formFile);
    formData.append('detail_fields', JSON.stringify(detailFields));

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/submissions', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 }
      });

      setIsAddOpen(false);
      fetchSubmissions();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create submission');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const formData = new FormData();
    formData.append('category', formCategory);
    formData.append('title', formTitle);
    formData.append('academic_year', formYear);
    if (formFile) {
      formData.append('file', formFile);
    }
    formData.append('detail_fields', JSON.stringify(detailFields));

    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/submissions/${currentSubmission._id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setIsEditOpen(false);
      fetchSubmissions();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to update submission');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this submission?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/submissions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchSubmissions();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete submission');
    }
  };

  // Stats
  const totalSubmissions = submissions.length;
  const verifiedCount = submissions.filter(s => s.status === 'verified').length;
  const pendingCount = submissions.filter(s => s.status === 'pending').length;
  const rejectedCount = submissions.filter(s => s.status === 'rejected').length;

  return (
    <div className="content-pane">
      {/* Stats Summary Grid */}
      <div className="dashboard-grid">
        <div className="stat-card glass-panel">
          <div className="stat-label">Total Submissions</div>
          <div className="stat-value">{totalSubmissions}</div>
        </div>
        <div className="stat-card glass-panel success">
          <div className="stat-label">Verified Records</div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>{verifiedCount}</div>
        </div>
        <div className="stat-card glass-panel warning">
          <div className="stat-label">Pending Reviews</div>
          <div className="stat-value" style={{ color: 'var(--warning)' }}>{pendingCount}</div>
        </div>
        <div className="stat-card glass-panel danger">
          <div className="stat-label">Action Required</div>
          <div className="stat-value" style={{ color: 'var(--danger)' }}>{rejectedCount}</div>
        </div>
      </div>

      {/* Main Panel */}
      <div className="glass-panel">
        <div className="card-header" style={{ padding: '24px 28px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="header-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={20} style={{ color: 'var(--primary)' }} />
            Academic Activity Ledger
          </h2>
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={16} /> Add Submission
          </button>
        </div>

        <div className="card-body">
          {/* Filters */}
          <div className="filter-bar">
            <div className="form-group" style={{ margin: '0' }}>
              <select 
                className="form-select"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map(c => (
                  <option key={c._id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group" style={{ margin: '0' }}>
              <select 
                className="form-select"
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
              >
                <option value="">All Academic Years</option>
                <option value="2025-2026">2025-2026</option>
                <option value="2024-2025">2024-2025</option>
                <option value="2023-2024">2023-2024</option>
              </select>
            </div>
          </div>

          {/* Submissions Table */}
          {submissions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
              No submissions found. Click "Add Submission" to record your academic activities.
            </div>
          ) : (
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Submission Title</th>
                    <th>Category</th>
                    <th>Academic Year</th>
                    <th>Submitted On</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((sub) => (
                    <tr key={sub._id}>
                      <td>
                        <div style={{ fontWeight: '600' }}>{sub.title}</div>
                        {/* Dynamic quick details badges */}
                        <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                          {sub.detail_fields && Object.entries(sub.detail_fields).map(([key, val]) => (
                            val && (
                              <span key={key} style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.04)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                                <strong style={{ textTransform: 'capitalize' }}>{key.replace('_', ' ')}:</strong> {val}
                              </span>
                            )
                          ))}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{sub.category}</span>
                      </td>
                      <td>{sub.academic_year}</td>
                      <td>{new Date(sub.submitted_at).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge badge-${sub.status}`}>
                          {sub.status === 'verified' && <CheckCircle size={10} style={{ marginRight: '4px' }} />}
                          {sub.status === 'pending' && <Clock size={10} style={{ marginRight: '4px' }} />}
                          {sub.status === 'rejected' && <AlertTriangle size={10} style={{ marginRight: '4px' }} />}
                          {sub.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <a 
                            href={sub.file_path ? (sub.file_path.startsWith('http') ? sub.file_path : `http://localhost:5000${sub.file_path}`) : '#'} 
                            target="_blank" 
                            rel="noreferrer"
                            className="btn btn-secondary" 
                            style={{ padding: '8px' }}
                            title="Download Document"
                          >
                            <Download size={14} />
                          </a>

                          {sub.status === 'pending' || sub.status === 'rejected' ? (
                            <>
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '8px' }} 
                                onClick={() => handleOpenEdit(sub)}
                                title="Edit Submission"
                              >
                                <Edit size={14} style={{ color: '#6366f1' }} />
                              </button>
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '8px' }} 
                                onClick={() => handleDelete(sub._id)}
                                title="Delete Submission"
                              >
                                <Trash2 size={14} style={{ color: '#ef4444' }} />
                              </button>
                            </>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: '0 8px' }}>
                              Locked
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Submission Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Record New Academic Activity">
        {formError && <div className="badge badge-rejected" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', display: 'block', textAlign: 'center' }}>{formError}</div>}
        
        <form onSubmit={handleAddSubmit}>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select 
              className="form-select" 
              value={formCategory}
              onChange={(e) => {
                setFormCategory(e.target.value);
                setDetailFields({});
              }}
              required
            >
              {categories.map(c => (
                <option key={c._id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Activity Title</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Title of paper, project name or FDP title"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Academic Year</label>
            <select 
              className="form-select"
              value={formYear}
              onChange={(e) => setFormYear(e.target.value)}
              required
            >
              <option value="2025-2026">2025-2026</option>
              <option value="2024-2025">2024-2025</option>
              <option value="2023-2024">2023-2024</option>
            </select>
          </div>

          {/* Dynamic Detail Fields based on Category */}
          {formCategory === 'Research Paper' && (
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px' }}>Paper Publishing Details</h4>
              <div className="form-group">
                <label className="form-label">Authors (Comma separated)</label>
                <input type="text" className="form-input" placeholder="John Doe, Jane Smith" onChange={(e) => handleDetailChange('authors', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Journal / Conference Name</label>
                <input type="text" className="form-input" placeholder="IEEE Access, Springer..." onChange={(e) => handleDetailChange('journal_name', e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Publication Date</label>
                  <input type="date" className="form-input" onChange={(e) => handleDetailChange('publication_date', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">ISSN / ISBN / DOI</label>
                  <input type="text" className="form-input" placeholder="e.g. 10.1109/XXXX" onChange={(e) => handleDetailChange('indexing_code', e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Indexing Index</label>
                <select className="form-select" onChange={(e) => handleDetailChange('indexing', e.target.value)}>
                  <option value="UGC-CARE">UGC-CARE</option>
                  <option value="Scopus">Scopus</option>
                  <option value="Web of Science">Web of Science</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          )}

          {formCategory === 'Research Conducted' && (
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px' }}>Project Specifications</h4>
              <div className="form-group">
                <label className="form-label">Funding Agency (leave empty if self-funded)</label>
                <input type="text" className="form-input" placeholder="DST, AICTE, VGST..." onChange={(e) => handleDetailChange('funding_agency', e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Duration (e.g., 6 months, 2 years)</label>
                  <input type="text" className="form-input" placeholder="12 Months" onChange={(e) => handleDetailChange('duration', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Your Role</label>
                  <select className="form-select" onChange={(e) => handleDetailChange('role', e.target.value)}>
                    <option value="Principal Investigator">Principal Investigator</option>
                    <option value="Co-Investigator">Co-Investigator</option>
                    <option value="Researcher">Researcher</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Project Status</label>
                <select className="form-select" onChange={(e) => handleDetailChange('status', e.target.value)}>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
          )}

          {formCategory === 'FDP Attended' && (
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px' }}>FDP / Workshop Details</h4>
              <div className="form-group">
                <label className="form-label">Organized By</label>
                <input type="text" className="form-input" placeholder="IIT Bombay, NPTEL..." onChange={(e) => handleDetailChange('organized_by', e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input type="date" className="form-input" onChange={(e) => handleDetailChange('start_date', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input type="date" className="form-input" onChange={(e) => handleDetailChange('end_date', e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Duration (Days)</label>
                <input type="number" className="form-input" placeholder="5" onChange={(e) => handleDetailChange('duration_days', e.target.value)} />
              </div>
            </div>
          )}

          {formCategory === 'FDP Conducted' && (
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px' }}>Conducted FDP Specifications</h4>
              <div className="form-group">
                <label className="form-label">Organized For</label>
                <input type="text" className="form-input" placeholder="Faculty of CSE, External Academicians..." onChange={(e) => handleDetailChange('organized_for', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Your Role</label>
                <select className="form-select" onChange={(e) => handleDetailChange('role', e.target.value)}>
                  <option value="Coordinator">Coordinator</option>
                  <option value="Resource Person / Speaker">Resource Person / Speaker</option>
                  <option value="Convenor">Convenor</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date of Conduct</label>
                <input type="date" className="form-input" onChange={(e) => handleDetailChange('date_conducted', e.target.value)} />
              </div>
            </div>
          )}

          {formCategory === 'Other' && (
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px' }}>General Record Data</h4>
              <div className="form-group">
                <label className="form-label">Category Label (e.g., Patent, Book, Award)</label>
                <input type="text" className="form-input" placeholder="Patent / Guest Lecture" onChange={(e) => handleDetailChange('custom_label', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" rows="3" placeholder="Brief summary of achievement..." onChange={(e) => handleDetailChange('description', e.target.value)}></textarea>
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input type="date" className="form-input" onChange={(e) => handleDetailChange('date', e.target.value)} />
              </div>
            </div>
          )}

          {/* File Upload zone */}
          <div className="form-group">
            <label className="form-label">Supporting Proof Document (PDF, JPG, PNG, DOCX - Max 5MB)</label>
            <input 
              type="file" 
              className="form-input" 
              accept=".pdf,.jpg,.jpeg,.png,.docx"
              onChange={handleFileChange}
              required
            />
            {formFile && <div style={{ fontSize: '0.8rem', color: 'var(--success)', marginTop: '8px' }}>Selected: {formFile.name} ({(formFile.size / 1024 / 1024).toFixed(2)} MB)</div>}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Submit Activity</button>
          </div>
        </form>
      </Modal>

      {/* Edit Submission Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Activity Record">
        {formError && <div className="badge badge-rejected" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', display: 'block', textAlign: 'center' }}>{formError}</div>}
        
        <form onSubmit={handleEditSubmit}>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select 
              className="form-select" 
              value={formCategory}
              disabled
            >
              <option value={formCategory}>{formCategory}</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Activity Title</label>
            <input 
              type="text" 
              className="form-input" 
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Academic Year</label>
            <select 
              className="form-select"
              value={formYear}
              onChange={(e) => setFormYear(e.target.value)}
              required
            >
              <option value="2025-2026">2025-2026</option>
              <option value="2024-2025">2024-2025</option>
              <option value="2023-2024">2023-2024</option>
            </select>
          </div>

          {/* Populate detail fields in edit */}
          {formCategory === 'Research Paper' && (
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px' }}>Paper Publishing Details</h4>
              <div className="form-group">
                <label className="form-label">Authors</label>
                <input type="text" className="form-input" value={detailFields.authors || ''} onChange={(e) => handleDetailChange('authors', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Journal / Conference Name</label>
                <input type="text" className="form-input" value={detailFields.journal_name || ''} onChange={(e) => handleDetailChange('journal_name', e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Publication Date</label>
                  <input type="date" className="form-input" value={detailFields.publication_date || ''} onChange={(e) => handleDetailChange('publication_date', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">ISSN / ISBN / DOI</label>
                  <input type="text" className="form-input" value={detailFields.indexing_code || ''} onChange={(e) => handleDetailChange('indexing_code', e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Indexing Index</label>
                <select className="form-select" value={detailFields.indexing || ''} onChange={(e) => handleDetailChange('indexing', e.target.value)}>
                  <option value="UGC-CARE">UGC-CARE</option>
                  <option value="Scopus">Scopus</option>
                  <option value="Web of Science">Web of Science</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          )}

          {formCategory === 'Research Conducted' && (
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px' }}>Project Specifications</h4>
              <div className="form-group">
                <label className="form-label">Funding Agency</label>
                <input type="text" className="form-input" value={detailFields.funding_agency || ''} onChange={(e) => handleDetailChange('funding_agency', e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Duration</label>
                  <input type="text" className="form-input" value={detailFields.duration || ''} onChange={(e) => handleDetailChange('duration', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Your Role</label>
                  <select className="form-select" value={detailFields.role || ''} onChange={(e) => handleDetailChange('role', e.target.value)}>
                    <option value="Principal Investigator">Principal Investigator</option>
                    <option value="Co-Investigator">Co-Investigator</option>
                    <option value="Researcher">Researcher</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Project Status</label>
                <select className="form-select" value={detailFields.status || ''} onChange={(e) => handleDetailChange('status', e.target.value)}>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
          )}

          {formCategory === 'FDP Attended' && (
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px' }}>FDP / Workshop Details</h4>
              <div className="form-group">
                <label className="form-label">Organized By</label>
                <input type="text" className="form-input" value={detailFields.organized_by || ''} onChange={(e) => handleDetailChange('organized_by', e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input type="date" className="form-input" value={detailFields.start_date || ''} onChange={(e) => handleDetailChange('start_date', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input type="date" className="form-input" value={detailFields.end_date || ''} onChange={(e) => handleDetailChange('end_date', e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Duration (Days)</label>
                <input type="number" className="form-input" value={detailFields.duration_days || ''} onChange={(e) => handleDetailChange('duration_days', e.target.value)} />
              </div>
            </div>
          )}

          {formCategory === 'FDP Conducted' && (
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px' }}>Conducted FDP Specifications</h4>
              <div className="form-group">
                <label className="form-label">Organized For</label>
                <input type="text" className="form-input" value={detailFields.organized_for || ''} onChange={(e) => handleDetailChange('organized_for', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Your Role</label>
                <select className="form-select" value={detailFields.role || ''} onChange={(e) => handleDetailChange('role', e.target.value)}>
                  <option value="Coordinator">Coordinator</option>
                  <option value="Resource Person / Speaker">Resource Person / Speaker</option>
                  <option value="Convenor">Convenor</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date of Conduct</label>
                <input type="date" className="form-input" value={detailFields.date_conducted || ''} onChange={(e) => handleDetailChange('date_conducted', e.target.value)} />
              </div>
            </div>
          )}

          {formCategory === 'Other' && (
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ fontSize: '0.85rem', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px' }}>General Record Data</h4>
              <div className="form-group">
                <label className="form-label">Category Label</label>
                <input type="text" className="form-input" value={detailFields.custom_label || ''} onChange={(e) => handleDetailChange('custom_label', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" rows="3" value={detailFields.description || ''} onChange={(e) => handleDetailChange('description', e.target.value)}></textarea>
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input type="date" className="form-input" value={detailFields.date || ''} onChange={(e) => handleDetailChange('date', e.target.value)} />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Update Proof Document (optional, leave blank to keep original)</label>
            <input 
              type="file" 
              className="form-input" 
              accept=".pdf,.jpg,.jpeg,.png,.docx"
              onChange={handleFileChange}
            />
            {formFile && <div style={{ fontSize: '0.8rem', color: 'var(--success)', marginTop: '8px' }}>Selected: {formFile.name}</div>}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsEditOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Changes</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LecturerDashboard;
