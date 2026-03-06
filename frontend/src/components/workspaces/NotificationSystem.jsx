import React, { useState, useEffect, useCallback } from 'react';
import { Bell, X, CheckCircle, Music, DollarSign, Newspaper, Radio, Users, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const COLORS = {
  charbon: '#1C1A14',
  terracotta: '#C4714A',
  gold: '#D4A84B',
  forest: '#4A5D4E',
  burgundy: '#8B1A4A',
  teal: '#00BCD4'
};

// Notification type icons and colors
const NOTIFICATION_TYPES = {
  artiste_confirmed: { icon: Music, color: COLORS.forest, label: 'Artiste' },
  expense_added: { icon: DollarSign, color: '#4CAF50', label: 'Finance' },
  communique_sent: { icon: Newspaper, color: COLORS.teal, label: 'Presse' },
  live_active: { icon: Radio, color: '#9C27B0', label: 'Live' },
  partner_added: { icon: Users, color: COLORS.terracotta, label: 'Partenaire' },
  brief_assigned: { icon: AlertCircle, color: COLORS.gold, label: 'Brief' },
  document_uploaded: { icon: CheckCircle, color: COLORS.burgundy, label: 'Document' },
  default: { icon: Bell, color: COLORS.gold, label: 'Notification' }
};

// Hook to send notifications
export const useSendNotification = () => {
  const sendNotification = useCallback(async ({ sender, senderRole, type, title, message, target = 'laurent', data = null }) => {
    try {
      await axios.post(`${API}/notifications/send`, {
        sender,
        sender_role: senderRole,
        type,
        title,
        message,
        target,
        data
      });
      return true;
    } catch (error) {
      console.error('Failed to send notification:', error);
      return false;
    }
  }, []);

  return sendNotification;
};

// Hook to receive notifications
export const useNotifications = (target, pollInterval = 5000) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/notifications/${target}?limit=20`);
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unread_count || 0);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [target]);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      await axios.patch(`${API}/notifications/${notificationId}/read`);
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await axios.patch(`${API}/notifications/${target}/read-all`);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, [target]);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, pollInterval);
    return () => clearInterval(interval);
  }, [loadNotifications, pollInterval]);

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead, refresh: loadNotifications };
};

// Notification Bell Component (for header)
export const NotificationBell = ({ target = 'laurent' }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(target, 3000);
  const [isOpen, setIsOpen] = useState(false);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'À l\'instant';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}min`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg transition-all hover:bg-white/10"
        data-testid="notification-bell"
      >
        <Bell className="w-5 h-5" style={{ color: unreadCount > 0 ? COLORS.gold : 'rgba(255,255,255,0.5)' }} />
        {unreadCount > 0 && (
          <span 
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: COLORS.burgundy, color: '#fff' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div 
            className="absolute right-0 top-full mt-2 w-80 rounded-xl overflow-hidden z-50 shadow-2xl"
            style={{ background: '#2A2820', border: `1px solid ${COLORS.gold}30` }}
          >
            {/* Header */}
            <div className="p-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${COLORS.gold}20` }}>
              <span className="text-sm font-bold" style={{ color: COLORS.gold }}>Notifications</span>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-xs hover:underline"
                  style={{ color: COLORS.terracotta }}
                >
                  Tout marquer lu
                </button>
              )}
            </div>

            {/* Notifications list */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  Aucune notification
                </div>
              ) : (
                notifications.map(notif => {
                  const typeConfig = NOTIFICATION_TYPES[notif.type] || NOTIFICATION_TYPES.default;
                  const IconComponent = typeConfig.icon;
                  
                  return (
                    <div
                      key={notif.id}
                      onClick={() => !notif.read && markAsRead(notif.id)}
                      className="p-3 cursor-pointer transition-all hover:bg-white/5"
                      style={{ 
                        background: notif.read ? 'transparent' : `${typeConfig.color}10`,
                        borderBottom: '1px solid rgba(255,255,255,0.05)'
                      }}
                    >
                      <div className="flex gap-3">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                          style={{ background: `${typeConfig.color}20` }}
                        >
                          <IconComponent className="w-4 h-4" style={{ color: typeConfig.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white truncate">{notif.title}</span>
                            {!notif.read && (
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: typeConfig.color }} />
                            )}
                          </div>
                          <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                            {notif.message}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs" style={{ color: typeConfig.color }}>{notif.sender}</span>
                            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>•</span>
                            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{formatTime(notif.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Notification Toast Component (for real-time popups)
export const NotificationToast = ({ notification, onClose }) => {
  const typeConfig = NOTIFICATION_TYPES[notification.type] || NOTIFICATION_TYPES.default;
  const IconComponent = typeConfig.icon;

  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div 
      className="fixed bottom-4 right-4 w-80 rounded-xl p-4 shadow-2xl animate-slide-in z-50"
      style={{ background: '#2A2820', border: `1px solid ${typeConfig.color}50` }}
    >
      <div className="flex gap-3">
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ background: `${typeConfig.color}20` }}
        >
          <IconComponent className="w-5 h-5" style={{ color: typeConfig.color }} />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-white">{notification.title}</span>
            <button onClick={onClose} className="text-white/30 hover:text-white/60">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {notification.message}
          </p>
          <span className="text-xs mt-1 block" style={{ color: typeConfig.color }}>
            {notification.sender}
          </span>
        </div>
      </div>
    </div>
  );
};

export default NotificationBell;
