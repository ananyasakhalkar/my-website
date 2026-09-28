# Ananya Sakhalkar — personal site

🌐 **https://ananyasakhalkar.github.io/my-website/**

A single static page, served by GitHub Pages. No framework, no build step and no third-party scripts.

## Preview locally

```bash
python -m http.server 8080
# open http://localhost:8080
```

## Editing content

All the text lives in `index.html`. Each section is marked with a banner comment:

```html
<!-- ===== SECTION: Publications ===== -->
```

Find the section, edit the text, save, and push. Things to know:

- `<!-- PENDING Qn: … -->` comments mark places waiting for a link or detail (for example, the arXiv link).
  Replace the comment with the real content.
- Elements tagged `data-voice` are framing sentences written for this version of the site. They're easy to find and reword.
- `resume.pdf` is linked from the nav, the hero and the contact list. To update it, replace the file with the same name.

## Files

| Path | What it is |
|---|---|
| `index.html` | The whole site: content, meta tags, structured data (JSON-LD) |
| `404.html` | "Page not found" page |
| `assets/css/site.css` | Colour tokens (light and dark), typography, layout and print styles |
| `assets/js/site.js` | Theme toggle, mobile menu, section index, reveal, copy BibTeX, custom cursor (mouse only, off with reduced motion), floating "satellite" quick-links button (drag to move; position remembered). The page works without it. |
| `assets/fonts/` | Self-hosted Newsreader, Geist and Geist Mono (SIL Open Font License, see `LICENSE-*.txt`) |
| `assets/img/` | Favicon, touch icon, social card (`og.png`) and the hero contour lines |
| `robots.txt`, `sitemap.xml` | Crawl files. On a project site, crawlers only read these once the site has a custom domain. |

## Security notes

- A Content-Security-Policy `<meta>` tag allows only same-origin resources. The one inline script (the theme
  pre-paint script in `<head>`) is allowed by its SHA-256 hash. **If you change that script, recompute the hash:**
  ```bash
  printf '%s' '<script body exactly as in the file>' | openssl dgst -sha256 -binary | base64
  ```
  Then update `sha256-…` in the CSP of both `index.html` and `404.html`.
- No `style="…"` attributes or `<style>` blocks. Put all styling in `site.css`, or the CSP will block it.
- GitHub Pages can't send HTTP headers, so `frame-ancestors` (clickjacking protection) isn't available. That's acceptable
  for a static page with no actions.
- Keep "Enforce HTTPS" on in the repository's Pages settings.
