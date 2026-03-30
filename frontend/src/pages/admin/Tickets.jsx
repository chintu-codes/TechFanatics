import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Ticket, X, MessageSquare } from 'lucide-react';

const getBadge = s => ({ Open: 'badge-open', 'In Progress': 'badge-inprogress', Resolved: 'badge-resolved', Closed: 'badge-muted' }[s] || 'badge-new');
const getPriority = p => ({ Low: '#64748b', Medium: '#f59e0b', High: '#ef4444', Urgent: '#dc2626' }[p] || '#64748b');
const STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'];

export default function AdminTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/tickets').then(r => setTickets(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/tickets/${id}/status`, { status });
      toast.success('Status updated');
      setSelected(p => p?._id === id ? { ...p, status } : p);
      load();
    } catch { toast.error('Failed'); }
  };

  const sendReply = async () => {
    if (!replyText.trim()) return;
    setSaving(true);
    try {
      const res = await api.post(`/tickets/${selected._id}/reply`, { message: replyText });
      setSelected(res.data);
      setReplyText('');
      load();
    } catch { toast.error('Failed'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="page-header"><h1>Support Tickets</h1><p>Dealer complaints and support requests</p></div>
      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        <div className="card">
          {loading ? <div className="loading-spinner"><div className="spinner" /></div> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {tickets.length === 0 && <div className="empty-state"><Ticket size={36} /><h3>No Tickets</h3></div>}
              {tickets.map(t => (
                <div key={t._id} onClick={() => setSelected(t)} style={{
                  padding: '14px', border: `1px solid ${selected?._id === t._id ? 'var(--primary)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'var(--transition)',
                  background: selected?._id === t._id ? 'rgba(99,102,241,0.08)' : 'var(--bg-base)'
                }}>
                  <div className="flex-between" style={{ marginBottom: '6px' }}>
                    <span style={{ fontWeight: 600, fontSize: '14px' }}>{t.subject}</span>
                    <span className={`badge ${getBadge(t.status)}`}>{t.status}</span>
                  </div>
                  <div className="flex-between">
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.dealerName} · {t.ticketNumber}</span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: getPriority(t.priority) }}>{t.priority}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selected ? (
          <div className="card" style={{ position: 'sticky', top: '20px' }}>
            <div className="flex-between mb-4">
              <div>
                <h3 style={{ fontSize: '16px' }}>{selected.subject}</h3>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{selected.ticketNumber} · {selected.dealerName}</div>
              </div>
              <button className="btn-icon" onClick={() => setSelected(null)}><X size={18} /></button>
            </div>
            <div style={{ background: 'var(--bg-base)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', marginBottom: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>
              {selected.description}
            </div>
            <div className="form-group">
              <label className="form-label">Update Status</label>
              <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                {STATUSES.map(s => (
                  <button key={s} className={`btn btn-sm ${selected.status === s ? 'btn-primary' : 'btn-secondary'}`} onClick={() => updateStatus(selected._id, s)}>{s}</button>
                ))}
              </div>
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <h4 style={{ fontSize: '13px', marginBottom: '10px', color: 'var(--text-secondary)' }}>Replies ({selected.replies?.length || 0})</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto', marginBottom: '14px' }}>
                {selected.replies?.map((r, i) => (
                  <div key={i} style={{ background: 'var(--bg-base)', borderRadius: 'var(--radius-sm)', padding: '10px 12px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{r.sentByName} · {new Date(r.sentAt).toLocaleString('en-IN')}</div>
                    <div style={{ fontSize: '14px' }}>{r.message}</div>
                  </div>
                ))}
              </div>
              <textarea className="form-control" rows={3} placeholder="Type a reply..." value={replyText} onChange={e => setReplyText(e.target.value)} style={{ marginBottom: '10px' }} />
              <button className="btn btn-primary btn-sm" onClick={sendReply} disabled={saving}><MessageSquare size={14} />{saving ? 'Sending...' : 'Send Reply'}</button>
            </div>
          </div>
        ) : (
          <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
            <div className="empty-state"><Ticket size={40} /><h3>Select a ticket</h3></div>
          </div>
        )}
      </div>
    </div>
  );
}
