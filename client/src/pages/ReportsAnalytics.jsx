import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { Download, FileSpreadsheet, Archive, CheckSquare, Users, BookOpen } from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

const ReportsAnalytics = () => {
  const [submissions, setSubmissions] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // Filter settings
  const [filterLecturer, setFilterLecturer] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterYear, setFilterYear] = useState('');

  const [loading, setLoading] = useState(false);
  const [zipLoading, setZipLoading] = useState(false);

  useEffect(() => {
    fetchSubmissions();
    fetchFiltersData();
  }, [filterLecturer, filterDept, filterCat, filterYear]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = {};
      if (filterLecturer) params.lecturer_id = filterLecturer;
      if (filterDept) params.department = filterDept;
      if (filterCat) params.category = filterCat;
      if (filterYear) params.academic_year = filterYear;

      const res = await axios.get('http://localhost:5000/api/admin/submissions', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setSubmissions(res.data);
    } catch (err) {
      console.error('Error fetching submissions:', err);
    } finally {
      setLoading(false);
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

  // CSV Export Utility
  const handleExportCSV = () => {
    if (submissions.length === 0) return;

    // Build headers
    const headers = ['Faculty Name', 'Employee ID', 'Department', 'Designation', 'Category', 'Activity Title', 'Academic Year', 'Submitted Date', 'Status'];
    
    // Build rows
    const rows = submissions.map(sub => [
      sub.user_id?.name || 'Unknown',
      sub.user_id?.employee_id || 'N/A',
      sub.user_id?.department || 'N/A',
      sub.user_id?.designation || 'N/A',
      sub.category,
      `"${sub.title.replace(/"/g, '""')}"`,
      sub.academic_year,
      new Date(sub.submitted_at).toLocaleDateString(),
      sub.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `faculty_activities_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Bulk ZIP download
  const handleDownloadZip = async () => {
    setZipLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = {};
      if (filterLecturer) params.lecturer_id = filterLecturer;
      if (filterDept) params.department = filterDept;
      if (filterCat) params.category = filterCat;
      if (filterYear) params.academic_year = filterYear;

      const response = await axios.get('http://localhost:5000/api/admin/submissions/download-zip', {
        headers: { Authorization: `Bearer ${token}` },
        params,
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/zip' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `submissions_proofs_${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Error fetching bulk zip. Make sure matching submissions contain evidence files.');
    } finally {
      setZipLoading(false);
    }
  };

  // 1. Chart Data: Submissions per Department
  const getDeptChartData = () => {
    const counts = {};
    submissions.forEach(sub => {
      const dept = sub.user_id?.department || 'Other';
      counts[dept] = (counts[dept] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  };

  // 2. Chart Data: Submissions per Category
  const getCatChartData = () => {
    const counts = {};
    submissions.forEach(sub => {
      counts[sub.category] = (counts[sub.category] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  };

  // 3. Chart Data: Top Active Faculty members
  const getFacultyChartData = () => {
    const counts = {};
    submissions.forEach(sub => {
      const name = sub.user_id?.name || 'Unknown';
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // top 5
  };

  const totalFacultyCount = lecturers.length;
  const verifiedCount = submissions.filter(s => s.status === 'verified').length;
  const verificationRate = submissions.length > 0 ? ((verifiedCount / submissions.length) * 100).toFixed(1) : '0.0';

  return (
    <div className="content-pane">
      {/* Metrics widgets */}
      <div className="dashboard-grid" style={{ marginBottom: '32px' }}>
        <div className="stat-card glass-panel">
          <div className="stat-label">Faculty Contributors</div>
          <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={24} style={{ color: 'var(--primary)' }} />
            {totalFacultyCount}
          </div>
        </div>
        <div className="stat-card glass-panel success">
          <div className="stat-label">Analyzed Records</div>
          <div className="stat-value" style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BookOpen size={24} style={{ color: 'var(--success)' }} />
            {submissions.length}
          </div>
        </div>
        <div className="stat-card glass-panel warning">
          <div className="stat-label">Record Verification Rate</div>
          <div className="stat-value" style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckSquare size={24} style={{ color: 'var(--warning)' }} />
            {verificationRate}%
          </div>
        </div>
      </div>

      {/* Control panel & filters */}
      <div className="glass-panel" style={{ marginBottom: '32px' }}>
        <div className="card-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="header-title" style={{ fontSize: '1.05rem' }}>Report Filters & Export Tools</h3>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-secondary" onClick={handleExportCSV} disabled={submissions.length === 0} style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
              <FileSpreadsheet size={14} style={{ marginRight: '6px' }} /> Export to CSV
            </button>
            <button className="btn btn-primary" onClick={handleDownloadZip} disabled={submissions.length === 0 || zipLoading} style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
              <Archive size={14} style={{ marginRight: '6px' }} /> {zipLoading ? 'Zipping...' : 'Bulk Zip Proofs'}
            </button>
          </div>
        </div>
        
        <div className="card-body" style={{ padding: '20px 24px' }}>
          <div className="filter-bar" style={{ margin: '0' }}>
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
        </div>
      </div>

      {/* Visualizations Grid */}
      {submissions.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-secondary)' }}>
          No data available to display reports. Please ensure faculty members submit records.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '30px' }}>
          
          {/* Dept Chart */}
          <div className="glass-panel">
            <div className="card-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
              <h4 className="header-title" style={{ fontSize: '0.95rem' }}>Submissions by Department</h4>
            </div>
            <div className="card-body">
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getDeptChartData()} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                    <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                    <Tooltip contentStyle={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }} />
                    <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Category distribution Pie Chart */}
          <div className="glass-panel">
            <div className="card-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
              <h4 className="header-title" style={{ fontSize: '0.95rem' }}>Submissions Category Breakdown</h4>
            </div>
            <div className="card-body">
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getCatChartData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getCatChartData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Top Contributing Faculty */}
          <div className="glass-panel" style={{ gridColumn: 'span 2' }}>
            <div className="card-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
              <h4 className="header-title" style={{ fontSize: '0.95rem' }}>Top 5 Active Contributing Faculty Members</h4>
            </div>
            <div className="card-body">
              <div className="chart-container" style={{ height: '280px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="yellow" data={getFacultyChartData()} margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
                    <XAxis type="number" stroke="var(--text-muted)" fontSize={11} />
                    <YAxis type="category" dataKey="name" stroke="var(--text-muted)" fontSize={11} width={120} />
                    <Tooltip contentStyle={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }} />
                    <Bar dataKey="count" fill="var(--success)" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default ReportsAnalytics;
