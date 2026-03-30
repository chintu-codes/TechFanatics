import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Users, ShoppingCart, CreditCard, Ticket, TrendingUp, AlertCircle } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="stat-card">
    <div className="stat-icon" style={{ background: `${color}20` }}>
      <Icon size={22} color={color} />
    </div>
    <div className="stat-info">
      <h3>{value ?? '–'}</h3>
      <p>{label}</p>
    </div>
  </div>
);

const getBadge = (status) => {
  const map = { New: 'badge-new', Contacted: 'badge-contacted', Converted: 'badge-converted', Lost: 'badge-lost', 'Follow-Up': 'badge-followup', Pending: 'badge-pending', Confirmed: 'badge-confirmed', Completed: 'badge-converted', Cancelled: 'badge-lost' };
  return map[status] || 'badge-new';
};

export default function DealerDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/dealer').then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  const { stats, recentLeads = [], recentOrders = [] } = data || {};
  const fmt = n => `₹${(n || 0).toLocaleString('en-IN')}`;

  return (
    <div>
      <div className="page-header">
        <h1>Welcome, {user?.name}! 👋</h1>
        <p>{user?.companyName || 'Dealer Portal'} · Your performance overview</p>
      </div>

      <div className="grid grid-3 mb-6">
        <StatCard icon={Users} label="My Leads" value={stats?.myLeads} color="#6366f1" />
        <StatCard icon={TrendingUp} label="Converted" value={stats?.convertedLeads} color="#10b981" />
        <StatCard icon={ShoppingCart} label="My Orders" value={stats?.myOrders} color="#0ea5e9" />
        <StatCard icon={AlertCircle} label="Pending Orders" value={stats?.pendingOrders} color="#f59e0b" />
        <StatCard icon={Ticket} label="Open Tickets" value={stats?.openTickets} color="#8b5cf6" />
        <StatCard icon={CreditCard} label="Outstanding" value={fmt(stats?.outstandingBalance)} color={stats?.outstandingBalance > 0 ? '#ef4444' : '#10b981'} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="card">
          <h3 style={{ marginBottom: '16px', fontSize: '15px' }}>Recent Leads</h3>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Customer</th><th>Area</th><th>Status</th></tr></thead>
              <tbody>
                {recentLeads.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>No leads assigned yet</td></tr>}
                {recentLeads.map(l => (
                  <tr key={l._id}>
                    <td><div style={{ fontWeight: 500 }}>{l.customerName}</div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{l.phone}</div></td>
                    <td>{l.area}</td>
                    <td><span className={`badge ${getBadge(l.status)}`}>{l.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '16px', fontSize: '15px' }}>Recent Orders</h3>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Order</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>
                {recentOrders.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>No orders placed yet</td></tr>}
                {recentOrders.map(o => (
                  <tr key={o._id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{o.orderNumber}</td>
                    <td style={{ fontWeight: 600, color: 'var(--success)' }}>{fmt(o.totalAmount)}</td>
                    <td><span className={`badge ${getBadge(o.status)}`}>{o.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
