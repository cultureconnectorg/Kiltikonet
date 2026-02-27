import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Cpu, Users, MessageSquare, Plus, Search, Trash2, 
  Download, Copy, X, CheckCircle, AlertCircle, Loader2,
  FileText, Sparkles, Globe, Tag, Building2
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';
const SMART_API = `${API_URL}/api/v1/smart-recommendations`;

// Profile types
const PROFILE_TYPES = [
  { value: 'artist', label: 'Artiste' },
  { value: 'label', label: 'Label / Producteur' },
  { value: 'agent', label: 'Agent / Manager' },
  { value: 'media', label: 'Média' },
  { value: 'institution', label: 'Institution' }
];

// Sectors
const SECTORS = [
  'Musique', 'Arts visuels', 'Danse', 'Théâtre', 'Cinéma', 
  'Littérature', 'Mode', 'Gastronomie', 'Patrimoine', 'Numérique'
];

// Common genres
const GENRES = [
  'Zouk', 'Kompa', 'Reggae', 'Dancehall', 'Afrobeat', 'Jazz Créole',
  'Biguine', 'Mazurka', 'Hip-Hop', 'R&B', 'Soul', 'World Music',
  'Traditionnel', 'Fusion', 'Électronique'
];

// Expertise tags
const EXPERTISE_TAGS = [
  'Production musicale', 'Distribution', 'Booking', 'Management',
  'Communication', 'Événementiel', 'Export', 'Formation',
  'Subventions', 'Juridique', 'Sync/Licensing', 'Digital'
];

// Territories
const TERRITORIES = [
  'Martinique', 'Guadeloupe', 'Guyane', 'La Réunion', 'Mayotte',
  'France Hexagonale', 'Haïti', 'Caraïbe anglophone', 'Afrique de l\'Ouest',
  'International'
];

// ==================== INDEX PROFILE SCREEN ====================
const IndexProfileScreen = () => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'artist',
    sector: '',
    genres: [],
    tags: [],
    territory: '',
    description: '',
    seeking: '',
    offering: ''
  });
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const res = await axios.get(`${SMART_API}/profiles`);
      setProfiles(res.data.profiles || []);
    } catch (err) {
      console.error('Error loading profiles:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await axios.post(`${SMART_API}/index`, formData);
      setSuccess(`Profil "${res.data.profile.name}" indexé avec succès !`);
      setFormData({
        name: '', type: 'artist', sector: '', genres: [], tags: [],
        territory: '', description: '', seeking: '', offering: ''
      });
      loadProfiles();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'indexation');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Supprimer le profil "${name}" ?`)) return;
    try {
      await axios.delete(`${SMART_API}/profiles/${id}`);
      loadProfiles();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const toggleArrayItem = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value].slice(0, field === 'tags' ? 12 : 5)
    }));
  };

  return (
    <div className="space-y-8">
      {/* Form */}
      <div className="bg-dark-card rounded-xl p-6 border border-dark-border">
        <h3 className="text-lg font-medium text-paper mb-6 flex items-center gap-2">
          <Plus className="w-5 h-5 text-terracotta" />
          Indexer un nouveau profil
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Row 1: Name & Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-paper/70 mb-2">Nom *</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="Nom de l'artiste, label ou structure"
                className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-paper placeholder-paper/30 focus:border-terracotta focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-paper/70 mb-2">Type *</label>
              <select
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value})}
                className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-paper focus:border-terracotta focus:outline-none"
              >
                {PROFILE_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Sector & Territory */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-paper/70 mb-2">Secteur</label>
              <select
                value={formData.sector}
                onChange={e => setFormData({...formData, sector: e.target.value})}
                className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-paper focus:border-terracotta focus:outline-none"
              >
                <option value="">Sélectionner un secteur</option>
                {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-paper/70 mb-2">Territoire</label>
              <select
                value={formData.territory}
                onChange={e => setFormData({...formData, territory: e.target.value})}
                className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-paper focus:border-terracotta focus:outline-none"
              >
                <option value="">Sélectionner un territoire</option>
                {TERRITORIES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Genres */}
          <div>
            <label className="block text-sm text-paper/70 mb-2">
              Genres (max 5) <span className="text-paper/40">— {formData.genres.length}/5</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {GENRES.map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => toggleArrayItem('genres', g)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    formData.genres.includes(g)
                      ? 'bg-terracotta text-paper'
                      : 'bg-dark-bg border border-dark-border text-paper/60 hover:border-terracotta/50'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm text-paper/70 mb-2">
              Tags d'expertise (max 12) <span className="text-paper/40">— {formData.tags.length}/12</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {EXPERTISE_TAGS.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleArrayItem('tags', t)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    formData.tags.includes(t)
                      ? 'bg-gold text-dark-bg'
                      : 'bg-dark-bg border border-dark-border text-paper/60 hover:border-gold/50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-paper/70 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              placeholder="Décrivez l'activité, l'historique, les réalisations..."
              rows={3}
              className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-paper placeholder-paper/30 focus:border-terracotta focus:outline-none resize-none"
            />
          </div>

          {/* Seeking & Offering */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-paper/70 mb-2">Recherche</label>
              <textarea
                value={formData.seeking}
                onChange={e => setFormData({...formData, seeking: e.target.value})}
                placeholder="Ce que le profil recherche..."
                rows={2}
                className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-paper placeholder-paper/30 focus:border-terracotta focus:outline-none resize-none"
              />
            </div>
            <div>
              <label className="block text-sm text-paper/70 mb-2">Propose</label>
              <textarea
                value={formData.offering}
                onChange={e => setFormData({...formData, offering: e.target.value})}
                placeholder="Ce que le profil propose..."
                rows={2}
                className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-paper placeholder-paper/30 focus:border-terracotta focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Alerts */}
          {success && (
            <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400">
              <CheckCircle className="w-5 h-5" />
              {success}
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !formData.name}
            className="w-full py-3 bg-terracotta hover:bg-terracotta/90 disabled:bg-terracotta/50 text-paper font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Indexation en cours...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Indexer le profil
              </>
            )}
          </button>
        </form>
      </div>

      {/* Profiles List */}
      <div className="bg-dark-card rounded-xl p-6 border border-dark-border">
        <h3 className="text-lg font-medium text-paper mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-gold" />
          Profils indexés ({profiles.length})
        </h3>

        {profiles.length === 0 ? (
          <p className="text-paper/50 text-center py-8">Aucun profil indexé</p>
        ) : (
          <div className="space-y-3">
            {profiles.map(p => (
              <div 
                key={p.id} 
                className="flex items-center justify-between p-4 bg-dark-bg rounded-lg border border-dark-border hover:border-terracotta/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-terracotta/20 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-terracotta" />
                  </div>
                  <div>
                    <p className="text-paper font-medium">{p.name}</p>
                    <p className="text-paper/50 text-sm">
                      {PROFILE_TYPES.find(t => t.value === p.type)?.label || p.type}
                      {p.territory && ` • ${p.territory}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(p.id, p.name)}
                  className="p-2 text-paper/40 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== RECOMMENDATIONS SCREEN ====================
