import React, { useState, useEffect } from 'react';
import { Bell, LogOut, User as UserIcon, Sun, Moon } from 'lucide-react';
import axios from 'axios';

const Navbar = ({ user, onLogout, theme, toggleTheme }) => {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await axios.get('http://localhost:5000/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(res.data);
      setUnreadCount(res.data.filter(n => !n.is_read).length);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleBellClick = async () => {
    setShowDropdown(!showDropdown);
    if (!showDropdown && unreadCount > 0) {
      try {
        const token = localStorage.getItem('token');
        await axios.post('http://localhost:5000/api/notifications/read', {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUnreadCount(0);
        setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      } catch (err) {
        console.error('Error marking notifications read:', err);
      }
    }
  };

  return (
    <nav className="header-nav glass-panel" style={{ borderRadius: '0', borderLeft: 'none', borderRight: 'none', borderTop: 'none' }}>
      <div className="header-title">Faculty Activity Management Portal</div>
      
      <div className="header-actions">
        <button 
          className="notification-bell" 
          onClick={toggleTheme} 
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          style={{ marginRight: '4px' }}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        <div style={{ position: 'relative' }}>
          <button className="notification-bell" onClick={handleBellClick}>
            <Bell size={20} />
            {unreadCount > 0 && <span className="notification-badge" />}
          </button>

          {showDropdown && (
            <div className="notification-dropdown glass-panel">
              <div className="notification-header">
                <span>Notifications</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {unreadCount} unread
                </span>
              </div>
              <div className="notification-list">
                {notifications.length === 0 ? (
                  <div className="notification-item">No notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n._id} 
                      className={`notification-item ${!n.is_read ? 'unread' : ''}`}
                    >
                      {n.message}
                      <div style={{ fontSize: '0.7rem', marginTop: '4px', color: 'var(--text-muted)' }}>
                        {new Date(n.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderLeft: '1px solid var(--border-color)', paddingLeft: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{user?.name}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
              {user?.role === 'admin' ? 'Administrator' : user?.designation}
            </span>
          </div>
          <div className="btn btn-secondary" style={{ padding: '8px', borderRadius: '50%' }}>
            <UserIcon size={18} />
          </div>
          <button className="btn btn-secondary" style={{ padding: '8px 12px' }} onClick={onLogout} title="Log Out">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
