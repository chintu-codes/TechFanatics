import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Plus, ShoppingCart, X, Trash2 } from 'lucide-react';

const getBadge = s => ({ Pending: 'badge-pending', Confirmed: 'badge-confirmed', Processing: 'badge-followup', Shipped: 'badge-contacted', Completed: 'badge-converted', Cancelled: 'badge-lost' }[s] || 'badge-new');
const getPayBadge = s => ({ Unpaid: 'badge-lost', Partial: 'badge-followup', Paid: 'badge-converted' }[s] || 'badge-new');
const EMPTY_FORM = { items: [{ productName: '', sku: '', quantity: 1, unitPrice: 0 }], discount: 0, tax: 0, notes: '' };

export default function DealerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/orders').then(r => setOrders(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const setItem = (i, field, val) => setForm(p => {
    const items = [...p.items];
    items[i] = { ...items[i], [field]: val };
    return { ...p, items };
  });

  const addItem = () => setForm(p => ({ ...p, items: [...p.items, { productName: '', sku: '', quantity: 1, unitPrice: 0 }] }));
  const removeItem = (i) => setForm(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }));

  const subtotal = form.items.reduce((sum, it) => sum + (it.quantity * it.unitPrice), 0);
  const total = subtotal - (Number(form.discount) || 0) + (Number(form.tax) || 0);
  const fmt = n => `₹${(n || 0).toLocaleString('en-IN')}`;

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.post('/orders', { ...form, items: form.items.map(it => ({ ...it, quantity: Number(it.quantity), unitPrice: Number(it.unitPrice) })), discount: Number(form.discount), tax: Number(form.tax) });
      toast.success('Order placed successfully!'); setShowModal(false); setForm(EMPTY_FORM); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error placing order'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="page-header flex-between">
        <div><h1>My Orders</h1><p>Track all your orders and payment status</p></div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)} id="create-order-btn"><Plus size={16} />New Order</button>
      </div>

      <div className="card">
        {loading ? <div className="loading-spinner"><div className="spinner" /></div> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Order #</th><th>Items</th><th>Total</th><th>Paid</th><th>Outstanding</th><th>Status</th><th>Payment</th><th>Date</th></tr></thead>
              <tbody>
                {orders.length === 0 && <tr><td colSpan={8}><div className="empty-state"><ShoppingCart size={36} /><h3>No Orders Yet</h3><p>Place your first order above</p></div></td></tr>}
                {orders.map(o => (
                  <tr key={o._id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{o.orderNumber}</td>
                    <td>{o.items?.length} item(s)</td>
                    <td style={{ fontWeight: 600 }}>{fmt(o.totalAmount)}</td>
                    <td style={{ color: 'var(--success)' }}>{fmt(o.amountPaid)}</td>
                    <td style={{ color: o.outstandingAmount > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>{fmt(o.outstandingAmount)}</td>
                    <td><span className={`badge ${getBadge(o.status)}`}>{o.status}</span></td>
                    <td><span className={`badge ${getPayBadge(o.paymentStatus)}`}>{o.paymentStatus}</span></td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <h2>Place New Order</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <h4 style={{ marginBottom: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>Order Items</h4>
                {form.items.map((item, i) => (
                  <div key={i} className="grid" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '10px', marginBottom: '10px', alignItems: 'end' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      {i === 0 && <label className="form-label">Product Name *</label>}
                      <input className="form-control" placeholder="Product name" value={item.productName} onChange={e => setItem(i, 'productName', e.target.value)} required />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      {i === 0 && <label className="form-label">SKU</label>}
                      <input className="form-control" placeholder="SKU" value={item.sku} onChange={e => setItem(i, 'sku', e.target.value)} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      {i === 0 && <label className="form-label">Qty *</label>}
                      <input type="number" className="form-control" min={1} value={item.quantity} onChange={e => setItem(i, 'quantity', e.target.value)} required />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      {i === 0 && <label className="form-label">Unit Price (₹) *</label>}
                      <input type="number" className="form-control" min={0} value={item.unitPrice} onChange={e => setItem(i, 'unitPrice', e.target.value)} required />
                    </div>
                    <div style={{ paddingBottom: '0' }}>
                      {i === 0 && <div style={{ height: '21px' }} />}
                      <button type="button" className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => removeItem(i)} disabled={form.items.length === 1}><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
                <button type="button" className="btn btn-secondary btn-sm mt-4" onClick={addItem}><Plus size={14} />Add Item</button>

                <div className="grid grid-2 mt-4">
                  <div className="form-group">
                    <label className="form-label">Discount (₹)</label>
                    <input type="number" className="form-control" min={0} value={form.discount} onChange={e => setForm(p => ({ ...p, discount: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tax (₹)</label>
                    <input type="number" className="form-control" min={0} value={form.tax} onChange={e => setForm(p => ({ ...p, tax: e.target.value }))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea className="form-control" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Any special instructions..." />
                </div>
                <div style={{ background: 'var(--bg-base)', borderRadius: 'var(--radius-sm)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px' }}>
                  <div className="flex-between"><span style={{ color: 'var(--text-secondary)' }}>Subtotal</span><span>{fmt(subtotal)}</span></div>
                  <div className="flex-between"><span style={{ color: 'var(--text-secondary)' }}>Discount</span><span style={{ color: 'var(--success)' }}>-{fmt(Number(form.discount))}</span></div>
                  <div className="flex-between"><span style={{ color: 'var(--text-secondary)' }}>Tax</span><span>+{fmt(Number(form.tax))}</span></div>
                  <div className="flex-between" style={{ borderTop: '1px solid var(--border)', paddingTop: '8px', marginTop: '4px' }}>
                    <span style={{ fontWeight: 700 }}>Total</span><span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--primary-light)' }}>{fmt(total)}</span>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Placing Order...' : 'Place Order'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
