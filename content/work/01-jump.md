---
title: Jump
year: 2021
role: Lead Engineer
stack: [Vue 3, Vite, Pinia, Bootstrap, Chart.js, .NET (C#), SQL Server, Kubernetes, GKE, Docker, Skaffold, Azure AD (MSAL), Microsoft Graph, HashiCorp Vault]
links:
  live: https://jump.cox.com
cover: /og/jump.svg
featured: true
summary: Cox's internal URL shortener — Vue 3 SPA + .NET API on GKE, Azure AD SSO, group-based admin, analytics, and QR/landing pages.
---

Jump is Cox Communications' internal URL shortener and link-management platform. Cox employees create short, memorable `jump/<token>` links, build landing pages with media cards, generate QR codes, and see real-time analytics including geographic heatmaps.

## The rewrite

When I joined Cox in 2021, Jump was a Vue 2 SPA on an aging Rancher cluster. I led the rewrite to Vue 3 + Vite + Pinia with a team of three, using the opportunity to introduce a test harness that didn't exist before — Vitest for unit coverage, `vitest-browser` for component tests, Playwright for end-to-end, and SonarQube quality gates on every PR. Pinia replaced Vuex. A route guard now enforces auth, admin, and maintenance-mode rules on every navigation. Runtime config injected via Kubernetes ConfigMap means the same container image promotes cleanly across dev → QA → staging → production.

## Infrastructure migration

Parallel to the rewrite, I led the migration from Rancher to Google Anthos on GKE. Four environments, Skaffold for the build-and-deploy inner loop, HashiCorp Vault for secrets with AppRole-based authentication, and a Jenkins pipeline with manual approval gates between lower and upper environments.

## Auth and authorization

Every user authenticates via Microsoft Azure AD (MSAL) — silent token refresh, popup login, scoped tokens. Admin access is gated by membership in an Azure Entra group; the backend verifies group membership on every admin request via the Microsoft Graph API. No custom user directory, no password management — identity is entirely delegated.

## Architecture

The platform is two separately deployed workloads: JumpUI (Vue 3 SPA served as static files from Nginx) and JumpAPI (ASP.NET Core backend owning all data access and business logic, talking to SQL Server). Keeping the SPA pure made the rewrite tractable and keeps deployments independent — a UI change and an API change never have to ship together.
