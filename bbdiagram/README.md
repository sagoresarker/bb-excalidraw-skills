# bbdiagram: BackendByte hand-drawn diagrams

One spec file (`specs/*.js`) produces:
- `render/<name>.svg`: blog-ready, sketchy rough.js strokes, Comic Shanns (Excalidraw "Code" font) embedded
- `render/<name>.excalidraw`: same diagram as native Excalidraw elements (fontFamily 8, icons grouped with their box)
- `render/<name>.png`: 2× preview (via headless Chrome)

## Run
    npm i roughjs opentype.js
    ./render_all.sh                      # every spec
    node lib/bbdiagram.js specs/x.js out/x   # one spec (svg + excalidraw)

## Style rules
- **Colour = role.** blue: dns/proxy/client-facing · violet: control plane/certs · green: success/network/LB ·
  red: stores, failure, destructive · yellow: host-side · orange: orchestration · teal: edge · gray: neutral/input
- **Groups** get a label tab on their top border (icon + lowercase name). Clouds are dashed; clusters are white.
- **Nodes:** icon on the left, title (16px) + mono-ish sub-line (13px, use " • " as separator). No [brackets].
- **Flowcharts:** diamonds for decisions (white), ellipses ("pill") for start/end states.
- **Edges:** ink by default; green = happy path/owns, red = failure/skip (dashed + cross head for "blocked"),
  blue = cross-boundary/probe. Rounded orthogonal routes, labels next to the line, never on it.
- **Order:** number steps with dark badges (`badge` on nodes or edges).
- **Notes:** yellow sticky with an underlined title; "#1 text" puts a step badge inline.
- **Annotations:** gray chips on the right, joined by a dotted line ("on the wire" style).
- Keep 32px+ gaps between boxes, align rows across lanes, 48px outer margin.

Icons: cloud cube globe sync records cert clock controller lock lb server db vm user eye workflow mesh shield trash proxy layers key check search
