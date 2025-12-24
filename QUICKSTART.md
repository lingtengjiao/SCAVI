# 快速启动指南

## 一键构建和运行

### 方法 1: 使用构建脚本（推荐）

```bash
# 构建前端
./build.sh

# 运行后端
uvicorn app.main:app --reload
```

### 方法 2: 手动构建

```bash
# 1. 安装前端依赖
cd frontend
npm install  # 或 pnpm install

# 2. 构建前端
npm run build  # 或 pnpm build

# 3. 返回项目根目录
cd ..

# 4. 安装后端依赖（如果还没有）
pip install -r requirements.txt

# 5. 运行后端
uvicorn app.main:app --reload
```

## 访问应用

启动后端后，访问：

- **前端网站**: http://localhost:8000/
- **管理后台**: http://localhost:8000/admin
- **API 文档**: http://localhost:8000/docs

## 开发模式

### 前端开发（热重载）

```bash
cd frontend
npm run dev
```

前端将在 http://localhost:5173 运行，并自动代理 API 请求到后端。

### 后端开发（自动重载）

```bash
uvicorn app.main:app --reload
```

## 常见问题

### 1. 前端页面显示 "前端未构建"

**解决方案**: 运行 `./build.sh` 或手动构建前端。

### 2. API 请求失败

**检查**:
- 后端是否正在运行
- 数据库连接是否正常
- `.env` 文件配置是否正确

### 3. 静态文件 404

**解决方案**: 确保已运行构建脚本，`static/` 目录存在且包含构建文件。

## 下一步

查看 [INTEGRATION.md](./INTEGRATION.md) 了解详细的集成说明。

