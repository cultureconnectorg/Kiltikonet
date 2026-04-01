import React, { useState, useCallback, useRef, useEffect } from 'react';
import { X, Music, User, MapPin, Calendar, Landmark, Search, ChevronLeft, Play, Pause, Check } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TYPES = [
  { id: 'musique', label: 'Musique', icon: Music, desc: 'Titre, album, artiste' },
  { id: 'artiste', label: 'Artiste', icon: User, desc: 'Musicien, peintre, auteur' },
  { id: 'lieu', label: 'Lieu', icon: MapPin, desc: 'Patrimoine, marché, monument' },
  { id: 'evenement', label: 'Événement', icon: Calendar, desc: 'Festival, concert, expo' },
  { id: 'patrimoine', label: 'Patrimoine', icon: Landmark, desc: 'Tradition, danse, cuisine' },
];

const DIMENSIONS = [
  'Musique', 'Arts Visuels & Scéniques', 'Langue Créole',
  'Patrimoine & Traditions', 'Gastronomie',
  'Féminité & Matriarcat', 'Identité Diasporique',
];

const DEFAULT_DIM = {
  musique: 'Musique', artiste: 'Arts Visuels & Scéniques',
  lieu: 'Patrimoine & Traditions', evenement: 'Musique',
  patrimoine: 'Patrimoine & Traditions',
};

const G = '#E8D5A0'; // Or blanc

// ─── Skeleton search result ─────────────────
const ResultSkeleton = () => (
  <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#131315' }}>
    <div className="w-12 h-12 rounded-lg flex-shrink-0 kn-skeleton-shimmer" />
    <div className="flex-1 space-y-2">
      <div className="h-3.5 w-3/4 rounded kn-skeleton-shimmer" />
      <div className="h-2.5 w-1/2 rounded kn-skeleton-shimmer" style={{ animationDelay: '0.1s' }} />
    </div>
  </div>
);

// ─── Audio player ─────────────────
const MiniPlayer = ({ url, artwork }) => {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    return () => { if (audioRef.current) audioRef.current.pause(); };
  }, []);

  const toggle = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(url);
      audioRef.current.addEventListener('timeupdate', () => {
        if (audioRef.current) setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100 || 0);
      });
      audioRef.current.addEventListener('ended', () => { setPlaying(false); setProgress(0); });
    }
    if (playing) { audioRef.current.pause(); } else { audioRef.current.play(); }
    setPlaying(!playing);
  };

  return (
    <div className="relative w-full aspect-square rounded-2xl overflow-hidden" style={{ maxHeight: 320 }}>
      {artwork && <img src={artwork} alt="" className="w-full h-full object-cover" />}
      {!artwork && <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #1a1a1a, #0a0a0b)' }} />}

      {/* Play button overlay */}
      <button onClick={toggle} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full flex items-center justify-center transition-transform active:scale-90"
        style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)' }}
        data-testid="audio-play-btn" aria-label={playing ? 'Pause' : 'Lecture'}>
        {playing ? <Pause size={28} style={{ color: '#fff' }} /> : <Play size={28} style={{ color: '#fff', marginLeft: 3 }} />}
      </button>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: 'rgba(255,255,255,0.1)' }}>
        <div className="h-full" style={{ width: `${progress}%`, background: G, boxShadow: `0 0 6px ${G}40`, transition: 'width 0.3s linear' }} />
      </div>
    </div>
  );
};

