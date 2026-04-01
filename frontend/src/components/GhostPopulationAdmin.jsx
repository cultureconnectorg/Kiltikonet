import React, { useState, useEffect, useCallback } from 'react';
import { Users, RefreshCw, Power, PowerOff, Trash2, BarChart3, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const GhostPopulationAdmin = () => {
  const [stats, setStats] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, p] = await Promise.all([
        axios.get(`${API}/ghost/admin/stats`),
        axios.get(`${API}/ghost/admin/profiles`),
      ]);
      setStats(s.data);
      setProfiles(p.data.profiles || []);
    } catch { toast.error('Erreur chargement Ghost'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleSystem = async (active) => {
    try {
      await axios.post(`${API}/ghost/admin/toggle`, { active });
      toast.success(active ? 'Système Ghost activé' : 'Système Ghost désactivé');
      load();
    } catch { toast.error('Erreur'); }
  };

  const retireGhost = async (id, name) => {
    if (!window.confirm(`Retirer ${name} du réseau ?`)) return;
    try {
      await axios.post(`${API}/ghost/admin/retire/${id}`);
      toast.success(`${name} retiré`);
      load();
    } catch { toast.error('Erreur'); }
  };

  const checkRetirement = async () => {
    try {
      const res = await axios.post(`${API}/ghost/engine/check-retirement`);
      toast.success(`Vérification terminée. ${res.data.newly_retiring?.length || 0} en retrait.`);
      load();
    } catch { toast.error('Erreur'); }
  };

  if (loading) return <div className="flex items-center justify-center p-16"><div className="w-8 h-8 border-2 border-t-transparent border-[#8B5CF6] rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 space-y-6" data-testid="ghost-population-admin">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Fantômes actifs" value={stats?.active_ghosts || 0} color="#8B5CF6" sub={`Cible : ${stats?.target_ghosts || 0}`} />
        <StatCard icon={TrendingUp} label="Posts cette semaine" value={stats?.ghost_posts_this_week || 0} color="#D4A84B" />
        <StatCard icon={BarChart3} label="Taux remplacement" value={stats?.replacement_rate || '0/0'} color="#4A5D4E" sub="Fantôme → Vrai" />
        <StatCard icon={Users} label="Vrais utilisateurs" value={stats?.real_users || 0} color="#C4714A" />
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center p-4 bg-cream border border-lightborder rounded-lg">
        <span className="text-sm font-syne text-charcoal font-bold">Contrôles :</span>
        {stats?.system_active ? (
          <Button onClick={() => toggleSystem(false)} variant="outline" className="text-sm" data-testid="ghost-toggle-off">
            <PowerOff className="w-4 h-4 mr-2 text-red-500" /> Désactiver le système
          </Button>
        ) : (
          <Button onClick={() => toggleSystem(true)} variant="outline" className="text-sm" data-testid="ghost-toggle-on">
            <Power className="w-4 h-4 mr-2 text-green-500" /> Activer le système
          </Button>
        )}
        <Button onClick={checkRetirement} variant="outline" className="text-sm" data-testid="ghost-check-retirement">
          <RefreshCw className="w-4 h-4 mr-2" /> Vérifier les retraits
        </Button>
        <Button onClick={load} variant="outline" className="text-sm">
          <RefreshCw className="w-4 h-4 mr-2" /> Rafraîchir
        </Button>
      </div>

      {/* Seuils */}
      <div className="p-4 bg-[#F9F7F4] border border-lightborder rounded-lg">
        <h3 className="text-sm font-syne font-bold text-charcoal mb-3 flex items-center gap-2"><AlertCircle className="w-4 h-4 text-[#8B5CF6]" /> Seuils de retrait automatique</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
          {[['0–50 users', '20 ghosts'], ['50–150', '15'], ['150–300', '10'], ['300–500', '5'], ['500+', '0']].map(([range, count]) => (
            <div key={range} className="p-2 rounded bg-white border text-center">
              <p className="text-charcoal/70">{range}</p>
              <p className="font-bold text-[#8B5CF6]">{count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Profiles Table */}
      <div className="bg-white border border-lightborder rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-lightborder bg-cream">
          <h3 className="text-sm font-syne font-bold text-charcoal">Profils fantômes — {profiles.length} au total</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-cream/50">
              <tr>
                <th className="px-4 py-3 text-left text-charcoal/70">Nom</th>
                <th className="px-4 py-3 text-left text-charcoal/70">Type</th>
                <th className="px-4 py-3 text-left text-charcoal/70">Territoire</th>
                <th className="px-4 py-3 text-left text-charcoal/70">FREK-ID</th>
                <th className="px-4 py-3 text-center text-charcoal/70">Score</th>
                <th className="px-4 py-3 text-center text-charcoal/70">Statut</th>
                <th className="px-4 py-3 text-center text-charcoal/70">Action</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map(g => (
                <tr key={g.id} className="border-t border-lightborder hover:bg-cream/30" data-testid={`ghost-row-${g.id}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ background: g.active ? '#8B5CF6' : '#999' }}>
                        {g.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2)}
                      </div>
                      <span className="font-medium text-charcoal">{g.full_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-charcoal/70">{g.profile_type}</td>
                  <td className="px-4 py-3 text-charcoal/70">{g.country}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[#8B5CF6]">{g.frek_id}</td>
                  <td className="px-4 py-3 text-center font-semibold text-charcoal">{g.cultural_impact_score}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      g.active && !g.retiring ? 'bg-green-100 text-green-700' :
                      g.retiring ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {g.active && !g.retiring ? 'Actif' : g.retiring ? 'En retrait' : 'Retiré'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {g.active && (
                      <button onClick={() => retireGhost(g.id, g.full_name)}
                        className="p-2 rounded hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                        aria-label={`Retirer ${g.full_name}`} data-testid={`retire-${g.id}`}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color, sub }) => (
  <div className="p-4 bg-white border border-lightborder rounded-lg">
    <div className="flex items-center gap-2 mb-2">
      <Icon className="w-5 h-5" style={{ color }} />
      <span className="text-xs font-syne text-charcoal/60 uppercase">{label}</span>
    </div>
    <p className="text-2xl font-black" style={{ color }}>{value}</p>
    {sub && <p className="text-xs text-charcoal/40 mt-1">{sub}</p>}
  </div>
);

export default GhostPopulationAdmin;
