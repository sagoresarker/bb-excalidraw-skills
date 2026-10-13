// lease expiry starts an investigation; only the host's own answer (or an operator) can end it in destruction
module.exports = {
  width: 1516, height: 540,
  alt: "Host agent heartbeats into an etcd lease; control plane watchers see the lease delete and start exactly one node-lost workflow in Temporal, which probes the host agent",
  groups: [
    { x: 48, y: 64, w: 320, h: 360, label: "host", color: "yellow", icon: "server" },
    { x: 824, y: 200, w: 300, h: 240, label: "control plane replicas", color: "violet", icon: "cube" },
  ],
  nodes: [
    { x: 80, y: 112, w: 256, title: "firecracker", sub: "jailed • one per vm", color: "blue", icon: "vm" },
    { x: 80, y: 304, w: 256, title: "host agent", sub: "ListVMs from /proc", color: "yellow", icon: "controller" },
    { x: 456, y: 304, w: 288, title: "etcd", sub: "heartbeat key • 15s lease", color: "red", icon: "db" },
    { x: 856, y: 248, w: 236, title: "watcher 1", color: "violet", icon: "eye" },
    { x: 856, y: 344, w: 236, title: "watcher 2", color: "violet", icon: "eye" },
    { x: 1184, y: 248, w: 284, title: "temporal", sub: "id = node/<n>/lost/<rev>", color: "orange", icon: "workflow" },
    { x: 1184, y: 424, w: 284, title: "node-lost workflow", sub: "exactly one per event", color: "orange", icon: "search" },
  ],
  edges: [
    { pts: [[208, 304], [208, 178]], label: { text: "pid + jail check", x: 220, y: 246 } },
    { pts: [[336, 336], [454, 336]], label: { text: "heartbeat", x: 412, y: 326, anchor: "middle" } },
    { pts: [[744, 336], [822, 336]], label: { text: "DELETE", x: 783, y: 326, anchor: "middle" } },
    { pts: [[1124, 280], [1182, 280]], label: { text: "start", x: 1153, y: 270, anchor: "middle" } },
    { pts: [[1326, 312], [1326, 422]], label: { text: "runs", x: 1338, y: 372 } },
    { pts: [[1184, 456], [208, 456], [208, 370]], color: "blue", label: { text: "probe: what are you running?", x: 600, y: 446, anchor: "middle" } },
  ],
  notes: [
    { x: 456, y: 96, w: 288, title: "rule", lines: ["a lost lease only starts", "an investigation; it never", "decides \"dead\" on its own."] },
  ],
};
