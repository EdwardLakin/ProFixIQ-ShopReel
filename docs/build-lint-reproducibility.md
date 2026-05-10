# Build and lint reproducibility notes

## Font loading in CI

`src/app/layout.tsx` now avoids `next/font/google` so production builds no longer require outbound network access to download Google-hosted font files during `next build`.

Typography intent is preserved with explicit local/system-safe CSS stacks defined in `src/app/globals.css` (`--font-sans` and `--font-display`).

## Lint command

This project no longer uses `next lint` (which is invalid under Next.js 16 and interpreted as a path argument).

- `pnpm run lint` now runs `tsc --noEmit` from the repository root.

That keeps lint reproducible in this repository without relying on the removed `next lint` command path semantics.
