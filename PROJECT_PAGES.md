# Project pages: guide for authors

Your paper's project page lives in your repository's `docs/` folder, as before.
The lab website pulls in your page's content and shows it inside the site's own
header, footer and styling, at `https://voilalab.github.io/<your repository>/`.
You keep full control of everything inside the page: HTML, CSS, JavaScript,
images, data.

## What the site takes from `docs/`

- **`index.html`:** the contents of `<body>`, plus these from `<head>`:
  - `<title>`, required.
  - `<meta name="description">` and `<meta property="og:image">`, used for link previews.
  - Your local stylesheets (`<link rel="stylesheet">`) and scripts (`<script src>`).

  Everything else in `<head>` is ignored: fonts (the site already loads IBM
  Plex), favicons, other meta tags and JSON-LD.
- **Every other file in `docs/`** is copied as-is. Files starting with `.` or
  `_`, and `README.md`, are skipped. Extra HTML pages (e.g. `demo.html`) are
  served unchanged, without the site's header and footer.

## What not to include

- **Your own navbar, footer or skip link.** The site provides these. The import
  fails if it finds `nav.site-nav` or `footer.site-footer`.
- **Inline `<script>` in `<head>`.** Put the code in a file, or in `<body>`.
- **IDs the site already uses:** `main-content`, `footer`,
  `navbarSupportedContent`, `scroll-top-btn`. The import drops them from your
  page with a warning.

## CSS

Your stylesheets are rewritten so their rules only apply inside your page
content:

- **Every selector is prefixed** with `.voila-project`, the element that wraps
  your content.
- **`html`, `body` and `:root` rules** apply to that wrapper instead of the
  whole window. Classes on your `<body>` (e.g. `theme-violet`) are moved onto
  it. `body { background: … }` colours your content area, and `html`
  scroll settings have no effect.
- **The site's own styles reach your content.** Bootstrap 5's base styles for
  headings, paragraphs, buttons and tables apply unless you override them, and
  so does Bootstrap's `.container` and `.lead`. Check your page in a preview.
- **Use the site's colour tokens** instead of redefining them: `--gold`,
  `--gold-light`, `--gold-dim`, `--surface`, `--surface-raised`, `--border`,
  `--text-primary`, `--text-muted`.
- **The original files are kept.** The rewritten copy is served next to the
  original as `<name>.scoped.css`, so extra pages like `demo.html` keep using
  the unmodified file.

## JavaScript guidelines

Your scripts run on the lab website alongside the site's own scripts. Nothing
enforces these guidelines, but please follow them:

- Only query and change elements inside your page content. Don't touch the site
  header, footer or search. Prefer `data-` attributes for hooks.
- Avoid top-level globals: wrap code in an IIFE or load it with
  `type="module"`.
- Prefix any `localStorage` keys or cookies with your project name.
- Use relative paths for your own files (`static/data/…`). Pages are served at
  `/<repository>/` with a trailing slash, so relative paths keep working.

## Previewing

Preview your page inside the lab website before asking for it to be deployed:

```bash
git clone https://github.com/voilalab/voilalab.github.io
cd voilalab.github.io
bundle install && npm install
npm run projects:import -- --local <your repository>=/path/to/your/repository
bundle exec jekyll serve
```

Then open `http://localhost:4000/<your repository>/`. Re-run the import after
each change.

## Getting changes deployed

The website builds your page from a pinned commit, so your pushes don't go live
on their own. Once a day, the website opens (or updates) an issue titled
"Project page update: <your repository>" listing your new `docs/` commits. A
maintainer previews them and updates the pin, which deploys them.
