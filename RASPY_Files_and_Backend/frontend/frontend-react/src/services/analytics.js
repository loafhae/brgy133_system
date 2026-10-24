/**
 * Privacy-Preserving, Consent-Aware Analytics Service
 * 
 * Complies with:
 * - Republic Act No. 10173 (Philippine Data Privacy Act of 2012)
 * - ePrivacy & GDPR privacy-by-design standards
 * - Browser Do-Not-Track (DNT) / Global Privacy Control (GPC) signals
 * 
 * Features:
 * - Zero Personally Identifiable Information (PII) collection
 * - Zero third-party cross-site trackers
 * - Strict opt-in requirement via Cookie Consent
 * - Automatically redacts query strings and sensitive parameters
 */

const STORAGE_CONSENT_KEY = 'cookie_consent_analytics';
const ANALYTICS_SESSION_KEY = 'brgy133_analytics_session_id';

class AnalyticsService {
  constructor() {
    this.initialized = false;
    this.sessionEvents = [];
    this.setupConsentListener();
  }

  /**
   * Determine if the user has actively consented to analytics
   * and has not enabled Do Not Track in their browser.
   */
  hasConsent() {
    // Respect browser DNT / GPC
    if (typeof window !== 'undefined' && (navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.globalPrivacyControl === true)) {
      return false;
    }

    try {
      return localStorage.getItem(STORAGE_CONSENT_KEY) === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Listen for user updating cookie preferences in the Cookie Consent banner
   */
  setupConsentListener() {
    if (typeof window === 'undefined') return;

    window.addEventListener('cookie_consent_updated', (e) => {
      const allowed = e.detail?.analyticsAllowed ?? false;
      if (allowed) {
        this.trackEvent('Consent', 'Analytics_Enabled');
      } else {
        this.sessionEvents = [];
      }
    });
  }

  /**
   * Get or create a random pseudonymous session identifier (stored strictly in memory/sessionStorage)
   */
  getSessionId() {
    try {
      let sid = sessionStorage.getItem(ANALYTICS_SESSION_KEY);
      if (!sid) {
        sid = 's_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
        sessionStorage.setItem(ANALYTICS_SESSION_KEY, sid);
      }
      return sid;
    } catch {
      return 'ephemeral_session';
    }
  }

  /**
   * Sanitize URL paths to ensure no passwords, tokens, or PII in query params are logged
   */
  sanitizePath(rawPath) {
    if (!rawPath) return '/';
    try {
      const url = new URL(rawPath, 'https://brgy133.local');
      // Strip out all query params that could hold sensitive tokens or IDs
      return url.pathname;
    } catch {
      return rawPath.split('?')[0];
    }
  }

  /**
   * Track a page view (only if consented)
   */
  trackPageView(path) {
    if (!this.hasConsent()) return;

    const sanitized = this.sanitizePath(path);
    const event = {
      type: 'pageview',
      path: sanitized,
      timestamp: new Date().toISOString(),
      viewport: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'unknown',
      referrer: typeof document !== 'undefined' && document.referrer ? this.sanitizePath(document.referrer) : 'direct'
    };

    this.sessionEvents.push(event);

    // Development logging for transparency
    if (import.meta.env?.DEV) {
      console.log('[Privacy Analytics] PageView:', sanitized, event);
    }
  }

  /**
   * Track an interaction event (e.g. clicking public services, downloading mobile app)
   */
  trackEvent(category, action, label = null) {
    if (!this.hasConsent()) return;

    const event = {
      type: 'event',
      category: String(category).substring(0, 50),
      action: String(action).substring(0, 50),
      label: label ? String(label).substring(0, 100) : null,
      timestamp: new Date().toISOString()
    };

    this.sessionEvents.push(event);

    if (import.meta.env?.DEV) {
      console.log('[Privacy Analytics] Event:', event);
    }
  }

  /**
   * Clear all analytics data when user revokes consent
   */
  revokeConsent() {
    try {
      localStorage.setItem(STORAGE_CONSENT_KEY, 'false');
      sessionStorage.removeItem(ANALYTICS_SESSION_KEY);
      this.sessionEvents = [];
      window.dispatchEvent(new CustomEvent('cookie_consent_updated', { detail: { analyticsAllowed: false } }));
    } catch (e) {
      console.error('Could not revoke analytics consent', e);
    }
  }
}

export const analytics = new AnalyticsService();
export default analytics;
