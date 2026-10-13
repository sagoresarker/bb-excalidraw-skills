# Layout recipes

Plan the grid first, then write coordinates. In a `.js` spec, put the grid in `const`s and derive everything from it.

## Sizing cheatsheet
| thing | size |
|---|---|
| rect node height | 64 (72 if the title is long and you want air) |
| pill height | 56 |
| diamond | w 220-240, h 112-120 |
| row pitch (rect → rect, vertical flow) | 96 (64 box + 32 gap) to 120 (room for an edge label) |
| column pitch (lanes) | node w + 128 (room for an arrow + label) |
| group padding | 24-32 sides/bottom, 48 top |
| note height | 42 + 21 × lines |
| legend | y = lowest box bottom + 56; canvas height = legend.y + 52 |
| canvas | width = rightmost edge + 48; height = bottom + 48 (or legend rule) |

Text width: about 9.6px/char at 16px (titles), 7.8px/char at 13px (subs), 8.4px/char at 14px (labels and notes). For a rect with an icon you need `w ≥ 76 + 9.6 × max(titleChars, 0.81 × subChars)`.

## Edge anchors
For a node `{x, y, w, h}` with `cx = x + w/2` and `cy = y + h/2`:
- right side: start `[x + w, cy]`; arrive `[x + w + 2, cy]`
- left side: start `[x, cy]`; arrive `[x - 2, cy]`
- bottom: start `[cx, y + h]`; arrive `[cx, y + h + 2]`
- top: start `[cx, y]`; arrive `[cx, y - 2]`
- diamond vertices: `[cx, y]`, `[x + w, cy]`, `[cx, y + h]`, `[x, cy]`

When several edges leave one side, offset them by ±16-28px from the centre instead of stacking them.

For an L-route from A's right side to B's top: `[[A.x+A.w, A.cy], [B.cx, A.cy], [B.cx, B.y-2]]`. For a U-turn back to an earlier row (a retry loop): go out sideways, then vertically, then back in, for example `[[q.cx, q.y], [q.cx, target.cy], [target.x - 2, target.cy]]`.

## Pattern: vertical flowchart (examples 03, 04)
```js
const cx = 544, rw = 320, rx = cx - rw / 2;          // spine
// rows: pill y=48 (h56) → rect y=136 → rect y=232 → diamond y=328 (h112) → rect y=480 …
// branches: green outcomes to the right at x = cx + 260; error/quarantine to the left at x = 48
```
"yes"/"no" labels go just after the diamond vertex: `{ text: "no", x: cx + 12, y: vertexY + 25 }`.

## Pattern: swimlanes / sequence (example 06)
```js
const L1 = 88, L2 = 536, L3 = 984, nw = 320;         // lane x's (lane groups at L - 40, w = nw + 80)
// node rows at y = 120, 296, 416, 536 …  badge each node 1..n in time order
```
Edges between lanes are horizontal at the node's cy. Vertical moves stay inside a lane.

## Pattern: request path with wire annotations (example 05)
```js
const cx = 360, nw = 400, nx = cx - nw / 2, ax = 688, aw = 384;
const hop = (y) => [[nx + nw, y], [ax - 2, y]];      // dotted gray connector into an annot chip
```
The node stack is on the left; one annot per hop on the right, saying what the packet looks like there.

## Pattern: nested boundaries (example 00)
Outer cloud groups side by side with an 80px gutter. Inner cluster groups inside, with 32px padding. Cross-boundary edges are blue, routed through the gutter with badges on their vertical segment.

## Fixing lint errors
| error | usual fix |
|---|---|
| overlaps | shift one box by (overlap + 32), keeping the row/column aligned |
| title/sub too wide | use the suggested `w`, then re-align the column (all nodes in a column share `w`) |
| end point Npx from shape | recompute from the anchor formula: arrival is target border − 2 |
| passes through | add two corner points to go around, keeping 16px+ clearance |
| straddles group | grow the group (`h`/`w`) or move the node fully inside |
| label overlaps | move the label to the other side of the line, or to a longer segment |
| legend overlaps / past canvas | move `legend.y` down and grow `height`; shorten item texts |