const RecommendationsScreen = () => {
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [sourceProfile, setSourceProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exportModal, setExportModal] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportText, setExportText] = useState('');

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const res = await axios.get(`${SMART_API}/profiles`);
      setProfiles(res.data.profiles || []);
    } catch (err) {
      console.error('Error loading profiles:', err);
    }
  };

  const getRecommendations = async (profileId) => {
    setLoading(true);
    setRecommendations([]);
    try {
      const res = await axios.get(`${SMART_API}/${profileId}`);
      setSourceProfile(res.data.source);
      setRecommendations(res.data.recommendations || []);
    } catch (err) {
      console.error('Error getting recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (rec) => {
    setExportModal(rec);
    setExportLoading(true);
    setExportText('');

    try {
      const res = await axios.post(`${SMART_API}/export`, {
        profileA: sourceProfile,
        profileB: rec,
        score: rec.score
      });
      setExportText(res.data.recommendation);
    } catch (err) {
      setExportText('Erreur lors de la génération de la recommandation.');
    } finally {
      setExportLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(exportText);
    alert('Texte copié !');
  };

  const downloadPDF = async () => {
    try {
      const res = await axios.post(`${SMART_API}/export/pdf`, {
        profileA: sourceProfile,
        profileB: exportModal,
        score: exportModal.score,
        recommendation: exportText
      }, { responseType: 'blob' });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `recommandation_${sourceProfile.name}_${exportModal.name}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('PDF download error:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Selector */}
      <div className="bg-dark-card rounded-xl p-6 border border-dark-border">
        <h3 className="text-lg font-medium text-paper mb-4 flex items-center gap-2">
          <Search className="w-5 h-5 text-terracotta" />
          Sélectionner un profil
        </h3>

        <div className="flex gap-4">
          <select
            value={selectedProfile || ''}
            onChange={e => setSelectedProfile(e.target.value)}
            className="flex-1 px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-paper focus:border-terracotta focus:outline-none"
          >
            <option value="">Choisir un profil...</option>
            {profiles.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({PROFILE_TYPES.find(t => t.value === p.type)?.label || p.type})
              </option>
            ))}
          </select>
          <button
            onClick={() => selectedProfile && getRecommendations(selectedProfile)}
            disabled={!selectedProfile || loading}
            className="px-6 py-3 bg-terracotta hover:bg-terracotta/90 disabled:bg-terracotta/50 text-paper font-medium rounded-lg flex items-center gap-2 transition-colors"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            Analyser
          </button>
        </div>
      </div>

      {/* Recommendations */}
      {sourceProfile && (
        <div className="bg-dark-card rounded-xl p-6 border border-dark-border">
          <h3 className="text-lg font-medium text-paper mb-2">
            Recommandations pour <span className="text-terracotta">{sourceProfile.name}</span>
          </h3>
          <p className="text-paper/50 text-sm mb-6">
            Top 5 profils les plus compatibles basés sur l'analyse sémantique
          </p>

          {recommendations.length === 0 ? (
            <p className="text-paper/50 text-center py-8">
              {loading ? 'Analyse en cours...' : 'Aucune recommandation disponible'}
            </p>
          ) : (
            <div className="space-y-4">
              {recommendations.map(rec => (
                <div 
                  key={rec.id}
                  className="p-5 bg-dark-bg rounded-xl border border-dark-border hover:border-terracotta/30 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold text-sm">
                        #{rec.rank}
                      </div>
                      <div>
                        <h4 className="text-paper font-medium">{rec.name}</h4>
                        <p className="text-paper/50 text-sm">
                          {PROFILE_TYPES.find(t => t.value === rec.type)?.label || rec.type}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-terracotta">{rec.score}%</div>
                      <p className="text-paper/40 text-xs">compatibilité</p>
                    </div>
                  </div>

                  {/* Score bar */}
                  <div className="h-2 bg-dark-border rounded-full overflow-hidden mb-3">
                    <div 
                      className="h-full bg-gradient-to-r from-terracotta to-gold transition-all duration-500"
                      style={{ width: `${rec.score}%` }}
                    />
                  </div>

                  {/* Info badges */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {rec.territory && (
                      <span className="px-2 py-1 bg-terracotta/20 text-terracotta rounded text-xs flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {rec.territory}
                      </span>
                    )}
                    {rec.sector && (
                      <span className="px-2 py-1 bg-gold/20 text-gold rounded text-xs">
                        {rec.sector}
                      </span>
                    )}
                    {(rec.genres || []).slice(0, 3).map(g => (
                      <span key={g} className="px-2 py-1 bg-paper/10 text-paper/60 rounded text-xs">
                        {g}
                      </span>
                    ))}
                  </div>

                  {/* Match reason */}
                  <p className="text-paper/70 text-sm italic mb-4">"{rec.matchReason}"</p>

                  {/* Export button */}
                  <button
                    onClick={() => handleExport(rec)}
                    className="w-full py-2.5 bg-terracotta/20 hover:bg-terracotta/30 text-terracotta font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    Exporter pour mon dossier
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Export Modal */}
      {exportModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-card rounded-xl border border-dark-border max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-dark-border flex items-center justify-between">
              <h3 className="text-lg font-medium text-paper">
                Recommandation de Partenariat
              </h3>
              <button 
                onClick={() => setExportModal(null)}
                className="p-2 text-paper/50 hover:text-paper"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Profiles summary */}
              <div className="flex items-center justify-between p-4 bg-dark-bg rounded-lg">
                <div>
                  <p className="text-paper font-medium">{sourceProfile?.name}</p>
                  <p className="text-paper/50 text-sm">{sourceProfile?.type}</p>
                </div>
                <div className="text-terracotta font-bold text-xl">{exportModal.score}%</div>
                <div className="text-right">
                  <p className="text-paper font-medium">{exportModal.name}</p>
                  <p className="text-paper/50 text-sm">{exportModal.type}</p>
                </div>
              </div>

              {/* Generated text */}
              <div className="p-4 bg-dark-bg rounded-lg border border-dark-border min-h-[120px]">
                {exportLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-terracotta" />
                    <span className="ml-2 text-paper/50">Génération en cours...</span>
                  </div>
                ) : (
                  <p className="text-paper leading-relaxed">{exportText}</p>
                )}
              </div>

              {/* Actions */}
              {!exportLoading && exportText && (
                <div className="flex gap-3">
                  <button
                    onClick={copyToClipboard}
                    className="flex-1 py-3 bg-dark-bg hover:bg-dark-border text-paper font-medium rounded-lg flex items-center justify-center gap-2 transition-colors border border-dark-border"
                  >
                    <Copy className="w-4 h-4" />
                    Copier
                  </button>
                  <button
                    onClick={downloadPDF}
                    className="flex-1 py-3 bg-terracotta hover:bg-terracotta/90 text-paper font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Télécharger en PDF
                  </button>
                </div>
              )}

              <p className="text-paper/40 text-xs text-center">
                Ce document est généré par KiltiKonet Smart Engine pour vos dossiers de subvention (CTM, DAC, SACEM, CNM...)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== AI ASSISTANT SCREEN ====================
const AIAssistantScreen = () => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Bonjour ! Je suis l\'assistant Culture Connect. Posez-moi vos questions sur les procédures administratives, les partenariats ou les financements pour les industries culturelles afro-caribéennes.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const res = await axios.get(`${SMART_API}/rag/documents`);
      setDocuments(res.data.documents || []);
    } catch (err) {
      console.error('Error loading documents:', err);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const res = await axios.post(`${SMART_API}/rag/ask`, { question: userMessage });
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: res.data.answer,
        sources: res.data.sources
      }]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Désolé, une erreur s\'est produite. Veuillez réessayer.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-300px)] min-h-[500px] flex flex-col bg-dark-card rounded-xl border border-dark-border overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-dark-border bg-dark-bg">
        <h3 className="text-lg font-medium text-paper flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-terracotta" />
          Assistant IA Culture Connect
        </h3>
        <p className="text-paper/50 text-sm mt-1">
          {documents.length} documents de référence indexés
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div 
            key={i} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] rounded-xl p-4 ${
              msg.role === 'user' 
                ? 'bg-terracotta text-paper' 
                : 'bg-dark-bg border border-dark-border text-paper'
            }`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-paper/20">
                  <p className="text-xs text-paper/60 mb-2">Sources :</p>
                  <div className="flex flex-wrap gap-2">
                    {msg.sources.map((s, j) => (
                      <span 
                        key={j}
                        className="px-2 py-1 bg-gold/20 text-gold rounded text-xs"
                      >
                        {s.title} ({s.relevance}%)
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-dark-bg border border-dark-border rounded-xl p-4 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-terracotta" />
              <span className="text-paper/50">Réflexion en cours...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-4 border-t border-dark-border bg-dark-bg">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Posez votre question en français..."
            className="flex-1 px-4 py-3 bg-dark-card border border-dark-border rounded-lg text-paper placeholder-paper/30 focus:border-terracotta focus:outline-none"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="px-6 py-3 bg-terracotta hover:bg-terracotta/90 disabled:bg-terracotta/50 text-paper font-medium rounded-lg transition-colors"
          >
            Envoyer
          </button>
        </div>
      </form>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================
const SmartEngineDashboard = () => {
  const [activeTab, setActiveTab] = useState('index');

  const tabs = [
    { id: 'index', label: 'Indexer un Profil', icon: Plus },
    { id: 'recommendations', label: 'Recommandations', icon: Users },
    { id: 'assistant', label: 'Assistant IA', icon: MessageSquare }
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1A1A1A' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#242424', borderBottom: '1px solid #333333' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(166, 93, 71, 0.2)' }}>
              <Cpu className="w-6 h-6" style={{ color: '#A65D47' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#F4F1EA' }}>KiltiKonet Smart Engine</h1>
              <p className="text-sm" style={{ color: 'rgba(244, 241, 234, 0.5)' }}>Matching intelligent pour Culture Connect 2026</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ backgroundColor: '#242424', borderBottom: '1px solid #333333' }} className="sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-5 py-4 text-sm font-medium transition-colors"
                style={{ 
                  borderBottom: activeTab === tab.id ? '2px solid #A65D47' : '2px solid transparent',
                  color: activeTab === tab.id ? '#A65D47' : 'rgba(244, 241, 234, 0.5)'
                }}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'index' && <IndexProfileScreen />}
        {activeTab === 'recommendations' && <RecommendationsScreen />}
        {activeTab === 'assistant' && <AIAssistantScreen />}
      </div>

      {/* Footer */}
      <div className="text-center py-6 text-sm" style={{ color: 'rgba(244, 241, 234, 0.3)' }}>
        KiltiKonet Smart Engine — kiltikonet.fr — Culture Connect 2026
      </div>
    </div>
  );
};

export default SmartEngineDashboard;
