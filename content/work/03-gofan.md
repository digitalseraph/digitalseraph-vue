---
title: GoFan Docker Environment
year: 2018
role: Software Engineer II
stack: [Docker, Docker Compose, Alpine Linux, Bash, PostgreSQL, Redis, ElasticSearch, Ruby on Rails, Java, Spring MVC, React, AWS]
cover: /og/gofan.svg
featured: true
summary: Multi-stage Alpine Linux dev container integrating Postgres, Redis, ElasticSearch with a bash console UI — simplified the full dev/test/deploy workflow for a mobile-ticketing platform.
---

GoFan is Huddle's high-school-athletics ticketing platform. When I joined, engineers each had a subtly different local setup — Postgres from Homebrew, Redis from a package, ElasticSearch from a Docker image — and "works on my machine" was a weekly headline. I engineered the GoFan Docker environment as the canonical answer.

## Multi-stage Alpine container

Rather than sprawl across five services and a Docker Compose file each new hire had to understand, I built a single multi-stage Alpine Linux image that layered Postgres, Redis, and ElasticSearch onto a well-defined Ruby base. Engineers pulled one image, ran one command, and had the full stack up in under a minute.

## Bash console UI

On top of the image I put a bash-driven console menu — a curses-ish UI for starting/stopping services, tailing logs, rebuilding from scratch, running migrations, seeding, and opening a Rails console. Junior engineers could explore the stack without memorizing any of it. Senior engineers could skip the UI and drop to raw commands.

## The surrounding work

Beyond the container, I took ownership of iOS and Android codebases inherited from external partners, refactored the GoFan Admin Ruby on Rails app (financial-reporting API, performance work), contributed to GoFan Admin v2's Java Spring + React migration, and owned the release lifecycle — QA, code reviews, changelogs, semantic versioning, hot-fixing, and AWS deployments.
