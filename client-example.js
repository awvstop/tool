const https = require('https');
const http = require('http');
const { URL } = require('url');

class ProxyClient {
  constructor(proxyUrl) {
    this.proxyUrl = proxyUrl;
  }

  async request(url, options = {}) {
    const {
      method = 'GET',
      headers = {},
      data = null,
      timeout = 30000
    } = options;

    const requestData = {
      url,
      method,
      headers,
      data
    };

    return new Promise((resolve, reject) => {
      const targetUrl = new URL(this.proxyUrl);
      const client = targetUrl.protocol === 'https:' ? https : http;

      const reqOptions = {
        hostname: targetUrl.hostname,
        port: targetUrl.port || (targetUrl.protocol === 'https:' ? 443 : 80),
        path: targetUrl.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(JSON.stringify(requestData))
        }
      };

      const req = client.request(reqOptions, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData
          });
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.setTimeout(timeout);
      req.write(JSON.stringify(requestData));
      req.end();
    });
  }

  async get(url, options = {}) {
    return this.request(url, { ...options, method: 'GET' });
  }

  async post(url, data, options = {}) {
    return this.request(url, { ...options, method: 'POST', data });
  }
}

// 使用示例
async function example() {
  // 替换为你的Vercel部署URL
  const proxyUrl = 'https://your-project.vercel.app/api/proxy';
  const client = new ProxyClient(proxyUrl);

  try {
    // 示例1: 获取网页内容
    console.log('Fetching Google homepage...');
    const response1 = await client.get('https://www.google.com');
    console.log('Status:', response1.statusCode);
    console.log('Content length:', response1.data.length);

    // 示例2: 获取JSON API
    console.log('\nFetching JSON API...');
    const response2 = await client.get('https://jsonplaceholder.typicode.com/posts/1');
    console.log('Status:', response2.statusCode);
    console.log('Data:', JSON.parse(response2.data));

    // 示例3: POST请求
    console.log('\nMaking POST request...');
    const response3 = await client.post(
      'https://jsonplaceholder.typicode.com/posts',
      JSON.stringify({
        title: 'Test Post',
        body: 'This is a test post via proxy',
        userId: 1
      }),
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('Status:', response3.statusCode);
    console.log('Response:', JSON.parse(response3.data));

  } catch (error) {
    console.error('Error:', error.message);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  example();
}

module.exports = ProxyClient;
