import React from 'react';
import {
  Mail, MapPin, Building2, Calendar, X, Trash2,
  Eye, EyeOff, CheckCircle, XCircle, Camera
} from 'lucide-react';
import { toast } from 'sonner';

const AdminRegistrationDetail = ({
  selectedReg,
  setSelectedReg,
  handleStatusChange,
  handleCatalogToggle,
  handleDelete,
  getProfileLabel,
  getCountryLabel,
  fetchRegistrations,
  language,
  API
}) => {
  if (!selectedReg) return null;

  const StatusBadge = ({ status }) => {
    const styles = {
      pending: 'bg-amber-50 text-amber-700 border-amber-200',
      approved: 'bg-sage/10 text-sage border-sage/30',
      rejected: 'bg-terracotta/10 text-terracotta border-terracotta/30'
    };
    const labels = { pending: language === 'fr' ? 'En attente' : 'Pending', approved: language === 'fr' ? 'Approuve' : 'Approved', rejected: language === 'fr' ? 'Refuse' : 'Rejected' };
    return <span className={`inline-block px-2.5 py-1 text-xs border ${styles[status] || styles.pending}`}>{labels[status] || status}</span>;
  };

  return (
    <div className="hidden lg:block fixed right-0 top-20 w-[420px] h-[calc(100vh-5rem)] border-l border-lightborder bg-cream overflow-auto">
      <div className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs text-charcoal/50 uppercase tracking-wider mb-2">{language === 'fr' ? 'Detail inscription' : 'Registration Detail'}</p>
            <StatusBadge status={selectedReg.status} />
          </div>
          <button onClick={() => setSelectedReg(null)} className="p-2 hover:bg-paper transition-colors">
            <X className="w-4 h-4 text-charcoal/50" />
          </button>
        </div>
        
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <img src={selectedReg.image} alt={`Photo de ${selectedReg.full_name}`} className="w-24 h-24 object-cover mx-auto rounded-full border-2 border-lightborder" />
            <label
              className="absolute bottom-0 right-0 w-8 h-8 bg-terracotta text-paper rounded-full flex items-center justify-center cursor-pointer hover:bg-terracotta/90 transition-colors shadow-md"
              title={language === 'fr' ? 'Changer la photo' : 'Change photo'}
              aria-label={language === 'fr' ? 'Changer la photo' : 'Change photo'}
              data-testid="admin-change-photo-btn"
            >
              <Camera className="w-4 h-4" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 5 * 1024 * 1024) { toast.error('Max 5 Mo'); return; }
                  const fd = new FormData();
                  fd.append('file', file);
                  try {
                    toast.loading('Upload en cours...');
                    const res = await fetch(`${API}/registrations/${selectedReg.id}/photo`, { method: 'PATCH', body: fd });
                    const data = await res.json();
                    toast.dismiss();
                    if (data.success) {
                      toast.success(language === 'fr' ? 'Photo mise a jour' : 'Photo updated');
                      setSelectedReg(prev => ({ ...prev, image: data.logo_url }));
                      fetchRegistrations();
                    } else { toast.error(data.detail || 'Erreur'); }
                  } catch { toast.dismiss(); toast.error('Erreur upload'); }
                }}
              />
            </label>
          </div>
          <h2 className="font-serif text-xl text-charcoal mb-1 mt-3">{selectedReg.full_name}</h2>
          <p className="text-charcoal/60">{selectedReg.organization_name}</p>
        </div>
        
        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-3 text-sm">
            <Mail className="w-4 h-4 text-charcoal/40" />
            <a href={`mailto:${selectedReg.email}`} className="text-terracotta hover:underline">{selectedReg.email}</a>
          </div>
          <div className="flex items-center gap-3 text-sm text-charcoal/70">
            <MapPin className="w-4 h-4 text-charcoal/40" />
            {getCountryLabel(selectedReg.country)}
          </div>
          <div className="flex items-center gap-3 text-sm text-charcoal/70">
            <Building2 className="w-4 h-4 text-charcoal/40" />
            {getProfileLabel(selectedReg.profile_type)}
          </div>
          {selectedReg.stand_request && (
            <div className="flex items-center gap-3 text-sm text-charcoal/70">
              <Calendar className="w-4 h-4 text-charcoal/40" />
              Stand: {selectedReg.stand_category || 'Oui'}
            </div>
          )}
        </div>
        
        {selectedReg.bio && (
          <div className="mb-8">
            <p className="text-xs text-charcoal/50 uppercase tracking-wider mb-2">Bio</p>
            <p className="text-sm text-charcoal/70 leading-relaxed">{selectedReg.bio}</p>
          </div>
        )}

        {/* Catalog Toggle */}
        <div className="mb-8 p-4 border border-lightborder bg-paper">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-charcoal">{language === 'fr' ? 'Visible au catalogue' : 'Visible in catalog'}</p>
              <p className="text-xs text-charcoal/50">{language === 'fr' ? 'Afficher ce profil publiquement' : 'Show this profile publicly'}</p>
            </div>
            <button
              onClick={() => handleCatalogToggle(selectedReg.id, !selectedReg.show_in_catalog)}
              className={`px-4 py-2 text-sm font-syne transition-colors ${selectedReg.show_in_catalog 
                ? 'bg-sage text-paper' 
                : 'border border-lightborder text-charcoal/60 hover:border-sage'}`}
            >
              {selectedReg.show_in_catalog 
                ? (language === 'fr' ? 'Visible' : 'Visible')
                : (language === 'fr' ? 'Masque' : 'Hidden')
              }
            </button>
          </div>
        </div>
        
        {/* Status Actions */}
        <div className="space-y-3 mb-6">
          <p className="text-xs text-charcoal/50 uppercase tracking-wider">{language === 'fr' ? 'Changer le statut' : 'Change status'}</p>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => handleStatusChange(selectedReg.id, 'pending')}
              className={`py-3 text-sm font-syne border transition-colors ${selectedReg.status === 'pending' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-lightborder text-charcoal/60 hover:border-amber-500'}`}>
              {language === 'fr' ? 'Attente' : 'Pending'}
            </button>
            <button onClick={() => handleStatusChange(selectedReg.id, 'approved')}
              className={`py-3 text-sm font-syne border transition-colors ${selectedReg.status === 'approved' ? 'border-sage bg-sage/10 text-sage' : 'border-lightborder text-charcoal/60 hover:border-sage'}`}>
              {language === 'fr' ? 'Approuver' : 'Approve'}
            </button>
            <button onClick={() => handleStatusChange(selectedReg.id, 'rejected')}
              className={`py-3 text-sm font-syne border transition-colors ${selectedReg.status === 'rejected' ? 'border-terracotta bg-terracotta/10 text-terracotta' : 'border-lightborder text-charcoal/60 hover:border-terracotta'}`}>
              {language === 'fr' ? 'Refuser' : 'Reject'}
            </button>
          </div>
        </div>

        {/* Delete */}
        <button onClick={() => handleDelete(selectedReg.id)}
          className="w-full py-3 text-sm font-syne border border-terracotta/30 text-terracotta hover:bg-terracotta/10 transition-colors">
          <Trash2 className="w-4 h-4 inline mr-2" />
          {language === 'fr' ? 'Supprimer cette inscription' : 'Delete this registration'}
        </button>
      </div>
    </div>
  );
};

export default AdminRegistrationDetail;
