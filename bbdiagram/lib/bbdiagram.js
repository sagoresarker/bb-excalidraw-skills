// bbdiagram — BackendByte hand-drawn diagram renderer.
// spec (plain JS object) -> sketchy SVG (rough.js, Comic Shanns embedded) + editable .excalidraw (native elements).
//
//   const { render } = require("./bbdiagram");
//   render(spec, "out/my-diagram");
//
// Spec reference (all coordinates in px, origin top-left):
//   width, height
//   groups:  [{ x, y, w, h, label, color, icon?, dashed?, fill? }]           boxes with a label tab on the top border
//   nodes:   [{ x, y, w, h?, title, sub?, color, icon?, shape?, badge? }]     shape: "rect" (default) | "diamond" | "pill"
//   notes:   [{ x, y, w, title, lines: ["text", "#1 text with step badge"] }]  yellow sticky notes
//   annots:  [{ x, y, w, h?, text }]                                           grey side-info chips
//   texts:   [{ x, y, text, size?, color?, anchor? }]                          free text (column headers etc.)
//   edges:   [{ pts:[[x,y],...], color?, dashed?, dotted?, head?, width?, label?, badge? }]
//              color: "ink" | "blue" | "green" | "red" | "gray" | any palette key
//              head: "arrow" (default) | "cross" | "none"
//              label: { text, x, y, anchor?: "start"|"middle"|"end", color? }   text may contain \n
//              badge: { n, x, y, color? }
//   legend:  { y, items: [{ swatch: "blue", text } | { arrow: "blue", dashed?, text } | { badge: true, text }] }
//
// Palette keys: blue violet green red yellow orange teal gray white
// Icons: see ICONS below (cloud cube globe sync records cert clock controller lock lb server db vm user eye
//        workflow mesh shield trash proxy layers key check search)
const fs = require("fs");
const path = require("path");
const rough = require("roughjs");
const opentype = require("opentype.js");

const ASSETS = __dirname;
const _fb = fs.readFileSync(path.join(ASSETS, "ComicShanns.ttf"));
const font = opentype.parse(_fb.buffer.slice(_fb.byteOffset, _fb.byteOffset + _fb.length));
const tw = (t, size) => Math.max(...String(t).split("\n").map((l) => font.getAdvanceWidth(l, size)));
const FONT_ID = 8; // Excalidraw "Code" font (Comic Shanns)

// ---------------- design tokens ----------------
const INK = "#1E1E1E", SUB = "#495057";
const C = {
  blue:   { fill: "#D0EBFF", stroke: "#1971C2", tint: "#E7F5FF", text: "#1864AB" },
  violet: { fill: "#E5DBFF", stroke: "#6741D9", tint: "#F3F0FF", text: "#5F3DC4" },
  green:  { fill: "#D3F9D8", stroke: "#2F9E44", tint: "#EBFBEE", text: "#2B8A3E" },
  red:    { fill: "#FFE3E3", stroke: "#E03131", tint: "#FFF5F5", text: "#C92A2A" },
  yellow: { fill: "#FFF3BF", stroke: "#F59F00", tint: "#FFF9DB", text: "#E67700" },
  orange: { fill: "#FFE8CC", stroke: "#E8590C", tint: "#FFF4E6", text: "#D9480F" },
  teal:   { fill: "#C3FAE8", stroke: "#099268", tint: "#E6FCF5", text: "#087F5B" },
  gray:   { fill: "#E9ECEF", stroke: "#868E96", tint: "#F8F9FA", text: "#495057" },
  white:  { fill: "#FFFFFF", stroke: "#868E96", tint: "#FFFFFF", text: "#343A40" },
  ink:    { fill: "#343A40", stroke: "#343A40", tint: "#F1F3F5", text: "#343A40" },
};
const NOTE = { fill: "#FFF9DB", stroke: "#F59F00", title: "#E67700" };
const ANNOT = { fill: "#F8F9FA", stroke: "#ADB5BD", text: "#343A40" };
const edgeColor = (c) => (!c || c === "ink" ? "#343A40" : C[c] ? C[c].stroke : c);

