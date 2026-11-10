---
name: TR Tools (Planner and Race The Coco, Hub)
description: Two deliberately separate worlds. Planner, a printed cubicle wall planner (green ruled grid, orange accent), which Race The Coco extends as a paper race track. Hub, a drawer of manila folders (kraft, ink outlines, one stamp red). Hub tokens are prefixed hub-.
colors:
  paper: "#fafaf5"
  paper-2: "#eee9da"
  ink: "#14281e"
  ink-soft: "#4d5a52"
  green: "#1d4b34"
  green-deep: "#163a29"
  orange: "#d64000"
  orange-bg: "#fff1e6"
  remote-bg: "#d3ebe6"
  remote-fg: "#14574d"
  ooo: "#6d4c9f"
  danger: "#9c2b1b"
  sticky-peach: "#ffb27a"
  sticky-ink: "#2b1608"
  sprite-outline: "#1b1b1b"
  sprite-skin: "#e8b995"
  coco-orange: "#e0701f"
  hub-desk: "#cdbf9f"
  hub-manila: "#d9b96a"
  hub-manila-hover: "#e5c97f"
  hub-folder-mid: "#f1e7cc"
  hub-paper: "#fbf6e9"
  hub-ink: "#2b2b2b"
  hub-ink-soft: "#3a352f"
  hub-stamp: "#b5342a"
typography:
  display:
    fontFamily: "Archivo Black, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "2.75rem"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0em"
  headline:
    fontFamily: "Archivo Black, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1.9rem"
    fontWeight: 400
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Archivo Black, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 400
  body:
    fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 800
    letterSpacing: "0.1em"
  hub-display:
    fontFamily: "Special Elite, Courier New, monospace"
    fontSize: "4.5rem"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.01em"
  hub-headline:
    fontFamily: "Special Elite, Courier New, monospace"
    fontSize: "3.1rem"
    fontWeight: 400
    lineHeight: 1.05
  hub-tab:
    fontFamily: "Special Elite, Courier New, monospace"
    fontSize: "1.1rem"
    fontWeight: 400
    lineHeight: 1.1
  hub-stamp:
    fontFamily: "Special Elite, Courier New, monospace"
    fontSize: "1.5rem"
    fontWeight: 400
    letterSpacing: "0.08em"
  hub-body:
    fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1.3rem"
    fontWeight: 400
    lineHeight: 1.45
rounded:
  sm: "3px"
  round: "50%"
  hub-sheet: "3px"
  hub-folder: "6px"
  hub-tab: "14px 14px 0 0"
spacing:
  xs: "6px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  page: "40px"
  hub-page-x: "20px"
  hub-tab-gap: "6px"
components:
  button-outline:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.green}"
    rounded: "{rounded.sm}"
    padding: "8px 14px"
  button-outline-hover:
    backgroundColor: "{colors.paper-2}"
  button-active:
    backgroundColor: "{colors.green}"
    textColor: "#ffffff"
  button-solid:
    backgroundColor: "{colors.green}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "8px 14px"
  button-solid-hover:
    backgroundColor: "{colors.green-deep}"
  button-danger:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.danger}"
    rounded: "{rounded.sm}"
    padding: "8px 15px"
  day-cell:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    height: "132px"
    padding: "8px 10px"
  day-cell-today:
    backgroundColor: "{colors.orange-bg}"
  status-in-office:
    backgroundColor: "{colors.green}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
  status-remote:
    backgroundColor: "{colors.remote-bg}"
    textColor: "{colors.remote-fg}"
    rounded: "{rounded.sm}"
  status-ooo:
    backgroundColor: "{colors.ooo}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
  status-holiday:
    backgroundColor: "{colors.orange}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
  input:
    backgroundColor: "#ffffff"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "8px 10px"
  sticky-note:
    backgroundColor: "{colors.sticky-peach}"
    textColor: "{colors.sticky-ink}"
  countdown-number:
    textColor: "{colors.green}"
    typography: "{typography.display}"
  countdown-go:
    textColor: "{colors.orange}"
  podium-step:
    backgroundColor: "{colors.green}"
    textColor: "#ffffff"
    height: "96px"
  podium-step-winner:
    backgroundColor: "{colors.orange}"
    textColor: "#ffffff"
    height: "200px"
  hub-tab:
    backgroundColor: "{colors.hub-manila}"
    textColor: "{colors.hub-ink}"
    typography: "{typography.hub-tab}"
    rounded: "{rounded.hub-tab}"
    height: "41.6px"
    padding: "0 22.4px"
  hub-tab-hover:
    backgroundColor: "{colors.hub-manila-hover}"
  hub-tab-selected:
    backgroundColor: "{colors.hub-paper}"
    textColor: "{colors.hub-ink}"
    height: "51.2px"
  hub-folder:
    backgroundColor: "{colors.hub-paper}"
    rounded: "{rounded.hub-folder}"
  hub-stamp:
    backgroundColor: "{colors.hub-paper}"
    textColor: "{colors.hub-stamp}"
    typography: "{typography.hub-stamp}"
    padding: "11.2px 25.6px"
  hub-stamp-hover:
    backgroundColor: "{colors.hub-stamp}"
    textColor: "{colors.hub-paper}"
  hub-preview:
    backgroundColor: "#ffffff"
    textColor: "{colors.hub-ink}"
    rounded: "4px"
    padding: "20px"
  hub-preview-race:
    backgroundColor: "{colors.paper}"
    rounded: "4px"
    padding: "0"
