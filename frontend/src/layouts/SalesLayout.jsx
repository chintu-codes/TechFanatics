import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LayoutDashboard, LogOut, Sun, Moon } from 'lucide-react';

export default function SalesLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo flex-between">
          <div>
            <img src="/logo.png" alt="Logo" style={{ width: '100%', maxWidth: '120px' }} />
            <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Sales Rep Terminal</p>
          </div>
          <button className="btn-icon" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-label">Sales Menu</div>
            <NavLink to="/sales" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={18} />Dashboard
            </NavLink>
          </div>
        </nav>
        <div className="sidebar-footer">
          <div className="user-info" onClick={handleLogout}>
            <div className="avatar" style={{ background: '#f59e0b' }}>{user?.name?.[0]}</div>
            <div className="user-info-text">
              <strong>{user?.name}</strong>
              <span>{user?.role}</span>
            </div>
            <LogOut size={16} />
          </div>
        </div>
      </aside>
      <main className="main-content">
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
