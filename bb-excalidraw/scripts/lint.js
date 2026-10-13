#!/usr/bin/env node
// lint.js — layout checks for bbdiagram specs. Run before rendering.
//
//   node lint.js spec.(js|json) [--strict] [--json]
//
// Exit 1 when there are errors. Warnings never fail (unless --strict).
// --strict also reports coordinates that are off the 8px grid.
const path = require("path");
const { validate, loadSpec, tw, nodeH, noteH, tabGeom } = require("./bbdiagram");

const MARGIN = 48, FRAME = 16, GAP = 24, ATTACH = 4;

function lint(spec, { strict = false } = {}) {
  const out = [];
  const err = (where, msg, hint) => out.push({ level: "error", where, msg, hint });
  const warn = (where, msg, hint) => out.push({ level: "warn", where, msg, hint });
  try { validate(spec); } catch (e) { e.message.split("\n").slice(1).forEach((l) => err("spec", l.replace(/^\s*-\s*/, ""))); return out; }

  const W = spec.width, H = spec.height;
  const groups = spec.groups || [], nodes = spec.nodes || [], notes = spec.notes || [], annots = spec.annots || [];
  const edges = spec.edges || [], texts = spec.texts || [];

  // ---- collect boxes ----
  const boxes = []; // { kind, i, name, x, y, w, h, shape }
  nodes.forEach((n, i) => boxes.push({ kind: "node", i, name: `nodes[${i}] "${oneLine(n.title)}"`, x: n.x, y: n.y, w: n.w, h: nodeH(n), shape: n.shape || "rect", ref: n }));
  notes.forEach((nt, i) => boxes.push({ kind: "note", i, name: `notes[${i}] "${nt.title}"`, x: nt.x, y: nt.y, w: nt.w, h: noteH(nt), shape: "rect", ref: nt }));
  annots.forEach((a, i) => boxes.push({ kind: "annot", i, name: `annots[${i}] "${a.text}"`, x: a.x, y: a.y, w: a.w, h: a.h || 40, shape: "rect", ref: a }));
  const gboxes = groups.map((g, i) => ({ kind: "group", i, name: `groups[${i}] "${g.label}"`, x: g.x, y: g.y, w: g.w, h: g.h, shape: "rect", ref: g, tab: tabGeom(g) }));

  // ---- canvas / margins ----
  for (const b of [...boxes, ...gboxes]) {
    if (b.x < FRAME || b.y < FRAME || b.x + b.w > W - FRAME || b.y + b.h > H - FRAME)
      err(b.name, `outside the canvas frame (${W}x${H})`, "move it inside, or grow width/height");
    else if (b.x < MARGIN || b.y < MARGIN || b.x + b.w > W - MARGIN || b.y + b.h > H - MARGIN)
      warn(b.name, `inside the ${MARGIN}px outer margin`, `keep x,y >= ${MARGIN} and right/bottom <= width/height - ${MARGIN}`);
  }
  for (const g of gboxes) if (g.tab.y < FRAME) err(g.name, "label tab sticks out of the top of the canvas", `group y must be >= ${MARGIN}`);

  // ---- overlaps & gaps between boxes ----
  for (let a = 0; a < boxes.length; a++) for (let b = a + 1; b < boxes.length; b++) {
    const A = boxes[a], B = boxes[b];
    if (intersects(A, B)) err(A.name, `overlaps ${B.name}`, "move one of them; keep 32px+ between boxes");
    else if (sameContainer(A, B, gboxes) && gapBetween(A, B) < GAP && alignedOverlap(A, B))
      warn(A.name, `only ${gapBetween(A, B)}px from ${B.name}`, "use 32px+ gaps between boxes");
  }

  // ---- group containment & tabs ----
  for (const b of boxes) for (const g of gboxes) {
    if (intersects(b, g) && !contains(g, b)) err(b.name, `straddles the border of ${g.name}`, "put it fully inside or fully outside the group");
    if (contains(g, b) && b.kind === "node") {
      const pad = Math.min(b.x - g.x, g.x + g.w - (b.x + b.w), g.y + g.h - (b.y + b.h));
      if (pad < 16) warn(b.name, `only ${pad}px from the border of ${g.name}`, "keep 24px+ padding inside groups");
      if (b.y - g.y < 32) warn(b.name, `too close under the label tab of ${g.name}`, "leave 48px between group top and first row");
    }
    if (intersects(b, g.tab)) err(b.name, `covers the label tab of ${g.name}`, "move it down or shift the group");
  }
  for (let a = 0; a < gboxes.length; a++) for (let b = a + 1; b < gboxes.length; b++) {
    const A = gboxes[a], B = gboxes[b];
    if (intersects(A, B) && !contains(A, B) && !contains(B, A)) err(A.name, `partially overlaps ${B.name}`, "groups must nest fully or not touch");
    if (intersects(A.tab, B.tab)) err(A.name, `label tab collides with the tab of ${B.name}`, "offset one group's y or x");
  }

  // ---- text fit ----
  for (const n of nodes) {
    const name = `nodes[${nodes.indexOf(n)}] "${oneLine(n.title)}"`, shape = n.shape || "rect", size = shape === "rect" ? 16 : 15;
    const avail = shape === "rect" ? (n.icon ? n.w - 60 - 16 : n.w - 32) : shape === "diamond" ? n.w * 0.55 : n.w * 0.72;
    const tW = tw(n.title, size), sW = n.sub ? tw(n.sub, 13) : 0;
    if (tW > avail) err(name, `title is ${Math.ceil(tW)}px wide, only ${Math.floor(avail)}px fit`, `widen to w >= ${up8(n.w + tW - avail)} or shorten`);
    if (sW > avail) err(name, `sub line is ${Math.ceil(sW)}px wide, only ${Math.floor(avail)}px fit`, `widen to w >= ${up8(n.w + sW - avail)} or shorten`);
    if (shape === "rect" && n.icon && String(n.title).includes("\n")) warn(name, "multi-line title next to an icon renders on top of the sub line", "use one line + sub");
    const lines = String(n.title).split("\n").length + (n.sub ? 1 : 0);
    if (shape === "diamond" && lines > 2 && !n.h) warn(name, "3+ text lines in a default-height diamond", "set h: 120+");
    if (n.sub && /\[|\]/.test(n.sub)) warn(name, "brackets in sub line", 'house style: no [brackets], use " • " separators');
  }
  notes.forEach((nt, i) => nt.lines.forEach((ln) => {
    const m = String(ln).match(/^#(\d) (.*)$/), w = m ? 38 + tw(m[2], 14) : 14 + tw(ln, 14);
    if (w + 12 > nt.w) err(`notes[${i}] "${nt.title}"`, `line "${ln}" overflows (${Math.ceil(w + 12)}px > w ${nt.w})`, "widen the note or wrap into another line");
  }));
  annots.forEach((a, i) => { const w = 28 + tw(a.text, 14); if (w > a.w) err(`annots[${i}]`, `text overflows (${Math.ceil(w)}px > w ${a.w})`, "widen it"); });

  // ---- edges ----
  const attachables = [...boxes.filter((b) => b.kind === "node" || b.kind === "note" || b.kind === "annot"), ...gboxes];
  const solid = boxes;
  const badges = [];
  edges.forEach((e, i) => {
    const name = `edges[${i}]` + (e.label ? ` "${oneLine(e.label.text)}"` : "");
    const ends = [["start", e.pts[0]], ["end", e.pts[e.pts.length - 1]]];
    const attachedTo = [];
    for (const [which, p] of ends) {
      if (which === "end" && e.head === "cross") continue; // "blocked" edges stop short on purpose
      let best = Infinity, bestB = null;
      for (const b of attachables) { const d = distToShape(p, b); if (d < best) { best = d; bestB = b; } }
      const onEdge = edges.some((o, j) => j !== i && distToPolyline(p, o.pts) <= ATTACH);
      if (best > ATTACH && !onEdge) err(name, `${which} point [${p}] is ${best === Infinity ? "far" : Math.round(best) + "px"} from the nearest shape${bestB ? " (" + bestB.name + ")" : ""}`, which === "end" ? "end arrows 2px outside the target border" : "start on the source border");
      if (best <= ATTACH + 2) attachedTo.push(bestB);
    }
    for (let s = 1; s < e.pts.length; s++) {
      const [a, b] = [e.pts[s - 1], e.pts[s]];
      if (a[0] !== b[0] && a[1] !== b[1]) warn(name, `segment ${s} [${a}]→[${b}] is diagonal`, "route orthogonally: add a corner point");
      for (const bx of solid) {
        if (attachedTo.includes(bx)) continue;
        if (segHitsRect(a, b, shrink(bx, 3))) err(name, `passes through ${bx.name}`, "add corner points to route around it");
      }
    }
    if (e.label) {
      const lb = labelBox(e.label);
      for (const bx of boxes) if (intersects(lb, bx)) err(name, `label overlaps ${bx.name}`, "move the label beside the line, in free space");
      for (const g of gboxes) {
        if (intersects(lb, g) && !contains(g, lb)) warn(name, `label crosses the border of ${g.name}`, "shorten it, or move it onto a segment inside one group");
        if (intersects(lb, g.tab)) err(name, `label overlaps the label tab of ${g.name}`, "move the label");
      }
      if (polyHitsRect(e.pts, shrink(lb, 1))) warn(name, "label sits on its own line", "offset the label 10-12px from the line");
    }
    if (e.badge) badges.push(String(e.badge.n));
  });
  nodes.forEach((n) => n.badge && badges.push(String(n.badge)));
  notes.forEach((nt) => nt.lines.forEach((l) => { const m = String(l).match(/^#(\d) /); if (m) badges.push("note:" + m[1]); }));
  const nums = badges.filter((b) => /^\d+$/.test(b)).map(Number).sort((a, b) => a - b);
  const dup = nums.filter((v, i) => nums[i - 1] === v);
  if (dup.length) warn("badges", `duplicate step numbers: ${[...new Set(dup)].join(", ")}`, "number steps 1..n once each");
  if (nums.length && nums.some((v, i) => v !== i + 1) && !dup.length) warn("badges", `step numbers are not 1..${nums.length}: ${nums.join(",")}`, "renumber so there are no gaps");

  // ---- free text ----
  texts.forEach((t, i) => { const tb = textBox(t.x, t.y, t.text, t.size || 14, t.anchor); for (const bx of boxes) if (intersects(tb, bx)) warn(`texts[${i}] "${t.text}"`, `overlaps ${bx.name}`, "move it"); });

  // ---- legend ----
  if (spec.legend) {
    let lx = spec.legend.x || 48;
    for (const it of spec.legend.items) { const tx = it.swatch ? lx + 30 : it.arrow ? lx + 44 : lx + 28; lx = tx + tw(it.text, 14) + 30; }
    const right = lx - 30;
    if (right > W - FRAME) err("legend", `runs to x=${Math.round(right)}, past the canvas (${W})`, "shorten item texts, drop items, or widen the canvas");
    else if (right > W - MARGIN) warn("legend", `ends inside the right margin (x=${Math.round(right)})`, "shorten item texts");
    const ly = spec.legend.y, band = { x: 0, y: ly - 16, w: W, h: 22 };
    for (const bx of [...boxes, ...gboxes]) if (intersects(band, bx)) err("legend", `row at y=${ly} overlaps ${bx.name}`, "put the legend 40px+ below the lowest box");
    if (ly > H - 24) err("legend", `y=${ly} is too close to the bottom`, `height should be >= legend.y + 52`);
  }

  // ---- grid (strict) ----
  if (strict) for (const b of [...boxes, ...gboxes]) {
    const off = ["x", "y", "w", "h"].filter((k) => b.ref[k] !== undefined && b.ref[k] % 8 !== 0);
    if (off.length) warn(b.name, `${off.join(",")} not on the 8px grid`, "round to multiples of 8");
  }
  return out;
}

// ---------------- geometry ----------------
const up8 = (v) => Math.ceil(v / 8) * 8;
const oneLine = (s) => String(s).replace(/\n/g, " ");
const intersects = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const contains = (o, i) => i.x >= o.x && i.y >= o.y && i.x + i.w <= o.x + o.w && i.y + i.h <= o.y + o.h;
const shrink = (b, d) => ({ ...b, x: b.x + d, y: b.y + d, w: b.w - 2 * d, h: b.h - 2 * d });
const gapBetween = (a, b) => Math.max(b.x - (a.x + a.w), a.x - (b.x + b.w), b.y - (a.y + a.h), a.y - (b.y + b.h));
const alignedOverlap = (a, b) => (a.x < b.x + b.w && b.x < a.x + a.w) || (a.y < b.y + b.h && b.y < a.y + a.h);
const innermost = (b, gs) => gs.filter((g) => contains(g, b)).sort((p, q) => p.w * p.h - q.w * q.h)[0] || null;
const sameContainer = (a, b, gs) => innermost(a, gs) === innermost(b, gs);
const labelBox = (l) => textBox(l.x, l.y, l.text, 14, l.anchor);
function textBox(x, y, t, size, anchor) {
  const w = tw(t, size), lines = String(t).split("\n").length;
  return { x: anchor === "middle" ? x - w / 2 : anchor === "end" ? x - w : x, y: y - size, w, h: size * 1.25 * lines };
}
function distSeg(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy;
  const t = L ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L)) : 0;
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}
const distToPolyline = (p, pts) => Math.min(...pts.slice(1).map((q, i) => distSeg(p, pts[i], q)));
function distToShape(p, b) {
  if (b.shape === "diamond") {
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2, poly = [[cx, b.y], [b.x + b.w, cy], [cx, b.y + b.h], [b.x, cy], [cx, b.y]];
    return distToPolyline(p, poly);
  }
  if (b.shape === "pill") {
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2, rx = b.w / 2, ry = b.h / 2;
    let best = Infinity; for (let k = 0; k < 360; k += 2) { const t = (k * Math.PI) / 180; best = Math.min(best, Math.hypot(p[0] - cx - rx * Math.cos(t), p[1] - cy - ry * Math.sin(t))); }
    return best;
  }
  const poly = [[b.x, b.y], [b.x + b.w, b.y], [b.x + b.w, b.y + b.h], [b.x, b.y + b.h], [b.x, b.y]];
  return distToPolyline(p, poly);
}
function segHitsRect(a, b, r) {
  if (r.w <= 0 || r.h <= 0) return false;
  // Liang–Barsky clip
  let t0 = 0, t1 = 1; const dx = b[0] - a[0], dy = b[1] - a[1];
  for (const [p, q] of [[-dx, a[0] - r.x], [dx, r.x + r.w - a[0]], [-dy, a[1] - r.y], [dy, r.y + r.h - a[1]]]) {
    if (p === 0) { if (q < 0) return false; continue; }
    const t = q / p; if (p < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; }
  }
  return t0 < t1;
}
const polyHitsRect = (pts, r) => pts.slice(1).some((q, i) => segHitsRect(pts[i], q, r));

module.exports = { lint };

if (require.main === module) {
  const args = process.argv.slice(2), file = args.find((a) => !a.startsWith("--"));
  if (!file) { console.error("usage: node lint.js spec.(js|json) [--strict] [--json]"); process.exit(2); }
  const strict = args.includes("--strict");
  let spec; try { spec = loadSpec(file); } catch (e) { console.error(`cannot load ${file}: ${e.message}`); process.exit(2); }
  const res = lint(spec, { strict });
  const errors = res.filter((r) => r.level === "error"), warns = res.filter((r) => r.level === "warn");
  if (args.includes("--json")) console.log(JSON.stringify(res, null, 2));
  else {
    for (const r of [...errors, ...warns]) console.log(`${r.level === "error" ? "ERROR" : "warn "} ${r.where}: ${r.msg}${r.hint ? `\n        → ${r.hint}` : ""}`);
    console.log(`${path.basename(file)}: ${errors.length} error(s), ${warns.length} warning(s)`);
  }
  process.exit(errors.length || (strict && warns.length) ? 1 : 0);
}
