import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Plus, Ticket, X, MessageSquare } from 'lucide-react';

const getBadge = s => ({ Open: 'badge-open', 'In Progress': 'badge-inprogress', Resolved: 'badge-resolved', Closed: 'badge-muted' }[s] || 'badge-new');
const CATEGORIES = ['Payment Issue', 'Order Issue', 'Product Issue', 'Technical Support', 'Other'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
const EMPTY = { subject: '', description: '', category: 'Other', priority: 'Medium' };

export default function DealerTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [replyText, setReplyText] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/tickets').then(r => setTickets(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.post('/tickets', form);
      toast.success('Ticket submitted'); setShowModal(false); setForm(EMPTY); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const sendReply = async () => {
    if (!replyText.trim()) return;
    setSaving(true);
    try {
      const res = await api.post(`/tickets/${selected._id}/reply`, { message: replyText });
      setSelected(res.data); setReplyText(''); load();
    } catch { toast.error('Failed'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="page-header flex-between">
        <div><h1>Support Tickets</h1><p>Raise and track your support requests</p></div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} />New Ticket</button>
      </div>

      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        <div className="card">
          {loading ? <div className="loading-spinner"><div className="spinner" /></div> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {tickets.length === 0 && <div className="empty-state"><Ticket size={36} /><h3>No Tickets</h3><p>Raise a ticket if you need help</p></div>}
              {tickets.map(t => (
                <div key={t._id} onClick={() => setSelected(t)} style={{
                  padding: '14px', border: `1px solid ${selected?._id === t._id ? 'var(--primary)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'var(--transition)',
                  background: selected?._id === t._id ? 'rgba(99,102,241,0.08)' : 'var(--bg-base)'
                }}>
                  <div className="flex-between" style={{ marginBottom: '6px' }}>
                    <span style={{ 
                      fontWeight: 600, fontSize: '14px', 
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', 
                      maxWidth: '70%', display: 'block' 
                    }}>
                      {t.subject}
                    </span>
                    <span className={`badge ${getBadge(t.status)}`} style={{ flexShrink: 0 }}>{t.status}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t.ticketNumber} · {t.category} · {t.priority} Priority
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selected ? (
          <div className="card" style={{ position: 'sticky', top: '20px' }}>
            <div className="flex-between mb-4">
              <div><h3 style={{ fontSize: '16px' }}>{selected.subject}</h3>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{selected.ticketNumber} · <span className={`badge ${getBadge(selected.status)}`}>{selected.status}</span></div>
              </div>
              <button className="btn-icon" onClick={() => setSelected(null)}><X size={18} /></button>
            </div>
            <div style={{ background: 'var(--bg-base)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', marginBottom: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>
              {selected.description}
            </div>
            <h4 style={{ fontSize: '13px', marginBottom: '10px', color: 'var(--text-secondary)' }}>Replies ({selected.replies?.length || 0})</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto', marginBottom: '14px' }}>
              {selected.replies?.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No replies yet</p>}
              {selected.replies?.map((r, i) => (
                <div key={i} style={{ background: 'var(--bg-base)', borderRadius: 'var(--radius-sm)', padding: '10px 12px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{r.sentByName} · {new Date(r.sentAt).toLocaleString('en-IN')}</div>
                  <div style={{ fontSize: '14px' }}>{r.message}</div>
                </div>
              ))}
            </div>
            <textarea className="form-control" rows={3} placeholder="Add a reply..." value={replyText} onChange={e => setReplyText(e.target.value)} style={{ marginBottom: '10px' }} />
            <button className="btn btn-primary btn-sm" onClick={sendReply} disabled={saving}><MessageSquare size={14} />{saving ? 'Sending...' : 'Send'}</button>
          </div>
        ) : (
          <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '280px' }}>
            <div className="empty-state"><Ticket size={36} /><h3>Select a ticket to view</h3></div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2>Raise Support Ticket</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Subject *</label>
                  <input className="form-control" value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} required />
                </div>
                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select className="form-control" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select className="form-control" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                      {PRIORITIES.map(pr => <option key={pr}>{pr}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description *</label>
                  <textarea className="form-control" rows={5} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} required placeholder="Describe your issue in detail..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Submitting...' : 'Submit Ticket'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
