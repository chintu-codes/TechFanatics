import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Search, MessageSquare, Edit2, X } from 'lucide-react';

const STATUSES = ['New', 'Contacted', 'Converted', 'Lost', 'Follow-Up'];
const getBadge = s => ({ New: 'badge-new', Contacted: 'badge-contacted', Converted: 'badge-converted', Lost: 'badge-lost', 'Follow-Up': 'badge-followup' }[s] || 'badge-new');

export default function DealerLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [editing, setEditing] = useState(null);
  const [editStatus, setEditStatus] = useState('');
  const [noteModal, setNoteModal] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/leads').then(r => setLeads(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleStatusUpdate = async () => {
    setSaving(true);
    try {
      await api.put(`/leads/${editing._id}`, { ...editing, status: editStatus });
      toast.success('Lead updated'); setEditing(null); load();
    } catch { toast.error('Failed'); }
    finally { setSaving(false); }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    try {
      await api.post(`/leads/${noteModal._id}/notes`, { text: noteText });
      toast.success('Note added'); setNoteModal(null); setNoteText(''); load();
    } catch { toast.error('Failed'); }
  };

  const filtered = leads.filter(l => {
    const matchSearch = l.customerName?.toLowerCase().includes(search.toLowerCase()) || l.phone?.includes(search);
    const matchStatus = filterStatus ? l.status === filterStatus : true;
    return matchSearch && matchStatus;
  });

  return (
    <div>
      <div className="page-header">
        <h1>My Leads</h1>
        <p>All leads assigned to you. Update status and add notes.</p>
      </div>

      <div className="card">
        <div className="flex gap-3 mb-4" style={{ flexWrap: 'wrap' }}>
          <div className="search-bar" style={{ maxWidth: '280px', flex: 1 }}>
            <Search size={16} />
            <input className="form-control" placeholder="Search leads..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="form-control" style={{ maxWidth: '180px' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', alignSelf: 'center' }}>{filtered.length} leads</span>
        </div>

        {loading ? <div className="loading-spinner"><div className="spinner" /></div> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Customer</th><th>Area</th><th>Requirement</th><th>Status</th><th>Follow-up</th><th>Notes</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>No leads found</td></tr>}
                {filtered.map(l => (
                  <tr key={l._id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{l.customerName}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{l.phone}</div>
                    </td>
                    <td>{l.area}{l.city ? `, ${l.city}` : ''}</td>
                    <td style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '13px' }}>
                      {l.requirementDetails || l.productInterest || '—'}
                    </td>
                    <td><span className={`badge ${getBadge(l.status)}`}>{l.status}</span></td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {l.followUpDate ? new Date(l.followUpDate).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{l.notes?.length || 0}</td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn-icon" title="Update Status" onClick={() => { setEditing(l); setEditStatus(l.status); }}><Edit2 size={14} /></button>
                        <button className="btn-icon" title="Add Note" onClick={() => setNoteModal(l)}><MessageSquare size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setEditing(null)}>
          <div className="modal" style={{ maxWidth: '380px' }}>
            <div className="modal-header">
              <h2>Update Lead Status</h2>
              <button className="btn-icon" onClick={() => setEditing(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '14px', color: 'var(--text-secondary)', fontSize: '14px' }}>Lead: <strong>{editing.customerName}</strong></p>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-control" value={editStatus} onChange={e => setEditStatus(e.target.value)}>
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
              <button className="btn btn-primary" disabled={saving} onClick={handleStatusUpdate}>{saving ? 'Saving...' : 'Update'}</button>
            </div>
          </div>
        </div>
      )}

      {noteModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setNoteModal(null)}>
          <div className="modal" style={{ maxWidth: '380px' }}>
            <div className="modal-header">
              <h2>Add Note</h2>
              <button className="btn-icon" onClick={() => setNoteModal(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '14px', color: 'var(--text-secondary)', fontSize: '14px' }}>{noteModal.customerName}</p>
              <textarea className="form-control" rows={4} value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Enter your note..." />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setNoteModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAddNote}>Save Note</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
