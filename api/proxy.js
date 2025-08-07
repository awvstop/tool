const https = require('https');
const http = require('http');
const { URL } = require('url');

module.exports = async (req, res) => {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 只允许POST请求
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // 解析请求体
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const { url, method = 'GET', headers = {}, data } = JSON.parse(body);
        
        if (!url) {
          res.status(400).json({ error: 'URL is required' });
          return;
        }

        // 验证URL
        let targetUrl;
        try {
          targetUrl = new URL(url);
        } catch (error) {
          res.status(400).json({ error: 'Invalid URL' });
          return;
        }

        // 选择HTTP或HTTPS模块
        const client = targetUrl.protocol === 'https:' ? https : http;

        // 准备请求选项
        const options = {
          hostname: targetUrl.hostname,
          port: targetUrl.port || (targetUrl.protocol === 'https:' ? 443 : 80),
          path: targetUrl.pathname + targetUrl.search,
          method: method.toUpperCase(),
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            ...headers
          }
        };

        // 发送代理请求
        const proxyReq = client.request(options, (proxyRes) => {
          // 设置响应头
          res.writeHead(proxyRes.statusCode, proxyRes.headers);
          
          // 转发响应数据
          proxyRes.pipe(res);
        });

        proxyReq.on('error', (error) => {
          console.error('Proxy request error:', error);
          res.status(500).json({ error: 'Proxy request failed' });
        });

        // 如果有请求数据，发送它
        if (data) {
          proxyReq.write(data);
        }

        proxyReq.end();

      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        res.status(400).json({ error: 'Invalid JSON' });
      }
    });

  } catch (error) {
    console.error('Request handling error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
