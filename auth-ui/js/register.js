/* ============================================
   Register — Registration Form Logic & Validation
   ============================================ */

// Registration Form State
const RegisterState = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: '',
  termsAccepted: false,
  errors: {},
  isLoading: false
};

// Role definitions with icons and descriptions
const ROLES = {
  admin: {
    name: 'Admin',
    description: 'Full access to all features and settings',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>'
  },
  user: {
    name: 'User',
    description: 'Standard access with content creation',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>'
  },
  editor: {
    name: 'Editor',
    description: 'Edit and manage content across the platform',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>'
  }
};

// Password strength tips
const STRENGTH_TIPS = {
  0: 'Password is too short',
  1: 'Try adding uppercase or special characters',
  2: 'Good! Add numbers or special characters',
  3: 'Strong! Make it longer for maximum security',
  4: 'Excellent! Your password is very strong'
};

// ============================================
// Initialize Registration View
// ============================================
function initRegisterView() {
  const form = document.getElementById('register-form');
  const firstNameInput = document.getElementById('firstName');
  const lastNameInput = document.getElementById('lastName');
  const emailInput = document.getElementById('reg-email');
  const passwordInput = document.getElementById('reg-password');
  const confirmPasswordInput = document.getElementById('reg-confirm-password');
  const termsCheckbox = document.getElementById('terms-checkbox');
  const submitBtn = document.getElementById('register-submit');
  const themeToggle = document.querySelector('.theme-toggle');

  // Form submission
  if (form) {
    form.addEventListener('submit', handleRegisterSubmit);
  }

  // Blur validation
  if (firstNameInput) {
    firstNameInput.addEventListener('blur', function () { validateFirstNameField(firstNameInput); });
    firstNameInput.addEventListener('input', function () { clearFieldError(firstNameInput); });
  }
  if (lastNameInput) {
    lastNameInput.addEventListener('blur', function () { validateLastNameField(lastNameInput); });
    lastNameInput.addEventListener('input', function () { clearFieldError(lastNameInput); });
  }
  if (emailInput) {
    emailInput.addEventListener('blur', function () { validateRegEmailField(emailInput); });
    emailInput.addEventListener('input', function () { clearFieldError(emailInput); });
  }

  // Password strength meter — real-time on every keystroke
  if (passwordInput) {
    passwordInput.addEventListener('input', function () {
      clearFieldError(passwordInput);
      updateStrengthMeter(passwordInput.value);
      // Also update match indicator if confirm has a value
      if (confirmPasswordInput && confirmPasswordInput.value) {
        updatePasswordMatch(passwordInput.value, confirmPasswordInput.value);
      }
      updateSubmitState();
    });

    passwordInput.addEventListener('blur', function () { validateRegPasswordField(passwordInput); });
  }

  // Confirm password — real-time match check
  if (confirmPasswordInput) {
    confirmPasswordInput.addEventListener('input', function () {
      clearFieldError(confirmPasswordInput);
      if (passwordInput) {
        updatePasswordMatch(passwordInput.value, confirmPasswordInput.value);
      }
      updateSubmitState();
    });

    confirmPasswordInput.addEventListener('blur', function () { validateConfirmPasswordField(confirmPasswordInput); });
  }

  // Password toggles
  document.querySelectorAll('.reg-password-toggle').forEach(function (toggle) {
    toggle.addEventListener('click', function () {
      const targetId = toggle.dataset.target;
      const targetInput = document.getElementById(targetId);
      if (targetInput) {
        const type = targetInput.type === 'password' ? 'text' : 'password';
        targetInput.type = type;
        toggle.setAttribute('aria-label', type === 'password' ? 'Show password' : 'Hide password');
        updateRegPasswordToggleIcon(toggle, type);
      }
    });
  });

  // Role selector
  document.querySelectorAll('.role-option input[type="radio"]').forEach(function (radio) {
    radio.addEventListener('change', function () {
      RegisterState.role = radio.value;
      document.querySelectorAll('.role-description-text').forEach(function (el) { el.style.display = 'none'; });
      var descEl = document.getElementById('role-desc-' + radio.value);
      if (descEl) descEl.style.display = 'block';
      updateSubmitState();
    });
  });

  // Terms checkbox
  if (termsCheckbox) {
    termsCheckbox.addEventListener('change', function () {
      RegisterState.termsAccepted = termsCheckbox.checked;
      updateSubmitState();
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

  // Social buttons
  document.querySelectorAll('.register-card .btn-social').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      Toast.info(e.currentTarget.dataset.provider + ' signup coming soon!');
    });
  });

  // Focus first input
  if (firstNameInput) firstNameInput.focus();
}