---

# Part 1. Design System: TR Tools, Planner

Scope: this file holds two separate design systems that share no tokens. Part 1 (below) is the Planner (`apps/planner/`) and its extension, Race The Coco (`apps/raceTheCoco/`, documented in the labelled "Race The Coco extension" subsections; it reuses every Planner token and adds none to the palette beyond sprite colors). Part 2, "Design System: TR Tools Hub", is the landing hub (`index.html`, `hub.css`, `hub.js`). The hub is not for another surface to inherit.

## Overview

**Creative North Star: "The Cubicle Wall Planner"**

A printed month planner pinned to a cubicle wall, with a pen beside it. Warm paper, a heavy forest-green ruled grid, solid color stickers for status. It answers "am I on track?" at a glance and lets you mark days the way you would mark paper.

It is square-cornered, ruled and flat. Color is information: each status is a solid sticker, and a single orange accent marks what is live (today, the active holiday tool, selection, focus, notes). The one soft, tactile moment is the sticky note editor, which is a real object lying on the wall.

The build refuses the soft rounded SaaS calendar: pale pastel cells, gray hairline grids, generous radii.

**Key Characteristics:**
- Heavy 3px green rules draw the grid, panel and popover edges; corners are 3px at most.
- Solid status stickers, never tinted cells; Remote is the only tinted tag and carries an inset outline.
- Archivo Black for numerals and titles, system sans at 700-800 for everything else, tabular numerals throughout.
- One accent (orange) used sparingly; green is structure and ink.
- Flat at rest; lift appears only on floating layers (popover, toast, sticky note).

## Colors

Warm paper and green ink, with a single orange and a fixed set of status colors.

### Primary
- **Forest Ink Green** (`green`): header band, every 3px rule, outline buttons and their active fill, In Office status, checkbox accent.
- **Deep Green** (`green-deep`): hover for solid green buttons only.

### Secondary
- **Planner Orange** (`orange`): the single accent. Today's date disc, Holiday status and tool, active paint-mode title underline, text selection, caret, focus ring, cells that hold a note.
- **Orange Wash** (`orange-bg`): the background of today's cell.

### Tertiary (status colors)
- **Remote Teal** (`remote-bg` fill, `remote-fg` text and 1.5-2px inset outline): Remote status.
- **Plum** (`ooo`): Out of Office status.

### Neutral
- **Warm Paper** (`paper`): page, cells, panels, popovers.
- **Shadow Paper** (`paper-2`): hover fill, out-of-month cells, neutral badge.
- **Deep Green-Black Ink** (`ink`): body text, eraser tool, warning badge, toast.
- **Soft Ink** (`ink-soft`): secondary labels, placeholders, done to-dos.
- **Stamp Red** (`danger`): destructive actions only (Clear month, confirm, remove hover).
- **Sticky Peach / Sticky Brown** (`sticky-peach`, `sticky-ink`): the note editor only.

### Named Rules
**The One Accent Rule.** Orange marks what is live or noted. It is never decoration and never a second brand color.
**The Solid Sticker Rule.** Status is a solid fill with white text; the only exception is Remote's tinted teal with an inset outline. No pastel cell washes.
**The Status Palette Rule.** In Office green, Remote teal, OOO plum, Holiday orange are fixed, identical across legend dots, paint tools and day stickers.

## Typography

