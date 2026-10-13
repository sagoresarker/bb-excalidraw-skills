#!/usr/bin/env node
// import-lib.js — turn an Excalidraw library (.excalidrawlib) into an icon pack usable as "pack:name".
//
//   node import-lib.js <file.excalidrawlib> --pack aws [--force]   import every item into icons/aws/
//   node import-lib.js --list [pack]                               list installed packs / icon names
//
// Each item becomes icons/<pack>/<slug>.json: { name, width, height, elements } with the elements moved so
// their bounding box starts at 0,0. The renderer scales them into the icon slot (30px in nodes, 22px in tabs)
// and groups them with their node in the .excalidraw output.
const fs = require("fs");
const path = require("path");
const { ICON_DIR, ICONS } = require("./bbdiagram");

const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);

function bbox(els) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const el of els) {
    if (el.points && el.points.length) for (const [a, b] of el.points) { x0 = Math.min(x0, el.x + a); y0 = Math.min(y0, el.y + b); x1 = Math.max(x1, el.x + a); y1 = Math.max(y1, el.y + b); }
    else { x0 = Math.min(x0, el.x); y0 = Math.min(y0, el.y); x1 = Math.max(x1, el.x + el.width); y1 = Math.max(y1, el.y + el.height); }
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

function items(lib) {
  if (Array.isArray(lib.libraryItems)) return lib.libraryItems.map((it, i) => ({ name: it.name, elements: it.elements, i }));
  if (Array.isArray(lib.library)) return lib.library.map((els, i) => ({ name: null, elements: els, i }));
  throw new Error("not an .excalidrawlib file (no libraryItems / library array)");
}

function guessName(it) {
  if (it.name) return it.name;
  const t = it.elements.find((e) => e.type === "text" && e.text && e.text.trim());
  return t ? t.text.trim().split("\n")[0] : `item-${it.i + 1}`;
}

function importLib(file, pack, { force = false } = {}) {
  if (!/^[a-z0-9-]+$/.test(pack)) throw new Error(`pack name must be lowercase letters, digits, dashes (got "${pack}")`);
  const lib = JSON.parse(fs.readFileSync(file, "utf8"));
  const dir = path.join(ICON_DIR, pack);
  fs.mkdirSync(dir, { recursive: true });
  const seen = new Set(), written = [], skipped = [];
  for (const it of items(lib)) {
    const els = (it.elements || []).filter((e) => !e.isDeleted);
    if (!els.length) continue;
    if (els.some((e) => e.type === "image")) { skipped.push(`${guessName(it)} (contains images)`); continue; }
    let name = slug(guessName(it)) || `item-${it.i + 1}`;
    while (seen.has(name)) name = `${name}-${it.i + 1}`;
    seen.add(name);
    const f = path.join(dir, name + ".json");
    if (fs.existsSync(f) && !force) { skipped.push(`${name} (exists, use --force)`); continue; }
    const b = bbox(els);
    const elements = els.map((e) => ({ ...e, x: e.x - b.x, y: e.y - b.y }));
    fs.writeFileSync(f, JSON.stringify({ name: guessName(it), pack, source: path.basename(file), width: b.w, height: b.h, elements }));
    written.push(name);
  }
  return { dir, written, skipped };
}

function list(pack) {
  if (!pack) {
    console.log(`built-in: ${Object.keys(ICONS).join(" ")}`);
    if (!fs.existsSync(ICON_DIR)) return;
    for (const p of fs.readdirSync(ICON_DIR).filter((d) => fs.statSync(path.join(ICON_DIR, d)).isDirectory()))
      console.log(`${p}: ${fs.readdirSync(path.join(ICON_DIR, p)).filter((f) => f.endsWith(".json")).length} icons  (import-lib.js --list ${p})`);
    return;
  }
  const dir = path.join(ICON_DIR, pack);
  if (!fs.existsSync(dir)) { console.error(`no pack "${pack}" in ${ICON_DIR}`); process.exit(1); }
  console.log(fs.readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => `${pack}:${f.slice(0, -5)}`).join("\n"));
}

module.exports = { importLib, bbox };

if (require.main === module) {
  const a = process.argv.slice(2);
  if (a[0] === "--list") { list(a[1]); process.exit(0); }
  const file = a.find((x) => !x.startsWith("--") && a[a.indexOf(x) - 1] !== "--pack");
  const pi = a.indexOf("--pack");
  if (!file || pi < 0 || !a[pi + 1]) { console.error("usage: node import-lib.js <file.excalidrawlib> --pack <name> [--force]\n       node import-lib.js --list [pack]"); process.exit(2); }
  try {
    const r = importLib(file, a[pi + 1], { force: a.includes("--force") });
    console.log(`imported ${r.written.length} icon(s) into ${r.dir}`);
    if (r.written.length) console.log(r.written.map((n) => `  ${a[pi + 1]}:${n}`).join("\n"));
    if (r.skipped.length) console.log(`skipped ${r.skipped.length}:\n  ` + r.skipped.join("\n  "));
  } catch (e) { console.error(e.message); process.exit(1); }
}
