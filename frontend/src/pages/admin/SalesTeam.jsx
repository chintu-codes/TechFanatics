import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Search, Users, X, Activity } from 'lucide-react';

const EMPTY = { name: '', email: '', password: '', phone: '', role: 'sales', isActive: true };

export default function AdminSalesTeam() {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => {
    api.get('/sales').then(r => setTeam(r.data)).finally(() => setLoading(false));
  };
  
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setShowModal(true); };
  const openEdit = (s) => { setEditing(s); setForm({ ...s, password: '' }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/sales/${editing._id}`, form);
        toast.success('Sales Rep updated');
      } else {
        await api.post('/sales', form);
        toast.success('Sales Rep added');
      }
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this sales representative?')) return;
    try {
      await api.delete(`/sales/${id}`);
      toast.success('Removed successfully');
      load();
    } catch {
      toast.error('Failed to remove sales rep');
    }
  };

  const filtered = team.filter(d => d.name?.toLowerCase().includes(search.toLowerCase()) || d.email?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h1>Sales Team Module</h1>
          <p>Manage your internal sales representatives and track their performance</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> Add Sales Rep
        </button>
      </div>

      <div className="grid grid-3 mb-6">
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.15)' }}><Users size={24} color="#6366f1" /></div>
          <div><h3 style={{ fontSize: '24px', fontWeight: 700 }}>{team.length}</h3><p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Active Staff</p></div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)' }}><Activity size={24} color="#10b981" /></div>
          <div><h3 style={{ fontSize: '24px', fontWeight: 700 }}>97</h3><p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Leads Converted (MTD)</p></div>
        </div>
      </div>

      <div className="card">
        <div className="flex-between mb-4">
          <div className="search-bar" style={{ maxWidth: '320px', flex: 1 }}>
            <Search size={16} />
            <input className="form-control" placeholder="Search sales reps..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? <div className="loading-spinner"><div className="spinner" /></div> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Representative</th><th>Contact</th><th>Conversions (MTD)</th><th>Target %</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(d => {
                  const percent = Math.round((d.leadsConverted / d.target) * 100);
                  return (
                    <tr key={d._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '12px' }}>{d.name?.[0]?.toUpperCase()}</div>
                          <div><div style={{ fontWeight: 500 }}>{d.name}</div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{d.email}</div></div>
                        </div>
                      </td>
                      <td>{d.phone}</td>
                      <td style={{ fontWeight: 600 }}>{d.leadsConverted} / {d.target}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1, height: '6px', background: 'var(--bg-hover)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${Math.min(percent, 100)}%`, background: percent >= 100 ? 'var(--success)' : 'var(--primary)' }} />
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: percent >= 100 ? 'var(--success)' : 'var(--text-primary)' }}>{percent}%</span>
                        </div>
                      </td>
                      <td><span className={`badge ${d.isActive ? 'badge-converted' : 'badge-lost'}`}>{d.isActive ? 'Active' : 'Inactive'}</span></td>
                      <td>
                        <div className="flex gap-2">
                          <button className="btn-icon" onClick={() => openEdit(d)} title="Edit"><Edit2 size={14} /></button>
                          <button className="btn-icon" onClick={() => handleDelete(d._id)} title="Delete" style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>{editing ? 'Edit Sales Rep' : 'Add New Sales Rep'}</h2>
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
                    <label className="form-label">Monthly Target (Leads)</label>
                    <input type="number" className="form-control" value={form.target || 50} onChange={e => setForm(p => ({ ...p, target: e.target.value }))} required />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Add Staff'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
