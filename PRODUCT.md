# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Built for TR employees, who are the intended audience. They open a small tool in a browser at work, mostly on desktop, to do one quick job and leave. Tools are shared by link.
The site is hosted publicly on GitHub Pages, so anyone on the internet can open it. Treat it as public: no private or company-confidential content, and no sign-in or access control.

## Product Purpose
TR Tools is a hub of small browser utilities for TR coworkers.
- Planner: calculate how many in-office days are needed to meet the TR requirement (3 or 4 days per week).
- Race The Coco: a playful race game where coworkers race as 8-bit characters.

## Operating Context
Hosted publicly on GitHub Pages (https://jschreibs.github.io/tr-tools/), open to anyone with the link. All data (attendance, notes) stays in each person's own browser (localStorage); nothing is sent to a server. Each tool is a self-contained app under `apps/<appName>/`, reached from a hub at the root `index.html`.

## Capabilities and Constraints
- Plain HTML/CSS/JS. No build step, framework or bundler. Vanilla JS; no external runtime dependencies without explicit approval (dev-only tooling such as Playwright to be approved separately).
- Shared base styles at `shared/css/base.css`, imported by every app before its own stylesheet.
- Semantic HTML, no inline styles; each app links back to the hub from its header.
- Planner: requirement toggle (3/4 days), paint-mode day statuses (In Office, Remote, OOO, Holiday), monthly stats, holiday import, clear month.

## Brand Commitments
Name: "TR Tools". Race The Coco's 8-bit character theme is existing product behavior.

## Evidence on Hand
No testimonials, usage data or brand guidelines exist. Do not fabricate them.

## Product Principles
- One quick job per tool; time-to-answer beats feature breadth.
- Each tool may have its own character; the hub stays neutral.
- Stay lightweight and dependency-free so anyone on the team can maintain it.

## Open decisions
- Visual world: user chose a full redesign with separate characters per tool (hub neutral). Specific direction is decided in new-work, not here.
