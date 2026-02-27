import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Image,
  Users,
  Mic2,
  Building2,
  Upload,
  Trash2,
  GripVertical,
  Eye,
  Save,
  Plus,
  Edit2,
  X,
  Check,
  ExternalLink,
  RefreshCw,
  Settings
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

const API = process.env.REACT_APP_BACKEND_URL || '';

// ================== MEDIA SECTION ==================
const MediaSection = () => {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const categories = [
    { id: 'hero', label: 'Bannière Principale', desc: 'Image hero de la page d\'accueil' },
    { id: 'logo', label: 'Logo Culture Connect', desc: 'Logo officiel de l\'événement' },
    { id: 'venue', label: 'Photos des Sites', desc: 'La Savane, Schoelcher, Atrium' },
    { id: 'gallery', label: 'Galerie Ambiance', desc: 'Photos de l\'événement' }
  ];

  useEffect(() => {
    loadMedia();
  }, []);

  const loadMedia = async () => {
    try {
      const res = await axios.get(`${API}/api/cms/media`);
      setMedia(res.data.media || []);
    } catch (error) {
      toast.error('Erreur lors du chargement des médias');
    } finally {
      setLoading(false);
    }
  };

  const createMedia = async (category) => {
    try {
      const res = await axios.post(`${API}/api/cms/media`, {
        category,
        title: `Nouveau ${categories.find(c => c.id === category)?.label || 'média'}`,
        published: false
      });
      setMedia([...media, res.data.media]);
      toast.success('Média créé');
    } catch (error) {
      toast.error('Erreur lors de la création');
    }
  };

  const uploadImage = async (mediaId, file) => {
    setUploading(mediaId);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post(`${API}/api/cms/media/${mediaId}/upload`, formData);
      setMedia(media.map(m => m.id === mediaId ? { ...m, image_url: res.data.image_url } : m));
      toast.success('Image uploadée');
    } catch (error) {
      toast.error('Erreur lors de l\'upload');
    } finally {
      setUploading(null);
    }
  };

  const deleteMedia = async (mediaId) => {
    if (!window.confirm('Supprimer ce média ?')) return;
    try {
      await axios.delete(`${API}/api/cms/media/${mediaId}`);
      setMedia(media.filter(m => m.id !== mediaId));
      toast.success('Média supprimé');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const updateMedia = async (mediaId) => {
    try {
      await axios.put(`${API}/api/cms/media/${mediaId}`, editForm);
      setMedia(media.map(m => m.id === mediaId ? { ...m, ...editForm } : m));
      setEditingId(null);
      toast.success('Média mis à jour');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const getMediaByCategory = (categoryId) => media.filter(m => m.category === categoryId);

  if (loading) {
    return <div className="flex justify-center py-8"><RefreshCw className="w-6 h-6 animate-spin text-terracotta" /></div>;
  }

  return (
    <div className="space-y-8">
      {categories.map(category => (
        <div key={category.id} className="bg-paper border border-lightborder rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-charcoal">{category.label}</h3>
              <p className="text-sm text-charcoal/60">{category.desc}</p>
            </div>
            <Button
              onClick={() => createMedia(category.id)}
              variant="outline"
              size="sm"
              className="border-sage text-sage hover:bg-sage/10"
            >
              <Plus className="w-4 h-4 mr-1" /> Ajouter
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getMediaByCategory(category.id).map(item => (
              <div key={item.id} className="border border-lightborder rounded-lg overflow-hidden bg-cream/50">
                {/* Image Preview */}
                <div className="relative aspect-video bg-charcoal/5 flex items-center justify-center">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <Image className="w-12 h-12 text-charcoal/20" />
                  )}
                  
                  {/* Upload overlay */}
                  <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && uploadImage(item.id, e.target.files[0])}
                    />
                    {uploading === item.id ? (
                      <RefreshCw className="w-8 h-8 text-white animate-spin" />
                    ) : (
                      <Upload className="w-8 h-8 text-white" />
                    )}
                  </label>
                </div>

                {/* Info */}
                <div className="p-3">
                  {editingId === item.id ? (
                    <div className="space-y-2">
                      <Input
                        value={editForm.title || ''}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        placeholder="Titre"
                        className="text-sm"
                      />
                      <Input
                        value={editForm.description || ''}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        placeholder="Description"
                        className="text-sm"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => updateMedia(item.id)} className="flex-1 bg-sage">
                          <Check className="w-3 h-3 mr-1" /> Sauver
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-charcoal text-sm truncate">{item.title}</span>
                        <div className="flex gap-1">
                          <button 
                            onClick={() => { setEditingId(item.id); setEditForm(item); }}
                            className="p-1 hover:bg-charcoal/10 rounded"
                          >
                            <Edit2 className="w-4 h-4 text-charcoal/60" />
                          </button>
                          <button 
                            onClick={() => deleteMedia(item.id)}
                            className="p-1 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                      {item.description && (
                        <p className="text-xs text-charcoal/50 mt-1 truncate">{item.description}</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}

            {getMediaByCategory(category.id).length === 0 && (
              <div className="col-span-full py-8 text-center text-charcoal/40 border border-dashed border-charcoal/20 rounded-lg">
                Aucun média dans cette catégorie
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// ================== EXHIBITORS SECTION ==================
const ExhibitorsSection = () => {
  const [profiles, setProfiles] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [exhibitorPhotos, setExhibitorPhotos] = useState({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(null);
  const [activeTab, setActiveTab] = useState('smart_engine');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [profilesRes, participantsRes, photosRes] = await Promise.all([
        axios.get(`${API}/api/v1/smart-recommendations/profiles`),
        axios.get(`${API}/api/registrations?status=approved`),
        axios.get(`${API}/api/cms/exhibitors`)
      ]);

      setProfiles(profilesRes.data.profiles || []);
      setParticipants(participantsRes.data.registrations || []);
      
      // Create a map of profile_id -> photo_url
      const photosMap = {};
      (photosRes.data.exhibitors || []).forEach(ex => {
        photosMap[ex.profile_id] = ex.photo_url;
      });
      setExhibitorPhotos(photosMap);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const uploadPhoto = async (profileId, profileType, file) => {
    setUploading(profileId);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post(
        `${API}/api/cms/exhibitors/${profileId}/upload?profile_type=${profileType}`,
        formData
      );
      setExhibitorPhotos({ ...exhibitorPhotos, [profileId]: res.data.photo_url });
      toast.success('Photo uploadée');
    } catch (error) {
      toast.error('Erreur lors de l\'upload');
    } finally {
      setUploading(null);
    }
  };

  const deletePhoto = async (profileId) => {
    try {
      await axios.delete(`${API}/api/cms/exhibitors/${profileId}`);
      const newPhotos = { ...exhibitorPhotos };
      delete newPhotos[profileId];
      setExhibitorPhotos(newPhotos);
      toast.success('Photo supprimée');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';
  };

  const getInitialsColor = (name) => {
    const colors = ['#A65D47', '#C8922A', '#4A5D4E', '#1A1A1A', '#6B4423'];
    const index = name?.charCodeAt(0) % colors.length || 0;
    return colors[index];
  };

  if (loading) {
    return <div className="flex justify-center py-8"><RefreshCw className="w-6 h-6 animate-spin text-terracotta" /></div>;
  }

  const renderProfileCard = (profile, type) => {
    const id = profile.id;
    const name = type === 'smart_engine' ? profile.name : profile.full_name;
    const photoUrl = exhibitorPhotos[id];

    return (
      <div key={id} className="border border-lightborder rounded-lg overflow-hidden bg-paper">
        {/* Photo */}
        <div className="relative aspect-square bg-charcoal/5 flex items-center justify-center">
          {photoUrl ? (
            <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div 
              className="w-full h-full flex items-center justify-center text-3xl font-bold text-white"
              style={{ backgroundColor: getInitialsColor(name) }}
            >
              {getInitials(name)}
            </div>
          )}
          
          {/* Upload overlay */}
          <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && uploadPhoto(id, type, e.target.files[0])}
            />
            {uploading === id ? (
              <RefreshCw className="w-8 h-8 text-white animate-spin" />
            ) : (
              <Upload className="w-8 h-8 text-white" />
            )}
          </label>

          {/* Delete button */}
          {photoUrl && (
            <button
              onClick={() => deletePhoto(id)}
              className="absolute top-2 right-2 p-1.5 bg-red-500 rounded-full text-white hover:bg-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <div className="font-medium text-charcoal text-sm truncate">{name}</div>
          <div className="text-xs text-charcoal/50 mt-0.5">
            {type === 'smart_engine' ? profile.type : profile.profile_type} • {profile.territory || profile.country}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-lightborder pb-2">
        <button
          onClick={() => setActiveTab('smart_engine')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === 'smart_engine' 
              ? 'bg-terracotta text-white' 
              : 'text-charcoal/60 hover:text-charcoal'
          }`}
        >
          Profils Smart Engine ({profiles.length})
        </button>
        <button
          onClick={() => setActiveTab('participants')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === 'participants' 
              ? 'bg-terracotta text-white' 
              : 'text-charcoal/60 hover:text-charcoal'
          }`}
        >
          Participants Approuvés ({participants.length})
        </button>
      </div>

      {/* Content */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {activeTab === 'smart_engine' && profiles.map(p => renderProfileCard(p, 'smart_engine'))}
        {activeTab === 'participants' && participants.map(p => renderProfileCard(p, 'participant'))}
      </div>

      {((activeTab === 'smart_engine' && profiles.length === 0) || 
        (activeTab === 'participants' && participants.length === 0)) && (
        <div className="py-12 text-center text-charcoal/40 border border-dashed border-charcoal/20 rounded-lg">
          Aucun profil dans cette catégorie
        </div>
      )}
    </div>
  );
};

// ================== SPEAKERS SECTION ==================
const SpeakersSection = () => {
  const [speakers, setSpeakers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSpeaker, setEditingSpeaker] = useState(null);
  const [uploading, setUploading] = useState(null);
  const [form, setForm] = useState({ name: '', role: '', bio: '' });

  useEffect(() => {
    loadSpeakers();
  }, []);

  const loadSpeakers = async () => {
    try {
      const res = await axios.get(`${API}/api/cms/speakers`);
      setSpeakers(res.data.speakers || []);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const saveSpeaker = async () => {
    if (!form.name || !form.role) {
      toast.error('Nom et rôle requis');
      return;
    }

    try {
      if (editingSpeaker) {
        await axios.put(`${API}/api/cms/speakers/${editingSpeaker.id}`, form);
        setSpeakers(speakers.map(s => s.id === editingSpeaker.id ? { ...s, ...form } : s));
        toast.success('Intervenant mis à jour');
      } else {
        const res = await axios.post(`${API}/api/cms/speakers`, { ...form, order: speakers.length });
        setSpeakers([...speakers, res.data.speaker]);
        toast.success('Intervenant ajouté');
      }
      setShowForm(false);
      setEditingSpeaker(null);
      setForm({ name: '', role: '', bio: '' });
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const deleteSpeaker = async (id) => {
    if (!window.confirm('Supprimer cet intervenant ?')) return;
    try {
      await axios.delete(`${API}/api/cms/speakers/${id}`);
      setSpeakers(speakers.filter(s => s.id !== id));
      toast.success('Intervenant supprimé');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const uploadPhoto = async (speakerId, file) => {
    setUploading(speakerId);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post(`${API}/api/cms/speakers/${speakerId}/upload`, formData);
      setSpeakers(speakers.map(s => s.id === speakerId ? { ...s, photo_url: res.data.photo_url } : s));
      toast.success('Photo uploadée');
    } catch (error) {
      toast.error('Erreur lors de l\'upload');
    } finally {
      setUploading(null);
    }
  };

  const moveSpeaker = async (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= speakers.length) return;

    const newSpeakers = [...speakers];
    [newSpeakers[index], newSpeakers[newIndex]] = [newSpeakers[newIndex], newSpeakers[index]];
    
    // Update orders
    const orders = newSpeakers.map((s, i) => ({ id: s.id, order: i }));
    
    try {
      await axios.put(`${API}/api/cms/speakers/reorder`, orders);
      setSpeakers(newSpeakers);
    } catch (error) {
      toast.error('Erreur lors du réordonnement');
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8"><RefreshCw className="w-6 h-6 animate-spin text-terracotta" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Add button */}
      <div className="flex justify-end">
        <Button 
          onClick={() => { setShowForm(true); setEditingSpeaker(null); setForm({ name: '', role: '', bio: '' }); }}
          className="bg-sage text-white"
        >
          <Plus className="w-4 h-4 mr-2" /> Ajouter un intervenant
        </Button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-paper rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-charcoal mb-4">
              {editingSpeaker ? 'Modifier l\'intervenant' : 'Nouvel intervenant'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal/70 mb-1">Nom *</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Jean-Pierre Dupont"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal/70 mb-1">Rôle *</label>
                <Input
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  placeholder="Ex: Directeur CTM Culture"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal/70 mb-1">Bio (3-4 lignes)</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="Courte biographie..."
                  className="w-full px-3 py-2 border border-lightborder rounded-md text-sm resize-none"
                  rows={4}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button onClick={saveSpeaker} className="flex-1 bg-terracotta text-white">
                <Check className="w-4 h-4 mr-2" /> {editingSpeaker ? 'Mettre à jour' : 'Ajouter'}
              </Button>
              <Button onClick={() => setShowForm(false)} variant="outline" className="flex-1">
                Annuler
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Speakers List */}
      <div className="space-y-3">
        {speakers.map((speaker, index) => (
          <div key={speaker.id} className="flex items-center gap-4 bg-paper border border-lightborder rounded-lg p-4">
            {/* Drag handle */}
            <div className="flex flex-col gap-1">
              <button 
                onClick={() => moveSpeaker(index, 'up')} 
                disabled={index === 0}
                className="p-1 hover:bg-charcoal/10 rounded disabled:opacity-30"
              >
                <GripVertical className="w-4 h-4 text-charcoal/40 rotate-180" />
              </button>
              <button 
                onClick={() => moveSpeaker(index, 'down')} 
                disabled={index === speakers.length - 1}
                className="p-1 hover:bg-charcoal/10 rounded disabled:opacity-30"
              >
                <GripVertical className="w-4 h-4 text-charcoal/40" />
              </button>
            </div>

            {/* Photo */}
            <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-charcoal/5 flex-shrink-0">
              {speaker.photo_url ? (
                <img src={speaker.photo_url} alt={speaker.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Mic2 className="w-8 h-8 text-charcoal/20" />
                </div>
              )}
              <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && uploadPhoto(speaker.id, e.target.files[0])}
                />
                {uploading === speaker.id ? (
                  <RefreshCw className="w-6 h-6 text-white animate-spin" />
                ) : (
                  <Upload className="w-6 h-6 text-white" />
                )}
              </label>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-charcoal">{speaker.name}</div>
              <div className="text-sm text-terracotta">{speaker.role}</div>
              {speaker.bio && (
                <p className="text-xs text-charcoal/60 mt-1 line-clamp-2">{speaker.bio}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => { setEditingSpeaker(speaker); setForm(speaker); setShowForm(true); }}
                className="p-2 hover:bg-charcoal/10 rounded"
              >
                <Edit2 className="w-4 h-4 text-charcoal/60" />
              </button>
              <button
                onClick={() => deleteSpeaker(speaker.id)}
                className="p-2 hover:bg-red-50 rounded"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>
          </div>
        ))}

        {speakers.length === 0 && (
          <div className="py-12 text-center text-charcoal/40 border border-dashed border-charcoal/20 rounded-lg">
            Aucun intervenant ajouté
          </div>
        )}
      </div>
    </div>
  );
};

// ================== PARTNERS SECTION ==================
const PartnersSection = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [uploading, setUploading] = useState(null);
  const [form, setForm] = useState({ name: '', website_url: '' });

  useEffect(() => {
    loadPartners();
  }, []);

  const loadPartners = async () => {
    try {
      const res = await axios.get(`${API}/api/cms/partners`);
      setPartners(res.data.partners || []);
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const savePartner = async () => {
    if (!form.name) {
      toast.error('Nom requis');
      return;
    }

    try {
      if (editingPartner) {
        await axios.put(`${API}/api/cms/partners/${editingPartner.id}`, form);
        setPartners(partners.map(p => p.id === editingPartner.id ? { ...p, ...form } : p));
        toast.success('Partenaire mis à jour');
      } else {
        const res = await axios.post(`${API}/api/cms/partners`, { ...form, order: partners.length });
        setPartners([...partners, res.data.partner]);
        toast.success('Partenaire ajouté');
      }
      setShowForm(false);
      setEditingPartner(null);
      setForm({ name: '', website_url: '' });
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const deletePartner = async (id) => {
    if (!window.confirm('Supprimer ce partenaire ?')) return;
    try {
      await axios.delete(`${API}/api/cms/partners/${id}`);
      setPartners(partners.filter(p => p.id !== id));
      toast.success('Partenaire supprimé');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const uploadLogo = async (partnerId, file) => {
    setUploading(partnerId);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post(`${API}/api/cms/partners/${partnerId}/upload`, formData);
      setPartners(partners.map(p => p.id === partnerId ? { ...p, logo_url: res.data.logo_url } : p));
      toast.success('Logo uploadé');
    } catch (error) {
      toast.error('Erreur lors de l\'upload');
    } finally {
      setUploading(null);
    }
  };

  const movePartner = async (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= partners.length) return;

    const newPartners = [...partners];
    [newPartners[index], newPartners[newIndex]] = [newPartners[newIndex], newPartners[index]];
    
    const orders = newPartners.map((p, i) => ({ id: p.id, order: i }));
    
    try {
      await axios.put(`${API}/api/cms/partners/reorder`, orders);
      setPartners(newPartners);
    } catch (error) {
      toast.error('Erreur lors du réordonnement');
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8"><RefreshCw className="w-6 h-6 animate-spin text-terracotta" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Add button */}
      <div className="flex justify-end">
        <Button 
          onClick={() => { setShowForm(true); setEditingPartner(null); setForm({ name: '', website_url: '' }); }}
          className="bg-sage text-white"
        >
          <Plus className="w-4 h-4 mr-2" /> Ajouter un partenaire
        </Button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-paper rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-charcoal mb-4">
              {editingPartner ? 'Modifier le partenaire' : 'Nouveau partenaire'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal/70 mb-1">Nom *</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: CTM, DAC, Air Caraïbes..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal/70 mb-1">Site web</label>
                <Input
                  value={form.website_url}
                  onChange={(e) => setForm({ ...form, website_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button onClick={savePartner} className="flex-1 bg-terracotta text-white">
                <Check className="w-4 h-4 mr-2" /> {editingPartner ? 'Mettre à jour' : 'Ajouter'}
              </Button>
              <Button onClick={() => setShowForm(false)} variant="outline" className="flex-1">
                Annuler
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Partners Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {partners.map((partner, index) => (
          <div key={partner.id} className="bg-paper border border-lightborder rounded-lg overflow-hidden">
            {/* Logo */}
            <div className="relative aspect-video bg-white flex items-center justify-center p-4">
              {partner.logo_url ? (
                <img src={partner.logo_url} alt={partner.name} className="max-w-full max-h-full object-contain" />
              ) : (
                <Building2 className="w-12 h-12 text-charcoal/20" />
              )}
              
              <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && uploadLogo(partner.id, e.target.files[0])}
                />
                {uploading === partner.id ? (
                  <RefreshCw className="w-6 h-6 text-white animate-spin" />
                ) : (
                  <Upload className="w-6 h-6 text-white" />
                )}
              </label>
            </div>

            {/* Info */}
            <div className="p-3 border-t border-lightborder">
              <div className="font-medium text-charcoal text-sm truncate">{partner.name}</div>
              {partner.website_url && (
                <a 
                  href={partner.website_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-terracotta flex items-center gap-1 mt-1 hover:underline"
                >
                  <ExternalLink className="w-3 h-3" /> Site
                </a>
              )}
              
              {/* Actions */}
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-lightborder">
                <div className="flex gap-1">
                  <button 
                    onClick={() => movePartner(index, 'up')} 
                    disabled={index === 0}
                    className="p-1 hover:bg-charcoal/10 rounded disabled:opacity-30"
                    title="Déplacer vers la gauche"
                  >
                    <ArrowLeft className="w-3 h-3 text-charcoal/40" />
                  </button>
                  <button 
                    onClick={() => movePartner(index, 'down')} 
                    disabled={index === partners.length - 1}
                    className="p-1 hover:bg-charcoal/10 rounded disabled:opacity-30"
                    title="Déplacer vers la droite"
                  >
                    <ArrowLeft className="w-3 h-3 text-charcoal/40 rotate-180" />
                  </button>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => { setEditingPartner(partner); setForm(partner); setShowForm(true); }}
                    className="p-1 hover:bg-charcoal/10 rounded"
                  >
                    <Edit2 className="w-3 h-3 text-charcoal/60" />
                  </button>
                  <button
                    onClick={() => deletePartner(partner.id)}
                    className="p-1 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-3 h-3 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {partners.length === 0 && (
        <div className="py-12 text-center text-charcoal/40 border border-dashed border-charcoal/20 rounded-lg">
          Aucun partenaire ajouté
        </div>
      )}

      {/* Suggested partners */}
      <div className="bg-cream/50 border border-lightborder rounded-lg p-4">
        <p className="text-sm text-charcoal/70">
          <strong>Partenaires suggérés:</strong> CTM, DAC, Express des Îles, Karibea, Air Caraïbes, Université des Antilles
        </p>
      </div>
    </div>
  );
};

// ================== PREVIEW SECTION ==================
const PreviewSection = () => {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreview();
  }, []);

  const loadPreview = async () => {
    try {
      const res = await axios.get(`${API}/api/cms/preview`);
      setPreview(res.data);
    } catch (error) {
      toast.error('Erreur lors du chargement de la prévisualisation');
    } finally {
      setLoading(false);
    }
  };

  const publishChanges = async () => {
    if (!window.confirm('Publier toutes les modifications ?')) return;
    try {
      await axios.post(`${API}/api/cms/publish`);
      toast.success('Toutes les modifications ont été publiées');
      loadPreview();
    } catch (error) {
      toast.error('Erreur lors de la publication');
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8"><RefreshCw className="w-6 h-6 animate-spin text-terracotta" /></div>;
  }

  const heroMedia = preview?.media?.find(m => m.category === 'hero');
  const logoMedia = preview?.media?.find(m => m.category === 'logo');

  return (
    <div className="space-y-6">
      {/* Publish button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-charcoal">Prévisualisation</h3>
          <p className="text-sm text-charcoal/60">Vérifiez vos modifications avant publication</p>
        </div>
        <Button onClick={publishChanges} className="bg-sage text-white">
          <Save className="w-4 h-4 mr-2" /> Publier les modifications
        </Button>
      </div>

      {/* Preview frame */}
      <div className="border-2 border-terracotta/30 rounded-lg overflow-hidden">
        {/* Header Preview */}
        <div className="bg-charcoal text-paper p-4">
          <div className="flex items-center gap-4">
            {logoMedia?.image_url ? (
              <img src={logoMedia.image_url} alt="Logo" className="h-10 w-auto" />
            ) : (
              <div className="w-10 h-10 bg-terracotta/30 rounded flex items-center justify-center text-xs">Logo</div>
            )}
            <span className="font-bold">Culture Connect 2026</span>
          </div>
        </div>

        {/* Hero Preview */}
        <div className="relative h-64 bg-charcoal/10">
          {heroMedia?.image_url ? (
            <img src={heroMedia.image_url} alt="Hero" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-charcoal/30">
              <Image className="w-16 h-16" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-6">
            <div className="text-white">
              <h1 className="text-2xl font-bold">{heroMedia?.title || 'Bannière Principale'}</h1>
              <p className="text-sm opacity-80">{heroMedia?.description || 'Description de la bannière'}</p>
            </div>
          </div>
        </div>

        {/* Speakers Preview */}
        {preview?.speakers?.length > 0 && (
          <div className="p-6 border-t border-lightborder">
            <h4 className="font-semibold text-charcoal mb-4">Intervenants ({preview.speakers.length})</h4>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {preview.speakers.slice(0, 5).map(speaker => (
                <div key={speaker.id} className="flex-shrink-0 text-center w-24">
                  <div className="w-16 h-16 mx-auto rounded-full bg-charcoal/10 overflow-hidden">
                    {speaker.photo_url ? (
                      <img src={speaker.photo_url} alt={speaker.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Mic2 className="w-6 h-6 text-charcoal/30" />
                      </div>
                    )}
                  </div>
                  <div className="mt-2 text-xs font-medium text-charcoal truncate">{speaker.name}</div>
                  <div className="text-xs text-charcoal/50 truncate">{speaker.role}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Partners Preview */}
        {preview?.partners?.length > 0 && (
          <div className="p-6 border-t border-lightborder bg-charcoal/5">
            <h4 className="font-semibold text-charcoal mb-4">Partenaires ({preview.partners.length})</h4>
            <div className="flex gap-6 items-center justify-center flex-wrap">
              {preview.partners.map(partner => (
                <div key={partner.id} className="h-10">
                  {partner.logo_url ? (
                    <img src={partner.logo_url} alt={partner.name} className="h-full w-auto object-contain" />
                  ) : (
                    <div className="h-full px-4 bg-white rounded flex items-center text-xs text-charcoal/50">
                      {partner.name}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-paper border border-lightborder rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-terracotta">{preview?.media?.length || 0}</div>
          <div className="text-sm text-charcoal/60">Médias</div>
        </div>
        <div className="bg-paper border border-lightborder rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-gold">{preview?.exhibitors?.length || 0}</div>
          <div className="text-sm text-charcoal/60">Photos Exposants</div>
        </div>
        <div className="bg-paper border border-lightborder rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-sage">{preview?.speakers?.length || 0}</div>
          <div className="text-sm text-charcoal/60">Intervenants</div>
        </div>
        <div className="bg-paper border border-lightborder rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-charcoal">{preview?.partners?.length || 0}</div>
          <div className="text-sm text-charcoal/60">Partenaires</div>
        </div>
      </div>
    </div>
  );
};

// ================== MAIN CMS COMPONENT ==================
const CMSAdmin = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeSection, setActiveSection] = useState('media');

  const sections = [
    { id: 'media', label: 'Médias', icon: Image },
    { id: 'exhibitors', label: 'Exposants', icon: Users },
    { id: 'speakers', label: 'Intervenants', icon: Mic2 },
    { id: 'partners', label: 'Partenaires', icon: Building2 },
    { id: 'preview', label: 'Prévisualisation', icon: Eye }
  ];

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'CC2026admin') {
      setIsAuthenticated(true);
    } else {
      toast.error('Mot de passe incorrect');
    }
  };

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="bg-paper rounded-xl shadow-lg p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <Settings className="w-12 h-12 text-terracotta mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-charcoal">CMS Admin</h1>
            <p className="text-charcoal/60 text-sm">Culture Connect 2026</p>
          </div>
          <form onSubmit={handleLogin}>
            <Input
              type="password"
              placeholder="Mot de passe administrateur"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mb-4"
            />
            <Button type="submit" className="w-full bg-terracotta text-white">
              Connexion
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-charcoal text-paper">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin')}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold">CMS Admin</h1>
                <p className="text-sm text-paper/60">Gestion du contenu Culture Connect 2026</p>
              </div>
            </div>
            <Button
              onClick={() => setIsAuthenticated(false)}
              variant="outline"
              size="sm"
              className="border-paper/30 text-paper hover:bg-white/10"
            >
              Déconnexion
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-paper border-b border-lightborder sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto">
            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${
                  activeSection === section.id
                    ? 'border-terracotta text-terracotta'
                    : 'border-transparent text-charcoal/60 hover:text-charcoal'
                }`}
              >
                <section.icon className="w-4 h-4" />
                {section.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeSection === 'media' && <MediaSection />}
        {activeSection === 'exhibitors' && <ExhibitorsSection />}
        {activeSection === 'speakers' && <SpeakersSection />}
        {activeSection === 'partners' && <PartnersSection />}
        {activeSection === 'preview' && <PreviewSection />}
      </div>
    </div>
  );
};

export default CMSAdmin;
