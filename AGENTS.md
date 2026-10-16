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

## Architecture rules
- Public pages read projects only through `src/lib/projects/repository.ts`, which calls server functions in `public.functions.ts` using a publishable-key client; only PUBLISHED rows are returned (RLS enforces this too) — keeps unpublished data off public pages.
- Admin pages (`/admin/*`, `ssr: false`) use the browser client via `src/lib/admin/api.ts`; authorisation is enforced by RLS with `has_role(auth.uid(), 'admin')` on every table and storage bucket, never by hiding UI — the browser is untrusted.
- Roles live only in `public.user_roles`; admins are granted manually in the database, never via signup or client input.
- Prices are stored as integer paise (`price_paise`) and shown as whole INR — exact money, no floats.
- Images go to private bucket `project-images` (anon-readable by policy, served via signed URLs because public buckets are blocked); paid deliverables go to private `project-deliverables`, admin-only, with metadata in `project_files`.
- Publication rules (required fields, demo URL consistency, `published_at`) are enforced by a database trigger, mirrored in the admin form for friendly messages.
- Audit rows for project creation, status/price changes and file add/remove are written by security-definer triggers into `audit_logs`.
- Prices are display-only in the browser; checkout must re-read the price on the server and never trust URL or form values.
- Unimplemented features (payments, downloads, purchases) render `PlaceholderPage` and must never simulate success.
