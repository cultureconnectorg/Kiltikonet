import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Shield, Ticket, QrCode } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function BadgeActivation() {
  const { qrToken } = useParams();
  const [searchParams] = useSearchParams();
  const token = qrToken || searchParams.get('token');

  const [status, setStatus] = useState('loading');
  const [badge, setBadge] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) { setStatus('error'); setError('QR token manquant'); return; }
    activateBadge();
  }, [token]);

  const activateBadge = async () => {
    try {
      const res = await fetch(`${API_URL}/api/activer-badge/${token}`);
      const data = await res.json();
      if (res.ok) {
        setBadge(data);
        setStatus('success');
      } else {
        setError(data.detail || 'Erreur activation');
        setStatus('error');
      }
    } catch {
      setError('Erreur de connexion');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0C0818' }}>
      <div className="w-full max-w-md" data-testid="badge-activation-page">
        {status === 'loading' && (
          <div className="text-center" data-testid="badge-activation-loading">
            <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4" style={{ color: '#C9A84C' }} />
            <p style={{ color: 'rgba(255,255,255,0.7)' }}>Activation en cours...</p>
          </div>
        )}

        {status === 'success' && badge && (
          <div className="rounded-xl overflow-hidden" style={{ background: '#1a1040', border: '1px solid #3B0764' }}>
            <div className="p-6 text-center" style={{ background: 'linear-gradient(135deg, #3B0764, #6B21A8)' }}>
              <CheckCircle className="w-16 h-16 mx-auto mb-3" style={{ color: '#C9A84C' }} />
              <h1 className="text-2xl font-bold" style={{ color: '#C9A84C' }} data-testid="badge-activation-success">
                Badge Active !
              </h1>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-center p-4 rounded-lg" style={{ background: '#0C0818', border: '1px solid #3B0764' }}>
                <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>VOTRE BADGE</p>
                <p className="text-2xl font-bold" style={{ color: '#C9A84C' }} data-testid="badge-id-display">
                  {badge.badge_id}
                </p>
                <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {badge.type_badge}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <InfoCard icon={<Shield size={18} />} label="Statut" value={badge.statut} />
                <InfoCard icon={<QrCode size={18} />} label="FREK-ID" value={badge.frek_id ? badge.frek_id.substring(0, 12) + '...' : 'N/A'} />
              </div>
              <div className="text-center p-3 rounded-lg" style={{ background: '#0C0818' }}>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  <span style={{ color: '#C9A84C' }}>{badge.prenom} {badge.nom}</span>
                </p>
              </div>
              <p className="text-center text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Presentez ce badge le 22 Mai 2026 au Parc de La Savane
              </p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center p-8 rounded-xl" style={{ background: '#1a1040', border: '1px solid #ff4444' }} data-testid="badge-activation-error">
            <XCircle className="w-16 h-16 mx-auto mb-4" style={{ color: '#ff4444' }} />
            <h2 className="text-xl font-bold mb-2" style={{ color: '#ff4444' }}>Erreur</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)' }}>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoCard({ icon, label, value }) {
  return (
    <div className="p-3 rounded-lg text-center" style={{ background: '#0C0818', border: '1px solid #3B0764' }}>
      <div className="flex items-center justify-center gap-1 mb-1" style={{ color: '#C9A84C' }}>{icon}</div>
      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</p>
      <p className="text-sm font-medium" style={{ color: '#e0d8f0' }}>{value}</p>
    </div>
  );
}
