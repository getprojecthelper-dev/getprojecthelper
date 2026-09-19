# Welcome Workspace

## Goal
Make the Welcome page the compact home workspace, remove the persistent sidebar, and bring its destinations into the page itself.

## Changes
- Replace the sidebar-based signed-in layout with a slim top bar that keeps the logo, credit balance, theme control, settings, and logout accessible.
- Redesign Welcome as a compact workspace with quick access to Home, Dashboard, Documentation, Viva, AI Mentor, Settings, and Credits.
- Keep Build a project and Explore premade projects prominent and readable at every screen size.
- Shorten Resume projects into a compact recent-project area showing both unfinished and completed work.
- Preserve project-aware links for Documentation, Viva, and AI Mentor by offering a concise project picker when needed.
- Verify desktop and mobile layout, links, and current preview health.

## Technical details
- Update the authenticated shared layout and Welcome route using existing design tokens and button components.
- Keep TanStack Router links typed and use existing project overview data; no backend changes.
- Retain private-page SEO metadata and current authentication behavior.
