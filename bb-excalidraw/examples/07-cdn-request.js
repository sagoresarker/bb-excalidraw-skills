// request path: client → cdn → lb → two app servers → postgres primary
const nw = 296, nh = 64;
const X1 = 88, X2 = 544, X3 = 936;                    // columns
const Y1 = 120, Y2 = 264, Y3 = 408;                   // rows
const mid = (x) => x + nw / 2;
module.exports = {
  width: 1328, height: 640,
  alt: "Client request goes through the CDN edge to a load balancer, which spreads it over two app servers that both read and write one Postgres primary",
  groups: [
    { x: 48, y: 64, w: 376, h: 152, label: "edge", color: "teal", icon: "globe", dashed: true },
    { x: 504, y: 64, w: 776, h: 456, label: "vpc • eu-west-1", color: "orange", icon: "cloud", dashed: true },
  ],
  nodes: [
    { x: X1, y: Y1, w: nw, title: "cdn edge", sub: "cache • tls termination", color: "teal", icon: "proxy", badge: "1" },
    { x: X2, y: Y1, w: nw, title: "load balancer", sub: "L7 • least-conn", color: "green", icon: "lb", badge: "2" },
    { x: X2, y: Y2, w: nw, title: "app-1", sub: "api • az-a", color: "violet", icon: "server" },
    { x: X3, y: Y2, w: nw, title: "app-2", sub: "api • az-b", color: "violet", icon: "server" },
    { x: X2 + 196, y: Y3, w: nw, title: "postgres primary", sub: "rds • multi-az", color: "red", icon: "db", badge: "3" },
  ],
  edges: [
    { pts: [[X1 + nw, Y1 + 32], [X2 - 2, Y1 + 32]], color: "blue", label: { text: "pull", x: (X1 + nw + X2) / 2, y: Y1 + 20, anchor: "middle" } },
    { pts: [[mid(X2), Y1 + nh], [mid(X2), Y2 - 2]] },
    { pts: [[X2 + nw, Y1 + 32], [mid(X3), Y1 + 32], [mid(X3), Y2 - 2]] },
    { pts: [[mid(X2), Y2 + nh], [mid(X2), Y3 + 32], [X2 + 194, Y3 + 32]], label: { text: "sql", x: mid(X2) - 12, y: Y3 - 8, anchor: "end" } },
    { pts: [[mid(X3), Y2 + nh], [mid(X3), Y3 + 32], [X2 + 196 + nw + 2, Y3 + 32]], label: { text: "sql", x: mid(X3) + 12, y: Y3 - 8 } },
  ],
  legend: { y: 584, items: [
    { swatch: "teal", text: "edge" }, { swatch: "green", text: "load balancing" }, { swatch: "violet", text: "compute" },
    { swatch: "red", text: "data store" }, { arrow: "blue", text: "crosses into the vpc" }, { badge: true, text: "hop order" },
  ] },
};
