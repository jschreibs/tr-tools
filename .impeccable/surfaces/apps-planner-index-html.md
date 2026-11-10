---
version: 1
slug: "apps-planner-index-html"
primary_target: "apps/planner/index.html"
related_targets: []
---

# Planner surface brief

Mode: Operate. Audience: TR coworkers on desktop, checking "am I on track?" and painting days. Task: paint days (In Office, Remote, OOO, Holiday), see month stats against a 3 or 4 day requirement, and now also keep day notes plus a monthly scratchpad and to-dos. All existing behavior and logic stay. Notes and plan are saved in the browser (localStorage) only.

## Direction contract

THESIS: A printed cubicle wall planner you can write on. It refuses the soft rounded SaaS calendar (pale pastel cells, gray hairlines) in favor of heavy ruled lines, solid color stickers and a weekly tally.

OWN-WORLD: Warm paper ground (#fafaf5), forest green #1d4b34 as the header and ink-rule color, orange #d64000 as the single accent (today, active paint tool, Holiday). Heavy 3px ruled grid, square-cornered cells, solid status tags (In Office solid green, Remote tinted blue, OOO yellow, Holiday orange), bold system sans at 800, tabular numerals everywhere.

STORY: The visitor sees at once whether this month is on track, paints days like marking a planner, and jots notes beside the dates without leaving the page.

FIRST VIEWPORT: Green header band with the Planner title left and the current in-office percentage vs target right (white numerals). Below it a toolbar: requirement toggle, paint tools, legend with month counts. Then the month grid with a weekly tally column at its right edge, and a notes panel (scratchpad and to-dos) beside it. Import holidays and Clear month sit below the grid.

FORM: Cubicle Wall Planner, position 1 on my ordered list (my own top grounded pick, kind: pick), seed:470d71d447815b5f. Palette steered by the user: blue to #1d4b34, yellow to #d64000.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
