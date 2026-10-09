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
