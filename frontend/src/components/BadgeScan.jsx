import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, XCircle, User, Building2, MapPin, Tag, Clock, Loader2, AlertCircle } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════
const BASEROW_TOKEN = 'BjKPCSpcpif72OtZtsmMFUbZysqlNGiK';
const BASEROW_TABLE = '865847';
const BASEROW_API = 'https://api.baserow.io/api';

// Design colors
const COLORS = {
  charbon: '#1C1A14',
  terracotta: '#C4714A',
  gold: '#D4A84B',
  forest: '#4A5D4E',
  cream: '#F4F1EA',
  burgundy: '#8B1A4A',
  teal: '#0B6E7A'
};

// Badge type colors
const BADGE_COLORS = {
  'VIP': { bg: COLORS.burgundy, text: '#fff' },
  'Presse': { bg: COLORS.teal, text: '#fff' },
  'Exposant': { bg: COLORS.gold, text: COLORS.charbon },
  'Artiste': { bg: COLORS.terracotta, text: '#fff' },
  'Staff Artiste': { bg: COLORS.terracotta, text: '#fff' },
  'Benevole': { bg: COLORS.forest, text: '#fff' },
  'Institutionnel': { bg: '#5B9BD5', text: '#fff' },
  'Staff': { bg: COLORS.charbon, text: COLORS.gold },
  'Regie technique': { bg: '#333', text: COLORS.gold },
  'Emergent': { bg: '#6B46C1', text: '#fff' },
  'Professionnel': { bg: '#2D5A7B', text: '#fff' },
  'Public': { bg: '#6B7280', text: '#fff' },
  'Visiteur': { bg: '#9CA3AF', text: COLORS.charbon },
  'Participant': { bg: '#4B5563', text: '#fff' },
  'Partenaire Or': { bg: COLORS.gold, text: COLORS.charbon },
  'Partenaire Silver': { bg: '#C0C0C0', text: COLORS.charbon },
  'Partenaire Bronze': { bg: '#CD7F32', text: '#fff' }
};

// Helper to extract value from Baserow Single Select fields
const getFieldValue = (field) => {
  if (field === null || field === undefined) return '';
  if (typeof field === 'object' && field.value !== undefined) return field.value;
  return String(field);
};

