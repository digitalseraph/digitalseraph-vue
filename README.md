# digitalseraph-vue

Personal site for David Miller — digitalseraph.com.

## Stack

Nuxt (latest), Vue 3, TypeScript strict, Tailwind v4, Pinia, @nuxt/content, Motion.

## Develop

```bash
pnpm install
pnpm dev
```

Opens at http://localhost:3000.

## Build

```bash
pnpm generate   # static output in .output/public
```

## Deploy (Cloudflare Workers + Static Assets)

The production site deploys from `master` via the Cloudflare Workers integration.
To deploy from CLI:

```bash
pnpm generate
pnpm dlx wrangler deploy
```

`wrangler.toml` declares `[assets] directory = "./.output/public"` so a static
worker is provisioned that serves the prerendered site directly — no Worker
script required.

## One-time Cloudflare setup (manual)

In the Cloudflare dashboard:
1. Workers → Create application → Connect to Git → pick the `digitalseraph-vue` repo.
2. Build command: `pnpm install && pnpm generate`
3. Deploy command: `pnpm dlx wrangler deploy` (or leave blank to use `wrangler.toml`).
4. Root directory: repo root (no sub-path).

Then in Custom Domains, add `digitalseraph.com` and `www.digitalseraph.com`.

## Content

- `content/about.md` — About page copy
- `content/resume.yml` — Résumé data
- `content/work/*.md` — Project case studies
- `content/writing/*.md` — Blog posts

## Tests

```bash
pnpm test:unit   # vitest
pnpm test:e2e    # playwright (see tests/e2e)
```
