/* ============================================
   MFA / OTP Verification — Two-Factor Auth UI
   ============================================ */

// MFA State
const MFAState = {
  currentView: 'otp', // 'otp' | 'qr' | 'backup'
  otpCode: ['', '', '', '', '', ''],
  backupCode: '',
  isLoading: false,
  expirySeconds: 300, // 5 minutes
  resendCooldown: 30,
  expiryInterval: null,
  resendInterval: null,
  backupCodesRemaining: 5,
  secretKey: 'ABCD EFGH IJKL'
};

// ============================================
// Initialize MFA View
// ============================================
function initMFAVerifyView() {
  renderMFAState(MFAState.currentView);
}

function renderMFAState(view) {
  MFAState.currentView = view;
  var card = document.querySelector('.mfa-card');
  if (!card) {
    // First render - card not in DOM yet
    return;
  }

  card.classList.add('fade-out');
  setTimeout(function () {
    switch (view) {
      case 'otp': card.innerHTML = getOTPTemplate(); initOTPHandlers(); break;
      case 'qr': card.innerHTML = getQRTemplate(); initQRHandlers(); break;
      case 'backup': card.innerHTML = getBackupTemplate(); initBackupHandlers(); break;
    }
    card.classList.remove('fade-out');
    card.classList.add('fade-in');
    setTimeout(function () { card.classList.remove('fade-in'); }, 300);
  }, 200);
}

// ============================================
// OTP State — Input Handlers
// ============================================
function initOTPHandlers() {
  var inputs = document.querySelectorAll('.otp-input');
  var verifyBtn = document.getElementById('verify-btn');
  var resendBtn = document.getElementById('resend-btn');
  var backupBtn = document.getElementById('use-backup-btn');
  var themeToggle = document.querySelector('.theme-toggle');

  // Auto-focus first input
  if (inputs[0]) inputs[0].focus();

  // OTP input event listeners
  inputs.forEach(function (input, index) {
    // Handle input (digit entry)
    input.addEventListener('input', function (e) {
      var value = e.target.value.replace(/[^0-9]/g, '');
      e.target.value = value.slice(0, 1);
      MFAState.otpCode[index] = value;

      if (value && index < inputs.length - 1) {
        inputs[index + 1].focus();
      }

      // Visual feedback
      if (value) {
        input.classList.add('filled');
      } else {
        input.classList.remove('filled');
      }

      updateVerifyButton();
    });

    // Handle keydown (backspace navigation)
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Backspace' && !input.value && index > 0) {
        inputs[index - 1].focus();
        inputs[index - 1].value = '';
        inputs[index - 1].classList.remove('filled');
        MFAState.otpCode[index - 1] = '';
        updateVerifyButton();
      }

      // Arrow keys navigation
      if (e.key === 'ArrowLeft' && index > 0) {
        inputs[index - 1].focus();
      }
      if (e.key === 'ArrowRight' && index < inputs.length - 1) {
        inputs[index + 1].focus();
      }
    });

    // Handle paste
    input.addEventListener('paste', function (e) {
      e.preventDefault();
      var pasteData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);

      if (pasteData.length === 6) {
        for (var i = 0; i < 6; i++) {
          inputs[i].value = pasteData[i];
          inputs[i].classList.add('filled');
          MFAState.otpCode[i] = pasteData[i];
        }
        inputs[5].focus();
        updateVerifyButton();
      }
    });

    // Handle focus — select content
    input.addEventListener('focus', function () {
      input.select();
    });
  });

  // Verify button
  if (verifyBtn) {
    verifyBtn.addEventListener('click', handleOTPVerify);
  }

  // Resend button
  if (resendBtn) {
    resendBtn.addEventListener('click', handleResend);
    startResendCooldown();
  }

  // Backup code link
  if (backupBtn) {
    backupBtn.addEventListener('click', function (e) {
      e.preventDefault();
      renderMFAState('backup');
    });
  }

  // Theme toggle
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
    var svg = themeToggle.querySelector('svg');
    if (svg) svg.innerHTML = AppState.theme === 'dark' ? sunIcon : moonIcon;
  }

  // Start expiry timer
  startExpiryTimer();
}

