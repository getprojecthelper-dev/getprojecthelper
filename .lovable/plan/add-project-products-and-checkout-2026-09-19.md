# Add project products and checkout

## What will change
- Add all six existing ready-made projects to built-in payments as one-time products.
- Replace credit prices with a fixed regional price: ₹200 in India, approximately $2.30 in the US, with checkout localizing elsewhere.
- Show the original 2× price crossed out to communicate the 50% discount.
- Rename the catalogue to “Buy projects” and replace the old unlock action with an Explore action.
- Add a dedicated details page for each project with its brief, level, tools, deliverables, localized price, and Buy project action.
- Open secure test checkout from the details page and add clear success/cancel handling.

## Purchase behavior
- A successful payment creates the selected project in the buyer’s workspace and opens it automatically.
- Each user may purchase a catalogue project only once; owned projects show Open project instead of Buy project.
- Failed or cancelled payments create nothing.
- No subscription, cancellation, upgrade, or downgrade logic will be added because these are one-time purchases.

## Technical details
- Use stable product and price IDs for all six catalogue entries.
- Record completed purchases in a protected ownership table with a unique user/project-product pair.
- Fulfil purchases only from a verified payment event, never from the browser success screen.
- Keep project creation idempotent so repeated payment notifications cannot create duplicate projects.
- Preserve the existing project templates, starter tasks, and document sections.
- Verify catalogue, details, checkout launch, ownership state, and phone/desktop layouts.
