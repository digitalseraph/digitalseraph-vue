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

## Deploy (Cloudflare Pages)

The production site deploys from `main` via the Cloudflare Pages integration.
To deploy from CLI:

```bash
pnpm generate
pnpm dlx wrangler pages deploy .output/public --project-name digitalseraph
```

## One-time Cloudflare Pages setup (manual)

In the Cloudflare dashboard:
1. Pages → Create project → Connect to Git → pick the `digitalseraph` repo.
2. Set build command: `cd web/digitalseraph-vue && pnpm install && pnpm generate`
3. Set build output directory: `web/digitalseraph-vue/.output/public`
4. Set root directory: repo root.
5. Framework preset: Nuxt (static).

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
