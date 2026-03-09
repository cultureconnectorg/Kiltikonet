/**
 * useAnalytics Hook - CC2026
 * Hook React pour le tracking comportemental
 */

import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import smartAnalytics from '../services/SmartAnalytics';

// Initialize analytics on first load
let analyticsInitialized = false;

export const useAnalytics = (options = {}) => {
  const location = useLocation();
  const prevPath = useRef(location.pathname);

  // Initialize analytics once
  useEffect(() => {
    if (!analyticsInitialized) {
      smartAnalytics.init();
      analyticsInitialized = true;
    }
  }, []);

  // Track page views on navigation
  useEffect(() => {
    if (prevPath.current !== location.pathname) {
      smartAnalytics.trackPageView(location.pathname);
      prevPath.current = location.pathname;
    }
  }, [location.pathname]);

  // ═══════════════════════════════════════════════════════════════
  // INTRO TRACKING
  // ═══════════════════════════════════════════════════════════════
  const trackIntroSection = useCallback((section, metadata = {}) => {
    smartAnalytics.trackIntroSection(section, metadata);
  }, []);

  const trackIntroComplete = useCallback((language) => {
    smartAnalytics.trackIntroComplete(language);
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // ADMIN TRACKING
  // ═══════════════════════════════════════════════════════════════
  const trackAdminAction = useCallback((action, details = {}) => {
    smartAnalytics.trackAdminAction(action, details);
  }, []);

  const trackWorkspaceActivity = useCallback((workspace, activity, data = {}) => {
    smartAnalytics.trackWorkspaceActivity(workspace, activity, data);
  }, []);

  const trackDataModification = useCallback((entity, operation, entityId, changes = {}) => {
    smartAnalytics.trackDataModification(entity, operation, entityId, changes);
  }, []);

  const trackSearch = useCallback((query, filters, resultsCount) => {
    smartAnalytics.trackSearch(query, filters, resultsCount);
  }, []);

  const trackClick = useCallback((elementId, elementType, metadata = {}) => {
    smartAnalytics.trackClick(elementId, elementType, metadata);
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // PRO SPACE TRACKING
  // ═══════════════════════════════════════════════════════════════
  const trackProProfileView = useCallback((viewedProfileId, viewerProfileId) => {
    smartAnalytics.trackProProfileView(viewedProfileId, viewerProfileId);
  }, []);

  const trackProConnection = useCallback((fromProfileId, toProfileId, action) => {
    smartAnalytics.trackProConnection(fromProfileId, toProfileId, action);
  }, []);

  const trackOpportunityInteraction = useCallback((opportunityId, action, profileId) => {
    smartAnalytics.trackOpportunityInteraction(opportunityId, action, profileId);
  }, []);

  const trackEventInteraction = useCallback((eventId, action, profileId) => {
    smartAnalytics.trackEventInteraction(eventId, action, profileId);
  }, []);

  const trackMessageSent = useCallback((fromId, toId, conversationId) => {
    smartAnalytics.trackMessageSent(fromId, toId, conversationId);
  }, []);

  const trackMatchingSearch = useCallback((profileId, searchCriteria, resultsCount) => {
    smartAnalytics.trackMatchingSearch(profileId, searchCriteria, resultsCount);
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // ANOMALY TRACKING
  // ═══════════════════════════════════════════════════════════════
  const trackAnomaly = useCallback((type, details) => {
    smartAnalytics.trackAnomaly(type, details);
  }, []);

  return {
    // Intro
    trackIntroSection,
    trackIntroComplete,
    // Admin
    trackAdminAction,
    trackWorkspaceActivity,
    trackDataModification,
    trackSearch,
    trackClick,
    // Pro Space
    trackProProfileView,
    trackProConnection,
    trackOpportunityInteraction,
    trackEventInteraction,
    trackMessageSent,
    trackMatchingSearch,
    // Anomaly
    trackAnomaly
  };
};

// HOC for class components
export const withAnalytics = (Component) => {
  return function WrappedComponent(props) {
    const analytics = useAnalytics();
    return <Component {...props} analytics={analytics} />;
  };
};

export default useAnalytics;
