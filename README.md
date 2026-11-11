# TR Tools

A collection of simple browser-based utilities. Live @ https://jschreibs.github.io/tr-tools/

## Apps

| App | Description |
|-----|-------------|
| [Planner](apps/planner/) | Calculate how many in-office days you need to meet TR requirements |
| [Race The Coco](apps/raceTheCoco/) | Race your coworkers with 8-bit characters. Fun randomization tool. |

## Adding a new app

See [CLAUDE.md](CLAUDE.md) for conventions and step-by-step instructions.

## Development

No dependencies or build tools required. Open `index.html` in a browser or use a local static server:

```bash
npx serve .
```

## Testing

Browser tests use [Playwright](https://playwright.dev). It is dev tooling only; the site itself still has no build step or runtime dependencies.

```bash
npm install
npx playwright install chromium   # first time only
npm test                          # runs every test (the race tests take about 35s)
npm run test:ui                   # interactive runner
```

Tests live in `tests/` (hub, Planner, Race The Coco). They start their own local server, and the Planner tests use a fixed clock (June 2026) so they don't depend on today's date. GitHub Actions runs them on every pull request.
