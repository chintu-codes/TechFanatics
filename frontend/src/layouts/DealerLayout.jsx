import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  LayoutDashboard, Users, ShoppingCart, 
  CreditCard, Ticket, Gift, LogOut, Sun, Moon 
} from 'lucide-react';

const navItems = [
  { to: '/dealer', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/dealer/leads', icon: Users, label: 'My Leads' },
  { to: '/dealer/orders', icon: ShoppingCart, label: 'Orders' },
  { to: '/dealer/ledger', icon: CreditCard, label: 'Ledger' },
  { to: '/dealer/tickets', icon: Ticket, label: 'Support' },
  { to: '/dealer/schemes', icon: Gift, label: 'Incentives' },
];

export default function DealerLayout() {
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
            <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Dealer Terminal</p>
          </div>
          <button className="btn-icon" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-label">Dealer Menu</div>
            {navItems.map(({ to, icon: Icon, label, end }) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Icon size={18} />{label}
              </NavLink>
            ))}
          </div>
        </nav>
        <div className="sidebar-footer">
          <div className="user-info" onClick={handleLogout}>
            <div className="avatar" style={{ background: 'var(--secondary)' }}>{user?.name?.[0]}</div>
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
