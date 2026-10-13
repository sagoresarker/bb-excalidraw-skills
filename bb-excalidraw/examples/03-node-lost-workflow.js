// node-lost workflow: offline -> wait -> re-check lease -> ask host -> adopt / quarantine / reclaim
const cx = 544, rw = 320, rx = cx - rw / 2;
module.exports = {
  width: 1112, height: 872,
  alt: "Node-lost workflow flowchart: mark offline, wait 30s, check lease, ask the host which VMs it runs, then adopt, quarantine and retry, or reclaim",
  nodes: [
    { x: cx - 130, y: 48, w: 260, shape: "pill", title: "lease DELETE @ rev", color: "gray" },
    { x: rx, y: 136, w: rw, title: "mark node offline", sub: "scheduler skips it", color: "violet", icon: "server" },
    { x: rx, y: 232, w: rw, title: "wait 30s", sub: "durable timer", color: "violet", icon: "clock" },
    { x: cx - 110, y: 328, w: 220, shape: "diamond", title: "lease\nback?", color: "white" },
    { x: 804, y: 356, w: 240, shape: "pill", title: "ready, abort", color: "green" },
    { x: rx, y: 480, w: rw, title: "ask the host: ListVMs", sub: "30s timeout", color: "blue", icon: "search" },
    { x: cx - 120, y: 576, w: 240, h: 120, shape: "diamond", title: "what came\nback?", color: "white" },
    { x: 804, y: 608, w: 260, shape: "pill", title: "ready + adopt vms", color: "green" },
    { x: 48, y: 604, w: 264, title: "quarantine", sub: "re-ask every 10 min", color: "yellow", icon: "shield" },
    { x: rx, y: 760, w: rw, title: "reclaim", sub: "child per vm • 8 at a time", color: "red", icon: "trash" },
  ],
  edges: [
    { pts: [[cx, 104], [cx, 134]] },
    { pts: [[cx, 200], [cx, 230]] },
    { pts: [[cx, 296], [cx, 326]] },
    { pts: [[cx + 110, 384], [802, 384]], color: "green", label: { text: "yes", x: 728, y: 374, anchor: "middle" } },
    { pts: [[cx, 440], [cx, 478]], label: { text: "no", x: cx + 12, y: 465 } },
    { pts: [[cx, 544], [cx, 574]] },
    { pts: [[cx + 120, 636], [802, 636]], color: "green", label: { text: "vms > 0", x: 734, y: 626, anchor: "middle" } },
    { pts: [[cx - 120, 636], [314, 636]], label: { text: "error", x: 369, y: 626, anchor: "middle" } },
    { pts: [[cx, 696], [cx, 758]], label: { text: "empty", x: cx + 12, y: 734 } },
    { pts: [[180, 604], [180, 512], [rx - 2, 512]], label: { text: "retry", x: 272, y: 502, anchor: "middle" } },
    { pts: [[180, 668], [180, 792], [rx - 2, 792]], color: "red", label: { text: "reap-now signal", x: 280, y: 782, anchor: "middle" } },
  ],
};
