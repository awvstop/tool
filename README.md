# 🔗 HTTP 代理服务器

这是一个基于 Node.js 的 HTTP 代理服务器，专为 Vercel 部署设计。允许你通过远程服务器代理 HTTP/HTTPS 请求。

## ✨ 功能特性

- 🌐 支持 HTTP 和 HTTPS 代理
- 🚀 专为 Vercel 部署优化
- 🔧 简单易用的 API
- 📱 内置 Web 测试界面
- 🔒 支持自定义请求头和请求体
- ⚡ 快速响应，低延迟

## 🚀 快速开始

### 1. 部署到 Vercel

1. Fork 或克隆此仓库
2. 在 Vercel 中导入项目
3. 部署完成后，你会得到一个类似 `https://your-project.vercel.app` 的 URL

### 2. 使用代理

#### 通过 Web 界面测试

访问你的部署 URL，你会看到一个友好的 Web 界面来测试代理功能。

#### 通过 API 使用

```javascript
const ProxyClient = require('./client-example.js');

const client = new ProxyClient('https://your-project.vercel.app/api/proxy');

// GET 请求
const response = await client.get('https://httpbin.org/get');
console.log(response.data);

// POST 请求
const postResponse = await client.post(
  'https://httpbin.org/post',
  JSON.stringify({ key: 'value' }),
  {
    headers: {
      'Content-Type': 'application/json'
    }
  }
);
```

#### 直接使用 fetch

```javascript
const response = await fetch('https://your-project.vercel.app/api/proxy', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://httpbin.org/get',
    method: 'GET',
    headers: {
      'User-Agent': 'MyApp/1.0'
    }
  })
});

const data = await response.text();
console.log(data);
```

## 📁 项目结构

```
├── api/
│   ├── proxy.js          # 主要的代理服务器实现
│   └── socks5.js         # SOCKS5 代理实现（实验性）
├── public/
│   └── index.html        # Web 测试界面
├── client-example.js     # 客户端使用示例
├── package.json          # 项目依赖
├── vercel.json          # Vercel 配置
└── README.md            # 项目说明
```

## 🔧 API 文档

### 代理端点

**URL:** `/api/proxy`  
**方法:** `POST`  
**Content-Type:** `application/json`

### 请求参数

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `url` | string | ✅ | 目标 URL |
| `method` | string | ❌ | HTTP 方法 (默认: GET) |
| `headers` | object | ❌ | 自定义请求头 |
| `data` | string | ❌ | 请求体数据 |

### 响应格式

代理会直接转发目标服务器的响应，包括状态码、响应头和响应体。

## 🛠️ 本地开发

1. 克隆仓库
```bash
git clone <your-repo-url>
cd tool
```

2. 安装依赖
```bash
npm install
```

3. 启动开发服务器
```bash
npm run dev
```

4. 访问 `http://localhost:3000` 查看 Web 界面

## 🔒 安全注意事项

- ⚠️ 此代理服务器没有身份验证，请谨慎使用
- 🔐 建议在生产环境中添加访问控制
- 🚫 不要用于代理敏感数据或绕过安全措施
- 📊 注意 Vercel 的使用限制和配额

## 🌟 使用场景

- 🔍 绕过地理限制
- 🧪 API 测试和调试
- 📱 移动应用开发
- 🌍 跨域请求测试
- 🔧 网络问题诊断

## 📝 示例

### 获取网页内容

```javascript
const response = await fetch('/api/proxy', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://www.google.com',
    method: 'GET'
  })
});
```

### 发送 POST 请求

```javascript
const response = await fetch('/api/proxy', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://api.example.com/data',
    method: 'POST',
    headers: {
      'Authorization': 'Bearer your-token',
      'Content-Type': 'application/json'
    },
    data: JSON.stringify({ name: 'John', age: 30 })
  })
});
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## ⚠️ 免责声明

此工具仅供学习和合法用途使用。使用者需要遵守当地法律法规，不得用于非法活动。