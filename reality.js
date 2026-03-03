/**
 * Quantumult X 资源解析器 (Resource Parser)
 * 专门用于解析 VLESS + TCP + REALITY 标准订阅链接
 */

function parseVlessReality(url) {
    try {
        // 去除前缀
        let link = url.replace(/^vless:\/\//i, '');
        
        // 提取节点备注 (Hash 部分)
        let hashIndex = link.indexOf('#');
        let remark = "VLESS-REALITY";
        if (hashIndex !== -1) {
            remark = decodeURIComponent(link.substring(hashIndex + 1));
            link = link.substring(0, hashIndex);
        }

        // 提取 UUID
        let atIndex = link.indexOf('@');
        if (atIndex === -1) return null;
        let uuid = link.substring(0, atIndex);
        link = link.substring(atIndex + 1);

        // 提取 IP/域名 和 端口
        let queryIndex = link.indexOf('?');
        let hostPort = queryIndex !== -1 ? link.substring(0, queryIndex) : link;
        let [server, port] = hostPort.split(':');

        if (!server || !port) return null;

        // 提取查询参数
        let params = {};
        if (queryIndex !== -1) {
            let queryString = link.substring(queryIndex + 1);
            queryString.split('&').forEach(pair => {
                let [key, value] = pair.split('=');
                if (key && value) {
                    params[key] = decodeURIComponent(value);
                }
            });
        }

        // 过滤：仅处理 security=reality 的节点
        if (params.security !== 'reality') {
            return null; // 如果你想让这个脚本兼容普通 VLESS，可以在这里写 else 逻辑
        }

        // 构建 QX 原生节点格式
        // 标准格式大致为：vless=ip:port, method=none, password=uuid, obfs=reality, obfs-host=sni, obfs-uri=pbk...
        let qxNode = `vless=${server}:${port}, method=none, password=${uuid}, obfs=reality`;

        // 映射 SNI
        if (params.sni) {
            qxNode += `, obfs-host=${params.sni}`;
        }
        
        // 映射 Public Key (pbk) 
        // QX 通常使用 obfs-uri 来接收 reality 的 public key
        if (params.pbk) {
            qxNode += `, obfs-uri=${params.pbk}`; 
        }

        // 映射 Short ID (sid)
        if (params.sid) {
            qxNode += `, obfs-uri=${params.pbk}`; // 如果需要可以替换为 short-id=${params.sid}，视当前QX版本支持度而定
        }

        // 映射 指纹 (fp) 
        if (params.fp) {
             qxNode += `, tls-client-id=${params.fp}`;
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
let lines = content.split('\n');
let result = [];

for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('#')) {
        continue;
    }

    if (line.startsWith('vless://')) {
        let parsedNode = parseVlessReality(line);
        if (parsedNode) {
            result.push(parsedNode);
        }
    } else {
        // 如果订阅内包含 QX 原本就支持的节点（如 ss/trojan），直接原样保留
        result.push(line);
    }
}

// 返回处理后的节点列表给 QX
$done({ content: result.join('\n') });
