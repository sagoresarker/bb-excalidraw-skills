// exposing a vm port: envoy only learns the proxy ip after the host has made it reachable
const L1 = 88, L2 = 536, L3 = 984, nw = 320;
module.exports = {
  width: 1392, height: 680,
  alt: "Expose sequence across edge control plane, control plane and host agent: request, allocate /32, route and NAT, publish to mesh, reply with proxy IP, xDS snapshot, ADS push to tenant envoy",
  groups: [
    { x: 48, y: 64, w: 400, h: 568, label: "edge control plane", color: "teal", icon: "proxy" },
    { x: 496, y: 64, w: 400, h: 568, label: "control plane", color: "violet", icon: "cube" },
    { x: 944, y: 64, w: 400, h: 568, label: "host agent", color: "yellow", icon: "server" },
  ],
  nodes: [
    { x: L1, y: 120, w: nw, title: "expose request", sub: "customer, vm, port", color: "blue", icon: "user", badge: "1" },
    { x: L2, y: 120, w: nw, title: "allocate /32", sub: "keyed customer+vm+kind", color: "violet", icon: "db", badge: "2" },
    { x: L3, y: 120, w: nw, title: "route + dnat + snat", sub: "in the vpc netns", color: "yellow", icon: "layers", badge: "3" },
    { x: L3, y: 296, w: nw, title: "publish /32 to mesh", sub: "tenant's group only", color: "green", icon: "mesh", badge: "4" },
    { x: L2, y: 416, w: nw, title: "reply with proxy ip", sub: "record already in etcd", color: "violet", icon: "check", badge: "5" },
    { x: L1, y: 416, w: nw, title: "xds snapshot", sub: "eds endpoint = proxy ip", color: "blue", icon: "records", badge: "6" },
    { x: L1, y: 536, w: nw, title: "tenant envoy", color: "blue", icon: "proxy" },
  ],
  edges: [
    { pts: [[L1 + nw, 152], [L2 - 2, 152]] },
    { pts: [[L2 + nw, 152], [L3 - 2, 152]] },
    { pts: [[L3 + nw / 2, 184], [L3 + nw / 2, 294]] },
    { pts: [[L3 + nw / 2, 360], [L3 + nw / 2, 448], [L2 + nw + 2, 448]], label: { text: "ok", x: L3 + nw / 2 + 12, y: 408 } },
    { pts: [[L2, 448], [L1 + nw + 2, 448]] },
    { pts: [[L1 + nw / 2, 480], [L1 + nw / 2, 534]], label: { text: "ads push", x: L1 + nw / 2 + 12, y: 512 } },
  ],
  notes: [
    { x: L2, y: 224, w: nw, title: "why keyed?", lines: ["a retry returns the same /32;", "a second proxy ip would leave", "two routes to one vm."] },
  ],
};
