import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Gift, CalendarDays, Target } from 'lucide-react';

export default function DealerSchemes() {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.get('/schemes').then(r => setSchemes(r.data)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const fmt = n => `₹${n.toLocaleString('en-IN')}`;

  return (
    <div>
      <div className="page-header">
        <h1>Incentives & Schemes</h1>
        <p>Active corporate schemes and targets for additional rewards</p>
      </div>

      {loading ? <div className="loading-spinner"><div className="spinner" /></div> : (
        <div className="grid grid-3">
          {schemes.length === 0 && (
            <div className="card" style={{ gridColumn: '1/-1' }}>
              <div className="empty-state">
                <Gift size={40} />
                <h3>No Active Schemes</h3>
                <p>There are no corporate incentive programs running at the moment.</p>
              </div>
            </div>
          )}
          {schemes.map(s => (
            <div key={s._id} className="card" style={{ borderTop: `4px solid var(--primary)` }}>
              <div className="flex-between mb-4">
                <span className="badge badge-new">{s.type}</span>
                <span style={{ fontWeight: 700, color: 'var(--success)', fontSize: '16px' }}>
                  {s.incentiveType === 'Percentage' ? `${s.incentiveValue}%` : `₹${s.incentiveValue}`}
                </span>
              </div>
              <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>{s.title}</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', minHeight: '40px' }}>
                {s.description || 'Achieve targets to unlock this incentive.'}
              </p>
              
              <div style={{ background: 'var(--bg-base)', borderRadius: 'var(--radius-sm)', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                {s.minLeads > 0 && (
                  <div className="flex-between">
                    <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}><Target size={14} /> Min Leads Target</span>
                    <span style={{ fontWeight: 600 }}>{s.minLeads} Leads</span>
                  </div>
                )}
                {s.minSalesAmount > 0 && (
                  <div className="flex-between">
                    <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}><Target size={14} /> Min Revenue Target</span>
                    <span style={{ fontWeight: 600 }}>{fmt(s.minSalesAmount)}</span>
                  </div>
                )}
                <div className="flex-between pt-2 mt-1" style={{ borderTop: '1px solid var(--border)' }}>
                   <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}><CalendarDays size={14} /> Validity</span>
                   <span style={{ fontSize: '12px' }}>{new Date(s.validFrom).toLocaleDateString()} - {new Date(s.validTo).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
