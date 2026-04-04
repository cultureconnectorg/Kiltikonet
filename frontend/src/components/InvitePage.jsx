import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

const InvitePage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('validating');
  const [error, setError] = useState('');
  const [role, setRole] = useState('');

  useEffect(() => {
    const validate = async () => {
      try {
        const res = await axios.get(`${API}/api/invite/validate/${token}`, { withCredentials: true });
        if (res.data.success) {
          setRole(res.data.role);
          setStatus('success');
          setTimeout(() => navigate(res.data.redirect || '/espace-pro', { replace: true }), 2000);
        }
      } catch (err) {
        setStatus('error');
        setError(err.response?.data?.detail || 'Invitation invalide ou expiree');
      }
    };
    if (token) validate();
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0b', fontFamily: "'DM Sans', sans-serif" }}>
      <div className="text-center max-w-md px-6">
        {status === 'validating' && (
          <>
            <div className="w-16 h-16 border-3 border-t-transparent rounded-full animate-spin mx-auto mb-6" style={{ borderColor: '#E8D5A0' }} />
            <p className="text-white text-lg">Validation de l'invitation...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ background: 'rgba(232,213,160,0.15)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E8D5A0" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <p className="text-white text-lg font-bold">Bienvenue dans l'equipe !</p>
            <p className="text-sm mt-2" style={{ color: '#72727a' }}>Role : <span style={{ color: '#E8D5A0' }}>{role}</span></p>
            <p className="text-xs mt-1" style={{ color: '#72727a' }}>Redirection en cours...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ background: 'rgba(122,26,26,0.3)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f08080" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </div>
            <p className="text-white text-lg font-bold">{error}</p>
            <button onClick={() => navigate('/')} className="mt-6 px-6 py-3 rounded-xl text-sm font-bold" style={{ background: '#E8D5A0', color: '#0a0a0b' }} data-testid="invite-retry-btn">
              Retourner a l'accueil
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default InvitePage;
