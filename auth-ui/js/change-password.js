/* ============================================
   Change Password — Authenticated Password Update Logic
   ============================================ */

// Change Password Form State
const ChangePasswordState = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
  errors: {},
  isLoading: false,
  isSuccess: false,
  countdownInterval: null
};

// Password strength tips
const CP_STRENGTH_TIPS = {
  0: 'Password is too short',
  1: 'Try adding uppercase or special characters',
  2: 'Good! Add numbers or special characters',
  3: 'Strong! Make it longer for maximum security',
  4: 'Excellent! Your password is very strong'
};

// ============================================
// Initialize Change Password View
// ============================================
function initChangePasswordView() {
  const form = document.getElementById('change-password-form');
  const currentPasswordInput = document.getElementById('cp-current-password');
  const newPasswordInput = document.getElementById('cp-new-password');
  const confirmPasswordInput = document.getElementById('cp-confirm-password');
  const submitBtn = document.getElementById('cp-submit-btn');
  const cancelBtn = document.getElementById('cp-cancel-btn');
  const themeToggle = document.querySelector('.theme-toggle');

  // Form submission
  if (form) {
    form.addEventListener('submit', handleChangePasswordSubmit);
  }

  // Current password — blur validation + real-time same-as check
  if (currentPasswordInput) {
    currentPasswordInput.addEventListener('blur', function () {
      validateCurrentPasswordField(currentPasswordInput);
    });
    currentPasswordInput.addEventListener('input', function () {
      clearFieldError(currentPasswordInput);
      // If new password is filled, check if they match
      if (newPasswordInput && newPasswordInput.value) {
        checkSamePassword(currentPasswordInput.value, newPasswordInput.value);
      }
    });
  }

  // New password — strength meter + real-time updates
  if (newPasswordInput) {
    newPasswordInput.addEventListener('input', function () {
      clearFieldError(newPasswordInput);
      updateCPStrengthMeter(newPasswordInput.value);
      // Update match indicator if confirm has a value
      if (confirmPasswordInput && confirmPasswordInput.value) {
        updateCPPasswordMatch(newPasswordInput.value, confirmPasswordInput.value);
      }
      // Check same as current
      if (currentPasswordInput && currentPasswordInput.value) {
        checkSamePassword(currentPasswordInput.value, newPasswordInput.value);
      }
      updateCPSubmitState();
    });
    newPasswordInput.addEventListener('blur', function () {
      validateCPNewPasswordField(newPasswordInput);
    });
  }

  // Confirm password — real-time match check
  if (confirmPasswordInput) {
    confirmPasswordInput.addEventListener('input', function () {
      clearFieldError(confirmPasswordInput);
      if (newPasswordInput) {
        updateCPPasswordMatch(newPasswordInput.value, confirmPasswordInput.value);
      }
      updateCPSubmitState();
    });
    confirmPasswordInput.addEventListener('blur', function () {
      validateCPConfirmPasswordField(confirmPasswordInput);
    });
  }

  // Password toggles — each independent
  document.querySelectorAll('.cp-password-toggle').forEach(function (toggle) {
    toggle.addEventListener('click', function () {
      var targetId = toggle.dataset.target;
      var targetInput = document.getElementById(targetId);
      if (targetInput) {
        var type = targetInput.type === 'password' ? 'text' : 'password';
        targetInput.type = type;
        toggle.setAttribute('aria-label', type === 'password' ? 'Show password' : 'Hide password');
        updateCPToggleIcon(toggle, type);
      }
    });
  });

  // Cancel button
  if (cancelBtn) {
    cancelBtn.addEventListener('click', function () {
      navigateTo('dashboard');
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

  // Focus current password field
  if (currentPasswordInput) currentPasswordInput.focus();
}

// ============================================
// Form Submission
// ============================================
async function handleChangePasswordSubmit(e) {
  e.preventDefault();

  var currentPasswordInput = document.getElementById('cp-current-password');
  var newPasswordInput = document.getElementById('cp-new-password');
  var confirmPasswordInput = document.getElementById('cp-confirm-password');
  var submitBtn = document.getElementById('cp-submit-btn');

  // Validate all fields
  var v1 = validateCurrentPasswordField(currentPasswordInput);
  var v2 = validateCPNewPasswordField(newPasswordInput);
  var v3 = validateCPConfirmPasswordField(confirmPasswordInput);

  if (!v1 || !v2 || !v3) {
    shakeElement(document.querySelector('.change-password-card'));
    return;
  }

  // Check new !== current
  if (currentPasswordInput.value === newPasswordInput.value) {
    setFieldError(newPasswordInput, document.getElementById('cp-new-password-error'), 'New password must be different from current password');
    shakeElement(document.querySelector('.change-password-card'));
    return;
  }

  // Set loading state
  setCPButtonLoading(submitBtn, true);
  ChangePasswordState.isLoading = true;
  ChangePasswordState.currentPassword = currentPasswordInput.value;
  ChangePasswordState.newPassword = newPasswordInput.value;

  try {
    await simulateChangePassword({
      currentPassword: ChangePasswordState.currentPassword,
      newPassword: ChangePasswordState.newPassword
    });
    showCPSuccessState();
  } catch (error) {
    Toast.error(error.message || 'Failed to update password. Please try again.');
    shakeElement(document.querySelector('.change-password-card'));
  } finally {
    setCPButtonLoading(submitBtn, false);
    ChangePasswordState.isLoading = false;
  }
}

// ============================================
// Validation Functions
// ============================================
function validateCurrentPasswordField(input) {
  var value = input.value;
  var errorEl = document.getElementById('cp-current-password-error');
  if (!value) { setFieldError(input, errorEl, 'Current password is required'); return false; }
  if (value.length < 1) { setFieldError(input, errorEl, 'Please enter your current password'); return false; }
  clearFieldError(input);
  setFieldSuccess(input);
  return true;
}

function validateCPNewPasswordField(input) {
  var value = input.value;
  var errorEl = document.getElementById('cp-new-password-error');
  if (!value) { setFieldError(input, errorEl, 'New password is required'); return false; }
  if (value.length < 8) { setFieldError(input, errorEl, 'Password must be at least 8 characters'); return false; }
  var result = validatePassword(value);
  if (!result.valid) { setFieldError(input, errorEl, result.message); return false; }
  // Check new !== current
  var currentInput = document.getElementById('cp-current-password');
  if (currentInput && value === currentInput.value) {
    setFieldError(input, errorEl, 'New password must be different from current password');
    return false;
  }
  clearFieldError(input);
  setFieldSuccess(input);
  return true;
}

function validateCPConfirmPasswordField(input) {
  var value = input.value;
  var passwordInput = document.getElementById('cp-new-password');
  var errorEl = document.getElementById('cp-confirm-password-error');
  if (!value) { setFieldError(input, errorEl, 'Please confirm your new password'); return false; }
  if (passwordInput && value !== passwordInput.value) { setFieldError(input, errorEl, 'Passwords do not match'); return false; }
  clearFieldError(input);
  setFieldSuccess(input);
  return true;
}

// ============================================
// Same Password Check (new === current)
// ============================================
function checkSamePassword(currentPassword, newPassword) {
  var warningEl = document.getElementById('cp-same-password-warning');
  if (!warningEl) return;

  if (newPassword && newPassword === currentPassword) {
    warningEl.classList.add('visible');
  } else {
    warningEl.classList.remove('visible');
  }
}

// ============================================
// Password Strength Meter
// ============================================
function updateCPStrengthMeter(password) {
  var fill = document.getElementById('cp-strength-fill');
  var text = document.getElementById('cp-strength-text');
  var tips = document.getElementById('cp-strength-tips');
  var requirementsContainer = document.getElementById('cp-password-requirements');

  if (!password) {
    if (fill) { fill.className = 'strength-fill'; fill.style.width = '0%'; }
    if (text) { text.textContent = ''; text.className = 'strength-text'; }
    if (tips) { tips.innerHTML = ''; }
    if (requirementsContainer) requirementsContainer.innerHTML = '';
    return;
  }

  var result = validatePassword(password);
  var level = result.strength;
  var displayLevel = password.length < 8 ? 0 : level + 1;
  if (password.length >= 12 && result.checks.hasLower && result.checks.hasUpper && result.checks.hasNumber && result.checks.hasSpecial) {
    displayLevel = 4;
  }

  if (fill) {
    fill.className = 'strength-fill level-' + displayLevel;
  }
  if (text) {
    var labels = ['Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
    text.textContent = labels[displayLevel];
    text.className = 'strength-text level-' + displayLevel;
  }
  if (tips) {
    tips.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>' + CP_STRENGTH_TIPS[displayLevel];
  }

  if (requirementsContainer) {
    requirementsContainer.innerHTML = buildCPRequirementsHTML(result.checks, password.length >= 8);
  }
}

function buildCPRequirementsHTML(checks, minLen) {
  var items = [
    { met: minLen, text: 'At least 8 characters' },
    { met: checks.hasUpper, text: 'One uppercase letter' },
    { met: checks.hasLower, text: 'One lowercase letter' },
    { met: checks.hasNumber, text: 'One number' },
    { met: checks.hasSpecial, text: 'One special character' }
  ];

  return items.map(function (item) {
    var iconSvg = item.met
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
    return '<div class="requirement-item ' + (item.met ? 'met' : '') + '"><span class="requirement-icon">' + iconSvg + '</span><span>' + item.text + '</span></div>';
  }).join('');
}

// ============================================
// Password Match Indicator
// ============================================
function updateCPPasswordMatch(password, confirmPassword) {
  var matchEl = document.getElementById('cp-password-match-indicator');
  if (!matchEl) return;

  if (!confirmPassword) {
    matchEl.innerHTML = '';
    matchEl.className = 'password-match';
    return;
  }

  if (password === confirmPassword) {
    matchEl.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg><span>Passwords match</span>';
    matchEl.className = 'password-match match';
  } else {
    matchEl.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg><span>Passwords do not match</span>';
    matchEl.className = 'password-match no-match';
  }
}

// ============================================
// Submit State Management
// ============================================
function updateCPSubmitState() {
  var submitBtn = document.getElementById('cp-submit-btn');
  if (!submitBtn) return;

  var currentPassword = document.getElementById('cp-current-password');
  var newPassword = document.getElementById('cp-new-password');
  var confirmPassword = document.getElementById('cp-confirm-password');

  var canSubmit = (
    currentPassword && currentPassword.value.length > 0 &&
    newPassword && newPassword.value.length >= 8 &&
    confirmPassword && confirmPassword.value.length > 0 &&
    newPassword.value === confirmPassword.value &&
    newPassword.value !== currentPassword.value
  );

  submitBtn.disabled = !canSubmit;
}

// ============================================
// Button Loading State
// ============================================
function setCPButtonLoading(button, isLoading) {
  if (isLoading) {
    button.disabled = true;
    button.classList.add('btn-loading');
    button.setAttribute('aria-busy', 'true');
    button.dataset.originalText = button.innerHTML;
    button.innerHTML = 'Updating password...';
  } else {
    button.classList.remove('btn-loading');
    button.setAttribute('aria-busy', 'false');
    button.innerHTML = button.dataset.originalText || 'Update Password';
    updateCPSubmitState();
  }
}

// ============================================
// Password Toggle Icon
// ============================================
function updateCPToggleIcon(toggle, type) {
  var svg = toggle.querySelector('svg');
  if (!svg) return;
  if (type === 'password') {
    svg.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>';
  } else {
    svg.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>';
  }
}

// ============================================
// Success State
// ============================================
function showCPSuccessState() {
  ChangePasswordState.isSuccess = true;
  var card = document.querySelector('.change-password-card');

  if (!card) return;

  card.innerHTML = `
    <div class="cp-success-container">
      <div class="cp-success-icon">
        <svg width="40" height="40" viewBox="0 0 52 52">
          <circle class="checkmark-circle" cx="26" cy="26" r="25" fill="none" stroke="currentColor" stroke-width="2"/>
          <path class="checkmark-check" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
        </svg>
      </div>
      <h2 class="cp-success-title">Password Updated Successfully</h2>
      <p class="cp-success-message">Your password has been changed. You'll be redirected to the dashboard shortly.</p>
      <div class="cp-success-countdown">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
        Redirecting in <span class="countdown-number" id="cp-countdown-number">3</span> seconds
      </div>
    </div>
  `;

  Toast.success('Password updated successfully!');

  // Start 3-second countdown
  var countdownEl = document.getElementById('cp-countdown-number');
  var seconds = 3;

  if (ChangePasswordState.countdownInterval) {
    clearInterval(ChangePasswordState.countdownInterval);
  }

  ChangePasswordState.countdownInterval = setInterval(function () {
    seconds--;
    if (countdownEl) countdownEl.textContent = seconds;

    if (seconds <= 0) {
      clearInterval(ChangePasswordState.countdownInterval);
      ChangePasswordState.countdownInterval = null;
      navigateTo('dashboard');
    }
  }, 1000);
}

// ============================================
// Simulated API Call
// ============================================
function simulateChangePassword(data) {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      if (data.currentPassword && data.newPassword && data.newPassword.length >= 8) {
        resolve({ success: true, message: 'Password updated successfully' });
      } else {
        reject(new Error('Failed to update password'));
      }
    }, 1500);
  });
}