// ---------------- icons (28x28 grid) ----------------
// ["ellipse", cx, cy, w, h, fill] | ["rect", x, y, w, h, r, fill] | ["line", pts, fill, curved]
// fill: undefined | "white" | "tint" | "ink"
const ICONS = {
  cloud: [["line", [[7, 22], [3, 18], [4, 13], [9, 11], [11, 6], [18, 5], [22, 10], [26, 13], [25, 19], [21, 22], [7, 22]], "white", true]],
  cube: [["line", [[14, 2], [25, 8], [25, 20], [14, 26], [3, 20], [3, 8], [14, 2]], "white"], ["line", [[3, 8], [14, 14], [25, 8]]], ["line", [[14, 14], [14, 26]]]],
  globe: [["ellipse", 14, 14, 25, 25, "white"], ["ellipse", 14, 14, 10, 25], ["line", [[2.5, 10], [25.5, 10]]], ["line", [[2.5, 18], [25.5, 18]]]],
  sync: [["line", [[4, 13], [6, 8], [11, 4.5], [17, 4.5], [22, 8]], undefined, true], ["line", [[22.5, 3], [22.5, 8.5], [17, 8.5]]],
    ["line", [[24, 15], [22, 20], [17, 23.5], [11, 23.5], [6, 20]], undefined, true], ["line", [[5.5, 25], [5.5, 19.5], [11, 19.5]]]],
  records: [["rect", 5, 2, 18, 24, 3, "white"], ["line", [[9, 8], [19, 8]]], ["line", [[9, 13], [19, 13]]], ["line", [[9, 18], [15, 18]]]],
  cert: [["rect", 2, 3, 24, 17, 2, "white"], ["line", [[6, 8], [16, 8]]], ["line", [[6, 12.5], [12, 12.5]]],
    ["line", [[17, 21], [16, 27], [19.5, 25], [23, 27], [22, 21]]], ["ellipse", 19.5, 18, 9, 9, "ink"]],
  clock: [["ellipse", 14, 14, 25, 25, "white"], ["line", [[14, 6.5], [14, 14], [19.5, 17.5]]]],
  controller: [["line", [[3, 8], [25, 8]]], ["line", [[3, 20], [25, 20]]], ["ellipse", 10, 8, 8, 8, "white"], ["ellipse", 18, 20, 8, 8, "white"]],
  lock: [["line", [[9, 12], [9, 8], [11, 4.5], [17, 4.5], [19, 8], [19, 12]], undefined, true], ["rect", 5, 12, 18, 14, 3, "ink"], ["ellipse", 14, 18.5, 4, 4, "white"]],
  lb: [["ellipse", 6, 14, 8, 8, "ink"], ["line", [[10, 14], [21, 6]]], ["line", [[10, 14], [21, 14]]], ["line", [[10, 14], [21, 22]]],
    ["ellipse", 23.5, 6, 5.5, 5.5, "white"], ["ellipse", 23.5, 14, 5.5, 5.5, "white"], ["ellipse", 23.5, 22, 5.5, 5.5, "white"]],
  server: [["rect", 3, 3, 22, 9.5, 2, "white"], ["rect", 3, 15.5, 22, 9.5, 2, "white"], ["ellipse", 7.5, 7.75, 2.6, 2.6, "ink"],
    ["ellipse", 7.5, 20.25, 2.6, 2.6, "ink"], ["line", [[12, 7.75], [21, 7.75]]], ["line", [[12, 20.25], [21, 20.25]]]],
  db: [["ellipse", 14, 6, 21, 7, "white"], ["line", [[3.5, 6], [3.5, 22]]], ["line", [[24.5, 6], [24.5, 22]]],
    ["line", [[3.5, 22], [8, 24.8], [14, 25.6], [20, 24.8], [24.5, 22]], undefined, true], ["line", [[3.5, 14], [8, 16.8], [14, 17.6], [20, 16.8], [24.5, 14]], undefined, true]],
  vm: [["rect", 6, 6, 16, 16, 2, "white"], ["rect", 10.5, 10.5, 7, 7, 1, "ink"], ["line", [[10, 2], [10, 6]]], ["line", [[18, 2], [18, 6]]],
    ["line", [[10, 22], [10, 26]]], ["line", [[18, 22], [18, 26]]], ["line", [[2, 10], [6, 10]]], ["line", [[2, 18], [6, 18]]],
    ["line", [[22, 10], [26, 10]]], ["line", [[22, 18], [26, 18]]]],
  user: [["ellipse", 14, 9, 11, 11, "white"], ["line", [[4, 26], [6, 19.5], [14, 16.5], [22, 19.5], [24, 26]], undefined, true]],
  eye: [["line", [[2, 14], [8, 7.5], [14, 5.5], [20, 7.5], [26, 14], [20, 20.5], [14, 22.5], [8, 20.5], [2, 14]], "white", true], ["ellipse", 14, 14, 8, 8, "ink"]],
  workflow: [["rect", 2, 3, 10, 7, 1.5, "white"], ["rect", 16, 10.5, 10, 7, 1.5, "white"], ["rect", 2, 18, 10, 7, 1.5, "white"],
    ["line", [[12, 6.5], [14, 6.5], [14, 14], [16, 14]]], ["line", [[12, 21.5], [14, 21.5], [14, 14]]]],
  mesh: [["line", [[12, 8.5], [7, 18.5]]], ["line", [[16, 8.5], [21, 18.5]]], ["line", [[8.5, 22], [19.5, 22]]],
    ["ellipse", 14, 5.5, 7.5, 7.5, "white"], ["ellipse", 5.5, 22, 7.5, 7.5, "white"], ["ellipse", 22.5, 22, 7.5, 7.5, "white"]],
  shield: [["line", [[14, 2], [24, 6], [23, 15], [14, 26], [5, 15], [4, 6], [14, 2]], "white"], ["line", [[14, 8], [14, 15]]], ["ellipse", 14, 19.5, 2.6, 2.6, "ink"]],
  trash: [["line", [[3.5, 7], [24.5, 7]]], ["line", [[10.5, 7], [10.5, 3.5], [17.5, 3.5], [17.5, 7]]],
    ["line", [[6, 7], [8, 25.5], [20, 25.5], [22, 7]]], ["line", [[11, 11], [11.5, 21.5]]], ["line", [[17, 11], [16.5, 21.5]]]],
  proxy: [["ellipse", 14, 14, 25, 25, "white"], ["line", [[6.5, 14], [21, 14]]], ["line", [[16, 9], [21, 14], [16, 19]]]],
  layers: [["line", [[14, 3], [25, 8.5], [14, 14], [3, 8.5], [14, 3]], "white"], ["line", [[3, 14], [14, 19.5], [25, 14]]], ["line", [[3, 19.5], [14, 25], [25, 19.5]]]],
  key: [["ellipse", 8, 14, 12, 12, "white"], ["ellipse", 8, 14, 3.5, 3.5, "ink"], ["line", [[14, 14], [26, 14]]], ["line", [[21.5, 14], [21.5, 18.5]]], ["line", [[25, 14], [25, 17.5]]]],
  check: [["ellipse", 14, 14, 25, 25, "white"], ["line", [[8, 14.5], [12.5, 19], [20.5, 9.5]]]],
  search: [["ellipse", 11.5, 11.5, 17, 17, "white"], ["line", [[17.5, 17.5], [25.5, 25.5]]]],
};

