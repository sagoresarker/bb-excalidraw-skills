// adopting a VM the host reports: never resurrect a terminated vm, never steal an ip
const cx = 320, rw = 360, rx = cx - rw / 2;
module.exports = {
  width: 900, height: 768,
  alt: "VM adoption flowchart: refuse terminated VMs, reserve the exact IP, fail to an operator if another VM holds it, recreate the switch port, then mark running",
  nodes: [
    { x: rx, y: 48, w: rw, title: "host reports a vm", sub: "id, vpc, ip as guest has it, pid", color: "yellow", icon: "server" },
    { x: cx - 130, y: 144, w: 260, h: 120, shape: "diamond", title: "record says\nterminated?", color: "white" },
    { x: 576, y: 176, w: 248, shape: "pill", title: "refuse adoption", color: "red" },
    { x: rx, y: 304, w: rw, title: "reserve that exact ip", sub: "two-key etcd txn", color: "violet", icon: "db" },
    { x: cx - 130, y: 400, w: 260, h: 120, shape: "diamond", title: "who holds\nthe ip?", color: "white" },
    { x: 576, y: 428, w: 292, h: 64, shape: "pill", title: "fail: operator decides", color: "red" },
    { x: rx, y: 560, w: rw, title: "recreate logical switch port", sub: "idempotent", color: "green", icon: "mesh" },
    { x: rx, y: 656, w: rw, title: "only now: state = running", color: "blue", icon: "check" },
  ],
  edges: [
    { pts: [[cx, 112], [cx, 142]] },
    { pts: [[cx + 130, 204], [574, 204]], color: "red", label: { text: "yes", x: 515, y: 194, anchor: "middle" } },
    { pts: [[cx, 264], [cx, 302]], label: { text: "no", x: cx + 12, y: 289 } },
    { pts: [[cx, 368], [cx, 398]] },
    { pts: [[cx + 130, 460], [574, 460]], color: "red", label: { text: "another vm", x: 515, y: 450, anchor: "middle" } },
    { pts: [[cx, 520], [cx, 558]], label: { text: "nobody / this vm", x: cx + 12, y: 545 } },
    { pts: [[cx, 624], [cx, 654]] },
  ],
};
