import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, BarChart2, Lock, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import InternalMessaging from '../InternalMessaging';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const COLORS = {
  charbon: '#1C1A14',
  terracotta: '#C4714A',
  gold: '#D4A84B',
  gray: '#607D8B'
};

const WorkspaceAnalyst = () => {
  const navigate = useNavigate();

  useEffect(() => {
    axios.post(`${API}/workspace/log`, {
      user: 'Data Analyst',
      role: 'analyst',
      action: 'view',
      details: 'Acces workspace analyst (reserve)'
    });
  }, []);

  const handleLogout = async () => {
    await axios.post(`${API}/workspace/logout`, { user: 'Data Analyst', role: 'analyst' });
    sessionStorage.removeItem('workspace_user');
    navigate('/admin');
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: COLORS.charbon, fontFamily: "'Syne', sans-serif" }}>
      <div className="text-center max-w-md">
        {/* Logo */}
        <div className="w-20 h-20 rounded-xl mx-auto mb-6 flex items-center justify-center"
          style={{ background: `${COLORS.gray}20`, border: `2px dashed ${COLORS.gray}` }}>
          <BarChart2 className="w-10 h-10" style={{ color: COLORS.gray }} />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold mb-2" style={{ color: COLORS.gray, fontFamily: "'Cormorant Garamond', serif" }}>
          Workspace Data Analyst
        </h1>
        
        {/* Status */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={{ background: `${COLORS.gold}20`, border: `1px solid ${COLORS.gold}40` }}>
          <AlertCircle className="w-4 h-4" style={{ color: COLORS.gold }} />
          <span className="text-sm font-bold" style={{ color: COLORS.gold }}>POSTE A POURVOIR</span>
        </div>

        {/* Description */}
        <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Cet espace de travail est reserve pour le futur Data Analyst de l'equipe Culture Connect 2026.
          <br /><br />
          Il inclura des outils d'analyse de donnees, des tableaux de bord et des visualisations pour suivre les performances de l'evenement.
        </p>

        {/* Features preview */}
        <div className="rounded-lg p-5 mb-6 text-left" style={{ background: '#2A2820', border: `1px solid ${COLORS.gray}20` }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: COLORS.gray }}>Fonctionnalites prevues :</h3>
          <ul className="space-y-2 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <li className="flex items-center gap-2">
              <Lock className="w-3 h-3" style={{ color: COLORS.gray }} />
              Tableau de bord analytique
            </li>
            <li className="flex items-center gap-2">
              <Lock className="w-3 h-3" style={{ color: COLORS.gray }} />
              Rapports de frequentation
            </li>
            <li className="flex items-center gap-2">
              <Lock className="w-3 h-3" style={{ color: COLORS.gray }} />
              Analyse des inscriptions
            </li>
            <li className="flex items-center gap-2">
              <Lock className="w-3 h-3" style={{ color: COLORS.gray }} />
              Metriques temps reel
            </li>
          </ul>
        </div>

        {/* Logout */}
        <Button onClick={handleLogout} variant="outline" style={{ borderColor: `${COLORS.gray}40`, color: COLORS.gray }}>
          <LogOut className="w-4 h-4 mr-2" />
          Retour connexion
        </Button>
      </div>
      
      {/* Internal Messaging */}
      <InternalMessaging 
        currentUser={{ id: 'analyst', name: 'Data Analyst', role: 'analyst' }} 
        isFounder={false} 
      />
    </div>
  );
};

export default WorkspaceAnalyst;
