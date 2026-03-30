import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Target, Users, TrendingUp, Calendar, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SalesDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // We will aggregate stats specifically for the Sales user by fetching related endpoints
    Promise.all([
      api.get('/leads'),
      api.get('/orders'),
      api.get('/dealers')
    ]).then(([l, o, d]) => {
      const leads = l.data;
      const orders = o.data;
      const dealers = d.data;

      const convertedThisMonth = leads.filter(x => x.status === 'Converted' && new Date(x.convertedAt).getMonth() === new Date().getMonth()).length;
      
      setStats({
        totalLeadsAssigned: leads.filter(x => x.assignedBy === api._userId).length || leads.length, // Placeholder logic
        totalDealers: dealers.length,
        totalOrdersValue: orders.reduce((sum, ord) => sum + ord.totalAmount, 0),
        pendingOrders: orders.filter(x => x.status === 'Pending').length,
        convertedThisMonth
      });
    }).catch(err => console.error(err)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Sales Overview</h1>
        <p>Monitor your performance, team targets, and pending follow-ups</p>
      </div>

      <div className="grid grid-4 mb-4">
         <div className="card">
            <div className="flex-between mb-4">
              <span style={{ color: 'var(--text-secondary)' }}>Total Leads Captured</span>
              <div style={{ background: 'rgba(99,102,241,0.1)', padding: '8px', borderRadius: '50%' }}><Users size={20} color="var(--primary)" /></div>
            </div>
            <h2>{stats?.totalLeadsAssigned || 0}</h2>
            <div className="flex gap-2" style={{ marginTop: '12px', fontSize: '13px' }}>
              <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center' }}><TrendingUp size={14} /> +{(stats?.convertedThisMonth || 0)} converted</span>
              <span style={{ color: 'var(--text-muted)' }}>this month</span>
            </div>
         </div>
         
         <div className="card">
            <div className="flex-between mb-4">
              <span style={{ color: 'var(--text-secondary)' }}>Pending Orders</span>
              <div style={{ background: 'rgba(239,68,68,0.1)', padding: '8px', borderRadius: '50%' }}><Target size={20} color="var(--danger)" /></div>
            </div>
            <h2>{stats?.pendingOrders || 0}</h2>
         </div>

         <div className="card">
            <div className="flex-between mb-4">
              <span style={{ color: 'var(--text-secondary)' }}>Total Sales Value</span>
              <div style={{ background: 'rgba(34,197,94,0.1)', padding: '8px', borderRadius: '50%' }}><TrendingUp size={20} color="var(--success)" /></div>
            </div>
            <h2>₹{(stats?.totalOrdersValue || 0).toLocaleString('en-IN')}</h2>
         </div>
      </div>
      
      <div className="grid grid-2">
         <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', minHeight: '200px' }}>
           <Calendar size={48} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
           <h3>Upcoming Follow-Ups</h3>
           <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>You have 3 leads scheduled for follow-up today.</p>
           <Link to="/sales/leads" className="btn btn-primary"><ArrowRight size={16} /> Go to Leads</Link>
         </div>
      </div>
    </div>
  );
}
