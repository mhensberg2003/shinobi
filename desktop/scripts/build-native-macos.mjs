import { chmodSync, copyFileSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import process from "node:process";

if (process.platform !== "darwin") {
  process.exit(0);
}

const root = path.resolve(import.meta.dirname, "..");
const bundleDylibs = process.argv.includes("--bundle-dylibs");
const source = path.join(root, "native", "libmpv_renderer.mm");
const outputDir = path.join(root, "native", "build");
const output = path.join(outputDir, "libmpv_renderer.node");
const systemPrefixes = ["/System/Library/", "/usr/lib/", "/usr/lib/swift/"];

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    ...options,
  });
  if (result.status !== 0) {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    throw new Error(`${command} ${args.join(" ")} failed`);
  }
  return result.stdout ?? "";
}

function resolveExistingPath(candidates) {
  for (const candidate of candidates) {
    if (candidate && existsSync(candidate)) return candidate;
  }
  return null;
}

function findNodeInclude() {
  const execPrefix = path.resolve(process.execPath, "..", "..");
  return resolveExistingPath([
    path.join(execPrefix, "include", "node"),
    "/opt/homebrew/include/node",
    "/usr/local/include/node",
  ]);
}

function findMpvPrefix() {
  const brewPrefix = (() => {
    try {
      return execFileSync("brew", ["--prefix", "mpv"], { encoding: "utf8" }).trim();
    } catch {
      return "";
    }
  })();

  return resolveExistingPath([
    process.env.MPV_PREFIX || "",
    brewPrefix,
    "/opt/homebrew/opt/mpv",
    "/usr/local/opt/mpv",
  ]);
}

function listDependencies(file) {
  const output = run("otool", ["-L", file]);
  return output
    .split("\n")
    .slice(1)
    .map((line) => line.trim().split(" ")[0])
    .filter(Boolean);
}

function isBundledDependency(file) {
  if (!file) return false;
  return !systemPrefixes.some((prefix) => file.startsWith(prefix));
}

function relinkBinary(file, bundleMap) {
  for (const dependency of listDependencies(file)) {
    const replacement = bundleMap.get(dependency);
    if (!replacement) continue;
    run("install_name_tool", ["-change", dependency, replacement, file]);
  }
}

function signBinary(file) {
  run("codesign", ["--force", "--sign", "-", "--timestamp=none", file]);
}

function clearBuildDir() {
  rmSync(outputDir, { recursive: true, force: true });
  mkdirSync(outputDir, { recursive: true });
}

function failOrSkip(message) {
  if (bundleDylibs) {
    console.error(message);
    process.exit(1);
  }

  clearBuildDir();
  console.warn(`${message}
Skipping macOS libmpv addon build for this environment.`);
  process.exit(0);
}

const nodeInclude = findNodeInclude();
const mpvPrefix = findMpvPrefix();

if (!nodeInclude) {
  failOrSkip("Missing Node headers. Checked the current Node prefix and common Homebrew paths.");
}

if (!mpvPrefix) {
  failOrSkip("Missing Homebrew mpv prefix. Set MPV_PREFIX if mpv is installed elsewhere.");
}

const mpvInclude = path.join(mpvPrefix, "include");
const mpvLib = path.join(mpvPrefix, "lib");
const rootMpvLib = path.join(mpvLib, "libmpv.2.dylib");

if (!existsSync(path.join(mpvInclude, "mpv", "client.h")) || !existsSync(rootMpvLib)) {
  failOrSkip(`Missing libmpv headers or dylib under ${mpvPrefix}`);
}

clearBuildDir();

const compileArgs = [
  "-std=c++20",
  "-x",
  "objective-c++",
  "-fobjc-arc",
  "-fno-rtti",
  "-I",
  nodeInclude,
  "-I",
  mpvInclude,
  "-bundle",
  "-undefined",
  "dynamic_lookup",
  "-o",
  output,
  source,
  "-L",
  mpvLib,
  "-lmpv",
  "-framework",
  "AppKit",
  "-framework",
  "Foundation",
  "-framework",
  "OpenGL",
  "-framework",
  "QuartzCore",
  "-Wl,-rpath," + mpvLib,
];

run("clang++", compileArgs, { stdio: "inherit" });

if (!bundleDylibs) {
  process.exit(0);
}

const queue = [rootMpvLib];
const visited = new Set();
const copied = [];
const copiedBySource = new Map();

while (queue.length > 0) {
  const current = queue.pop();
  if (!current || visited.has(current) || !isBundledDependency(current)) continue;
  visited.add(current);

  const destination = path.join(outputDir, path.basename(current));
  copyFileSync(current, destination);
  chmodSync(destination, 0o755);
  copied.push(destination);
  copiedBySource.set(current, destination);

  for (const dependency of listDependencies(current)) {
    if (isBundledDependency(dependency) && !visited.has(dependency)) {
      queue.push(dependency);
    }
  }
}

const bundleMap = new Map();
for (const [source, destination] of copiedBySource) {
  bundleMap.set(source, `@loader_path/${path.basename(destination)}`);
  bundleMap.set(destination, `@loader_path/${path.basename(destination)}`);
}

for (const file of copied) {
  run("install_name_tool", ["-id", `@loader_path/${path.basename(file)}`, file]);
}

for (const file of copied) {
  relinkBinary(file, bundleMap);
}

relinkBinary(output, bundleMap);
for (const file of copied) {
  signBinary(file);
}
signBinary(output);
