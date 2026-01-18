import { readFile } from "fs/promises";
import { readdir } from "fs/promises";
import path from "path";
import { envRegistry, EnvVar } from "../infra/env/registry";

const IGNORED_DIRS = new Set([
  ".git",
  ".next",
  "node_modules",
  "dist",
  "build",
  "coverage",
  ".turbo",
]);

const TEXT_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".yml",
  ".yaml",
  ".md",
]);

const REGEXES: RegExp[] = [
  /process\.env\.([A-Z0-9_]+)/g,
  /process\.env\[['"]([A-Z0-9_]+)['"]\]/g,
  /import\.meta\.env\.([A-Z0-9_]+)/g,
];

type DoctorReport = {
  usedEnv: string[];
  registryEnv: string[];
  usedNotInRegistry: string[];
  registryNotUsed: string[];
  requiredMissing: string[];
};

const isTextFile = (filePath: string) =>
  TEXT_EXTENSIONS.has(path.extname(filePath));

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
    } else if (entry.isFile() && isTextFile(fullPath)) {
      files.push(fullPath);
    }
  }
  return files;
}

function collectEnvFromText(text: string): string[] {
  const found = new Set<string>();
  for (const regex of REGEXES) {
    for (const match of text.matchAll(regex)) {
      const name = match[1];
      if (name) found.add(name);
    }
  }
  return [...found];
}

function envRegistryNames(entries: EnvVar[]): Set<string> {
  const names = new Set<string>();
  for (const entry of entries) {
    names.add(entry.name);
    if (entry.aliases) {
      entry.aliases.forEach((alias) => names.add(alias));
    }
  }
  return names;
}

function requiredEntries(entries: EnvVar[]): EnvVar[] {
  return entries.filter((entry) => {
    const required =
      entry.required ||
      (!!entry.requiredInProduction && process.env.NODE_ENV === "production");
    return required;
  });
}

async function main(): Promise<void> {
  const cwd = process.cwd();
  const files = await walk(cwd);
  const usedEnv = new Set<string>();
  for (const filePath of files) {
    const contents = await readFile(filePath, "utf-8");
    collectEnvFromText(contents).forEach((name) => usedEnv.add(name));
  }

  const registryNames = envRegistryNames(envRegistry);
  const used = [...usedEnv].sort();
  const registry = [...registryNames].sort();
  const usedNotInRegistry = used.filter((name) => !registryNames.has(name));
  const registryNotUsed = registry.filter((name) => !usedEnv.has(name));
  const requiredMissing = requiredEntries(envRegistry)
    .map((entry) => entry.name)
    .filter((name) => !process.env[name]);

  const report: DoctorReport = {
    usedEnv: used,
    registryEnv: registry,
    usedNotInRegistry,
    registryNotUsed,
    requiredMissing,
  };

  const asJson = process.argv.includes("--json");
  if (asJson) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log("Env Doctor Report");
  console.log("=================");
  console.log(`Used env vars: ${used.length}`);
  console.log(`Registry entries: ${registry.length}`);
  console.log(`Used not in registry: ${usedNotInRegistry.length}`);
  console.log(`Registry not used: ${registryNotUsed.length}`);
  console.log(`Missing required (current env): ${requiredMissing.length}`);
  if (usedNotInRegistry.length) {
    console.log("\nUsed but not in registry:");
    usedNotInRegistry.forEach((name) => console.log(`- ${name}`));
  }
  if (requiredMissing.length) {
    console.log("\nMissing required (current env):");
    requiredMissing.forEach((name) => console.log(`- ${name}`));
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Env doctor failed: ${message}`);
  process.exitCode = 1;
});
