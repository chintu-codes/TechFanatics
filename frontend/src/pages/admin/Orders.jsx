import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { ShoppingCart, Search, CheckCircle, X } from 'lucide-react';

const STATUSES = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Completed', 'Cancelled'];
const getBadge = s => ({ Pending: 'badge-pending', Confirmed: 'badge-confirmed', Processing: 'badge-followup', Shipped: 'badge-contacted', Completed: 'badge-converted', Cancelled: 'badge-lost' }[s] || 'badge-new');
const getPayBadge = s => ({ Unpaid: 'badge-lost', Partial: 'badge-followup', Paid: 'badge-converted' }[s] || 'badge-new');

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    Promise.all([api.get('/orders'), api.get('/dealers')])
      .then(([or, dr]) => {
        const dealerMap = {};
        dr.data.forEach(d => { dealerMap[d._id] = d; });
        setOrders(or.data.map(o => ({ ...o, dealerInfo: dealerMap[o.dealer] })));
        setDealers(dr.data);
      })
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleUpdateStatus = async () => {
    if (!newStatus) return;
    setSaving(true);
    try {
      await api.put(`/orders/${selectedOrder._id}/status`, { status: newStatus });
      toast.success('Order status updated');
      setSelectedOrder(null);
      load();
    } catch { toast.error('Failed'); }
    finally { setSaving(false); }
  };

  const filtered = orders.filter(o => {
    const match = o.orderNumber?.includes(search) || o.dealerInfo?.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus ? o.status === filterStatus : true;
    return match && matchStatus;
  });

  const fmt = n => `₹${(n || 0).toLocaleString('en-IN')}`;

  return (
    <div>
      <div className="page-header">
        <h1>Orders</h1>
        <p>Track and manage all dealer orders</p>
      </div>
      <div className="card">
        <div className="flex gap-3 mb-4" style={{ flexWrap: 'wrap' }}>
          <div className="search-bar" style={{ maxWidth: '280px', flex: 1 }}>
            <Search size={16} />
            <input className="form-control" placeholder="Search orders..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="form-control" style={{ maxWidth: '180px' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        {loading ? <div className="loading-spinner"><div className="spinner" /></div> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Order #</th><th>Dealer</th><th>Items</th><th>Total</th><th>Paid</th><th>Outstanding</th><th>Status</th><th>Payment</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.length === 0 && <tr><td colSpan={9}><div className="empty-state"><ShoppingCart size={40} /><h3>No Orders Found</h3></div></td></tr>}
                {filtered.map(o => (
                  <tr key={o._id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{o.orderNumber}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{o.dealerInfo?.name || '—'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{o.dealerInfo?.companyName}</div>
                    </td>
                    <td>{o.items?.length || 0} item(s)</td>
                    <td style={{ fontWeight: 600 }}>{fmt(o.totalAmount)}</td>
                    <td style={{ color: 'var(--success)' }}>{fmt(o.amountPaid)}</td>
                    <td style={{ color: o.outstandingAmount > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>{fmt(o.outstandingAmount)}</td>
                    <td><span className={`badge ${getBadge(o.status)}`}>{o.status}</span></td>
                    <td><span className={`badge ${getPayBadge(o.paymentStatus)}`}>{o.paymentStatus}</span></td>
                    <td>
                      <button className="btn btn-sm btn-secondary" onClick={() => { setSelectedOrder(o); setNewStatus(o.status); }}>
                        <CheckCircle size={13} /> Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedOrder && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSelectedOrder(null)}>
          <div className="modal" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Update Order Status</h2>
              <button className="btn-icon" onClick={() => setSelectedOrder(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '16px', color: 'var(--text-secondary)', fontSize: '14px' }}>Order: <strong>{selectedOrder.orderNumber}</strong></p>
              <div className="form-group">
                <label className="form-label">New Status</label>
                <select className="form-control" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedOrder(null)}>Cancel</button>
              <button className="btn btn-primary" disabled={saving} onClick={handleUpdateStatus}>{saving ? 'Saving...' : 'Update Status'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
