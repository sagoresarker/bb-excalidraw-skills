// request path from client to microVM, with what the packet looks like at each hop
const cx = 360, nw = 400, nx = cx - nw / 2, ax = 688, aw = 384;
const hop = (y) => [[nx + nw, y], [ax - 2, y]];
module.exports = {
  width: 1120, height: 1000,
  alt: "Request path: client, CDN edge, shared front envoy, tenant envoy, WireGuard mesh, host root namespace, VPC netns, microVM, with the packet's host and destination at each hop",
  groups: [
    { x: 96, y: 248, w: 528, h: 240, label: "edge proxy layer", color: "teal", icon: "layers" },
    { x: 96, y: 624, w: 528, h: 328, label: "host", color: "yellow", icon: "server" },
  ],
  nodes: [
    { x: nx, y: 48, w: nw, title: "client", color: "gray", icon: "user" },
    { x: nx, y: 144, w: nw, title: "cdn edge", sub: "tls ends, plain http over tunnel", color: "orange", icon: "globe" },
    { x: nx, y: 288, w: nw, title: "shared front envoy", sub: "host header → tenant", color: "blue", icon: "proxy" },
    { x: nx, y: 392, w: nw, title: "tenant envoy", sub: "one per customer", color: "blue", icon: "proxy" },
    { x: nx, y: 520, w: nw, title: "wireguard mesh", sub: "/32 route • tenant group only", color: "green", icon: "mesh" },
    { x: nx, y: 664, w: nw, title: "root namespace", sub: "proxy ip/32 via netns veth", color: "yellow", icon: "layers" },
    { x: nx, y: 760, w: nw, title: "vpc netns", sub: "dnat to vm • snat to gateway", color: "yellow", icon: "layers" },
    { x: nx, y: 856, w: nw, title: "microVM", color: "blue", icon: "vm" },
  ],
  annots: [
    { x: ax, y: 156, w: aw, text: "Host: app.example.com" },
    { x: ax, y: 300, w: aw, text: "upstream: tenant envoy (cluster dns)" },
    { x: ax, y: 532, w: aw, text: "dst: 203.0.113.17 (proxy ip)" },
    { x: ax, y: 868, w: aw, text: "dst: 10.1.0.5 (after dnat)" },
  ],
  texts: [{ x: ax, y: 134, text: "on the wire", size: 14, color: "#868E96" }],
  edges: [
    { pts: [[cx, 112], [cx, 142]] },
    { pts: [[cx, 208], [cx, 286]] },
    { pts: [[cx, 352], [cx, 390]] },
    { pts: [[cx, 456], [cx, 518]] },
    { pts: [[cx, 584], [cx, 662]] },
    { pts: [[cx, 728], [cx, 758]] },
    { pts: [[cx, 824], [cx, 854]] },
    { pts: hop(176), color: "gray", dotted: true, head: "none" },
    { pts: hop(320), color: "gray", dotted: true, head: "none" },
    { pts: hop(552), color: "gray", dotted: true, head: "none" },
    { pts: hop(888), color: "gray", dotted: true, head: "none" },
  ],
};
