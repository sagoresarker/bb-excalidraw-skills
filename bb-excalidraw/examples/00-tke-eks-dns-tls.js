// cross-cloud dns + tls: tke writes into the aws route 53 zone; cert-sync bridges k8s secrets to tencent ssl
module.exports = {
  width: 1296, height: 724,
  alt: "TKE external-dns and cert-manager write records to a Route 53 zone in AWS; cert-sync uploads certificates to Tencent SSL for the CLB",
  groups: [
    { x: 48, y: 56, w: 400, h: 560, label: "aws", color: "orange", icon: "cloud", dashed: true },
    { x: 528, y: 56, w: 736, h: 560, label: "tencent cloud", color: "blue", icon: "cloud", dashed: true },
    { x: 80, y: 324, w: 336, h: 268, label: "eks cluster", color: "white", icon: "cube" },
    { x: 560, y: 104, w: 344, h: 488, label: "tke cluster", color: "white", icon: "cube" },
  ],
  nodes: [
    { x: 80, y: 104, w: 336, h: 72, title: "Route 53 hosted zone", sub: "nonprod.example.com", color: "red", icon: "globe" },
    { x: 104, y: 376, w: 288, title: "external-dns", sub: "sync • irsa • owner=eks", color: "blue", icon: "sync" },
    { x: 104, y: 496, w: 288, title: "Application LB", sub: "acm wildcard • by host", color: "green", icon: "lb" },
    { x: 584, y: 152, w: 296, title: "external-dns", sub: "owner=tke • iam key", color: "blue", icon: "sync" },
    { x: 584, y: 256, w: 296, title: "cert-manager", sub: "letsencrypt • dns-01", color: "violet", icon: "cert" },
    { x: 584, y: 376, w: 296, title: "cert-sync", sub: "cronjob • every 10 min", color: "violet", icon: "clock" },
    { x: 584, y: 496, w: 296, title: "ingress controller", sub: "qcloud • managed", color: "violet", icon: "controller" },
    { x: 1000, y: 376, w: 232, title: "Tencent SSL", sub: "cert id", color: "red", icon: "lock" },
    { x: 1000, y: 496, w: 232, title: "Tencent CLB", sub: "L7 • https", color: "green", icon: "lb" },
  ],
  notes: [
    { x: 80, y: 194, w: 252, title: "cross-cloud writes", lines: ["tke → route 53 over NAT", "#1 records + owner TXT", "#2 _acme-challenge TXT"] },
    { x: 1000, y: 152, w: 232, title: "why cert-sync?", lines: ["CLB can't read k8s TLS", "secrets; it serves certs", "from Tencent SSL by id."] },
  ],
  edges: [
    { pts: [[360, 376], [360, 178]], label: { text: "records", x: 370, y: 304 } },
    { pts: [[584, 184], [504, 184], [504, 128], [418, 128]], color: "blue", badge: { n: "1", x: 504, y: 156 } },
    { pts: [[584, 288], [480, 288], [480, 156], [418, 156]], color: "blue", badge: { n: "2", x: 480, y: 222 } },
    { pts: [[732, 320], [732, 374]], badge: { n: "3", x: 732, y: 347 }, label: { text: "tls secret", x: 750, y: 352 } },
    { pts: [[880, 408], [998, 408]], badge: { n: "4", x: 952, y: 408 }, label: { text: "upload", x: 952, y: 390, anchor: "middle" } },
    { pts: [[732, 440], [732, 494]], badge: { n: "5", x: 732, y: 467 }, label: { text: "cert id secret", x: 750, y: 472 } },
    { pts: [[880, 528], [998, 528]], badge: { n: "6", x: 952, y: 528 }, label: { text: "programs", x: 952, y: 510, anchor: "middle" } },
  ],
  legend: { y: 672, items: [
    { swatch: "blue", text: "dns" }, { swatch: "violet", text: "certificates" }, { swatch: "green", text: "load balancing" },
    { swatch: "red", text: "zone / cert store" }, { arrow: "blue", text: "cross-cloud write" }, { badge: true, text: "step order" },
  ] },
};
