/**
 * Smart Analytics Service - CC2026
 * Cerveau expert analyst qui track et analyse les comportements
 * 
 * Usage:
 * - Intro: Tracker les sections cliquées
 * - Admin: Tracking complet (pages, temps, actions)
 * - Pro: Recommandations + Matchmaking data
 */

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// Session ID unique pour le tracking
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('cc2026_analytics_session');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('cc2026_analytics_session', sessionId);
  }
  return sessionId;
};

// User ID si connecté
const getUserId = () => {
  try {
    const adminSession = JSON.parse(localStorage.getItem('cc2026_admin_session') || '{}');
    const proSession = JSON.parse(localStorage.getItem('cc2026_pro_session') || '{}');
    return adminSession.id || proSession.id || null;
  } catch {
    return null;
  }
};

// Device info
const getDeviceInfo = () => ({
  screen: `${window.innerWidth}x${window.innerHeight}`,
  userAgent: navigator.userAgent,
  language: navigator.language,
  platform: navigator.platform,
  isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
});

class SmartAnalytics {
  constructor() {
    this.queue = [];
    this.flushInterval = null;
    this.pageStartTime = Date.now();
    this.currentPage = window.location.pathname;
    this.interactions = [];
    this.initialized = false;
  }

  // Initialize analytics
  init() {
    if (this.initialized) return;
    this.initialized = true;

    // Track page views on navigation
    this.trackPageView(window.location.pathname);

    // Flush queue every 30 seconds
    this.flushInterval = setInterval(() => this.flush(), 30000);

    // Flush on page unload
    window.addEventListener('beforeunload', () => this.flush(true));

    // Track scroll depth
    this.initScrollTracking();

    console.log('[SmartAnalytics] Initialized');
  }

  // ═══════════════════════════════════════════════════════════════
  // INTRO TRACKING - Sections cliquées
  // ═══════════════════════════════════════════════════════════════
  trackIntroSection(section, metadata = {}) {
    this.track('intro_section_click', {
      section,
      ...metadata,
      timestamp: Date.now()
    });
  }

