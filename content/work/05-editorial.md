---
title: Editorial Reservation System
year: 2014
role: Software Engineer
stack: [PHP, Laravel, JavaScript, MySQL, Bootstrap, HTML5, CSS3]
cover: /og/editorial.svg
featured: false
summary: Newspaper article scheduling and analytics app built from scratch in Laravel to replace an $800/month SaaS subscription.
---

Creative Loafing, Atlanta's alt-weekly, was paying $800 a month for a third-party editorial-reservation tool — a piece of software that handled article scheduling across the paper's production calendar. The vendor's UI was clunky, the reports were thin, and the relationship had grown stale.

I proposed and built an in-house replacement in Laravel over about eight weeks. The new system had everything the old one did — article reservations by section and issue date, reporter assignment, editor workflow — plus a reporting dashboard with charts and analytics that the old product didn't offer. It shipped, the team migrated, and the vendor got cancelled.

## Cost savings beyond this one system

The Editorial Reservation System was the headline save ($9,600/year), but it was part of a larger pattern I followed at Creative Loafing — migrating externally-hosted or licensed services to in-house infrastructure. A medical-news publication migration saved $2,400/month ($21,600 in 2014 alone), and moving an externally-hosted ad-proofing application in-house saved another $300/month.

## The technical shape

Laravel on the backend, a Bootstrap + jQuery UI, MySQL. Reports rendered as charts. Simple auth, simple role model, a dashboard designed for people who weren't "technical users" — editors and reporters who needed to click through a weekly planning cycle and move on.
