/**
 * Main App module for ShipTrack
 * Contains utility functions and initializes the application
 */
const App = {
  /**
   * Initialize application
   */
  init() {
    this.updateNavigation();
  },

  /**
   * Update navigation based on auth state
   */
  updateNavigation() {
    const navLinks = document.getElementById('navLinks');
    const authNav = document.getElementById('authNav');

    if (!navLinks || !authNav) return;

    if (Auth.isAuthenticated()) {
      const user = Auth.getUser();
      
      navLinks.innerHTML = `
        <li class="nav-item">
          <a class="nav-link" href="/dashboard"><i class="bi bi-speedometer2 me-1"></i>Dashboard</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="/shipments"><i class="bi bi-box-seam me-1"></i>Shipments</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="/track"><i class="bi bi-search me-1"></i>Track</a>
        </li>
        ${user.role === 'admin' ? `
          <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">
              <i class="bi bi-gear me-1"></i>Admin
            </a>
            <ul class="dropdown-menu">
              <li><a class="dropdown-item" href="/admin/users"><i class="bi bi-people me-2"></i>Users</a></li>
            </ul>
          </li>
        ` : ''}
      `;

      authNav.innerHTML = `
        <li class="nav-item dropdown">
          <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">
            <i class="bi bi-person-circle me-1"></i>${this.escapeHtml(user.name)}
          </a>
          <ul class="dropdown-menu dropdown-menu-end">
            <li><a class="dropdown-item" href="/profile"><i class="bi bi-person me-2"></i>Profile</a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item" href="#" onclick="Auth.logout(); return false;"><i class="bi bi-box-arrow-right me-2"></i>Logout</a></li>
          </ul>
        </li>
      `;
    } else {
      navLinks.innerHTML = `
        <li class="nav-item">
          <a class="nav-link" href="/track"><i class="bi bi-search me-1"></i>Track</a>
        </li>
      `;

      authNav.innerHTML = `
        <li class="nav-item">
          <a class="nav-link" href="/login">Sign In</a>
        </li>
        <li class="nav-item">
          <a class="nav-link btn btn-light btn-sm text-primary ms-2" href="/register">Sign Up</a>
        </li>
      `;
    }
  },

  /**
   * Show toast notification
   */
  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const id = 'toast-' + Date.now();
    const bgClass = {
      success: 'bg-success',
      error: 'bg-danger',
      warning: 'bg-warning',
      info: 'bg-info'
    }[type] || 'bg-info';

    const icon = {
      success: 'check-circle',
      error: 'exclamation-circle',
      warning: 'exclamation-triangle',
      info: 'info-circle'
    }[type] || 'info-circle';

    const toastHtml = `
      <div id="${id}" class="toast align-items-center text-white ${bgClass} border-0" role="alert">
        <div class="d-flex">
          <div class="toast-body">
            <i class="bi bi-${icon} me-2"></i>${this.escapeHtml(message)}
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
      </div>
    `;

    container.insertAdjacentHTML('beforeend', toastHtml);

    const toastEl = document.getElementById(id);
    const toast = new bootstrap.Toast(toastEl, { delay: 5000 });
    toast.show();

    toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
  },

  /**
   * Show loading overlay
   */
  showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
      overlay.classList.remove('d-none');
    }
  },

  /**
   * Hide loading overlay
   */
  hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
      overlay.classList.add('d-none');
    }
  },

  /**
   * Format date
   */
  formatDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },

  /**
   * Format date and time
   */
  formatDateTime(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  /**
   * Get status badge HTML
   */
  getStatusBadge(status) {
    const badges = {
      pending: '<span class="badge bg-warning text-dark">Pending</span>',
      in_transit: '<span class="badge bg-info">In Transit</span>',
      delivered: '<span class="badge bg-success">Delivered</span>',
      cancelled: '<span class="badge bg-danger">Cancelled</span>'
    };
    return badges[status] || '<span class="badge bg-secondary">Unknown</span>';
  },

  /**
   * Debounce function
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => App.init());
