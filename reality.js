/**
 * 极简 Quantumult X VLESS Reality 解析器
 * 仅针对 vless + tcp + reality 节点
 */

const Base64 = {
    decode(str) {
        let b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        let res = "";
        str = str.replace(/[^A-Za-z0-9\+\/\=]/g, "");
        for (let i = 0; i < str.length; ) {
            let enc1 = b64.indexOf(str.charAt(i++));
            let enc2 = b64.indexOf(str.charAt(i++));
            let enc3 = b64.indexOf(str.charAt(i++));
            let enc4 = b64.indexOf(str.charAt(i++));
            let chr1 = (enc1 << 2) | (enc2 >> 4);
            let chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            let chr3 = ((enc3 & 3) << 6) | enc4;
            res += String.fromCharCode(chr1);
            if (enc3 != 64) res += String.fromCharCode(chr2);
            if (enc4 != 64) res += String.fromCharCode(chr3);
        }
        try { return decodeURIComponent(escape(res)); } catch(e) { return res; }
    }
};

let content = $resource.content;

// 兼容并解码 Base64 格式的机场订阅
if (!content.includes("vless://")) {
    try { content = Base64.decode(content); } catch (e) {}
}

let lines = content.split(/\r?\n/);
let qxNodes = [];

lines.forEach(line => {
    line = line.trim();
    if (line.startsWith("vless://")) {
        try {
            // 解析 vless:// 链接
            let [main, nameStr] = line.split('#');
            let name = decodeURIComponent(nameStr || "VLESS-Reality");
            let [scheme, rest] = main.split('://');
            let [cred, serverInfo] = rest.split('@');
            let uuid = cred;
            let [serverPath, queryStr] = serverInfo.split('?');
            let [host, port] = serverPath.split(':');
            
            // 解析参数
            let query = {};
            if (queryStr) {
                queryStr.split('&').forEach(pair => {
                    let [k, v] = pair.split('=');
                    query[k] = decodeURIComponent(v || "");
                });
            }
            
            // 筛选条件：仅保留 security 为 reality 且类型为 tcp 的节点
            if (query.security === "reality" && (query.type === "tcp" || !query.type)) {
                let pbk = query.pbk || "";
                let sni = query.sni || host;
                let sid = query.sid || "";
                let flow = query.flow || "xtls-rprx-vision";
                
                // 拼接 Quantumult X 原生 Reality 节点格式
                let qxNode = `vless=${host}:${port}, method=none, password=${uuid}, obfs=over-tls, obfs-host=${sni}, reality-base64-pubkey=${pbk}, reality-hex-shortid=${sid}, vless-flow=${flow}, tag=${name}`;
                qxNodes.push(qxNode);
            }
        } catch(e) {
            // 忽略单行解析错误
        }
    }
});

// 返回给 Quantumult X 
$done({ content: qxNodes.join('\n') });
