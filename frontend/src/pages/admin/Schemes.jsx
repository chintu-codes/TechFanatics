import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Plus, Gift, Edit2, Trash2, X } from 'lucide-react';

const TYPES = ['Lead-Based', 'Sales-Based', 'Volume-Based', 'Special'];
const EMPTY = { title: '', description: '', type: 'Lead-Based', incentiveValue: '', incentiveType: 'Fixed', minLeads: 0, minSalesAmount: 0, validFrom: '', validTo: '', isActive: true };

export default function AdminSchemes() {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/schemes').then(r => setSchemes(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setShowModal(true); };
  const openEdit = (s) => { setEditing(s); setForm({ ...s, validFrom: s.validFrom?.slice(0, 10) || '', validTo: s.validTo?.slice(0, 10) || '' }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) { await api.put(`/schemes/${editing._id}`, form); toast.success('Scheme updated'); }
      else { await api.post('/schemes', form); toast.success('Scheme created'); }
      setShowModal(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this scheme?')) return;
    try { await api.delete(`/schemes/${id}`); toast.success('Deleted'); load(); }
    catch { toast.error('Failed'); }
  };

  return (
    <div>
      <div className="page-header flex-between">
        <div><h1>Schemes & Incentives</h1><p>Create and manage dealer incentive programs</p></div>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={16} />New Scheme</button>
      </div>

      {loading ? <div className="loading-spinner"><div className="spinner" /></div> : (
        <div className="grid grid-3">
          {schemes.length === 0 && (
            <div className="card" style={{ gridColumn: '1/-1' }}>
              <div className="empty-state"><Gift size={40} /><h3>No Schemes Yet</h3><p>Create incentive programs to motivate dealers</p></div>
            </div>
          )}
          {schemes.map(s => (
            <div key={s._id} className="card" style={{ borderLeft: `4px solid var(--primary)` }}>
              <div className="flex-between mb-4">
                <span className="badge badge-new">{s.type}</span>
                <div className="flex gap-2">
                  <button className="btn-icon" onClick={() => openEdit(s)}><Edit2 size={13} /></button>
                  <button className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(s._id)}><Trash2 size={13} /></button>
                </div>
              </div>
              <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>{s.title}</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px' }}>{s.description || '—'}</p>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                <div className="flex-between">
                  <span style={{ color: 'var(--text-muted)' }}>Incentive</span>
                  <span style={{ fontWeight: 700, color: 'var(--success)' }}>
                    {s.incentiveType === 'Percentage' ? `${s.incentiveValue}%` : `₹${s.incentiveValue}`}
                  </span>
                </div>
                {s.minLeads > 0 && <div className="flex-between"><span style={{ color: 'var(--text-muted)' }}>Min Leads</span><span>{s.minLeads}</span></div>}
                {s.minSalesAmount > 0 && <div className="flex-between"><span style={{ color: 'var(--text-muted)' }}>Min Sales</span><span>₹{s.minSalesAmount?.toLocaleString('en-IN')}</span></div>}
                <div className="flex-between">
                  <span style={{ color: 'var(--text-muted)' }}>Valid</span>
                  <span style={{ fontSize: '12px' }}>{new Date(s.validFrom).toLocaleDateString('en-IN')} → {new Date(s.validTo).toLocaleDateString('en-IN')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2>{editing ? 'Edit Scheme' : 'New Scheme'}</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input className="form-control" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                </div>
                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label">Type *</label>
                    <select className="form-control" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                      {TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Incentive Type</label>
                    <select className="form-control" value={form.incentiveType} onChange={e => setForm(p => ({ ...p, incentiveType: e.target.value }))}>
                      <option>Fixed</option><option>Percentage</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Incentive Value *</label>
                    <input type="number" className="form-control" value={form.incentiveValue} onChange={e => setForm(p => ({ ...p, incentiveValue: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Min Leads</label>
                    <input type="number" className="form-control" value={form.minLeads} onChange={e => setForm(p => ({ ...p, minLeads: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Valid From *</label>
                    <input type="date" className="form-control" value={form.validFrom} onChange={e => setForm(p => ({ ...p, validFrom: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Valid To *</label>
                    <input type="date" className="form-control" value={form.validTo} onChange={e => setForm(p => ({ ...p, validTo: e.target.value }))} required />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
