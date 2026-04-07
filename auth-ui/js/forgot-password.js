/* ============================================
   Forgot Password — Password Reset Logic
   ============================================ */

// Forgot Password State
const ForgotState = {
  email: '',
  isLoading: false,
  isSuccess: false,
  resendCooldown: 0,
  countdownInterval: null
};

// Countdown duration in seconds
const RESEND_COOLDOWN = 60;

// ============================================
// Initialize Forgot Password View
// ============================================
function initForgotPasswordView() {
  const form = document.getElementById('forgot-form');
  const emailInput = document.getElementById('forgot-email');
  const submitBtn = document.getElementById('forgot-submit');
  const themeToggle = document.querySelector('.theme-toggle');

  // Form submission
  if (form) {
    form.addEventListener('submit', handleForgotSubmit);
  }

  // Email validation on blur
  if (emailInput) {
    emailInput.addEventListener('blur', function () {
      validateForgotEmailField(emailInput);
    });
    emailInput.addEventListener('input', function () {
      clearFieldError(emailInput);
    });
  }

  // Theme toggle
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
    var svg = themeToggle.querySelector('svg');
    if (svg) {
      svg.innerHTML = AppState.theme === 'dark' ? sunIcon : moonIcon;
    }
  }

  // Back to login button
  var backBtn = document.querySelector('.back-link');
  if (backBtn) {
    backBtn.addEventListener('click', function (e) {
      e.preventDefault();
      navigateTo('login');
    });
  }

  // Focus email input
  if (emailInput) emailInput.focus();
}

// ============================================
// Form Submission
// ============================================
async function handleForgotSubmit(e) {
  e.preventDefault();

  var emailInput = document.getElementById('forgot-email');
  var submitBtn = document.getElementById('forgot-submit');

  // Validate email
  var isValid = validateForgotEmailField(emailInput);
  if (!isValid) return;

  // Set loading state
  setForgotButtonLoading(submitBtn, true);
  ForgotState.isLoading = true;
  ForgotState.email = emailInput.value.trim();

  try {
    await simulateForgotPassword(ForgotState.email);
    Toast.success('Reset link sent successfully!');
    
    // Transition to success state
    setTimeout(function () {
      transitionToSuccessState(ForgotState.email);
    }, 500);
  } catch (error) {
    Toast.error(error.message || 'Failed to send reset link. Please try again.');
    shakeElement(document.querySelector('.forgot-card'));
  } finally {
    setForgotButtonLoading(submitBtn, false);
    ForgotState.isLoading = false;
  }
}

// ============================================
// Validation
// ============================================
function validateForgotEmailField(input) {
  var value = input.value.trim();
  var errorEl = document.getElementById('forgot-email-error');

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

// ============================================
// Button Loading State
// ============================================
function setForgotButtonLoading(button, isLoading) {
  if (isLoading) {
    button.disabled = true;
    button.classList.add('btn-loading');
    button.setAttribute('aria-busy', 'true');
    button.dataset.originalText = button.innerHTML;
    button.innerHTML = 'Sending...';
  } else {
    button.classList.remove('btn-loading');
    button.setAttribute('aria-busy', 'false');
    button.innerHTML = button.dataset.originalText || 'Send Reset Link';
    button.disabled = false;
  }
}

// ============================================
// State Transition
// ============================================
function transitionToSuccessState(email) {
  ForgotState.isSuccess = true;

  var card = document.querySelector('.forgot-card');
  if (!card) return;

  // Exit animation
  card.classList.add('page-exit');

  setTimeout(function () {
    card.innerHTML = getSuccessStateHTML(email);
    card.classList.remove('page-exit');
    card.classList.add('page-enter');

    // Initialize success state handlers
    initSuccessStateHandlers(email);

    setTimeout(function () {
      card.classList.remove('page-enter');
    }, 300);
  }, 200);
}

function transitionToFormState(preserveEmail) {
  ForgotState.isSuccess = false;
  clearCountdown();

  var card = document.querySelector('.forgot-card');
  if (!card) return;

  card.classList.add('page-exit');

  setTimeout(function () {
    card.innerHTML = getForgotFormHTML(preserveEmail);
    card.classList.remove('page-exit');
    card.classList.add('page-enter');

    // Re-initialize form handlers
    initForgotPasswordView();

    setTimeout(function () {
      card.classList.remove('page-enter');
    }, 300);
  }, 200);
}

// ============================================
// Success State Handlers
// ============================================
function initSuccessStateHandlers(email) {
  // Resend button
  var resendBtn = document.getElementById('resend-btn');
  if (resendBtn) {
    startCountdown();
    resendBtn.addEventListener('click', function () {
      if (ForgotState.resendCooldown === 0) {
        handleResend(email);
      }
    });
  }

  // Try different email
  var tryDiffBtn = document.querySelector('.try-different-link');
  if (tryDiffBtn) {
    tryDiffBtn.addEventListener('click', function (e) {
      e.preventDefault();
      transitionToFormState(ForgotState.email);
    });
  }

  // Back to login
  var backBtn = document.querySelector('.success-back-link');
  if (backBtn) {
    backBtn.addEventListener('click', function (e) {
      e.preventDefault();
      clearCountdown();
      navigateTo('login');
    });
  }

  // Theme toggle
  var themeToggle = document.querySelector('.theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
}

// ============================================
// Countdown Timer
// ============================================
function startCountdown() {
  ForgotState.resendCooldown = RESEND_COOLDOWN;
  updateCountdownDisplay();

  ForgotState.countdownInterval = setInterval(function () {
    ForgotState.resendCooldown--;
    updateCountdownDisplay();

    if (ForgotState.resendCooldown <= 0) {
      clearCountdown();
      enableResendButton();
    }
  }, 1000);
}

function clearCountdown() {
  if (ForgotState.countdownInterval) {
    clearInterval(ForgotState.countdownInterval);
    ForgotState.countdownInterval = null;
  }
}

function updateCountdownDisplay() {
  var timerEl = document.getElementById('countdown-time');
  var resendBtn = document.getElementById('resend-btn');

  if (timerEl) {
    var minutes = Math.floor(ForgotState.resendCooldown / 60);
    var seconds = ForgotState.resendCooldown % 60;
    timerEl.textContent = 
      String(minutes).padStart(2, '0') + ':' + 
      String(seconds).padStart(2, '0');
  }

  if (resendBtn) {
    resendBtn.disabled = ForgotState.resendCooldown > 0;
  }
}

function enableResendButton() {
  var resendBtn = document.getElementById('resend-btn');
  var timerEl = document.getElementById('countdown-timer');

  if (resendBtn) {
    resendBtn.disabled = false;
    resendBtn.classList.add('btn-ready');
  }

  if (timerEl) {
    timerEl.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Ready to resend';
  }
}

// ============================================
// Resend Handler
// ============================================
async function handleResend(email) {
  var resendBtn = document.getElementById('resend-btn');

  resendBtn.disabled = true;
  resendBtn.innerHTML = '<svg class="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle><path d="M12 2a10 10 0 0 1 10 10" stroke-opacity="1"></path></svg> Sending...';

  try {
    await simulateForgotPassword(email);
    Toast.success('Reset link sent again!');
    startCountdown();
    resendBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Resend Email';
  } catch (error) {
    Toast.error('Failed to resend. Please try again.');
    resendBtn.disabled = false;
    resendBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13"></path><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg> Resend Email';
  }
}

// ============================================
// Simulated API
// ============================================
function simulateForgotPassword(email) {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      if (email && isValidEmail(email)) {
        resolve({ success: true, message: 'Reset link sent' });
      } else {
        reject(new Error('Invalid email address'));
      }
    }, 1500);
  });
}

