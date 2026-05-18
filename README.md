# VOILA Lab Website

Source for the VOILA research group website at Georgia Tech, served at <https://voilalab.github.io>.

Jekyll site, forked from [`sbryngelson/academic-website-template`](https://github.com/sbryngelson/academic-website-template). See upstream for design details and the original quick-start guide.

## Quick start

Prerequisites:
- **Ruby 3.2.4** (pinned in `.ruby-version`; install via `rbenv`, `asdf`, or `chruby`)
- **Bundler** (`gem install bundler`)
- **Node 20+** — only needed if you want to test the search index locally; not required for content edits

```bash
git clone git@github.com:voilalab/voilalab.github.io.git
cd voilalab.github.io
bundle install
bundle exec jekyll serve
# open http://localhost:4000
```

Live-reload works on most files; **`_config.yml` changes require restarting the server**.

## Deploying

Push to `main`. GitHub Actions (`.github/workflows/deploy.yml`) builds Jekyll, runs Pagefind to generate the search index, and publishes to GitHub Pages. Watch the **Actions** tab for green; live in roughly two minutes.

There is no manual deploy step and no staging environment.

## Where things live

| Want to change... | Edit |
|---|---|
| A paper | `assets/ref.bib` (BibTeX) |
| A team member | `_data/team_members.yml`; photo in `images/teampic/` |
| News blurb | `_data/news.yml` |
| Research area card | `_data/research.yml`; thumbnail SVG in `images/research/` |
| PI bio | `_data/pi.yml` |
| Home page copy | `_pages/home.md` |
| Other top-level page | `_pages/{team,research,papers,teaching,prospective}.md` |
| Navbar items / order | `_config.yml` (`nav_pages:`) |
| Footer copy / contact links | `_config.yml` (`about:`, `information:`) |
| Site styling | `_sass/SHB_css.scss` |
| Citation rendering style | `shb.csl` (CSL file) + `_config.yml` (`scholar.style:`) |

## Common gotchas

- **`bundle install` failing on native gems** (typically `nokogiri` or `sass-embedded`): run `bundle pristine` to rebuild compiled extensions.
- **Bibliography entries silently disappearing**: jekyll-scholar dedupes by citation key — every entry in `ref.bib` needs a unique key.
- **Pagefind search box returns nothing locally**: pagefind only runs in CI. To test locally, build then index manually:
  ```bash
  bundle exec jekyll build
  npx -y pagefind@1.5.0 --site _site
  ```
- **Images not appearing on Pages but fine locally**: Jekyll on GitHub is case-sensitive; double-check filenames.

## Repository layout

```
_config.yml          site-wide config
_data/               structured content (people, news, research, alumni, ...)
_includes/           partials used by layouts
_layouts/            page templates
_pages/              top-level pages (home, team, research, papers, ...)
_plugins/            Ruby plugins (news_date_processor.rb)
_sass/SHB_css.scss   stylesheet
assets/              ref.bib, main.scss, vendored JS, downloadable PDFs
images/              teampic/, research/, logopic/
.github/workflows/   GitHub Actions (deploy.yml)
shb.csl              citation style
```

## Template provenance

Forked from [`sbryngelson/academic-website-template`](https://github.com/sbryngelson/academic-website-template) (MIT). Files named `SHB_*` or `shb.*` (e.g. `_sass/SHB_css.scss`, `shb.csl`) are template scaffolding from the upstream author and should be left in place — they are referenced by name in config and import paths.

We do **not** plan to pull upstream template updates as a routine. The fork has been customized enough that future upstream changes would be cherry-picked manually, not merged.
