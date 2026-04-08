import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShieldCheck, ArrowLeft, Fingerprint, Globe, ChevronRight, User, Scale, Award, History, Settings, Shield, Bell, Eye, LogOut, Moon, Save, Loader2, Trash2, AlertTriangle, Languages, X, CheckCircle } from "lucide-react";

const API = process.env.REACT_APP_BACKEND_URL;

export default function SovereignProfileView({ onBack, auth, adhesion, adhesionLevels, onSubscribe, onCancelAdhesion }) {
  const [showSettings, setShowSettings] = useState(false);
  const [activeSection, setActiveSection] = useState("account");
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Editable fields
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editLang, setEditLang] = useState("fr");
  const [editNotifEmail, setEditNotifEmail] = useState(true);
  const [editNotifPush, setEditNotifPush] = useState(false);
  const [editNotifSound, setEditNotifSound] = useState(() => localStorage.getItem('kk_notif_sound') === 'true');
  const [editProfilePublic, setEditProfilePublic] = useState(true);

  const userName = auth?.userName || 'Souverain';
  const frekId = auth?.frekId || '---';
  const email = auth?.user?.email || 'non connecte';
  const adhesionLevel = adhesion?.level || 'FREE';
  const brainQuota = adhesion?.brain_quota_daily || 10;
  const brainUsed = adhesion?.brain_quota_used_today || 0;

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/user/settings`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        setEditName(data.profile?.full_name || '');
        setEditBio(data.profile?.bio || '');
        setEditLang(data.preferences?.language || 'fr');
        setEditNotifEmail(data.notifications?.email_enabled ?? true);
        setEditNotifPush(data.notifications?.push_enabled ?? false);
        setEditProfilePublic(data.privacy?.profile_public ?? true);
      }
    } catch (e) { console.error("Settings fetch error:", e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  // Save profile
  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/user/settings`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'profile', data: { full_name: editName, bio: editBio } }),
        credentials: 'include',
      });
      if (res.ok) showToast("Profil sauvegarde");
    } catch {}
    finally { setSaving(false); }
  };

  // Save preferences
  const savePreferences = async () => {
    setSaving(true);
    try {
      await Promise.all([
        fetch(`${API}/api/user/settings`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ section: 'preferences', data: { language: editLang } }),
          credentials: 'include',
        }),
        fetch(`${API}/api/user/settings`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ section: 'notifications', data: { email_enabled: editNotifEmail, push_enabled: editNotifPush, in_app_enabled: true } }),
          credentials: 'include',
        }),
        fetch(`${API}/api/user/settings`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ section: 'privacy', data: { profile_public: editProfilePublic, frek_id_public: false } }),
          credentials: 'include',
        }),
      ]);
      showToast("Preferences sauvegardees");
    } catch {}
    finally { setSaving(false); }
  };

  // Delete account (RGPD)
  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      const res = await fetch(`${API}/api/user/account`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) {
        showToast("Compte supprime. Redirection...");
        setTimeout(() => { auth?.logout?.(); window.location.href = '/'; }, 2000);
      }
    } catch {}
    finally { setDeleteLoading(false); setShowDeleteConfirm(false); }
  };

  const securityLayers = [
    { label: "Signature Luciole", status: "Active", value: frekId ? frekId.slice(0, 12) : "---" },
    { label: "Empreinte Culturelle", status: "Verified", value: "2.47 KB" },
    { label: "Protocole Omega", status: "Encrypted", value: "AES-256" },
    { label: "Souverainete", status: "Absolute", value: adhesionLevel },
  ];

  const sections = [
    { id: "account", label: "Compte", icon: User },
    { id: "security", label: "Securite", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Confidentialite", icon: Eye },
    { id: "language", label: "Langue", icon: Languages },
    { id: "danger", label: "Zone Danger", icon: AlertTriangle },
  ];

  return (
    <div className="flex flex-col h-screen w-full text-white overflow-hidden" style={{ background: '#050505' }} data-testid="profile-view">
      {/* Header */}
      <header className="shrink-0 px-5 pt-5 pb-3">
        <div className="flex items-center gap-3 mb-4">
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={showSettings ? () => setShowSettings(false) : onBack} className="w-9 h-9 rounded-full flex items-center justify-center bg-white/5 text-gray-400 hover:text-[#f2ca50]" style={{ border: '1px solid rgba(255,255,255,0.1)' }} data-testid="profile-back-btn">
            <ArrowLeft className="w-4 h-4" />
          </motion.button>
          <div>
            <span className="italic text-base uppercase tracking-wider" style={{ fontFamily: "'Noto Serif', serif", color: '#f2ca50' }}>{showSettings ? 'Parametres' : 'Profil Souverain'}</span>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-8">
        {!showSettings ? (
          <>
            {/* Profile card */}
            <div className="p-5 rounded-2xl mb-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold" style={{ background: 'linear-gradient(135deg, #f2ca50, #d4a84b)', color: 'black' }}>
                  {userName[0]}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{userName}</h2>
                  <div className="flex items-center gap-1.5 mt-1">
                    <ShieldCheck className="w-3.5 h-3.5" style={{ color: '#f2ca50' }} />
                    <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: '#f2ca50' }}>FREK-ID: {frekId || '---'}</span>
                  </div>
                  <span className="text-[10px] text-gray-500">{email}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(242,202,80,0.05)', border: '1px solid rgba(242,202,80,0.1)' }}>
                  <div className="text-sm font-bold" style={{ color: '#f2ca50' }}>{adhesionLevel}</div>
                  <div className="text-[8px] text-gray-600 tracking-wider uppercase">Adhesion</div>
                </div>
                <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(242,202,80,0.05)', border: '1px solid rgba(242,202,80,0.1)' }}>
                  <div className="text-sm font-bold" style={{ color: '#f2ca50' }}>{brainUsed}/{brainQuota}</div>
                  <div className="text-[8px] text-gray-600 tracking-wider uppercase">Brain/Jour</div>
                </div>
                <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(242,202,80,0.05)', border: '1px solid rgba(242,202,80,0.1)' }}>
                  <div className="text-sm font-bold" style={{ color: '#f2ca50' }}>98</div>
                  <div className="text-[8px] text-gray-600 tracking-wider uppercase">Score</div>
                </div>
              </div>
            </div>

            {/* Security layers */}
            <div className="mb-5">
              <div className="text-[10px] text-gray-500 tracking-widest uppercase mb-3">Couches de Securite</div>
              <div className="space-y-2">
                {securityLayers.map((layer, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <span className="text-xs text-gray-400">{layer.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono" style={{ color: '#f2ca50' }}>{layer.value}</span>
                      <span className="text-[8px] px-2 py-0.5 rounded-full font-bold tracking-wider" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>{layer.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Settings button */}
            <motion.button whileTap={{ scale: 0.98 }} onClick={() => setShowSettings(true)} className="w-full p-4 rounded-xl flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }} data-testid="open-settings-btn">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-white">Parametres</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </motion.button>

            {/* Logout */}
            <motion.button whileTap={{ scale: 0.98 }} onClick={() => { auth?.logout?.(); window.location.href = '/'; }} className="w-full mt-3 p-4 rounded-xl flex items-center gap-3" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)' }} data-testid="logout-btn">
              <LogOut className="w-5 h-5 text-red-400" />
              <span className="text-sm text-red-400">Deconnexion</span>
            </motion.button>
          </>
        ) : (
          /* Settings panel */
          <div className="space-y-6">
            {/* Section tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
              {sections.map(s => (
                <button key={s.id} onClick={() => setActiveSection(s.id)} className="px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase shrink-0 transition-all" style={{ background: activeSection === s.id ? '#f2ca50' : 'rgba(255,255,255,0.05)', color: activeSection === s.id ? 'black' : '#999', border: `1px solid ${activeSection === s.id ? '#f2ca50' : 'rgba(255,255,255,0.08)'}` }} data-testid={`settings-tab-${s.id}`}>
                  {s.label}
                </button>
              ))}
            </div>

            {activeSection === "account" && (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-gray-500 tracking-widest uppercase mb-2 block">Nom complet</label>
                  <input value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-white/5 text-sm px-4 py-2.5 rounded-xl outline-none text-white" style={{ border: '1px solid rgba(255,255,255,0.1)' }} data-testid="settings-name" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 tracking-widest uppercase mb-2 block">Bio</label>
                  <textarea value={editBio} onChange={e => setEditBio(e.target.value)} rows={3} className="w-full bg-white/5 text-sm px-4 py-3 rounded-xl outline-none text-white resize-none" style={{ border: '1px solid rgba(255,255,255,0.1)' }} data-testid="settings-bio" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 tracking-widest uppercase mb-2 block">Email</label>
                  <input value={email} disabled className="w-full bg-white/5 text-sm px-4 py-2.5 rounded-xl outline-none text-gray-500" style={{ border: '1px solid rgba(255,255,255,0.05)' }} />
                </div>
                <motion.button whileTap={{ scale: 0.95 }} onClick={saveProfile} disabled={saving} className="w-full py-3 rounded-xl text-sm font-bold tracking-widest uppercase flex items-center justify-center gap-2" style={{ background: saving ? '#333' : '#f2ca50', color: 'black' }} data-testid="save-profile-btn">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                </motion.button>
              </div>
            )}

            {activeSection === "notifications" && (
              <div className="space-y-3">
                <ToggleItem label="Notifications par email" value={editNotifEmail} onChange={setEditNotifEmail} testId="notif-email" />
                <ToggleItem label="Notifications push" value={editNotifPush} onChange={setEditNotifPush} testId="notif-push" />
                <ToggleItem label="Sons de notification" value={editNotifSound} onChange={(v) => { setEditNotifSound(v); localStorage.setItem('kk_notif_sound', v ? 'true' : 'false'); }} testId="notif-sound" />
                <motion.button whileTap={{ scale: 0.95 }} onClick={savePreferences} disabled={saving} className="w-full py-3 rounded-xl text-sm font-bold tracking-widest uppercase" style={{ background: saving ? '#333' : '#f2ca50', color: 'black' }} data-testid="save-notif-btn">
                  {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                </motion.button>
              </div>
            )}

            {activeSection === "privacy" && (
              <div className="space-y-3">
                <ToggleItem label="Profil public" value={editProfilePublic} onChange={setEditProfilePublic} testId="privacy-public" />
                <motion.button whileTap={{ scale: 0.95 }} onClick={savePreferences} disabled={saving} className="w-full py-3 rounded-xl text-sm font-bold tracking-widest uppercase" style={{ background: saving ? '#333' : '#f2ca50', color: 'black' }} data-testid="save-privacy-btn">
                  {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                </motion.button>
              </div>
            )}

            {activeSection === "language" && (
              <div className="space-y-4">
                <div className="text-xs text-gray-400 mb-2">Langue de l'interface et du CVL Brain</div>
                {["fr", "cr", "en"].map(lang => (
                  <motion.button key={lang} whileTap={{ scale: 0.98 }} onClick={() => { setEditLang(lang); }} className="w-full p-4 rounded-xl flex items-center justify-between" style={{ background: editLang === lang ? 'rgba(242,202,80,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${editLang === lang ? 'rgba(242,202,80,0.3)' : 'rgba(255,255,255,0.06)'}` }} data-testid={`lang-${lang}`}>
                    <span className="text-sm text-white">{lang === 'fr' ? 'Francais' : lang === 'cr' ? 'Creole Martiniquais' : 'English'}</span>
                    {editLang === lang && <CheckCircle className="w-4 h-4" style={{ color: '#f2ca50' }} />}
                  </motion.button>
                ))}
                <motion.button whileTap={{ scale: 0.95 }} onClick={savePreferences} disabled={saving} className="w-full py-3 rounded-xl text-sm font-bold tracking-widest uppercase" style={{ background: saving ? '#333' : '#f2ca50', color: 'black' }} data-testid="save-lang-btn">
                  {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                </motion.button>
              </div>
            )}

            {activeSection === "security" && (
              <div className="space-y-3">
                {securityLayers.map((l, i) => (
                  <div key={i} className="p-4 rounded-xl flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <span className="text-xs text-gray-400">{l.label}</span>
                    <span className="text-xs font-mono" style={{ color: '#f2ca50' }}>{l.value}</span>
                  </div>
                ))}
              </div>
            )}

            {activeSection === "danger" && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span className="text-sm font-bold text-red-400">Suppression du compte (RGPD)</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">Cette action est irreversible. Vos donnees personnelles seront anonymisees conformement au RGPD. Votre FREK-ID sera desactive. Les logs d'audit seront conserves de maniere anonyme.</p>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowDeleteConfirm(true)} className="w-full py-3 rounded-xl text-sm font-bold tracking-widest uppercase" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }} data-testid="delete-account-btn">
                    Supprimer mon compte
                  </motion.button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,0.8)' }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-sm rounded-2xl p-6" style={{ background: '#0e0e0e', border: '1px solid rgba(239,68,68,0.2)' }} data-testid="delete-confirm-modal">
              <AlertTriangle className="w-10 h-10 text-red-400 mb-3" />
              <h3 className="text-lg font-bold text-white mb-2">Confirmer la suppression</h3>
              <p className="text-xs text-gray-500 mb-5">Tapez SUPPRIMER pour confirmer la suppression definitive de votre compte.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 rounded-xl text-sm bg-white/5 text-gray-400" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>Annuler</button>
                <motion.button whileTap={{ scale: 0.95 }} onClick={handleDeleteAccount} disabled={deleteLoading} className="flex-1 py-3 rounded-xl text-sm font-bold" style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }} data-testid="confirm-delete-btn">
                  {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Supprimer'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full text-sm font-bold" style={{ background: '#f2ca50', color: 'black' }}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ToggleItem({ label, value, onChange, testId }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <span className="text-sm text-white">{label}</span>
      <motion.button whileTap={{ scale: 0.9 }} onClick={() => onChange(!value)} className="w-12 h-6 rounded-full p-0.5 transition-all" style={{ background: value ? '#f2ca50' : 'rgba(255,255,255,0.1)' }} data-testid={testId}>
        <motion.div animate={{ x: value ? 24 : 0 }} className="w-5 h-5 rounded-full" style={{ background: value ? 'black' : '#666' }} />
      </motion.button>
    </div>
  );
}
