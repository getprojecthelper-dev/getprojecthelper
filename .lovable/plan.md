# Rebuild the homepage, account flow, and code-level setup

## Homepage

- Recompose the landing page as a polished editorial product story using the existing Sora/Manrope typography, warm paper surfaces, terracotta accent, and deep green support color.
- Replace the current disconnected layout with a clear sequence: product-led opening, guided lifecycle, supported domains, interactive feature grid, AI Mentor conversation, student proof, and a strong closing action.
- Use the existing workspace preview as the main product visual rather than adding generic decoration.
- Connect every navigation item to a real section, add a compact mobile navigation menu, and make the header reflect whether the visitor is signed in.
- Preserve dark mode, reduce visual clutter, keep movement restrained, and respect reduced-motion preferences.

## Login, signup, and profiles

- Keep email/password and Google sign-in, and ensure both providers are enabled in Lovable Cloud.
- Redesign the account page to clearly separate sign in and account creation, include display name during signup, improve loading/error/success feedback, and prevent repeated submissions.
- Keep email confirmation explicit: successful signup without a session shows a clear “check your email” state.
- Make the password-reset page wait for a valid recovery session and show a useful expired/invalid-link state instead of a raw error.
- Make navigation session-aware and clear cached private data before sign-out so another account cannot inherit stale screen data.
- Extend the existing profile record with user preferences while keeping roles in the existing separate roles table. Continue using the existing avatar and display-name fields.
- Improve account settings so display name, avatar URL, and saved preferences can be viewed and updated safely.

## Code complexity choice

- Add a separate “How should your code be written?” choice during final project setup for coding domains only:
  - **Easy:** small explicit steps, heavier plain-language comments, minimal abstraction.
  - **Intermediate:** functions and modules, standard error handling, moderate comments.
  - **Advanced:** production-style organization, stronger typing/testing, and appropriate abstractions without needless complexity.
- Keep this separate from project difficulty, so a challenging project can still use easy-to-follow code.
- Save the selected level on the project and include it in every implementation generation, review, regeneration, and error-fix prompt.
- Keep non-coding Project Management work unchanged.

## Data changes

- Add a validated `code_complexity` setting to projects with `intermediate` as the default for existing projects.
- Add a structured preferences field to profiles with a safe empty default.
- Apply the schema update through a Lovable Cloud migration and preserve existing row-level access controls and grants.

## Verification

- Check email signup, email login, Google sign-in entry, email confirmation messaging, forgot-password cooldown, valid and invalid reset links, signed-in homepage navigation, and sign-out cache clearing.
- Create projects at Easy, Intermediate, and Advanced code levels and confirm generation instructions differ while project logic remains complete.
- Review the homepage at desktop and mobile widths in light and dark themes, including menu behavior, section links, text fitting, and reduced motion.
- Confirm every changed page retains unique social and search metadata.
