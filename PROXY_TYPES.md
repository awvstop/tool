# 🔗 代理类型说明

本项目提供了三种不同的代理实现，每种都有其特定的用途和限制。

## 📋 代理类型对比

| 类型 | 文件 | 支持的方法 | 特点 | 适用场景 |
|------|------|------------|------|----------|
| **HTTP代理** | `api/proxy.js` | 仅POST | 简单HTTP转发 | 基本HTTP请求代理 |
| **通用代理** | `api/universal-proxy.js` | GET/POST | 支持查询参数 | 灵活的多方法代理 |
| **SOCKS5代理** | `api/socks5-ws.js` | WebSocket | 真正的SOCKS5协议 | 完整代理功能 |

## 🔧 详细说明

### 1. HTTP代理 (`/api/proxy`)

**为什么只支持POST？**

- **设计理念**: 这是一个HTTP请求转发器，不是真正的代理
- **Vercel限制**: Serverless函数不适合长连接
- **简单性**: 专注于HTTP/HTTPS请求转发
- **安全性**: 避免GET请求的URL长度限制和缓存问题

**使用方式**:
```javascript
// 只能通过POST请求
const response = await fetch('/api/proxy', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://example.com',
    method: 'GET'
  })
});
```

### 2. 通用代理 (`/api/universal-proxy`)

**支持多种方式**:

- **GET请求**: 通过查询参数
- **POST请求**: 通过请求体

**使用方式**:
```javascript
// GET方式
const response1 = await fetch('/api/universal-proxy?url=https://example.com&method=GET');

// POST方式
const response2 = await fetch('/api/universal-proxy', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://example.com',
    method: 'GET'
  })
});
```

### 3. SOCKS5代理 (`/api/socks5-ws`)

**真正的SOCKS5协议**:

- **WebSocket隧道**: 通过WebSocket传输SOCKS5数据
- **完整协议**: 支持CONNECT、BIND、UDP_ASSOCIATE
- **长连接**: 支持持续的数据流

**限制**:
- 需要WebSocket客户端
- Vercel对WebSocket支持有限
- 需要特殊的客户端库

## 🤔 为什么选择POST作为主要方法？

### 1. **数据安全性**
```javascript
// POST - 数据在请求体中，更安全
POST /api/proxy
{
  "url": "https://sensitive-api.com",
  "headers": { "Authorization": "Bearer token" }
}

// GET - 数据在URL中，可能被记录
GET /api/proxy?url=https://sensitive-api.com&token=secret
```

### 2. **数据大小限制**
```javascript
// POST - 可以发送大量数据
{
  "url": "https://api.com/upload",
  "method": "POST",
  "data": "large_file_content..."
}

// GET - URL长度有限制（通常2048字符）
```

### 3. **请求体支持**
```javascript
// POST - 可以发送复杂的请求体
{
  "url": "https://api.com/data",
  "method": "POST",
  "data": JSON.stringify({
    "user": "john",
    "action": "create",
    "payload": {...}
  })
}
```

### 4. **缓存控制**
```javascript
// POST - 不会被浏览器缓存
// GET - 可能被缓存，导致数据泄露
```

## 🚀 推荐使用场景

### 使用HTTP代理 (`/api/proxy`) 当:
- 需要简单的HTTP请求转发
- 处理敏感数据
- 发送大量数据
- 需要POST请求体

### 使用通用代理 (`/api/universal-proxy`) 当:
- 需要GET请求的便利性
- 简单的URL转发
- 浏览器直接访问

### 使用SOCKS5代理 (`/api/socks5-ws`) 当:
- 需要完整的代理功能
- 支持TCP连接
- 需要长连接
- 有WebSocket客户端

## 📝 示例对比

### 获取网页内容

**HTTP代理**:
```javascript
const response = await fetch('/api/proxy', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://httpbin.org/get',
    method: 'GET'
  })
});
```

**通用代理**:
```javascript
// GET方式
const response = await fetch('/api/universal-proxy?url=https://httpbin.org/get');

// POST方式
const response = await fetch('/api/universal-proxy', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://httpbin.org/get',
    method: 'GET'
  })
});
```

## 🔒 安全考虑

1. **POST方法更安全**: 数据不在URL中，不会被记录在日志中
2. **请求体加密**: 可以更容易地加密敏感数据
3. **缓存控制**: 避免敏感数据被缓存
4. **大小限制**: 支持更大的数据传输

## 💡 总结

选择POST作为主要方法是一个安全和实用的设计决策。如果你需要GET请求的便利性，可以使用通用代理；如果需要完整的代理功能，可以考虑SOCKS5代理。
