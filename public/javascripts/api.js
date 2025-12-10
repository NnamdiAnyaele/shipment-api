/**
 * API Client for ShipTrack
 * Handles all API communication with proper error handling
 */
const Api = {
  baseUrl: '/api',

  /**
   * Get auth headers
   */
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  },

  /**
   * Make API request
   */
  async request(method, endpoint, data = null, options = {}) {
    const url = this.baseUrl + endpoint;
    
    const config = {
      method,
      headers: options.headers || this.getHeaders(),
    };

    if (data && method !== 'GET') {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, config);
      const result = await response.json();

      // Handle 401 unauthorized
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Redirect to login if not on auth pages
        if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
          window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
        }
      }

      return result;
    } catch (error) {
      console.error('API Error:', error);
      return {
        success: false,
        message: 'Network error. Please check your connection.',
      };
    }
  },

  /**
   * GET request
   */
  async get(endpoint, params = {}) {
    // Build query string
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const queryString = queryParams.toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    
    return this.request('GET', url);
  },

  /**
   * POST request
   */
  async post(endpoint, data) {
    return this.request('POST', endpoint, data);
  },

  /**
   * PUT request
   */
  async put(endpoint, data) {
    return this.request('PUT', endpoint, data);
  },

  /**
   * PATCH request
   */
  async patch(endpoint, data) {
    return this.request('PATCH', endpoint, data);
  },

  /**
   * DELETE request
   */
  async delete(endpoint) {
    return this.request('DELETE', endpoint);
  },

  /**
   * Upload file(s) with FormData
   */
  async upload(endpoint, formData) {
    const url = this.baseUrl + endpoint;
    
    const headers = {};
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    // Don't set Content-Type for FormData - browser will set it with boundary

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });
      
      const result = await response.json();

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }

      return result;
    } catch (error) {
      console.error('Upload Error:', error);
      return {
        success: false,
        message: 'Upload failed. Please try again.',
      };
    }
  },
};
