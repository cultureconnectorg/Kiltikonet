import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, XCircle, User, Building2, MapPin, Tag, Clock, Loader2 } from 'lucide-react';
import { Button } from './ui/button';

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════
const BASEROW_TOKEN = 'BjKPCSpcpif72OtZtsmMFUbZysqlNGiK';
const BASEROW_TABLE = '865847';
const BASEROW_API = 'https://api.baserow.io/api';

// ═══════════════════════════════════════════════════════════════
// BADGE SCAN PAGE - Public page for scanning participant badges
// ═══════════════════════════════════════════════════════════════
const BadgeScan = () => {
  const { id } = useParams();
  const [participant, setParticipant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [validating, setValidating] = useState(false);
  const [validated, setValidated] = useState(false);

  // Load participant data
  useEffect(() => {
    const loadParticipant = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Try to fetch by ID
        const response = await fetch(
          `${BASEROW_API}/database/rows/table/${BASEROW_TABLE}/${id}/?user_field_names=true`,
          { headers: { 'Authorization': `Token ${BASEROW_TOKEN}` } }
        );
        
        if (!response.ok) {
          throw new Error('Participant non trouvé');
        }
        
        const data = await response.json();
        setParticipant(data);
      } catch (err) {
        console.error('Error loading participant:', err);
        setError(err.message || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadParticipant();
    }
  }, [id]);

  // Validate presence
  const validatePresence = async () => {
    if (!participant || participant['Statut presence'] === 'Présent') return;
    
    setValidating(true);
    const heure = new Date().toTimeString().slice(0, 5);
    
    try {
      const response = await fetch(
        `${BASEROW_API}/database/rows/table/${BASEROW_TABLE}/${participant.id}/?user_field_names=true`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Token ${BASEROW_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            'Statut presence': 'Présent',
            "Heure d'arrivee": heure
          })
        }
      );
      
      if (!response.ok) throw new Error('Erreur de validation');
      
      setParticipant(prev => ({
        ...prev,
        'Statut presence': 'Présent',
        "Heure d'arrivee": heure
      }));
      setValidated(true);
    } catch (err) {
      console.error('Validation error:', err);
      setError('Erreur lors de la validation');
    } finally {
      setValidating(false);
    }
  };

  const getInitials = (p) => {
    if (!p) return '??';
    return ((p.Prenom || '?')[0] + (p.Nom || '?')[0]).toUpperCase();
  };

  const isPresent = participant?.['Statut presence'] === 'Présent';

  // Badge type colors
  const badgeColors = {
    'VIP': 'from-purple-600 to-purple-800',
    'Presse': 'from-teal-600 to-teal-800',
    'Exposant': 'from-amber-600 to-amber-800',
    'Artiste': 'from-rose-600 to-rose-800',
    'Benevole': 'from-green-600 to-green-800',
    'Institutionnel': 'from-blue-600 to-blue-800'
  };

  return (
    <div className="min-h-screen bg-[#1C1A14] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4A84B] to-[#C4714A] flex items-center justify-center">
              <span className="text-[#1C1A14] font-bold text-sm">CC</span>
            </div>
            <div>
              <div className="text-[#D4A84B] font-bold tracking-wider">CULTURE CONNECT</div>
              <div className="text-[#C4714A] text-xs tracking-widest">2026</div>
            </div>
          </div>
          <div className="text-white/30 text-xs uppercase tracking-widest mt-4">
            Vérification d'accréditation
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="bg-[#2A2820] border border-[#D4A84B]/15 rounded-xl p-8 text-center">
            <Loader2 className="w-12 h-12 text-[#C4714A] animate-spin mx-auto mb-4" />
            <div className="text-white/50 text-sm">Chargement des données...</div>
          </div>
        ) : error ? (
          <div className="bg-[#2A2820] border border-red-500/30 rounded-xl p-8 text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <div className="text-red-400 font-bold text-lg mb-2">Erreur</div>
            <div className="text-white/50 text-sm">{error}</div>
            <div className="text-white/30 text-xs mt-4 font-mono">ID: {id}</div>
          </div>
        ) : participant ? (
          <div className="bg-[#2A2820] border border-[#D4A84B]/15 rounded-xl overflow-hidden">
            {/* Status banner */}
            {isPresent ? (
              <div className="bg-green-600 p-3 text-center">
                <div className="flex items-center justify-center gap-2 text-white font-bold">
                  <CheckCircle className="w-5 h-5" />
                  PRÉSENCE VALIDÉE
                </div>
                {participant["Heure d'arrivee"] && (
                  <div className="text-white/80 text-xs mt-1">
                    Arrivée à {participant["Heure d'arrivee"]}
                  </div>
                )}
              </div>
            ) : validated ? (
              <div className="bg-green-600 p-3 text-center">
                <div className="flex items-center justify-center gap-2 text-white font-bold">
                  <CheckCircle className="w-5 h-5" />
                  VALIDÉ AVEC SUCCÈS !
                </div>
              </div>
            ) : (
              <div className="bg-[#8B1A4A] p-3 text-center">
                <div className="text-white font-bold tracking-wider">EN ATTENTE DE VALIDATION</div>
              </div>
            )}

            {/* Participant info */}
            <div className="p-6">
              {/* Avatar & Name */}
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${badgeColors[participant['Type de badge']] || 'from-[#8B1A4A] to-[#6D1238]'} flex items-center justify-center shadow-lg`}>
                  <span className="text-white font-bold text-xl">{getInitials(participant)}</span>
                </div>
                <div>
                  <div className="text-white font-bold text-xl">
                    {participant.Prenom} {participant.Nom}
                  </div>
                  <div className="text-white/50 text-sm">{participant.Organisation || '—'}</div>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-white/70">
                  <Tag className="w-5 h-5 text-[#C4714A]" />
                  <span className="font-semibold">{participant['Type de badge'] || 'Non défini'}</span>
                </div>
                
                <div className="flex items-center gap-3 text-white/70">
                  <MapPin className="w-5 h-5 text-[#C4714A]" />
                  <span>{participant["Territoire d'origine"] || '—'}</span>
                </div>
                
                {participant['Zones acces'] && (
                  <div className="flex items-start gap-3 text-white/70">
                    <Building2 className="w-5 h-5 text-[#C4714A] shrink-0 mt-0.5" />
                    <span className="text-sm">{participant['Zones acces']}</span>
                  </div>
                )}
              </div>

              {/* Access zones */}
              <div className="bg-[#1C1A14] rounded-lg p-4 mb-6">
                <div className="text-[#D4A84B] text-xs uppercase tracking-widest mb-2">Zones d'accès</div>
                <div className="flex flex-wrap gap-2">
                  {['Parc La Savane', 'Tropiques Atrium', 'Zone VIP'].map(zone => (
                    <span 
                      key={zone}
                      className="px-3 py-1 bg-[#D4A84B]/10 border border-[#D4A84B]/20 rounded-full text-[#D4A84B] text-xs"
                    >
                      {zone}
                    </span>
                  ))}
                </div>
              </div>

              {/* Validate button */}
              {!isPresent && !validated && (
                <Button
                  onClick={validatePresence}
                  disabled={validating}
                  className="w-full py-6 bg-gradient-to-r from-[#C4714A] to-[#8B1A4A] hover:from-[#A85A38] hover:to-[#6D1238] text-white font-bold text-lg shadow-lg"
                >
                  {validating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Validation en cours...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      VALIDER LA PRÉSENCE
                    </>
                  )}
                </Button>
              )}

              {/* Already validated message */}
              {(isPresent || validated) && (
                <div className="text-center py-4">
                  <div className="text-green-400 font-bold mb-1">Bienvenue à Culture Connect 2026 !</div>
                  <div className="text-white/50 text-sm">Votre accréditation est confirmée</div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-[#1C1A14] p-4 text-center border-t border-[#D4A84B]/15">
              <div className="text-[#C4714A] text-xs font-bold tracking-wider">
                22 MAI 2026 · FORT-DE-FRANCE
              </div>
              <div className="text-white/30 text-xs mt-1">kiltikonet.fr</div>
            </div>
          </div>
        ) : null}

        {/* ID Display */}
        <div className="text-center mt-4">
          <div className="text-white/20 text-xs font-mono">
            ID: {id}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BadgeScan;