// ═══════════════════════════════════════════════════════════════
// BADGE SCAN PAGE - Auto-validates presence when scanned
// ═══════════════════════════════════════════════════════════════
const BadgeScan = () => {
  const { id } = useParams();
  const [participant, setParticipant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [validating, setValidating] = useState(false);
  const [justValidated, setJustValidated] = useState(false);

  // Load participant and auto-validate
  useEffect(() => {
    const loadAndValidate = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch participant by ID from Baserow
        const response = await fetch(
          `${BASEROW_API}/database/rows/table/${BASEROW_TABLE}/${id}/?user_field_names=true`,
          { headers: { 'Authorization': `Token ${BASEROW_TOKEN}` } }
        );
        
        if (!response.ok) throw new Error('Participant introuvable');
        
        const data = await response.json();
        setParticipant(data);

        // Auto-validate presence if not already present (PATCH to Baserow)
        const currentPresence = getFieldValue(data['Statut presence']);
        if (currentPresence !== 'Present') {
          setValidating(true);
          const heure = new Date().toTimeString().slice(0, 5);
          
          const patchResponse = await fetch(
            `${BASEROW_API}/database/rows/table/${BASEROW_TABLE}/${id}/?user_field_names=true`,
            {
              method: 'PATCH',
              headers: {
                'Authorization': `Token ${BASEROW_TOKEN}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                'Statut presence': 'Present',
                "Heure d'arrivee": heure
              })
            }
          );
          
          if (patchResponse.ok) {
            setParticipant(prev => ({
              ...prev,
              'Statut presence': 'Present',
              "Heure d'arrivee": heure
            }));
            setJustValidated(true);
          }
          setValidating(false);
        }
      } catch (err) {
        console.error('Error:', err);
        setError(err.message || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };

    if (id) loadAndValidate();
  }, [id]);

  const getInitials = (p) => {
    if (!p) return '??';
    return ((p.Prenom || '?')[0] + (p.Nom || '?')[0]).toUpperCase();
  };

  const badgeType = getFieldValue(participant?.['Type de badge']);
  const presenceStatus = getFieldValue(participant?.['Statut presence']);
  const isPresent = presenceStatus === 'Present';
  const colors = BADGE_COLORS[badgeType] || BADGE_COLORS['Artiste'];

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: COLORS.charbon, fontFamily: "'Syne', sans-serif" }}>
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold" 
              style={{ background: `linear-gradient(135deg, ${COLORS.terracotta}, ${COLORS.burgundy})`, color: '#fff' }}>
              CC
            </div>
            <div className="text-left">
              <div className="font-bold tracking-wider" style={{ color: COLORS.gold }}>CULTURE CONNECT</div>
              <div className="text-xs" style={{ color: COLORS.terracotta }}>Verification Accreditation</div>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="rounded-xl p-8 text-center" style={{ background: '#2A2820', border: `1px solid ${COLORS.gold}20` }}>
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: COLORS.terracotta }} />
            <div className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {validating ? 'Validation en cours...' : 'Chargement...'}
            </div>
          </div>
        ) : error ? (
          <div className="rounded-xl p-8 text-center" style={{ background: '#2A2820', border: '1px solid rgba(207,96,96,0.3)' }}>
            <AlertCircle className="w-16 h-16 mx-auto mb-4" style={{ color: '#CF6060' }} />
            <div className="font-bold text-lg mb-2" style={{ color: '#CF6060' }}>Badge Invalide</div>
            <div className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{error}</div>
            <div className="mt-4 font-mono text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>ID: {id}</div>
          </div>
        ) : participant ? (
          <div className="rounded-xl overflow-hidden" style={{ background: '#2A2820', border: `1px solid ${COLORS.gold}20` }}>
            {/* Status banner */}
            <div 
              className="p-4 text-center"
              style={{ background: isPresent ? COLORS.forest : COLORS.burgundy }}
            >
              {isPresent ? (
                <>
                  <div className="flex items-center justify-center gap-2 text-white font-bold text-lg">
                    <CheckCircle className="w-6 h-6" />
                    {justValidated ? 'BIENVENUE !' : 'ACCREDITE'}
                  </div>
                  <div className="text-white/80 text-sm mt-1">
                    {justValidated 
                      ? `Presence enregistree a ${participant["Heure d'arrivee"]}`
                      : `Arrive a ${participant["Heure d'arrivee"] || '-'}`
                    }
                  </div>
                </>
              ) : (
                <div className="text-white font-bold tracking-wider">EN ATTENTE</div>
              )}
            </div>

            {/* Participant info */}
            <div className="p-6">
              {/* Avatar & Name */}
              <div className="flex items-center gap-4 mb-6">
                <div 
                  className="w-20 h-20 rounded-xl flex items-center justify-center text-2xl font-bold shadow-lg"
                  style={{ background: colors.bg, color: colors.text }}
                >
                  {getInitials(participant)}
                </div>
                <div>
                  <div className="font-bold text-xl text-white" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    {participant.Prenom} {participant.Nom}
                  </div>
                  <div className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {participant.Organisation || '-'}
                  </div>
                  <div 
                    className="inline-block mt-2 px-3 py-1 rounded text-xs font-bold"
                    style={{ background: `${colors.bg}30`, color: colors.bg === COLORS.gold ? COLORS.charbon : colors.text, border: `1px solid ${colors.bg}` }}
                  >
                    {badgeType || 'PARTICIPANT'}
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  <MapPin className="w-5 h-5" style={{ color: COLORS.terracotta }} />
                  <span>{getFieldValue(participant["Territoire d'origine"]) || '-'}</span>
                </div>
                <div className="flex items-center gap-3" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  <Tag className="w-5 h-5" style={{ color: COLORS.terracotta }} />
                  <span>{getFieldValue(participant["Secteur d'activite"]) || '-'}</span>
                </div>
                {participant.Email && (
                  <div className="flex items-center gap-3" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    <User className="w-5 h-5" style={{ color: COLORS.terracotta }} />
                    <span className="text-sm">{participant.Email}</span>
                  </div>
                )}
              </div>

              {/* Access zones */}
              <div className="rounded-lg p-4" style={{ background: 'rgba(0,0,0,0.2)' }}>
                <div className="text-xs uppercase tracking-wider mb-3" style={{ color: COLORS.gold, fontFamily: "'Syne', sans-serif" }}>
                  Zones d'acces autorisees
                </div>
                <div className="flex flex-wrap gap-2">
                  {['Parc La Savane', 'Tropiques Atrium', 'Espace Pro'].map(zone => (
                    <span 
                      key={zone}
                      className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{ background: `${COLORS.gold}15`, border: `1px solid ${COLORS.gold}30`, color: COLORS.gold }}
                    >
                      {zone}
                    </span>
                  ))}
                </div>
              </div>

              {/* Success message for just validated */}
              {justValidated && (
                <div className="mt-4 p-4 rounded-lg text-center" style={{ background: 'rgba(77,191,138,0.1)', border: '1px solid rgba(77,191,138,0.2)' }}>
                  <CheckCircle className="w-8 h-8 mx-auto mb-2" style={{ color: '#4DBF8A' }} />
                  <div className="font-bold" style={{ color: '#4DBF8A' }}>Presence validee automatiquement</div>
                  <div className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    Donnees synchronisees avec Baserow
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 text-center" style={{ background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="text-xs font-bold tracking-wider" style={{ color: COLORS.terracotta }}>
                22 MAI 2026 - LA SAVANE - FORT-DE-FRANCE
              </div>
              <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                kiltikonet.fr - @cultureconnectorg
              </div>
            </div>
          </div>
        ) : null}

        {/* ID footer */}
        <div className="text-center mt-4">
          <div className="font-mono text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
            ID: {id}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BadgeScan;
