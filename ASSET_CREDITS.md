# Asset credits

Every third-party asset shipped with the site, with its source and licence (DESK_SPEC §9: CC0 / OFL only).

## Fonts (SIL Open Font License 1.1, self-hosted in `public/assets/fonts/`, licences alongside)
| Font | Use | Source |
|---|---|---|
| Newsreader | titles, body | Production Type, via Fontsource (`@fontsource-variable/newsreader`) |
| Geist, Geist Mono | HUD, labels | Vercel, via Fontsource (`@fontsource-variable/geist`, `…/geist-mono`) |
| Courier Prime | typewriter labels, stamps | Quote-Unquote Apps, via Fontsource (`@fontsource/courier-prime`) |
| Caveat | handwriting: tags, captions, notebook | Impallari Type, via Fontsource (`@fontsource-variable/caveat`) |

## Textures, models, sound — none downloaded
- **Textures** (plaster, oak, floorboards, cork, felt, linen, foliage, rooftops, folder cover, labels, badges,
  report card, notebook, board cards, the polaroid's "fields"): generated procedurally at runtime on canvases
  (`src/scene/textures.ts` and the object components). The polaroid is an abstract procedural patchwork, not real imagery.
- **Decor art** (`src/scene/decorTextures.ts`): the two wall posters (a star-centred round shield with speed lines,
  and a team of silhouettes against a city sunset) and the cat's tabby fur are original drawings made on a canvas at
  runtime. They are an homage only: no logos, character names, lettering or copied artwork.
- **Document crest** (`src/reader/pages/Crest.tsx`): an original shield / star / chevron SVG, no lettering.
- **Models**: all procedural three.js geometry (no GLB files).
- **Sound**: synthesised at runtime with the Web Audio API (`src/audio/sound.ts`); no recordings.
- **Reader page textures** (`public/assets/pages/*.webp`): screenshots of the site's own page components, baked
  by `npm run bake`.

No brand logos are rendered anywhere (Jio, Reliance, IEEE, SRM, AWS, Cisco, NPTEL, LinkedIn, GitHub): text only.