**Display Font:** Archivo Black (self-hosted `shared/fonts/archivo-black.woff2`, shared with Race The Coco; fallback system-ui, Segoe UI, sans-serif)
**Body Font:** system-ui stack
**Label Font:** system-ui stack at 800, uppercase, tracked

**Character:** A poster-weight face for numbers and titles against plain system text at heavy weights, like block capitals written on a planner. `font-variant-numeric: tabular-nums` is on for the whole page.

### Hierarchy
- **Display** (400, 2.75rem, 1): the header percentage.
- **Headline** (400, 1.9rem, -0.01em): the page title; month label at 1.75rem.
- **Title** (400, 1.25rem): notes panel title; sticky note title at 1.15rem.
- **Body** (400-600, 0.9rem, 1.45): notes, to-dos, popover options (0.88rem), day notes (0.82rem). Dense UI, no long prose.
- **Label** (800, 0.75rem, 0.1em, uppercase): toolbar group titles, weekday header, panel field labels.
- **Control text** (700, 0.85rem): button labels. **Sticker text** (800, 0.75rem): status labels.

### Named Rules
**The Block Numerals Rule.** Large figures (percentage, month, title) use the display face; everything else stays in system sans.

### Race The Coco extension: sprite colors
Sprite colors are depicted art on the track, not UI tokens; UI chrome keeps the Planner palette.
- **Sprite Outline** (`sprite-outline`): 1px outline on every sprite, never pure black.
- **Skin Color** (``sprite-skin`): Jerome and The Coco skin color.
- **Coco Orange** (`coco-orange`): The Coco's jacket, pants and lane accent. Jerome's lane accent is near-black `#262626`.
- Per-character palettes also hold hair, shirt, pants and shoe colors (Jerome: `#c9a540` dirty-blond hair with `#9f7f2c` strands, `#262626` shirt, `#7b8088` pants, `#f6f6f6` shoes; The Coco: `#3d2412` hair with `#26140a` strands, `#a8480f` darker-orange collar, zip and cuffs, `#6b3f23` shoes). Added racers (up to 12, unique names and colours) take a user-chosen colour from ten extra colours, applied to the whole generic runner. Sprites have soft shading: the right edge of each part is darkened by 26%, then the 1px outline is drawn.

### Named Rules (Race The Coco)
**The Sprites Are The Colour Rule.** On the race screens the sprites and the winner's orange step are the only color beyond paper, green and ink.

## Layout

Page container max 1360px with 2.5rem side padding (1rem under 700px). The workspace is a two-column grid: calendar in a flexible column, notes panel at 320px, 2rem gap. The calendar grid is five weekday columns. Day cells have a 132px minimum height (92px on mobile). Spacing steps used: 0.35, 0.5, 0.75, 1, 1.25, 1.5, 2, 2.5rem.

Breakpoints: at 1100px the workspace stacks and the stats group loses its auto left margin; at 700px the header stacks, status labels collapse to short words via a data attribute, day notes are hidden. Weekends are not shown.

### Race The Coco extension: layout
Same header band and 1360px container as the Planner. Setup is a two-column grid: racer panel in a flexible column, sticky 420px sidebar (track preview of every racer, one full-width green Start Race button, error line in Stamp Red), 2rem gap; stacks at 820px and the sidebar stops sticking. Racer rows: 32x48 sprite thumbnail (2x), name input, color swatch (2.4rem), remove button (2.2rem). The race canvas is a stack of 116px lanes, one per racer, with 4px-per-pixel sprites (64x96); when the field is taller than the window the page auto-scrolls to keep the leader in view. Results are a single left-aligned column, max 1000px, with a full-width "rest" list.

## Elevation & Depth

Flat and ruled. Depth comes from 3px green borders and tonal steps between paper and shadow paper, not shadows. Floating layers are the exception.

### Shadow Vocabulary
- **Floating layer** (`box-shadow: 0 6px 18px rgba(20, 40, 30, 0.22)`): day popover and clear confirm; the toast uses 0.25 opacity.
- **Sticky note lift** (stacked `drop-shadow` filter on the dialog wrapper, 1px / 12px / 28px offsets): used because clip-path cuts box-shadow; the note is a physical object.

### Named Rules
**The Flat-On-The-Wall Rule.** Cells, panels, buttons and badges carry no shadow. Only layers that float above the wall do.

### Race The Coco extension: motion and sprites
Sprites scale by whole-number multiples with `image-rendering: pixelated`; canvas uses an integer device-pixel ratio so no seams appear.

## Shapes

Square-cornered: 3px radius on buttons, inputs, stickers, badges, popovers, tooltips and legend dots (2px). The date number on today is a circle (50%). The sticky note has a clipped folded bottom-right corner and a slight rotation, unique to that object. Borders are 2px green on controls and 3px green on structure; hairlines are green at 25% opacity.

## Components

### Buttons
- **Shape:** 3px radius, 2px green border, 0.85rem weight 700.
- **Outline (default):** paper fill, green text, `0.5rem 0.9rem`; hover fills Shadow Paper. Used for requirement, paint tools, import holidays, nav arrows (2.25rem square).
- **Active:** green fill, white text. Paint tools take their status color when active (Remote teal, OOO plum, Holiday orange, Eraser ink).
- **Solid:** green fill, white text (Add, Done); hover Deep Green.
- **Danger:** outline in Stamp Red with a pale red hover; confirm is filled red.
- **Focus:** 3px orange outline, 2px offset, everywhere.
- **Motion:** background and color 0.15s on `cubic-bezier(0.22, 1, 0.36, 1)`.

### Day cells
Paper cell with 3px green rules, a full-cell hit button, a round date number, and a status sticker. Hover is Shadow Paper; today is Orange Wash with an orange date disc. Painting a sticker plays a 0.2s scale-down "stamp". A day note shows as a text preview; a note button in the corner turns solid orange once a note exists. Paint mode switches the cursor to a crosshair.

### Inputs
White fill, 2px green border, 3px radius, soft-ink placeholders; focus is a 3px orange outline.

### Popovers and toast
Paper with a 3px green border and 3px radius; options highlight in Shadow Paper. The toast is ink-filled with white text.

### Sticky note (signature)
Peach gradient note with translucent tape strip, ruled writing lines, folded corner and a -1.6 degree tilt; enters with a 0.28s tilt-in. Brown text and a green Done button. The only decorative object in the system.

### Race The Coco extension: pixel sprites
A 16x24 front-facing pixel character, written as part codes (hair, side hair, long hair, skin, eyes, mouth, top, undershirt, sleeve, forearm, hand, pants, shoes) and colored through a per-character palette, so all characters share one run cycle and differ only in hair, clothes and colors. Each is shaded (right edge of each part 26% darker) and carries a 1px `#1b1b1b` outline. Sizes: race 4px per sprite pixel (64x96), setup preview 3px, podium 96x144, rest-list thumbnail 32x48. The win pose leans the arms in at the shoulders. Jerome (short dirty-blond textured hair, black shirt, gray pants, white shoes) and The Coco (shorter dark-brown textured hair, orange jacket zipped to the neck with darker-orange collar, zip and cuffs, orange pants, brown shoes) are fixed to the first two racer slots. Added racers use a generic runner drawn as one colour, the chosen swatch, from head to hands, with only the eyes and mouth (both `#1b1b1b`) picked out. A sprite belongs to the racer slot, never to the typed name; no name-based behaviour.

### Race The Coco extension: paper race track
A canvas of 116px lanes alternating Warm Paper and Shadow Paper, each closed by a 3px green rule, with a 3px green rule closing the name gutter (racer name in ink, a color dot in the racer's lane color, orange Archivo Black rank label once a racer finishes). The finish is a two-tile-wide checkered strip of white and ink at the right with a rotated green FINISH label. The panel is outlined by a 3px green rule. Setup shows the same drawing as a track preview with every racer: 84px lanes, 3px sprites, name label, start rule and checkered finish tape.
- **Surge wind lines:** five horizontal lines (scaled with the sprites, clipped to the track) trailing behind a runner, two alternating frames for a whoosh. Normal surge is green at 20-60% alpha; super surge is orange (`orange`) at up to 80% alpha and 1.6x longer.

### Race The Coco extension: countdown
A Shadow Paper screen with a 3px green rule, centered. The number is Archivo Black at clamp(4.5rem, 14vw, 6rem) in green; GO turns orange. Each number pops in over 0.5s (scale 1.35 to 1, opacity 0.3 to 1) on the standard ease. There is no caption; the racers stand under the number, wrapping, bottom-aligned.

### Race The Coco extension: podium
Winner-first results: each racer's sprite over an Archivo Black name over a step. Steps are green with white numerals (2.4rem); rank 1 is the orange-winner step (200px, orange fill, green outline), rank 2 is 140px and rank 3 96px, with 96x144 sprites above. The row sits on a 3px green ground rule; further racers (rank 4+) appear in a ruled list with rank numerals and a 32x48 sprite thumbnail, no colour dots.

### Navigation
A text back-link with a small inline SVG arrow sits in the green header; no nav bar. Icons are small inline stroke SVGs (14-18px, round caps).

## Do's and Don'ts

### Do:
- **Do** build structure with 3px green rules and 2px green control borders.
- **Do** show status as a solid sticker with white text, in the fixed four-status palette.
- **Do** reserve orange for what is live: today, selection, focus, notes, Holiday.
- **Do** set big numbers in Archivo Black and keep tabular numerals on.
- **Do** keep a 3px orange focus outline on every interactive element.
- **Do** honor `prefers-reduced-motion`.
- **Do** (Race The Coco) draw sprites at whole-number scale, pixelated, with the 1px `#1b1b1b` outline, and add characters as new part-code palettes.
- **Do** (Race The Coco) use orange for the winner step, GO and super-surge lines, green for normal surge and all other steps.

### Don't:
- **Don't** use pastel cell fills or gray hairline grids; this world rejects the soft SaaS calendar.
- **Don't** round beyond 3px (the date disc and the sticky note are the only exceptions).
- **Don't** add shadows to anything resting on the wall; shadow is for floating layers.
- **Don't** introduce a second accent or new status colors.
- **Don't** extend this look to the hub; the hub has its own character (Part 2). Race The Coco is the one sanctioned extension.
- **Don't** reskin Race The Coco as a video game; sprites on ruled paper, no neon, scanlines or arcade chrome.
- **Don't** key a sprite or behaviour to a typed racer name.

---

# Part 2. Design System: TR Tools Hub

Scope: `index.html`, `hub.css`, `hub.js`, `shared/fonts/special-elite.woff2`, `shared/fonts/archivo-black.woff2` (Race The Coco miniature canvas only), and `apps/raceTheCoco/sprites.js` (loaded for the miniature). Tokens above prefixed `hub-` belong to this part only. The drawn miniatures reuse each tool's own colors and fonts (Planner greens and orange; Race The Coco paper lanes, green rules, Archivo Black labels, sprites) as literal pictures of those tools; those are depicted, not hub tokens. Tokens are normative in the frontmatter.

## Overview

**Creative North Star: "The Manila Drawer"**

The hub is a drawer of manila folders, one per tool. It refuses the equal grid of icon cards: the tool you pick is pulled forward at full size, with its name, one-line description, a drawn miniature and a red OPEN stamp. A desk-kraft ground, cream folder paper, heavy ink outlines and typewriter lettering give it a bold identity of its own, separate from the tools it opens.

Depth is made only of overlapping sheets: two more folders peek above the front one, and choosing a tab slides that folder forward. Red appears once, on the Open stamp, and nowhere else.

**Key Characteristics:**
- Desk kraft ground, manila tabs, cream paper, ink outlines at a uniform 3px.
- Special Elite typewriter face for brand, tabs, tool names and the stamp; system sans for body prose.
- One red (Stamp Red), reserved for the Open action.
- Flat paper, no blur or glow; stacking is the only depth.
- Tabs flow and wrap, so 3 to 6 tools fit at any width.

## Colors

Kraft and manila paper under near-black ink, with one rubber-stamp red.

### Primary
- **Stamp Red** (`hub-stamp`): the Open stamp border, text and hover fill only.

### Secondary
- **Manila** (`hub-manila`): inactive tabs and the rearmost folder. **Manila Light** (`hub-manila-hover`): tab hover.

### Neutral
- **Desk Kraft** (`hub-desk`): page ground.
- **Folder Paper** (`hub-paper`): front sheet and selected tab; also selection text color.
- **Middle Folder** (`hub-folder-mid`): the second folder behind the front one.
- **Ink** (`hub-ink`): outlines, headings, focus ring, selection fill. **Soft Ink** (`hub-ink-soft`): the tagline.

### Named Rules
**The One Stamp Rule.** Stamp Red is used on the Open action only. Never for status, errors, links or decoration.

## Typography

**Display Font:** Special Elite (self-hosted `shared/fonts/special-elite.woff2`, fallback Courier New, monospace)
**Body Font:** system-ui stack

**Character:** A typewriter face for everything that is a label on the folders (brand, tabs, tool names, stamp), set against plain system sans for sentences.

### Hierarchy
- **Display** (400, clamp(2.6rem, 6vw, 4.5rem), 1, -0.01em, balanced): the "TR Tools" brand.
- **Headline** (400, clamp(2rem, 4.2vw, 3.1rem), 1.05, balanced): the tool name on the folder.
- **Tab** (400, 1.1rem, 1.1; 0.95rem under 820px): tab labels.
- **Stamp** (400, 1.5rem, 0.08em, uppercase): the Open action.
- **Body** (400, 1.3rem, 1.45, max 30ch): tool description; tagline at 1.15rem, max 60ch.

### Named Rules
**The Typewriter Label Rule.** Typewriter face for what names or triggers a thing; system sans for what explains it.

## Layout

Single column, max 1120px, centered; body padding 3rem 1.25rem 4rem (1.75rem 0.75rem 3rem under 560px). Header, then a drawer 2.25rem below. The tab row flows and wraps with a 6px gap and 1.25rem left inset. The folder has a 460px minimum height. The panel is a two-column grid (0.9fr copy, 1.1fr miniature), clamp(1.5rem, 4vw, 3rem) padding and gap, vertically centered. At 820px and below the panel stacks to one column, minimum heights drop, and tabs shrink.

## Elevation & Depth

No shadows. Depth is physical stacking: two pseudo-folders sit behind the front folder, offset up by 9px and 18px, each with the full 3px outline. The selected tab is taller (51.2px vs 41.6px) and merges into the folder by matching its fill and dropping its bottom border.

### Named Rules
**The Stacked Sheets Rule.** Depth comes only from overlapping outlined sheets. No box-shadow, blur or glow on the hub.

## Shapes

Outlines are a uniform 3px ink line. Folders have a 6px radius, the front sheet 3px, tabs 14px on the top corners only, miniatures 4px. The Open stamp is square-cornered with a 4px red border and rotated -3 degrees; miniatures are rotated 1.2 degrees, like paper laid on a desk.

## Components

### Tabs
Manila fill, 3px ink outline, typewriter label, top-rounded. Hover lightens to Manila Light. Selected: Folder Paper fill, taller, opens into the folder. Background transitions 0.2s on `cubic-bezier(0.22, 1, 0.36, 1)`.

### Folder
3px ink outline, 6px radius, two offset folders behind. On tab change it slides up into place over 0.38s from 30px below (the signature interaction).

### Open stamp
Outlined, not filled: 4px Stamp Red border and text, typewriter uppercase, square-stroked arrow SVG matching the border weight. Hover fills red with paper text. Pressed: moves 3px down and scales to 0.97, as if inked into the page.

### Drawn miniature
3px ink outline, 4px radius, slight tilt, decorative and hidden from assistive tech. Planner: a white HTML/CSS card with a calendar grid. Race The Coco: a canvas drawn by `hub.js` with the app's real sprites (`sprites.js`), showing Jerome and The Coco on paper lanes (Warm Paper / Shadow Paper, 3px green rules, Archivo Black name labels, checkered finish), 4px per sprite pixel, 116px lanes; it redraws once Archivo Black has loaded. It depicts Race The Coco and does not use hub tokens. Race The Coco description copy: "Randomizer tool where you race against your coworkers and The Coco."

### Focus and selection
3px ink outline, 3px offset on every focusable element; selection is ink with paper text. Under `prefers-reduced-motion`, transitions collapse and the slide is removed.

## Do's and Don'ts

### Do:
- **Do** draw every edge with the 3px ink line and keep corners at 3 to 6px (tabs 14px on top only).
- **Do** use Stamp Red solely for the Open action.
- **Do** set brand, tabs, tool names and the stamp in Special Elite; body prose in system sans.
- **Do** add a new tool as another tab, folder panel and drawn miniature; let tabs wrap.
- **Do** keep a depicted app's colors and fonts inside its miniature; hub chrome stays on hub tokens.
- **Do** build depth only by stacking outlined sheets.

### Don't:
- **Don't** replace the drawer with an equal grid of icon cards.
- **Don't** add shadows, gradients or glow to the hub.
- **Don't** use red for anything but Open, or introduce a second accent.
- **Don't** use screenshots or live embeds as previews; draw miniatures (HTML/CSS or canvas with the tool's real assets).
- **Don't** carry the Planner's green grid or orange accent into hub chrome.
