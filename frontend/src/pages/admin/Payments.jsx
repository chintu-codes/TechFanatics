import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Plus, CreditCard, X, Search } from 'lucide-react';

const MODES = ['Cash', 'Bank Transfer', 'Cheque', 'UPI', 'Credit Note', 'Other'];

export default function AdminPayments() {
  const [dealers, setDealers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [ledger, setLedger] = useState(null);
  const [selectedDealer, setSelectedDealer] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ dealerId: '', orderId: '', amount: '', type: 'Credit', paymentMode: 'Cash', referenceNumber: '', description: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/dealers'), api.get('/orders')]).then(([dr, or]) => {
      setDealers(dr.data); setOrders(or.data);
    });
  }, []);

  const loadLedger = (dealerId) => {
    if (!dealerId) return;
    setLoading(true);
    api.get(`/payments/ledger/${dealerId}`)
      .then(r => setLedger(r.data))
      .finally(() => setLoading(false));
  };

  const handleDealerChange = (id) => { setSelectedDealer(id); loadLedger(id); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.post('/payments', form);
      toast.success('Payment recorded');
      setShowModal(false);
      setForm({ dealerId: selectedDealer, orderId: '', amount: '', type: 'Credit', paymentMode: 'Cash', referenceNumber: '', description: '' });
      loadLedger(selectedDealer);
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const fmt = n => `₹${(n || 0).toLocaleString('en-IN')}`;
  const dealerOrders = orders.filter(o => o.dealer === selectedDealer);

  return (
    <div>
      <div className="page-header flex-between">
        <div><h1>Payments & Ledger</h1><p>Record payments and view dealer ledgers</p></div>
        <button className="btn btn-primary" onClick={() => { setForm(p => ({ ...p, dealerId: selectedDealer })); setShowModal(true); }} id="record-payment-btn">
          <Plus size={16} /> Record Payment
        </button>
      </div>

      <div className="card mb-4">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Select Dealer to View Ledger</label>
          <select className="form-control" style={{ maxWidth: '360px' }} value={selectedDealer} onChange={e => handleDealerChange(e.target.value)}>
            <option value="">-- Select Dealer --</option>
            {dealers.map(d => <option key={d._id} value={d._id}>{d.name} — {d.companyName || d.area}</option>)}
          </select>
        </div>
      </div>

      {ledger && (
        <>
          <div className="grid grid-3 mb-4">
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.15)' }}><CreditCard size={22} color="#6366f1" /></div>
              <div className="stat-info"><h3>{ledger.dealer?.name}</h3><p>{ledger.dealer?.companyName || 'Dealer'}</p></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.15)' }}><CreditCard size={22} color="#ef4444" /></div>
              <div className="stat-info"><h3 style={{ color: ledger.dealer?.outstandingBalance > 0 ? 'var(--danger)' : 'var(--success)' }}>{fmt(ledger.dealer?.outstandingBalance)}</h3><p>Outstanding Balance</p></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)' }}><CreditCard size={22} color="#10b981" /></div>
              <div className="stat-info"><h3>{ledger.payments?.length}</h3><p>Total Transactions</p></div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>Transaction History</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Date</th><th>Type</th><th>Mode</th><th>Amount</th><th>Balance After</th><th>Description</th><th>Ref #</th></tr>
                </thead>
                <tbody>
                  {ledger.payments?.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No transactions yet</td></tr>}
                  {ledger.payments?.map(p => (
                    <tr key={p._id}>
                      <td style={{ fontSize: '12px' }}>{new Date(p.createdAt).toLocaleDateString('en-IN')}</td>
                      <td><span className={`badge ${p.type === 'Credit' ? 'badge-converted' : 'badge-lost'}`}>{p.type}</span></td>
                      <td>{p.paymentMode}</td>
                      <td style={{ fontWeight: 600, color: p.type === 'Credit' ? 'var(--success)' : 'var(--danger)' }}>
                        {p.type === 'Credit' ? '+' : '-'}{fmt(p.amount)}
                      </td>
                      <td>{fmt(p.balanceAfter)}</td>
                      <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.description || '—'}</td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.referenceNumber || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>Record Payment</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="grid grid-2">
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Dealer *</label>
                    <select className="form-control" value={form.dealerId} onChange={e => setForm(p => ({ ...p, dealerId: e.target.value }))} required>
                      <option value="">Select Dealer</option>
                      {dealers.map(d => <option key={d._id} value={d._id}>{d.name} — {d.companyName}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Amount (₹) *</label>
                    <input type="number" className="form-control" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} required min={1} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Type *</label>
                    <select className="form-control" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                      <option>Credit</option><option>Debit</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Payment Mode</label>
                    <select className="form-control" value={form.paymentMode} onChange={e => setForm(p => ({ ...p, paymentMode: e.target.value }))}>
                      {MODES.map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Reference Number</label>
                    <input className="form-control" value={form.referenceNumber} onChange={e => setForm(p => ({ ...p, referenceNumber: e.target.value }))} placeholder="Cheque no., UTR, etc." />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Description</label>
                    <textarea className="form-control" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Record Payment'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
