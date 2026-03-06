import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { 
  Users, Search, RefreshCw, CheckCircle, XCircle, Download, 
  Plus, BarChart3, QrCode, Printer, Eye, Loader2, X,
  MapPin, Building2, Mail, Phone, Clock, Tag, Filter
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import QRCode from 'qrcode';

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION BASEROW
// ═══════════════════════════════════════════════════════════════
const BASEROW_TOKEN = 'BjKPCSpcpif72OtZtsmMFUbZysqlNGiK';
const BASEROW_TABLE = '865847';
const BASEROW_API = 'https://api.baserow.io/api';
const BADGE_BASE_URL = 'https://kiltikonet.fr/badge/';

// ═══════════════════════════════════════════════════════════════
// API HELPERS
// ═══════════════════════════════════════════════════════════════
const baserowGet = async (endpoint) => {
  const res = await fetch(`${BASEROW_API}${endpoint}`, {
    headers: { 'Authorization': `Token ${BASEROW_TOKEN}` }
  });
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.json();
};

const baserowPatch = async (endpoint, data) => {
  const res = await fetch(`${BASEROW_API}${endpoint}`, {
    method: 'PATCH',
    headers: { 
      'Authorization': `Token ${BASEROW_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.json();
};

const baserowPost = async (endpoint, data) => {
  const res = await fetch(`${BASEROW_API}${endpoint}`, {
    method: 'POST',
    headers: { 
      'Authorization': `Token ${BASEROW_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.json();
};

// ═══════════════════════════════════════════════════════════════
// BADGE TYPES & COLORS
// ═══════════════════════════════════════════════════════════════
const BADGE_TYPES = ['VIP', 'Presse', 'Exposant', 'Artiste', 'Benevole', 'Institutionnel'];
const TERRITORIES = ['Martinique', 'Guadeloupe', 'Guyane', 'Haiti', 'France hexagonale', 'Afrique', 'Autre'];
const SECTORS = ['Musique', 'Arts visuels', 'Audiovisuel', 'Danse', 'Numérique', 'Éducation', 'Institutionnel', 'Autre'];

const BADGE_COLORS = {
  'VIP': { bg: 'bg-purple-900/30', border: 'border-purple-500', text: 'text-purple-300' },
  'Presse': { bg: 'bg-teal-900/30', border: 'border-teal-500', text: 'text-teal-300' },
  'Exposant': { bg: 'bg-amber-900/30', border: 'border-amber-500', text: 'text-amber-300' },
  'Artiste': { bg: 'bg-rose-900/30', border: 'border-rose-500', text: 'text-rose-300' },
  'Benevole': { bg: 'bg-green-900/30', border: 'border-green-500', text: 'text-green-300' },
  'Institutionnel': { bg: 'bg-blue-900/30', border: 'border-blue-500', text: 'text-blue-300' },
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export const AccreditationSystem = () => {
  const [activeTab, setActiveTab] = useState('accreditations');
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBadge, setFilterBadge] = useState('');
  const [filterPresence, setFilterPresence] = useState('');
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Badge generator state
  const [badgeProfile, setBadgeProfile] = useState('artiste');
  const [badgeTheme, setBadgeTheme] = useState('beige');
  const [badgeData, setBadgeData] = useState({
    name: '', org: '', extra: '', note: '', access: 'full'
  });
  const [generatedCount, setGeneratedCount] = useState(0);
  const badgeRef = useRef(null);
  
  // ─────────────────────────────────────────────
  // Load all participants from Baserow
  // ─────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      let all = [], page = 1, hasMore = true;
      while (hasMore) {
        const data = await baserowGet(`/database/rows/table/${BASEROW_TABLE}/?user_field_names=true&page=${page}&size=100`);
        all = [...all, ...data.results];
        hasMore = !!data.next;
        page++;
      }
      setParticipants(all);
      setConnected(true);
      toast.success(`${all.length} participants chargés depuis Baserow`);
    } catch (error) {
      setConnected(false);
      toast.error('Erreur de connexion à Baserow');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ─────────────────────────────────────────────
  // Statistics
  // ─────────────────────────────────────────────
  const stats = {
    total: participants.length,
    present: participants.filter(p => p['Statut presence'] === 'Présent').length,
    absent: participants.filter(p => p['Statut presence'] !== 'Présent').length,
    rate: participants.length ? Math.round((participants.filter(p => p['Statut presence'] === 'Présent').length / participants.length) * 100) : 0
  };

  // ─────────────────────────────────────────────
  // Filter participants
  // ─────────────────────────────────────────────
  const filteredParticipants = participants.filter(p => {
    const searchMatch = searchQuery === '' || 
      `${p.Prenom || ''} ${p.Nom || ''} ${p.Organisation || ''}`.toLowerCase().includes(searchQuery.toLowerCase());
    const badgeMatch = filterBadge === '' || filterBadge === 'all' || p['Type de badge'] === filterBadge;
    const presenceMatch = filterPresence === '' || filterPresence === 'all' ||
      (filterPresence === 'present' ? p['Statut presence'] === 'Présent' : p['Statut presence'] !== 'Présent');
    return searchMatch && badgeMatch && presenceMatch;
  });

  // ─────────────────────────────────────────────
  // Validate presence
  // ─────────────────────────────────────────────
  const validatePresence = async (participant) => {
    const heure = new Date().toTimeString().slice(0, 5);
    try {
      await baserowPatch(`/database/rows/table/${BASEROW_TABLE}/${participant.id}/?user_field_names=true`, {
        'Statut presence': 'Présent',
        "Heure d'arrivee": heure
      });
      
      setParticipants(prev => prev.map(p => 
        p.id === participant.id 
          ? { ...p, 'Statut presence': 'Présent', "Heure d'arrivee": heure }
          : p
      ));
      
      if (selectedParticipant?.id === participant.id) {
        setSelectedParticipant({ ...participant, 'Statut presence': 'Présent', "Heure d'arrivee": heure });
      }
      
      toast.success(`${participant.Prenom} ${participant.Nom} validé — ${heure}`);
    } catch (error) {
      toast.error('Erreur de validation');
      console.error(error);
    }
  };

  // ─────────────────────────────────────────────
  // Add new participant
  // ─────────────────────────────────────────────
  const [newParticipant, setNewParticipant] = useState({
    Prenom: '', Nom: '', Organisation: '', Email: '', Telephone: '',
    'Type de badge': 'Artiste', "Territoire d'origine": 'Martinique',
    "Secteur d'activite": 'Musique'
  });

  const addParticipant = async () => {
    try {
      const data = {
        ...newParticipant,
        'Statut presence': 'Absent',
        'kiltikonet inscrit': 'Non',
        'Consentement RGPD': 'Oui'
      };
      
      const created = await baserowPost(`/database/rows/table/${BASEROW_TABLE}/?user_field_names=true`, data);
      setParticipants(prev => [...prev, created]);
      setShowAddForm(false);
      setNewParticipant({
        Prenom: '', Nom: '', Organisation: '', Email: '', Telephone: '',
        'Type de badge': 'Artiste', "Territoire d'origine": 'Martinique',
        "Secteur d'activite": 'Musique'
      });
      toast.success(`${data.Prenom} ${data.Nom} ajouté`);
    } catch (error) {
      toast.error('Erreur lors de l\'ajout');
      console.error(error);
    }
  };

  // ─────────────────────────────────────────────
  // Load participant to badge generator
  // ─────────────────────────────────────────────
  const loadToBadge = (participant) => {
    setBadgeData({
      name: `${participant.Prenom || ''} ${participant.Nom || ''}`.trim(),
      org: participant.Organisation || '',
      extra: participant['Zones acces'] || '',
      note: '',
      access: 'full'
    });
    
    const profileMap = {
      'VIP': 'delegue', 'Presse': 'presse', 'Exposant': 'exposant',
      'Artiste': 'artiste', 'Benevole': 'delegue', 'Institutionnel': 'institution'
    };
    setBadgeProfile(profileMap[participant['Type de badge']] || 'artiste');
    setActiveTab('badges');
    toast.success(`Badge chargé: ${participant.Prenom} ${participant.Nom}`);
  };

  // ─────────────────────────────────────────────
  // Tab content renderers
  // ─────────────────────────────────────────────
  const tabs = [
    { id: 'accreditations', label: 'Accréditations', icon: Users },
    { id: 'badges', label: 'Générateur Badges', icon: Tag },
    { id: 'qrcodes', label: 'QR Codes', icon: QrCode },
    { id: 'stats', label: 'Statistiques', icon: BarChart3 }
  ];

  return (
    <div className="min-h-screen bg-[#1C1A14] text-white/85">
      {/* Header */}
      <div className="bg-[#2A2820] border-b border-[#D4A84B]/15 p-4 sticky top-0 z-50">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="font-cormorant text-xl font-bold text-[#D4A84B]">
              CULTURE <span className="text-[#C4714A]">CONNECT</span>
            </div>
            <div className="w-px h-5 bg-white/10" />
            <span className="text-xs tracking-widest uppercase text-white/35">
              Système Accréditation
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 text-xs font-mono ${connected ? 'text-green-400' : 'text-red-400'}`}>
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
              {connected ? `${participants.length} participants` : 'Déconnecté'}
            </div>
            <Button 
              onClick={loadAll} 
              disabled={loading}
              size="sm"
              className="bg-[#C4714A] hover:bg-[#A85A38] text-white"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              <span className="ml-2 hidden sm:inline">Recharger</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-[#2A2820] border-b border-[#D4A84B]/15">
        <div className="max-w-7xl mx-auto flex">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 text-xs font-bold tracking-wider uppercase flex items-center gap-2 border-b-2 transition-all ${
                activeTab === tab.id 
                  ? 'text-[#D4A84B] border-[#D4A84B]' 
                  : 'text-white/30 border-transparent hover:text-white/60'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {activeTab === 'accreditations' && (
          <AccreditationsTab 
            participants={filteredParticipants}
            stats={stats}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterBadge={filterBadge}
            setFilterBadge={setFilterBadge}
            filterPresence={filterPresence}
            setFilterPresence={setFilterPresence}
            selectedParticipant={selectedParticipant}
            setSelectedParticipant={setSelectedParticipant}
            validatePresence={validatePresence}
            loadToBadge={loadToBadge}
            showAddForm={showAddForm}
            setShowAddForm={setShowAddForm}
            newParticipant={newParticipant}
            setNewParticipant={setNewParticipant}
            addParticipant={addParticipant}
          />
        )}
        
        {activeTab === 'badges' && (
          <BadgeGeneratorTab 
            badgeProfile={badgeProfile}
            setBadgeProfile={setBadgeProfile}
            badgeTheme={badgeTheme}
            setBadgeTheme={setBadgeTheme}
            badgeData={badgeData}
            setBadgeData={setBadgeData}
            generatedCount={generatedCount}
            setGeneratedCount={setGeneratedCount}
            participants={participants}
            loadToBadge={loadToBadge}
            badgeRef={badgeRef}
          />
        )}
        
        {activeTab === 'qrcodes' && (
          <QRCodesTab participants={participants} />
        )}
        
        {activeTab === 'stats' && (
          <StatisticsTab participants={participants} />
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// TAB 1: ACCREDITATIONS
// ═══════════════════════════════════════════════════════════════
const AccreditationsTab = ({
  participants, stats, searchQuery, setSearchQuery,
  filterBadge, setFilterBadge, filterPresence, setFilterPresence,
  selectedParticipant, setSelectedParticipant, validatePresence,
  loadToBadge, showAddForm, setShowAddForm, newParticipant, 
  setNewParticipant, addParticipant
}) => {
  const getInitials = (p) => ((p.Prenom || '?')[0] + (p.Nom || '?')[0]).toUpperCase();
  const badgeColors = BADGE_COLORS;

  return (
    <div className="flex gap-6">
      {/* Main list */}
      <div className="flex-1">
        {/* Stats bar */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total', value: stats.total, color: 'text-white' },
            { label: 'Présents', value: stats.present, color: 'text-green-400' },
            { label: 'Absents', value: stats.absent, color: 'text-white/30' },
            { label: 'Taux', value: `${stats.rate}%`, color: 'text-[#D4A84B]' }
          ].map(stat => (
            <div key={stat.label} className="bg-white/5 border border-[#D4A84B]/15 rounded-lg p-4 text-center">
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-white/30 uppercase tracking-wider mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Search & Filters */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher nom, organisation..."
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
            />
          </div>
          <Select value={filterBadge} onValueChange={setFilterBadge}>
            <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Type badge" />
            </SelectTrigger>
            <SelectContent className="bg-[#2A2820] border-white/10">
              <SelectItem value="all">Tous badges</SelectItem>
              {BADGE_TYPES.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterPresence} onValueChange={setFilterPresence}>
            <SelectTrigger className="w-32 bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Présence" />
            </SelectTrigger>
            <SelectContent className="bg-[#2A2820] border-white/10">
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="present">Présents</SelectItem>
              <SelectItem value="absent">Absents</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={() => setShowAddForm(true)}
            className="bg-[#8B1A4A] hover:bg-[#6D1238] text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter
          </Button>
        </div>

        {/* Participants table */}
        <div className="bg-white/5 border border-[#D4A84B]/15 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-3 text-xs text-white/50 uppercase tracking-wider">Participant</th>
                <th className="text-left p-3 text-xs text-white/50 uppercase tracking-wider">Badge</th>
                <th className="text-left p-3 text-xs text-white/50 uppercase tracking-wider">Territoire</th>
                <th className="text-left p-3 text-xs text-white/50 uppercase tracking-wider">Présence</th>
                <th className="text-left p-3 text-xs text-white/50 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {participants.map(p => {
                const isPresent = p['Statut presence'] === 'Présent';
                const colors = badgeColors[p['Type de badge']] || badgeColors['Artiste'];
                
                return (
                  <tr 
                    key={p.id} 
                    onClick={() => setSelectedParticipant(p)}
                    className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#8B1A4A] flex items-center justify-center text-xs font-bold text-white">
                          {getInitials(p)}
                        </div>
                        <div>
                          <div className="font-semibold text-sm">{p.Prenom} {p.Nom}</div>
                          <div className="text-xs text-white/30">{p.Organisation || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${colors.bg} ${colors.border} border ${colors.text}`}>
                        {p['Type de badge'] || '—'}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-white/40">{p["Territoire d'origine"] || '—'}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isPresent ? 'bg-green-400' : 'bg-white/20'}`} />
                        <span className="text-xs">{isPresent ? 'Présent' : 'Absent'}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); validatePresence(p); }}
                          disabled={isPresent}
                          className={isPresent ? 'bg-green-600/20 text-green-400' : 'bg-[#C4714A] hover:bg-[#A85A38]'}
                        >
                          {isPresent ? '✓ Validé' : 'Scanner'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => { e.stopPropagation(); loadToBadge(p); }}
                          className="border-[#D4A84B]/30 text-[#D4A84B] hover:bg-[#D4A84B]/10"
                        >
                          Badge
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {participants.length === 0 && (
            <div className="p-12 text-center text-white/20 text-sm font-mono tracking-wider">
              AUCUN RÉSULTAT
            </div>
          )}
        </div>
      </div>

      {/* Sidebar - Selected participant */}
      <div className="w-80 shrink-0">
        {selectedParticipant ? (
          <div className="bg-[#2A2820] border border-[#D4A84B]/15 rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-[#C4714A] uppercase tracking-widest font-bold">Fiche participant</span>
              <button onClick={() => setSelectedParticipant(null)} className="text-white/30 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-[#8B1A4A] flex items-center justify-center text-lg font-bold">
                {((selectedParticipant.Prenom || '?')[0] + (selectedParticipant.Nom || '?')[0]).toUpperCase()}
              </div>
              <div>
                <div className="font-bold">{selectedParticipant.Prenom} {selectedParticipant.Nom}</div>
                <div className="text-sm text-white/40">{selectedParticipant.Organisation || '—'}</div>
              </div>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-white/60">
                <Tag className="w-4 h-4 text-[#C4714A]" />
                <span>{selectedParticipant['Type de badge'] || '—'}</span>
              </div>
              <div className="flex items-center gap-2 text-white/60">
                <Mail className="w-4 h-4 text-[#C4714A]" />
                <span>{selectedParticipant.Email || '—'}</span>
              </div>
              <div className="flex items-center gap-2 text-white/60">
                <MapPin className="w-4 h-4 text-[#C4714A]" />
                <span>{selectedParticipant["Territoire d'origine"] || '—'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${selectedParticipant['Statut presence'] === 'Présent' ? 'bg-green-400' : 'bg-white/20'}`} />
                <span>{selectedParticipant['Statut presence'] === 'Présent' ? `Présent — ${selectedParticipant["Heure d'arrivee"] || ''}` : 'Absent'}</span>
              </div>
            </div>
            
            {selectedParticipant['Statut presence'] !== 'Présent' && (
              <Button 
                onClick={() => validatePresence(selectedParticipant)}
                className="w-full mt-4 bg-[#C4714A] hover:bg-[#A85A38]"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Valider la présence
              </Button>
            )}
            
            <Button 
              onClick={() => loadToBadge(selectedParticipant)}
              variant="outline"
              className="w-full mt-2 border-[#D4A84B]/30 text-[#D4A84B] hover:bg-[#D4A84B]/10"
            >
              Générer le badge
            </Button>
          </div>
        ) : (
          <div className="bg-[#2A2820] border border-[#D4A84B]/15 rounded-lg p-5 text-center text-white/20 text-sm">
            Sélectionnez un participant
          </div>
        )}
        
        {/* Add participant form */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-[#2A2820] border border-[#D4A84B]/15 rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-bold text-[#D4A84B]">Ajouter un participant</span>
                <button onClick={() => setShowAddForm(false)} className="text-white/30 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    value={newParticipant.Prenom}
                    onChange={(e) => setNewParticipant(p => ({ ...p, Prenom: e.target.value }))}
                    placeholder="Prénom"
                    className="bg-white/5 border-white/10 text-white"
                  />
                  <Input
                    value={newParticipant.Nom}
                    onChange={(e) => setNewParticipant(p => ({ ...p, Nom: e.target.value }))}
                    placeholder="Nom"
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <Input
                  value={newParticipant.Organisation}
                  onChange={(e) => setNewParticipant(p => ({ ...p, Organisation: e.target.value }))}
                  placeholder="Organisation"
                  className="bg-white/5 border-white/10 text-white"
                />
                <Input
                  value={newParticipant.Email}
                  onChange={(e) => setNewParticipant(p => ({ ...p, Email: e.target.value }))}
                  placeholder="Email"
                  type="email"
                  className="bg-white/5 border-white/10 text-white"
                />
                <Input
                  value={newParticipant.Telephone}
                  onChange={(e) => setNewParticipant(p => ({ ...p, Telephone: e.target.value }))}
                  placeholder="Téléphone"
                  className="bg-white/5 border-white/10 text-white"
                />
                <Select 
                  value={newParticipant['Type de badge']} 
                  onValueChange={(v) => setNewParticipant(p => ({ ...p, 'Type de badge': v }))}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2A2820] border-white/10">
                    {BADGE_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select 
                  value={newParticipant["Territoire d'origine"]} 
                  onValueChange={(v) => setNewParticipant(p => ({ ...p, "Territoire d'origine": v }))}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2A2820] border-white/10">
                    {TERRITORIES.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-3 mt-6">
                <Button 
                  onClick={() => setShowAddForm(false)}
                  variant="outline"
                  className="flex-1 border-white/10"
                >
                  Annuler
                </Button>
                <Button 
                  onClick={addParticipant}
                  className="flex-1 bg-[#8B1A4A] hover:bg-[#6D1238]"
                >
                  Ajouter
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// TAB 2: BADGE GENERATOR
// ═══════════════════════════════════════════════════════════════
const BadgeGeneratorTab = ({
  badgeProfile, setBadgeProfile, badgeTheme, setBadgeTheme,
  badgeData, setBadgeData, generatedCount, setGeneratedCount,
  participants, loadToBadge, badgeRef
}) => {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [currentQRUrl, setCurrentQRUrl] = useState('');
  const [searchPicker, setSearchPicker] = useState('');
  
  const profiles = [
    { id: 'artiste', label: 'Artiste', color: 'rose' },
    { id: 'delegue', label: 'Délégué', color: 'blue' },
    { id: 'presse', label: 'Presse', color: 'teal' },
    { id: 'exposant', label: 'Exposant', color: 'amber' },
    { id: 'institution', label: 'Institution', color: 'yellow' },
    { id: 'invitation', label: 'Invitation', color: 'purple' }
  ];

  const generateQR = useCallback(async () => {
    const uid = Date.now().toString(36).toUpperCase();
    const url = `${BADGE_BASE_URL}${uid}`;
    setCurrentQRUrl(url);
    
    try {
      const qr = await QRCode.toDataURL(url, {
        width: 100,
        margin: 0,
        color: {
          dark: badgeTheme === 'charbon' ? '#D4A84B' : '#1C1A14',
          light: '#00000000'
        }
      });
      setQrDataUrl(qr);
      setGeneratedCount(c => c + 1);
    } catch (err) {
      console.error('QR generation error:', err);
    }
  }, [badgeTheme, setGeneratedCount]);

  useEffect(() => {
    generateQR();
  }, [badgeData, badgeProfile, badgeTheme, generateQR]);

  const printBadge = () => {
    const printWindow = window.open('', '_blank');
    const badgeHtml = badgeRef.current?.innerHTML || '';
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Space+Mono:wght@400;700&family=Syne:wght@400;700;800&display=swap" rel="stylesheet">
        <style>
          body { margin: 0; padding: 20px; background: ${badgeTheme === 'charbon' ? '#1C1A14' : '#F5EDD8'}; display: flex; justify-content: center; }
          .badge { width: 340px; }
        </style>
      </head>
      <body>${badgeHtml}</body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  const filteredPicker = participants.filter(p => 
    searchPicker === '' || `${p.Prenom} ${p.Nom}`.toLowerCase().includes(searchPicker.toLowerCase())
  ).slice(0, 10);

  const ACCROCHES = {
    artiste: ['VOTRE VOIX APPARTIENT À CE MONDE.', 'Culture Connect vous invite à monter sur scène.'],
    delegue: ['VOTRE MONDE VOUS ATTEND', '500 PROFESSIONNELS ATTENDUS'],
    presse: ['EST ACCRÉDITÉ.E POUR COUVRIR', ''],
    exposant: ['VOTRE MONDE VOUS ATTEND', '500 PROFESSIONNELS ATTENDUS'],
    institution: ['LA MARTINIQUE ACCUEILLE LE MONDE', 'Fort-de-France, capitale culturelle.'],
    invitation: ['Vous êtes invité.e au premier marché professionnel', 'des industries culturelles afro-descendantes']
  };

  const accessLabels = {
    full: 'ACCÈS COMPLET — TOUS SITES',
    artist: 'ARTISTE + BACKSTAGE',
    press: 'PRESSE — ACCÈS TOTAL',
    expo: 'EXPOSANT — PARC LA SAVANE',
    vip: 'VIP — ZONES RÉSERVÉES'
  };

  const badgeTypeLabels = {
    artiste: 'ARTISTE', delegue: 'DÉLÉGUÉ', presse: 'PRESSE',
    exposant: 'EXPOSANT', institution: 'INSTITUTIONNEL', invitation: 'INVITATION'
  };

  const isCharbon = badgeTheme === 'charbon';
  const accroche = ACCROCHES[badgeProfile] || ['', ''];

  return (
    <div className="flex gap-6">
      {/* Sidebar controls */}
      <div className="w-72 shrink-0 space-y-4">
        {/* Participant picker */}
        <div className="bg-[#2A2820] border border-[#D4A84B]/15 rounded-lg p-4">
          <div className="text-xs text-[#C4714A] uppercase tracking-widest mb-3">Depuis Baserow</div>
          <Input
            value={searchPicker}
            onChange={(e) => setSearchPicker(e.target.value)}
            placeholder="Rechercher..."
            className="bg-white/5 border-white/10 text-white mb-2"
          />
          <div className="max-h-40 overflow-y-auto space-y-1">
            {filteredPicker.map(p => (
              <button
                key={p.id}
                onClick={() => loadToBadge(p)}
                className="w-full text-left p-2 rounded hover:bg-white/5 transition-colors flex items-center gap-2"
              >
                <div className="w-7 h-7 rounded-full bg-[#8B1A4A] flex items-center justify-center text-xs font-bold">
                  {((p.Prenom || '?')[0] + (p.Nom || '?')[0]).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm">{p.Prenom} {p.Nom}</div>
                  <div className="text-xs text-white/30">{p['Type de badge']}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Profile selection */}
        <div className="bg-[#2A2820] border border-[#D4A84B]/15 rounded-lg p-4">
          <div className="text-xs text-[#C4714A] uppercase tracking-widest mb-3">Type de badge</div>
          <div className="grid grid-cols-2 gap-2">
            {profiles.map(p => (
              <button
                key={p.id}
                onClick={() => setBadgeProfile(p.id)}
                className={`p-2 rounded border text-xs font-bold transition-all ${
                  badgeProfile === p.id
                    ? 'bg-[#C4714A]/20 border-[#C4714A] text-[#C4714A]'
                    : 'bg-white/5 border-white/10 text-white/40 hover:border-white/30'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Theme */}
        <div className="bg-[#2A2820] border border-[#D4A84B]/15 rounded-lg p-4">
          <div className="text-xs text-[#C4714A] uppercase tracking-widest mb-3">Thème</div>
          <div className="flex gap-2">
            <button
              onClick={() => setBadgeTheme('beige')}
              className={`flex-1 p-2 rounded border text-xs font-bold ${
                badgeTheme === 'beige'
                  ? 'bg-[#F5EDD8] border-[#F5EDD8] text-[#1C1A14]'
                  : 'bg-white/5 border-white/10 text-white/40'
              }`}
            >
              Beige
            </button>
            <button
              onClick={() => setBadgeTheme('charbon')}
              className={`flex-1 p-2 rounded border text-xs font-bold ${
                badgeTheme === 'charbon'
                  ? 'bg-[#1C1A14] border-[#D4A84B] text-[#D4A84B]'
                  : 'bg-white/5 border-white/10 text-white/40'
              }`}
            >
              Charbon
            </button>
          </div>
        </div>

        {/* Manual inputs */}
        <div className="bg-[#2A2820] border border-[#D4A84B]/15 rounded-lg p-4 space-y-3">
          <div className="text-xs text-[#C4714A] uppercase tracking-widest mb-3">Saisie manuelle</div>
          <Input
            value={badgeData.name}
            onChange={(e) => setBadgeData(d => ({ ...d, name: e.target.value }))}
            placeholder="Nom complet"
            className="bg-white/5 border-white/10 text-white"
          />
          <Input
            value={badgeData.org}
            onChange={(e) => setBadgeData(d => ({ ...d, org: e.target.value }))}
            placeholder="Organisation"
            className="bg-white/5 border-white/10 text-white"
          />
          <Input
            value={badgeData.extra}
            onChange={(e) => setBadgeData(d => ({ ...d, extra: e.target.value }))}
            placeholder="Info supplémentaire"
            className="bg-white/5 border-white/10 text-white"
          />
          <Select value={badgeData.access} onValueChange={(v) => setBadgeData(d => ({ ...d, access: v }))}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#2A2820] border-white/10">
              <SelectItem value="full">Accès complet</SelectItem>
              <SelectItem value="artist">Artiste + Backstage</SelectItem>
              <SelectItem value="press">Presse</SelectItem>
              <SelectItem value="expo">Exposant</SelectItem>
              <SelectItem value="vip">VIP</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Actions */}
        <Button onClick={printBadge} className="w-full bg-[#D4A84B] hover:bg-[#B8903A] text-[#1C1A14]">
          <Printer className="w-4 h-4 mr-2" />
          Imprimer / Télécharger
        </Button>
      </div>

      {/* Badge preview */}
      <div className="flex-1 flex flex-col items-center">
        <div className="grid grid-cols-4 gap-4 mb-6 w-full max-w-md">
          <div className="bg-white/5 border border-[#D4A84B]/15 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-white">{generatedCount}</div>
            <div className="text-xs text-white/30 uppercase">Générés</div>
          </div>
          <div className="bg-white/5 border border-[#D4A84B]/15 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-white">0</div>
            <div className="text-xs text-white/30 uppercase">Imprimés</div>
          </div>
          <div className="bg-white/5 border border-[#D4A84B]/15 rounded-lg p-3 text-center col-span-2">
            <div className="text-sm font-mono text-[#C4714A] truncate">{currentQRUrl.split('/').pop()}</div>
            <div className="text-xs text-white/30 uppercase">QR ID actif</div>
          </div>
        </div>

        {/* Badge */}
        <div 
          ref={badgeRef}
          className={`w-[340px] rounded-xl overflow-hidden shadow-2xl ${
            isCharbon ? 'bg-[#1C1A14] text-white' : 'bg-[#F5EDD8] text-[#1C1A14]'
          }`}
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          {/* Top decoration */}
          <div className={`h-2 ${isCharbon ? 'bg-[#C4714A]' : 'bg-[#8B1A4A]'}`} />
          
          {/* Header */}
          <div className="p-4 pb-2">
            <div className={`text-xs font-bold tracking-widest mb-2 ${isCharbon ? 'text-[#D4A84B]' : 'text-[#8B1A4A]'}`}>
              {badgeTypeLabels[badgeProfile]}
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                isCharbon ? 'bg-[#D4A84B] text-[#1C1A14]' : 'bg-[#8B1A4A] text-white'
              }`}>
                CC
              </div>
              <div>
                <div className={`font-bold text-sm ${isCharbon ? 'text-white/85' : 'text-[#1C1A14]'}`}>CULTURE CONNECT</div>
                <div className={`text-xs ${isCharbon ? 'text-[#C4714A]' : 'text-[#8B1A4A]'}`}>kiltikonet.fr</div>
              </div>
            </div>
          </div>

          {/* Tribal pattern */}
          <div className={`text-center text-xs tracking-widest py-1 ${isCharbon ? 'text-[#D4A84B]/30' : 'text-[#8B1A4A]/30'}`}>
            ◈ ◇ ◈ ◇ ◈ ◇ ◈
          </div>

          {/* Body */}
          <div className="px-4 py-3">
            <div className={`text-xs font-bold tracking-wider mb-2 ${isCharbon ? 'text-[#D4A84B]' : 'text-[#C4714A]'}`}>
              {accessLabels[badgeData.access]}
            </div>
            
            <div className={`text-2xl font-bold mb-2 ${isCharbon ? 'text-white' : 'text-[#1C1A14]'}`} style={{ fontFamily: "'Syne', sans-serif" }}>
              {badgeData.name || '[NOM]'}
            </div>
            
            <div className={`text-sm mb-3 ${isCharbon ? 'text-white/60' : 'text-[#1C1A14]/60'}`}>
              {accroche[0]}<br />{accroche[1]}
            </div>

            <div className={`text-lg font-bold mb-1 ${isCharbon ? 'text-white' : 'text-[#1C1A14]'}`} style={{ fontFamily: "'Syne', sans-serif" }}>
              Culture Connect 2026
            </div>
            <div className={`text-xs mb-3 ${isCharbon ? 'text-white/50' : 'text-[#1C1A14]/50'}`}>
              Premier marché professionnel des industries culturelles afro-descendantes.
            </div>

            <div className={`text-xs ${isCharbon ? 'text-[#C4714A]' : 'text-[#8B1A4A]'}`}>
              Fort-de-France, Martinique · 22 Mai 2026
            </div>

            {/* Programme */}
            <div className="grid grid-cols-4 gap-1 mt-4">
              {[
                { day: 'MERC. 20', events: 'Ouverture\nTable ronde' },
                { day: 'JEUDI 21', events: 'Workshop\nMasterclass' },
                { day: 'VEND. 22', events: 'Cérémonie off.\nConcerts live' },
                { day: 'SAME. 23', events: 'Clôture\nDéclaration' }
              ].map(d => (
                <div key={d.day} className={`text-center p-2 rounded ${isCharbon ? 'bg-white/5' : 'bg-[#1C1A14]/5'}`}>
                  <div className={`text-[9px] font-bold ${isCharbon ? 'text-[#D4A84B]' : 'text-[#8B1A4A]'}`}>{d.day}</div>
                  <div className={`text-[8px] whitespace-pre-line ${isCharbon ? 'text-white/50' : 'text-[#1C1A14]/50'}`}>{d.events}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Tribal bottom */}
          <div className={`text-center text-xs tracking-widest py-1 ${isCharbon ? 'text-[#D4A84B]/30' : 'text-[#8B1A4A]/30'}`}>
            ◇ ◈ ◇ ◈ ◇ ◈ ◇
          </div>

          {/* Footer */}
          <div className={`p-4 pt-2 flex items-end justify-between ${isCharbon ? 'bg-[#0D0C0A]' : 'bg-[#EDE3C8]'}`}>
            <div>
              <div className={`text-xs font-bold ${isCharbon ? 'text-[#D4A84B]' : 'text-[#8B1A4A]'}`}>kiltikonet.fr</div>
              <div className={`text-[8px] ${isCharbon ? 'text-white/30' : 'text-[#1C1A14]/30'}`}>avec le soutien de</div>
              <div className={`text-[8px] ${isCharbon ? 'text-white/50' : 'text-[#1C1A14]/50'}`}>SACEM · BEA · SPEDIDAM · CTM · DRAC</div>
            </div>
            <div className="text-center">
              {qrDataUrl && (
                <img src={qrDataUrl} alt="QR Code" className="w-12 h-12" />
              )}
              <div className={`text-[8px] font-bold mt-1 ${isCharbon ? 'text-[#C4714A]' : 'text-[#8B1A4A]'}`}>SCAN MOI</div>
            </div>
          </div>
        </div>

        <div className="mt-2 text-xs text-white/30 font-mono">
          URL QR : <span className="text-[#D4A84B]">{currentQRUrl}</span>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// TAB 3: QR CODES
// ═══════════════════════════════════════════════════════════════
const QRCodesTab = ({ participants }) => {
  const [qrCodes, setQrCodes] = useState([]);
  const [singleId, setSingleId] = useState('');
  const [singleQR, setSingleQR] = useState(null);
  const [generating, setGenerating] = useState(false);

  const generateSingleQR = async () => {
    if (!singleId) return;
    const url = `${BADGE_BASE_URL}${singleId}`;
    const qr = await QRCode.toDataURL(url, { width: 200, color: { dark: '#8B1A4A' } });
    setSingleQR({ url, qr });
  };

  const generateAllQR = async () => {
    if (!participants.length) {
      toast.error('Chargez d\'abord les participants');
      return;
    }
    
    setGenerating(true);
    const codes = [];
    
    for (const p of participants) {
      const url = `${BADGE_BASE_URL}${p.id}`;
      const qr = await QRCode.toDataURL(url, { width: 120, color: { dark: '#8B1A4A' } });
      codes.push({ ...p, qrUrl: url, qrImage: qr });
    }
    
    setQrCodes(codes);
    setGenerating(false);
    toast.success(`${codes.length} QR codes générés`);
  };

  const printAll = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { margin: 0; padding: 20px; }
          .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
          .card { text-align: center; padding: 10px; border: 1px solid #ddd; border-radius: 8px; }
          .card img { width: 100px; height: 100px; }
          .card .name { font-weight: bold; font-size: 12px; margin-top: 8px; }
          .card .id { font-size: 10px; color: #666; }
        </style>
      </head>
      <body>
        <div class="grid">
          ${qrCodes.map(p => `
            <div class="card">
              <img src="${p.qrImage}" />
              <div class="name">${p.Prenom} ${p.Nom}</div>
              <div class="id">${p['Type de badge']} · ID ${p.id}</div>
            </div>
          `).join('')}
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  return (
    <div className="space-y-6">
      {/* Single QR generator */}
      <div className="bg-[#2A2820] border border-[#D4A84B]/15 rounded-lg p-6">
        <div className="text-xs text-[#C4714A] uppercase tracking-widest mb-4">Générer un QR individuel</div>
        <div className="flex gap-3">
          <Input
            value={singleId}
            onChange={(e) => setSingleId(e.target.value)}
            placeholder="ID Baserow du participant"
            className="flex-1 bg-white/5 border-white/10 text-white"
          />
          <Button onClick={generateSingleQR} className="bg-[#C4714A] hover:bg-[#A85A38]">
            Générer QR
          </Button>
        </div>
        
        {singleQR && (
          <div className="mt-4 flex items-center gap-4 p-4 bg-white/5 rounded-lg">
            <img src={singleQR.qr} alt="QR Code" className="w-32 h-32" />
            <div>
              <div className="text-sm text-white/50 mb-2">URL :</div>
              <div className="text-[#D4A84B] font-mono text-sm break-all">{singleQR.url}</div>
            </div>
          </div>
        )}
      </div>

      {/* Bulk QR generator */}
      <div className="bg-[#2A2820] border border-[#D4A84B]/15 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs text-[#C4714A] uppercase tracking-widest">Tous les QR codes</div>
          <div className="flex gap-2">
            <Button 
              onClick={generateAllQR} 
              disabled={generating}
              className="bg-[#D4A84B] hover:bg-[#B8903A] text-[#1C1A14]"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <QrCode className="w-4 h-4 mr-2" />}
              Générer tous
            </Button>
            {qrCodes.length > 0 && (
              <Button onClick={printAll} variant="outline" className="border-[#D4A84B]/30 text-[#D4A84B]">
                <Printer className="w-4 h-4 mr-2" />
                Imprimer grille
              </Button>
            )}
          </div>
        </div>

        {qrCodes.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {qrCodes.map(p => (
              <div key={p.id} className="bg-white/5 rounded-lg p-3 text-center">
                <img src={p.qrImage} alt={`QR ${p.id}`} className="w-24 h-24 mx-auto" />
                <div className="mt-2 text-sm font-semibold truncate">{p.Prenom} {p.Nom}</div>
                <div className="text-xs text-white/30">{p['Type de badge']} · ID {p.id}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-white/20 font-mono text-sm tracking-wider">
            CHARGEZ BASEROW PUIS GÉNÉREZ
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// TAB 4: STATISTICS
// ═══════════════════════════════════════════════════════════════
const StatisticsTab = ({ participants }) => {
  if (!participants.length) {
    return (
      <div className="text-center py-12 text-white/20 font-mono text-sm tracking-wider">
        CHARGEZ BASEROW POUR VOIR LES STATS
      </div>
    );
  }

  // Aggregate data
  const byType = {};
  const byTerritory = {};
  const bySector = {};
  
  participants.forEach(p => {
    const type = p['Type de badge'] || 'Autre';
    byType[type] = (byType[type] || 0) + 1;
    
    const terr = p["Territoire d'origine"] || 'Non renseigné';
    byTerritory[terr] = (byTerritory[terr] || 0) + 1;
    
    const sector = p["Secteur d'activite"] || 'Non renseigné';
    bySector[sector] = (bySector[sector] || 0) + 1;
  });

  const total = participants.length;
  const present = participants.filter(p => p['Statut presence'] === 'Présent').length;

  const StatBar = ({ label, value, total, color = 'bg-[#C4714A]' }) => (
    <div className="flex items-center gap-3">
      <span className="w-32 text-sm text-white/60 truncate">{label}</span>
      <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} transition-all`}
          style={{ width: `${Math.round((value / total) * 100)}%` }}
        />
      </div>
      <span className="w-8 text-right text-sm text-white/60">{value}</span>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Overview stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#2A2820] border border-[#D4A84B]/15 rounded-lg p-6 text-center">
          <div className="text-3xl font-bold text-white">{total}</div>
          <div className="text-xs text-white/30 uppercase tracking-wider mt-1">Total inscrits</div>
        </div>
        <div className="bg-[#2A2820] border border-[#D4A84B]/15 rounded-lg p-6 text-center">
          <div className="text-3xl font-bold text-green-400">{present}</div>
          <div className="text-xs text-white/30 uppercase tracking-wider mt-1">Présents</div>
        </div>
        <div className="bg-[#2A2820] border border-[#D4A84B]/15 rounded-lg p-6 text-center">
          <div className="text-3xl font-bold text-[#D4A84B]">{total ? Math.round((present / total) * 100) : 0}%</div>
          <div className="text-xs text-white/30 uppercase tracking-wider mt-1">Taux présence</div>
        </div>
      </div>

      {/* By type */}
      <div className="bg-[#2A2820] border border-[#D4A84B]/15 rounded-lg p-6">
        <div className="text-sm font-bold text-[#C4714A] uppercase tracking-wider mb-4">
          Répartition par type de badge
        </div>
        <div className="space-y-3">
          {Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
            <StatBar key={type} label={type} value={count} total={total} />
          ))}
        </div>
      </div>

      {/* By territory */}
      <div className="bg-[#2A2820] border border-[#D4A84B]/15 rounded-lg p-6">
        <div className="text-sm font-bold text-[#D4A84B] uppercase tracking-wider mb-4">
          Territoires représentés — Observatoire CC2026
        </div>
        <div className="space-y-3">
          {Object.entries(byTerritory).sort((a, b) => b[1] - a[1]).map(([terr, count]) => (
            <StatBar key={terr} label={terr} value={count} total={total} color="bg-[#D4A84B]" />
          ))}
        </div>
      </div>

      {/* By sector */}
      <div className="bg-[#2A2820] border border-[#D4A84B]/15 rounded-lg p-6">
        <div className="text-sm font-bold text-[#0B6E7A] uppercase tracking-wider mb-4">
          Secteurs d'activité
        </div>
        <div className="space-y-3">
          {Object.entries(bySector).sort((a, b) => b[1] - a[1]).map(([sector, count]) => (
            <StatBar key={sector} label={sector} value={count} total={total} color="bg-[#0B6E7A]" />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AccreditationSystem;
