import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import LecturerDashboard from './pages/LecturerDashboard';
import EditProfile from './pages/EditProfile';
import AdminDashboard from './pages/AdminDashboard';
import MasterDataManagement from './pages/MasterDataManagement';
import ReportsAnalytics from './pages/ReportsAnalytics';

import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('login');
  const [resetToken, setResetToken] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const validateSession = async () => {
      // 1. Check if we have a reset password link in the URL pathname
      const pathname = window.location.pathname;
      const resetMatch = pathname.match(/^\/reset-password\/(.+)$/);
      
      if (resetMatch) {
        const token = resetMatch[1];
        setResetToken(token);
        setCurrentPage('reset');
        setLoading(false);
        return;
      }

      // 2. Otherwise validate standard login session token
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await axios.get('http://localhost:5000/api/auth/profile', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser(res.data);
          setCurrentPage('dashboard');
          if (res.data.role === 'admin') {
            setActiveTab('approvals');
          } else {
            setActiveTab('dashboard');
          }
        } catch (err) {
          console.error('Session validation failed:', err);
          localStorage.removeItem('token');
          setCurrentPage('login');
        }
      } else {
        setCurrentPage('login');
      }
      setLoading(false);
    };
    validateSession();
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setCurrentPage('dashboard');
    if (userData.role === 'admin') {
      setActiveTab('approvals');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setCurrentPage('login');
  };

  const navigateToReset = (token) => {
    setResetToken(token);
    setCurrentPage('reset');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#080c14', color: '#f8fafc', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: '16px' }}>Loading Portal...</h2>
          <div className="badge badge-pending">Validating Session</div>
        </div>
      </div>
    );
  }

  if (currentPage === 'login') {
    return (
      <Login 
        onLoginSuccess={handleLoginSuccess} 
        navigateToRegister={() => setCurrentPage('register')}
        navigateToForgot={() => setCurrentPage('forgot')}
      />
    );
  }

  if (currentPage === 'register') {
    return <Register navigateToLogin={() => setCurrentPage('login')} />;
  }

  if (currentPage === 'forgot') {
    return (
      <ForgotPassword 
        navigateToLogin={() => setCurrentPage('login')} 
        navigateToReset={navigateToReset}
      />
    );
  }

  if (currentPage === 'reset') {
    return <ResetPassword token={resetToken} navigateToLogin={() => setCurrentPage('login')} />;
  }

  return (
    <div className="app-container">
      <Sidebar user={user} activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="main-wrapper">
        <Navbar user={user} onLogout={handleLogout} theme={theme} toggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')} />
        
        {user?.role === 'lecturer' && activeTab === 'dashboard' && (
          <LecturerDashboard user={user} />
        )}
        {user?.role === 'lecturer' && activeTab === 'profile' && (
          <EditProfile user={user} onProfileUpdate={(updatedUser) => setUser(updatedUser)} />
        )}

        {user?.role === 'admin' && (activeTab === 'approvals' || activeTab === 'submissions') && (
          <AdminDashboard activeTab={activeTab} />
        )}
        {user?.role === 'admin' && activeTab === 'master' && (
          <MasterDataManagement />
        )}
        {user?.role === 'admin' && activeTab === 'reports' && (
          <ReportsAnalytics />
        )}
      </div>
    </div>
  );
}

export default App;