function updateVerifyButton() {
  var btn = document.getElementById('verify-btn');
  if (!btn) return;
  var allFilled = MFAState.otpCode.every(function (d) { return d !== ''; });
  btn.disabled = !allFilled;
  if (allFilled) {
    btn.classList.add('all-filled');
    setTimeout(function () { btn.classList.remove('all-filled'); }, 600);
  } else {
    btn.classList.remove('all-filled');
  }
}

// ============================================
// OTP Verify Handler
// ============================================
async function handleOTPVerify() {
  var btn = document.getElementById('verify-btn');
  if (!btn || btn.disabled) return;

  var code = MFAState.otpCode.join('');
  btn.disabled = true;
  btn.innerHTML = '<svg class="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle><path d="M12 2a10 10 0 0 1 10 10" stroke-opacity="1"></path></svg> Verifying...';
  MFAState.isLoading = true;

  try {
    await simulateVerify(code);
    Toast.success('Verification successful! Redirecting...');
    setTimeout(function () { navigateTo('dashboard'); }, 1200);
  } catch (error) {
    Toast.error(error.message || 'Invalid code. Please try again.');
    // Shake the inputs
    document.querySelectorAll('.otp-input').forEach(function (inp) {
      inp.classList.add('error');
      setTimeout(function () { inp.classList.remove('error'); }, 500);
    });
    btn.disabled = false;
    btn.innerHTML = 'Verify';
  } finally {
    MFAState.isLoading = false;
  }
}

// ============================================
// Resend Handler
// ============================================
async function handleResend() {
  if (MFAState.resendCooldown > 0) return;
  var resendBtn = document.getElementById('resend-btn');

  try {
    await simulateResend();
    Toast.success('New code sent!');
    startResendCooldown();
    // Reset expiry timer
    MFAState.expirySeconds = 300;
    startExpiryTimer();
  } catch (error) {
    Toast.error('Failed to resend code.');
  }
}

// ============================================
// Timers
// ============================================
function startExpiryTimer() {
  if (MFAState.expiryInterval) clearInterval(MFAState.expiryInterval);

  var timerEl = document.getElementById('expiry-timer');
  MFAState.expiryInterval = setInterval(function () {
    MFAState.expirySeconds--;
    if (timerEl) {
      var m = Math.floor(MFAState.expirySeconds / 60);
      var s = MFAState.expirySeconds % 60;
      timerEl.textContent = m + ':' + String(s).padStart(2, '0');
    }

    // Color states
    var display = document.querySelector('.timer-display');
    if (display) {
      display.classList.remove('warning', 'danger');
      if (MFAState.expirySeconds <= 60) display.classList.add('danger');
      else if (MFAState.expirySeconds <= 120) display.classList.add('warning');
    }

    if (MFAState.expirySeconds <= 0) {
      clearInterval(MFAState.expiryInterval);
      Toast.warning('Code expired. Please request a new one.');
    }
  }, 1000);
}

function startResendCooldown() {
  if (MFAState.resendInterval) clearInterval(MFAState.resendInterval);
  MFAState.resendCooldown = 30;
  updateResendDisplay();

  MFAState.resendInterval = setInterval(function () {
    MFAState.resendCooldown--;
    updateResendDisplay();
    if (MFAState.resendCooldown <= 0) {
      clearInterval(MFAState.resendInterval);
      enableResend();
    }
  }, 1000);
}

function updateResendDisplay() {
  var el = document.getElementById('resend-text');
  var btn = document.getElementById('resend-btn');
  if (el) el.textContent = 'Resend in ' + MFAState.resendCooldown + 's';
  if (btn) btn.disabled = MFAState.resendCooldown > 0;
}

function enableResend() {
  var el = document.getElementById('resend-text');
  var btn = document.getElementById('resend-btn');
  if (el) el.textContent = 'Resend Code';
  if (btn) btn.disabled = false;
}

