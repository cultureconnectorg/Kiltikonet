/**
 * Smart Engine Service - Tracking comportemental & notifications automatiques
 * Culture Connect 2026
 */

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Session tracking
let sessionId = null;
let userId = null;
let eventBuffer = [];
let flushTimeout = null;

// Initialize session
export const initSession = (user = null) => {
  sessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  if (user) {
    userId = user.id || user.email || user.name;
  }
  
  // Start periodic flush
  startPeriodicFlush();
  
  // Track page visibility changes
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // Track before unload to flush remaining events
  window.addEventListener('beforeunload', flushEvents);
  
  return sessionId;
};

// Set current user
export const setUser = (user) => {
  userId = user?.id || user?.email || user?.name || null;
};

// Track generic event
export const trackEvent = (eventType, data = {}) => {
  const event = {
    eventType,
    sessionId: sessionId || initSession(),
    userId,
    timestamp: new Date().toISOString(),
    data: {
      ...data,
      url: window.location.pathname,
      referrer: document.referrer,
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      userAgent: navigator.userAgent
    }
  };
  
  eventBuffer.push(event);
  
  // Flush immediately for important events
  if (['error', 'anomaly', 'critical_action'].includes(eventType)) {
    flushEvents();
  }
};

// Track page view
export const trackPageView = (page, additionalData = {}) => {
  trackEvent('page_view', {
    page,
    title: document.title,
    ...additionalData
  });
};

// Track user action
export const trackAction = (action, category, data = {}) => {
  trackEvent('user_action', {
    action,
    category,
    ...data
  });
};

// Track admin action
export const trackAdminAction = (action, workspace, details = {}) => {
  trackEvent('admin_action', {
    action,
    workspace,
    ...details
  });
};

// Track data modification
export const trackDataModification = (operation, entity, entityId, changes = {}) => {
  trackEvent('data_modification', {
    operation, // create, update, delete
    entity,    // registration, opportunity, contact, etc.
    entityId,
    changes
  });
};

// Track error
export const trackError = (error, context = {}) => {
  trackEvent('error', {
    message: error.message || String(error),
    stack: error.stack,
    ...context
  });
};

// Track anomaly (for smart engine alerts)
export const trackAnomaly = (type, severity, details = {}) => {
  trackEvent('anomaly', {
    type,        // traffic_spike, unusual_activity, security, performance
    severity,    // low, medium, high, critical
    details
  });
};

// Track Pro space interactions
export const trackProInteraction = (type, data = {}) => {
  trackEvent(`pro_${type}`, data);
};

// Track opportunity interaction
export const trackOpportunityInteraction = (opportunityId, action, data = {}) => {
  trackEvent('opportunity_interaction', {
    opportunityId,
    action, // view, apply, save, share
    ...data
  });
};

// Track profile view
export const trackProfileView = (viewedProfileId, data = {}) => {
  trackEvent('pro_profile_view', {
    viewedProfileId,
    ...data
  });
};

// Track connection
export const trackConnection = (targetProfileId, action, data = {}) => {
  trackEvent('pro_connection', {
    targetProfileId,
    action, // request, accept, reject
    ...data
  });
};

// Track search/matching
export const trackSearch = (criteria, resultCount, data = {}) => {
  trackEvent('matching_search', {
    criteria,
    resultCount,
    ...data
  });
};

// Track workspace activity
export const trackWorkspaceActivity = (workspace, action, details = {}) => {
  trackEvent('workspace_activity', {
    workspace,
    action,
    ...details
  });
};

// Track task completion
export const trackTaskCompletion = (taskId, taskTitle, workspace, data = {}) => {
  trackEvent('task_completion', {
    taskId,
    taskTitle,
    workspace,
    ...data
  });
};

// Track notification interaction
export const trackNotificationInteraction = (notificationId, action, data = {}) => {
  trackEvent('notification_interaction', {
    notificationId,
    action, // view, click, dismiss
    ...data
  });
};

// Flush events to backend
const flushEvents = async () => {
  if (eventBuffer.length === 0) return;
  
  const eventsToSend = [...eventBuffer];
  eventBuffer = [];
  
  try {
    await fetch(`${API}/analytics/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: eventsToSend }),
      keepalive: true // Allows sending even when page is closing
    });
  } catch (error) {
    console.error('Failed to send analytics:', error);
    // Re-add events to buffer for retry
    eventBuffer = [...eventsToSend, ...eventBuffer].slice(0, 100);
  }
};

// Start periodic flush (every 10 seconds)
const startPeriodicFlush = () => {
  if (flushTimeout) clearInterval(flushTimeout);
  flushTimeout = setInterval(flushEvents, 10000);
};

// Handle visibility change
const handleVisibilityChange = () => {
  if (document.visibilityState === 'hidden') {
    flushEvents();
  }
};

// Get session info
export const getSessionInfo = () => ({
  sessionId,
  userId,
  pendingEvents: eventBuffer.length
});

// Anomaly Detection Helpers
export const detectTrafficAnomaly = (currentCount, historicalAverage) => {
  const threshold = historicalAverage * 2; // 200% of normal
  if (currentCount > threshold) {
    trackAnomaly('traffic_spike', 'medium', {
      current: currentCount,
      average: historicalAverage,
      ratio: (currentCount / historicalAverage).toFixed(2)
    });
    return true;
  }
  return false;
};

export const detectUnusualActivity = (action, frequency, normalFrequency) => {
  if (frequency > normalFrequency * 3) {
    trackAnomaly('unusual_activity', 'high', {
      action,
      frequency,
      normalFrequency
    });
    return true;
  }
  return false;
};

// Performance tracking
export const trackPerformance = (metric, value, context = {}) => {
  trackEvent('performance', {
    metric, // page_load, api_response, render_time
    value,
    ...context
  });
};

// Export for use in components
export default {
  initSession,
  setUser,
  trackEvent,
  trackPageView,
  trackAction,
  trackAdminAction,
  trackDataModification,
  trackError,
  trackAnomaly,
  trackProInteraction,
  trackOpportunityInteraction,
  trackProfileView,
  trackConnection,
  trackSearch,
  trackWorkspaceActivity,
  trackTaskCompletion,
  trackNotificationInteraction,
  trackPerformance,
  getSessionInfo
};
