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
- Pages read projects only through `src/lib/projects/repository.ts`; sample rows live in `sample-data.ts` so the data source can be swapped for a database without touching pages.
- Prices are display-only in the browser; checkout must re-read the price on the server and never trust URL or form values.
- Unimplemented features (payments, accounts, downloads, admin) render `PlaceholderPage` and must never simulate success.