// ============================================
// Form Submission
// ============================================
async function handleRegisterSubmit(e) {
  e.preventDefault();

  var firstNameInput = document.getElementById('firstName');
  var lastNameInput = document.getElementById('lastName');
  var emailInput = document.getElementById('reg-email');
  var passwordInput = document.getElementById('reg-password');
  var confirmPasswordInput = document.getElementById('reg-confirm-password');
  var submitBtn = document.getElementById('register-submit');

  // Validate all
  var v1 = validateFirstNameField(firstNameInput);
  var v2 = validateLastNameField(lastNameInput);
  var v3 = validateRegEmailField(emailInput);
  var v4 = validateRegPasswordField(passwordInput);
  var v5 = validateConfirmPasswordField(confirmPasswordInput);

  if (!v1 || !v2 || !v3 || !v4 || !v5) return;
  if (!RegisterState.role) {
    Toast.warning('Please select a role');
    return;
  }
  if (!RegisterState.termsAccepted) {
    Toast.warning('Please accept the terms and conditions');
    return;
  }

  // Set loading
  setRegButtonLoading(submitBtn, true);
  RegisterState.isLoading = true;
  RegisterState.firstName = firstNameInput.value.trim();
  RegisterState.lastName = lastNameInput.value.trim();
  RegisterState.email = emailInput.value.trim();
  RegisterState.password = passwordInput.value;

  try {
    await simulateRegister(RegisterState);
    Toast.success('Account created successfully! Redirecting to login...');
    setTimeout(function () { navigateTo('login'); }, 1500);
  } catch (error) {
    Toast.error(error.message || 'Registration failed. Please try again.');
    shakeElement(document.querySelector('.register-card'));
  } finally {
    setRegButtonLoading(submitBtn, false);
    RegisterState.isLoading = false;
  }
}

// ============================================
// Validation Functions
// ============================================
function validateFirstNameField(input) {
  var value = input.value.trim();
  var errorEl = document.getElementById('firstName-error');
  if (!value) { setFieldError(input, errorEl, 'First name is required'); return false; }
  if (value.length < 2) { setFieldError(input, errorEl, 'Must be at least 2 characters'); return false; }
  clearFieldError(input); setFieldSuccess(input); return true;
}

function validateLastNameField(input) {
  var value = input.value.trim();
  var errorEl = document.getElementById('lastName-error');
  if (!value) { setFieldError(input, errorEl, 'Last name is required'); return false; }
  if (value.length < 2) { setFieldError(input, errorEl, 'Must be at least 2 characters'); return false; }
  clearFieldError(input); setFieldSuccess(input); return true;
}

function validateRegEmailField(input) {
  var value = input.value.trim();
  var errorEl = document.getElementById('reg-email-error');
  if (!value) { setFieldError(input, errorEl, 'Email is required'); return false; }
  if (!isValidEmail(value)) { setFieldError(input, errorEl, 'Please enter a valid email address'); return false; }
  clearFieldError(input); setFieldSuccess(input); return true;
}

function validateRegPasswordField(input) {
  var value = input.value;
  var errorEl = document.getElementById('reg-password-error');
  if (!value) { setFieldError(input, errorEl, 'Password is required'); return false; }
  if (value.length < 8) { setFieldError(input, errorEl, 'Password must be at least 8 characters'); return false; }
  var result = validatePassword(value);
  if (!result.valid) { setFieldError(input, errorEl, result.message); return false; }
  clearFieldError(input); setFieldSuccess(input); return true;
}

function validateConfirmPasswordField(input) {
  var value = input.value;
  var passwordInput = document.getElementById('reg-password');
  var errorEl = document.getElementById('reg-confirm-password-error');
  if (!value) { setFieldError(input, errorEl, 'Please confirm your password'); return false; }
  if (passwordInput && value !== passwordInput.value) { setFieldError(input, errorEl, 'Passwords do not match'); return false; }
  clearFieldError(input); setFieldSuccess(input); return true;
}

