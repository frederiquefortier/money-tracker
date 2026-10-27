// Every requirement ID cited in the docs must exist in requirements.md.
// Ranges like TRX-01..06 are checked on their first ID. The raw notes are not scanned.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = new URL("../..", import.meta.url).pathname;
const requirements = readFileSync(join(root, "docs/00_briefing/requirements.md"), "utf8");

const defined = new Set([...requirements.matchAll(/^\| ([A-Z]{2,3}-\d{2}) \|/gm)].map((m) => m[1]));
const prefixes = [...new Set([...defined].map((id) => id.split("-")[0]))];
const citation = new RegExp(`\\b(?:${prefixes.join("|")})-\\d{2}\\b`, "g");

function markdownFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === "notes" ? [] : markdownFiles(path);
    return name.endsWith(".md") ? [path] : [];
  });
}

const files = [...markdownFiles(join(root, "docs")), join(root, "README.md"), join(root, "CLAUDE.md")];
const missing = [];
for (const file of files) {
  readFileSync(file, "utf8").split("\n").forEach((line, i) => {
    for (const [id] of line.matchAll(citation)) {
      if (!defined.has(id)) missing.push(`${relative(root, file)}:${i + 1} ${id}`);
    }
  });
}

if (missing.length) {
  console.error(`Requirement IDs cited but not defined in requirements.md:\n${missing.join("\n")}`);
  process.exit(1);
}
console.log(`${defined.size} requirement IDs defined, every citation resolves.`);
