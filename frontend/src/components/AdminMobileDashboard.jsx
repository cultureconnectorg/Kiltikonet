/**
 * Admin Mobile Dashboard - CC2026
 * Dashboard adaptatif avec Scanner QR et dernières inscriptions
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  QrCode, Camera, X, Users, Bell, Activity, 
  ChevronRight, Clock, CheckCircle, AlertCircle,
  RefreshCw, Settings, LogOut, Home
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from './ui/button';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL || '';

// ═══════════════════════════════════════════════════════════════
// DESIGN TOKENS - Style élégant fond clair
// ═══════════════════════════════════════════════════════════════
const COLORS = {
  background: '#F4F1EA',
  card: '#FFFFFF',
  text: '#1A1A14',
  textMuted: '#6B6B6B',
  accent: '#D4A84B',
  terracotta: '#C4714A',
  success: '#4CAF50',
  border: '#E5E0D8',
};

// ═══════════════════════════════════════════════════════════════
// QR CODE SCANNER COMPONENT
// ═══════════════════════════════════════════════════════════════
const QRScanner = ({ onScan, onClose }) => {
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const [error, setError] = useState(null);
  const [isStarting, setIsStarting] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    const startScanner = async () => {
      try {
        const html5QrCode = new Html5Qrcode("qr-reader");
        html5QrCodeRef.current = html5QrCode;

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        };

        await html5QrCode.start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            if (mounted) {
              onScan(decodedText);
              html5QrCode.stop().catch(console.error);
            }
          },
          (errorMessage) => {
            // Ignore scan errors
          }
        );
        
        if (mounted) setIsStarting(false);
      } catch (err) {
        console.error('QR Scanner error:', err);
        if (mounted) {
          setError('Impossible d\'accéder à la caméra. Vérifiez les permissions.');
          setIsStarting(false);
        }
      }
    };

    startScanner();

    return () => {
      mounted = false;
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/80">
        <h2 className="text-white font-bold">Scanner un badge</h2>
        <button 
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Scanner Area */}
      <div className="flex-1 flex items-center justify-center p-4">
        {isStarting ? (
          <div className="text-center text-white">
            <Camera className="w-16 h-16 mx-auto mb-4 animate-pulse" />
            <p>Activation de la caméra...</p>
          </div>
        ) : error ? (
          <div className="text-center text-white p-6">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <p className="mb-4">{error}</p>
            <Button onClick={onClose} variant="outline" className="border-white text-white">
              Fermer
            </Button>
          </div>
        ) : (
          <div className="w-full max-w-sm">
            <div 
              id="qr-reader" 
              ref={scannerRef}
              className="rounded-2xl overflow-hidden"
              style={{ width: '100%' }}
            />
            <p className="text-center text-white/70 mt-4 text-sm">
              Placez le QR code dans le cadre
            </p>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="p-6 bg-black/80 text-center">
        <p className="text-white/60 text-sm">
          Scannez le QR code présent sur le badge d'accréditation
        </p>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// SCAN RESULT MODAL
// ═══════════════════════════════════════════════════════════════
const ScanResultModal = ({ data, onClose, onValidate }) => {
  if (!data) return null;

  const isValid = data.status === 'approved';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div 
        className="w-full max-w-sm rounded-2xl p-6"
        style={{ background: COLORS.card }}
      >
        {/* Status Icon */}
        <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${isValid ? 'bg-green-100' : 'bg-red-100'}`}>
          {isValid ? (
            <CheckCircle className="w-10 h-10 text-green-600" />
          ) : (
            <AlertCircle className="w-10 h-10 text-red-600" />
          )}
        </div>

        {/* Status Text */}
        <h3 className={`text-xl font-bold text-center mb-2 ${isValid ? 'text-green-700' : 'text-red-700'}`}>
          {isValid ? 'Badge Valide' : 'Badge Non Valide'}
        </h3>

        {/* Person Info */}
        {data.full_name && (
          <div className="text-center mb-4">
            <p className="text-lg font-semibold" style={{ color: COLORS.text }}>{data.full_name}</p>
            <p className="text-sm" style={{ color: COLORS.textMuted }}>{data.organization_name}</p>
            <p className="text-xs mt-1" style={{ color: COLORS.textMuted }}>{data.profile_type}</p>
          </div>
        )}

        {/* Tier Badge */}
        {data.tier && (
          <div className="flex justify-center mb-4">
            <span 
              className="px-4 py-1 rounded-full text-sm font-medium"
              style={{ 
                background: data.tier === 'premium' ? `${COLORS.accent}20` : '#eee',
                color: data.tier === 'premium' ? COLORS.accent : COLORS.textMuted
              }}
            >
              {data.tier.toUpperCase()}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button 
            onClick={onClose}
            variant="outline"
            className="flex-1"
            style={{ borderColor: COLORS.border, color: COLORS.text }}
          >
            Fermer
          </Button>
          {isValid && (
            <Button 
              onClick={() => onValidate(data)}
              className="flex-1"
              style={{ background: COLORS.accent, color: '#fff' }}
            >
              Valider entrée
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// RECENT REGISTRATION CARD
// ═══════════════════════════════════════════════════════════════
const RegistrationCard = ({ registration, onClick }) => {
  const timeAgo = (date) => {
    const now = new Date();
    const then = new Date(date);
    const diff = Math.floor((now - then) / 1000);
    
    if (diff < 60) return 'À l\'instant';
    if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
    return `Il y a ${Math.floor(diff / 86400)} j`;
  };

  return (
    <button
      onClick={onClick}
      className="w-full p-4 rounded-xl flex items-center gap-4 transition-all hover:shadow-md"
      style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
    >
      <img
        src={registration.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(registration.full_name || 'U')}&background=D4A84B&color=fff`}
        alt={registration.full_name}
        className="w-12 h-12 rounded-full object-cover"
      />
      <div className="flex-1 text-left min-w-0">
        <p className="font-semibold truncate" style={{ color: COLORS.text }}>
          {registration.full_name}
        </p>
        <p className="text-sm truncate" style={{ color: COLORS.textMuted }}>
          {registration.organization_name || registration.profile_type}
        </p>
      </div>
      <div className="text-right">
        <span className="text-xs" style={{ color: COLORS.textMuted }}>
          {timeAgo(registration.created_at)}
        </span>
        <ChevronRight className="w-5 h-5 ml-auto mt-1" style={{ color: COLORS.textMuted }} />
      </div>
    </button>
  );
};

