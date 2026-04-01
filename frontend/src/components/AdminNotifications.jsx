import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Bell, BellRing, X, CheckCheck, CreditCard, BadgeCheck, AlertTriangle, TestTube } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const WS_URL = `${process.env.REACT_APP_BACKEND_URL}`.replace('https://', 'wss://').replace('http://', 'ws://');

const CATEGORY_CONFIG = {
  payment: { icon: CreditCard, color: '#2ECC71', bg: 'bg-green-900/20', label: 'Paiement' },
  badge: { icon: BadgeCheck, color: '#3498DB', bg: 'bg-blue-900/20', label: 'Badge' },
  system: { icon: AlertTriangle, color: '#E67E22', bg: 'bg-orange-900/20', label: 'Systeme' },
};

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);
  const panelRef = useRef(null);
  const reconnectRef = useRef(null);

  // Fetch history on mount
  const fetchHistory = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/admin/notifications?limit=30`);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  // WebSocket connection
  const connectWS = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;
    try {
      const ws = new WebSocket(`${WS_URL}/api/ws/sync`);
      ws.onopen = () => {
        setConnected(true);
        ws.send(JSON.stringify({ action: 'subscribe', channels: ['admin_notifications'] }));
      };
      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          if (msg.event_type === 'admin_notification' && msg.data) {
            const notif = msg.data;
            setNotifications(prev => [notif, ...prev].slice(0, 50));
            setUnreadCount(prev => prev + 1);
            // Sound pulse
            try { new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH+Jj4yHfXJnX2V0gIuRkIyDd2xkYnCBi5OTjoV6bmNibnuHj5GPiYB1aWJocH2Ij5KQiH91aGVqcnyGjJCPiYF4cGxucXqCh4uNi4eDfXdzcnR4fYGFh4eGhIN/fHt7fH2AgYODg4KBf358e3t7fH6AgYKCgoGAf358e3t7fH6AgYKCgoF/f358e3t8fX+AgIGBgYB/fn18fHx9fn+AgIGBgH9+fXx8fH1+f4CAgICAfn59fHx8fX5/gICAgH9+fX18fH1+f4B/f39/fn59fXx8fX5+f39/f35+fX19fX1+fn9/f39+fn19fX19fn5/f39/fn5+fX19fX5+f39/fn5+fn19fX5+fn9/fn5+fn59fX5+fn5/fn5+fn5+fX5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+').play().catch(() => {}); } catch { /* silent */ }
          }
        } catch { /* parse error */ }
      };
      ws.onclose = () => {
        setConnected(false);
        reconnectRef.current = setTimeout(connectWS, 3000);
      };
      ws.onerror = () => { ws.close(); };
      wsRef.current = ws;
    } catch { setConnected(false); }
  }, []);

  useEffect(() => {
    connectWS();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
    };
  }, [connectWS]);

  // Close panel on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const markAllRead = async () => {
    try {
      await axios.post(`${API}/admin/notifications/read-all`);
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch { /* silent */ }
  };

  const sendTest = async () => {
    try {
      await axios.post(`${API}/admin/notifications/test`);
    } catch { /* silent */ }
  };

  const timeAgo = (ts) => {
    if (!ts) return '';
    const diff = (Date.now() - new Date(ts).getTime()) / 1000;
    if (diff < 60) return 'maintenant';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}j`;
  };

  return (
    <div ref={panelRef} className="relative" data-testid="admin-notifications">
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
        data-testid="notifications-bell"
      >
        {unreadCount > 0 ? (
          <BellRing size={18} className="text-[#FFD700] animate-pulse" />
        ) : (
          <Bell size={18} className="text-[#888]" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        <span className={`absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
      </button>

      {/* Panel */}
      {open && (
        <div
          className="absolute right-0 top-12 w-80 max-h-[480px] bg-[#1A1A1A] border border-[#333] rounded-lg shadow-2xl z-50 flex flex-col overflow-hidden"
          data-testid="notifications-panel"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#222]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#F4F1EA] uppercase tracking-wider">Notifications</span>
              {unreadCount > 0 && <span className="text-[9px] bg-red-500/20 text-red-400 px-1.5 rounded">{unreadCount}</span>}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={sendTest} className="p-1 rounded hover:bg-white/10 text-[#555] hover:text-[#F4F1EA] transition-colors" title="Envoyer test" data-testid="notifications-test">
                <TestTube size={12} />
              </button>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="p-1 rounded hover:bg-white/10 text-[#555] hover:text-[#2ECC71] transition-colors" title="Tout marquer lu" data-testid="notifications-mark-read">
                  <CheckCheck size={12} />
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-white/10 text-[#555] hover:text-[#F4F1EA]">
                <X size={12} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-[#444]">
                <Bell size={28} className="mb-2 opacity-30" />
                <p className="text-xs">Aucune notification</p>
              </div>
            ) : (
              notifications.map((n, i) => {
                const cfg = CATEGORY_CONFIG[n.category] || CATEGORY_CONFIG.system;
                const Icon = cfg.icon;
                return (
                  <div
                    key={`${n.timestamp}-${i}`}
                    className={`px-3 py-2.5 border-b border-[#1a1a1a] hover:bg-white/5 transition-colors ${!n.read ? 'bg-[#FFD700]/5' : ''}`}
                    data-testid={`notification-item-${i}`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={`p-1.5 rounded ${cfg.bg} flex-shrink-0 mt-0.5`}>
                        <Icon size={12} style={{ color: cfg.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-semibold text-[#F4F1EA]">{n.title}</span>
                          <span className="text-[9px] text-[#555] flex-shrink-0">{timeAgo(n.timestamp)}</span>
                        </div>
                        <p className="text-[10px] text-[#888] mt-0.5 truncate">{n.message}</p>
                      </div>
                      {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-[#FFD700] flex-shrink-0 mt-2" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-3 py-1.5 border-t border-[#222] flex items-center justify-between">
            <span className="text-[8px] text-[#444]">
              {connected ? 'Temps reel actif' : 'Reconnexion...'}
            </span>
            <span className="text-[8px] text-[#444]">{notifications.length} notification{notifications.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotifications;
