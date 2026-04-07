/* ============================================
   App — SPA Router & State Management
   ============================================ */

// Application State
const AppState = {
  currentView: 'login',
  user: null,
  theme: 'light',
  isLoading: false,
  formData: {},
  errors: {}
};

// View Registry
const views = {
  login: { title: 'Login', render: renderLogin },
  register: { title: 'Register', render: renderRegister },
  'forgot-password': { title: 'Forgot Password', render: renderForgotPassword },
  'mfa-verify': { title: 'Two-Factor Authentication', render: renderMFAVerify },
  dashboard: { title: 'Dashboard', render: renderDashboard }
};

// Initialize Application
function initApp() {
  // Load saved theme
  const savedTheme = localStorage.getItem('theme') || 'light';
  setTheme(savedTheme);
  
  // Get initial view from URL hash or default to login
  const hash = window.location.hash.slice(1);
  const initialView = views[hash] ? hash : 'login';
  
  // Render initial view
  navigateTo(initialView);
  
  // Listen for hash changes
  window.addEventListener('hashchange', handleHashChange);
  
  // Setup keyboard shortcuts
  document.addEventListener('keydown', handleKeyboardShortcuts);
}

// Router Functions
function handleHashChange() {
  const hash = window.location.hash.slice(1) || 'login';
  navigateTo(hash);
}

function navigateTo(viewName, options = {}) {
  const view = views[viewName];
  
  if (!view) {
    console.error(`View "${viewName}" not found`);
    return;
  }
  
  // Update state
  AppState.currentView = viewName;
  
  // Update URL
  window.location.hash = viewName;
  
  // Update document title
  document.title = `${view.title} | Auth UI`;
  
  // Render view with transition
  const container = document.getElementById('app');
  
  if (options.animate !== false) {
    container.classList.add('page-exit');
    
    setTimeout(() => {
      container.innerHTML = view.render();
      container.classList.remove('page-exit');
      container.classList.add('page-enter');
      
            // Initialize view-specific logic
            if (viewName === 'login') initLoginView();
            if (viewName === 'register') initRegisterView();
            if (viewName === 'forgot-password') initForgotPasswordView();
            if (viewName === 'mfa-verify') initMFAVerifyView();
      
            setTimeout(() => {
              container.classList.remove('page-enter');
            }, 300);
    }, 150);
  } else {
    container.innerHTML = view.render();
    if (viewName === 'login') initLoginView();
    if (viewName === 'register') initRegisterView();
    if (viewName === 'forgot-password') initForgotPasswordView();
    if (viewName === 'mfa-verify') initMFAVerifyView();
  }
}

// Theme Management
function setTheme(theme) {
  AppState.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  
  // Update theme toggle icon
  const themeToggle = document.querySelector('.theme-toggle svg');
  if (themeToggle) {
    themeToggle.innerHTML = theme === 'dark' ? sunIcon : moonIcon;
  }
}

function toggleTheme() {
  setTheme(AppState.theme === 'light' ? 'dark' : 'light');
}

// View Renderers (placeholders - will be implemented in separate files)
function renderLogin() {
  return getLoginHTML();
}

function renderRegister() {
  return getRegisterHTML();
}

function renderForgotPassword() {
  return getForgotPasswordHTML();
}

function renderMFAVerify() {
  return getMFAVerifyHTML();
}

function renderDashboard() {
  return `<div class="login-container"><div class="login-card"><h2>Dashboard View</h2><p>Coming in ONE-42</p></div></div>`;
}

// Keyboard Shortcuts
function handleKeyboardShortcuts(e) {
  // Escape to go back
  if (e.key === 'Escape' && AppState.currentView !== 'login') {
    navigateTo('login');
  }
  
  // Ctrl/Cmd + K for quick navigation
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    // Could open a command palette here
  }
}

// SVG Icons
const sunIcon = `<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>`;

const moonIcon = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>`;

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AppState, navigateTo, setTheme, toggleTheme };
}