const CreateCulturalCard = ({ userId, onClose, onPublished }) => {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null);
  const [dimension, setDimension] = useState('');
  const [publishing, setPublishing] = useState(false);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  // Debounced search
  const doSearch = useCallback(async (q, type) => {
    if (!q || q.length < 2 || !type) return;
    setSearching(true);
    try {
      const res = await axios.post(`${API}/cultural-search`, { type, query: q });
      setResults(res.data.results || []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length >= 2 && selectedType) {
      debounceRef.current = setTimeout(() => doSearch(query, selectedType), 300);
    } else {
      setResults([]);
    }
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, selectedType, doSearch]);

  // Auto-focus search on step 2
  useEffect(() => {
    if (step === 2 && inputRef.current) setTimeout(() => inputRef.current?.focus(), 200);
  }, [step]);

  // Auto-set dimension on type selection
  useEffect(() => {
    if (selectedType) setDimension(DEFAULT_DIM[selectedType] || 'Musique');
  }, [selectedType]);

  const selectResult = (r) => {
    setSelected(r);
    setStep(3);
  };

  const publish = async () => {
    if (!selected || publishing) return;
    setPublishing(true);
    try {
      const res = await axios.post(`${API}/cultural-cards`, {
        user_id: userId,
        type: selectedType,
        source_id: selected.id,
        titre: selected.titre,
        sous_titre: selected.sous_titre || '',
        image_url: selected.image_url || '',
        preview_url: selected.preview_url || null,
        description: selected.sous_titre || '',
        metadata: selected.metadata || {},
        dimension_culturelle: dimension,
      });
      if (res.data.success) {
        onPublished?.(res.data);
        onClose();
      }
    } catch (err) {
      console.error('Publish error:', err);
    } finally {
      setPublishing(false);
    }
  };

  const back = () => {
    if (step === 2) { setStep(1); setQuery(''); setResults([]); }
    else if (step === 3) setStep(2);
    else if (step === 4) setStep(3);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center" data-testid="create-card-modal">
      {/* Backdrop */}
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }} onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full sm:max-w-md sm:rounded-2xl overflow-hidden flex flex-col"
        style={{ background: '#111', maxHeight: '90vh', borderTop: `1px solid ${G}18` }}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#1e1e1e' }}>
          {step > 1 ? (
            <button onClick={back} className="p-1" style={{ color: '#888', minHeight: 32, minWidth: 32 }} aria-label="Retour">
              <ChevronLeft size={20} />
            </button>
          ) : <div className="w-8" />}
          <span className="text-xs font-semibold uppercase" style={{ color: G, letterSpacing: '0.1em', fontFamily: "'Inter', sans-serif" }}>
            {step === 1 && 'Type de carte'}
            {step === 2 && 'Recherche'}
            {step === 3 && 'Aperçu'}
            {step === 4 && 'Dimension'}
          </span>
          <button onClick={onClose} className="p-1" style={{ color: '#888', minHeight: 32, minWidth: 32 }} aria-label="Fermer" data-testid="close-create-modal">
            <X size={20} />
          </button>
        </div>

        {/* Step indicators */}
        <div className="flex gap-1 px-4 pt-2">
          {[1,2,3,4].map(s => (
            <div key={s} className="flex-1 h-0.5 rounded-full" style={{ background: step >= s ? G : '#1e1e1e', transition: 'background 0.3s' }} />
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4" style={{ minHeight: 300 }}>

          {/* STEP 1 — Type selection */}
          {step === 1 && (
            <div className="space-y-2" data-testid="step-type-selection">
              {TYPES.map(t => {
                const Icon = t.icon;
                const active = selectedType === t.id;
                return (
                  <button key={t.id} onClick={() => { setSelectedType(t.id); setStep(2); }}
                    className="w-full flex items-center gap-4 p-4 rounded-xl transition-all active:scale-[0.98]"
                    style={{
                      background: active ? `${G}12` : '#131315',
                      border: `1px solid ${active ? `${G}40` : '#1e1e1e'}`,
                      minHeight: 60,
                    }}
                    data-testid={`type-${t.id}`}>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${G}10` }}>
                      <Icon size={20} style={{ color: G }} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold" style={{ color: '#fff', fontFamily: "'Inter', sans-serif" }}>{t.label}</p>
                      <p className="text-xs" style={{ color: '#888' }}>{t.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* STEP 2 — Search */}
          {step === 2 && (
            <div data-testid="step-search">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: '#444' }} />
                <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
                  placeholder={`Rechercher un ${TYPES.find(t => t.id === selectedType)?.label.toLowerCase() || ''}...`}
                  className="w-full h-11 pl-10 pr-4 rounded-xl text-sm"
                  style={{ background: '#1a1a1a', border: '1px solid #1e1e1e', color: '#fff', outline: 'none', fontFamily: "'Inter', sans-serif" }}
                  data-testid="search-input" />
              </div>

              {/* Results */}
              <div className="space-y-2">
                {searching && [1,2,3].map(i => <ResultSkeleton key={i} />)}
                {!searching && results.length === 0 && query.length >= 2 && (
                  <p className="text-center py-8 text-xs" style={{ color: '#444' }}>Aucun résultat pour "{query}"</p>
                )}
                {!searching && results.map(r => (
                  <button key={r.id} onClick={() => selectResult(r)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-white/[0.03] active:scale-[0.98] text-left"
                    style={{ background: '#131315', border: '1px solid #1e1e1e' }}
                    data-testid={`result-${r.id}`}>
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0" style={{ background: '#1a1a1a' }}>
                      {r.image_url ? <img src={r.image_url} alt="" className="w-full h-full object-cover" loading="lazy" /> :
                        <div className="w-full h-full flex items-center justify-center"><Music size={18} style={{ color: '#444' }} /></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: '#fff' }}>{r.titre}</p>
                      <p className="text-xs truncate" style={{ color: '#888' }}>{r.sous_titre}</p>
                    </div>
                    <ChevronLeft size={16} style={{ color: '#444', transform: 'rotate(180deg)' }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3 — Preview */}
          {step === 3 && selected && (
            <div data-testid="step-preview">
              {/* Media preview */}
              {selectedType === 'musique' && selected.preview_url ? (
                <MiniPlayer url={selected.preview_url} artwork={selected.image_url} />
              ) : selected.image_url ? (
                <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden" style={{ background: '#131315' }}>
                  <img src={selected.image_url} alt={selected.titre} className="w-full h-full object-cover" loading="lazy" />
                </div>
              ) : (
                <div className="w-full aspect-[4/3] rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #131315, #1a1a1a)' }}>
                  {React.createElement(TYPES.find(t => t.id === selectedType)?.icon || Landmark, { size: 48, style: { color: `${G}30` } })}
                </div>
              )}

              {/* Info */}
              <div className="mt-4">
                <h3 className="text-lg font-bold" style={{ color: '#fff', fontFamily: "'Inter', sans-serif", letterSpacing: '-0.02em' }}>{selected.titre}</h3>
                {selected.sous_titre && <p className="text-sm mt-1" style={{ color: '#888' }}>{selected.sous_titre}</p>}
                {selected.metadata?.album && <p className="text-xs mt-1" style={{ color: '#444' }}>Album : {selected.metadata.album}</p>}
                {selected.metadata?.genre && <p className="text-xs mt-0.5" style={{ color: '#444' }}>Genre : {selected.metadata.genre}</p>}
              </div>

              <button onClick={() => setStep(4)} data-testid="btn-next-dimension"
                className="w-full mt-6 py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.97]"
                style={{ background: G, color: '#000', fontFamily: "'Inter', sans-serif" }}>
                Choisir la dimension culturelle
              </button>
            </div>
          )}

          {/* STEP 4 — Dimension + Publish */}
          {step === 4 && (
            <div data-testid="step-dimension">
              <p className="text-xs font-semibold uppercase mb-4" style={{ color: '#888', letterSpacing: '0.08em' }}>
                Dimension culturelle associée
              </p>
              <div className="flex flex-wrap gap-2">
                {DIMENSIONS.map(d => (
                  <button key={d} onClick={() => setDimension(d)}
                    className="px-3 py-2 rounded-lg text-xs font-medium transition-all active:scale-[0.97]"
                    style={{
                      background: dimension === d ? G : '#131315',
                      color: dimension === d ? '#000' : '#888',
                      border: `1px solid ${dimension === d ? G : '#1e1e1e'}`,
                      fontFamily: "'Inter', sans-serif",
                    }}
                    data-testid={`dim-${d.slice(0, 8)}`}>
                    {d}
                  </button>
                ))}
              </div>

              {/* Summary */}
              <div className="mt-6 p-4 rounded-xl" style={{ background: '#131315', border: '1px solid #1e1e1e' }}>
                <div className="flex items-center gap-3">
                  {selected?.image_url ? (
                    <img src={selected.image_url} alt="" className="w-14 h-14 rounded-lg object-cover" />
                  ) : <div className="w-14 h-14 rounded-lg" style={{ background: '#1a1a1a' }} />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: '#fff' }}>{selected?.titre}</p>
                    <p className="text-xs truncate" style={{ color: '#888' }}>{selected?.sous_titre}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: G }} />
                      <span className="text-[10px] font-medium" style={{ color: G }}>{dimension}</span>
                    </div>
                  </div>
                </div>
              </div>

              <button onClick={publish} disabled={publishing} data-testid="btn-publish-card"
                className="w-full mt-6 py-3.5 rounded-xl text-sm font-bold transition-all active:scale-[0.97] disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: G, color: '#000', fontFamily: "'Inter', sans-serif", boxShadow: `0 4px 15px ${G}30` }}>
                {publishing ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <><Check size={16} /> Publier dans le feed</>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateCulturalCard;