// ============================================
// Password Strength Meter
// ============================================
function updateStrengthMeter(password) {
  var fill = document.getElementById('strength-fill');
  var text = document.getElementById('strength-text');
  var tips = document.getElementById('strength-tips');
  var requirementsContainer = document.getElementById('password-requirements');

  if (!password) {
    if (fill) { fill.className = 'strength-fill'; fill.style.width = '0%'; }
    if (text) { text.textContent = ''; text.className = 'strength-text'; }
    if (tips) { tips.innerHTML = ''; }
    if (requirementsContainer) requirementsContainer.innerHTML = '';
    return;
  }

  var result = validatePassword(password);
  var level = result.strength;
  // Map to 0-4: 0=empty/weak, 1=weak, 2=fair, 3=strong, 4=very strong
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
    tips.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>' + STRENGTH_TIPS[displayLevel];
  }

  // Update requirements checklist
  if (requirementsContainer) {
    requirementsContainer.innerHTML = buildRequirementsHTML(result.checks, password.length >= 8, password.length >= 12);
  }
}

function buildRequirementsHTML(checks, minLen, longEnough) {
  var items = [
    { met: minLen, text: 'At least 8 characters' },
    { met: checks.hasUpper, text: 'Uppercase letter (A-Z)' },
    { met: checks.hasLower, text: 'Lowercase letter (a-z)' },
    { met: checks.hasNumber, text: 'Number (0-9)' },
    { met: checks.hasSpecial, text: 'Special character (!@#$)' }
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
function updatePasswordMatch(password, confirmPassword) {
  var matchEl = document.getElementById('password-match-indicator');
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
function updateSubmitState() {
  var submitBtn = document.getElementById('register-submit');
  if (!submitBtn) return;

  var password = document.getElementById('reg-password');
  var confirmPassword = document.getElementById('reg-confirm-password');
  var canSubmit = (
    RegisterState.termsAccepted &&
    RegisterState.role &&
    password && password.value.length >= 8 &&
    confirmPassword && confirmPassword.value.length > 0 &&
    password.value === confirmPassword.value
  );

  submitBtn.disabled = !canSubmit;
}

// ============================================
// Button Loading State
// ============================================
function setRegButtonLoading(button, isLoading) {
  if (isLoading) {
    button.disabled = true;
    button.classList.add('btn-loading');
    button.setAttribute('aria-busy', 'true');
    button.dataset.originalText = button.innerHTML;
    button.innerHTML = 'Creating account...';
  } else {
    button.classList.remove('btn-loading');
    button.setAttribute('aria-busy', 'false');
    button.innerHTML = button.dataset.originalText || 'Create Account';
    // Re-check submit state after loading completes
    updateSubmitState();
  }
}

// ============================================
// Password Toggle Icon
// ============================================
function updateRegPasswordToggleIcon(toggle, type) {
  var svg = toggle.querySelector('svg');
  if (!svg) return;
  if (type === 'password') {
    svg.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>';
  } else {
    svg.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>';
  }
}

// ============================================
// Simulated API Call
// ============================================
function simulateRegister(data) {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      if (data.email && data.password.length >= 8) {
        resolve({ success: true, user: { email: data.email, name: data.firstName + ' ' + data.lastName } });
      } else {
        reject(new Error('Registration failed — invalid data'));
      }
    }, 1500);
  });
}