// ============================================
// Change Password HTML Template
// ============================================
function getChangePasswordHTML() {
  return `
  <div class="change-password-container">
    <button class="theme-toggle" aria-label="Toggle dark mode">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        ${AppState.theme === 'dark' ? sunIcon : moonIcon}
      </svg>
    </button>

    <div class="change-password-card animate-scale-in">
      <div class="change-password-header">
        <div class="change-password-logo">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
        <h1 class="change-password-title">Change Password</h1>
        <p class="change-password-subtitle">Update your password to keep your account secure</p>
      </div>

      <form id="change-password-form" novalidate>
        <!-- Current Password -->
        <div class="cp-password-group">
          <div class="cp-password-label">
            <label for="cp-current-password" class="form-label required">Current Password</label>
          </div>
          <div class="input-wrapper">
            <input type="password" id="cp-current-password" name="currentPassword" class="form-input" placeholder="Enter current password" autocomplete="current-password" required aria-describedby="cp-current-password-error">
            <button type="button" class="cp-password-toggle password-toggle" data-target="cp-current-password" aria-label="Show password">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
          </div>
          <div id="cp-current-password-error" class="form-error" role="alert" style="display:none"></div>
        </div>

        <!-- New Password -->
        <div class="cp-password-group">
          <div class="cp-password-label">
            <label for="cp-new-password" class="form-label required">New Password</label>
          </div>
          <div class="input-wrapper">
            <input type="password" id="cp-new-password" name="newPassword" class="form-input" placeholder="Create a new password" autocomplete="new-password" required aria-describedby="cp-new-password-error" minlength="8">
            <button type="button" class="cp-password-toggle password-toggle" data-target="cp-new-password" aria-label="Show password">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
          </div>
          <div id="cp-new-password-error" class="form-error" role="alert" style="display:none"></div>

          <!-- New = Current Warning -->
          <div id="cp-same-password-warning" class="cp-same-password-warning">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            <span>New password must be different from current password</span>
          </div>

          <!-- Strength Meter -->
          <div class="strength-meter">
            <div class="strength-bar">
              <div id="cp-strength-fill" class="strength-fill"></div>
            </div>
            <div class="strength-label-row">
              <span id="cp-strength-text" class="strength-text"></span>
            </div>
            <div id="cp-strength-tips" class="strength-tips"></div>
            <div id="cp-password-requirements" class="password-requirements"></div>
          </div>
        </div>

        <!-- Confirm New Password -->
        <div class="cp-password-group">
          <div class="cp-password-label">
            <label for="cp-confirm-password" class="form-label required">Confirm New Password</label>
          </div>
          <div class="input-wrapper">
            <input type="password" id="cp-confirm-password" name="confirmPassword" class="form-input" placeholder="Confirm your new password" autocomplete="new-password" required aria-describedby="cp-confirm-password-error">
            <button type="button" class="cp-password-toggle password-toggle" data-target="cp-confirm-password" aria-label="Show password">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
          </div>
          <div id="cp-confirm-password-error" class="form-error" role="alert" style="display:none"></div>
          <div id="cp-password-match-indicator" class="password-match"></div>
        </div>

        <!-- Button Row -->
        <div class="cp-button-row">
          <button type="button" id="cp-cancel-btn" class="btn-cancel">Cancel</button>
          <button type="submit" id="cp-submit-btn" class="btn-update-password" disabled aria-disabled="true">
            Update Password
          </button>
        </div>
      </form>

      <div class="change-password-footer">
        <p><a href="#dashboard">Back to Dashboard</a></p>
      </div>
    </div>
  </div>`;
}
