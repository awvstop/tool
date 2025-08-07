# 🚀 部署指南

## 部署到 Vercel

### 方法一：通过 Vercel CLI

1. 安装 Vercel CLI
```bash
npm i -g vercel
```

2. 登录 Vercel
```bash
vercel login
```

3. 部署项目
```bash
vercel
```

4. 按照提示完成部署

### 方法二：通过 GitHub 集成

1. 将代码推送到 GitHub
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. 访问 [Vercel Dashboard](https://vercel.com/dashboard)

3. 点击 "New Project"

4. 选择你的 GitHub 仓库

5. 配置项目设置：
   - Framework Preset: `Other`
   - Build Command: `echo "No build required"`
   - Output Directory: `public`
   - Install Command: `npm install`

6. 点击 "Deploy"

### 方法三：直接导入

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)

2. 点击 "New Project"

3. 选择 "Import Git Repository"

4. 输入你的 GitHub 仓库 URL

5. 配置部署设置

6. 点击 "Deploy"

## 环境变量配置

如果需要，你可以在 Vercel 项目设置中添加环境变量：

- `NODE_ENV`: `production`
- `PORT`: `3000` (Vercel 会自动设置)

## 自定义域名

1. 在 Vercel 项目设置中
2. 点击 "Domains"
3. 添加你的自定义域名
4. 按照提示配置 DNS

## 监控和日志

- 访问 Vercel Dashboard 查看部署状态
- 在 "Functions" 标签页查看函数日志
- 在 "Analytics" 标签页查看使用统计

## 故障排除

### 常见问题

1. **部署失败**
   - 检查 `package.json` 中的依赖是否正确
   - 确保 Node.js 版本兼容（推荐 18.x）

2. **代理不工作**
   - 检查 API 路由是否正确
   - 查看函数日志中的错误信息

3. **CORS 错误**
   - 确保请求头设置正确
   - 检查目标服务器是否允许跨域

### 调试技巧

1. 使用 Vercel CLI 进行本地测试：
```bash
vercel dev
```

2. 查看实时日志：
```bash
vercel logs
```

3. 检查函数状态：
```bash
vercel ls
```

## 性能优化

1. **启用缓存**
   - 在 `vercel.json` 中配置缓存规则
   - 使用 CDN 加速静态资源

2. **优化函数大小**
   - 只包含必要的依赖
   - 使用 tree-shaking 减少包大小

3. **监控使用量**
   - 关注 Vercel 的使用配额
   - 设置使用量告警

## 安全建议

1. **添加身份验证**
   - 实现 API 密钥验证
   - 添加请求频率限制

2. **限制访问**
   - 配置 IP 白名单
   - 添加用户认证

3. **监控异常**
   - 设置错误告警
   - 记录访问日志