  trackIntroComplete(selectedLanguage) {
    this.track('intro_complete', {
      language: selectedLanguage,
      duration: Date.now() - this.pageStartTime
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // PAGE TRACKING - Navigation
  // ═══════════════════════════════════════════════════════════════
  trackPageView(path, title = document.title) {
    // Track time on previous page
    if (this.currentPage && this.currentPage !== path) {
      this.track('page_exit', {
        page: this.currentPage,
        timeSpent: Date.now() - this.pageStartTime,
        scrollDepth: this.maxScrollDepth || 0
      });
    }

    this.currentPage = path;
    this.pageStartTime = Date.now();
    this.maxScrollDepth = 0;
    this.interactions = [];

    this.track('page_view', {
      page: path,
      title,
      referrer: document.referrer,
      device: getDeviceInfo()
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // ADMIN TRACKING - Cerveau expert analyst
  // ═══════════════════════════════════════════════════════════════
  trackAdminAction(action, details = {}) {
    this.track('admin_action', {
      action,
      workspace: this.getCurrentWorkspace(),
      ...details,
      timestamp: Date.now()
    });
  }

  trackWorkspaceActivity(workspace, activity, data = {}) {
    this.track('workspace_activity', {
      workspace,
      activity,
      ...data,
      timestamp: Date.now()
    });
  }

  trackDataModification(entity, operation, entityId, changes = {}) {
    this.track('data_modification', {
      entity, // 'registration', 'opportunity', 'event', etc.
      operation, // 'create', 'update', 'delete'
      entityId,
      changes,
      timestamp: Date.now()
    });
  }

  // Track search/filter behavior
  trackSearch(query, filters, resultsCount) {
    this.track('search', {
      query,
      filters,
      resultsCount,
      page: this.currentPage
    });
  }

  // Track element clicks
  trackClick(elementId, elementType, metadata = {}) {
    this.interactions.push({ type: 'click', elementId, elementType, time: Date.now() });
    this.track('click', {
      elementId,
      elementType,
      page: this.currentPage,
      ...metadata
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // PRO SPACE TRACKING - Recommandations & Matchmaking
  // ═══════════════════════════════════════════════════════════════
  trackProProfileView(viewedProfileId, viewerProfileId) {
    this.track('pro_profile_view', {
      viewedProfileId,
      viewerProfileId,
      timestamp: Date.now()
    });
  }

  trackProConnection(fromProfileId, toProfileId, action) {
    this.track('pro_connection', {
      fromProfileId,
      toProfileId,
      action, // 'request', 'accept', 'reject'
      timestamp: Date.now()
    });
  }

  trackOpportunityInteraction(opportunityId, action, profileId) {
    this.track('opportunity_interaction', {
      opportunityId,
      action, // 'view', 'apply', 'save', 'share'
      profileId,
      timestamp: Date.now()
    });
  }

  trackEventInteraction(eventId, action, profileId) {
    this.track('event_interaction', {
      eventId,
      action, // 'view', 'register', 'unregister', 'share'
      profileId,
      timestamp: Date.now()
    });
  }

  trackMessageSent(fromId, toId, conversationId) {
    this.track('message_sent', {
      fromId,
      toId,
      conversationId,
      timestamp: Date.now()
    });
  }

  // Track profile matching interests
  trackMatchingSearch(profileId, searchCriteria, resultsCount) {
    this.track('matching_search', {
      profileId,
      criteria: searchCriteria,
      resultsCount,
      timestamp: Date.now()
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // SCROLL & TIME TRACKING
  // ═══════════════════════════════════════════════════════════════
  initScrollTracking() {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollTop = window.scrollY;
          const docHeight = document.documentElement.scrollHeight - window.innerHeight;
          const scrollPercent = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;
          this.maxScrollDepth = Math.max(this.maxScrollDepth || 0, scrollPercent);
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // ANOMALY DETECTION
  // ═══════════════════════════════════════════════════════════════
  trackAnomaly(type, details) {
    this.track('anomaly', {
      type, // 'rapid_actions', 'unusual_pattern', 'error_spike', etc.
      details,
      severity: this.calculateSeverity(type),
      timestamp: Date.now()
    }, true); // immediate flush
  }

  calculateSeverity(type) {
    const severityMap = {
      'rapid_actions': 'low',
      'unusual_pattern': 'medium',
      'error_spike': 'high',
      'security_concern': 'critical'
    };
    return severityMap[type] || 'medium';
  }

  // ═══════════════════════════════════════════════════════════════
  // CORE TRACKING
  // ═══════════════════════════════════════════════════════════════
  track(eventType, data, immediate = false) {
    const event = {
      eventType,
      sessionId: getSessionId(),
      userId: getUserId(),
      timestamp: new Date().toISOString(),
      data
    };

    this.queue.push(event);

    // Immediate flush for important events
    if (immediate || this.queue.length >= 20) {
      this.flush();
    }
  }

  async flush(sync = false) {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    try {
      if (sync && navigator.sendBeacon) {
        // Use sendBeacon for reliable delivery on page unload
        navigator.sendBeacon(
          `${API_URL}/api/analytics/batch`,
          JSON.stringify({ events })
        );
      } else {
        await fetch(`${API_URL}/api/analytics/batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ events })
        });
      }
    } catch (error) {
      console.warn('[SmartAnalytics] Failed to flush:', error);
      // Re-queue failed events
      this.queue = [...events, ...this.queue];
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════
  getCurrentWorkspace() {
    const path = window.location.pathname;
    const match = path.match(/\/workspace\/([^/]+)/);
    return match ? match[1] : null;
  }

  // Destroy instance
  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flush(true);
  }
}

// Singleton instance
const smartAnalytics = new SmartAnalytics();

export default smartAnalytics;
export { SmartAnalytics };
