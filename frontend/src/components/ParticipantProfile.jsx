import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Button } from './ui/button';
import { 
  CheckCircle, XCircle, Clock, MapPin, Building2, Globe, 
  Mic2, Newspaper, MoreHorizontal, Download, ArrowLeft, Tag, Calendar
} from 'lucide-react';
import { profileTypes, expertiseTags as expertiseTagsList } from '../lib/translations';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const tierConfig = {
  emerging: { name: 'Émergent', nameEn: 'Emerging', color: '#4A5D4E' },
  professional: { name: 'Professionnel', nameEn: 'Professional', color: '#A65D47' },
  institutional: { name: 'Institutionnel', nameEn: 'Institutional', color: '#1A1A1A' }
};

const profileIcons = {
  'artist': Mic2, 'label': Building2, 'booking_agency': Globe,
  'institution': Building2, 'press': Newspaper, 'other': MoreHorizontal
};

export const ParticipantProfile = () => {
  const { participantId } = useParams();
  const { language, t } = useLanguage();
  const [participant, setParticipant] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchParticipant = async () => {
      try {
        const response = await axios.get(`${API}/participant/${participantId}`);
        setParticipant(response.data);
      } catch (err) {
        setError(err.response?.data?.detail || 'Participant not found');
      } finally {
        setIsLoading(false);
      }
    };

    if (participantId) {
      fetchParticipant();
    }
  }, [participantId]);

  const handleDownloadBadge = () => {
    window.open(`${API}/participant/${participantId}/badge`, '_blank');
  };

  const getProfileLabel = (type) => {
    const p = profileTypes.find(x => x.value === type);
    return p ? t(p.labelKey) : type;
  };

  const getExpertiseLabel = (tagValue) => {
    const tag = expertiseTagsList.find(t => t.value === tagValue);
    return tag ? (language === 'fr' ? tag.labelFr : tag.labelEn) : tagValue;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-paper pt-24 flex items-center justify-center">
        <div className="text-charcoal/50">Chargement...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-paper pt-24 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-terracotta mx-auto mb-4" />
          <h1 className="font-serif text-2xl text-charcoal mb-2">
            {language === 'fr' ? 'Participant non trouvé' : 'Participant not found'}
          </h1>
          <p className="text-charcoal/50 mb-6">{error}</p>
          <Link to="/catalog">
            <Button variant="outline" className="border-charcoal text-charcoal">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {language === 'fr' ? 'Retour au catalogue' : 'Back to catalog'}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const tier = tierConfig[participant?.tier] || tierConfig.professional;
  const Icon = profileIcons[participant?.profile_type] || Building2;

  return (
    <div className="min-h-screen bg-paper pt-24 sm:pt-32">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back link */}
        <Link to="/catalog" className="flex items-center gap-2 text-charcoal/50 hover:text-terracotta mb-8">
          <ArrowLeft className="w-4 h-4" />
          {language === 'fr' ? 'Retour au catalogue' : 'Back to catalog'}
        </Link>

        {/* Status Banner */}
        <div className={`p-4 mb-8 border ${
          participant.is_approved 
            ? 'border-sage bg-sage/10' 
            : participant.status === 'pending'
              ? 'border-amber-500 bg-amber-50'
              : 'border-terracotta bg-terracotta/10'
        }`}>
          <div className="flex items-center gap-3">
            {participant.is_approved ? (
              <CheckCircle className="w-6 h-6 text-sage" />
            ) : participant.status === 'pending' ? (
              <Clock className="w-6 h-6 text-amber-500" />
            ) : (
              <XCircle className="w-6 h-6 text-terracotta" />
            )}
            <div>
              <p className={`font-syne font-medium ${
                participant.is_approved ? 'text-sage' : participant.status === 'pending' ? 'text-amber-700' : 'text-terracotta'
              }`}>
                {participant.is_approved 
                  ? (language === 'fr' ? 'ACCRÉDITATION VALIDÉE' : 'ACCREDITATION VALIDATED')
                  : participant.status === 'pending'
                    ? (language === 'fr' ? 'EN ATTENTE DE VALIDATION' : 'PENDING VALIDATION')
                    : (language === 'fr' ? 'NON ACCRÉDITÉ' : 'NOT ACCREDITED')
                }
              </p>
              <p className="text-xs text-charcoal/50">
                Culture Connect 2026 · Fort-de-France · 20-23 Mai 2026
              </p>
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <div className="border border-lightborder bg-cream">
          {/* Header with photo */}
          <div className="p-8 text-center border-b border-lightborder">
            <div className="w-32 h-32 mx-auto mb-6 border-2 border-lightborder overflow-hidden">
              <img
                src={participant.logo_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop'}
                alt={participant.full_name}
                className="w-full h-full object-cover"
              />
            </div>
            
            <h1 className="font-serif text-2xl sm:text-3xl text-charcoal mb-2">
              {participant.full_name}
            </h1>
            <p className="text-charcoal/60 text-lg mb-4">
              {participant.organization_name}
            </p>
            
            {/* Tier badge */}
            <div 
              className="inline-block px-5 py-2 font-syne text-sm tracking-wider"
              style={{ backgroundColor: tier.color, color: '#F4F1EA' }}
            >
              {language === 'fr' ? tier.name.toUpperCase() : tier.nameEn.toUpperCase()}
            </div>
          </div>

          {/* Details */}
          <div className="p-8 space-y-6">
            <div className="flex items-center gap-3 text-charcoal/70">
              <Icon className="w-5 h-5 text-charcoal/40" />
              <span>{getProfileLabel(participant.profile_type)}</span>
            </div>
            
            <div className="flex items-center gap-3 text-charcoal/70">
              <MapPin className="w-5 h-5 text-charcoal/40" />
              <span>{participant.country}</span>
            </div>

            {participant.website_url && (
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-charcoal/40" />
                <a 
                  href={participant.website_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-terracotta hover:underline"
                >
                  {participant.website_url}
                </a>
              </div>
            )}

            {participant.stand_request && (
              <div className="flex items-center gap-3 text-sage">
                <Calendar className="w-5 h-5" />
                <span className="font-medium">
                  Stand: {participant.stand_category || 'Marché Culturel'}
                </span>
              </div>
            )}

            {/* Bio */}
            {participant.bio && (
              <div className="pt-4 border-t border-lightborder">
                <p className="text-xs text-charcoal/50 uppercase tracking-wider mb-2">Bio</p>
                <p className="text-charcoal/70 leading-relaxed">{participant.bio}</p>
              </div>
            )}

            {/* Expertise Tags */}
            {participant.expertise_tags && participant.expertise_tags.length > 0 && (
              <div className="pt-4 border-t border-lightborder">
                <p className="text-xs text-charcoal/50 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Tag className="w-3 h-3" />
                  {language === 'fr' ? 'Expertises & Intérêts' : 'Expertise & Interests'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {participant.expertise_tags.map((tagValue) => (
                    <span 
                      key={tagValue}
                      className="px-3 py-1 text-sm bg-charcoal/10 text-charcoal/70"
                    >
                      {getExpertiseLabel(tagValue)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ID */}
            <div className="pt-4 border-t border-lightborder">
              <p className="text-xs text-charcoal/50 uppercase tracking-wider mb-1">ID</p>
              <p className="font-mono text-charcoal/70">{participant.id}</p>
            </div>
          </div>

          {/* Download Badge (only for approved) */}
          {participant.is_approved && (
            <div className="p-8 border-t border-lightborder bg-paper">
              <Button 
                onClick={handleDownloadBadge}
                className="w-full h-14 font-syne text-base rounded-none"
                style={{ backgroundColor: tier.color, color: '#F4F1EA' }}
                data-testid="download-badge-btn"
              >
                <Download className="w-5 h-5 mr-2" />
                {language === 'fr' ? 'Télécharger mon badge PDF' : 'Download my PDF badge'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
