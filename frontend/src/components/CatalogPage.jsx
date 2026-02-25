import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Search, Filter, MapPin, Briefcase, Star, Users, Globe, 
  Building2, Mic2, Newspaper, MoreHorizontal, ExternalLink,
  Sparkles, Crown, Mail, Grid, List
} from 'lucide-react';
import { profileTypes, countryList } from '../lib/translations';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const tierConfig = {
  emerging: { name: 'Émergent', nameEn: 'Emerging', color: '#00d4ff', icon: Sparkles },
  professional: { name: 'Professionnel', nameEn: 'Professional', color: '#D2A53C', icon: Users },
  institutional: { name: 'Institutionnel', nameEn: 'Institutional', color: '#a855f7', icon: Crown }
};

const profileIcons = {
  'artist': Mic2,
  'label': Building2,
  'booking_agency': Globe,
  'institution': Building2,
  'press': Newspaper,
  'other': MoreHorizontal
};

// Placeholder images for demo
const placeholderImages = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop'
];

export const CatalogPage = () => {
  const { language, t } = useLanguage();
  const [participants, setParticipants] = useState([]);
  const [filteredParticipants, setFilteredParticipants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  
  const [filters, setFilters] = useState({
    search: '',
    region: '',
    sector: '',
    tier: ''
  });

  const fetchParticipants = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API}/registrations?status=approved`);
      // Add placeholder images and random tiers for demo
      const participantsWithImages = response.data.registrations.map((p, i) => ({
        ...p,
        image: placeholderImages[i % placeholderImages.length],
        tier: ['emerging', 'professional', 'institutional'][Math.floor(Math.random() * 3)]
      }));
      setParticipants(participantsWithImages);
      setFilteredParticipants(participantsWithImages);
    } catch (error) {
      console.error('Error fetching participants:', error);
      // Demo data if no approved registrations
      const demoData = [
        { id: '1', full_name: 'Marie Césaire', organization_name: 'Kassav Productions', profile_type: 'label', country: 'martinique', bio: 'Label indépendant spécialisé dans la musique caribéenne contemporaine.', image: placeholderImages[0], tier: 'professional', stand_request: true },
        { id: '2', full_name: 'Jean-Pierre Mona', organization_name: 'Atrium Martinique', profile_type: 'institution', country: 'martinique', bio: 'Centre culturel et scène nationale de Martinique.', image: placeholderImages[1], tier: 'institutional', stand_request: true },
        { id: '3', full_name: 'Léa Dorival', organization_name: 'Kompa Records', profile_type: 'artist', country: 'haiti', bio: 'Artiste et productrice de musique fusion afro-caribéenne.', image: placeholderImages[2], tier: 'emerging', stand_request: false },
        { id: '4', full_name: 'Marcus Saint-Prix', organization_name: 'Caribbean Booking', profile_type: 'booking_agency', country: 'guadeloupe', bio: 'Agence de booking spécialisée dans les artistes caribéens.', image: placeholderImages[3], tier: 'professional', stand_request: true },
        { id: '5', full_name: 'Fabienne Louison', organization_name: 'Trace Media', profile_type: 'press', country: 'france', bio: 'Journaliste culturelle spécialisée dans les musiques du monde.', image: placeholderImages[4], tier: 'professional', stand_request: false },
        { id: '6', full_name: 'Patrick Chamoiseau', organization_name: 'Créole Sounds', profile_type: 'label', country: 'martinique', bio: 'Maison de disques dédiée au patrimoine musical antillais.', image: placeholderImages[5], tier: 'institutional', stand_request: true }
      ];
      setParticipants(demoData);
      setFilteredParticipants(demoData);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  useEffect(() => {
    let result = [...participants];
    
    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(p => 
        p.full_name?.toLowerCase().includes(search) ||
        p.organization_name?.toLowerCase().includes(search) ||
        p.bio?.toLowerCase().includes(search)
      );
    }
    
    if (filters.region) {
      result = result.filter(p => p.country === filters.region);
    }
    
    if (filters.sector) {
      result = result.filter(p => p.profile_type === filters.sector);
    }
    
    if (filters.tier) {
      result = result.filter(p => p.tier === filters.tier);
    }
    
    setFilteredParticipants(result);
  }, [filters, participants]);

  const getProfileLabel = (type) => {
    const profile = profileTypes.find(p => p.value === type);
    return profile ? t(profile.labelKey) : type;
  };

  const getCountryLabel = (code) => {
    const country = countryList.find(c => c.value === code);
    if (country) {
      const translated = t(`countries.${country.labelKey}`);
      return translated !== `countries.${country.labelKey}` ? translated : code;
    }
    return code;
  };

  const ProfileIcon = ({ type }) => {
    const Icon = profileIcons[type] || Users;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] pt-20 sm:pt-24">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#00d4ff]/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#D2A53C]/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl sm:text-5xl text-white mb-4">
            {language === 'fr' ? 'Catalogue' : 'Catalog'}
            <span className="text-[#00d4ff]"> Culture Connect</span>
          </h1>
          <p className="text-white/60 max-w-2xl mx-auto">
            {language === 'fr' 
              ? 'Découvrez les professionnels accrédités pour Culture Connect 2026'
              : 'Discover accredited professionals for Culture Connect 2026'
            }
          </p>
        </div>

        {/* Search & Filters Bar */}
        <div 
          className="rounded-2xl p-4 sm:p-6 mb-8"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(0,212,255,0.2)'
          }}
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <Input
                type="text"
                placeholder={language === 'fr' ? 'Rechercher un participant, organisation...' : 'Search participant, organization...'}
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 h-12 focus:border-[#00d4ff] text-base"
                data-testid="catalog-search"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              {/* Region Filter */}
              <Select value={filters.region} onValueChange={(v) => setFilters(prev => ({ ...prev, region: v === 'all' ? '' : v }))}>
                <SelectTrigger className="w-[160px] bg-white/5 border-white/10 text-white h-12 focus:border-[#00d4ff]" data-testid="filter-region">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#00d4ff]" />
                    <SelectValue placeholder={language === 'fr' ? 'Région' : 'Region'} />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-white/10">
                  <SelectItem value="all" className="text-white hover:bg-white/10">
                    {language === 'fr' ? 'Toutes régions' : 'All regions'}
                  </SelectItem>
                  {countryList.slice(0, 8).map((c) => (
                    <SelectItem key={c.value} value={c.value} className="text-white hover:bg-white/10">
                      {getCountryLabel(c.value)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sector Filter */}
              <Select value={filters.sector} onValueChange={(v) => setFilters(prev => ({ ...prev, sector: v === 'all' ? '' : v }))}>
                <SelectTrigger className="w-[160px] bg-white/5 border-white/10 text-white h-12 focus:border-[#00d4ff]" data-testid="filter-sector">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-[#00d4ff]" />
                    <SelectValue placeholder={language === 'fr' ? 'Secteur' : 'Sector'} />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-white/10">
                  <SelectItem value="all" className="text-white hover:bg-white/10">
                    {language === 'fr' ? 'Tous secteurs' : 'All sectors'}
                  </SelectItem>
                  {profileTypes.map((p) => (
                    <SelectItem key={p.value} value={p.value} className="text-white hover:bg-white/10">
                      {t(p.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Tier Filter */}
              <Select value={filters.tier} onValueChange={(v) => setFilters(prev => ({ ...prev, tier: v === 'all' ? '' : v }))}>
                <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white h-12 focus:border-[#00d4ff]" data-testid="filter-tier">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-[#00d4ff]" />
                    <SelectValue placeholder={language === 'fr' ? 'Accréditation' : 'Accreditation'} />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-white/10">
                  <SelectItem value="all" className="text-white hover:bg-white/10">
                    {language === 'fr' ? 'Tous niveaux' : 'All levels'}
                  </SelectItem>
                  {Object.entries(tierConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key} className="text-white hover:bg-white/10">
                      <span style={{ color: config.color }}>
                        {language === 'fr' ? config.name : config.nameEn}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* View Toggle */}
              <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-[#00d4ff]/20 text-[#00d4ff]' : 'text-white/40 hover:text-white'}`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-[#00d4ff]/20 text-[#00d4ff]' : 'text-white/40 hover:text-white'}`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Results count */}
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-white/50">
              {filteredParticipants.length} {language === 'fr' ? 'participant(s) trouvé(s)' : 'participant(s) found'}
            </span>
            {(filters.search || filters.region || filters.sector || filters.tier) && (
              <button
                onClick={() => setFilters({ search: '', region: '', sector: '', tier: '' })}
                className="text-[#00d4ff] hover:underline"
              >
                {language === 'fr' ? 'Réinitialiser les filtres' : 'Reset filters'}
              </button>
            )}
          </div>
        </div>

        {/* Participants Grid/List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#00d4ff]/30 border-t-[#00d4ff] rounded-full animate-spin" />
          </div>
        ) : filteredParticipants.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <p className="text-white/50">
              {language === 'fr' ? 'Aucun participant trouvé' : 'No participants found'}
            </p>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid sm:grid-cols-2 lg:grid-cols-3 gap-6' 
            : 'space-y-4'
          }>
            {filteredParticipants.map((participant) => {
              const tierInfo = tierConfig[participant.tier] || tierConfig.emerging;
              const TierIcon = tierInfo.icon;
              
              return viewMode === 'grid' ? (
                /* Grid Card */
                <div
                  key={participant.id}
                  className="group relative rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-2"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02))',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}
                  data-testid={`participant-card-${participant.id}`}
                >
                  {/* Hover glow */}
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{
                      boxShadow: `inset 0 0 60px ${tierInfo.color}10, 0 0 40px ${tierInfo.color}10`
                    }}
                  />

                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={participant.image}
                      alt={participant.full_name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent" />
                    
                    {/* Tier Badge */}
                    <div 
                      className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                      style={{
                        background: `${tierInfo.color}30`,
                        border: `1px solid ${tierInfo.color}50`,
                        color: tierInfo.color
                      }}
                    >
                      <TierIcon className="w-3 h-3" />
                      {language === 'fr' ? tierInfo.name : tierInfo.nameEn}
                    </div>

                    {/* Stand Badge */}
                    {participant.stand_request && (
                      <div className="absolute top-3 left-3 px-2 py-1 bg-[#D2A53C]/80 text-[#0a0a0f] text-xs font-medium rounded">
                        Stand
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="relative p-5">
                    {/* Profile Icon */}
                    <div 
                      className="absolute -top-6 left-5 w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{
                        background: 'linear-gradient(135deg, #1a1a2e, #0a0a0f)',
                        border: `2px solid ${tierInfo.color}40`
                      }}
                    >
                      <ProfileIcon type={participant.profile_type} />
                      <div className="absolute inset-0 rounded-xl" style={{ boxShadow: `0 0 20px ${tierInfo.color}30` }} />
                    </div>

                    <div className="pt-4">
                      <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-[#00d4ff] transition-colors">
                        {participant.full_name}
                      </h3>
                      <p className="text-white/60 text-sm mb-3">{participant.organization_name}</p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span 
                          className="px-2.5 py-1 rounded-full text-xs"
                          style={{ background: `${tierInfo.color}15`, color: tierInfo.color }}
                        >
                          {getProfileLabel(participant.profile_type)}
                        </span>
                        <span className="px-2.5 py-1 bg-white/10 text-white/70 rounded-full text-xs">
                          {getCountryLabel(participant.country)}
                        </span>
                        <span className="px-2.5 py-1 bg-white/10 text-white/70 rounded-full text-xs">
                          B2B
                        </span>
                      </div>

                      {/* Bio */}
                      <p className="text-white/50 text-sm line-clamp-2 mb-4">
                        {participant.bio}
                      </p>

                      {/* Action */}
                      <button 
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all"
                        style={{
                          background: `${tierInfo.color}15`,
                          border: `1px solid ${tierInfo.color}30`,
                          color: tierInfo.color
                        }}
                      >
                        <Mail className="w-4 h-4" />
                        {language === 'fr' ? 'Contacter' : 'Contact'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* List Card */
                <div
                  key={participant.id}
                  className="flex items-center gap-4 p-4 rounded-xl transition-all hover:bg-white/5"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}
                >
                  <img
                    src={participant.image}
                    alt={participant.full_name}
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-medium truncate">{participant.full_name}</h3>
                      <span 
                        className="px-2 py-0.5 rounded text-xs"
                        style={{ background: `${tierInfo.color}20`, color: tierInfo.color }}
                      >
                        {language === 'fr' ? tierInfo.name : tierInfo.nameEn}
                      </span>
                    </div>
                    <p className="text-white/60 text-sm truncate">{participant.organization_name}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-white/10 text-white/60 rounded text-xs">
                      {getProfileLabel(participant.profile_type)}
                    </span>
                    <span className="px-2.5 py-1 bg-white/10 text-white/60 rounded text-xs">
                      {getCountryLabel(participant.country)}
                    </span>
                  </div>
                  <button 
                    className="px-4 py-2 rounded-lg text-sm"
                    style={{ background: `${tierInfo.color}15`, color: tierInfo.color }}
                  >
                    <Mail className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
