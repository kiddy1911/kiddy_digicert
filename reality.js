/**
 * Quantumult X 资源解析器 (Resource Parser)
 * 支持解析以下三种 VLESS 节点，并自动剔除流控 (Flow) 配置：
 * 1. VLESS + TCP + REALITY
 * 2. VLESS + TCP + TLS
 * 3. VLESS + WS + TLS
 */

// Base64 解码函数（防止订阅链接是 Base64 编码格式）
function decodeBase64(str) {
    var e = {}, i, b = 0, c, x, l = 0, a, r = '', w = String.fromCharCode, L = str.length;
    var A = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    for (i = 0; i < 64; i++) { e[A.charAt(i)] = i; }
    for (x = 0; x < L; x++) {
        c = e[str.charAt(x)];
        b = (b << 6) + c; l += 6;
        while (l >= 8) { ((a = (b >>> (l -= 8)) & 0xff) || (x < (L - 2))) && (r += w(a)); }
    }
    return r;
}

function parseVless(url) {
    try {
        let link = url.replace(/^vless:\/\//i, '');
        
        // 1. 提取节点备注 (Hash 部分)
        let hashIndex = link.indexOf('#');
        let remark = "VLESS-Node";
        if (hashIndex !== -1) {
            remark = decodeURIComponent(link.substring(hashIndex + 1));
            link = link.substring(0, hashIndex);
        }

        // 2. 提取 UUID
        let atIndex = link.indexOf('@');
        if (atIndex === -1) return null;
        let uuid = link.substring(0, atIndex);
        link = link.substring(atIndex + 1);

        // 3. 提取 IP/域名 和 端口
        let queryIndex = link.indexOf('?');
        let hostPort = queryIndex !== -1 ? link.substring(0, queryIndex) : link;
        
        // 兼容 IPv6 加方括号的情况
        let server, port;
        if (hostPort.startsWith('[')) {
            let bracketEnd = hostPort.indexOf(']');
            server = hostPort.substring(0, bracketEnd + 1);
            port = hostPort.substring(bracketEnd + 2); // 跳过 ']:'
        } else {
            let parts = hostPort.split(':');
            server = parts[0];
            port = parts[1];
        }

        if (!server || !port) return null;

        // 4. 提取查询参数
        let params = {};
        if (queryIndex !== -1) {
            let queryString = link.substring(queryIndex + 1);
            queryString.split('&').forEach(pair => {
                let [key, value] = pair.split('=');
                if (key && value) {
                    params[key.toLowerCase()] = decodeURIComponent(value);
                }
            });
        }

        // 提取关键参数，找不到则使用默认值
        let type = params.type || 'tcp';
        let security = params.security || 'none';
        let sni = params.sni || params.peer || server;
        let fp = params.fp || '';

        // 构建 QX 原生节点基础格式 (完全不包含 vless-flow)
        let qxNode = `vless=${server}:${port}, method=none, password=${uuid}`;

        // ================= 解析核心逻辑 =================
        
        // 类型 1: VLESS + TCP + REALITY
        if (type === 'tcp' && security === 'reality') {
            qxNode += `, obfs=reality`;
            if (sni) qxNode += `, obfs-host=${sni}`;
            if (params.pbk) qxNode += `, obfs-uri=${params.pbk}`; // Reality 的 Public Key
            if (fp) qxNode += `, tls-client-id=${fp}`;
        } 
        
        // 类型 2: VLESS + TCP + TLS
        else if (type === 'tcp' && security === 'tls') {
            qxNode += `, obfs=over-tls`;
            if (sni) qxNode += `, obfs-host=${sni}`;
            if (fp) qxNode += `, tls-client-id=${fp}`;
        } 
        
        // 类型 3: VLESS + WS + TLS
        else if (type === 'ws' && security === 'tls') {
            qxNode += `, obfs=wss`;
            let wsHost = params.host || sni;
            if (wsHost) qxNode += `, obfs-host=${wsHost}`;
            let wsPath = params.path || '/';
            qxNode += `, obfs-uri=${wsPath}`;
            if (fp) qxNode += `, tls-client-id=${fp}`;
        } 
        
        // 其他类型暂不支持，返回 null
        else {
            return null; 
        }

        // 拼接节点名称
        qxNode += `, tag=${remark}`;

        return qxNode;

    } catch (e) {
        return null;
    }
}

// ======= QX 解析入口 =======
let content = $resource.content;

// 检查是否为 Base64 编码的订阅内容
if (content && !content.includes('://') && content.match(/^[A-Za-z0-9+/=\s]+$/)) {
    try {
        content = decodeBase64(content);
    } catch (e) {
        // 解码失败则保持原样
    }
}

let lines = content.split('\n');
let result = [];

for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('#')) {
        continue;
    }

    if (line.startsWith('vless://')) {
        let parsedNode = parseVless(line);
        if (parsedNode) {
            result.push(parsedNode);
        }
    } else {
        // 保留原订阅中其他 QX 支持的节点 (如 ss, trojan 等)
        result.push(line);
    }
}

// 返回处理后的节点列表给 QX
$done({ content: result.join('\n') });
