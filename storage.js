const Storage = {
  get(key) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },

  remove(key) {
    localStorage.removeItem(key);
  },

  getToken() {
    return localStorage.getItem('gh_token');
  },

  setToken(token) {
    localStorage.setItem('gh_token', token);
  },

  clearToken() {
    localStorage.removeItem('gh_token');
    localStorage.removeItem('gh_token_created');
    localStorage.removeItem('gh_token_expires');
  },

  getConfig() {
    return this.get('config') || {
      theme: 'light',
      autoRefresh: true,
      cacheEnabled: true,
      cacheDuration: 300000
    };
  },

  setConfig(config) {
    return this.set('config', config);
  },

  getPreferences() {
    return this.get('preferences') || {
      sortBy: 'date',
      sortOrder: 'desc',
      viewMode: 'grid',
      imagesPerPage: 20,
      theme: 'light'
    };
  },

  setPreferences(prefs) {
    return this.set('preferences', prefs);
  },

  CacheManager: {
    set(key, data, duration) {
      const cache = {
        data,
        timestamp: Date.now(),
        expiry: Date.now() + duration
      };
      localStorage.setItem(`cache:${key}`, JSON.stringify(cache));
    },

    get(key) {
      const cached = localStorage.getItem(`cache:${key}`);
      if (!cached) return null;
      try {
        const parsed = JSON.parse(cached);
        if (Date.now() > parsed.expiry) {
          localStorage.removeItem(`cache:${key}`);
          return null;
        }
        return parsed.data;
      } catch {
        localStorage.removeItem(`cache:${key}`);
        return null;
      }
    },

    remove(key) {
      localStorage.removeItem(`cache:${key}`);
    },

    clear() {
      const keys = Object.keys(localStorage);
      keys.forEach(k => {
        if (k.startsWith('cache:')) {
          localStorage.removeItem(k);
        }
      });
    },

    clearBlobCache() {
      const keys = Object.keys(localStorage);
      keys.forEach(k => {
        if (k.startsWith('cache:blob:')) {
          localStorage.removeItem(k);
        }
      });
    }
  }
};
