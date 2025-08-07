const https = require('https');
const http = require('http');
const { URL } = require('url');

module.exports = async (req, res) => {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    let targetUrl, method, headers, data;

    // 支持两种方式：
    // 1. 通过查询参数指定目标URL
    // 2. 通过请求体指定完整配置

    if (req.method === 'GET' && req.query.url) {
      // GET 请求方式：通过查询参数
      targetUrl = req.query.url;
      method = req.query.method || 'GET';
      headers = req.query.headers ? JSON.parse(req.query.headers) : {};
      data = req.query.data || null;
    } else if (req.method === 'POST') {
      // POST 请求方式：通过请求体
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });

      await new Promise((resolve) => {
        req.on('end', () => {
          try {
            const requestData = JSON.parse(body);
            targetUrl = requestData.url;
            method = requestData.method || 'GET';
            headers = requestData.headers || {};
            data = requestData.data || null;
            resolve();
          } catch (error) {
            res.status(400).json({ error: 'Invalid JSON in request body' });
            resolve();
          }
        });
      });
    } else {
      res.status(400).json({ 
        error: 'Invalid request method',
        usage: {
          'GET with query params': '/api/universal-proxy?url=https://example.com&method=GET',
          'POST with JSON body': 'POST /api/universal-proxy with {"url": "https://example.com", "method": "GET"}'
        }
      });
      return;
    }

    if (!targetUrl) {
      res.status(400).json({ error: 'URL is required' });
      return;
    }

    // 验证URL
    let parsedUrl;
    try {
      parsedUrl = new URL(targetUrl);
    } catch (error) {
      res.status(400).json({ error: 'Invalid URL' });
      return;
    }

    // 选择HTTP或HTTPS模块
    const client = parsedUrl.protocol === 'https:' ? https : http;

    // 准备请求选项
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: method.toUpperCase(),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
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
      res.status(500).json({ error: 'Proxy request failed', details: error.message });
    });

    // 如果有请求数据，发送它
    if (data && method !== 'GET' && method !== 'HEAD') {
      proxyReq.write(data);
    }

    proxyReq.end();

  } catch (error) {
    console.error('Request handling error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};
