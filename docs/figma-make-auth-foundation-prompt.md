# Figma Make Prompt: Auth Foundation

Use this prompt with the university logo attached as an image reference. The goal is to redesign only the authentication area for now and establish the visual foundation for the rest of the portal.

```text
Design a refined authentication flow for a university portal called InterHub for Dalian Neusoft University of Information.

Important context:
- This is not a startup SaaS product.
- The portal already works well from a UX perspective, so keep the flows simple, direct, and practical.
- The goal is to improve visual design quality while preserving the current straightforward UX.
- Do not design dashboards yet.
- Use the provided university logo on the auth screens. Do not replace it with a generic education icon.
- The university visual identity should be based on blue and white.

Visual direction:
- Serious, calm, trustworthy, academic, modern.
- Minimal and clean, but not sterile.
- Light theme only for this first concept.
- Avoid flashy gradients, neon accents, glassmorphism, playful startup visuals, cartoon illustrations, and generic "AI SaaS login page" styling.
- The interface should feel like an official university portal with better polish, spacing, typography, and hierarchy.
- Draw subtle inspiration from the circular university seal and architectural silhouette in the logo, but keep it understated.
- If you use decorative background elements, they should be very subtle: soft linework, faint seal geometry, restrained blue patterning, or low-contrast campus-inspired shapes.

Design foundations to create:
- Primary palette centered on institutional blue, white, and restrained neutrals.
- A slightly darker academic navy for primary actions and headers.
- A clean system for success, warning, and error states.
- Typography that works well for English, Russian, and Simplified Chinese.
- Form components: text field, password field, error message, inline help text, primary button, secondary text link, status card, success card.
- Consistent spacing, corner radius, border, and shadow system.

Product constraints:
- The product supports three languages: English, Russian, and Simplified Chinese.
- Include a language switcher dropdown on every auth screen.
- Design for desktop first, but also provide mobile-ready layouts or mobile variants for the main screens.
- Keep accessibility in mind: strong contrast, clear form labels, visible focus states, generous hit areas, readable error feedback.

Critical product logic:
- Registration is invitation-only. There is no open self-signup screen.
- Do not invent Google login, social login, SSO, captcha, remember me, onboarding tours, marketing sections, testimonials, or dashboard previews.
- The auth area should stay compact and focused.

Create a design system starter section plus these auth screens and states:

1. Login screen
Required UI:
- University logo.
- Product/university title.
- Subtitle for signing into the student portal / university portal.
- Language switcher in a clear but non-dominant position.
- Email field.
- Password field.
- "Forgot password?" link below or near the password field.
- Primary button: Login.
- Footer text for users without an account, pointing them to the invitation/contact flow.

Login behavior to reflect in the design:
- Validation errors can appear under email and password fields.
- There is a general error area for invalid credentials or account-level issues.
- A successful login leads to a role-based dashboard or dashboard selector, but do not design any post-login screens yet.
- Possible account states:
  - Invalid email or password.
  - Account not activated yet; in this case there should be a path to the invitation acceptance flow.
  - Account disabled.
  - Network error.
  - Session expired message.
- Keep the layout compact and serious. No promotional side panel.

2. Invitation acceptance screen (this is the real registration flow)
This screen is opened from an email invitation link with a token in the URL.

Required valid-state UI:
- University logo.
- Title: Accept invitation.
- Greeting that can show the invitee name if available, otherwise email.
- Display the invited email clearly.
- Password field.
- Confirm password field.
- Primary button: Activate.

Invitation acceptance rules and states to represent:
- Password must be at least 8 characters.
- Confirm password must match.
- Field-level errors can appear under the password fields.
- There is a submitting / activating state.
- After successful activation, the system signs the user in automatically.
- There is a temporary "Signing you in..." state.

Important non-happy-path states to design as variants or neighboring frames:
- No token in the URL.
- Token validation loading state.
- Network error while validating token, with a Retry action.
- Invalid link.
- Link already used.
- Invitation expired.
- Invitation cancelled.
- Invitation unavailable / not acceptable anymore.
- Token expired but a new invitation email was automatically sent; show this as a positive informational state with the recipient email when available.
- Activation failed because the link is no longer valid; offer a path back to sign in.

This invitation screen should feel like a secure account activation screen, not a casual signup page.

3. Forgot password screen
Required UI:
- University logo.
- Title: Password recovery.
- Short explanation that the user should enter their email and will receive a code.
- Language switcher.
- Email field.
- Primary button: Send code.
- Secondary link: Back to login.

Forgot password behavior to reflect:
- Client-side validation for required email and valid email format.
- Submitting state.
- Error state.
- Network error state.
- Success state after submit with a reassuring message:
  "If an account with this email exists, a message with instructions will be sent."
- In the success state, provide:
  - A strong action back to login.
  - A secondary path to the reset password screen.

4. Reset password screen
Required UI:
- University logo.
- Title: New password.
- Subtitle explaining that the user should enter the code from the email and the new password.
- Language switcher.
- Email field.
- Code from email field.
- New password field.
- Confirm password field.
- Primary button: Change password.
- Secondary links back to forgot password and login.

Reset password behavior to reflect:
- Email may be prefilled from a query parameter, so keep the field editable but allow a prefilled state.
- Code is required.
- New password must be at least 8 characters.
- Confirm password must match.
- Field-level validation messages should appear directly below the inputs.
- General error area for invalid or expired code and other API errors.
- Network error state.
- Success state confirming that the password was changed and the user can sign in.

Layout guidance:
- Preserve the strong simplicity of the current UX: focused auth card, clear sequence, no clutter.
- Improve visual hierarchy, spacing, and institutional polish.
- Prefer a centered auth card or a very restrained layout over a loud split-screen hero.
- On desktop, the screen can have a refined full-height background with subtle university-themed structure, but the form area must remain the focal point.
- On mobile, prioritize vertical rhythm, comfortable spacing, and clarity.

Output structure:
- A foundation section with colors, type styles, buttons, inputs, alerts, and card styles.
- Desktop auth screens for login, accept invitation, forgot password, and reset password.
- Key state variants for invitation errors, forgot-password success, and reset-password success.
- Mobile adaptations for the main auth screens.

Content tone:
- Formal, calm, clear, and helpful.
- No slang.
- No overly cheerful consumer-product language.

Use English UI copy in the main mockups if needed, but make the design clearly compatible with Russian and Simplified Chinese text length changes.
```