// ---------------- shared helpers ----------------
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const fillOf = (f, stroke, tint) => (f === "white" ? "#FFFFFF" : f === "tint" ? tint : f === "ink" ? stroke : undefined);
const tabGeom = (g) => ({ x: g.x + 20, y: g.y - 15, w: (g.icon ? 42 : 14) + tw(g.label, 15) + 14, h: 30 });
const nodeH = (n) => n.h || (n.shape === "diamond" ? 112 : n.shape === "pill" ? 56 : 64);

function render(spec, outBase) {
  const W = spec.width, H = spec.height;
  const groups = spec.groups || [], nodes = spec.nodes || [], notes = spec.notes || [], annots = spec.annots || [];
  const texts = spec.texts || [], edges = spec.edges || [];

  // ================= SVG =================
  let seedN = 41;
  const seed = () => (seedN += 7);
  const gen = rough.generator();
  const out = [];
  const emit = (d) => {
    for (const p of gen.toPaths(d)) {
      const fill = p.fill && p.fill !== "none" ? p.fill : "none";
      const dash = d.options.strokeLineDash && p.stroke !== "none" ? ` stroke-dasharray="${d.options.strokeLineDash.join(" ")}"` : "";
      out.push(`<path d="${p.d}" stroke="${p.stroke}" stroke-width="${p.strokeWidth}" fill="${fill}" stroke-linecap="round" stroke-linejoin="round"${dash}/>`);
    }
  };
  const rr = (x, y, w, h, r) => `M${x + r},${y} L${x + w - r},${y} Q${x + w},${y} ${x + w},${y + r} L${x + w},${y + h - r} Q${x + w},${y + h} ${x + w - r},${y + h} L${x + r},${y + h} Q${x},${y + h} ${x},${y + h - r} L${x},${y + r} Q${x},${y} ${x + r},${y}`;
  const sRect = (x, y, w, h, { fill, stroke, sw = 1.5, r = 12, dash = null, rg = 1 }) =>
    emit(gen.path(rr(x, y, w, h, r), { seed: seed(), roughness: rg, bowing: 1, stroke, strokeWidth: sw, fill, fillStyle: "solid", strokeLineDash: dash || undefined, preserveVertices: true }));
  const text = (x, y, s, size, color, anchor = "start") => {
    const lines = String(s).split("\n");
    lines.forEach((ln, i) => out.push(`<text x="${x}" y="${y + i * size * 1.25}" font-size="${size}" fill="${color}" text-anchor="${anchor}">${esc(ln)}</text>`));
  };
  const badge = (cx, cy, n, color, r = 11) => {
    emit(gen.circle(cx, cy, r * 2, { seed: seed(), roughness: 0.8, stroke: color, strokeWidth: 1.5, fill: color, fillStyle: "solid" }));
    text(cx, cy + (r > 10 ? 4.5 : 4), n, r > 10 ? 14 : 12, "#FFFFFF", "middle");
  };
  const icon = (name, x, y, size, stroke, tint) => {
    const k = size / 28, P = ([a, b]) => [x + a * k, y + b * k];
    const o = (f) => ({ seed: seed(), roughness: 0.55, bowing: 0.6, stroke, strokeWidth: 1.5, fill: fillOf(f, stroke, tint), fillStyle: "solid" });
    for (const p of ICONS[name]) {
      if (p[0] === "ellipse") { const [cx, cy] = P([p[1], p[2]]); emit(gen.ellipse(cx, cy, p[3] * k, p[4] * k, o(p[5]))); }
      else if (p[0] === "rect") { const [rx, ry] = P([p[1], p[2]]); emit(gen.path(rr(rx, ry, p[3] * k, p[4] * k, p[5] * k), { ...o(p[6]), preserveVertices: true })); }
      else {
        const pts = p[1].map(P), closed = p[1].length > 2 && String(p[1][0]) === String(p[1][p[1].length - 1]);
        if (p[3]) emit(gen.curve(pts, o(p[2])));
        else if (closed) emit(gen.polygon(pts.slice(0, -1), o(p[2])));
        else emit(gen.linearPath(pts, o()));
      }
    }
  };
  const arrowBody = (pts) => {
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
      const mv = (ax, ay, bx, by, k) => { const L = Math.hypot(bx - ax, by - ay); k = Math.min(k, L / 2); return [ax + (bx - ax) / L * k, ay + (by - ay) / L * k]; };
      const a = mv(x1, y1, x0, y0, 14), b = mv(x1, y1, x2, y2, 14);
      d += ` L${a[0]},${a[1]} Q${x1},${y1} ${b[0]},${b[1]}`;
    }
    return d + ` L${pts[pts.length - 1][0]},${pts[pts.length - 1][1]}`;
  };
  const sArrow = (e) => {
    const color = edgeColor(e.color), sw = e.width || (e.color && e.color !== "ink" && e.color !== "gray" ? 2 : 1.5);
    const dash = e.dashed ? [9, 7] : e.dotted ? [2, 6] : null;
    emit(gen.path(arrowBody(e.pts), { seed: seed(), roughness: e.dotted ? 0.5 : 1, bowing: 1.5, stroke: color, strokeWidth: sw, strokeLineDash: dash || undefined }));
    const [ex, ey] = e.pts[e.pts.length - 1], [px, py] = e.pts[e.pts.length - 2], ang = Math.atan2(ey - py, ex - px);
    const head = e.head || "arrow";
    if (head === "arrow") for (const s of [1, -1]) emit(gen.line(ex, ey, ex - 13 * Math.cos(ang + s * 0.42), ey - 13 * Math.sin(ang + s * 0.42), { seed: seed(), roughness: 0.8, stroke: color, strokeWidth: sw }));
    if (head === "cross") for (const s of [1, -1]) emit(gen.line(ex - 7, ey - 7 * s, ex + 7, ey + 7 * s, { seed: seed(), roughness: 0.8, stroke: color, strokeWidth: sw + 0.5 }));
  };

  sRect(16, 16, W - 32, H - 32, { fill: "#FFFFFF", stroke: "#CED4DA", sw: 1.25, r: 18, rg: 0.6 });
  for (const g of groups) {
    const c = C[g.color || "white"];
    sRect(g.x, g.y, g.w, g.h, { fill: g.fill || c.tint, stroke: c.stroke, sw: g.color === "white" || g.color === "gray" ? 1.5 : 2, r: 16, dash: g.dashed ? [10, 7] : null });
  }
  for (const g of groups) {
    const c = C[g.color || "white"], t = tabGeom(g);
    sRect(t.x, t.y, t.w, t.h, { fill: g.fill || c.tint, stroke: c.stroke, sw: 1.5, r: 15, rg: 0.8 });
    if (g.icon) icon(g.icon, t.x + 12, t.y + 4, 22, c.stroke, c.tint);
    text(t.x + (g.icon ? 42 : 14), t.y + 20, g.label, 15, c.text);
  }
  for (const a of annots) {
    const h = a.h || 40;
    sRect(a.x, a.y, a.w, h, { fill: ANNOT.fill, stroke: ANNOT.stroke, sw: 1.25, r: 8, rg: 0.8 });
    text(a.x + 14, a.y + h / 2 + 5, a.text, 14, ANNOT.text);
  }
  for (const e of edges) sArrow(e);
  for (const n of nodes) {
    const c = C[n.color || "white"], h = nodeH(n), shape = n.shape || "rect";
    const cx = n.x + n.w / 2, cy = n.y + h / 2;
    if (shape === "diamond") emit(gen.polygon([[cx, n.y], [n.x + n.w, cy], [cx, n.y + h], [n.x, cy]], { seed: seed(), roughness: 1, bowing: 1, stroke: c.stroke, strokeWidth: 2, fill: c.fill, fillStyle: "solid" }));
    else if (shape === "pill") emit(gen.ellipse(cx, cy, n.w, h, { seed: seed(), roughness: 1, stroke: c.stroke, strokeWidth: 2, fill: c.fill, fillStyle: "solid" }));
    else sRect(n.x, n.y, n.w, h, { fill: c.fill, stroke: c.stroke, sw: 2, r: 12 });
    const size = shape === "rect" ? 16 : 15;
    if (n.icon && shape === "rect") {
      icon(n.icon, n.x + 16, n.y + (h - 30) / 2, 30, c.stroke, c.fill);
      if (n.sub) { text(n.x + 60, cy - 3, n.title, size, INK); text(n.x + 60, cy + 16, n.sub, 13, SUB); }
      else text(n.x + 60, cy + 5, n.title, size, INK);
    } else {
      const tl = String(n.title).split("\n").length, block = tl * size * 1.25 + (n.sub ? 17 : 0);
      const y0 = cy - block / 2 + size * 0.95;
      text(cx, y0, n.title, size, INK, "middle");
      if (n.sub) text(cx, y0 + tl * size * 1.25 - 1, n.sub, 13, SUB, "middle");
    }
    if (n.badge) badge(n.x + 2, n.y + 2, n.badge, "#343A40");
  }
  for (const nt of notes) {
    const h = 42 + 21 * nt.lines.length;
    sRect(nt.x, nt.y, nt.w, h, { fill: NOTE.fill, stroke: NOTE.stroke, sw: 1.5, r: 6, rg: 1.2 });
    text(nt.x + 14, nt.y + 25, nt.title, 14, NOTE.title);
    emit(gen.line(nt.x + 14, nt.y + 32, nt.x + 14 + tw(nt.title, 14), nt.y + 33, { seed: seed(), roughness: 1.2, stroke: NOTE.stroke, strokeWidth: 1.25 }));
    nt.lines.forEach((ln, i) => {
      const ly = nt.y + 54 + 21 * i, m = ln.match(/^#(\d) (.*)$/);
      if (m) { badge(nt.x + 23, ly - 5, m[1], C.blue.stroke, 9); text(nt.x + 38, ly, m[2], 14, INK); } else text(nt.x + 14, ly, ln, 14, INK);
    });
  }
  for (const e of edges) {
    if (e.label) text(e.label.x, e.label.y, e.label.text, 14, e.label.color ? edgeColor(e.label.color) : (e.color && e.color !== "ink" ? C[e.color]?.text || SUB : SUB), e.label.anchor || "start");
    if (e.badge) badge(e.badge.x, e.badge.y, e.badge.n, edgeColor(e.badge.color || e.color));
  }
  for (const t of texts) text(t.x, t.y, t.text, t.size || 14, t.color || SUB, t.anchor || "start");
  const legendItems = [];
  if (spec.legend) {
    let lx = spec.legend.x || 48; const ly = spec.legend.y;
    for (const it of spec.legend.items) {
      let tx;
      if (it.swatch) { const c = C[it.swatch]; sRect(lx, ly - 13, 22, 16, { fill: c.fill, stroke: c.stroke, sw: 1.5, r: 4 }); tx = lx + 30; }
      else if (it.arrow) { sArrow({ pts: [[lx, ly - 5], [lx + 34, ly - 5]], color: it.arrow, dashed: it.dashed }); tx = lx + 44; }
      else { badge(lx + 10, ly - 5, "n", "#343A40", 10); tx = lx + 28; }
      text(tx, ly, it.text, 14, SUB);
      legendItems.push({ ...it, lx, tx });
      lx = tx + tw(it.text, 14) + 30;
    }
  }
  const fontB64 = fs.readFileSync(path.join(ASSETS, "ComicShanns.woff2")).toString("base64");
  fs.writeFileSync(outBase + ".svg", `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img"${spec.alt ? ` aria-label="${esc(spec.alt)}"` : ""}>
<defs><style>
@font-face{font-family:"Comic Shanns";src:url(data:font/woff2;base64,${fontB64}) format("woff2");}
text{font-family:"Comic Shanns","Comic Shanns Regular",ui-monospace,monospace}
</style></defs>
<rect width="${W}" height="${H}" fill="#FFFFFF"/>
${out.join("\n")}
</svg>`);

  // ================= Excalidraw =================
  let n = 0;
  const rid = () => Math.floor(Math.abs(Math.sin(++n * 9301.7) * 2 ** 31));
  const E = [];
  const base = (type, x, y, w, h, o = {}) => Object.assign({ id: `${type}-${n + 1}`, type, x, y, width: w, height: h, angle: 0,
    strokeColor: "transparent", backgroundColor: "transparent", fillStyle: "solid", strokeWidth: 2, strokeStyle: "solid",
    roughness: 1, opacity: 100, groupIds: [], frameId: null, roundness: { type: 3 }, seed: rid(), version: 1,
    versionNonce: rid(), isDeleted: false, boundElements: null, updated: 1, link: null, locked: false }, o);
  const xt = (x, y, t, size, color, align = "left", gs = []) => {
    const w = tw(t, size), lines = String(t).split("\n").length;
    return base("text", align === "center" ? x - w / 2 : align === "right" ? x - w : x, y, w, size * 1.25 * lines, {
      strokeColor: color, text: t, originalText: t, fontSize: size, fontFamily: FONT_ID, textAlign: align,
      verticalAlign: "top", containerId: null, lineHeight: 1.25, autoResize: true, roundness: null, groupIds: gs });
  };
  const xl = (type, pts, color, sw, o = {}) => {
    const [x0, y0] = pts[0], rel = pts.map(([a, b]) => [a - x0, b - y0]);
    const xs = rel.map((p) => p[0]), ys = rel.map((p) => p[1]);
    return base(type, x0, y0, Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), Object.assign({
      points: rel, strokeColor: color, strokeWidth: sw, startArrowhead: null, endArrowhead: null,
      startBinding: null, endBinding: null, lastCommittedPoint: null, roundness: null }, o));
  };
  const xbadge = (cx, cy, nn, color, r, gs) => {
    E.push(base("ellipse", cx - r, cy - r, r * 2, r * 2, { strokeColor: color, backgroundColor: color, strokeWidth: 1, roundness: null, groupIds: gs }));
    E.push(xt(cx, cy - (r > 10 ? 9 : 8), nn, r > 10 ? 14 : 12, "#FFFFFF", "center", gs));
  };
  const xicon = (name, x, y, size, stroke, tint, gs) => {
    const k = size / 28, P = ([a, b]) => [x + a * k, y + b * k];
    for (const p of ICONS[name]) {
      if (p[0] === "ellipse") { const [cx, cy] = P([p[1], p[2]]), w = p[3] * k, h = p[4] * k; E.push(base("ellipse", cx - w / 2, cy - h / 2, w, h, { strokeColor: stroke, backgroundColor: fillOf(p[5], stroke, tint) || "transparent", strokeWidth: 1, roughness: 0, roundness: null, groupIds: gs })); }
      else if (p[0] === "rect") { const [rx, ry] = P([p[1], p[2]]); E.push(base("rectangle", rx, ry, p[3] * k, p[4] * k, { strokeColor: stroke, backgroundColor: fillOf(p[6], stroke, tint) || "transparent", strokeWidth: 1, roughness: 0, groupIds: gs })); }
      else E.push(xl("line", p[1].map(P), stroke, 1, { backgroundColor: fillOf(p[2], stroke, tint) || "transparent", roughness: 0, roundness: p[3] ? { type: 2 } : null, groupIds: gs }));
    }
  };
  const xarrow = (e, gs = []) => {
    const color = edgeColor(e.color), sw = e.width || (e.color && e.color !== "ink" && e.color !== "gray" ? 2 : 1.5), head = e.head || "arrow";
    E.push(xl("arrow", e.pts, color, sw, { endArrowhead: head === "arrow" ? "arrow" : null, strokeStyle: e.dashed ? "dashed" : e.dotted ? "dotted" : "solid", roundness: e.pts.length > 2 ? { type: 2 } : null, groupIds: gs }));
    if (head === "cross") { const [ex, ey] = e.pts[e.pts.length - 1]; for (const s of [1, -1]) E.push(xl("line", [[ex - 7, ey - 7 * s], [ex + 7, ey + 7 * s]], color, sw, { groupIds: gs })); }
  };

  E.push(base("rectangle", 16, 16, W - 32, H - 32, { strokeColor: "#CED4DA", backgroundColor: "#FFFFFF", strokeWidth: 1 }));
  groups.forEach((g) => { const c = C[g.color || "white"]; E.push(base("rectangle", g.x, g.y, g.w, g.h, { strokeColor: c.stroke, backgroundColor: g.fill || c.tint, strokeStyle: g.dashed ? "dashed" : "solid", strokeWidth: g.color === "white" || g.color === "gray" ? 1 : 2 })); });
  groups.forEach((g, i) => {
    const c = C[g.color || "white"], t = tabGeom(g), gs = [`tab-${i}`];
    E.push(base("rectangle", t.x, t.y, t.w, t.h, { strokeColor: c.stroke, backgroundColor: g.fill || c.tint, strokeWidth: 1, groupIds: gs }));
    if (g.icon) xicon(g.icon, t.x + 12, t.y + 4, 22, c.stroke, c.tint, gs);
    E.push(xt(t.x + (g.icon ? 42 : 14), t.y + 6, g.label, 15, c.text, "left", gs));
  });
  annots.forEach((a, i) => { const h = a.h || 40, gs = [`annot-${i}`]; E.push(base("rectangle", a.x, a.y, a.w, h, { strokeColor: ANNOT.stroke, backgroundColor: ANNOT.fill, strokeWidth: 1, groupIds: gs })); E.push(xt(a.x + 14, a.y + h / 2 - 9, a.text, 14, ANNOT.text, "left", gs)); });
  edges.forEach((e) => xarrow(e));
  nodes.forEach((nd, i) => {
    const c = C[nd.color || "white"], h = nodeH(nd), shape = nd.shape || "rect", gs = [`node-${i}`];
    const cx = nd.x + nd.w / 2, cy = nd.y + h / 2, size = shape === "rect" ? 16 : 15;
    E.push(base(shape === "diamond" ? "diamond" : shape === "pill" ? "ellipse" : "rectangle", nd.x, nd.y, nd.w, h, { strokeColor: c.stroke, backgroundColor: c.fill, roundness: shape === "rect" ? { type: 3 } : shape === "diamond" ? { type: 2 } : null, groupIds: gs }));
    if (nd.icon && shape === "rect") {
      xicon(nd.icon, nd.x + 16, nd.y + (h - 30) / 2, 30, c.stroke, c.fill, gs);
      if (nd.sub) { E.push(xt(nd.x + 60, cy - 18, nd.title, size, INK, "left", gs)); E.push(xt(nd.x + 60, cy + 4, nd.sub, 13, SUB, "left", gs)); }
      else E.push(xt(nd.x + 60, cy - 10, nd.title, size, INK, "left", gs));
    } else {
      const tl = String(nd.title).split("\n").length, block = tl * size * 1.25 + (nd.sub ? 17 : 0), y0 = cy - block / 2;
      E.push(xt(cx, y0, nd.title, size, INK, "center", gs));
      if (nd.sub) E.push(xt(cx, y0 + tl * size * 1.25 + 1, nd.sub, 13, SUB, "center", gs));
    }
    if (nd.badge) xbadge(nd.x + 2, nd.y + 2, nd.badge, "#343A40", 11, gs);
  });
  notes.forEach((nt, i) => {
    const h = 42 + 21 * nt.lines.length, gs = [`note-${i}`];
    E.push(base("rectangle", nt.x, nt.y, nt.w, h, { strokeColor: NOTE.stroke, backgroundColor: NOTE.fill, strokeWidth: 1, groupIds: gs }));
    E.push(xt(nt.x + 14, nt.y + 10, nt.title, 14, NOTE.title, "left", gs));
    E.push(xl("line", [[nt.x + 14, nt.y + 32], [nt.x + 14 + tw(nt.title, 14), nt.y + 33]], NOTE.stroke, 1, { groupIds: gs }));
    nt.lines.forEach((ln, j) => {
      const ly = nt.y + 54 + 21 * j, m = ln.match(/^#(\d) (.*)$/);
      if (m) { xbadge(nt.x + 23, ly - 5, m[1], C.blue.stroke, 9, gs); E.push(xt(nt.x + 38, ly - 14, m[2], 14, INK, "left", gs)); }
      else E.push(xt(nt.x + 14, ly - 14, ln, 14, INK, "left", gs));
    });
  });
  edges.forEach((e, i) => {
    if (e.label) {
      const col = e.label.color ? edgeColor(e.label.color) : (e.color && e.color !== "ink" ? C[e.color]?.text || SUB : SUB);
      const al = e.label.anchor === "middle" ? "center" : e.label.anchor === "end" ? "right" : "left";
      E.push(xt(e.label.x, e.label.y - 14, e.label.text, 14, col, al));
    }
    if (e.badge) xbadge(e.badge.x, e.badge.y, e.badge.n, edgeColor(e.badge.color || e.color), 11, [`badge-${i}`]);
  });
  texts.forEach((t) => E.push(xt(t.x, t.y - (t.size || 14), t.text, t.size || 14, t.color || SUB, t.anchor === "middle" ? "center" : "left")));
  for (const it of legendItems) {
    const ly = spec.legend.y;
    if (it.swatch) { const c = C[it.swatch]; E.push(base("rectangle", it.lx, ly - 13, 22, 16, { strokeColor: c.stroke, backgroundColor: c.fill, strokeWidth: 1 })); }
    else if (it.arrow) xarrow({ pts: [[it.lx, ly - 5], [it.lx + 34, ly - 5]], color: it.arrow, dashed: it.dashed });
    else xbadge(it.lx + 10, ly - 5, "n", "#343A40", 10, []);
    E.push(xt(it.tx, ly - 14, it.text, 14, SUB));
  }
  fs.writeFileSync(outBase + ".excalidraw", JSON.stringify({ type: "excalidraw", version: 2, source: "https://backendbyte.com",
    elements: E, appState: { viewBackgroundColor: "#FFFFFF", gridSize: null }, files: {} }, null, 2));
  return { svg: outBase + ".svg", excalidraw: outBase + ".excalidraw" };
}

module.exports = { render, ICONS, C, tw };

// CLI: node bbdiagram.js spec.js [outBase]
if (require.main === module) {
  const specPath = path.resolve(process.argv[2]);
  const spec = require(specPath);
  const outBase = process.argv[3] || specPath.replace(/\.(js|json)$/, "");
  console.log(render(spec, outBase));
}
