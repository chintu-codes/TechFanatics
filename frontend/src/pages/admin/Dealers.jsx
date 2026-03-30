import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Search, UserCheck, X } from 'lucide-react';

const EMPTY = { name: '', email: '', password: '', phone: '', companyName: '', area: '', city: '', gstNumber: '' };

export default function AdminDealers() {
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => {
    api.get('/dealers').then(r => setDealers(r.data)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setShowModal(true); };
  const openEdit = (d) => { setEditing(d); setForm({ ...d, password: '' }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/dealers/${editing._id}`, form);
        toast.success('Dealer updated');
      } else {
        await api.post('/dealers', form);
        toast.success('Dealer created');
      }
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving dealer');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this dealer?')) return;
    try {
      await api.delete(`/dealers/${id}`);
      toast.success('Dealer removed');
      load();
    } catch { toast.error('Failed to delete'); }
  };

  const filtered = dealers.filter(d =>
    d.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.area?.toLowerCase().includes(search.toLowerCase()) ||
    d.companyName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h1>Dealers</h1>
          <p>Manage your dealer network and onboard new dealers</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate} id="create-dealer-btn">
          <Plus size={16} /> Add Dealer
        </button>
      </div>

      <div className="card">
        <div className="flex-between mb-4">
          <div className="search-bar" style={{ maxWidth: '320px', flex: 1 }}>
            <Search size={16} />
            <input className="form-control" placeholder="Search dealers..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{filtered.length} dealers</span>
        </div>

        {loading ? <div className="loading-spinner"><div className="spinner" /></div> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Dealer</th><th>Company</th><th>Phone</th><th>Area / City</th><th>Outstanding</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={7}><div className="empty-state"><UserCheck size={40} /><h3>No Dealers Found</h3></div></td></tr>
                )}
                {filtered.map(d => (
                  <tr key={d._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '12px' }}>{d.name?.[0]?.toUpperCase()}</div>
                        <div><div style={{ fontWeight: 500 }}>{d.name}</div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{d.email}</div></div>
                      </div>
                    </td>
                    <td>{d.companyName || '—'}</td>
                    <td>{d.phone}</td>
                    <td>{[d.area, d.city].filter(Boolean).join(', ') || '—'}</td>
                    <td style={{ color: d.outstandingBalance > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>
                      ₹{(d.outstandingBalance || 0).toLocaleString('en-IN')}
                    </td>
                    <td><span className={`badge ${d.isActive ? 'badge-converted' : 'badge-lost'}`}>{d.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn-icon" onClick={() => openEdit(d)} title="Edit"><Edit2 size={14} /></button>
                        <button className="btn-icon" onClick={() => handleDelete(d._id)} title="Delete" style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2>{editing ? 'Edit Dealer' : 'Add New Dealer'}</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input className="form-control" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email *</label>
                    <input type="email" className="form-control" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required disabled={!!editing} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{editing ? 'New Password (leave blank)' : 'Password *'}</label>
                    <input type="password" className="form-control" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required={!editing} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone *</label>
                    <input className="form-control" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Company Name</label>
                    <input className="form-control" value={form.companyName} onChange={e => setForm(p => ({ ...p, companyName: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">GST Number</label>
                    <input className="form-control" value={form.gstNumber} onChange={e => setForm(p => ({ ...p, gstNumber: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Area</label>
                    <input className="form-control" value={form.area} onChange={e => setForm(p => ({ ...p, area: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input className="form-control" value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Create Dealer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
