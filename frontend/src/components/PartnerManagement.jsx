import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Building2, Mail, Phone, Globe, Plus, Trash2, Link, Unlink, Search, 
  Users, ExternalLink, X, Check, Edit2, Save
} from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const tierConfig = {
  bronze: { name: 'Bronze', price: '2 500€', color: '#CD7F32' },
  silver: { name: 'Silver', price: '5 000€', color: '#C0C0C0' },
  gold: { name: 'Gold', price: '10 000€', color: '#FFD700' }
};

export const PartnerManagement = () => {
  const { language } = useLanguage();
  const [partners, setPartners] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [newPartner, setNewPartner] = useState({
    company_name: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    tier: 'bronze',
    website: '',
    logo_url: '',
    show_on_landing: true
  });

  const fetchPartners = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/partners/admin`);
      setPartners(response.data.partners || []);
    } catch (error) {
      console.error('Error fetching partners:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchRegistrations = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/registrations`);
      setRegistrations(response.data.registrations || []);
    } catch (error) {
      console.error('Error fetching registrations:', error);
    }
  }, []);

  useEffect(() => {
    fetchPartners();
    fetchRegistrations();
  }, [fetchPartners, fetchRegistrations]);

  const handleAddPartner = async () => {
    try {
      await axios.post(`${API}/partners/manual`, newPartner);
      setShowAddForm(false);
      setNewPartner({
        company_name: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        tier: 'bronze',
        website: '',
        logo_url: '',
        show_on_landing: true
      });
      fetchPartners();
    } catch (error) {
      console.error('Error adding partner:', error);
      alert('Error adding partner');
    }
  };

  const handleDeletePartner = async (partnerId) => {
    if (!window.confirm(language === 'fr' ? 'Supprimer ce partenaire ?' : 'Delete this partner?')) return;
    
    try {
      await axios.delete(`${API}/partners/${partnerId}`);
      fetchPartners();
    } catch (error) {
      console.error('Error deleting partner:', error);
    }
  };

  const handleLinkRegistration = async (registrationId) => {
    if (!selectedPartner) return;
    
    try {
      await axios.post(`${API}/partners/${selectedPartner.id}/sponsor/${registrationId}`);
      fetchPartners();
      fetchRegistrations();
      setShowLinkModal(false);
    } catch (error) {
      console.error('Error linking registration:', error);
    }
  };

  const handleUnlinkRegistration = async (partnerId, registrationId) => {
    try {
      await axios.delete(`${API}/partners/${partnerId}/sponsor/${registrationId}`);
      fetchPartners();
      fetchRegistrations();
    } catch (error) {
      console.error('Error unlinking registration:', error);
    }
  };

  const handleToggleLanding = async (partner) => {
    try {
      await axios.patch(`${API}/partners/${partner.id}`, {
        show_on_landing: !partner.show_on_landing
      });
      fetchPartners();
    } catch (error) {
      console.error('Error updating partner:', error);
    }
  };

  // Filter registrations that are not already sponsored
  const availableRegistrations = registrations.filter(r => 
    !r.sponsored_by && 
    (r.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     r.organization_name?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return <div className="p-8 text-center text-charcoal/50">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl text-charcoal">
            {language === 'fr' ? 'Gestion des Partenaires' : 'Partner Management'}
          </h2>
          <p className="text-sm text-charcoal/50">
            {partners.length} {language === 'fr' ? 'partenaire(s)' : 'partner(s)'}
          </p>
        </div>
        <Button 
          onClick={() => setShowAddForm(true)}
          className="bg-sage hover:bg-sage/90 text-paper rounded-none font-syne"
          data-testid="add-partner-btn"
        >
          <Plus className="w-4 h-4 mr-2" />
          {language === 'fr' ? 'Ajouter un partenaire' : 'Add partner'}
        </Button>
      </div>

      {/* Add Partner Form */}
      {showAddForm && (
        <div className="border border-lightborder bg-cream p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-syne text-lg text-charcoal">
              {language === 'fr' ? 'Nouveau Partenaire' : 'New Partner'}
            </h3>
            <button onClick={() => setShowAddForm(false)} className="text-charcoal/50 hover:text-charcoal">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              placeholder={language === 'fr' ? 'Nom de l\'entreprise *' : 'Company name *'}
              value={newPartner.company_name}
              onChange={(e) => setNewPartner({ ...newPartner, company_name: e.target.value })}
              className="rounded-none border-lightborder"
            />
            <Input
              placeholder={language === 'fr' ? 'Nom du contact *' : 'Contact name *'}
              value={newPartner.contact_name}
              onChange={(e) => setNewPartner({ ...newPartner, contact_name: e.target.value })}
              className="rounded-none border-lightborder"
            />
            <Input
              type="email"
              placeholder={language === 'fr' ? 'Email du contact *' : 'Contact email *'}
              value={newPartner.contact_email}
              onChange={(e) => setNewPartner({ ...newPartner, contact_email: e.target.value })}
              className="rounded-none border-lightborder"
            />
            <Input
              placeholder={language === 'fr' ? 'Téléphone' : 'Phone'}
              value={newPartner.contact_phone}
              onChange={(e) => setNewPartner({ ...newPartner, contact_phone: e.target.value })}
              className="rounded-none border-lightborder"
            />
            <Select 
              value={newPartner.tier}
              onValueChange={(value) => setNewPartner({ ...newPartner, tier: value })}
            >
              <SelectTrigger className="rounded-none border-lightborder">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bronze">Bronze (2 500€)</SelectItem>
                <SelectItem value="silver">Silver (5 000€)</SelectItem>
                <SelectItem value="gold">Gold (10 000€)</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Website URL"
              value={newPartner.website}
              onChange={(e) => setNewPartner({ ...newPartner, website: e.target.value })}
              className="rounded-none border-lightborder"
            />
            <Input
              placeholder="Logo URL"
              value={newPartner.logo_url}
              onChange={(e) => setNewPartner({ ...newPartner, logo_url: e.target.value })}
              className="rounded-none border-lightborder col-span-2"
            />
          </div>
          
          <div className="flex items-center justify-end gap-3 mt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowAddForm(false)}
              className="rounded-none border-charcoal text-charcoal"
            >
              {language === 'fr' ? 'Annuler' : 'Cancel'}
            </Button>
            <Button 
              onClick={handleAddPartner}
              className="rounded-none bg-terracotta hover:bg-terracotta/90 text-paper"
              disabled={!newPartner.company_name || !newPartner.contact_name || !newPartner.contact_email}
            >
              <Save className="w-4 h-4 mr-2" />
              {language === 'fr' ? 'Enregistrer' : 'Save'}
            </Button>
          </div>
        </div>
      )}

      {/* Partners List */}
      <div className="space-y-4">
        {partners.map((partner) => {
          const tier = tierConfig[partner.tier] || tierConfig.bronze;
          
          return (
            <div key={partner.id} className="border border-lightborder bg-cream">
              <div className="p-5 flex items-start gap-4">
                {/* Logo */}
                <div 
                  className="w-16 h-16 flex items-center justify-center shrink-0 border border-lightborder"
                  style={{ backgroundColor: tier.color + '20' }}
                >
                  {partner.logo_url ? (
                    <img src={partner.logo_url} alt={partner.company_name} className="w-full h-full object-contain p-1" />
                  ) : (
                    <Building2 className="w-8 h-8" style={{ color: tier.color }} />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-serif text-lg text-charcoal truncate">{partner.company_name}</h3>
                    <span 
                      className="px-2 py-0.5 text-xs font-syne uppercase"
                      style={{ backgroundColor: tier.color, color: '#fff' }}
                    >
                      {tier.name}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-charcoal/60">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> {partner.contact_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {partner.contact_email}
                    </span>
                    {partner.contact_phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {partner.contact_phone}
                      </span>
                    )}
                    {partner.website && (
                      <a href={partner.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-terracotta hover:underline">
                        <Globe className="w-3 h-3" /> Website
                      </a>
                    )}
                  </div>

                  {/* Sponsored Registrations */}
                  {partner.sponsored_registrations && partner.sponsored_registrations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-lightborder">
                      <p className="text-xs text-charcoal/50 uppercase tracking-wider mb-2">
                        {language === 'fr' ? 'Participants parrainés' : 'Sponsored participants'} ({partner.sponsored_count})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {partner.sponsored_registrations.map((reg) => (
                          <div 
                            key={reg.id}
                            className="flex items-center gap-2 px-2 py-1 bg-paper border border-lightborder text-xs"
                          >
                            <span className="text-charcoal">{reg.full_name}</span>
                            <span className="text-charcoal/40">({reg.organization_name})</span>
                            <button 
                              onClick={() => handleUnlinkRegistration(partner.id, reg.id)}
                              className="text-terracotta hover:text-terracotta/70 ml-1"
                              title={language === 'fr' ? 'Retirer le parrainage' : 'Remove sponsorship'}
                            >
                              <Unlink className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleLanding(partner)}
                    className={`p-2 border transition-colors ${
                      partner.show_on_landing 
                        ? 'border-sage bg-sage/10 text-sage' 
                        : 'border-lightborder text-charcoal/40 hover:border-sage'
                    }`}
                    title={partner.show_on_landing ? 'Visible on landing' : 'Hidden from landing'}
                  >
                    {partner.show_on_landing ? <Check className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => { setSelectedPartner(partner); setShowLinkModal(true); }}
                    className="p-2 border border-lightborder text-charcoal/60 hover:border-terracotta hover:text-terracotta"
                    title={language === 'fr' ? 'Lier un participant' : 'Link participant'}
                  >
                    <Link className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeletePartner(partner.id)}
                    className="p-2 border border-lightborder text-charcoal/60 hover:border-red-500 hover:text-red-500"
                    title={language === 'fr' ? 'Supprimer' : 'Delete'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {partners.length === 0 && (
          <div className="text-center py-12 border border-dashed border-lightborder">
            <Building2 className="w-12 h-12 text-charcoal/20 mx-auto mb-4" />
            <p className="text-charcoal/50">
              {language === 'fr' ? 'Aucun partenaire pour le moment' : 'No partners yet'}
            </p>
          </div>
        )}
      </div>

      {/* Link Registration Modal */}
      {showLinkModal && selectedPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/80" role="dialog" aria-modal="true" aria-label={language === 'fr' ? 'Lier un participant' : 'Link participant'}>
          <div className="bg-paper w-full max-w-lg">
            <div className="p-5 border-b border-lightborder flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg text-charcoal">
                  {language === 'fr' ? 'Lier un participant' : 'Link participant'}
                </h3>
                <p className="text-sm text-charcoal/50">
                  {language === 'fr' ? 'à' : 'to'} {selectedPartner.company_name}
                </p>
              </div>
              <button onClick={() => setShowLinkModal(false)} className="text-charcoal/50 hover:text-charcoal">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
                <Input
                  placeholder={language === 'fr' ? 'Rechercher un participant...' : 'Search participant...'}
                  aria-label={language === 'fr' ? 'Rechercher un participant' : 'Search a participant'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 rounded-none border-lightborder"
                />
              </div>
              
              <div className="max-h-64 overflow-y-auto space-y-2">
                {availableRegistrations.map((reg) => (
                  <button
                    key={reg.id}
                    onClick={() => handleLinkRegistration(reg.id)}
                    className="w-full text-left p-3 border border-lightborder hover:border-terracotta transition-colors flex items-center justify-between"
                  >
                    <div>
                      <p className="text-charcoal font-medium">{reg.full_name}</p>
                      <p className="text-sm text-charcoal/50">{reg.organization_name}</p>
                    </div>
                    <Link className="w-4 h-4 text-charcoal/40" />
                  </button>
                ))}
                
                {availableRegistrations.length === 0 && (
                  <p className="text-center py-8 text-charcoal/50">
                    {language === 'fr' ? 'Aucun participant disponible' : 'No available participants'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
