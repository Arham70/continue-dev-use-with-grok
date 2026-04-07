/* ============================================
   Login — Login Form Logic & Validation
   ============================================ */

// Login Form State
const LoginState = {
  email: '',
  password: '',
  rememberMe: false,
  errors: {},
  isLoading: false
};

// Initialize Login View
function initLoginView() {
  const form = document.getElementById('login-form');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const rememberToggle = document.getElementById('remember-toggle');
  const submitBtn = document.getElementById('login-submit');
  const passwordToggle = document.querySelector('.password-toggle');
  const forgotLink = document.querySelector('.forgot-link');
  const registerLink = document.querySelector('.register-link');
  const themeToggle = document.querySelector('.theme-toggle');

  // Form submission
  if (form) {
    form.addEventListener('submit', handleLoginSubmit);
  }

  // Input validation on blur
  if (emailInput) {
    emailInput.addEventListener('blur', () => validateEmailField(emailInput));
    emailInput.addEventListener('input', () => clearFieldError(emailInput));
  }

  if (passwordInput) {
    passwordInput.addEventListener('blur', () => validatePasswordField(passwordInput));
    passwordInput.addEventListener('input', () => clearFieldError(passwordInput));
  }

  // Remember me toggle
  if (rememberToggle) {
    rememberToggle.addEventListener('click', () => {
      LoginState.rememberMe = !LoginState.rememberMe;
      rememberToggle.classList.toggle('active', LoginState.rememberMe);
      rememberToggle.setAttribute('aria-checked', LoginState.rememberMe);
    });
  }

  // Password visibility toggle
  if (passwordToggle && passwordInput) {
    passwordToggle.addEventListener('click', () => {
      const type = passwordInput.type === 'password' ? 'text' : 'password';
      passwordInput.type = type;
      passwordToggle.setAttribute('aria-label', type === 'password' ? 'Show password' : 'Hide password');
      updatePasswordToggleIcon(passwordToggle, type);
    });
  }

  // Theme toggle
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
    // Set initial icon
    const svg = themeToggle.querySelector('svg');
    if (svg) {
      svg.innerHTML = AppState.theme === 'dark' ? sunIcon : moonIcon;
    }
  }

  // Social buttons
  document.querySelectorAll('.btn-social').forEach(btn => {
    btn.addEventListener('click', handleSocialLogin);
  });

  // Focus first input
  if (emailInput) {
    emailInput.focus();
  }
}

// Handle Login Submit
async function handleLoginSubmit(e) {
  e.preventDefault();
  
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const submitBtn = document.getElementById('login-submit');

  // Validate all fields
  const emailValid = validateEmailField(emailInput);
  const passwordValid = validatePasswordField(passwordInput);

  if (!emailValid || !passwordValid) {
    return;
  }

  // Set loading state
  setButtonLoading(submitBtn, true);
  LoginState.isLoading = true;
  LoginState.email = emailInput.value;
  LoginState.password = passwordInput.value;

  try {
    // Simulate API call
    await simulateLogin(LoginState.email, LoginState.password);
    
    Toast.success('Login successful! Redirecting...');
    
    // Navigate to MFA or Dashboard
    setTimeout(() => {
      navigateTo('mfa-verify');
    }, 1000);
    
  } catch (error) {
    Toast.error(error.message || 'Login failed. Please try again.');
    shakeElement(document.querySelector('.login-card'));
  } finally {
    setButtonLoading(submitBtn, false);
    LoginState.isLoading = false;
  }
}

// Validation Functions
function validateEmailField(input) {
  const value = input.value.trim();
  const errorEl = document.getElementById(`${input.id}-error`);
  
  if (!value) {
    setFieldError(input, errorEl, 'Email is required');
    return false;
  }
  
  if (!isValidEmail(value)) {
    setFieldError(input, errorEl, 'Please enter a valid email address');
    return false;
  }
  
  clearFieldError(input);
  setFieldSuccess(input);
  return true;
}

function validatePasswordField(input) {
  const value = input.value;
  const errorEl = document.getElementById(`${input.id}-error`);
  
  if (!value) {
    setFieldError(input, errorEl, 'Password is required');
    return false;
  }
  
  if (value.length < 8) {
    setFieldError(input, errorEl, 'Password must be at least 8 characters');
    return false;
  }
  
  clearFieldError(input);
  setFieldSuccess(input);
  return true;
}

