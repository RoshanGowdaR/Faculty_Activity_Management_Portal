import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserCheck, Check, X, ShieldAlert, FileText, Download, Search, RefreshCw, Eye } from 'lucide-react';
import Modal from '../components/Modal';

const AdminDashboard = ({ activeTab }) => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  
  // Master references for filters
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);

  // Submissions filter state
  const [filterLecturer, setFilterLecturer] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterSearch, setFilterSearch] = useState('');
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');

  // Modals
  const [selectedSub, setSelectedSub] = useState(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  useEffect(() => {
    if (activeTab === 'approvals') {
      fetchPendingUsers();
    } else if (activeTab === 'submissions') {
      fetchSubmissions();
      fetchFiltersData();
    }
  }, [activeTab, filterLecturer, filterDept, filterCat, filterYear, filterStart, filterEnd]);

  useEffect(() => {
    if (activeTab === 'submissions' && !isViewOpen) {
      // Fetch audits if needed or load audit logs in admin view
      fetchAuditLogs();
    }
  }, [activeTab]);

  const fetchPendingUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/admin/users/pending', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingUsers(res.data);
    } catch (err) {
      console.error('Error fetching pending users:', err);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = {};
      if (filterLecturer) params.lecturer_id = filterLecturer;
      if (filterDept) params.department = filterDept;
      if (filterCat) params.category = filterCat;
      if (filterYear) params.academic_year = filterYear;
      if (filterSearch) params.search = filterSearch;
      if (filterStart) params.start_date = filterStart;
      if (filterEnd) params.end_date = filterEnd;

      const res = await axios.get('http://localhost:5000/api/admin/submissions', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setSubmissions(res.data);
    } catch (err) {
      console.error('Error fetching admin submissions:', err);
    }
  };

  const fetchFiltersData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [deptsRes, catsRes, usersRes] = await Promise.all([
        axios.get('http://localhost:5000/api/master/departments'),
        axios.get('http://localhost:5000/api/master/categories'),
        axios.get('http://localhost:5000/api/admin/users', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setDepartments(deptsRes.data);
      setCategories(catsRes.data);
      setLecturers(usersRes.data);
    } catch (err) {
      console.error('Error loading filters data:', err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/admin/audit-logs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAuditLogs(res.data);
    } catch (err) {
      console.error('Error fetching audits:', err);
    }
  };

  const handleApproveUser = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/admin/users/${id}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchPendingUsers();
    } catch (err) {
      alert('Error approving user');
    }
  };

  const handleRejectUser = async (id) => {
    if (!window.confirm('Reject this user registration?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/admin/users/${id}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchPendingUsers();
    } catch (err) {
      alert('Error rejecting user');
    }
  };

  const handleVerifySubmission = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/admin/submissions/${id}/verify`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchSubmissions();
      setIsViewOpen(false);
    } catch (err) {
      alert('Error verifying submission');
    }
  };

  const handleRejectSubmission = async (id) => {
    if (!window.confirm('Flag this submission as Rejected? The lecturer will be notified to correct and re-upload.')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/admin/submissions/${id}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchSubmissions();
      setIsViewOpen(false);
    } catch (err) {
      alert('Error rejecting submission');
    }
  };

  const openViewModal = (sub) => {
    setSelectedSub(sub);
    setIsViewOpen(true);
  };

  return (
    <div className="content-pane">
      {/* 1. Pending Approvals Tab */}
      {activeTab === 'approvals' && (
        <div className="glass-panel">
          <div className="card-header" style={{ padding: '24px 28px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <UserCheck size={22} style={{ color: 'var(--primary)' }} />
            <h2 className="header-title">Pending Faculty Registrations</h2>
          </div>
          <div className="card-body">
            {pendingUsers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
                No registrations currently pending approval.
              </div>
            ) : (
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Full Name</th>
                      <th>College Email ID</th>
                      <th>Employee ID</th>
                      <th>Department</th>
                      <th>Designation</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingUsers.map(user => (
                      <tr key={user._id}>
                        <td style={{ fontWeight: '600' }}>{user.name}</td>
                        <td>{user.email}</td>
                        <td><span style={{ fontFamily: 'monospace', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px' }}>{user.employee_id}</span></td>
                        <td>{user.department}</td>
                        <td>{user.designation}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            <button className="btn btn-success" style={{ padding: '8px 14px', fontSize: '0.85rem' }} onClick={() => handleApproveUser(user._id)}>
                              <Check size={14} style={{ marginRight: '4px' }} /> Approve
                            </button>
                            <button className="btn btn-danger" style={{ padding: '8px 14px', fontSize: '0.85rem' }} onClick={() => handleRejectUser(user._id)}>
                              <X size={14} style={{ marginRight: '4px' }} /> Reject
                            </button>
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
      )}

      {/* 2. All Submissions Tab */}
      {activeTab === 'submissions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Submissions Ledger */}
          <div className="glass-panel">
            <div className="card-header" style={{ padding: '24px 28px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="header-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={20} style={{ color: 'var(--primary)' }} />
                Consolidated Activity Records
              </h2>
              <button className="btn btn-secondary" style={{ padding: '8px 12px' }} onClick={fetchSubmissions} title="Refresh Data">
                <RefreshCw size={14} />
              </button>
            </div>

            <div className="card-body">
              {/* Filter grid */}
              <div className="filter-bar" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: '24px' }}>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Search by title..." 
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchSubmissions()}
                />

                <select className="form-select" value={filterLecturer} onChange={(e) => setFilterLecturer(e.target.value)}>
                  <option value="">All Faculty</option>
                  {lecturers.map(l => (
                    <option key={l._id} value={l._id}>{l.name}</option>
                  ))}
                </select>

                <select className="form-select" value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
                  <option value="">All Departments</option>
                  {departments.map(d => (
                    <option key={d._id} value={d.name}>{d.name}</option>
                  ))}
                </select>

                <select className="form-select" value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
                  <option value="">All Categories</option>
                  {categories.map(c => (
                    <option key={c._id} value={c.name}>{c.name}</option>
                  ))}
                </select>

                <select className="form-select" value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
                  <option value="">All Academic Years</option>
                  <option value="2025-2026">2025-2026</option>
                  <option value="2024-2025">2024-2025</option>
                  <option value="2023-2024">2023-2024</option>
                </select>
              </div>

              {/* Advanced Date Filter bar */}
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '28px', background: 'rgba(255,255,255,0.02)', padding: '12px 18px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Date Range:</span>
                <input type="date" className="form-input" style={{ width: '170px', padding: '8px 12px' }} value={filterStart} onChange={(e) => setFilterStart(e.target.value)} />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>to</span>
                <input type="date" className="form-input" style={{ width: '170px', padding: '8px 12px' }} value={filterEnd} onChange={(e) => setFilterEnd(e.target.value)} />
                
                <button className="btn btn-primary" style={{ padding: '8px 18px', fontSize: '0.85rem' }} onClick={fetchSubmissions}>
                  Apply Filters & Search
                </button>
              </div>

              {/* Table */}
              {submissions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
                  No submissions found matching current search/filter criteria.
                </div>
              ) : (
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Faculty / Dept</th>
                        <th>Activity Title</th>
                        <th>Category</th>
                        <th>Academic Year</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map(sub => (
                        <tr key={sub._id}>
                          <td>
                            <div style={{ fontWeight: '600' }}>{sub.user_id?.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{sub.user_id?.department}</div>
                          </td>
                          <td>
                            <div style={{ fontWeight: '500', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={sub.title}>
                              {sub.title}
                            </div>
                          </td>
                          <td><span style={{ fontSize: '0.85rem', background: 'rgba(255,255,255,0.04)', padding: '4px 8px', borderRadius: '4px' }}>{sub.category}</span></td>
                          <td>{sub.academic_year}</td>
                          <td>
                            <span className={`badge badge-${sub.status}`}>{sub.status}</span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '8px' }}>
                              <button className="btn btn-secondary" style={{ padding: '8px' }} onClick={() => openViewModal(sub)} title="View Proof & Verification Options">
                                <Eye size={14} />
                              </button>
                              <a 
                                href={sub.file_path ? (sub.file_path.startsWith('http') ? sub.file_path : `http://localhost:5000${sub.file_path}`) : '#'} 
                                target="_blank" 
                                rel="noreferrer"
                                className="btn btn-secondary" 
                                style={{ padding: '8px' }}
                                title="Download Proof"
                              >
                                <Download size={14} />
                              </a>
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

          {/* Audit Logs panel */}
          <div className="glass-panel">
            <div className="card-header" style={{ padding: '24px 28px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={20} style={{ color: 'var(--danger)' }} />
              <h2 className="header-title">System Activity Audit Log</h2>
            </div>
            <div className="card-body">
              <div className="table-container" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Triggered By</th>
                      <th>Action</th>
                      <th>Target Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map(log => (
                      <tr key={log._id}>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td>
                          {log.user_id ? (
                            <div>
                              <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>{log.user_id.name}</div>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{log.user_id.role}</span>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>System / Guest</span>
                          )}
                        </td>
                        <td>
                          <span style={{ 
                            fontSize: '0.8rem', 
                            padding: '3px 8px', 
                            borderRadius: '4px',
                            background: log.action.includes('Failed') ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)',
                            color: log.action.includes('Failed') ? 'var(--danger)' : 'var(--primary)',
                            fontWeight: '600'
                          }}>
                            {log.action}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{log.target}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submission Review Modal */}
      <Modal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} title="Review Submission Detail">
        {selectedSub && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', marginBottom: '24px' }}>
              <div>
                <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '6px' }}>Submission Title</h4>
                <div style={{ fontWeight: '700', fontSize: '1.1rem', marginBottom: '16px' }}>{selectedSub.title}</div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Category</span>
                    <span style={{ fontSize: '0.95rem', fontWeight: '600' }}>{selectedSub.category}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Academic Year</span>
                    <span style={{ fontSize: '0.95rem', fontWeight: '600' }}>{selectedSub.academic_year}</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Submitted By</span>
                    <span style={{ fontSize: '0.95rem', fontWeight: '600' }}>{selectedSub.user_id?.name}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Department</span>
                    <span style={{ fontSize: '0.95rem', fontWeight: '600' }}>{selectedSub.user_id?.department}</span>
                  </div>
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <h4 style={{ fontSize: '0.75rem', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px' }}>Activity Specific Data</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selectedSub.detail_fields && Object.entries(selectedSub.detail_fields).map(([key, val]) => (
                    val && (
                      <div key={key} style={{ fontSize: '0.85rem', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
                        <span style={{ textTransform: 'capitalize', color: 'var(--text-secondary)', display: 'block', fontSize: '0.7rem' }}>{key.replace('_', ' ')}</span>
                        <span style={{ fontWeight: '500' }}>{val}</span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">Evidence / Proof File</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.03)', padding: '12px 18px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <FileText size={28} style={{ color: 'var(--primary)' }} />
                <div style={{ flexGrow: 1 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: '600', wordBreak: 'break-all' }}>{selectedSub.file_path.split('/').pop()}</div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Verified format uploaded by Lecturer</span>
                </div>
                <a 
                  href={selectedSub.file_path ? (selectedSub.file_path.startsWith('http') ? selectedSub.file_path : `http://localhost:5000${selectedSub.file_path}`) : '#'} 
                  target="_blank" 
                  rel="noreferrer"
                  className="btn btn-secondary" 
                  style={{ padding: '8px 14px' }}
                >
                  <Download size={14} style={{ marginRight: '6px' }} /> Download
                </a>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Current verification status: </span>
                <span className={`badge badge-${selectedSub.status}`}>{selectedSub.status}</span>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsViewOpen(false)}>Close</button>
                {selectedSub.status !== 'verified' && (
                  <button type="button" className="btn btn-success" onClick={() => handleVerifySubmission(selectedSub._id)}>
                    <Check size={14} style={{ marginRight: '6px' }} /> Verify & Lock
                  </button>
                )}
                {selectedSub.status !== 'rejected' && (
                  <button type="button" className="btn btn-danger" onClick={() => handleRejectSubmission(selectedSub._id)}>
                    <X size={14} style={{ marginRight: '6px' }} /> Flag Rejection
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminDashboard;
