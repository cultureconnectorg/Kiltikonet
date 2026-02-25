import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Search, MapPin, Briefcase, Users, Globe, Building2, Mic2, Newspaper, MoreHorizontal, Mail, Grid, List } from 'lucide-react';
import { profileTypes, countryList } from '../lib/translations';
import { BadgeGenerator } from './BadgeGenerator';
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
  const [filters, setFilters] = useState({ search: '', region: '', sector: '', tier: '' });
  const [selectedParticipant, setSelectedParticipant] = useState(null);

  const fetchParticipants = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API}/registrations`);
      const all = response.data.registrations || [];
      const withImages = all.map((p, i) => ({
        ...p,
        image: placeholderImages[i % placeholderImages.length],
        tier: ['emerging', 'professional', 'institutional'][Math.floor(Math.random() * 3)]
      }));
      
      if (withImages.length === 0) {
        const demo = [
          { id: '1', full_name: 'Marie Césaire', organization_name: 'Kassav Productions', profile_type: 'label', country: 'martinique', bio: 'Label indépendant spécialisé dans la musique caribéenne.', image: placeholderImages[0], tier: 'professional', stand_request: true },
          { id: '2', full_name: 'Jean-Pierre Mona', organization_name: 'Atrium Martinique', profile_type: 'institution', country: 'martinique', bio: 'Centre culturel et scène nationale.', image: placeholderImages[1], tier: 'institutional', stand_request: true },
          { id: '3', full_name: 'Léa Dorival', organization_name: 'Kompa Records', profile_type: 'artist', country: 'haiti', bio: 'Artiste fusion afro-caribéenne.', image: placeholderImages[2], tier: 'emerging', stand_request: false },
          { id: '4', full_name: 'Marcus Saint-Prix', organization_name: 'Caribbean Booking', profile_type: 'booking_agency', country: 'guadeloupe', bio: 'Agence de booking caribéenne.', image: placeholderImages[3], tier: 'professional', stand_request: true },
          { id: '5', full_name: 'Fabienne Louison', organization_name: 'Trace Media', profile_type: 'press', country: 'france', bio: 'Journaliste culturelle.', image: placeholderImages[4], tier: 'professional', stand_request: false },
          { id: '6', full_name: 'Patrick Chamoiseau', organization_name: 'Créole Sounds', profile_type: 'label', country: 'martinique', bio: 'Patrimoine musical antillais.', image: placeholderImages[5], tier: 'institutional', stand_request: true }
        ];
        setParticipants(demo);
        setFilteredParticipants(demo);
      } else {
        setParticipants(withImages);
        setFilteredParticipants(withImages);
      }
    } catch (error) {
      const demo = [
        { id: '1', full_name: 'Marie Césaire', organization_name: 'Kassav Productions', profile_type: 'label', country: 'martinique', bio: 'Label indépendant.', image: placeholderImages[0], tier: 'professional', stand_request: true },
        { id: '2', full_name: 'Jean-Pierre Mona', organization_name: 'Atrium Martinique', profile_type: 'institution', country: 'martinique', bio: 'Centre culturel.', image: placeholderImages[1], tier: 'institutional', stand_request: true }
      ];
      setParticipants(demo);
      setFilteredParticipants(demo);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchParticipants(); }, [fetchParticipants]);

  useEffect(() => {
    let result = [...participants];
    if (filters.search) {
      const s = filters.search.toLowerCase();
      result = result.filter(p => p.full_name?.toLowerCase().includes(s) || p.organization_name?.toLowerCase().includes(s));
    }
    if (filters.region) result = result.filter(p => p.country === filters.region);
    if (filters.sector) result = result.filter(p => p.profile_type === filters.sector);
    if (filters.tier) result = result.filter(p => p.tier === filters.tier);
    setFilteredParticipants(result);
  }, [filters, participants]);

  const getProfileLabel = (type) => {
    const p = profileTypes.find(x => x.value === type);
    return p ? t(p.labelKey) : type;
  };

  const getCountryLabel = (code) => {
    const c = countryList.find(x => x.value === code);
    return c ? (t(`countries.${c.labelKey}`) !== `countries.${c.labelKey}` ? t(`countries.${c.labelKey}`) : code) : code;
  };

  return (
    <div className="min-h-screen bg-paper pt-24 sm:pt-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-terracotta font-syne text-sm tracking-widest uppercase mb-4">
            {language === 'fr' ? 'Répertoire' : 'Directory'}
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl text-charcoal mb-4">
            Catalogue
          </h1>
          <p className="text-charcoal/60 max-w-2xl mx-auto">
            {language === 'fr' ? 'Découvrez les professionnels accrédités' : 'Discover accredited professionals'}
          </p>
        </div>

        {/* Filters */}
        <div className="border border-lightborder bg-cream p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
              <Input
                placeholder={language === 'fr' ? 'Rechercher...' : 'Search...'}
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-11 h-12 bg-paper border-lightborder text-charcoal rounded-none"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Select value={filters.region} onValueChange={(v) => setFilters(prev => ({ ...prev, region: v === 'all' ? '' : v }))}>
                <SelectTrigger className="w-[140px] h-12 bg-paper border-lightborder text-charcoal rounded-none">
                  <SelectValue placeholder={language === 'fr' ? 'Région' : 'Region'} />
                </SelectTrigger>
                <SelectContent className="bg-paper border-lightborder">
                  <SelectItem value="all">{language === 'fr' ? 'Toutes' : 'All'}</SelectItem>
                  {countryList.slice(0, 8).map(c => (
                    <SelectItem key={c.value} value={c.value}>{getCountryLabel(c.value)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filters.sector} onValueChange={(v) => setFilters(prev => ({ ...prev, sector: v === 'all' ? '' : v }))}>
                <SelectTrigger className="w-[140px] h-12 bg-paper border-lightborder text-charcoal rounded-none">
                  <SelectValue placeholder={language === 'fr' ? 'Secteur' : 'Sector'} />
                </SelectTrigger>
                <SelectContent className="bg-paper border-lightborder">
                  <SelectItem value="all">{language === 'fr' ? 'Tous' : 'All'}</SelectItem>
                  {profileTypes.map(p => (
                    <SelectItem key={p.value} value={p.value}>{t(p.labelKey)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex border border-lightborder bg-paper">
                <button onClick={() => setViewMode('grid')} className={`p-3 ${viewMode === 'grid' ? 'bg-charcoal text-paper' : 'text-charcoal/50'}`}>
                  <Grid className="w-5 h-5" />
                </button>
                <button onClick={() => setViewMode('list')} className={`p-3 ${viewMode === 'list' ? 'bg-charcoal text-paper' : 'text-charcoal/50'}`}>
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm text-charcoal/50">
            {filteredParticipants.length} {language === 'fr' ? 'participant(s)' : 'participant(s)'}
          </p>
        </div>

        {/* Grid/List */}
        {isLoading ? (
          <div className="text-center py-20 text-charcoal/50">Loading...</div>
        ) : filteredParticipants.length === 0 ? (
          <div className="text-center py-20 text-charcoal/50">
            {language === 'fr' ? 'Aucun participant trouvé' : 'No participants found'}
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {filteredParticipants.map((p) => {
              const tier = tierConfig[p.tier] || tierConfig.professional;
              const Icon = profileIcons[p.profile_type] || Users;
              
              return viewMode === 'grid' ? (
                <div key={p.id} className="border border-lightborder bg-cream group hover:border-terracotta transition-colors">
                  <div className="relative h-48 overflow-hidden">
                    <img src={p.image} alt={p.full_name} className="w-full h-full object-cover" />
                    <div className="absolute top-3 right-3 px-3 py-1 text-xs font-syne" style={{ backgroundColor: tier.color, color: '#F4F1EA' }}>
                      {language === 'fr' ? tier.name : tier.nameEn}
                    </div>
                    {p.stand_request && (
                      <div className="absolute top-3 left-3 px-2 py-1 bg-sage text-paper text-xs">Stand</div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-4 h-4 text-charcoal/40" />
                      <span className="text-xs text-charcoal/50">{getProfileLabel(p.profile_type)}</span>
                    </div>
                    <h3 className="font-serif text-lg text-charcoal mb-1">{p.full_name}</h3>
                    <p className="text-sm text-charcoal/60 mb-3">{p.organization_name}</p>
                    <div className="flex gap-2 mb-4">
                      <span className="px-2 py-1 border border-lightborder text-xs text-charcoal/60">{getCountryLabel(p.country)}</span>
                      <span className="px-2 py-1 border border-lightborder text-xs text-charcoal/60">B2B</span>
                    </div>
                    <p className="text-sm text-charcoal/50 line-clamp-2 mb-4">{p.bio}</p>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setSelectedParticipant(p)}
                        className="flex-1 py-2 border border-charcoal text-charcoal text-sm font-syne hover:bg-charcoal hover:text-paper transition-colors"
                      >
                        Badge
                      </button>
                      <button className="flex-1 py-2 bg-terracotta text-paper text-sm font-syne hover:bg-terracotta/90 flex items-center justify-center gap-1">
                        <Mail className="w-4 h-4" />
                        Contact
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div key={p.id} className="flex items-center gap-4 p-4 border border-lightborder bg-cream hover:border-terracotta transition-colors">
                  <img src={p.image} alt={p.full_name} className="w-16 h-16 object-cover" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif text-charcoal truncate">{p.full_name}</h3>
                    <p className="text-sm text-charcoal/60 truncate">{p.organization_name}</p>
                  </div>
                  <span className="hidden sm:block px-3 py-1 text-xs font-syne" style={{ backgroundColor: tier.color, color: '#F4F1EA' }}>
                    {language === 'fr' ? tier.name : tier.nameEn}
                  </span>
                  <button onClick={() => setSelectedParticipant(p)} className="px-4 py-2 border border-charcoal text-charcoal text-sm hover:bg-charcoal hover:text-paper">
                    Badge
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedParticipant && (
        <BadgeGenerator participant={selectedParticipant} onClose={() => setSelectedParticipant(null)} />
      )}
    </div>
  );
};