// ═══════════════════════════════════════════════════════════════
// STATS CARD
// ═══════════════════════════════════════════════════════════════
const StatsCard = ({ icon: Icon, label, value, color }) => (
  <div 
    className="p-4 rounded-xl"
    style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
  >
    <div className="flex items-center gap-3">
      <div 
        className="w-10 h-10 rounded-lg flex items-center justify-center"
        style={{ background: `${color}15` }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-bold" style={{ color: COLORS.text }}>{value}</p>
        <p className="text-xs" style={{ color: COLORS.textMuted }}>{label}</p>
      </div>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════
// MAIN ADMIN MOBILE DASHBOARD
// ═══════════════════════════════════════════════════════════════
const AdminMobileDashboard = () => {
  const navigate = useNavigate();
  const [showScanner, setShowScanner] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [recentRegistrations, setRecentRegistrations] = useState([]);
  const [stats, setStats] = useState({ total: 0, today: 0, pending: 0 });
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Check admin role
  const getAdminSession = () => {
    // Check persistent session
    try {
      const persistent = localStorage.getItem('cc2026_session');
      if (persistent) {
        const session = JSON.parse(persistent);
        if (session.createdAt && (Date.now() - session.createdAt) < 30 * 24 * 60 * 60 * 1000) {
          return session;
        }
      }
    } catch {}
    
    // Check temp session
    try {
      const temp = sessionStorage.getItem('workspace_user');
      if (temp) return JSON.parse(temp);
    } catch {}
    
    return {};
  };
  
  const session = getAdminSession();
  const isAdmin = session.role === 'admin' || session.role === 'founder' || session.workspace;

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      // Fetch recent registrations
      const regRes = await fetch(`${API}/api/registrations?limit=10`);
      if (regRes.ok) {
        const regData = await regRes.json();
        setRecentRegistrations(regData.registrations || []);
        
        // Calculate stats
        const today = new Date().toDateString();
        const todayCount = (regData.registrations || []).filter(
          r => new Date(r.created_at).toDateString() === today
        ).length;
        const pendingCount = (regData.registrations || []).filter(
          r => r.status === 'pending'
        ).length;
        
        setStats({
          total: regData.count || regData.registrations?.length || 0,
          today: todayCount,
          pending: pendingCount
        });
      }

      // Fetch team notifications
      const notifRes = await fetch(`${API}/api/team/notifications?limit=5`);
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        setNotifications(notifData.notifications || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Handle QR scan
  const handleScan = async (decodedText) => {
    setShowScanner(false);
    
    try {
      // Parse QR data (could be JSON or just an ID)
      let badgeId;
      try {
        const parsed = JSON.parse(decodedText);
        badgeId = parsed.id || parsed.badge_id || decodedText;
      } catch {
        badgeId = decodedText;
      }

      // Fetch badge/registration info
      const res = await fetch(`${API}/api/registrations/${badgeId}`);
      if (res.ok) {
        const data = await res.json();
        setScanResult(data);
      } else {
        setScanResult({ status: 'invalid', message: 'Badge non trouvé' });
      }
    } catch (error) {
      console.error('Scan error:', error);
      setScanResult({ status: 'error', message: 'Erreur de lecture' });
    }
  };

  // Validate entry
  const handleValidateEntry = async (data) => {
    try {
      await fetch(`${API}/api/accreditation/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registration_id: data.id })
      });
      toast.success('Entrée validée !');
      setScanResult(null);
    } catch (error) {
      toast.error('Erreur de validation');
    }
  };

  // Refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ background: COLORS.background }}
      >
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" style={{ color: COLORS.accent }} />
          <p style={{ color: COLORS.textMuted }}>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen pb-20"
      style={{ background: COLORS.background }}
      data-testid="admin-mobile-dashboard"
    >
      {/* Header */}
      <header className="sticky top-0 z-30 px-4 py-4 safe-area-top" style={{ background: COLORS.background }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: COLORS.text }}>Admin CC2026</h1>
            <p className="text-sm" style={{ color: COLORS.textMuted }}>
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleRefresh}
              className={`p-2 rounded-full ${refreshing ? 'animate-spin' : ''}`}
              style={{ background: COLORS.card }}
              disabled={refreshing}
            >
              <RefreshCw className="w-5 h-5" style={{ color: COLORS.textMuted }} />
            </button>
            <button 
              onClick={() => navigate('/admin/settings')}
              className="p-2 rounded-full"
              style={{ background: COLORS.card }}
            >
              <Settings className="w-5 h-5" style={{ color: COLORS.textMuted }} />
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 space-y-6">
        {/* QR Scanner Button */}
        <button
          onClick={() => setShowScanner(true)}
          className="w-full p-6 rounded-2xl flex items-center justify-center gap-4 transition-transform active:scale-98"
          style={{ background: COLORS.accent }}
          data-testid="scan-qr-button"
        >
          <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
            <QrCode className="w-8 h-8 text-white" />
          </div>
          <div className="text-left">
            <p className="text-lg font-bold text-white">Scanner un badge</p>
            <p className="text-sm text-white/80">Valider une accréditation</p>
          </div>
          <Camera className="w-6 h-6 text-white/60 ml-auto" />
        </button>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatsCard 
            icon={Users} 
            label="Total" 
            value={stats.total} 
            color={COLORS.accent}
          />
          <StatsCard 
            icon={Activity} 
            label="Aujourd'hui" 
            value={stats.today} 
            color={COLORS.terracotta}
          />
          <StatsCard 
            icon={Clock} 
            label="En attente" 
            value={stats.pending} 
            color="#FF9800"
          />
        </div>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold" style={{ color: COLORS.text }}>Notifications</h2>
              <Bell className="w-5 h-5" style={{ color: COLORS.textMuted }} />
            </div>
            <div 
              className="p-4 rounded-xl space-y-3"
              style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
            >
              {notifications.slice(0, 3).map((notif, i) => (
                <div key={notif.id || i} className="flex items-start gap-3">
                  <div 
                    className="w-2 h-2 rounded-full mt-2"
                    style={{ background: notif.read ? COLORS.textMuted : COLORS.accent }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: COLORS.text }}>
                      {notif.title}
                    </p>
                    <p className="text-xs truncate" style={{ color: COLORS.textMuted }}>
                      {notif.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Registrations */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold" style={{ color: COLORS.text }}>Dernières inscriptions</h2>
            <button 
              onClick={() => navigate('/admin/registrations')}
              className="text-sm"
              style={{ color: COLORS.accent }}
            >
              Voir tout
            </button>
          </div>
          <div className="space-y-3">
            {recentRegistrations.length === 0 ? (
              <div 
                className="p-6 rounded-xl text-center"
                style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
              >
                <Users className="w-12 h-12 mx-auto mb-2" style={{ color: COLORS.textMuted }} />
                <p style={{ color: COLORS.textMuted }}>Aucune inscription récente</p>
              </div>
            ) : (
              recentRegistrations.slice(0, 5).map((reg) => (
                <RegistrationCard 
                  key={reg.id} 
                  registration={reg}
                  onClick={() => navigate(`/admin/participant/${reg.id}`)}
                />
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 pb-4">
          <button
            onClick={() => navigate('/admin')}
            className="p-4 rounded-xl flex items-center gap-3"
            style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
          >
            <Home className="w-5 h-5" style={{ color: COLORS.accent }} />
            <span className="text-sm font-medium" style={{ color: COLORS.text }}>Dashboard</span>
          </button>
          <button
            onClick={() => {
              localStorage.removeItem('cc2026_admin_session');
              navigate('/admin/login');
            }}
            className="p-4 rounded-xl flex items-center gap-3"
            style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
          >
            <LogOut className="w-5 h-5" style={{ color: COLORS.terracotta }} />
            <span className="text-sm font-medium" style={{ color: COLORS.text }}>Déconnexion</span>
          </button>
        </div>
      </main>

      {/* QR Scanner Modal */}
      {showScanner && (
        <QRScanner 
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Scan Result Modal */}
      {scanResult && (
        <ScanResultModal
          data={scanResult}
          onClose={() => setScanResult(null)}
          onValidate={handleValidateEntry}
        />
      )}
    </div>
  );
};

export default AdminMobileDashboard;