// ============================================
// Registration HTML Template
// ============================================
function getRegisterHTML() {
  return `
  <div class="register-container">
    <button class="theme-toggle" aria-label="Toggle dark mode">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        ${AppState.theme === 'dark' ? sunIcon : moonIcon}
      </svg>
    </button>

    <div class="register-card animate-scale-in">
      <div class="register-header">
        <div class="register-logo">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="8.5" cy="7" r="4"></circle>
            <line x1="20" y1="8" x2="20" y2="14"></line>
            <line x1="23" y1="11" x2="17" y2="11"></line>
          </svg>
        </div>
        <h1 class="register-title">Create Account</h1>
        <p class="register-subtitle">Join us and start building amazing things</p>
      </div>

      <form id="register-form" novalidate>
        <!-- Name Row -->
        <div class="name-row">
          <div class="form-group">
            <label for="firstName" class="form-label required">First Name</label>
            <div class="input-wrapper">
              <input type="text" id="firstName" name="firstName" class="form-input" placeholder="John" autocomplete="given-name" required aria-describedby="firstName-error" minlength="2">
            </div>
            <div id="firstName-error" class="form-error" role="alert" style="display:none"></div>
          </div>
          <div class="form-group">
            <label for="lastName" class="form-label required">Last Name</label>
            <div class="input-wrapper">
              <input type="text" id="lastName" name="lastName" class="form-input" placeholder="Doe" autocomplete="family-name" required aria-describedby="lastName-error" minlength="2">
            </div>
            <div id="lastName-error" class="form-error" role="alert" style="display:none"></div>
          </div>
        </div>

        <!-- Email -->
        <div class="form-group" style="margin-top: var(--space-4)">
          <label for="reg-email" class="form-label required">Email Address</label>
          <div class="input-wrapper">
            <input type="email" id="reg-email" name="email" class="form-input" placeholder="you@example.com" autocomplete="email" required aria-describedby="reg-email-error">
            <svg class="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
          </div>
          <div id="reg-email-error" class="form-error" role="alert" style="display:none"></div>
        </div>

        <!-- Password -->
        <div class="form-group" style="margin-top: var(--space-4)">
          <label for="reg-password" class="form-label required">Password</label>
          <div class="input-wrapper">
            <input type="password" id="reg-password" name="password" class="form-input" placeholder="Create a strong password" autocomplete="new-password" required aria-describedby="reg-password-error" minlength="8">
            <button type="button" class="reg-password-toggle password-toggle" data-target="reg-password" aria-label="Show password">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
          </div>
          <div id="reg-password-error" class="form-error" role="alert" style="display:none"></div>

          <!-- Strength Meter -->
          <div class="strength-meter">
            <div class="strength-bar">
              <div id="strength-fill" class="strength-fill"></div>
            </div>
            <div class="strength-label-row">
              <span id="strength-text" class="strength-text"></span>
            </div>
            <div id="strength-tips" class="strength-tips"></div>
            <div id="password-requirements" class="password-requirements"></div>
          </div>
        </div>

        <!-- Confirm Password -->
        <div class="form-group" style="margin-top: var(--space-4)">
          <label for="reg-confirm-password" class="form-label required">Confirm Password</label>
          <div class="input-wrapper">
            <input type="password" id="reg-confirm-password" name="confirmPassword" class="form-input" placeholder="Confirm your password" autocomplete="new-password" required aria-describedby="reg-confirm-password-error">
            <button type="button" class="reg-password-toggle password-toggle" data-target="reg-confirm-password" aria-label="Show password">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
          </div>
          <div id="reg-confirm-password-error" class="form-error" role="alert" style="display:none"></div>
          <div id="password-match-indicator" class="password-match"></div>
        </div>

        <!-- Role Selector -->
        <div class="form-group" style="margin-top: var(--space-4)">
          <span class="role-selector-label">Select your role</span>
          <div class="role-selector" role="radiogroup" aria-label="Account role">
            <div class="role-options">
              <div class="role-option">
                <input type="radio" id="role-admin" name="role" value="admin">
                <label for="role-admin">
                  <div class="role-icon">${ROLES.admin.icon}</div>
                  <span class="role-name">${ROLES.admin.name}</span>
                </label>
              </div>
              <div class="role-option">
                <input type="radio" id="role-user" name="role" value="user">
                <label for="role-user">
                  <div class="role-icon">${ROLES.user.icon}</div>
                  <span class="role-name">${ROLES.user.name}</span>
                </label>
              </div>
              <div class="role-option">
                <input type="radio" id="role-editor" name="role" value="editor">
                <label for="role-editor">
                  <div class="role-icon">${ROLES.editor.icon}</div>
                  <span class="role-name">${ROLES.editor.name}</span>
                </label>
              </div>
            </div>
          </div>
          <div id="role-desc-admin" class="role-description-text" style="display:none; text-align:center; margin-top:var(--space-2); font-size:var(--font-size-xs); color:var(--text-tertiary);">${ROLES.admin.description}</div>
          <div id="role-desc-user" class="role-description-text" style="display:none; text-align:center; margin-top:var(--space-2); font-size:var(--font-size-xs); color:var(--text-tertiary);">${ROLES.user.description}</div>
          <div id="role-desc-editor" class="role-description-text" style="display:none; text-align:center; margin-top:var(--space-2); font-size:var(--font-size-xs); color:var(--text-tertiary);">${ROLES.editor.description}</div>
        </div>

        <!-- Terms Checkbox -->
        <div class="terms-wrapper">
          <div class="terms-checkbox">
            <input type="checkbox" id="terms-checkbox">
            <div class="checkmark">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          </div>
          <label for="terms-checkbox" class="terms-label">
            I agree to the <a href="#terms">Terms of Service</a> and <a href="#privacy">Privacy Policy</a>
          </label>
        </div>

        <!-- Submit -->
        <button type="submit" id="register-submit" class="btn btn-primary btn-create-account" disabled aria-disabled="true">
          Create Account
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

      <div class="register-footer">
        <p class="login-link">Already have an account? <a href="#login">Sign in</a></p>
      </div>
    </div>
  </div>`;
}