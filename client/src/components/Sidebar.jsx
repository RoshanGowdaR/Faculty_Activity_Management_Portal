import React from 'react';
import { LayoutDashboard, UserCheck, FolderGit, FileSpreadsheet, Settings, User } from 'lucide-react';

const Sidebar = ({ user, activeTab, setActiveTab }) => {
  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <FolderGit size={24} style={{ color: 'var(--primary)' }} />
        <span>Faculty Portal</span>
      </div>

      <ul className="sidebar-menu">
        {user?.role === 'lecturer' ? (
          <>
            <li 
              className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <LayoutDashboard size={20} />
              <span>My Submissions</span>
            </li>
            <li 
              className={`sidebar-item ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <User size={20} />
              <span>Edit Profile</span>
            </li>
          </>
        ) : (
          <>
            <li 
              className={`sidebar-item ${activeTab === 'approvals' ? 'active' : ''}`}
              onClick={() => setActiveTab('approvals')}
            >
              <UserCheck size={20} />
              <span>Pending Registrations</span>
            </li>
            <li 
              className={`sidebar-item ${activeTab === 'submissions' ? 'active' : ''}`}
              onClick={() => setActiveTab('submissions')}
            >
              <LayoutDashboard size={20} />
              <span>All Submissions</span>
            </li>
            <li 
              className={`sidebar-item ${activeTab === 'master' ? 'active' : ''}`}
              onClick={() => setActiveTab('master')}
            >
              <Settings size={20} />
              <span>Master Data Settings</span>
            </li>
            <li 
              className={`sidebar-item ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveTab('reports')}
            >
              <FileSpreadsheet size={20} />
              <span>Reports & Analytics</span>
            </li>
          </>
        )}
      </ul>
      
      <div className="sidebar-footer">
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          v1.0.0 (Offline Build)
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
