/**
 * Admin Mobile Dashboard - CC2026 Mode Terrain
 * Dashboard avec Scanner QR, Affluence temps réel, Recherche rapide
 * Optimisé pour l'utilisation sur le terrain pendant l'événement
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  QrCode, Camera, X, Users, Bell, Activity, 
  ChevronRight, Clock, CheckCircle, AlertCircle,
  RefreshCw, Settings, LogOut, Home, Search,
  UserCheck, TrendingUp, Zap, Target
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL || '';

// ═══════════════════════════════════════════════════════════════
// DESIGN TOKENS - Charte Kiltikonet Terrain
// ═══════════════════════════════════════════════════════════════
const COLORS = {
  background: '#F4F0E8',  // Cream (Fond)
  card: '#FFFFFF',
  cardWarm: '#E8E0D0',    // Warm (Cartes)
  text: '#1A1510',         // Dark (Texte/Titres)
  textMuted: '#6B6560',
  accent: '#C9A84C',       // Gold (Détails/Badges)
  terra: '#A65D47',        // Terra (Action)
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  border: '#E8E0D0',
  violet: '#3B0764',
};

// ═══════════════════════════════════════════════════════════════
// QR CODE SCANNER COMPONENT (Optimisé batterie)
// ═══════════════════════════════════════════════════════════════
const QRScanner = ({ onScan, onClose, isActive }) => {
  const html5QrCodeRef = useRef(null);
  const [error, setError] = useState(null);
  const [isStarting, setIsStarting] = useState(true);

  // Start/Stop scanner based on isActive prop (battery optimization)
  useEffect(() => {
    let mounted = true;
    
    const startScanner = async () => {
      if (!isActive) return;
      
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
              // Vibrate on successful scan
              if (navigator.vibrate) navigator.vibrate(100);
              onScan(decodedText);
            }
          },
          () => {} // Ignore scan errors
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

    // Cleanup - IMPORTANT for battery optimization
    return () => {
      mounted = false;
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
        html5QrCodeRef.current = null;
      }
    };
  }, [onScan, isActive]);

  // Stop scanner when component closes
  useEffect(() => {
    if (!isActive && html5QrCodeRef.current) {
      html5QrCodeRef.current.stop().catch(() => {});
      html5QrCodeRef.current = null;
    }
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/80 safe-area-top">
        <h2 className="text-white font-bold text-lg">Scanner un badge</h2>
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
              className="rounded-2xl overflow-hidden"
              style={{ width: '100%' }}
            />
            <p className="text-center text-white/70 mt-4 text-sm">
              Placez le QR code dans le cadre
            </p>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-6 bg-black/80 text-center safe-area-bottom">
        <p className="text-white/60 text-sm">
          Le scan s'arrête automatiquement pour économiser la batterie
        </p>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// SCAN RESULT MODAL - Visual feedback Vert/Orange/Rouge
// ═══════════════════════════════════════════════════════════════
const ScanResultModal = ({ result, onClose, onRetry }) => {
  const colorMap = {
    green: { bg: 'bg-green-100', icon: 'text-green-600', border: 'border-green-200' },
    orange: { bg: 'bg-orange-100', icon: 'text-orange-600', border: 'border-orange-200' },
    red: { bg: 'bg-red-100', icon: 'text-red-600', border: 'border-red-200' },
  };

  const colors = result ? (colorMap[result.color] || colorMap.red) : colorMap.red;
  const isSuccess = result?.color === 'green';
  const isWarning = result?.color === 'orange';

  // Auto-close success after 3 seconds
  useEffect(() => {
    if (isSuccess && result) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, onClose, result]);

  if (!result) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div 
        className={`w-full max-w-sm rounded-2xl p-6 ${colors.bg} ${colors.border} border-2`}
        style={{ background: COLORS.card }}
      >
        {/* Status Icon */}
        <div className={`w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center ${colors.bg}`}>
          {isSuccess ? (
            <CheckCircle className={`w-14 h-14 ${colors.icon}`} />
          ) : isWarning ? (
            <AlertCircle className={`w-14 h-14 ${colors.icon}`} />
          ) : (
            <X className={`w-14 h-14 ${colors.icon}`} />
          )}
        </div>

        {/* Status Text */}
        <h3 className={`text-2xl font-bold text-center mb-2 ${
          isSuccess ? 'text-green-700' : isWarning ? 'text-orange-700' : 'text-red-700'
        }`}>
          {result.message}
        </h3>

        {/* Person Info */}
        {result.person && (
          <div className="text-center mb-4 p-4 rounded-xl" style={{ background: COLORS.background }}>
            <p className="text-xl font-bold" style={{ color: COLORS.text }}>
              {result.person.full_name}
            </p>
            <p className="text-sm" style={{ color: COLORS.textMuted }}>
              {result.person.organization_name || result.person.type_label || result.person.type_badge}
            </p>
            <div className="flex justify-center gap-2 mt-2">
              <span 
                className="px-3 py-1 text-xs rounded-full font-medium"
                style={{ 
                  background: result.person.tier === 'premium' || result.person.nfc_enabled ? `${COLORS.accent}20` : '#eee',
                  color: result.person.tier === 'premium' || result.person.nfc_enabled ? COLORS.accent : COLORS.textMuted
                }}
              >
                {result.person.type_badge || (result.person.tier || 'standard').toUpperCase()}
              </span>
              {result.person.nfc_enabled && (
                <span className="px-3 py-1 text-xs rounded-full font-medium" style={{ background: `${COLORS.accent}20`, color: COLORS.accent }}>NFC</span>
              )}
            </div>
            {/* Jeton debit info */}
            {result.jetons_debited > 0 && (
              <div className="mt-3 p-2 rounded-lg" style={{ background: `${COLORS.accent}10`, border: `1px solid ${COLORS.accent}30` }}>
                <p className="text-xs" style={{ color: COLORS.textMuted }}>Débit</p>
                <p className="text-lg font-bold" style={{ color: COLORS.accent }}>-{result.jetons_debited}J → {result.new_solde}J restants</p>
              </div>
            )}
          </div>
        )}

        {/* Scan time for duplicates */}
        {result.scanned_at && isWarning && (
          <p className="text-center text-sm mb-4" style={{ color: COLORS.textMuted }}>
            Scanné à {new Date(result.scanned_at).toLocaleTimeString('fr-FR')}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button 
            onClick={onClose}
            className="flex-1"
            style={{ 
              background: isSuccess ? COLORS.success : COLORS.textMuted, 
              color: '#fff' 
            }}
          >
            {isSuccess ? 'Suivant' : 'Fermer'}
          </Button>
          {!isSuccess && (
            <Button 
              onClick={onRetry}
              variant="outline"
              className="flex-1"
              style={{ borderColor: COLORS.border }}
            >
              Réessayer
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// AFFLUENCE WIDGET - Temps réel
// ═══════════════════════════════════════════════════════════════
const AffluenceWidget = ({ data, onRefresh }) => {
  if (!data) return null;

  const percentage = data.percentage || 0;

  return (
    <div 
      className="p-5 rounded-2xl"
      style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${COLORS.success}15` }}>
            <TrendingUp className="w-5 h-5" style={{ color: COLORS.success }} />
          </div>
          <div>
            <h3 className="font-bold" style={{ color: COLORS.text }}>Affluence en direct</h3>
            <p className="text-xs" style={{ color: COLORS.textMuted }}>Mise à jour auto</p>
          </div>
        </div>
        <button onClick={onRefresh} className="p-2 rounded-full hover:bg-gray-100">
          <RefreshCw className="w-4 h-4" style={{ color: COLORS.textMuted }} />
        </button>
      </div>

      {/* Main Counter */}
      <div className="text-center py-4">
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-5xl font-bold" style={{ color: COLORS.success }}>{data.present_count}</span>
          <span className="text-2xl" style={{ color: COLORS.textMuted }}>/ {data.total_registered}</span>
        </div>
        <p className="text-sm mt-1" style={{ color: COLORS.textMuted }}>personnes présentes</p>
      </div>

      {/* Progress Bar */}
      <div className="h-3 rounded-full overflow-hidden mb-4" style={{ background: '#E5E5E5' }}>
        <div 
          className="h-full rounded-full transition-all duration-500"
          style={{ 
            width: `${percentage}%`,
            background: `linear-gradient(90deg, ${COLORS.success}, ${COLORS.accent})`
          }}
        />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2 rounded-lg" style={{ background: COLORS.background }}>
          <p className="text-lg font-bold" style={{ color: COLORS.text }}>{percentage}%</p>
          <p className="text-xs" style={{ color: COLORS.textMuted }}>Taux</p>
        </div>
        <div className="p-2 rounded-lg" style={{ background: COLORS.background }}>
          <p className="text-lg font-bold" style={{ color: COLORS.text }}>{data.remaining}</p>
          <p className="text-xs" style={{ color: COLORS.textMuted }}>Restants</p>
        </div>
        <div className="p-2 rounded-lg" style={{ background: COLORS.background }}>
          <p className="text-lg font-bold" style={{ color: COLORS.terra }}>{data.recent_scans_1h || 0}</p>
          <p className="text-xs" style={{ color: COLORS.textMuted }}>Cette heure</p>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// QUICK SEARCH - Recherche rapide par nom
// ═══════════════════════════════════════════════════════════════
const QuickSearch = ({ onCheckin }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchTimeout = useRef(null);

  const handleSearch = useCallback(async (q) => {
    if (!q || q.length < 2) {
      setResults([]);
      return;
    }

    setSearching(true);
    try {
      const res = await fetch(`${API}/api/terrain/search?q=${encodeURIComponent(q)}&limit=8`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => handleSearch(query), 300);
    return () => clearTimeout(searchTimeout.current);
  }, [query, handleSearch]);

  const handleManualCheckin = async (participant) => {
    try {
      const res = await fetch(`${API}/api/terrain/manual-checkin/${participant.id}`, {
        method: 'POST'
      });
      const data = await res.json();
      
      if (data.status === 'success') {
        toast.success(`${participant.full_name} enregistré !`);
        onCheckin();
        setQuery('');
        setResults([]);
      } else if (data.status === 'already_present') {
        toast.warning('Déjà enregistré comme présent');
      }
    } catch (error) {
      toast.error('Erreur lors du pointage');
    }
  };

  return (
    <div 
      className="p-4 rounded-2xl"
      style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Search className="w-5 h-5" style={{ color: COLORS.textMuted }} />
        <h3 className="font-bold" style={{ color: COLORS.text }}>Recherche rapide</h3>
      </div>
      
      <div className="relative">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nom ou organisation..."
          className="w-full pr-10"
          style={{ background: COLORS.background, border: `1px solid ${COLORS.border}` }}
        />
        {searching && (
          <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin" style={{ color: COLORS.textMuted }} />
        )}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
          {results.map((p) => (
            <div 
              key={p.id}
              className="flex items-center justify-between p-3 rounded-xl"
              style={{ background: COLORS.background }}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <img
                  src={p.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.full_name)}&background=D4A84B&color=fff&size=40`}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className="font-medium truncate" style={{ color: COLORS.text }}>{p.full_name}</p>
                  <p className="text-xs truncate" style={{ color: COLORS.textMuted }}>{p.organization_name}</p>
                </div>
              </div>
              
              {p.presence_status === 'present' ? (
                <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: `${COLORS.success}15`, color: COLORS.success }}>
                  <CheckCircle className="w-3 h-3" /> Présent
                </span>
              ) : (
                <Button
                  size="sm"
                  onClick={() => handleManualCheckin(p)}
                  style={{ background: COLORS.accent, color: '#fff' }}
                >
                  <UserCheck className="w-4 h-4 mr-1" /> Pointer
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {query.length >= 2 && results.length === 0 && !searching && (
        <p className="text-center py-4 text-sm" style={{ color: COLORS.textMuted }}>
          Aucun résultat pour "{query}"
        </p>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// LAST SCANS - Derniers scans
// ═══════════════════════════════════════════════════════════════
const LastScans = ({ scans }) => {
  if (!scans || scans.length === 0) return null;

  return (
    <div 
      className="p-4 rounded-2xl"
      style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-5 h-5" style={{ color: COLORS.accent }} />
        <h3 className="font-bold" style={{ color: COLORS.text }}>Derniers scans</h3>
      </div>
      
      <div className="space-y-2">
        {scans.map((scan, i) => (
          <div key={scan.id || i} className="flex items-center gap-3 py-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: `${COLORS.success}15` }}>
              <CheckCircle className="w-4 h-4" style={{ color: COLORS.success }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate" style={{ color: COLORS.text }}>
                {scan.person?.full_name || 'Participant'}
              </p>
              <p className="text-xs" style={{ color: COLORS.textMuted }}>
                {scan.person?.organization_name}
              </p>
            </div>
            <span className="text-xs" style={{ color: COLORS.textMuted }}>
              {new Date(scan.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN ADMIN MOBILE DASHBOARD - Mode Terrain CC2026
// ═══════════════════════════════════════════════════════════════
const AdminMobileDashboard = () => {
  const navigate = useNavigate();
  const [showScanner, setShowScanner] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [affluence, setAffluence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardLive, setDashboardLive] = useState(null);
  
  // Zone & role state
  const [selectedZone, setSelectedZone] = useState('ENTREE_GENERALE');
  const [staffRole, setStaffRole] = useState('staff_entree'); // staff_entree | staff_bar | staff_vip
  const [debitAmount, setDebitAmount] = useState(0);

  const ZONES = [
    { id: 'ENTREE_GENERALE', label: 'Entrée Générale', icon: '🚪' },
    { id: 'SCENE_PRINCIPALE', label: 'Scène Principale', icon: '🎵' },
    { id: 'VIP_LOUNGE', label: 'VIP Lounge', icon: '⭐' },
    { id: 'BACKSTAGE', label: 'Backstage', icon: '🎭' },
    { id: 'EXPOSANTS', label: 'Exposants', icon: '🏪' },
    { id: 'PRESSE', label: 'Presse', icon: '📰' },
    { id: 'ATELIERS_PREMIUM', label: 'Ateliers Premium', icon: '🎨' },
  ];

  const ROLES = [
    { id: 'staff_entree', label: 'Entrée', debit: 0 },
    { id: 'staff_bar', label: 'Bar / Food', debit: 0 },
    { id: 'staff_vip', label: 'VIP', debit: 0 },
  ];

  // Check admin role
  const getAdminSession = () => {
    try {
      const persistent = localStorage.getItem('cc2026_session');
      if (persistent) {
        const session = JSON.parse(persistent);
        if (session.createdAt && (Date.now() - session.createdAt) < 30 * 24 * 60 * 60 * 1000) {
          return session;
        }
      }
    } catch {}
    try {
      const temp = sessionStorage.getItem('workspace_user');
      if (temp) return JSON.parse(temp);
    } catch {}
    return {};
  };
  
  const session = getAdminSession();

  // Fetch affluence data
  const fetchAffluence = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/terrain/affluence`);
      if (res.ok) {
        const data = await res.json();
        setAffluence(data);
      }
    } catch (error) {
      console.error('Failed to fetch affluence:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch live dashboard
  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/v1/dashboard/cc2026/live`);
      if (res.ok) setDashboardLive(await res.json());
    } catch {}
  }, []);

  // Initial fetch + auto-refresh every 10 seconds
  useEffect(() => {
    fetchAffluence();
    fetchDashboard();
    const i1 = setInterval(fetchAffluence, 10000);
    const i2 = setInterval(fetchDashboard, 10000);
    return () => { clearInterval(i1); clearInterval(i2); };
  }, [fetchAffluence, fetchDashboard]);

  // Handle QR scan -> /api/scan/debit
  const handleScan = async (decodedText) => {
    setShowScanner(false);
    
    try {
      let badgeId = decodedText;
      try {
        const parsed = JSON.parse(decodedText);
        badgeId = parsed.id || parsed.badge_id || parsed.qr_token || decodedText;
      } catch {}

      // Use /api/scan/debit with zone + montant
      const isQrToken = badgeId.length === 32 && !badgeId.includes('-');
      const payload = {
        zone: selectedZone,
        montant: staffRole === 'staff_entree' ? 0 : debitAmount,
        agent_id: session.id || session.workspace || staffRole,
      };
      if (isQrToken) {
        payload.qr_token = badgeId;
      } else {
        payload.badge_id = badgeId;
      }

      const res = await fetch(`${API}/api/scan/debit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      setScanResult(data);

      if (data.color === 'green') {
        fetchAffluence();
        fetchDashboard();
      }
    } catch (error) {
      setScanResult({
        status: 'error', code: 'NETWORK_ERROR',
        message: 'Erreur de connexion', color: 'red'
      });
    }
  };

  const handleCloseResult = () => setScanResult(null);
  const handleRetry = () => { setScanResult(null); setShowScanner(true); };
  const handleRefresh = () => { setRefreshing(true); fetchAffluence(); fetchDashboard(); };
  const handleCheckinFromSearch = () => { fetchAffluence(); };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: COLORS.background }}>
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
      <header className="sticky top-0 z-30 px-4 py-4 safe-area-top" style={{ background: COLORS.background, borderBottom: `1px solid ${COLORS.border}` }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: COLORS.text }}>Mode Terrain</h1>
            <p className="text-sm" style={{ color: COLORS.textMuted }}>CC2026 · {ZONES.find(z => z.id === selectedZone)?.label}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* FREK Progress Mini */}
            {dashboardLive?.frek && (
              <div className="px-2 py-1 rounded-lg text-xs font-bold" style={{ background: `${COLORS.accent}20`, color: COLORS.accent }}>
                {dashboardLive.frek.total_ids}/{(dashboardLive.frek.target/1000).toFixed(0)}K
              </div>
            )}
            <button onClick={handleRefresh} className={`p-2 rounded-full ${refreshing ? 'animate-spin' : ''}`} style={{ background: COLORS.card }} disabled={refreshing}>
              <RefreshCw className="w-5 h-5" style={{ color: COLORS.textMuted }} />
            </button>
            <button onClick={() => navigate('/admin')} className="p-2 rounded-full" style={{ background: COLORS.card }}>
              <Home className="w-5 h-5" style={{ color: COLORS.textMuted }} />
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 space-y-4 pt-2">
        {/* Zone + Role Selector */}
        <div className="p-4 rounded-2xl" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
          <div className="flex items-center gap-2 mb-3">
            <Settings className="w-4 h-4" style={{ color: COLORS.terra }} />
            <span className="text-sm font-bold" style={{ color: COLORS.text }}>Configuration Scan</span>
          </div>
          {/* Zone selector */}
          <select
            data-testid="zone-selector"
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-sm mb-2"
            style={{ background: COLORS.background, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
          >
            {ZONES.map(z => <option key={z.id} value={z.id}>{z.icon} {z.label}</option>)}
          </select>
          {/* Role selector */}
          <div className="flex gap-2">
            {ROLES.map(r => (
              <button
                key={r.id}
                onClick={() => { setStaffRole(r.id); if (r.id === 'staff_entree') setDebitAmount(0); }}
                className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
                style={{
                  background: staffRole === r.id ? COLORS.terra : COLORS.background,
                  color: staffRole === r.id ? '#fff' : COLORS.textMuted,
                  border: `1px solid ${staffRole === r.id ? COLORS.terra : COLORS.border}`,
                }}
                data-testid={`role-${r.id}`}
              >
                {r.label}
              </button>
            ))}
          </div>
          {/* Debit amount for non-entree */}
          {staffRole !== 'staff_entree' && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs" style={{ color: COLORS.textMuted }}>Jetons:</span>
              <div className="flex gap-1">
                {[1, 2, 3, 5, 10].map(n => (
                  <button
                    key={n}
                    onClick={() => setDebitAmount(n)}
                    className="px-3 py-1 rounded-lg text-xs font-bold transition-all"
                    style={{
                      background: debitAmount === n ? COLORS.accent : COLORS.background,
                      color: debitAmount === n ? '#fff' : COLORS.textMuted,
                      border: `1px solid ${debitAmount === n ? COLORS.accent : COLORS.border}`,
                    }}
                    data-testid={`debit-${n}`}
                  >
                    {n}J
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Big Scanner Button */}
        <button
          onClick={() => setShowScanner(true)}
          className="w-full p-6 rounded-2xl flex items-center justify-center gap-4 transition-transform active:scale-98 shadow-lg"
          style={{ background: `linear-gradient(135deg, ${COLORS.terra}, ${COLORS.accent})` }}
          data-testid="scan-qr-button"
        >
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
            <QrCode className="w-10 h-10 text-white" />
          </div>
          <div className="text-left">
            <p className="text-xl font-bold text-white">
              {staffRole === 'staff_entree' ? 'Scanner Entrée' : `Scanner & Débiter ${debitAmount}J`}
            </p>
            <p className="text-sm text-white/80">Zone: {ZONES.find(z => z.id === selectedZone)?.label}</p>
          </div>
          <Camera className="w-8 h-8 text-white/60 ml-auto" />
        </button>

        {/* FREK Progress Widget */}
        {dashboardLive?.frek && (
          <div className="p-4 rounded-2xl" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5" style={{ color: COLORS.accent }} />
                <span className="font-bold text-sm" style={{ color: COLORS.text }}>Objectif 40K FREK-IDs</span>
              </div>
              <span className="text-xs px-2 py-1 rounded-lg font-bold" style={{ background: `${COLORS.accent}15`, color: COLORS.accent }}>
                {dashboardLive.frek.progress_pct}%
              </span>
            </div>
            <div className="h-3 rounded-full overflow-hidden mb-2" style={{ background: COLORS.background }}>
              <div className="h-full rounded-full transition-all duration-700" style={{
                width: `${Math.min(dashboardLive.frek.progress_pct, 100)}%`,
                background: `linear-gradient(90deg, ${COLORS.terra}, ${COLORS.accent})`
              }} />
            </div>
            <div className="flex justify-between text-xs" style={{ color: COLORS.textMuted }}>
              <span>{dashboardLive.frek.total_ids.toLocaleString()} IDs</span>
              <span>{dashboardLive.badges?.total || 0} badges · {dashboardLive.jetons?.total_circulation || 0} jetons</span>
            </div>
          </div>
        )}

        {/* Affluence Widget */}
        <AffluenceWidget data={affluence} onRefresh={handleRefresh} />

        {/* Quick Search */}
        <QuickSearch onCheckin={handleCheckinFromSearch} />

        {/* Last Scans */}
        <LastScans scans={affluence?.last_scans} />

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 pb-4">
          <button
            onClick={() => navigate('/admin')}
            className="p-4 rounded-xl flex items-center gap-3"
            style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
          >
            <Activity className="w-5 h-5" style={{ color: COLORS.accent }} />
            <span className="text-sm font-medium" style={{ color: COLORS.text }}>Dashboard</span>
          </button>
          <button
            onClick={() => {
              localStorage.removeItem('cc2026_session');
              sessionStorage.removeItem('workspace_user');
              navigate('/admin');
            }}
            className="p-4 rounded-xl flex items-center gap-3"
            style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
          >
            <LogOut className="w-5 h-5" style={{ color: COLORS.terra }} />
            <span className="text-sm font-medium" style={{ color: COLORS.text }}>Déconnexion</span>
          </button>
        </div>
      </main>

      {/* QR Scanner Modal */}
      <QRScanner 
        isActive={showScanner}
        onScan={handleScan}
        onClose={() => setShowScanner(false)}
      />

      {/* Scan Result Modal */}
      <ScanResultModal
        result={scanResult}
        onClose={handleCloseResult}
        onRetry={handleRetry}
      />
    </div>
  );
};

export default AdminMobileDashboard;
