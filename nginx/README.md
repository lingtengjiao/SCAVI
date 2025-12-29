# Nginx 配置说明

## 概述

本项目使用 Nginx 作为反向代理服务器，提供以下功能：

1. **静态文件服务**：高效提供前端静态文件（HTML、CSS、JS、图片等）
2. **API 代理**：将 API 请求代理到 FastAPI 后端
3. **Gzip 压缩**：自动压缩响应内容，提升传输效率
4. **缓存控制**：为静态资源设置合适的缓存策略
5. **安全头**：添加安全相关的 HTTP 头

## 架构

```
客户端请求
    ↓
Nginx (端口 80/8000)
    ↓
    ├─→ 静态文件 (/var/www/static)
    └─→ API 请求 → FastAPI (web:8000)
```

## 配置说明

### 静态文件

- **位置**：`/var/www/static`
- **缓存策略**：
  - 静态资源（JS、CSS、图片）：1年缓存
  - 上传文件：7天缓存
  - `index.html`：不缓存（确保更新及时）

### API 代理

- **路径**：`/api/*` → `http://web:8000/api/*`
- **文档**：`/docs` → FastAPI Swagger UI
- **OpenAPI**：`/openapi.json` → FastAPI OpenAPI Schema

### 性能优化

- **Gzip 压缩**：自动压缩文本类型文件
- **Sendfile**：使用系统调用高效传输文件
- **Keepalive**：保持连接，减少握手开销

## 修改配置

1. 编辑 `nginx/nginx.conf`
2. 重启 nginx 容器：
   ```bash
   docker-compose restart nginx
   ```

## 验证配置

检查 nginx 配置语法：
```bash
docker-compose exec nginx nginx -t
```

查看 nginx 日志：
```bash
docker-compose logs nginx
```

