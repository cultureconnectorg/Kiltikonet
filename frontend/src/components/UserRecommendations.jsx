import React, { useState, useEffect } from 'react';
import { Users, Calendar, Building2, Sparkles, Loader2, ChevronDown, ChevronUp, MapPin, Clock, ArrowRight } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api/recommendations`;

const TYPE_HEX = {
  ART: '#FFD700', VIP: '#9B59B6', STF: '#3498DB', SPO: '#2ECC71',
  INT: '#FFFFFF', VIS: '#00FFFF', BNV: '#E67E22', EXP: '#FFD700',
};
const TYPE_LABELS = {
  ART: 'Artiste', VIP: 'VIP', STF: 'Staff', SPO: 'Sponsor',
  INT: 'Institutionnel', VIS: 'Visiteur', BNV: 'Benevole', EXP: 'Exposant',
};

const UserRecommendations = ({ badgeId, colors }) => {
  const [connections, setConnections] = useState(null);
  const [events, setEvents] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('events');

  const C = colors;

  useEffect(() => {
    if (!badgeId) return;
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [cRes, eRes] = await Promise.all([
          fetch(`${API}/connections/${badgeId}?limit=5`).then(r => r.json()),
          fetch(`${API}/events/${badgeId}?limit=4`).then(r => r.json()),
        ]);
        setConnections(cRes);
        setEvents(eRes);
      } catch (err) { if (process.env.NODE_ENV === 'development') console.warn('[UserRecommendations] Fetch failed:', err); }
      setLoading(false);
    };
    fetchAll();
  }, [badgeId]);

  if (loading) {
    return (
      <div className="rounded-xl p-5" style={{ background: C.card, border: `1px solid ${C.warm}` }}>
        <div className="flex items-center justify-center py-6 gap-2">
          <Loader2 className="w-4 h-4 animate-spin" style={{ color: C.terra }} />
          <span className="text-sm" style={{ color: C.muted }}>Chargement des recommandations...</span>
        </div>
      </div>
    );
  }

  if (!connections?.recommendations?.length && !events?.recommendations?.length) return null;

  const sections = [
    { id: 'events', label: 'Evenements pour vous', icon: Calendar, color: C.terra },
    { id: 'people', label: 'Connexions suggerees', icon: Users, color: C.sage },
  ];

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.warm}` }} data-testid="user-recommendations">
      {/* Header */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4" style={{ color: C.gold }} />
          <h2 className="font-bold text-sm" style={{ color: C.dark }}>Recommandations CC2026</h2>
        </div>
        <div className="flex gap-1">
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs transition-all"
              style={{
                background: activeSection === s.id ? `${s.color}15` : 'transparent',
                color: activeSection === s.id ? s.color : C.muted,
                fontWeight: activeSection === s.id ? 'bold' : 'normal',
              }}
              data-testid={`user-reco-tab-${s.id}`}
            >
              <s.icon size={11} /> {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Events */}
      {activeSection === 'events' && events?.recommendations?.length > 0 && (
        <div className="px-5 pb-4 space-y-2">
          {events.recommendations.map((evt, i) => (
            <div
              key={i}
              className="p-3 rounded-lg transition-all hover:shadow-sm"
              style={{ background: C.bg }}
              data-testid={`user-reco-event-${i}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium leading-tight" style={{ color: C.dark }}>{evt.title}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="flex items-center gap-0.5 text-xs" style={{ color: C.muted }}>
                      <Calendar size={10} /> {evt.date}
                    </span>
                    <span className="flex items-center gap-0.5 text-xs" style={{ color: C.muted }}>
                      <Clock size={10} /> {evt.start}
                    </span>
                    <span className="flex items-center gap-0.5 text-xs" style={{ color: C.muted }}>
                      <MapPin size={10} /> {evt.lieu?.split('—')[0]}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end ml-2">
                  <span className="text-xs px-1.5 py-0.5 rounded capitalize" style={{ background: `${C.terra}15`, color: C.terra, fontSize: 10 }}>{evt.type}</span>
                </div>
              </div>
              {evt.reasons?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {evt.reasons.map((r, j) => (
                    <span key={j} className="text-xs px-1.5 py-0.5 rounded" style={{ background: `${C.gold}15`, color: C.gold, fontSize: 9 }}>{r}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* People */}
      {activeSection === 'people' && connections?.recommendations?.length > 0 && (
        <div className="px-5 pb-4 space-y-2">
          {connections.recommendations.map((p, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-lg transition-all hover:shadow-sm"
              style={{ background: C.bg }}
              data-testid={`user-reco-person-${i}`}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${TYPE_HEX[p.type] || C.muted}20` }}>
                <Users size={14} style={{ color: TYPE_HEX[p.type] || C.muted }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: C.dark }}>{p.name}</p>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs px-1 py-0.5 rounded" style={{ background: `${TYPE_HEX[p.type] || '#888'}15`, color: TYPE_HEX[p.type] || '#888', fontSize: 9 }}>
                    {TYPE_LABELS[p.type] || p.type}
                  </span>
                  {p.org && <span className="text-xs truncate" style={{ color: C.muted, fontSize: 10 }}>{p.org}</span>}
                </div>
                {p.reasons?.length > 0 && (
                  <p className="mt-0.5" style={{ fontSize: 10, color: C.muted }}>{p.reasons[0]}</p>
                )}
              </div>
              <span className="text-xs font-mono font-bold flex-shrink-0" style={{ color: C.terra }}>{p.match_score}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserRecommendations;
