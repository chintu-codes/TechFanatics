import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { CreditCard, CheckCircle, Shield } from 'lucide-react';

export default function DealerLedger() {
  const { user } = useAuth();
  const [ledger, setLedger] = useState(null);
  const [loading, setLoading] = useState(true);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    api.get(`/payments/ledger/${user._id}`)
      .then(r => setLedger(r.data))
      .finally(() => setLoading(false));
  }, [user._id]);

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  const fmt = n => `₹${(n || 0).toLocaleString('en-IN')}`;
  const balance = ledger?.dealer?.outstandingBalance || 0;

  const handleDemoPayment = async () => {
    setProcessing(true);
    // Simulate network secure processing delay
    setTimeout(async () => {
      try {
        await api.post('/payments/verify', {
          razorpay_order_id: 'order_dummy_demo',
          razorpay_payment_id: `pay_demo_${Date.now()}`,
          razorpay_signature: 'dummy_signature_verified',
          amount: balance
        });
        window.location.reload();
      } catch (err) {
        alert("Demo Payment Error: " + (err.response?.data?.message || err.message));
        setProcessing(false);
      }
    }, 2000);
  };

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h1>Ledger & Payments</h1>
          <p>Your complete payment history and outstanding balance</p>
        </div>
        {balance > 0 && (
          <button className="btn btn-primary" onClick={() => setDemoModalOpen(true)}>
             <CreditCard size={16} /> Pay Outstanding Now
          </button>
        )}
      </div>

      <div className="grid grid-3 mb-6">
        <div className="stat-card" style={{ gridColumn: '1 / 2' }}>
          <div className="stat-icon" style={{ background: balance > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)' }}>
            <CreditCard size={22} color={balance > 0 ? '#ef4444' : '#10b981'} />
          </div>
          <div className="stat-info">
            <h3 style={{ color: balance > 0 ? 'var(--danger)' : 'var(--success)' }}>{fmt(balance)}</h3>
            <p>{balance > 0 ? 'Outstanding Balance Due' : 'No Outstanding Amount'}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.15)' }}><CreditCard size={22} color="#6366f1" /></div>
          <div className="stat-info">
            <h3>{ledger?.payments?.filter(p => p.type === 'Credit').length || 0}</h3>
            <p>Total Credits</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)' }}><CreditCard size={22} color="#f59e0b" /></div>
          <div className="stat-info">
            <h3>{ledger?.payments?.length || 0}</h3>
            <p>Total Transactions</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '16px', fontSize: '15px' }}>Transaction History</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Date</th><th>Type</th><th>Mode</th><th>Amount</th><th>Balance After</th><th>Description</th><th>Reference</th></tr>
            </thead>
            <tbody>
              {(!ledger?.payments || ledger.payments.length === 0) && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>No transactions recorded yet</td></tr>
              )}
              {ledger?.payments?.map(p => (
                <tr key={p._id}>
                  <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>{new Date(p.createdAt).toLocaleDateString('en-IN')}</td>
                  <td><span className={`badge ${p.type === 'Credit' ? 'badge-converted' : 'badge-lost'}`}>{p.type}</span></td>
                  <td style={{ fontSize: '13px' }}>{p.paymentMode}</td>
                  <td style={{ fontWeight: 700, color: p.type === 'Credit' ? 'var(--success)' : 'var(--danger)' }}>
                    {p.type === 'Credit' ? '+' : '-'}{fmt(p.amount)}
                  </td>
                  <td style={{ fontWeight: 600 }}>{fmt(p.balanceAfter)}</td>
                  <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '13px', color: 'var(--text-secondary)' }}>{p.description || '—'}</td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.referenceNumber || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* RAZORPAY DEMO MODAL */}
      {demoModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'var(--bg-card)', padding: '32px', borderRadius: '16px', width: '100%', maxWidth: '400px', border: '1px solid var(--border)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={24} color="#6366f1" />
              </div>
            </div>
            
            <h2 style={{ fontSize: '20px', marginBottom: '8px', color: 'var(--text-primary)' }}>Secure Payment Gateway</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px' }}>TechFanatics Test Infrastructure Data</p>

            <div style={{ background: 'var(--bg-base)', padding: '20px', borderRadius: '8px', marginBottom: '24px', border: '1px solid var(--border)' }}>
               <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Amount to Clear</span>
               <span style={{ display: 'block', fontSize: '32px', fontWeight: '800', color: 'var(--text-primary)' }}>{fmt(balance)}</span>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '24px' }}>
              By confirming, this mock simulation will process your transaction and securely clear the ledger balance on the backend.
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn btn-secondary" 
                style={{ flex: 1, padding: '14px' }}
                onClick={() => setDemoModalOpen(false)} 
                disabled={processing}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1, padding: '14px', background: processing ? '#4f46e5' : '#10b981', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                onClick={handleDemoPayment}
                disabled={processing}
              >
                {processing ? (
                  <>Processing <div className="spinner" style={{ width: '14px', height: '14px', display: 'inline-block' }} /></>
                ) : (
                  <><CheckCircle size={18} /> Confirm Payment</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
