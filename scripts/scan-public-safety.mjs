#!/usr/bin/env node
import { readFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";

const ignoredDirs = new Set([".git", "node_modules", "dist", "build", ".next"]);
const ignoredFiles = new Set(["blocked-patterns.json"]);
const textExtensions = new Set([".md", ".txt", ".js", ".mjs", ".json", ".html", ".css", ".yml", ".yaml"]);

function extname(path) {
  const index = path.lastIndexOf(".");
  return index === -1 ? "" : path.slice(index);
}

async function walk(root) {
  const entries = await readdir(root);
  const files = [];

  for (const entry of entries) {
    if (ignoredDirs.has(entry)) continue;
    if (ignoredFiles.has(entry)) continue;
    const path = join(root, entry);
    const info = await stat(path);
    if (info.isDirectory()) {
      files.push(...await walk(path));
    } else if (textExtensions.has(extname(path))) {
      files.push(path);
    }
  }

  return files;
}

async function loadRules() {
  const url = new URL("../rules/blocked-patterns.json", import.meta.url);
  const data = JSON.parse(await readFile(url, "utf8"));
  return data.patterns.map((rule) => ({
    name: rule.name,
    regex: new RegExp(rule.pattern, "i"),
  }));
}

async function main() {
  const target = process.argv[2] || ".";
  const rules = await loadRules();
  const files = await walk(target);
  const findings = [];

  for (const file of files) {
    const text = await readFile(file, "utf8");
    const lines = text.split(/\r?\n/);
    lines.forEach((line, index) => {
      for (const rule of rules) {
        if (rule.regex.test(line)) {
          findings.push({ file, line: index + 1, rule: rule.name });
        }
      }
    });
  }

  if (!findings.length) {
    console.log(`No publish-safety findings in ${files.length} text files.`);
    return;
  }

  for (const finding of findings) {
    console.log(`${finding.file}:${finding.line} ${finding.rule}`);
  }
  process.exitCode = 1;
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
