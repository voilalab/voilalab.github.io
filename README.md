# VOILA Lab Website

Source for the VOILA research group website at Georgia Tech, served at <https://voilalab.github.io>.

Jekyll site, forked from [`sbryngelson/academic-website-template`](https://github.com/sbryngelson/academic-website-template). See upstream for design details and the original quick-start guide.

## Updating information

Pick the issue template that matches what you want to change — each opens a pre-filled issue:

1. [My team page info needs updating](https://github.com/voilalab/voilalab.github.io/issues/new?template=1_member-update.yml)
2. [I'm a new lab member and not yet on the team page](https://github.com/voilalab/voilalab.github.io/issues/new?template=2_member-addition.yml)
3. [A paper of ours was accepted to a venue](https://github.com/voilalab/voilalab.github.io/issues/new?template=3_paper-acceptance.yml)
4. [A paper of ours was posted on arXiv](https://github.com/voilalab/voilalab.github.io/issues/new?template=4_paper-arxiv.yml)
5. [Other news - a talk, award, fellowship, etc.](https://github.com/voilalab/voilalab.github.io/issues/new?template=5_news.yml)

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

### Project pages

Some papers have a project page whose content lives in the paper's own
repository (`docs/`). This site pulls each page's body in at a pinned commit
and wraps it in the site's header, footer and styling. The page keeps its old
URL, `/<repository name>/`. Authors: see [PROJECT_PAGES.md](PROJECT_PAGES.md).

- `_data/projects.yml` lists each project repository and the commit to build.
  It is empty until a project page is switched over.
- The deploy workflow runs `npm run projects:import`
  (`scripts/import-projects.mjs`) before Jekyll. The generated `/<name>/`
  folders are gitignored.
- A daily workflow (`.github/workflows/project-page-updates.yml`) opens or
  updates one `project-page-update` issue per project when its `docs/` has
  commits past the pin, and closes it once the pin catches up.
- To deploy a project page update: preview it (below), change its `ref` in
  `_data/projects.yml`, and merge a PR that says "Closes #<issue>".

Preview a project page from a local checkout (the project does not need to be in
the manifest):

```bash
npm install
npm run projects:import -- --local INR-benchmark=/path/to/INR-benchmark
bundle exec jekyll serve
```

`npm run projects:import` with no `--local` goes back to the pinned versions.

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
| A project page | The paper's repository, `docs/`; pinned commit in `_data/projects.yml` |
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
scripts/             Project page importer and update checker
_sass/SHB_css.scss   stylesheet
assets/              ref.bib, main.scss, vendored JS, downloadable PDFs
images/              teampic/, research/, logopic/
.github/workflows/   GitHub Actions (deploy.yml)
shb.csl              citation style
```

## Template 

Officially forked from [`sbryngelson/academic-website-template`](https://github.com/sbryngelson/academic-website-template) (MIT), but in reality was forked from the [comp-physics website](https://github.com/comp-physics/comp-physics.github.io) which uses the template.
