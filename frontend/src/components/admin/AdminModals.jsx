import React from 'react';
import { X, FileDown, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { profileTypes, countryList, expertiseTags as expertiseTagsList } from '../../lib/translations';

const AdminAddParticipantModal = ({
  showAddModal,
  setShowAddModal,
  newParticipant,
  setNewParticipant,
  handleAddParticipant,
  language,
  t
}) => {
  if (!showAddModal) return null;

  return (
    <div className="fixed inset-0 bg-charcoal/50 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-label={language === 'fr' ? 'Ajouter un participant' : 'Add a participant'} onClick={() => setShowAddModal(false)}>
      <div className="bg-paper w-full max-w-lg mx-4 max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-lightborder">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl text-charcoal">
              {language === 'fr' ? 'Ajouter un participant' : 'Add a participant'}
            </h2>
            <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-cream transition-colors">
              <X className="w-5 h-5 text-charcoal/50" />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleAddParticipant} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-charcoal/60 uppercase tracking-wider mb-2">
                {language === 'fr' ? 'Nom complet' : 'Full name'} *
              </label>
              <Input required value={newParticipant.full_name} onChange={(e) => setNewParticipant(prev => ({ ...prev, full_name: e.target.value }))}
                className="bg-cream border-lightborder rounded-none" data-testid="add-participant-fullname" />
            </div>
            <div>
              <label className="block text-xs text-charcoal/60 uppercase tracking-wider mb-2">Organisation *</label>
              <Input required value={newParticipant.organization_name} onChange={(e) => setNewParticipant(prev => ({ ...prev, organization_name: e.target.value }))}
                className="bg-cream border-lightborder rounded-none" data-testid="add-participant-org" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-charcoal/60 uppercase tracking-wider mb-2">Email *</label>
              <Input type="email" required value={newParticipant.email} onChange={(e) => setNewParticipant(prev => ({ ...prev, email: e.target.value }))}
                className="bg-cream border-lightborder rounded-none" data-testid="add-participant-email" />
            </div>
            <div>
              <label className="block text-xs text-charcoal/60 uppercase tracking-wider mb-2">
                {language === 'fr' ? 'Telephone' : 'Phone'} *
              </label>
              <Input required value={newParticipant.phone} onChange={(e) => setNewParticipant(prev => ({ ...prev, phone: e.target.value }))}
                className="bg-cream border-lightborder rounded-none" data-testid="add-participant-phone" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-charcoal/60 uppercase tracking-wider mb-2">
                {language === 'fr' ? 'Pays' : 'Country'} *
              </label>
              <Select value={newParticipant.country} onValueChange={(v) => setNewParticipant(prev => ({ ...prev, country: v }))}>
                <SelectTrigger className="bg-cream border-lightborder rounded-none" data-testid="add-participant-country">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-paper border-lightborder max-h-60">
                  {countryList.map(c => <SelectItem key={c.value} value={c.value}>{c.value}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs text-charcoal/60 uppercase tracking-wider mb-2">
                {language === 'fr' ? 'Type de profil' : 'Profile type'} *
              </label>
              <Select value={newParticipant.profile_type} onValueChange={(v) => setNewParticipant(prev => ({ ...prev, profile_type: v }))}>
                <SelectTrigger className="bg-cream border-lightborder rounded-none" data-testid="add-participant-profile">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-paper border-lightborder">
                  {profileTypes.map(p => <SelectItem key={p.value} value={p.value}>{t(p.labelKey)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-charcoal/60 uppercase tracking-wider mb-2">
                {language === 'fr' ? 'Formule' : 'Tier'}
              </label>
              <Select value={newParticipant.tier} onValueChange={(v) => setNewParticipant(prev => ({ ...prev, tier: v }))}>
                <SelectTrigger className="bg-cream border-lightborder rounded-none" data-testid="add-participant-tier">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-paper border-lightborder">
                  <SelectItem value="emerging">{language === 'fr' ? 'Emergent (50€)' : 'Emerging (50€)'}</SelectItem>
                  <SelectItem value="professional">{language === 'fr' ? 'Professionnel (150€)' : 'Professional (150€)'}</SelectItem>
                  <SelectItem value="institutional">{language === 'fr' ? 'Institutionnel (300€)' : 'Institutional (300€)'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs text-charcoal/60 uppercase tracking-wider mb-2">Statut</label>
              <Select value={newParticipant.status} onValueChange={(v) => setNewParticipant(prev => ({ ...prev, status: v }))}>
                <SelectTrigger className="bg-cream border-lightborder rounded-none" data-testid="add-participant-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-paper border-lightborder">
                  <SelectItem value="pending">{language === 'fr' ? 'En attente' : 'Pending'}</SelectItem>
                  <SelectItem value="approved">{language === 'fr' ? 'Approuve' : 'Approved'}</SelectItem>
                  <SelectItem value="rejected">{language === 'fr' ? 'Refuse' : 'Rejected'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={newParticipant.show_in_catalog}
                onChange={(e) => setNewParticipant(prev => ({ ...prev, show_in_catalog: e.target.checked }))}
                className="w-4 h-4 accent-sage" data-testid="add-participant-catalog" />
              <span className="text-sm text-charcoal">
                {language === 'fr' ? 'Afficher dans le catalogue public' : 'Show in public catalog'}
              </span>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}
              className="flex-1 h-11 border-lightborder text-charcoal rounded-none font-syne">
              {language === 'fr' ? 'Annuler' : 'Cancel'}
            </Button>
            <Button type="submit" className="flex-1 h-11 bg-sage text-paper rounded-none font-syne" data-testid="add-participant-submit">
              {language === 'fr' ? 'Ajouter' : 'Add'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminExportModal = ({
  showExportModal,
  setShowExportModal,
  exportFilters,
  setExportFilters,
  language,
  t,
  API
}) => {
  if (!showExportModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/80" role="dialog" aria-modal="true" aria-label={language === 'fr' ? 'Export cible' : 'Filtered Export'}>
      <div className="bg-paper w-full max-w-md">
        <div className="p-5 border-b border-lightborder flex items-center justify-between">
          <h3 className="font-serif text-lg text-charcoal">
            {language === 'fr' ? 'Export cible' : 'Filtered Export'}
          </h3>
          <button onClick={() => setShowExportModal(false)} className="text-charcoal/50 hover:text-charcoal">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-charcoal/60 uppercase tracking-wider mb-2">
              {language === 'fr' ? 'Filtrer par profil' : 'Filter by profile'}
            </label>
            <Select value={exportFilters.profileType}
              onValueChange={(v) => setExportFilters(prev => ({ ...prev, profileType: v === 'all' ? '' : v }))}>
              <SelectTrigger className="rounded-none border-lightborder">
                <SelectValue placeholder={language === 'fr' ? 'Tous les profils' : 'All profiles'} />
              </SelectTrigger>
              <SelectContent className="bg-paper border-lightborder">
                <SelectItem value="all">{language === 'fr' ? 'Tous' : 'All'}</SelectItem>
                {profileTypes.map(p => <SelectItem key={p.value} value={p.value}>{t(p.labelKey)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-xs text-charcoal/60 uppercase tracking-wider mb-2">
              {language === 'fr' ? 'Filtrer par expertises' : 'Filter by expertise'}
            </label>
            <div className="flex flex-wrap gap-2 p-3 border border-lightborder bg-cream max-h-48 overflow-y-auto">
              {expertiseTagsList.map((tag) => {
                const isSelected = exportFilters.expertiseTags.includes(tag.value);
                return (
                  <button key={tag.value} type="button"
                    onClick={() => {
                      setExportFilters(prev => ({
                        ...prev,
                        expertiseTags: isSelected
                          ? prev.expertiseTags.filter(tg => tg !== tag.value)
                          : [...prev.expertiseTags, tag.value]
                      }));
                    }}
                    className={`px-2 py-1 text-xs font-syne transition-all border ${
                      isSelected ? 'border-sage bg-sage text-paper' : 'border-lightborder bg-paper text-charcoal/70 hover:border-terracotta'
                    }`}
                  >
                    {language === 'fr' ? tag.labelFr : tag.labelEn}
                  </button>
                );
              })}
            </div>
            {exportFilters.expertiseTags.length > 0 && (
              <p className="text-xs text-sage mt-2">
                {exportFilters.expertiseTags.length} {language === 'fr' ? 'tag(s) selectionne(s)' : 'tag(s) selected'}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => { setExportFilters({ expertiseTags: [], profileType: '' }); setShowExportModal(false); }}
              className="flex-1 h-11 border-lightborder text-charcoal rounded-none font-syne">
              {language === 'fr' ? 'Annuler' : 'Cancel'}
            </Button>
            <Button onClick={() => {
              const params = new URLSearchParams();
              if (exportFilters.profileType) params.append('profile_type', exportFilters.profileType);
              if (exportFilters.expertiseTags.length > 0) params.append('expertise_tags', exportFilters.expertiseTags.join(','));
              window.open(`${API}/registrations/export/filtered?${params.toString()}`, '_blank');
              setShowExportModal(false);
            }}
              className="flex-1 h-11 bg-terracotta text-paper rounded-none font-syne">
              <FileDown className="w-4 h-4 mr-2" />
              {language === 'fr' ? 'Exporter CSV' : 'Export CSV'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminEmailHistoryModal = ({
  showEmailLogs,
  setShowEmailLogs,
  emailLogs,
  language
}) => {
  if (!showEmailLogs) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/80" role="dialog" aria-modal="true" aria-label={language === 'fr' ? 'Historique des envois' : 'Send History'}>
      <div className="bg-paper w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="p-5 border-b border-lightborder flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-serif text-lg text-charcoal">
              {language === 'fr' ? 'Historique des envois' : 'Send History'}
            </h3>
            <p className="text-xs text-charcoal/50">
              {emailLogs.length} {language === 'fr' ? 'email(s) recent(s)' : 'recent email(s)'}
            </p>
          </div>
          <button onClick={() => setShowEmailLogs(false)} className="text-charcoal/50 hover:text-charcoal">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-auto p-5">
          {emailLogs.length === 0 ? (
            <div className="text-center py-12 text-charcoal/50">
              <Mail className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>{language === 'fr' ? 'Aucun envoi pour le moment' : 'No emails sent yet'}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {emailLogs.map((log, idx) => (
                <div key={log.id || idx} className={`flex items-center gap-3 p-3 border ${
                  log.status === 'sent' ? 'border-sage/30 bg-sage/5' : 'border-terracotta/30 bg-terracotta/5'
                }`}>
                  {log.status === 'sent' ? (
                    <CheckCircle className="w-4 h-4 text-sage shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-terracotta shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-charcoal truncate">{log.recipient_name}</p>
                    <p className="text-xs text-charcoal/50 truncate">{log.recipient_email}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-xs px-2 py-0.5 ${
                      log.email_type === 'badge' ? 'bg-terracotta/20 text-terracotta' : 'bg-sage/20 text-sage'
                    }`}>
                      {log.email_type}
                    </span>
                    <p className="text-xs text-charcoal/40 mt-1">
                      {new Date(log.sent_at).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-5 border-t border-lightborder shrink-0 flex justify-end">
          <Button onClick={() => setShowEmailLogs(false)} className="h-10 bg-charcoal text-paper rounded-none font-syne">
            {language === 'fr' ? 'Fermer' : 'Close'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export { AdminAddParticipantModal, AdminExportModal, AdminEmailHistoryModal };
