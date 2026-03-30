import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Search, UserPlus, X, MessageSquare, UserCheck } from 'lucide-react';

const STATUSES = ['New', 'Contacted', 'Converted', 'Lost', 'Follow-Up'];
const EMPTY_FORM = { customerName: '', phone: '', email: '', area: '', city: '', requirementDetails: '', productInterest: '', status: 'New', followUpDate: '' };

const getBadge = (status) => {
  const map = { New: 'badge-new', Contacted: 'badge-contacted', Converted: 'badge-converted', Lost: 'badge-lost', 'Follow-Up': 'badge-followup' };
  return map[status] || 'badge-new';
};

export default function AdminLeads() {
  const [leads, setLeads] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [assignDealerId, setAssignDealerId] = useState('');
  const [noteText, setNoteText] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    Promise.all([api.get('/leads'), api.get('/dealers')])
      .then(([lr, dr]) => { setLeads(lr.data); setDealers(dr.data); })
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (l) => { setEditing(l); setForm({ ...l, followUpDate: l.followUpDate ? l.followUpDate.slice(0, 10) : '' }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) { await api.put(`/leads/${editing._id}`, form); toast.success('Lead updated'); }
      else { await api.post('/leads', form); toast.success('Lead created'); }
      setShowModal(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const handleAssign = async () => {
    if (!assignDealerId) return toast.error('Select a dealer');
    try {
      await api.put(`/leads/${selectedLead._id}/assign`, { dealerId: assignDealerId });
      toast.success('Lead assigned'); setShowAssignModal(false); load();
    } catch { toast.error('Failed to assign'); }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    try {
      await api.post(`/leads/${selectedLead._id}/notes`, { text: noteText });
      toast.success('Note added'); setShowNoteModal(false); setNoteText(''); load();
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this lead?')) return;
    try { await api.delete(`/leads/${id}`); toast.success('Deleted'); load(); }
    catch { toast.error('Failed'); }
  };

  const filtered = leads.filter(l => {
    const matchSearch = l.customerName?.toLowerCase().includes(search.toLowerCase()) || l.phone?.includes(search) || l.area?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus ? l.status === filterStatus : true;
    return matchSearch && matchStatus;
  });

  return (
    <div>
      <div className="page-header flex-between">
        <div><h1>Lead Management</h1><p>Track and manage all customer leads across all dealers</p></div>
        <button className="btn btn-primary" onClick={openCreate} id="create-lead-btn"><Plus size={16} />Add Lead</button>
      </div>

      <div className="card">
        <div className="flex-between mb-4 gap-3" style={{ flexWrap: 'wrap' }}>
          <div className="flex gap-3" style={{ flex: 1, flexWrap: 'wrap' }}>
            <div className="search-bar" style={{ maxWidth: '280px', flex: 1 }}>
              <Search size={16} />
              <input className="form-control" placeholder="Search leads..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="form-control" style={{ maxWidth: '180px' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All Statuses</option>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{filtered.length} leads</span>
        </div>

        {loading ? <div className="loading-spinner"><div className="spinner" /></div> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Customer</th><th>Area</th><th>Requirement</th><th>Status</th><th>Assigned To</th><th>Date</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.length === 0 && <tr><td colSpan={7}><div className="empty-state"><UserPlus size={40} /><h3>No Leads Found</h3></div></td></tr>}
                {filtered.map(l => (
                  <tr key={l._id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{l.customerName}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{l.phone}</div>
                    </td>
                    <td>{l.area}{l.city ? `, ${l.city}` : ''}</td>
                    <td style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.requirementDetails || l.productInterest || '—'}</td>
                    <td><span className={`badge ${getBadge(l.status)}`}>{l.status}</span></td>
                    <td>
                      {l.assignedDealerInfo
                        ? <div><div style={{ fontSize: '13px', fontWeight: 500 }}>{l.assignedDealerInfo.name}</div><div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{l.assignedDealerInfo.companyName}</div></div>
                        : <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Unassigned</span>}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(l.createdAt).toLocaleDateString('en-IN')}</td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn-icon" onClick={() => openEdit(l)} title="Edit"><Edit2 size={14} /></button>
                        <button className="btn-icon" title="Assign" onClick={() => { setSelectedLead(l); setAssignDealerId(l.assignedDealer || ''); setShowAssignModal(true); }}><UserCheck size={14} /></button>
                        <button className="btn-icon" title="Add Note" onClick={() => { setSelectedLead(l); setShowNoteModal(true); }}><MessageSquare size={14} /></button>
                        <button className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(l._id)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h2>{editing ? 'Edit Lead' : 'Add New Lead'}</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="form-label">Customer Name *</label>
                    <input className="form-control" value={form.customerName} onChange={e => setForm(p => ({ ...p, customerName: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone *</label>
                    <input className="form-control" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-control" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Area *</label>
                    <input className="form-control" value={form.area} onChange={e => setForm(p => ({ ...p, area: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input className="form-control" value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Product Interest</label>
                    <input className="form-control" value={form.productInterest} onChange={e => setForm(p => ({ ...p, productInterest: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-control" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                      {STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Follow-up Date</label>
                    <input type="date" className="form-control" value={form.followUpDate} onChange={e => setForm(p => ({ ...p, followUpDate: e.target.value }))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Requirement Details</label>
                  <textarea className="form-control" value={form.requirementDetails} onChange={e => setForm(p => ({ ...p, requirementDetails: e.target.value }))} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Create Lead'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAssignModal(false)}>
          <div className="modal" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Assign Lead</h2>
              <button className="btn-icon" onClick={() => setShowAssignModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '16px', color: 'var(--text-secondary)', fontSize: '14px' }}>Assigning lead for: <strong>{selectedLead?.customerName}</strong></p>
              <div className="form-group">
                <label className="form-label">Select Dealer</label>
                <select className="form-control" value={assignDealerId} onChange={e => setAssignDealerId(e.target.value)}>
                  <option value="">-- Select Dealer --</option>
                  {dealers.map(d => <option key={d._id} value={d._id}>{d.name} — {d.area || d.city || d.companyName}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAssignModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAssign}>Assign</button>
            </div>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {showNoteModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowNoteModal(false)}>
          <div className="modal" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Add Note</h2>
              <button className="btn-icon" onClick={() => setShowNoteModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Note</label>
                <textarea className="form-control" rows={4} value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Enter your note..." />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowNoteModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAddNote}>Save Note</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
