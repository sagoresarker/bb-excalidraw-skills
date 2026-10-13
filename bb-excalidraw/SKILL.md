---
name: bb-excalidraw
description: Draw BackendByte-style hand-drawn technical diagrams (architecture, request paths, workflows/flowcharts, swimlane sequences, cross-cloud setups) from a small JS/JSON spec. Outputs a sketchy blog-ready SVG, an editable native .excalidraw file and a PNG preview. Use when the user asks for an excalidraw diagram, a hand-drawn/sketchy diagram, a BackendByte or blog diagram, or wants a system/flow visualised in this house style. Supports icons imported from Excalidraw libraries (.excalidrawlib).
---

# bb-excalidraw

Turn a description of a system or flow into a **spec** (a plain object with pixel coordinates). From that spec, the renderer produces:
- `<name>.svg`: sketchy rough.js strokes with the Comic Shanns font embedded. Use it on the blog.
- `<name>.excalidraw`: the same diagram as native Excalidraw elements (font "Code"), with icons grouped to their boxes. It can be edited on excalidraw.com.
- `<name>.png`: a 2× preview through headless Chrome. **You must look at it.**

`SKILL_DIR` below is the folder holding this file. All scripts are run with `node`/`bash` from anywhere.

## Setup (once)
If `SKILL_DIR/node_modules` is missing, run `cd SKILL_DIR && npm i`.

## Workflow

1. **Understand the story.** What should the reader learn? List the actors (nodes), boundaries (groups such as clouds, clusters, hosts) and the flow (edges, in step order). One diagram should make one point. If there are more than about 12 nodes, split it.

2. **Pick the closest example** in `SKILL_DIR/examples/` (see `examples/README.md`) and copy its structure:
   | pattern | example |
   |---|---|
   | simple layered architecture: edge → LB → apps → db | `07-cdn-request.js` |
   | nested clouds/clusters, numbered cross-boundary steps | `00-tke-eks-dns-tls.js` |
   | two actors + shared store, allowed vs blocked writes | `01-external-dns-ownership.js` |
   | left→right pipeline with a side branch | `02-lease-detection.js` |
   | vertical flowchart with decisions, retry loops | `03-node-lost-workflow.js`, `04-vm-adoption.js` |
   | hop-by-hop request path with "on the wire" annotations | `05-request-path.js` |
   | swimlane sequence across 3 components | `06-expose-sequence.js` |

3. **Plan the grid before writing coordinates.** Read `references/layout-recipes.md`. Fix the column x's, row y's and node widths as `const`s at the top of a `.js` spec, then derive edge points from them (`[nx + nw, y]` …). Do not scatter magic numbers.

4. **Write the spec** to the user's requested location, or by default to `./diagrams/<name>.js`. The full field list is in `references/spec-reference.md`. Style rules are summarised below; details are in `references/style-guide.md`.

5. **Render (lint runs first):**
   ```bash
   bash SKILL_DIR/scripts/render.sh ./diagrams/<name>.js [outdir]
   ```
   Lint errors block rendering. Fix them using the `→` hint on each line. Warnings are allowed, but read them.

6. **Look at the PNG** with the Read tool. Check for: crowded areas, labels that are hard to attribute, edges crossing, uneven gaps, a legend that doesn't match the colours used. Fix and re-render. **Stop after 3 visual passes** and report anything that remains.

7. **Report** the three output paths and a one-line description of what the diagram shows. Mention that the `.excalidraw` file opens on excalidraw.com for hand edits.

## House style (must follow)
- **Colour = role**, not decoration:
  - blue: dns, proxy, client-facing
  - violet: control plane, certs
  - green: success, network, LB
  - red: stores, failure, destructive
  - yellow: host-side
  - orange: orchestration, AWS
  - teal: edge
  - gray: neutral, input
  - white: decisions, clusters
- **Nodes:** an icon on the left, a title (one line), and a `sub` line using ` • ` separators. No `[brackets]`. Lowercase unless it's a proper noun (Route 53, Tencent CLB).
- **Groups** get a lowercase label tab plus an icon. Cloud groups are `dashed`; cluster groups are `color: "white"`.
- **Flowcharts:** `shape: "diamond"` (white) for decisions, `shape: "pill"` for start/end.
- **Edges:**
  - Orthogonal routes only.
  - Default ink. Green means happy path or owns. Red means failure. Red + `dashed` + `head: "cross"` means blocked. Blue means cross-boundary or probe.
  - Labels sit *next to* the line, never on it.
  - Start an edge on the source border. End it 2px outside the target border.
- **Step order:** dark `badge`s on nodes or edges, numbered 1..n. In notes, `"#1 text"` puts an inline badge.
- **Notes:** a yellow sticky for the "why". **Annots:** gray chips on the right, joined by `dotted` + `head: "none"`.
- **Spacing:** 32px+ gaps, rows aligned across lanes, 48px outer margin, coordinates on the 8px grid.
- Add a **legend** when 3 or more colours or edge styles carry meaning. Always set `alt` (accessibility text).

## Icons
- Built-in: `cloud cube globe sync records cert clock controller lock lb server db vm user eye workflow mesh shield trash proxy layers key check search`
- Library icons: `"pack:name"`. List what's installed with `node SKILL_DIR/scripts/import-lib.js --list [pack]`.
- To add a library (e.g. AWS or Kubernetes icons from libraries.excalidraw.com), see `references/libraries.md`. Ask the user before downloading anything. Prefer built-in icons; use library icons when a recognisable product logo genuinely helps.

## Scripts
| script | purpose |
|---|---|
| `scripts/render.sh spec [outdir]` | lint, then svg + excalidraw + png |
| `scripts/lint.js spec [--strict] [--json]` | layout checks only (`--strict` adds 8px-grid checks) |
| `scripts/bbdiagram.js spec [outBase]` | render svg + excalidraw without lint or PNG |
| `scripts/import-lib.js file.excalidrawlib --pack name` | import a library as icons |

## Not this skill
- Restyling or linting an *existing* hand-made `.excalidraw` file: use `prettier-excalidraw`.
- Free-form Excalidraw JSON in another visual style: use `excalidraw-diagram`.
- Mermaid, PlantUML or draw.io output.