// ============================================
// HTML Templates
// ============================================
function getForgotFormHTML(prefilledEmail) {
  var emailValue = prefilledEmail || '';
  return `
  <button class="theme-toggle" aria-label="Toggle dark mode">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      ${AppState.theme === 'dark' ? sunIcon : moonIcon}
    </svg>
  </button>

  <div class="forgot-header">
    <div class="forgot-icon lock-icon lock-pulse">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      </svg>
    </div>
    <h1 class="forgot-title">Forgot Password?</h1>
    <p class="forgot-subtitle">Enter your email and we'll send you a reset link</p>
  </div>

  <form id="forgot-form" novalidate>
    <div class="form-group">
      <label for="forgot-email" class="form-label required">Email Address</label>
      <div class="input-wrapper">
        <input type="email" id="forgot-email" name="email" class="form-input" 
               placeholder="you@example.com" value="${emailValue}"
               autocomplete="email" required aria-describedby="forgot-email-error">
        <svg class="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
          <polyline points="22,6 12,13 2,6"></polyline>
        </svg>
      </div>
      <div id="forgot-email-error" class="form-error" role="alert" style="display:none"></div>
    </div>

    <button type="submit" id="forgot-submit" class="btn btn-primary" style="width:100%; margin-top:var(--space-6)">
      Send Reset Link
    </button>
  </form>

  <button class="back-link">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="19" y1="12" x2="5" y2="12"></line>
      <polyline points="12 19 5 12 12 5"></polyline>
    </svg>
    Back to Login
  </button>
  `;
}

function getSuccessStateHTML(email) {
  return `
  <button class="theme-toggle" aria-label="Toggle dark mode">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      ${AppState.theme === 'dark' ? sunIcon : moonIcon}
    </svg>
  </button>

  <div class="forgot-header">
    <div class="forgot-icon success-icon">
      <svg width="32" height="32" viewBox="0 0 52 52">
        <circle class="checkmark-circle" cx="26" cy="26" r="24" fill="none" stroke="currentColor" stroke-width="3"/>
        <path class="checkmark-check" fill="none" stroke="currentColor" stroke-width="4" d="M14 27l8 8 16-16"/>
      </svg>
    </div>
    <h1 class="forgot-title">Check Your Email</h1>
    <p class="forgot-subtitle">We've sent a password reset link to</p>
  </div>

  <div class="email-display">
    <span class="email-address">${email}</span>
  </div>

  <div class="resend-section">
    <p class="resend-text">Didn't receive the email?</p>
    <button type="button" id="resend-btn" class="resend-button" disabled>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 2L11 13"></path>
        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
      </svg>
      Resend Email
    </button>
    <div id="countdown-timer" class="countdown-timer">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
      </svg>
      Resend in <span id="countdown-time">01:00</span>
    </div>
  </div>

  <div class="success-actions">
    <button class="btn btn-secondary success-back-link" style="width:100%">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
      </svg>
      Back to Login
    </button>
    <button class="try-different-link">Try a different email</button>
  </div>
  `;
}

function getForgotPasswordHTML() {
  return `
  <div class="forgot-container">
    <div class="forgot-card animate-scale-in">
      ${getForgotFormHTML('')}
    </div>
  </div>
  `;
}
