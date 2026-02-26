import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Search, MapPin, Briefcase, Users, Globe, Building2, Mic2, Newspaper, MoreHorizontal, Mail, Grid, List, Sparkles, X, ArrowRight } from 'lucide-react';
import { profileTypes, countryList } from '../lib/translations';
import { BadgeGenerator } from './BadgeGenerator';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const API_V1 = `${BACKEND_URL}/api/v1`;

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
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sectorKeywords, setSectorKeywords] = useState([]);

  const fetchParticipants = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch only catalog-visible AND approved participants
      const response = await axios.get(`${API}/catalog`);
      const catalogParticipants = response.data.participants || [];
      
      // Filter only approved participants and map with their uploaded photos
      const approvedParticipants = catalogParticipants
        .filter(p => p.status === 'approved')
        .map((p, i) => ({
          ...p,
          // Use the photo uploaded by the participant (logo_url from Cloudinary)
          image: p.logo_url || placeholderImages[i % placeholderImages.length],
          tier: p.tier || 'professional'
        }));
      
      setParticipants(approvedParticipants);
      setFilteredParticipants(approvedParticipants);
      
      // Fetch sector suggestions
      try {
        const suggestionsRes = await axios.get(`${API_V1}/search/match?limit=5`);
        setSectorKeywords(suggestionsRes.data.suggestions || []);
      } catch (e) {
        console.log('Suggestions not available');
      }
    } catch (error) {
      console.error('Error fetching catalog:', error);
      setParticipants([]);
      setFilteredParticipants([]);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Smart Connect: Get partner suggestions for a participant
  const fetchSuggestionsFor = async (participantId) => {
    try {
      const response = await axios.get(`${API_V1}/search/suggestions?participant_id=${participantId}`);
      setSuggestions(response.data.suggested_connections || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    }
  };
  
  // Smart Connect: Search by sector keyword
  const searchBySector = async (keyword) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_V1}/search/match?sector=${encodeURIComponent(keyword)}&limit=20`);
      const results = response.data.results || [];
      const mappedResults = results.map((r, i) => ({
        ...r,
        full_name: r.name,
        image: r.image_url || placeholderImages[i % placeholderImages.length]
      }));
      setFilteredParticipants(mappedResults);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
          
          {/* Smart Connect - Sector Keywords */}
          {sectorKeywords.length > 0 && (
            <div className="mt-4 pt-4 border-t border-lightborder">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-terracotta" />
                <span className="text-xs text-charcoal/50 uppercase font-syne">
                  {language === 'fr' ? 'Recherche par secteur' : 'Search by sector'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {sectorKeywords.map((keyword) => (
                  <button
                    key={keyword}
                    onClick={() => searchBySector(keyword)}
                    className="px-3 py-1.5 text-xs border border-lightborder bg-paper text-charcoal/70 hover:border-terracotta hover:text-terracotta transition-colors"
                  >
                    {keyword}
                  </button>
                ))}
                <button
                  onClick={() => { setFilters({ search: '', region: '', sector: '', tier: '' }); fetchParticipants(); }}
                  className="px-3 py-1.5 text-xs border border-sage/30 text-sage hover:bg-sage/10 transition-colors"
                >
                  {language === 'fr' ? 'Réinitialiser' : 'Reset'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Smart Connect - Partner Suggestions Panel */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="mb-8 border border-sage/30 bg-sage/5 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-sage" />
                <h3 className="text-sm font-syne text-charcoal uppercase">
                  {language === 'fr' ? 'Connexions suggérées' : 'Suggested Connections'}
                </h3>
              </div>
              <button onClick={() => setShowSuggestions(false)} className="text-charcoal/40 hover:text-charcoal">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {suggestions.map((s) => (
                <div key={s.id} className="flex-shrink-0 w-48 p-4 bg-paper border border-lightborder">
                  <p className="font-medium text-charcoal text-sm truncate">{s.name}</p>
                  <p className="text-xs text-charcoal/50 truncate">{s.organization}</p>
                  <p className="text-xs text-sage mt-1">{s.reason}</p>
                  <p className="text-xs text-charcoal/40 mt-1">{s.country}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Grid/List */}
        {isLoading ? (
          <div className="text-center py-20 text-charcoal/50">Loading...</div>
        ) : filteredParticipants.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 border-2 border-lightborder mx-auto mb-4 flex items-center justify-center">
              <Users className="w-8 h-8 text-charcoal/30" />
            </div>
            <p className="text-charcoal/50 mb-2">
              {language === 'fr' ? 'Aucun participant dans le catalogue' : 'No participants in the catalog'}
            </p>
            <p className="text-sm text-charcoal/40">
              {language === 'fr' 
                ? 'Les participants approuvés apparaîtront ici avec leur photo.'
                : 'Approved participants will appear here with their photo.'
              }
            </p>
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
                      <button 
                        onClick={() => fetchSuggestionsFor(p.id)}
                        className="flex-1 py-2 bg-sage text-paper text-sm font-syne hover:bg-sage/90 flex items-center justify-center gap-1"
                        title={language === 'fr' ? 'Trouver des partenaires similaires' : 'Find similar partners'}
                      >
                        <Sparkles className="w-4 h-4" />
                        Smart
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
