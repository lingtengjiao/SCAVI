# 前后端集成说明

本项目已经将前端 React 应用集成到后端 FastAPI 应用中。

## 项目结构

```
Underwear/
├── app/                    # FastAPI 后端
│   ├── main.py            # 主应用入口（已配置静态文件服务）
│   ├── api/               # API 路由
│   └── ...
├── static/                 # 前端构建输出目录（由 Vite 生成）
│   ├── index.html
│   └── assets/
└── frontend/               # 前端源码
    ├── src/
    │   └── app/
    │       ├── services/
    │       │   └── api.ts  # API 服务层
    │       └── App.tsx     # 主应用组件（已集成 API）
    └── vite.config.ts      # Vite 配置（已配置构建输出）
```

## 构建和运行

### 1. 安装前端依赖

```bash
cd frontend
npm install
# 或
pnpm install
```

### 2. 构建前端

```bash
npm run build
# 或
pnpm build
```

构建完成后，前端文件会被输出到 `../static/` 目录。

### 3. 安装后端依赖

```bash
# 在项目根目录
pip install -r requirements.txt
```

### 4. 配置环境变量

创建 `.env` 文件（如果还没有）：

```env
DB_USER=root
DB_PASSWORD=your_password
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=SCAVI
SECRET_KEY=your-secret-key
ADMIN_USERNAME=SCAVI
ADMIN_PASSWORD=SCAVI123
```

### 5. 运行后端

```bash
# 在项目根目录
uvicorn app.main:app --reload
```

后端将在 `http://localhost:8000` 启动。

## 访问应用

- **前端网站**: http://localhost:8000/
- **管理后台 (SQLAdmin)**: http://localhost:8000/admin
- **API 文档**: http://localhost:8000/docs

## API 端点

前端通过以下 API 端点获取数据：

- `GET /api/slides` - 获取首页轮播图
- `GET /api/categories` - 获取分类列表
- `GET /api/products` - 获取产品列表
- `GET /api/products/{product_id}` - 获取产品详情

## 开发模式

### 前端开发（热重载）

```bash
cd frontend
npm run dev
```

前端开发服务器将在 `http://localhost:5173` 启动（默认 Vite 端口）。

**注意**: 在开发模式下，前端需要配置代理来访问后端 API。可以在 `vite.config.ts` 中添加：

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
    },
  },
}
```

### 后端开发（自动重载）

```bash
uvicorn app.main:app --reload
```

## 数据流程

1. 前端组件（`App.tsx`）在挂载时调用 API 服务层（`services/api.ts`）
2. API 服务层通过 `fetch` 调用后端 FastAPI 接口
3. 后端从数据库获取数据并返回 JSON
4. 前端将 API 响应转换为组件所需的数据格式
5. 组件渲染数据

## 注意事项

1. **构建顺序**: 必须先构建前端，后端才能服务静态文件
2. **静态文件目录**: 确保 `static/` 目录存在且包含构建后的文件
3. **SPA 路由**: 所有非 API 路由都会返回 `index.html`，由前端路由处理
4. **管理后台**: 前端的管理后台功能目前使用本地状态，需要进一步集成后端 API（包括认证和 CRUD 操作）

## 下一步

- [ ] 集成前端管理后台与后端 API（需要添加认证和 CRUD 接口）
- [ ] 添加图片上传功能
- [ ] 优化错误处理
- [ ] 添加数据缓存

