# TR Tools — Claude guidance

## Project overview
A plain HTML/CSS/JS multi-tool website. No build step, no framework, no bundler — files are served directly from disk or a static host.

## Structure
```
tr-tools/
├── apps/                  # One sub-folder per tool
│   └── attendanceTracker/ # index.html, style.css, app.js
├── shared/
│   └── css/
│       └── base.css       # Shared base styles, imported by every app
├── .github/               # Issue & PR templates
├── index.html             # Landing page / app hub
└── CLAUDE.md
```

## Conventions
- Each app lives in `apps/<appName>/` and contains its own `index.html`, `style.css`, and `app.js`.
- All apps import `../../shared/css/base.css` before their own stylesheet.
- No external dependencies unless explicitly approved. Prefer vanilla JS.
- Keep HTML semantic. Avoid inline styles.
- App entry points link back to the root `index.html` via the header.

## Adding a new app
1. Create `apps/<appName>/` with `index.html`, `style.css`, `app.js`.
2. Add a card linking to it in the root `index.html`.
3. Update `README.md`.
