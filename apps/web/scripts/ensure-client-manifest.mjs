import { mkdirSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const manifestPath = join(
  process.cwd(),
  ".next",
  "server",
  "app",
  "(app)",
  "page_client-reference-manifest.js",
);

if (!existsSync(manifestPath)) {
  mkdirSync(dirname(manifestPath), { recursive: true });
  const content =
    'globalThis.__RSC_MANIFEST=(globalThis.__RSC_MANIFEST||{});' +
    'globalThis.__RSC_MANIFEST["/(app)/page"]={' +
    '"moduleLoading":{"prefix":"/_next/"},' +
    '"ssrModuleMapping":{},' +
    '"edgeSSRModuleMapping":{},' +
    '"clientModules":{},' +
    '"entryCSSFiles":{},' +
    '"rscModuleMapping":{},' +
    '"edgeRscModuleMapping":{}' +
    '};\n';
  writeFileSync(manifestPath, content, "utf8");
}
