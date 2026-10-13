# Examples

Each `*.js` spec renders to the PNG next to it. Copy the closest one as a starting point.

| spec | pattern | features used |
|---|---|---|
| `00-tke-eks-dns-tls.js` | nested boundaries, cross-cloud steps | dashed cloud groups, white cluster groups, blue cross-boundary edges, edge badges, notes with `#n` badges, legend |
| `01-external-dns-ownership.js` | two actors writing to a shared store, allowed vs blocked | green "owns" edges, red dashed `head: "cross"` blocked edge, note |
| `02-lease-detection.js` | left→right pipeline with a branch | horizontal row, side branch, labels above edges |
| `03-node-lost-workflow.js` | vertical flowchart | pills (start/end), diamonds (decisions), yes/no labels, retry loop, red failure path, `const` spine |
| `04-vm-adoption.js` | vertical flowchart with guards | diamonds + pills, failure exits to the side |
| `05-request-path.js` | hop-by-hop request path | `hop()` helper, annot chips joined by dotted gray `head: "none"` edges, free `texts` header |
| `06-expose-sequence.js` | 3-lane swimlane sequence | lane groups, node badges 1..n in time order, note explaining a design choice |
| `07-cdn-request.js` | simple layered architecture (start here) | two boundary groups, fan-out from LB, fan-in to a store, legend, step badges |

Render one: `bash ../scripts/render.sh 03-node-lost-workflow.js /tmp/out`
