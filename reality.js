// 解析 VLESS 订阅，支持 Reality、TCP+TLS、WS+TLS 三种协议，输出 Quantumult X 格式
var lines = [];
try {
    // 兼容 base64 编码订阅
    lines = atob(content0.trim()).split('\n');
} catch(e) {
    lines = content0.split('\n');
}

var parsed = [];
for (var line of lines) {
    line = line.trim();
    if (!line.startsWith('vless://')) continue;
    
    try {
        var withoutScheme = line.slice(8);
        var hashIdx = withoutScheme.lastIndexOf('#');
        var name = hashIdx !== -1 ? decodeURIComponent(withoutScheme.slice(hashIdx + 1)) : 'VLESS节点';
        var mainPart = hashIdx !== -1 ? withoutScheme.slice(0, hashIdx) : withoutScheme;
        
        var atIdx = mainPart.indexOf('@');
        var uuid = mainPart.slice(0, atIdx);
        var rest = mainPart.slice(atIdx + 1);
        
        var qIdx = rest.indexOf('?');
        var hostPort = qIdx !== -1 ? rest.slice(0, qIdx) : rest;
        var paramStr = qIdx !== -1 ? rest.slice(qIdx + 1) : '';
        
        // 解析 host:port（支持 IPv6）
        var host, port;
        if (hostPort.startsWith('[')) {
            var bracketEnd = hostPort.indexOf(']');
            host = hostPort.slice(1, bracketEnd);
            port = hostPort.slice(bracketEnd + 2);
        } else {
            var colonIdx = hostPort.lastIndexOf(':');
            host = hostPort.slice(0, colonIdx);
            port = hostPort.slice(colonIdx + 1);
        }
        
        // 解析 URI 参数
        var params = {};
        paramStr.split('&').forEach(function(p) {
            var eqIdx = p.indexOf('=');
            if (eqIdx !== -1) params[p.slice(0, eqIdx)] = decodeURIComponent(p.slice(eqIdx + 1));
        });

        // 提取核心网络参数
        var security = params['security'] || '';
        var netType = params['type'] || 'tcp'; // 默认是 tcp
        var sni = params['sni'] || params['host'] || host;

        // 判断当前节点属于哪种类型
        var isReality = (security === 'reality');
        var isTcpTls = (netType === 'tcp' && security === 'tls');
        var isWsTls = (netType === 'ws' && security === 'tls');

        // 如果不是我们需要的这三种，直接跳过
        if (!isReality && !isTcpTls && !isWsTls) continue;

        // 拼接基础的 Quantumult X 节点格式
        var node = 'vless=' + host + ':' + port + ', method=none, password=' + uuid;

        // 根据不同类型注入对应的参数
        if (isReality) {
            var pbk = params['pbk'] || '';
            var sid = params['sid'] || '';
            var flow = params['flow'] || 'xtls-rprx-vision';
            
            node += ', obfs=over-tls';
            if (sni) node += ', obfs-host=' + sni;
            if (pbk) node += ', reality-base64-pubkey=' + pbk;
            if (sid) node += ', reality-hex-shortid=' + sid;
            node += ', vless-flow=' + flow;
            
        } else if (isTcpTls) {
            node += ', obfs=over-tls';
            if (sni) node += ', obfs-host=' + sni;
            
        } else if (isWsTls) {
            var path = params['path'] || '/';
            node += ', obfs=wss';
            if (sni) node += ', obfs-host=' + sni;
            node += ', obfs-uri=' + path;
        }

        // 统一在末尾加上节点名称
        node += ', tag=' + name;
        parsed.push(node);
        
    } catch(e) { /* 跳过无效行 */ }
}

$done({ content: parsed.join('\n') });
