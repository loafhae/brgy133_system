import axios from 'axios';

// In-flight GET request deduplication cache
const pendingRequests = new Map();

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000, // 15-second timeout to prevent zombie connections
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-Session-Request': '1',
    'X-Session-Client': 'web',
  },
});

// Request interceptor: initialize the retry guard
api.interceptors.request.use(
  (config) => {
    // Safety guard: initialize retry counter to prevent infinite retry loops
    config._retryCount = config._retryCount || 0;

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: retry cap, 429 rate limit backoff, deduplication cleanup
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const { config, response } = error;

    if (!config) {
      return Promise.reject(error);
    }

    if (response?.status === 428 && !config._mfaRetried) {
      return new Promise((resolve, reject) => {
        window.dispatchEvent(new CustomEvent('auth:mfa-required', {
          detail: {
            config,
            resolve: (retryConfig) => resolve(api(retryConfig)),
            reject,
          },
        }));
      });
    }

    const isPublicAuthRequest = /^\/auth\/(login|register|forgot-password|verify-otp|reset-password)/.test(
      config.url || ''
    );
    if (response?.status === 401 && !isPublicAuthRequest) {
      localStorage.removeItem('token');
      localStorage.removeItem('lastUserActivity');
      window.dispatchEvent(new Event('auth:session-expired'));
    }

    // Hard cap: Never retry more than 2 times under any circumstances
    if (config._retryCount >= 2) {
      console.warn(`[API Guard] Max retry limit reached (2) for: ${config.url}. Aborting request.`);
      return Promise.reject(error);
    }

    // Handle 429 Too Many Requests: do NOT immediately retry
    if (response && response.status === 429) {
      const retryAfter = response.headers['retry-after'] || 5;
      console.warn(`[API Rate Limit] Server returned 429 for ${config.url}. Cooldown for ${retryAfter}s.`);
      return Promise.reject(error);
    }

    // Handle Network Transient Errors with exponential backoff (max 1 retry)
    if (!response && config._retryCount === 0 && config.method === 'get') {
      config._retryCount += 1;
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return api(config);
    }

    return Promise.reject(error);
  }
);

export default api;