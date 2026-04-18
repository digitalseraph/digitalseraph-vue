# CLAUDE.md — digitalseraph-vue

## Commands

- `pnpm dev` — local dev server (http://localhost:3000)
- `pnpm generate` — static build to `.output/public`
- `pnpm test:unit` — vitest
- `pnpm test:e2e` — playwright

## Conventions

- Components live under `app/components/{layout,landing,primitives,resume,writing}/` — pick the closest subdirectory.
- Composables under `app/composables/` — prefix with `use*`, export named functions.
- Pinia stores under `app/stores/` — default export `use*Store` factories.
- All colors and type through CSS custom properties defined in `app/assets/css/tokens.css`. Never inline colors in components.
- All user-visible motion goes through `useParallax`, `useReveal`, or `useTyping` so `prefers-reduced-motion` is respected.
- Content is the source of truth for work/writing/about/resume. No hard-coded lists in components.

## When adding a new page

1. Add the route to `app/pages/`.
2. Register the route in `app/components/layout/TheCommandPalette.vue` `routes` array.
3. Update `TheNavBar` if it belongs in top-level nav.