// Field State Helpers
function setFieldError(input, errorEl, message) {
  input.classList.add('error');
  input.classList.remove('success');
  input.setAttribute('aria-invalid', 'true');
  if (errorEl) {
    errorEl.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
      </svg>
      ${message}
    `;
    errorEl.style.display = 'flex';
  }
}

function clearFieldError(input) {
  input.classList.remove('error');
  input.setAttribute('aria-invalid', 'false');
  const errorEl = document.getElementById(`${input.id}-error`);
  if (errorEl) {
    errorEl.style.display = 'none';
  }
}

function setFieldSuccess(input) {
  input.classList.add('success');
}

// Button Loading State
function setButtonLoading(button, isLoading) {
  if (isLoading) {
    button.disabled = true;
    button.classList.add('btn-loading');
    button.setAttribute('aria-busy', 'true');
    button.dataset.originalText = button.innerHTML;
    button.innerHTML = 'Signing in...';
  } else {
    button.disabled = false;
    button.classList.remove('btn-loading');
    button.setAttribute('aria-busy', 'false');
    button.innerHTML = button.dataset.originalText || 'Sign in';
  }
}

// Password Toggle Icon
function updatePasswordToggleIcon(toggle, type) {
  const svg = toggle.querySelector('svg');
  if (type === 'password') {
    svg.innerHTML = `
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    `;
  } else {
    svg.innerHTML = `
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
      <line x1="1" y1="1" x2="23" y2="23"></line>
    `;
  }
}

// Shake Animation
function shakeElement(element) {
  element.classList.add('animate-shake');
  setTimeout(() => element.classList.remove('animate-shake'), 500);
}

// Social Login Handler
function handleSocialLogin(e) {
  const provider = e.currentTarget.dataset.provider;
  Toast.info(`${provider} login coming soon!`);
}

// Simulated API Call
function simulateLogin(email, password) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Simulate success for demo
      if (email && password.length >= 8) {
        resolve({ success: true, user: { email } });
      } else {
        reject(new Error('Invalid credentials'));
      }
    }, 1500);
  });
}

// Login HTML Template
function getLoginHTML() {
  return `
    <div class="login-container">
      <button class="theme-toggle" aria-label="Toggle dark mode">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          ${AppState.theme === 'dark' ? sunIcon : moonIcon}
        </svg>
      </button>
      
      <div class="login-card animate-scale-in">
        <div class="login-header">
          <div class="login-logo">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <h1 class="login-title">Welcome back</h1>
          <p class="login-subtitle">Sign in to your account to continue</p>
        </div>
        
        <form id="login-form" novalidate>
          <div class="form-group">
            <label for="email" class="form-label required">Email address</label>
            <div class="input-wrapper">
              <input 
                type="email" 
                id="email" 
                name="email" 
                class="form-input" 
                placeholder="you@example.com"
                autocomplete="email"
                required
                aria-describedby="email-error"
              >
              <svg class="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
            </div>
            <div id="email-error" class="form-error" role="alert" style="display: none;"></div>
          </div>
          
          <div class="form-group">
            <label for="password" class="form-label required">Password</label>
            <div class="input-wrapper">
              <input 
                type="password" 
                id="password" 
                name="password" 
                class="form-input" 
                placeholder="Enter your password"
                autocomplete="current-password"
                required
                aria-describedby="password-error"
                minlength="8"
              >
              <button type="button" class="password-toggle" aria-label="Show password">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
            </div>
            <div id="password-error" class="form-error" role="alert" style="display: none;"></div>
          </div>
          
          <div class="form-row">
            <div class="toggle-wrapper">
              <button type="button" id="remember-toggle" class="toggle" role="switch" aria-checked="false" aria-label="Remember me"></button>
              <label for="remember-toggle" class="toggle-label">Remember me</label>
            </div>
            <a href="#forgot-password" class="forgot-link">Forgot password?</a>
          </div>
          
          <button type="submit" id="login-submit" class="btn btn-primary">
            Sign in
          </button>
        </form>
        
        <div class="divider">or continue with</div>
        
        <div class="social-buttons">
          <button type="button" class="btn btn-social" data-provider="Google">
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.19 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
          <button type="button" class="btn btn-social" data-provider="GitHub">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            Continue with GitHub
          </button>
        </div>
        
        <div class="login-footer">
          <p class="register-link">
            Don't have an account? <a href="#register">Create one</a>
          </p>
        </div>
      </div>
    </div>
  `;
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initLoginView, LoginState };
}