// ============================================
// QR Setup Handlers
// ============================================
function initQRHandlers() {
  var scannedBtn = document.getElementById('scanned-btn');
  var copyBtn = document.getElementById('copy-secret-btn');
  var themeToggle = document.querySelector('.theme-toggle');

  if (scannedBtn) {
    scannedBtn.addEventListener('click', function () {
      renderMFAState('otp');
    });
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var secret = MFAState.secretKey.replace(/\s/g, '');
      navigator.clipboard.writeText(secret).then(function () {
        copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Copied!';
        copyBtn.classList.add('copied');
        setTimeout(function () {
          copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Copy';
          copyBtn.classList.remove('copied');
        }, 2000);
      });
    });
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
    var svg = themeToggle.querySelector('svg');
    if (svg) svg.innerHTML = AppState.theme === 'dark' ? sunIcon : moonIcon;
  }
}

// ============================================
// Backup Code Handlers
// ============================================
function initBackupHandlers() {
  var input = document.getElementById('backup-code-input');
  var verifyBtn = document.getElementById('backup-verify-btn');
  var cancelBtn = document.getElementById('backup-cancel-btn');
  var themeToggle = document.querySelector('.theme-toggle');

  if (input) input.focus();

  if (input) {
    input.addEventListener('input', function () {
      var val = input.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8);
      input.value = val;
      if (verifyBtn) verifyBtn.disabled = val.length < 8;
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && verifyBtn && !verifyBtn.disabled) {
        handleBackupVerify();
      }
    });
  }

  if (verifyBtn) {
    verifyBtn.disabled = true;
    verifyBtn.addEventListener('click', handleBackupVerify);
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', function (e) {
      e.preventDefault();
      renderMFAState('otp');
    });
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
    var svg = themeToggle.querySelector('svg');
    if (svg) svg.innerHTML = AppState.theme === 'dark' ? sunIcon : moonIcon;
  }
}

async function handleBackupVerify() {
  var input = document.getElementById('backup-code-input');
  var btn = document.getElementById('backup-verify-btn');
  if (!input || !btn) return;

  btn.disabled = true;
  btn.innerHTML = '<svg class="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle><path d="M12 2a10 10 0 0 1 10 10" stroke-opacity="1"></path></svg> Verifying...';

  try {
    await simulateBackupVerify(input.value);
    MFAState.backupCodesRemaining--;
    Toast.success('Backup code verified! Redirecting...');
    setTimeout(function () { navigateTo('dashboard'); }, 1200);
  } catch (error) {
    Toast.error(error.message || 'Invalid backup code.');
    btn.disabled = false;
    btn.innerHTML = 'Verify Backup Code';
  }
}

// ============================================
// Simulated API Calls
// ============================================
function simulateVerify(code) {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      if (code.length === 6) resolve({ success: true });
      else reject(new Error('Invalid OTP code'));
    }, 1500);
  });
}

function simulateResend() {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      MFAState.otpCode = ['', '', '', '', '', ''];
      resolve({ success: true });
    }, 1000);
  });
}

function simulateBackupVerify(code) {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      if (code.length === 8) resolve({ success: true });
      else reject(new Error('Invalid backup code'));
    }, 1500);
  });
}

// ============================================
// HTML Templates
// ============================================
function getOTPHTML() {
  return '<div class="mfa-container"><button class="theme-toggle" aria-label="Toggle dark mode"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' + (AppState.theme === 'dark' ? sunIcon : moonIcon) + '</svg></button><div class="mfa-card animate-scale-in">' + getOTPTemplate() + '</div></div>';
}

