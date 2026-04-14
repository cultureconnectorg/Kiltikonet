/**
 * SmartTracker — Native analytics hook for Kiltikonet
 * Tracks: page views, clicks, scroll depth, time on page, conversions, sessions
 * Zero external dependencies. Privacy-first (IP hashed server-side).
 */
const API = process.env.REACT_APP_BACKEND_URL;
const BATCH_INTERVAL = 10000; // Flush every 10s
const SESSION_KEY = 'kk_analytics_session';

let eventQueue = [];
let sessionId = null;
let pageEntryTime = null;
let maxScrollDepth = 0;
let flushTimer = null;

// Generate or retrieve session ID
function getSessionId() {
  if (sessionId) return sessionId;
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) { sessionId = stored; return sessionId; }
  } catch {}
  sessionId = `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  try { sessionStorage.setItem(SESSION_KEY, sessionId); } catch {}
  return sessionId;
}

// Queue an event
function trackEvent(type, data = {}) {
  eventQueue.push({
    type,
    page: window.location.pathname,
    timestamp: new Date().toISOString(),
    sessionId: getSessionId(),
    data,
  });
}

// Flush queued events to backend
async function flushEvents() {
  if (eventQueue.length === 0) return;
  const batch = [...eventQueue];
  eventQueue = [];
  try {
    await fetch(`${API}/api/analytics/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: batch }),
      keepalive: true,
    });
  } catch {
    // Re-queue on failure (up to 100)
    eventQueue = [...batch.slice(-50), ...eventQueue].slice(0, 100);
  }
}

// Track page view
function trackPageView() {
  pageEntryTime = Date.now();
  maxScrollDepth = 0;
  trackEvent('page_view', {
    referrer: document.referrer || '',
    title: document.title,
    screen: `${window.innerWidth}x${window.innerHeight}`,
  });
}

// Track scroll depth
function handleScroll() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  if (docHeight > 0) {
    const depth = Math.round((scrollTop / docHeight) * 100);
    if (depth > maxScrollDepth) maxScrollDepth = depth;
  }
}

// Track time on page when leaving
function handlePageExit() {
  if (pageEntryTime) {
    const timeSpent = Math.round((Date.now() - pageEntryTime) / 1000);
    trackEvent('page_exit', { time_seconds: timeSpent, scroll_depth: maxScrollDepth });
  }
  flushEvents();
}

// Track clicks on important elements
function handleClick(e) {
  const el = e.target.closest('[data-testid], a[href], button');
  if (!el) return;
  const testId = el.getAttribute('data-testid');
  const href = el.getAttribute('href');
  const text = el.textContent?.trim().slice(0, 50);
  if (testId || href) {
    trackEvent('click', {
      testid: testId || '',
      href: href || '',
      text: text || '',
      tag: el.tagName.toLowerCase(),
    });
  }
}

// Initialize tracker
export function initTracker() {
  if (typeof window === 'undefined') return;

  // Page view on load
  trackPageView();

  // Scroll tracking (throttled)
  let scrollTimeout;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(handleScroll, 200);
  }, { passive: true });

  // Click tracking
  document.addEventListener('click', handleClick, { passive: true, capture: true });

  // Page exit tracking
  window.addEventListener('beforeunload', handlePageExit);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') handlePageExit();
  });

  // Periodic flush
  flushTimer = setInterval(flushEvents, BATCH_INTERVAL);

  // Track route changes (SPA)
  let lastPath = window.location.pathname;
  const observer = new MutationObserver(() => {
    if (window.location.pathname !== lastPath) {
      // Flush old page data
      if (pageEntryTime) {
        const timeSpent = Math.round((Date.now() - pageEntryTime) / 1000);
        trackEvent('page_exit', { time_seconds: timeSpent, scroll_depth: maxScrollDepth, page: lastPath });
      }
      lastPath = window.location.pathname;
      trackPageView();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

// Manual tracking functions for conversions
export function trackConversion(name, value = {}) {
  trackEvent('conversion', { name, ...value });
}

export function trackSearch(query) {
  trackEvent('search', { query });
}

export function trackError(message, source = '') {
  trackEvent('error', { message, source });
}

export default { initTracker, trackConversion, trackSearch, trackError };
