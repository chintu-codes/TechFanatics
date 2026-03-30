import { useEffect, useState } from 'react';
import api from '../../api/axios';
import {
  Users, UserCheck, ShoppingCart, CreditCard,
  Ticket, TrendingUp, AlertCircle, CheckCircle
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

const PIE_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#ef4444', '#f59e0b'];

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="stat-card">
    <div className="stat-icon" style={{ background: `${color}20` }}>
      <Icon size={24} color={color} />
    </div>
    <div className="stat-info">
      <h3>{value ?? '–'}</h3>
      <p>{label}</p>
    </div>
  </div>
);

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/admin')
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  const { stats, leadStatusBreakdown = [], recentLeads = [], recentOrders = [] } = data || {};

  const pieData = leadStatusBreakdown.map(l => ({ name: l._id, value: l.count }));

  const formatCurrency = (n) => `₹${(n || 0).toLocaleString('en-IN')}`;

  const getBadgeClass = (status) => {
    const map = { New: 'badge-new', Contacted: 'badge-contacted', Converted: 'badge-converted', Lost: 'badge-lost', 'Follow-Up': 'badge-followup', Pending: 'badge-pending', Confirmed: 'badge-confirmed', Completed: 'badge-completed', Cancelled: 'badge-cancelled' };
    return map[status] || 'badge-new';
  };

  return (
    <div>
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Welcome back! Here's what's happening with your CRM today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-4 mb-6">
        <StatCard icon={UserCheck} label="Total Dealers" value={stats?.totalDealers} color="#6366f1" />
        <StatCard icon={Users} label="Total Leads" value={stats?.totalLeads} color="#0ea5e9" />
        <StatCard icon={ShoppingCart} label="Total Orders" value={stats?.totalOrders} color="#10b981" />
        <StatCard icon={TrendingUp} label="Total Revenue" value={formatCurrency(stats?.totalRevenue)} color="#f59e0b" />
        <StatCard icon={AlertCircle} label="New Leads" value={stats?.newLeads} color="#f59e0b" />
        <StatCard icon={CheckCircle} label="Converted Leads" value={stats?.convertedLeads} color="#10b981" />
        <StatCard icon={ShoppingCart} label="Pending Orders" value={stats?.pendingOrders} color="#ef4444" />
        <StatCard icon={CreditCard} label="Total Outstanding" value={formatCurrency(stats?.totalOutstanding)} color="#ef4444" />
      </div>

      {/* Charts */}
      <div className="grid grid-2 mb-6">
        <div className="card">
          <h3 style={{ marginBottom: '20px', fontSize: '16px' }}>Lead Status Breakdown</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '20px', fontSize: '16px' }}>Lead Status Count</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={pieData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
              <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Tables */}
      <div className="grid grid-2">
        <div className="card">
          <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>Recent Leads</h3>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Customer</th><th>Area</th><th>Status</th></tr></thead>
              <tbody>
                {recentLeads.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No leads yet</td></tr>}
                {recentLeads.map(l => (
                  <tr key={l._id}>
                    <td><div style={{ fontWeight: 500 }}>{l.customerName}</div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{l.phone}</div></td>
                    <td>{l.area}</td>
                    <td><span className={`badge ${getBadgeClass(l.status)}`}>{l.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>Recent Orders</h3>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Order #</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>
                {recentOrders.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No orders yet</td></tr>}
                {recentOrders.map(o => (
                  <tr key={o._id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{o.orderNumber}</td>
                    <td style={{ fontWeight: 600, color: 'var(--success)' }}>{formatCurrency(o.totalAmount)}</td>
                    <td><span className={`badge ${getBadgeClass(o.status)}`}>{o.status}</span></td>
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