function getOTPTemplate() {
  return '<div class="mfa-state"><div class="mfa-header"><div class="mfa-icon shield"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg></div><h1 class="mfa-title">Two-Factor Authentication</h1><p class="mfa-subtitle">Enter the 6-digit code from your authenticator app</p></div><div class="otp-input-group" role="group" aria-label="One-time password"><input type="text" class="otp-input" inputmode="numeric" maxlength="1" autocomplete="one-time-code" aria-label="Digit 1 of 6"><input type="text" class="otp-input" inputmode="numeric" maxlength="1" aria-label="Digit 2 of 6"><input type="text" class="otp-input" inputmode="numeric" maxlength="1" aria-label="Digit 3 of 6"><input type="text" class="otp-input" inputmode="numeric" maxlength="1" aria-label="Digit 4 of 6"><input type="text" class="otp-input" inputmode="numeric" maxlength="1" aria-label="Digit 5 of 6"><input type="text" class="otp-input" inputmode="numeric" maxlength="1" aria-label="Digit 6 of 6"></div><div class="expiry-timer"><div class="timer-display"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>Code expires in <span id="expiry-timer" class="timer-value">5:00</span></div></div><div class="mfa-actions"><button type="button" id="verify-btn" class="btn btn-primary verify-btn" disabled>Verify</button><div class="resend-link">Didn\'t receive the code? <button type="button" id="resend-btn" disabled><span id="resend-text">Resend in 30s</span></button></div><div class="backup-link"><button type="button" id="use-backup-btn">Use a backup code</button></div></div></div>';
}

function getQRTemplate() {
  return '<div class="mfa-state"><div class="mfa-header"><div class="mfa-icon qr"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect></svg></div><h1 class="mfa-title">Scan QR Code</h1><p class="mfa-subtitle">Scan this code with Google Authenticator or Authy</p></div><div class="qr-code-wrapper"><div class="qr-code-image"><svg viewBox="0 0 200 200" fill="none" stroke="currentColor" stroke-width="2"><rect x="10" y="10" width="60" height="60" rx="4"></rect><rect x="20" y="20" width="40" height="40" rx="2" fill="currentColor"></rect><rect x="130" y="10" width="60" height="60" rx="4"></rect><rect x="140" y="20" width="40" height="40" rx="2" fill="currentColor"></rect><rect x="10" y="130" width="60" height="60" rx="4"></rect><rect x="20" y="140" width="40" height="40" rx="2" fill="currentColor"></rect><rect x="80" y="80" width="40" height="40" rx="2" fill="currentColor"></rect><rect x="130" y="130" width="60" height="60" rx="4"></rect><rect x="140" y="140" width="40" height="40" rx="2" fill="currentColor"></rect></svg></div><p class="qr-instructions">Scan this QR code with your authenticator app</p><div class="manual-entry"><p class="manual-entry-label">Can\'t scan? Enter this code manually:</p><div class="manual-entry-code"><span class="manual-code-value">' + MFAState.secretKey + '</span><button type="button" id="copy-secret-btn" class="copy-button"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Copy</button></div></div><button type="button" id="scanned-btn" class="btn btn-primary" style="width:100%;margin-top:var(--space-4)">I\'ve Scanned the Code</button></div></div>';
}

function getBackupTemplate() {
  return '<div class="mfa-state"><div class="mfa-header"><div class="mfa-icon key"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg></div><h1 class="mfa-title">Enter Backup Code</h1><p class="mfa-subtitle">Use one of your backup codes to sign in</p></div><div class="backup-code-wrapper"><div class="backup-code-input-group"><input type="text" id="backup-code-input" class="backup-code-input" placeholder="Enter 8-character code" maxlength="8" autocomplete="off" aria-label="Backup code"></div><div class="backup-code-note"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>Each backup code can only be used once. You have <span class="remaining-count">' + MFAState.backupCodesRemaining + '</span> remaining.</div></div><div class="mfa-actions"><button type="button" id="backup-verify-btn" class="btn btn-primary" style="width:100%" disabled>Verify Backup Code</button><div class="cancel-link"><button type="button" id="backup-cancel-btn">Back to OTP</button></div></div></div>';
}

function getMFAVerifyHTML() {
  return '<div class="mfa-container"><button class="theme-toggle" aria-label="Toggle dark mode"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' + (AppState.theme === 'dark' ? sunIcon : moonIcon) + '</svg></button><div class="mfa-card animate-scale-in">' + getOTPTemplate() + '</div></div>';
}