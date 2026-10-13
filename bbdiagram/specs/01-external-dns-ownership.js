// external-dns ownership: each instance only touches records whose TXT owner matches its txtOwnerId
module.exports = {
  width: 1208, height: 604,
  alt: "Two external-dns instances share one Route 53 zone; each only changes records whose TXT owner matches its own owner id, and records with no owner TXT are never touched",
  groups: [
    { x: 408, y: 64, w: 420, h: 376, label: "route 53: nonprod.example.com", color: "violet", icon: "globe" },
  ],
  nodes: [
    { x: 48, y: 112, w: 264, title: "external-dns on eks", sub: "owner: devops-cluster", color: "blue", icon: "sync" },
    { x: 896, y: 232, w: 264, title: "external-dns on tke", sub: "owner: tke-devops", color: "yellow", icon: "sync" },
    { x: 440, y: 112, w: 356, title: "app-a  CNAME → alb", sub: "txt: owner=devops-cluster", color: "blue", icon: "records" },
    { x: 440, y: 232, w: 356, title: "app-b  CNAME → clb", sub: "txt: owner=tke-devops", color: "yellow", icon: "records" },
    { x: 440, y: 352, w: 356, title: "_acme-challenge  TXT", sub: "no owner record", color: "gray", icon: "key" },
  ],
  edges: [
    { pts: [[312, 144], [438, 144]], color: "green", label: { text: "owns", x: 375, y: 134, anchor: "middle" } },
    { pts: [[896, 264], [798, 264]], color: "green", label: { text: "owns", x: 862, y: 254, anchor: "middle" } },
    { pts: [[1028, 232], [1028, 144], [812, 144]], color: "red", dashed: true, head: "cross",
      label: { text: "skip: owner id\ndoes not match", x: 1042, y: 172 } },
  ],
  notes: [
    { x: 48, y: 476, w: 1112, title: "ownership rule",
      lines: ["each instance only changes records whose TXT owner matches its own txtOwnerId.",
              "records with no owner TXT (hand-made, acme challenges) are never touched."] },
  ],
};
