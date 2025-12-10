/**
 * Auth module for ShipTrack
 * Handles authentication state and operations
 */
const Auth = {
  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !!(token && user);
  },

  /**
   * Get current user
   */
  getUser() {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  /**
   * Get auth token
   */
  getToken() {
    return localStorage.getItem('token');
  },

  /**
   * Save auth data
   */
  saveAuth(user, token) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },

  /**
   * Clear auth data
   */
  clearAuth() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  /**
   * Register new user
   */
  async register(name, email, password) {
    const result = await Api.post('/auth/register', { name, email, password });
    
    if (result.success && result.data) {
      this.saveAuth(result.data.user, result.data.token);
    }
    
    return result;
  },

  /**
   * Login user
   */
  async login(email, password) {
    const result = await Api.post('/auth/login', { email, password });
    
    if (result.success && result.data) {
      this.saveAuth(result.data.user, result.data.token);
    }
    
    return result;
  },

  /**
   * Logout user
   */
  async logout() {
    this.clearAuth();
    window.location.href = '/login';
  },

  /**
   * Check if user has specific role
   */
  hasRole(...roles) {
    const user = this.getUser();
    if (!user) return false;
    return roles.includes(user.role);
  },

  /**
   * Check if user is admin
   */
  isAdmin() {
    return this.hasRole('admin');
  },

  /**
   * Require authentication - redirect to login if not authenticated
   */
  requireAuth() {
    if (!this.isAuthenticated()) {
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
      return false;
    }
    return true;
  },

  /**
   * Require admin - redirect to dashboard if not admin
   */
  requireAdmin() {
    if (!this.requireAuth()) return false;
    
    if (!this.isAdmin()) {
      window.location.href = '/dashboard';
      return false;
    }
    return true;
  },
};
