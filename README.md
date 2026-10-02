# Ananya Sakhalkar — "The Desk"

🌐 **https://ananyasakhalkar.github.io/my-website/**

An interactive 3D study at golden hour: an open window with curtains in the breeze, and a desk where every object
opens part of her work — the PROJECTS folder, a "collaborate" mug that spills her contact details, a report card,
a publications stack, ID badges, a notebook, a corkboard of research threads, and a lamp for night mode.

Every fact also lives in a plain, prerendered document (for no-JS visitors, crawlers and anyone who prefers it):
**"Read as a document"** in the top-right, or `#/plain`.

## Develop
```bash
npm ci
npm run dev        # http://localhost:5173/my-website/
npm run build      # typecheck → build → prerender the plain document → budget and résumé checks
npm run preview    # serve dist/ at /my-website/
npm run bake       # re-bake reader page textures after editing content or page components
```

## Editing content
All text is in `src/content/*.ts` (one file per section). The 3D objects and the plain document both read from
there, so a change appears everywhere. After changing content, run `npm run bake` so the flying paper textures
match, then `npm run build` (the build fails if the textures are stale).

`resume.pdf` lives in `public/` and is shipped byte-identical (the build checks its checksum).

## Useful URL parameters
`?nointro` skip the intro · `?freeze=12.5` freeze the wind · `?quality=low|medium|high` · `?time=night` ·
`?introAt=1.6` · `?spillAt=1900` (deterministic frames for QA). Deep links: `#/projects/3`, `#/publications/1`,
`#/report-card`, `#/contact`, `#/experience/jio`, `#/about`, `#/board`, `#/plain`.

## Structure
| Path | What |
|---|---|
| `src/content/` | every fact (single source) |
| `src/scene/` | room, window, curtains, light, wind, dust, camera; shaders in `shaders/` |
| `src/objects/` | desk objects (folder, mug + spill, report card, journals, badges, notebook, board, lamp) |
| `src/reader/` | the paper reader and the DOM views of each object |
| `src/ui/` | HUD, loader, tags + keyboard proxies, plain document |
| `src/audio/` | synthesised sound (off by default) |
| `scripts/` | prerender, texture bake, budget check |

## Deploying
`.github/workflows/deploy.yml` builds and publishes `dist/` to GitHub Pages on pushes to `main`. It needs the
repository's **Settings → Pages → Source** set to **GitHub Actions** (and "Enforce HTTPS" on).

## Security
A Content-Security-Policy is injected at build (`vite.config.ts`): same-origin only, no inline scripts or styles,
no third-party requests. Fonts are self-hosted. See `ASSET_CREDITS.md` for licences.
