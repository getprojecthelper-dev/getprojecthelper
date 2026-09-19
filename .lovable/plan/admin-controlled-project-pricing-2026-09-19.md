# Admin-controlled project pricing

## Goal
Let administrators set each purchasable project's regular price and discount percentage. Customers will see the resulting regional sale price before opening checkout.

## Changes
- Add a secure project-pricing table with one row per project and payment environment, storing the regular INR price and discount percentage.
- Restrict price changes to administrators; customers can only read active pricing through the app.
- Add a “Project pricing” section to the admin dashboard with editable regular price, discount, calculated sale price, save state, and validation.
- When an administrator saves, update both the app's pricing record and the matching payment-provider price so checkout charges the same discounted amount shown in the app.
- Update the Buy projects catalogue and project-details page to use the saved discount instead of the fixed 50% text and hardcoded doubled price.
- Keep regional display automatic: INR is the base price, while checkout localizes the sale amount for the customer's country.

## Technical details
- Validate regular prices and discounts server-side and verify the admin role before any update.
- Store amounts in minor units to avoid rounding errors; calculate the sale amount deterministically.
- Keep separate test and live rows so preview changes cannot accidentally alter live prices.
- Add loading, success, and failure feedback, then verify admin editing and customer-facing prices on desktop and mobile.
