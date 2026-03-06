import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, DollarSign, TrendingUp, TrendingDown, FileText, Plus, Edit2, Save, PieChart } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const COLORS = {
  charbon: '#1C1A14',
  terracotta: '#C4714A',
  gold: '#D4A84B',
  green: '#4CAF50',
  red: '#ef4444'
};

const WorkspaceWudy = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('budget');
  const [budget, setBudget] = useState({
    previsionnel: {
      revenus: [
        { id: 1, label: 'Subvention CTM', montant: 50000, type: 'subvention' },
        { id: 2, label: 'SACEM', montant: 15000, type: 'subvention' },
        { id: 3, label: 'Billetterie prevue', montant: 25000, type: 'billetterie' },
        { id: 4, label: 'Partenariats', montant: 30000, type: 'partenariat' }
      ],
      depenses: [
        { id: 1, label: 'Cachets artistes', montant: 35000, type: 'artistes' },
        { id: 2, label: 'Location materiel', montant: 20000, type: 'technique' },
        { id: 3, label: 'Communication', montant: 10000, type: 'com' },
        { id: 4, label: 'Logistique', montant: 15000, type: 'logistique' },
        { id: 5, label: 'Securite', montant: 8000, type: 'securite' },
        { id: 6, label: 'Divers', montant: 5000, type: 'divers' }
      ]
    },
    reel: {
      revenus: [
        { id: 1, label: 'Subvention CTM', montant: 50000, encaisse: true },
        { id: 2, label: 'SACEM', montant: 0, encaisse: false }
      ],
      depenses: [
        { id: 1, label: 'Acompte sono', montant: 5000, paye: true },
        { id: 2, label: 'Graphisme', montant: 2500, paye: true }
      ]
    }
  });

  useEffect(() => {
    axios.post(`${API}/workspace/log`, {
      user: 'Wudy',
      role: 'finance',
      action: 'view',
      details: 'Acces workspace comptabilite'
    });
  }, []);

  const handleLogout = async () => {
    await axios.post(`${API}/workspace/logout`, { user: 'Wudy', role: 'finance' });
    sessionStorage.removeItem('workspace_user');
    navigate('/admin');
  };

  const totalRevenusPrev = budget.previsionnel.revenus.reduce((sum, r) => sum + r.montant, 0);
  const totalDepensesPrev = budget.previsionnel.depenses.reduce((sum, d) => sum + d.montant, 0);
  const soldePrev = totalRevenusPrev - totalDepensesPrev;
  
  const totalRevenusReel = budget.reel.revenus.reduce((sum, r) => sum + r.montant, 0);
  const totalDepensesReel = budget.reel.depenses.reduce((sum, d) => sum + d.montant, 0);
  const soldeReel = totalRevenusReel - totalDepensesReel;

  const formatMontant = (montant) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(montant);
  };

  return (
    <div className="min-h-screen" style={{ background: COLORS.charbon, fontFamily: "'Syne', sans-serif" }}>
      {/* Header */}
      <header className="sticky top-0 z-50 px-6 py-4" style={{ background: '#2A2820', borderBottom: `1px solid ${COLORS.green}30` }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
              style={{ background: COLORS.green, color: '#fff' }}>
              WD
            </div>
            <div>
              <div className="font-bold text-sm" style={{ color: COLORS.green }}>WUDY</div>
              <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Comptabilite</div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} style={{ color: 'rgba(255,255,255,0.5)' }}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="rounded-lg p-4" style={{ background: '#2A2820', border: `1px solid ${COLORS.green}20` }}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4" style={{ color: COLORS.green }} />
              <span className="text-xs uppercase" style={{ color: 'rgba(255,255,255,0.5)' }}>Revenus prev.</span>
            </div>
            <div className="text-xl font-bold" style={{ color: COLORS.green }}>{formatMontant(totalRevenusPrev)}</div>
          </div>
          <div className="rounded-lg p-4" style={{ background: '#2A2820', border: `1px solid ${COLORS.red}20` }}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4" style={{ color: COLORS.red }} />
              <span className="text-xs uppercase" style={{ color: 'rgba(255,255,255,0.5)' }}>Depenses prev.</span>
            </div>
            <div className="text-xl font-bold" style={{ color: COLORS.red }}>{formatMontant(totalDepensesPrev)}</div>
          </div>
          <div className="rounded-lg p-4" style={{ background: '#2A2820', border: `1px solid ${COLORS.gold}20` }}>
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4" style={{ color: COLORS.gold }} />
              <span className="text-xs uppercase" style={{ color: 'rgba(255,255,255,0.5)' }}>Solde prev.</span>
            </div>
            <div className="text-xl font-bold" style={{ color: soldePrev >= 0 ? COLORS.green : COLORS.red }}>{formatMontant(soldePrev)}</div>
          </div>
          <div className="rounded-lg p-4" style={{ background: '#2A2820', border: `1px solid ${COLORS.terracotta}20` }}>
            <div className="flex items-center gap-2 mb-2">
              <PieChart className="w-4 h-4" style={{ color: COLORS.terracotta }} />
              <span className="text-xs uppercase" style={{ color: 'rgba(255,255,255,0.5)' }}>Encaisse</span>
            </div>
            <div className="text-xl font-bold" style={{ color: COLORS.terracotta }}>{formatMontant(soldeReel)}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'budget', label: 'Budget Previsionnel', icon: FileText },
            { id: 'reel', label: 'Budget Reel', icon: DollarSign },
            { id: 'documents', label: 'Documents', icon: FileText }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
              style={{ 
                background: activeTab === tab.id ? COLORS.green : 'rgba(255,255,255,0.05)',
                color: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.5)'
              }}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="grid grid-cols-2 gap-6">
          {/* Revenus */}
          <div className="rounded-lg p-5" style={{ background: '#2A2820', border: `1px solid ${COLORS.green}20` }}>
            <h2 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: COLORS.green }}>
              {activeTab === 'budget' ? 'Revenus Previsionnels' : 'Revenus Encaisses'}
            </h2>
            <div className="space-y-3">
              {(activeTab === 'budget' ? budget.previsionnel.revenus : budget.reel.revenus).map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div>
                    <div className="text-sm text-white">{item.label}</div>
                    <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{item.type}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold" style={{ color: COLORS.green }}>{formatMontant(item.montant)}</div>
                    {item.encaisse !== undefined && (
                      <div className="text-xs" style={{ color: item.encaisse ? COLORS.green : COLORS.gold }}>
                        {item.encaisse ? 'Encaisse' : 'En attente'}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <span className="font-bold text-white">TOTAL</span>
              <span className="text-xl font-bold" style={{ color: COLORS.green }}>
                {formatMontant(activeTab === 'budget' ? totalRevenusPrev : totalRevenusReel)}
              </span>
            </div>
          </div>

          {/* Depenses */}
          <div className="rounded-lg p-5" style={{ background: '#2A2820', border: `1px solid ${COLORS.red}20` }}>
            <h2 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: COLORS.red }}>
              {activeTab === 'budget' ? 'Depenses Previsionnelles' : 'Depenses Reelles'}
            </h2>
            <div className="space-y-3">
              {(activeTab === 'budget' ? budget.previsionnel.depenses : budget.reel.depenses).map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div>
                    <div className="text-sm text-white">{item.label}</div>
                    <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{item.type}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold" style={{ color: COLORS.red }}>{formatMontant(item.montant)}</div>
                    {item.paye !== undefined && (
                      <div className="text-xs" style={{ color: item.paye ? COLORS.green : COLORS.gold }}>
                        {item.paye ? 'Paye' : 'A payer'}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <span className="font-bold text-white">TOTAL</span>
              <span className="text-xl font-bold" style={{ color: COLORS.red }}>
                {formatMontant(activeTab === 'budget' ? totalDepensesPrev : totalDepensesReel)}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WorkspaceWudy;
