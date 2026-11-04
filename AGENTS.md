<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Backend is the owner's external Supabase project (client in src/lib/supabase.ts); never enable Lovable Cloud — owner requirement.
- Database schema lives in supabase/schema.sql and is run manually in the Supabase SQL editor — no Lovable migration tooling is connected.
- Checkout must go through the place_order SQL function so prices, stock and coupons are enforced server-side.
- All store data flows through src/lib/db.ts (useDb + actions) which reads/writes Supabase; only the cart is kept in localStorage — keeps components backend-agnostic.
- AI calls live in *.server.ts modules behind createServerFn wrappers that verify the caller's Supabase token and staff role before calling the AI Gateway — keeps the key and prompts server-side and admin-only.
- Admin is a layout route (src/routes/admin.tsx, sidebar + Outlet) with one child route per section; shared admin UI lives in src/components/admin/kit.tsx — keeps sections independent and consistent.
- Brand, payments and SEO settings are rows in the publicly readable store_settings table, so never store secrets there; schema additions go in supabase/admin-upgrade.sql (also appended to schema.sql) for existing installs.
- Checkout calls place_order_v2 (wraps place_order and records the payment method), falling back to place_order if the upgrade SQL isn't installed.
- Blog content is Markdown rendered by src/lib/markdown.ts, which escapes all HTML first — never render post content with another unescaped renderer.
- Growth features (wholesale requests, email leads, BUNDLE10/WELCOME50 codes) live in supabase/growth-upgrade.sql (also appended to schema.sql); bundle/lead discounts are real coupons so place_order still enforces pricing server-side.
- Battery sizing math lives in pure src/lib/sizing.ts with tests — keep the calculator page free of formulas.
