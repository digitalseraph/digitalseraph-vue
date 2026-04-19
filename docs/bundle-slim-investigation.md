# Bundle slim investigation

**Branch:** `perf/bundle-slim`
**Date:** 2026-04-18
**Outcome:** No size reduction achievable with config alone on @nuxt/content 3.13.0.

## Goal

Drop @nuxt/content's client-side SQLite runtime from the static build.

## Baseline

- Total `.output/public`: **2,780,417 bytes** (~2.65 MB)
- Top chunks shipped to the client:
  - `sqlite3.DBpDb1lf.wasm` — 856,447 B
  - `sqlite3-DBpDb1lf.wasm` — 856,447 B (duplicate, different filename)
  - `CHyYiiiI.js` — 209,981 B (`@nuxt/content` client query entry, with Vite mapDeps preamble)
  - `CHmexnhy.js` — 199,765 B (the `@sqlite.org/sqlite-wasm` JS loader)
  - `sqlite3-worker1-bundler-friendly-Bv6ABw9v.js` — 196,867 B
  - `entry.CmSfUKwO.css` — 38,856 B
  - `sqlite3-opfs-async-proxy-C_otN2ZJ.js` — 9,451 B

The two ~856 KB WASM files plus the four SQLite-related JS chunks total roughly **2.32 MB** — about 84 % of the entire deployed bundle.

## Attempts

### 1. `experimental.payloadExtraction: true`

Added the top-level Nuxt experimental flag to satisfy the dev-server hint
("Payload extraction is recommended for full-static output").

**Result:** bundle unchanged at 2,780,417 bytes. SQLite chunks all still
present. Reverted.

### 2. `content: { ssg: true }` (speculative)

Added an unsupported `ssg: true` key to the `content` block on the chance the
module would short-circuit its client runtime. The schema in
`node_modules/@nuxt/content/dist/module.d.mts` confirms there is no such flag
exposed by 3.13 — the only `experimental` keys are `nativeSqlite` and
`sqliteConnector`, both of which only affect the server/build adapter, not the
client.

**Result:** bundle unchanged (silently ignored). Reverted.

### 3. `routeRules` forcing prerender on every content route

Added explicit `routeRules` for `/`, `/about`, `/contact`, `/work/**`,
`/writing/**`. The crawler already prerendered all 32 routes (including
payload JSONs) without these rules.

**Result:** bundle grew by 233 bytes (route-rule metadata serialized into
`_payload.json`). Reverted.

## Why config alone cannot fix this

`node_modules/@nuxt/content/dist/runtime/client.js`:

```js
async function executeContentQuery(event, collection, sql) {
  if (import.meta.client && window.WebAssembly) {
    return queryContentSqlClientWasm(collection, sql);
  } else {
    return fetchQuery(event, String(collection), sql);
  }
}
```

`queryCollection` is statically imported by every page/component that touches
content (`app/composables/useResume.ts`, `app/pages/{about,work/**,writing/**}.vue`,
`app/components/landing/{FeaturedWork,WritingTeaser}.vue`). The static import
chain pulls `runtime/client.js` into the client bundle. That file's dynamic
`import("./internal/database.client.js")` plus `import("@sqlite.org/sqlite-wasm")`
is what produces the SQLite worker, OPFS proxy, and WASM chunks. The check is
runtime-gated on `window.WebAssembly`, but Vite still ships the chunks because
they are reachable from the import graph.

There is no module option in 3.13 that swaps this client runtime for a pure
`fetchQuery`/payload-cache path. `nuxt.options.vite.optimizeDeps.exclude`
already contains `@sqlite.org/sqlite-wasm` (line 3110 of
`module.mjs`) — the module wants this code in the production bundle.

## Possible future paths (not attempted)

These would require code changes, not just config — out of scope for this
investigation:

1. **Replace `queryCollection` calls with build-time generated JSON** — write
   our own `useContent*` composables that read prerendered `_payload.json`
   directly via `useFetch`, then drop `@nuxt/content` from the client bundle
   entirely (still use it server-side for build).
2. **Vite manual chunking + dynamic re-exports** — wrap every `queryCollection`
   call in a `defineAsyncComponent` boundary with `prerender: true` route
   rules and rely on Nitro to short-circuit at SSR time. Even with this,
   client-side hydration re-evaluates the component setup, so the import is
   still reachable.
3. **Upstream fix to @nuxt/content** — file an issue / PR to add a
   `client.runtime: 'fetch' | 'wasm'` option that swaps `runtime/client.js`'s
   `executeContentQuery` to always call `fetchQuery`.
4. **Migrate off @nuxt/content** — use `nuxt-content`'s legacy v2 path or
   a hand-rolled markdown loader (gray-matter + remark) that runs entirely at
   build time.

## Status

BLOCKED. No reduction achievable through config in @nuxt/content 3.13.
