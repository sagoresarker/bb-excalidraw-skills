# Spec reference

A spec is a plain object. It can be `module.exports = {...}` in a `.js` file, so you can use `const`s and helpers, or a `.json` file. All values are in px, with the origin at the top left. Text sizes come from the renderer; you never set font sizes on nodes.

```js
module.exports = {
  width: 1296, height: 724,          // canvas; a light rounded frame is drawn 16px inside
  alt: "one-sentence description",   // aria-label on the SVG (always set it)
  groups: [], nodes: [], notes: [], annots: [], texts: [], edges: [],
  legend: { y, items: [] },
};
```

Draw order (back to front): frame → groups → group tabs → annots → edges → nodes → notes → edge labels/badges → texts → legend.

## groups: boundaries (cloud, cluster, host, lane)
| field | type | default | notes |
|---|---|---|---|
| `x y w h` | number | required | |
| `label` | string | required | lowercase; shown in a tab on the top border |
| `color` | palette key | `white` | tinted fill + stroke |
| `icon` | icon name | none | shown in the tab |
| `dashed` | bool | false | use for clouds and other logical boundaries |
| `fill` | hex | color tint | override the fill |

The tab sits at `x+20, y-15` and is 30px high. Its width is `(icon ? 42 : 14) + textWidth(label, 15) + 14`. Leave 48px+ between the group top and the first row inside it.

## nodes: components and steps
| field | type | default | notes |
|---|---|---|---|
| `x y w` | number | required | |
| `h` | number | rect 64 · pill 56 · diamond 112 | |
| `title` | string | required | 16px (15px in diamond/pill). `\n` is allowed only in diamond/pill or rects without an icon |
| `sub` | string | none | 13px gray second line; separate facts with ` • ` |
| `color` | palette key | `white` | |
| `icon` | icon name or `pack:name` | none | rect only; 30px box at `x+16`; text starts at `x+60` |
| `shape` | `rect` \| `diamond` \| `pill` | `rect` | |
| `badge` | string | none | dark step number on the top-left corner |

Text space: a rect with an icon fits `w - 76` px of text; without an icon `w - 32`. A diamond fits about `0.55·w`, a pill about `0.72·w`. Comic Shanns is monospace-like: about **9.6px per char at 16px** and **7.8px at 13px**.

## notes: yellow sticky ("why?")
`{ x, y, w, title, lines: ["text", "#2 text with an inline step badge"] }`. The height is computed: `42 + 21 × lines`. Each line holds about `(w - 28) / 8.4` chars, so wrap long sentences into several lines yourself.

## annots: gray side chips
`{ x, y, w, h = 40, text }`. One line of 14px text. Join to its node with an edge `{ dotted: true, head: "none", color: "gray" }`.

## texts: free text (column headers, captions)
`{ x, y, text, size = 14, color = gray, anchor = "start" | "middle" | "end" }`. `y` is the **baseline**.

## edges
| field | type | default | notes |
|---|---|---|---|
| `pts` | `[[x,y], ...]` | required | 2+ points; keep segments horizontal or vertical; corners are rounded automatically |
| `color` | `ink` \| palette key \| hex | `ink` | coloured edges are drawn 2px thick, ink/gray 1.5px |
| `dashed` / `dotted` | bool | false | |
| `head` | `arrow` \| `cross` \| `none` | `arrow` | `cross` = blocked; stop the line short of the target |
| `width` | number | auto | |
| `label` | `{ text, x, y, anchor?, color? }` | none | `y` is the baseline; `\n` allowed; colour defaults to the edge's text colour |
| `badge` | `{ n, x, y, color? }` | none | step number centred at x,y (put it on the line) |

Anchor rules: a horizontal arrow into a box at `bx` ends at `bx - 2`. A vertical arrow into a box top at `by` ends at `by - 2`. Start points sit exactly on the source border. For diamonds, start from a vertex: `(cx ± w/2, cy)` or `(cx, y + h)`.

## legend (one row at the bottom)
`{ y, x = 48, items: [...] }`, where each item is one of:
- `{ swatch: "blue", text }`: a colour meaning
- `{ arrow: "red", dashed?: true, text }`: an edge meaning
- `{ badge: true, text: "step order" }`

Put the legend about 56px below the lowest box. Set `height = legend.y + 52`.

## Palette keys
`blue violet green red yellow orange teal gray white ink`. Each has a fill, stroke, tint (used for groups) and text colour. See `C` in `scripts/bbdiagram.js`.
