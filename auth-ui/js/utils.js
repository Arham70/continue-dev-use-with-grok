/* ============================================
   Utils — Shared Helper Functions
   ============================================ */

// ============================================
// Validation Helpers
// ============================================

/**
 * Validate email format
 * @param {string} email 
 * @returns {boolean}
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * @param {string} password 
 * @returns {object} - { valid: boolean, strength: number, message: string }
 */
function validatePassword(password) {
  if (!password || password.length < 8) {
    return { valid: false, strength: 0, message: 'Password must be at least 8 characters' };
  }

  let strength = 0;
  const checks = {
    hasLower: /[a-z]/.test(password),
    hasUpper: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };

  if (checks.hasLower) strength++;
  if (checks.hasUpper) strength++;
  if (checks.hasNumber) strength++;
  if (checks.hasSpecial) strength++;

  // Bonus for length
  if (password.length >= 12) strength = Math.min(4, strength + 0.5);

  const strengthLabels = ['Weak', 'Fair', 'Strong', 'Very Strong'];
  const strengthColors = ['#EB5757', '#F2994A', '#27AE60', '#2D9CDB'];

  return {
    valid: strength >= 2,
    strength: Math.min(3, Math.floor(strength)),
    label: strengthLabels[Math.min(3, Math.floor(strength))],
    color: strengthColors[Math.min(3, Math.floor(strength))],
    checks,
    message: strength >= 2 ? 'Password is strong' : 'Add more character types'
  };
}

/**
 * Check if passwords match
 * @param {string} password 
 * @param {string} confirmPassword 
 * @returns {boolean}
 */
function passwordsMatch(password, confirmPassword) {
  return password === confirmPassword;
}

// ============================================
// Toast Notification System
// ============================================

const Toast = {
  container: null,
  
  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      this.container.setAttribute('role', 'alert');
      this.container.setAttribute('aria-live', 'polite');
      document.body.appendChild(this.container);
    }
  },

  /**
   * Show a toast notification
   * @param {string} message 
   * @param {string} type - 'success' | 'error' | 'warning' | 'info'
   * @param {number} duration - milliseconds (default 4000)
   */
  show(message, type = 'info', duration = 4000) {
    this.init();
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} toast-enter`;
    toast.innerHTML = `
      <div class="toast-content">
        ${this.getIcon(type)}
        <span class="toast-message">${message}</span>
      </div>
      <button class="toast-close" aria-label="Dismiss notification">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    `;

    // Close button handler
    toast.querySelector('.toast-close').addEventListener('click', () => {
      this.dismiss(toast);
    });

    this.container.appendChild(toast);

    // Auto-dismiss
    if (duration > 0) {
      setTimeout(() => this.dismiss(toast), duration);
    }

    return toast;
  },

  dismiss(toast) {
    toast.classList.remove('toast-enter');
    toast.classList.add('toast-exit');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 200);
  },

  getIcon(type) {
    const icons = {
      success: `<svg class="toast-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>`,
      error: `<svg class="toast-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
      </svg>`,
      warning: `<svg class="toast-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>`,
      info: `<svg class="toast-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>`
    };
    return icons[type] || icons.info;
  },

  // Convenience methods
  success(message, duration) { return this.show(message, 'success', duration); },
  error(message, duration) { return this.show(message, 'error', duration); },
  warning(message, duration) { return this.show(message, 'warning', duration); },
  info(message, duration) { return this.show(message, 'info', duration); }
};

// Add toast styles dynamically
const toastStyles = `
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1080;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}

.toast {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: var(--space-4) var(--space-5);
  min-width: 300px;
  max-width: 400px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  pointer-events: auto;
  border-left: 4px solid;
}

.toast-success { border-color: var(--color-success); }
.toast-error { border-color: var(--color-error); }
.toast-warning { border-color: var(--color-warning); }
.toast-info { border-color: var(--color-info); }

.toast-content {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.toast-icon {
  flex-shrink: 0;
}

.toast-message {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
}

.toast-close {
  background: none;
  border: none;
  padding: var(--space-1);
  cursor: pointer;
  color: var(--text-tertiary);
  transition: color var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
}

.toast-close:hover {
  color: var(--text-primary);
}

@media (max-width: 640px) {
  .toast-container {
    left: 20px;
    right: 20px;
  }
  
  .toast {
    min-width: auto;
    max-width: none;
  }
}
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = toastStyles;
document.head.appendChild(styleSheet);

// ============================================
// Utility Functions
// ============================================

/**
 * Debounce function calls
 * @param {Function} func 
 * @param {number} wait 
 * @returns {Function}
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Format relative time
 * @param {Date|string} date 
 * @returns {string}
 */
function formatRelativeTime(date) {
  const now = new Date();
  const then = new Date(date);
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
  return then.toLocaleDateString();
}

/**
 * Generate unique ID
 * @returns {string}
 */
function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

/**
 * Deep clone object
 * @param {object} obj 
 * @returns {object}
 */
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if element is in viewport
 * @param {HTMLElement} element 
 * @returns {boolean}
 */
function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Smooth scroll to element
 * @param {string|HTMLElement} target 
 * @param {number} offset 
 */
function scrollToElement(target, offset = 0) {
  const element = typeof target === 'string' ? document.querySelector(target) : target;
  if (element) {
    const top = element.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  }
}

// Export utilities
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    isValidEmail,
    validatePassword,
    passwordsMatch,
    Toast,
    debounce,
    formatRelativeTime,
    generateId,
    deepClone,
    isInViewport,
    scrollToElement
  };
}
