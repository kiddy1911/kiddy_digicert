// Quantumult X resource parser (minimal): vless:// (reality) -> QuanX vless=

let raw = ($resource.content || "").trim();
let lines = raw.split(/\r?\n/).map(s => s.trim()).filter(Boolean);

function safeDecode(s){ try { return decodeURIComponent(s); } catch(e){ return s; } }

let out = [];
for (let s of lines) {
  if (!/^vless:\/\//i.test(s)) continue;

  // 依赖 URL 解析（多数新系统可用）；若不行你再告诉我，我给你换成纯正则解析
  let u;
  try { u = new URL(s); } catch(e){ continue; }

  let uuid = safeDecode(u.username || "");
  let host = u.hostname;
  let port = u.port || "443";

  let sp = u.searchParams;
  let security = (sp.get("security") || "").toLowerCase();
  if (security !== "reality") continue;

  let sni = sp.get("sni") || sp.get("serverName") || sp.get("servername") || "";
  let pbk = sp.get("pbk") || sp.get("publicKey") || "";
  let sid = sp.get("sid") || sp.get("shortId") || sp.get("shortid") || "";
  let flow = sp.get("flow") || "";

  let tag = safeDecode((u.hash || "").replace(/^#/, "")) || `${host}:${port}`;

  let node = `vless=${host}:${port}, method=none, password=${uuid}, obfs=over-tls`;
  if (sni) node += `, obfs-host=${sni}`;
  if (pbk) node += `, reality-base64-pubkey=${pbk}`;
  if (sid) node += `, reality-hex-shortid=${sid}`;
  if (flow) node += `, vless-flow=${flow}`;
  node += `, tag=${tag}`;

  out.push(node);
}

$done({ content: out.join("\n") });
