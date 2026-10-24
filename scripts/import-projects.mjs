#!/usr/bin/env node
// Pulls project pages from other repositories into this site.
//
// For each entry in _data/projects.yml, the pinned commit's `docs/` folder is
// copied to /<repository name>/. Its index.html is turned into a Jekyll page
// that uses this site's header, footer and styling (see _layouts/project.html),
// and its stylesheets are rewritten so their rules only apply inside the page
// content. See PROJECT_PAGES.md.
//
// Usage:
//   node scripts/import-projects.mjs
//   node scripts/import-projects.mjs --local INR-benchmark=../INR-benchmark
//   node scripts/import-projects.mjs --manifest other.yml   (testing)
//
// --local reads that project's working copy instead of the pinned commit. The
// project does not need to be in the manifest, which is how authors preview.

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";
import postcss from "postcss";
import YAML from "yaml";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WRAPPER = ".voila-project";
const MARKER = ".project-import"; // marks an output dir as generated
// IDs the site's own layout uses; project copies are dropped to keep IDs unique.
const SITE_IDS = ["main-content", "footer", "navbarSupportedContent", "scroll-top-btn"];

function fail(message) {
  console.error(`Project import failed: ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const local = new Map();
  let manifest = path.join(ROOT, "_data", "projects.yml");
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--manifest") {
      manifest = path.resolve(argv[++i] ?? fail("--manifest expects a path"));
      continue;
    }
    if (argv[i] !== "--local") fail(`unknown argument ${argv[i]}`);
    const value = argv[++i] ?? "";
    const eq = value.indexOf("=");
    if (eq < 1) fail("--local expects <repository name>=<path>");
    local.set(value.slice(0, eq), path.resolve(value.slice(eq + 1)));
  }
  return { local, manifest };
}

function readManifest(manifest) {
  const entries = YAML.parse(fs.readFileSync(manifest, "utf8")) ?? [];
  if (!Array.isArray(entries)) fail(`${manifest} must be a list`);
  return entries.map((entry) => {
    if (!entry?.repo || !/^[\w.-]+\/[\w.-]+$/.test(entry.repo)) fail(`bad repo in manifest: ${JSON.stringify(entry)}`);
    if (!/^[0-9a-f]{40}$/.test(entry.ref ?? "")) fail(`${entry.repo}: ref must be a full 40-character commit SHA`);
    return { repo: entry.repo, ref: entry.ref, source: entry.source ?? "docs", name: entry.repo.split("/")[1] };
  });
}

async function fetchSource(project, tmp) {
  const url = `https://codeload.github.com/${project.repo}/tar.gz/${project.ref}`;
  const response = await fetch(url);
  if (!response.ok) fail(`could not fetch ${project.repo}@${project.ref} (HTTP ${response.status})`);
  const archive = path.join(tmp, "source.tar.gz");
  fs.writeFileSync(archive, Buffer.from(await response.arrayBuffer()));
  const extracted = path.join(tmp, "src");
  fs.mkdirSync(extracted);
  execFileSync("tar", ["-xzf", archive, "-C", extracted, "--strip-components=1"]);
  return path.join(extracted, project.source);
}

// Every file under dir, as paths relative to dir. Symlinks are rejected so a
// project can't pull in files from outside its own folder.
function listFiles(dir, prefix = "") {
  const files = [];
  for (const entry of fs.readdirSync(path.join(dir, prefix), { withFileTypes: true })) {
    const rel = path.join(prefix, entry.name);
    if (entry.isSymbolicLink()) fail(`symbolic links are not allowed: ${rel}`);
    if (entry.isDirectory()) files.push(...listFiles(dir, rel));
    else if (entry.isFile()) files.push(rel);
  }
  return files;
}

// Jekyll would skip these (or render a stray README), so they aren't copied.
function skipFile(rel) {
  return rel.split(path.sep).some((part) => part.startsWith(".") || part.startsWith("_")) || rel === "README.md";
}

// Rewrites one selector so it only matches inside the wrapper.
// html / :root / body (and combinations) become the wrapper itself, so
// `body.theme-violet` matches the wrapper that carries the body's classes.
// A selector starting with one of the body's classes (`.theme-violet`) gets a
// second copy that matches the wrapper too, since that class now sits on it.
function scopeSelector(selector, bodyClasses) {
  const sel = selector.trim();
  const global = sel.match(/^(?:(?::root|html)(?![\w-]))?(?:\s*>?\s*body(?![\w-]))?/)[0];
  if (global) return WRAPPER + sel.slice(global.length);
  if (sel === "*") return `${WRAPPER}, ${WRAPPER} *`;
  const first = sel.split(/[\s>+~]/)[0];
  const classes = first.match(/\.[\w-]+/g) ?? [];
  if (classes.some((c) => bodyClasses.has(c.slice(1)))) return `${WRAPPER}${sel}, ${WRAPPER} ${sel}`;
  return `${WRAPPER} ${sel}`;
}

const keyframes = new Set(["keyframes", "-webkit-keyframes", "-moz-keyframes", "-o-keyframes"]);
function scopeCss(css, from, bodyClasses) {
  const scope = {
    postcssPlugin: "voila-project-scope",
    Rule(rule) {
      if (rule.parent?.type === "atrule" && keyframes.has(rule.parent.name)) return;
      if (rule[WRAPPER]) return;
      rule.selectors = rule.selectors.map((sel) => scopeSelector(sel, bodyClasses));
      rule[WRAPPER] = true;
    },
  };
  try {
    return postcss([scope]).process(css, { from }).css;
  } catch (error) {
    fail(`could not parse CSS in ${from}: ${error.message}`);
  }
}

// A reference the page makes to one of its own files, or null for external URLs.
function localPath(ref) {
  if (!ref || /^(?:[a-z][a-z0-9+.-]*:|\/\/|\/|#)/i.test(ref)) return null;
  const rel = path.normalize(ref.split(/[?#]/)[0]);
  if (rel.startsWith("..")) fail(`paths must stay inside the project folder: ${ref}`);
  return rel;
}

function importProject(project, sourceDir) {
  if (!fs.existsSync(path.join(sourceDir, "index.html"))) fail(`${project.name}: missing ${project.source}/index.html`);

  // Build in a hidden staging folder and swap it in only once everything has
  // succeeded, so a failed import never leaves a half-written page behind.
  const finalDir = path.join(ROOT, project.name);
  const outDir = path.join(ROOT, `.${project.name}.import-tmp`);
  const tracked = execFileSync("git", ["ls-files", "--", project.name], { cwd: ROOT, encoding: "utf8" });
  if (tracked.trim()) fail(`${project.name}: /${project.name}/ is already used by tracked files in this site`);
  try {
    execFileSync("git", ["check-ignore", "-q", `${project.name}/index.html`], { cwd: ROOT });
  } catch {
    fail(`${project.name}: add /${project.name}/ to .gitignore so the generated copy isn't committed`);
  }

  fs.rmSync(outDir, { recursive: true, force: true });
  for (const rel of listFiles(sourceDir)) {
    if (skipFile(rel)) continue;
    fs.mkdirSync(path.dirname(path.join(outDir, rel)), { recursive: true });
    fs.copyFileSync(path.join(sourceDir, rel), path.join(outDir, rel));
  }
  fs.writeFileSync(path.join(outDir, MARKER), `${project.repo}@${project.ref ?? "local"}\n`);

  const $ = cheerio.load(fs.readFileSync(path.join(sourceDir, "index.html"), "utf8"));
  const where = `${project.name}/index.html`;

  if ($("body nav.site-nav, body footer.site-footer").length) {
    fail(`${where} still has its own navbar or footer (nav.site-nav / footer.site-footer); remove them, the site provides both`);
  }
  const title = $("head > title").first().text().trim();
  if (!title) fail(`${where} needs a <title>`);
  const description = $('head > meta[name="description"]').attr("content")?.trim();
  const ogImage = $('head > meta[property="og:image"]').attr("content")?.trim();

  // Stylesheets and scripts can live in <head> or <body>; both are supported.
  const urlFor = (rel) => `/${project.name}/${rel}`;
  const bodyClasses = new Set(($("body").attr("class") ?? "").split(/\s+/).filter(Boolean));
  // The scoped copy goes next to the original (so relative url()s still work),
  // leaving the original for extra pages such as demo.html that also use it.
  const styles = [];
  $('link[rel="stylesheet"]').each((_, el) => {
    const href = $(el).attr("href");
    const rel = localPath(href);
    if (!rel) return; // external (e.g. fonts): the site loads its own fonts
    const file = path.join(outDir, rel);
    if (!fs.existsSync(file)) fail(`${where} links a missing stylesheet: ${href}`);
    const scopedRel = rel.replace(/(\.css)?$/, ".scoped.css");
    const scopedFile = path.join(outDir, scopedRel);
    if (!fs.existsSync(scopedFile)) fs.writeFileSync(scopedFile, scopeCss(fs.readFileSync(file, "utf8"), file, bodyClasses));
    const scopedHref = urlFor(scopedRel) + (href.match(/\?[^#]*/)?.[0] ?? ""); // keep ?v= cache busting
    if ($(el).closest("head").length) styles.push(scopedHref);
    else $(el).attr("href", scopedHref);
  });
  $("style").each((_, el) => {
    const scoped = scopeCss($(el).html() ?? "", `${where} <style>`, bodyClasses);
    if ($(el).closest("head").length) $("body").prepend(`<style>${scoped}</style>`);
    else $(el).text(scoped);
  });

  const scripts = [];
  $("head > script[src]").each((_, el) => {
    const src = $(el).attr("src");
    const script = { src: localPath(src) ? urlFor(src.replace(/^\.\//, "")) : src };
    for (const attr of ["defer", "async"]) if ($(el).attr(attr) !== undefined) script[attr] = true;
    if ($(el).attr("type")) script.type = $(el).attr("type");
    scripts.push(script);
  });
  $("head > script:not([src])").each((_, el) => {
    if ($(el).attr("type") === "application/ld+json") return; // dropped by design
    fail(`${where} has an inline <script> in <head>; move it to a file or into <body>`);
  });

  for (const id of SITE_IDS) {
    $(`body [id="${id}"]`).each((_, el) => {
      console.warn(`  ${where}: dropped id="${id}" (the site already uses it)`);
      $(el).removeAttr("id");
    });
  }

  const frontMatter = {
    layout: "project",
    permalink: `/${project.name}/`,
    render_with_liquid: false,
    title,
    ...(description && { description }),
    ...(ogImage && { og_image: ogImage }),
    project_repo: project.repo,
    project_body_class: $("body").attr("class") ?? "",
    project_styles: styles,
    project_scripts: scripts,
  };
  const body = ($("body").html() ?? "").trim();
  fs.writeFileSync(path.join(outDir, "index.html"), `---\n${YAML.stringify(frontMatter)}---\n${body}\n`);
  fs.rmSync(finalDir, { recursive: true, force: true });
  fs.renameSync(outDir, finalDir);
}

// Removes generated copies of projects that are no longer imported.
function removeStale(names) {
  for (const entry of fs.readdirSync(ROOT, { withFileTypes: true })) {
    if (entry.isDirectory() && !names.has(entry.name) && fs.existsSync(path.join(ROOT, entry.name, MARKER))) {
      fs.rmSync(path.join(ROOT, entry.name), { recursive: true, force: true });
      console.log(`Removed stale /${entry.name}/`);
    }
  }
}

const { local, manifest } = parseArgs(process.argv.slice(2));
const projects = readManifest(manifest);
for (const name of local.keys()) {
  if (!projects.some((p) => p.name === name)) projects.push({ repo: `local/${name}`, source: "docs", name });
}
const names = new Set(projects.map((p) => p.name));
if (names.size !== projects.length) fail("manifest lists the same repository name twice");

for (const project of projects) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "project-import-"));
  try {
    const sourceDir = local.has(project.name)
      ? path.join(local.get(project.name), project.source)
      : await fetchSource(project, tmp);
    if (!fs.existsSync(sourceDir)) fail(`${project.name}: ${sourceDir} does not exist`);
    importProject(project, sourceDir);
    console.log(`Imported /${project.name}/ from ${local.has(project.name) ? sourceDir : `${project.repo}@${project.ref}`}`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}
removeStale(names);
