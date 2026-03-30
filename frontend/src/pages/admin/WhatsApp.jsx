import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { MessageCircle, Send, Users, History, CheckCircle2 } from 'lucide-react';

export default function AdminWhatsApp() {
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [selectedDealers, setSelectedDealers] = useState([]);
  const [sending, setSending] = useState(false);
  const [logs, setLogs] = useState([
    { id: 1, type: 'Payment Reminder', count: 12, date: new Date().toISOString(), status: 'Delivered' },
    { id: 2, type: 'Scheme Broadcast', count: 45, date: new Date(Date.now() - 86400000).toISOString(), status: 'Delivered' },
    { id: 3, type: 'Lead Assignment Alert', count: 1, date: new Date(Date.now() - 172800000).toISOString(), status: 'Read' },
  ]);

  useEffect(() => {
    api.get('/dealers').then(r => setDealers(r.data)).finally(() => setLoading(false));
  }, []);

  const handleSend = () => {
    if (!message.trim()) return toast.error('Please enter a message');
    if (selectedDealers.length === 0) return toast.error('Select at least one dealer');

    setSending(true);
    // Mock API call for WhatsApp integration
    setTimeout(() => {
      setSending(false);
      toast.success(`WhatsApp message queued for ${selectedDealers.length} dealer(s)`);
      setLogs([{ id: Date.now(), type: 'Custom Broadcast', count: selectedDealers.length, date: new Date().toISOString(), status: 'Queued' }, ...logs]);
      setMessage('');
      setSelectedDealers([]);
    }, 1500);
  };

  const selectAll = () => {
    if (selectedDealers.length === dealers.length) setSelectedDealers([]);
    else setSelectedDealers(dealers.map(d => d._id));
  };

  const toggleDealer = (id) => {
    if (selectedDealers.includes(id)) setSelectedDealers(selectedDealers.filter(dId => dId !== id));
    else setSelectedDealers([...selectedDealers, id]);
  };

  return (
    <div>
      <div className="page-header flex-between" style={{ alignItems: 'flex-start' }}>
        <div>
          <h1>WhatsApp Automation</h1>
          <p>Send automated reminders, schemes, and lead notifications directly to dealers</p>
        </div>
        <div className="badge badge-converted" style={{ display: 'flex', gap: '8px', padding: '8px 16px', fontSize: '13px' }}>
          <CheckCircle2 size={16} /> WhatsApp Cloud API Connected
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3 style={{ marginBottom: '16px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageCircle size={18} color="#25D366" /> New Broadcast
          </h3>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Select Recipients ({selectedDealers.length} Selected)</span>
              <a href="#" onClick={(e) => { e.preventDefault(); selectAll(); }} style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                {selectedDealers.length === dealers.length ? 'Deselect All' : 'Select All'}
              </a>
            </label>
            <div style={{ maxHeight: '200px', overflowY: 'auto', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px' }}>
              {loading ? <div className="loading-spinner" style={{ padding: '20px' }}><div className="spinner" /></div> : dealers.map(d => (
                <label key={d._id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', cursor: 'pointer', borderRadius: '4px', ':hover': { background: 'var(--bg-hover)' } }}>
                  <input type="checkbox" checked={selectedDealers.includes(d._id)} onChange={() => toggleDealer(d._id)} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: '14px' }}>{d.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{d.phone} · {d.companyName}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Message Content</label>
            <textarea className="form-control" rows={6} placeholder={`Hello {{dealer_name}},\n\nHere is an update on your recent leads...`} value={message} onChange={e => setMessage(e.target.value)} />
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Supports variables: `{"{{"}dealer_name{"}}"}` , `{"{{"}outstanding_balance{"}}"}`</p>
          </div>
          <button className="btn btn-primary" onClick={handleSend} disabled={sending} style={{ width: '100%', justifyContent: 'center', background: '#25D366' }}>
            <Send size={16} /> {sending ? 'Sending Broadcast...' : 'Send via WhatsApp'}
          </button>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '16px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={18} /> Automation Logs
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            The system automatically sends daily payment reminders to dealers with outstanding balances &gt; ₹0 at 10:00 AM. 
            Lead assignment alerts are sent instantly.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {logs.map(log => (
              <div key={log.id} style={{ padding: '14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                <div className="flex-between mb-4" style={{ marginBottom: '6px' }}>
                  <span style={{ fontWeight: 600, fontSize: '14px' }}>{log.type}</span>
                  <span className={`badge ${log.status === 'Queued' ? 'badge-pending' : 'badge-converted'}`}>{log.status}</span>
                </div>
                <div className="flex-between">
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(log.date).toLocaleString('en-IN')}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={12} /> {log.count} Recipients</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
