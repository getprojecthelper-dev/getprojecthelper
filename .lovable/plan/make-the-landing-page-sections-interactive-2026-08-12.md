# Make the landing page sections interactive

Bring the three sections below the hero up to the same craft level as the kinetic hero, with moderate motion (hover + scroll reveal, nothing flashy).

## 1. Lifecycle strip — "The whole lifecycle, in order"

Turn the static pill row into a selectable stepper.

- Clicking (or hovering) a stage selects it; the selected pill lifts, gains the primary accent, and the connecting line fills up to it.
- A detail panel below the strip swaps in a one-line description of the selected stage plus the workspace screen it maps to (e.g. Test -> Testing page).
- Auto-advances slowly on load, pauses once the visitor interacts — same pattern as the hero track, so the page feels consistent.
- Keyboard accessible: arrow keys move between stages, focus styling matches hover.

## 2. Feature cards grid — "Everything the project needs"

- Staggered fade-in-up as the grid scrolls into view (IntersectionObserver, one-shot).
- Card hover: subtle lift, border warms to the accent, icon scales and the icon tile picks up a soft tinted background.
- Each card gains a short second line revealed on hover/focus (a concrete example of what that feature holds) so hover carries information, not just decoration.
- Pointer-follow highlight kept very light so it reads editorial, not gamified.

## 3. AI mentor section

- Replace the static quote pair with a small stepped conversation: 3 short student claim -> mentor pushback exchanges.
- Messages type/fade in one after another when the section scrolls into view; a compact "Next example" control cycles through the exchanges.
- Mentor replies keep the existing tone (no invented numbers) and stay in the current card styling.

## Cross-cutting

- Respect `prefers-reduced-motion`: all auto-advance and entrance animation collapse to instant states.
- Colors, shadows and radii come from existing tokens in `src/styles.css` — no new hardcoded colors, works in light and dark.

## Technical notes

- New components: `src/components/lifecycle-stepper.tsx`, `src/components/feature-grid.tsx`, `src/components/mentor-dialogue.tsx`; `src/routes/index.tsx` composes them and keeps its `head()` metadata unchanged.
- Shared `useInView` hook (IntersectionObserver) for scroll reveals, in `src/hooks/use-in-view.ts`.
- Animation via existing Tailwind utilities (`animate-fade-in`, `hover-scale`) plus inline transition delays for stagger; no new animation library.
- Content only — no data-layer, route or backend changes.
