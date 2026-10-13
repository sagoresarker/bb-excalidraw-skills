# BackendByte diagram style guide

The look: white canvas, soft rounded frame, sketchy (rough.js) strokes, Comic Shanns font, pastel fills with saturated strokes. It is clean enough for a technical blog and hand-drawn enough to feel friendly.

## Colour = role
Pick colours by what a thing *is* or *does*, and keep that consistent across a whole article.

| key | fill / stroke | use for |
|---|---|---|
| `blue` | #D0EBFF / #1971C2 | dns, proxies, client-facing, the "asking" side |
| `violet` | #E5DBFF / #6741D9 | control plane, controllers, certificates, schedulers |
| `green` | #D3F9D8 / #2F9E44 | success states, load balancers, networking, "ready" |
| `red` | #FFE3E3 / #E03131 | data stores, zones, failure, destructive actions |
| `yellow` | #FFF3BF / #F59F00 | host-side agents, quarantine/caution |
| `orange` | #FFE8CC / #E8590C | orchestration, AWS boundary |
| `teal` | #C3FAE8 / #099268 | edge, CDN |
| `gray` | #E9ECEF / #868E96 | neutral inputs, events, triggers |
| `white` | #FFFFFF / #868E96 | decisions (diamonds), cluster groups |

Don't use more than 5 node colours in one diagram. If a colour carries meaning, put it in the legend.

## Shapes
- **rect** (default): a component or an action. Icon on the left; a one-line title; a sub line of short facts joined by ` • ` (e.g. `cronjob • every 10 min`).
- **diamond**: a decision. White, with a question title ending in `?`, split over 2 lines.
- **pill**: a start or end state, such as an event or outcome.
- **group**: a boundary. Clouds are `dashed` + `icon: "cloud"`. Clusters are `color: "white"` + `icon: "cube"`. Hosts use `server`. Lanes in a sequence use the colour of the component they hold.

## Edges
| meaning | style |
|---|---|
| normal flow / call | ink (default) |
| happy path / owns / allowed | `color: "green"` |
| failure path | `color: "red"` |
| blocked / refused / skipped | `color: "red", dashed: true, head: "cross"`, stopping short of the target |
| crosses a boundary / probe / async | `color: "blue"` |
| annotation link | `color: "gray", dotted: true, head: "none"` |

- Routes are orthogonal. Corners are rounded automatically.
- Labels go *beside* the line: 10-12px to the right of vertical lines, 10px above horizontal lines (`anchor: "middle"` at the segment midpoint).
- Avoid edge crossings. If they're unavoidable, cross at right angles, away from labels.

## Step order
When order matters, number it. Use `badge` on nodes for a swimlane sequence, or `badge` on edges for flows between boxes. Number 1..n with no gaps. If a note explains steps, use `"#1 ..."` lines so the badge colour links the note to the edges.

## Text voice
Lowercase, terse, concrete: `owner=tke • iam key`, not `Owner: TKE (uses IAM key)`. Use real names for real products (Route 53, Tencent CLB). No `[brackets]`, no trailing periods in titles. Sentences go in notes.

## Spacing
- 48px outer margin; 32px+ gaps between boxes; 24px+ padding inside groups; 48px from a group top to its first row (the tab needs room).
- Align rows across lanes and columns across rows. Equal widths in a column.
- Coordinates on the 8px grid (`lint.js --strict` checks this).
- Common widths: 232-400 for nodes with an icon, 220-260 for diamonds and pills.
