import { build } from "esbuild";
import { existsSync } from "fs";

const bundles = [
  {
    entry: "node_modules/jassub/dist/jassub.js",
    out: "public/jassub/jassub.bundle.js",
  },
  {
    entry: "node_modules/libpgs/dist/libpgs.js",
    out: "public/libpgs.bundle.js",
  },
];

for (const { entry, out } of bundles) {
  if (existsSync(out)) {
    console.log(`[bundle-externals] skip ${out} (exists)`);
    continue;
  }
  console.log(`[bundle-externals] bundling ${entry} → ${out}`);
  await build({
    entryPoints: [entry],
    bundle: true,
    format: "esm",
    outfile: out,
    platform: "browser",
  });
}
