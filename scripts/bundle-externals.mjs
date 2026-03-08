import { build } from "esbuild";
import { existsSync, cpSync } from "fs";

const bundles = [
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

// Copy JASSUB static assets so they're served directly (never bundled by Next.js)
if (!existsSync("public/jassub/jassub.bundle.js")) {
  console.log("[bundle-externals] copying jassub static assets → public/jassub/");
  cpSync("node_modules/jassub/dist/", "public/jassub/", { recursive: true });
} else {
  console.log("[bundle-externals] skip public/jassub/ (exists)");
}
