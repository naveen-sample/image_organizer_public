const Auth = {
  isLoggedIn() {
    return !!Storage.getToken();
  },

  async validateToken(token) {
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        throw new Error(`Token validation failed: ${response.status}`);
      }

      const user = await response.json();
      const rateLimit = {
        remaining: parseInt(response.headers.get('X-RateLimit-Remaining') || '0'),
        reset: parseInt(response.headers.get('X-RateLimit-Reset') || '0')
      };

      return { valid: true, user, rateLimit };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  },

  async login(token) {
    const validation = await this.validateToken(token);
    if (validation.valid) {
      Storage.setToken(token);
      return { success: true, user: validation.user };
    }
    return { success: false, error: validation.error || 'Invalid token' };
  },

  logout() {
    Storage.clearToken();
    Storage.CacheManager.clear();
  },

  getToken() {
    return Storage.getToken();
  }
};
