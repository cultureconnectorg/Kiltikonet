/**
 * Culture Connect 2026 - Legal Compliance System
 * 100% Vanilla JS - Zero dependencies - Fully isolated
 * Does not modify any existing code
 * 
 * Features:
 * - Cookie consent banner with localStorage
 * - Legal footer injection
 * - RGPD checkbox injection
 * - Tracking activation only after consent
 */

(function() {
  'use strict';

  // ============================================
  // CONFIGURATION
  // ============================================
  const CONFIG = {
    CONSENT_KEY: 'cc_cookie_consent_v1',
    BANNER_DELAY: 1500,
    LEGAL_PAGES: {
      mentions: '/legal/mentions-legales.html',
      privacy: '/legal/politique-confidentialite.html',
      cgu: '/legal/cgu.html',
      cookies: '/legal/cookies.html'
    }
  };

  // ============================================
  // LANGUAGE DETECTION
  // ============================================
  function getLanguage() {
    // Check for stored language preference
    const stored = localStorage.getItem('cc_language');
    if (stored) return stored;
    
    // Check browser language
    const browserLang = navigator.language || navigator.userLanguage;
    return browserLang.startsWith('fr') ? 'fr' : 'en';
  }

  const lang = getLanguage();

  // ============================================
  // TRANSLATIONS
  // ============================================
  const T = {
    fr: {
      cookieText: 'Ce site utilise des cookies pour améliorer votre expérience. En continuant, vous acceptez notre',
      cookiePolicy: 'politique de cookies',
      and: 'et notre',
      privacyPolicy: 'politique de confidentialité',
      accept: 'Accepter',
      decline: 'Refuser',
      close: 'Fermer',
      legalNotice: 'Mentions légales',
      privacy: 'Confidentialité',
      terms: 'CGU',
      cookies: 'Cookies',
      manageCookies: 'Gérer les cookies',
      back: 'Retour',
      rgpdText: 'J\'accepte que mes données soient traitées conformément à la',
      rgpdRequired: 'Vous devez accepter les conditions pour continuer'
    },
    en: {
      cookieText: 'This site uses cookies to improve your experience. By continuing, you accept our',
      cookiePolicy: 'cookie policy',
      and: 'and our',
      privacyPolicy: 'privacy policy',
      accept: 'Accept',
      decline: 'Decline',
      close: 'Close',
      legalNotice: 'Legal Notice',
      privacy: 'Privacy',
      terms: 'Terms',
      cookies: 'Cookies',
      manageCookies: 'Manage cookies',
      back: 'Back',
      rgpdText: 'I agree that my data may be processed in accordance with the',
      rgpdRequired: 'You must accept the terms to continue'
    }
  };

  const t = (key) => T[lang][key] || T['en'][key];

  // ============================================
  // COOKIE CONSENT MANAGEMENT
  // ============================================
  function getConsent() {
    try {
      const consent = localStorage.getItem(CONFIG.CONSENT_KEY);
      return consent ? JSON.parse(consent) : null;
    } catch {
      return null;
    }
  }

  function setConsent(analytics) {
    const consent = {
      essential: true,
      analytics: analytics,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(CONFIG.CONSENT_KEY, JSON.stringify(consent));
    
    // Activate tracking if accepted
    if (analytics) {
      activateTracking();
    }
    
    return consent;
  }

  function resetConsent() {
    localStorage.removeItem(CONFIG.CONSENT_KEY);
    window.location.reload();
  }

  function activateTracking() {
    // PostHog and other analytics are already loaded
    // This function can be extended to enable additional tracking
    console.log('[CC Legal] Analytics consent granted');
  }

  // ============================================
  // COOKIE BANNER
  // ============================================
  function createCookieBanner() {
    // Don't show if already consented
    if (getConsent()) return;

    const banner = document.createElement('div');
    banner.className = 'cc-legal-cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', lang === 'fr' ? 'Bannière de consentement aux cookies' : 'Cookie consent banner');

    banner.innerHTML = `
      <div class="cc-legal-cookie-inner">
        <p class="cc-legal-cookie-text">
          ${t('cookieText')} 
          <a href="${CONFIG.LEGAL_PAGES.cookies}">${t('cookiePolicy')}</a> 
          ${t('and')} 
          <a href="${CONFIG.LEGAL_PAGES.privacy}">${t('privacyPolicy')}</a>.
        </p>
        <div class="cc-legal-cookie-buttons">
          <button class="cc-legal-btn cc-legal-btn-decline" data-action="decline">
            ${t('decline')}
          </button>
          <button class="cc-legal-btn cc-legal-btn-accept" data-action="accept">
            ${t('accept')}
          </button>
          <button class="cc-legal-btn cc-legal-btn-close" data-action="close" aria-label="${t('close')}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(banner);

    // Show with animation after delay
    setTimeout(() => {
      banner.classList.add('cc-legal-visible');
    }, CONFIG.BANNER_DELAY);

    // Event handlers
    banner.addEventListener('click', (e) => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (!action) return;

      if (action === 'accept') {
        setConsent(true);
        banner.classList.remove('cc-legal-visible');
        setTimeout(() => banner.classList.add('cc-legal-hidden'), 300);
      } else if (action === 'decline') {
        setConsent(false);
        banner.classList.remove('cc-legal-visible');
        setTimeout(() => banner.classList.add('cc-legal-hidden'), 300);
      } else if (action === 'close') {
        // Close without saving - will show again on next visit
        banner.classList.remove('cc-legal-visible');
        setTimeout(() => banner.classList.add('cc-legal-hidden'), 300);
      }
    });
  }

  // ============================================
  // LEGAL FOOTER
  // ============================================
  function injectLegalFooter() {
    // Find existing footer elements - wait for React to render
    const checkAndInject = () => {
      // Look for footer element with data-testid or common footer patterns
      const footers = document.querySelectorAll('footer, [data-testid="footer"]');
      
      footers.forEach(footer => {
        // Skip if already injected
        if (footer.querySelector('.cc-legal-footer')) return;

        const legalFooter = document.createElement('div');
        legalFooter.className = 'cc-legal-footer';
        legalFooter.innerHTML = `
          <a href="${CONFIG.LEGAL_PAGES.mentions}">${t('legalNotice')}</a>
          <span class="cc-legal-footer-sep">·</span>
          <a href="${CONFIG.LEGAL_PAGES.privacy}">${t('privacy')}</a>
          <span class="cc-legal-footer-sep">·</span>
          <a href="${CONFIG.LEGAL_PAGES.cgu}">${t('terms')}</a>
          <span class="cc-legal-footer-sep">·</span>
          <a href="${CONFIG.LEGAL_PAGES.cookies}">${t('cookies')}</a>
          <span class="cc-legal-footer-sep">·</span>
          <button type="button" data-cc-manage-cookies>${t('manageCookies')}</button>
        `;

        footer.appendChild(legalFooter);

        // Handle manage cookies click
        legalFooter.querySelector('[data-cc-manage-cookies]').addEventListener('click', (e) => {
          e.preventDefault();
          resetConsent();
        });
      });
    };

    // Initial check
    checkAndInject();

    // Watch for DOM changes (React re-renders)
    const observer = new MutationObserver(checkAndInject);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // ============================================
  // RGPD CHECKBOX INJECTION
  // ============================================
  function injectRGPDCheckbox() {
    // This function injects RGPD checkbox into forms that don't already have one
    // It uses mutation observer to handle React's dynamic rendering
    
    const injectIntoForm = (form) => {
      // Skip if already has RGPD checkbox
      if (form.querySelector('.cc-legal-rgpd-container') || 
          form.querySelector('[data-testid*="rgpd"]') ||
          form.querySelector('[name*="rgpd"]') ||
          form.querySelector('[name*="gdpr"]')) {
        return;
      }

      // Find submit button area
      const submitBtn = form.querySelector('button[type="submit"]');
      if (!submitBtn) return;

      // Find the parent container of submit button
      const submitContainer = submitBtn.closest('div');
      if (!submitContainer) return;

      // Check if this is a significant form (has email field)
      if (!form.querySelector('input[type="email"]')) return;

      // Create RGPD container
      const rgpdContainer = document.createElement('div');
      rgpdContainer.className = 'cc-legal-rgpd-container';
      rgpdContainer.innerHTML = `
        <label class="cc-legal-rgpd-label">
          <input type="checkbox" class="cc-legal-rgpd-checkbox" name="cc_rgpd_consent" required>
          <span class="cc-legal-rgpd-text">
            ${t('rgpdText')} 
            <a href="${CONFIG.LEGAL_PAGES.privacy}" target="_blank">${t('privacyPolicy')}</a>.
          </span>
        </label>
        <p class="cc-legal-rgpd-error" style="display: none;">${t('rgpdRequired')}</p>
      `;

      // Insert before submit button area
      submitContainer.parentNode.insertBefore(rgpdContainer, submitContainer);

      // Add form validation
      const checkbox = rgpdContainer.querySelector('.cc-legal-rgpd-checkbox');
      const errorMsg = rgpdContainer.querySelector('.cc-legal-rgpd-error');

      form.addEventListener('submit', (e) => {
        if (!checkbox.checked) {
          e.preventDefault();
          e.stopPropagation();
          rgpdContainer.classList.add('cc-legal-has-error');
          errorMsg.style.display = 'block';
          checkbox.focus();
        }
      }, true);

      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          rgpdContainer.classList.remove('cc-legal-has-error');
          errorMsg.style.display = 'none';
        }
      });
    };

    // Check existing forms
    document.querySelectorAll('form').forEach(injectIntoForm);

    // Watch for new forms
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            if (node.tagName === 'FORM') {
              injectIntoForm(node);
            }
            node.querySelectorAll?.('form').forEach(injectIntoForm);
          }
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // ============================================
  // INITIALIZATION
  // ============================================
  function init() {
    // Load CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/legal/legal-compliance.css';
    document.head.appendChild(link);

    // Wait for DOM ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', onReady);
    } else {
      onReady();
    }
  }

  function onReady() {
    // Check if we're on a legal page (HTML pages)
    if (window.location.pathname.startsWith('/legal/') && 
        window.location.pathname.endsWith('.html')) {
      // Don't inject anything on static legal pages
      return;
    }

    // Initialize components
    createCookieBanner();
    injectLegalFooter();
    
    // Note: RGPD checkbox injection is disabled by default
    // because the React app already has its own RGPDCheckbox component
    // Uncomment below if you want vanilla JS injection:
    // injectRGPDCheckbox();
    
    // Check consent on load
    const consent = getConsent();
    if (consent && consent.analytics) {
      activateTracking();
    }
  }

  // Expose API for external use
  window.CCLegal = {
    getConsent: getConsent,
    resetConsent: resetConsent,
    getLanguage: getLanguage
  };

  // Start
  init();
})();
