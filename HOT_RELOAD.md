# 热重载配置说明

## 🔄 当前状态

### 后端热重载 ✅
- **状态**: 已配置
- **实现**: Docker 中使用 `uvicorn --reload`
- **监听**: Python 文件（`.py`）
- **效果**: 修改后端代码后自动重启

### 前端热重载 ⚠️
- **状态**: 需要重新构建 Docker 镜像
- **实现**: 文件监听 + 自动构建
- **监听**: 前端源码文件（`.tsx`, `.ts`, `.jsx`, `.js`, `.css`）
- **效果**: 修改前端代码后自动重新构建到 `static/` 目录

## 🚀 启用前端热重载

### 方法 1: 重新构建 Docker 镜像（推荐）

```bash
# 停止当前服务
docker-compose down

# 重新构建镜像（包含 Node.js 和前端依赖）
docker-compose build --no-cache web

# 启动服务
docker-compose up -d

# 查看日志，确认前端监听已启动
docker-compose logs -f web
```

你会看到类似输出：
```
🔄 启动前端文件监听...
👀 开始监听前端文件变化: /app/frontend
🔨 执行初始构建...
✅ 初始构建完成
🚀 启动 FastAPI 应用...
```

### 方法 2: 本地开发（更快速）

如果你在本地开发，可以使用前端开发服务器：

```bash
# 终端 1: 运行后端（Docker）
docker-compose up

# 终端 2: 运行前端开发服务器（本地）
cd frontend
npm install
npm run dev
```

前端开发服务器会在 `http://localhost:5173` 启动，自带热重载。

## 📝 工作原理

### 后端热重载
1. `uvicorn --reload` 监听 Python 文件变化
2. 文件修改后自动重启应用
3. 无需手动操作

### 前端热重载
1. `watch_frontend.py` 监听 `frontend/` 目录
2. 检测到文件变化后自动运行 `npm run build`
3. 构建输出到 `static/` 目录
4. FastAPI 自动服务新的静态文件

## ⚙️ 配置说明

### 文件监听配置
- **监听目录**: `frontend/`
- **监听文件**: `.tsx`, `.ts`, `.jsx`, `.js`, `.css`, `.json`
- **排除**: `node_modules/`, `dist/`
- **防抖时间**: 1 秒（避免频繁构建）

### 构建配置
- **构建命令**: `npm run build`
- **输出目录**: `static/`
- **超时时间**: 2 分钟

## 🔍 验证热重载

### 测试后端热重载
1. 修改任意 `.py` 文件（如 `app/main.py`）
2. 查看日志：`docker-compose logs -f web`
3. 应该看到：`INFO:     Detected file change in 'app/main.py'. Reloading...`

### 测试前端热重载
1. 修改前端文件（如 `frontend/src/app/components/Footer.tsx`）
2. 查看日志：`docker-compose logs -f web`
3. 应该看到：
   ```
   🔄 检测到前端文件变化，开始重新构建...
   ✅ 前端构建成功！
   ```
4. 刷新浏览器，查看变化

## 🐛 故障排除

### 前端监听未启动
**问题**: 日志中没有看到 "启动前端文件监听"

**解决**:
1. 检查 `frontend/` 目录是否存在
2. 检查 `frontend/package.json` 是否存在
3. 重新构建镜像：`docker-compose build --no-cache web`

### 构建失败
**问题**: 看到 "❌ 构建失败"

**解决**:
1. 检查前端依赖是否安装：`docker-compose exec web ls frontend/node_modules`
2. 手动安装依赖：`docker-compose exec web sh -c "cd frontend && npm install"`
3. 手动构建测试：`docker-compose exec web sh -c "cd frontend && npm run build"`

### 文件变化未触发构建
**问题**: 修改文件后没有自动构建

**解决**:
1. 检查文件是否在监听范围内（`.tsx`, `.ts`, `.jsx`, `.js`, `.css`）
2. 检查是否在 `node_modules` 或 `dist` 目录中
3. 查看监听日志：`docker-compose logs web | grep "检测到"`

## 💡 最佳实践

1. **开发时**: 使用本地前端开发服务器（`npm run dev`），体验更好
2. **测试时**: 使用 Docker 热重载，模拟生产环境
3. **生产时**: 禁用热重载，使用预构建的静态文件

## 📚 相关文件

- `Dockerfile` - Docker 镜像配置
- `start.sh` - 启动脚本
- `watch_frontend.py` - 前端文件监听脚本
- `docker-compose.yml` - Docker Compose 配置

