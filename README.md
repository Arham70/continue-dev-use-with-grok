# Advanced Auth UI Kit

A modern, accessible, single-page authentication UI built with vanilla HTML, CSS, and JavaScript. Features animated transitions, dark/light theme support, real-time validation, and WCAG AA compliance.

## Pages

| Page | Route | File | Description |
|------|-------|------|-------------|
| Login | `#login` | `js/login.js` | Email/password authentication with social login options |
| Register | `#register` | `js/register.js` | User sign-up with role selection, password strength meter |
| Forgot Password | `#forgot-password` | `js/forgot-password.js` | Password reset request flow |
| MFA Verification | `#mfa-verify` | `js/mfa.js` | Two-factor auth with OTP, QR setup, and backup codes |
| Change Password | `#change-password` | `js/change-password.js` | Authenticated password update with strength meter and success animation |
| Dashboard | `#dashboard` | `js/app.js` | Placeholder (coming in ONE-42) |

## Features

- **SPA Router** — Hash-based routing with animated page transitions
- **Dark/Light Theme** — Toggle with system preference detection
- **Password Strength Meter** — 4-level color-coded strength indicator with requirements checklist
- **Real-time Validation** — Blur + input validation with error/success states
- **Show/Hide Password Toggles** — Independent per field
- **Toast Notifications** — Success, error, warning, and info toasts
- **Loading States** — Spinner animations on submit buttons
- **Responsive Design** — Mobile-first with tablet and desktop breakpoints
- **WCAG AA Accessible** — ARIA labels, roles, focus management, keyboard navigation
- **Reduced Motion** — Respects `prefers-reduced-motion` preference

## Project Structure

```
auth-ui/
├── index.html          # SPA entry point
├── css/
│   ├── variables.css   # Design tokens (colors, spacing, typography)
│   ├── base.css        # Reset, typography, utility classes
│   ├── animations.css  # Keyframes and animation classes
│   ├── login.css       # Login page + shared form element styles
│   ├── register.css    # Registration page + strength meter styles
│   ├── forgot-password.css  # Forgot password page styles
│   ├── mfa.css         # MFA/OTP page styles
│   ├── change-password.css  # Change password page styles
│   └── responsive.css  # Media queries and responsive overrides
└── js/
    ├── utils.js        # Shared helpers (validation, toast, debounce)
    ├── login.js        # Login view logic
    ├── register.js     # Registration view logic
    ├── forgot-password.js  # Forgot password view logic
    ├── mfa.js          # MFA verification view logic
    ├── change-password.js  # Change password view logic
    └── app.js          # SPA router, state management, view registry
```

## Getting Started

Open `auth-ui/index.html` in a browser. No build step required.

## Change Password Page (ONE-41)

Accessible via `#change-password` route. Features:

- Current password verification field
- New password with strength meter (Weak → Very Strong)
- Requirements checklist with real-time ✓/✗ updates
- Confirm password with match indicator
- "New password must differ from current" validation
- Independent show/hide toggles on all 3 fields
- Loading spinner on submit
- Cancel button returns to dashboard
- Success animation (animated SVG checkmark) + 3-second auto-redirect countdown
- Shake animation on validation errors
- Toast notifications for success/error feedback

## Theming

Toggle between light and dark mode using the floating button in the top-right corner. The theme persists via `localStorage`.

## Browser Support

Modern browsers (Chrome, Firefox, Safari, Edge). No polyfills required.