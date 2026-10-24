#!/usr/bin/env node
// Keeps one open issue per project page whose source has commits past its pin.
//
// For each entry in _data/projects.yml, compares the pinned `ref` with the
// project's default branch. If anything under its source folder (docs/) has
// changed, an issue "Project page update: <name>" is created or updated with
// the new commits. When the pin catches up, the issue is closed.
// Run by .github/workflows/project-page-updates.yml. See PROJECT_PAGES.md.
//
// Usage:
//   GITHUB_TOKEN=... GITHUB_REPOSITORY=voilalab/voilalab.github.io node scripts/check-project-updates.mjs
//   node scripts/check-project-updates.mjs --dry-run [--manifest path]
//
// --dry-run prints what it would do and never writes issues. Reading public
// project repos works without a token; listing this repo's issues may too.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LABEL = "project-page-update";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const manifestArg = args.indexOf("--manifest");
const manifest = manifestArg >= 0 ? path.resolve(args[manifestArg + 1]) : path.join(ROOT, "_data", "projects.yml");
const site = process.env.GITHUB_REPOSITORY ?? "voilalab/voilalab.github.io";
const token = process.env.GITHUB_TOKEN;
if (!dryRun && !token) {
  console.error("GITHUB_TOKEN is required unless --dry-run is passed");
  process.exit(1);
}

async function api(method, route, body) {
  const response = await fetch(`https://api.github.com${route}`, {
    method,
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(body && { "Content-Type": "application/json" }),
    },
    body: body && JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`${method} ${route}: HTTP ${response.status} ${await response.text()}`);
  return response.status === 204 ? null : response.json();
}

// Project commits after the pin that touched the source folder, newest first.
async function pendingCommits(project) {
  const repo = await api("GET", `/repos/${project.repo}`);
  const compare = await api("GET", `/repos/${project.repo}/compare/${project.ref}...${repo.default_branch}`);
  if (compare.status === "diverged" || compare.status === "behind") {
    console.warn(`  ${project.repo}: pin ${project.ref.slice(0, 7)} is not an ancestor of ${repo.default_branch} (${compare.status})`);
  }
  const prefix = `${project.source}/`;
  if (!(compare.files ?? []).some((file) => file.filename.startsWith(prefix))) return { commits: [], compare, repo };

  const inRange = new Set(compare.commits.map((commit) => commit.sha));
  const touching = await api("GET", `/repos/${project.repo}/commits?sha=${repo.default_branch}&path=${project.source}&per_page=100`);
  const commits = touching.filter((commit) => inRange.has(commit.sha));
  return { commits, compare, repo };
}

function issueBody(project, { commits, compare, repo }, number) {
  const head = commits[0].sha;
  const list = commits
    .map((c) => `- [\`${c.sha.slice(0, 7)}\`](${c.html_url}) ${c.commit.message.split("\n")[0]}`)
    .join("\n");
  return `The project page source for **${project.repo}** (\`${project.source}/\`) has changed since the pinned commit.

**Pinned:** \`${project.ref}\`
**Latest change:** \`${head}\` on \`${repo.default_branch}\`
**Diff:** ${compare.html_url}

Commits touching \`${project.source}/\`:
${list}

To deploy these changes:
1. Preview locally: clone \`${project.repo}\` at \`${head}\`, then in this repo run
   \`npm run projects:import -- --local ${project.name}=/path/to/${project.name}\` and \`bundle exec jekyll serve\`.
2. In \`_data/projects.yml\`, set this project's \`ref\` to \`${head}\`.
3. Open a PR with "Closes #${number ?? "<this issue>"}" in its description.

<sub>Updated daily by \`.github/workflows/project-page-updates.yml\`.</sub>`;
}

async function findIssue(title) {
  const issues = await api("GET", `/repos/${site}/issues?state=open&labels=${LABEL}&per_page=100`);
  return issues.find((issue) => issue.title === title);
}

async function ensureLabel() {
  try {
    await api("GET", `/repos/${site}/labels/${LABEL}`);
  } catch {
    await api("POST", `/repos/${site}/labels`, { name: LABEL, color: "c0995e", description: "A project page has unpublished changes" });
  }
}

const entries = YAML.parse(fs.readFileSync(manifest, "utf8")) ?? [];
const projects = entries.map((e) => ({ repo: e.repo, ref: e.ref, source: e.source ?? "docs", name: e.repo.split("/")[1] }));
if (!projects.length) console.log("No project pages in the manifest.");
if (projects.length && !dryRun) await ensureLabel();

let failed = false;
for (const project of projects) {
  const title = `Project page update: ${project.name}`;
  try {
    const pending = await pendingCommits(project);
    let existing;
    try {
      existing = await findIssue(title);
    } catch (error) {
      if (!dryRun) throw error;
      console.warn(`  could not read issues on ${site} (${error.message.split(":")[0]}); assuming none open`);
    }

    if (pending.commits.length) {
      const body = issueBody(project, pending, existing?.number);
      if (dryRun) {
        console.log(`[dry run] would ${existing ? `update #${existing.number}` : "create"} "${title}":\n\n${body}\n`);
      } else if (existing) {
        await api("PATCH", `/repos/${site}/issues/${existing.number}`, { body });
        console.log(`Updated #${existing.number} (${title})`);
      } else {
        const issue = await api("POST", `/repos/${site}/issues`, { title, body, labels: [LABEL] });
        await api("PATCH", `/repos/${site}/issues/${issue.number}`, { body: issueBody(project, pending, issue.number) });
        console.log(`Created #${issue.number} (${title})`);
      }
    } else if (existing) {
      if (dryRun) {
        console.log(`[dry run] would close #${existing.number}: ${project.name} is up to date`);
      } else {
        await api("POST", `/repos/${site}/issues/${existing.number}/comments`, { body: `The pin now matches the latest \`${project.source}/\` change. Closing.` });
        await api("PATCH", `/repos/${site}/issues/${existing.number}`, { state: "closed", state_reason: "completed" });
        console.log(`Closed #${existing.number} (${title})`);
      }
    } else {
      console.log(`${project.name}: up to date`);
    }
  } catch (error) {
    console.error(`${project.name}: ${error.message}`);
    failed = true; // keep checking the other projects
  }
}
process.exit(failed ? 1 : 0);
