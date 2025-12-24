# SCAVI CMS - FastAPI 内容管理系统

## 🚀 项目简介

纯展示型 CMS 后端系统，为 Next.js 前端提供产品数据、轮播图等内容。

**核心特性：**
- ✅ 纯展示型（只读 API，无表单提交）
- ✅ 模块化架构（易于维护和扩展）
- ✅ 高性能（异步 SQLAlchemy + FastAPI）
- ✅ 现代化管理后台（SQLAdmin）

## 📂 项目结构

```
backend/
├── app/
│   ├── __init__.py
│   ├── core/              # 核心配置
│   │   ├── config.py      # 环境变量
│   │   └── database.py    # 数据库连接
│   ├── models/            # 数据模型
│   │   ├── base.py        # Base 类
│   │   ├── catalog.py     # Category, Product
│   │   └── content.py     # HeroSlide
│   ├── admin/             # 管理后台
│   │   ├── auth.py        # 认证
│   │   └── views.py       # 管理视图
│   ├── api/               # API 路由
│   │   └── routes.py      # 只读接口
│   └── main.py            # 应用入口
├── main.py                # 启动入口（兼容旧方式）
├── .env                   # 环境变量
└── requirements.txt       # 依赖
```

## 🛠️ 技术栈

- **FastAPI**: 现代化 Python Web 框架
- **SQLAlchemy (Async)**: 异步 ORM
- **SQLAdmin**: 管理后台
- **MySQL**: 数据库

## 📦 安装依赖

```bash
pip install -r requirements.txt
```

## ⚙️ 配置

创建 `.env` 文件：

```env
DB_NAME=SCAVI
DB_USER=root
DB_PASSWORD=suantian51
DB_HOST=127.0.0.1
DB_PORT=3306
SECRET_KEY=your-secret-key-change-this-in-production
ADMIN_USERNAME=SCAVI
ADMIN_PASSWORD=SCAVI123
```

## 🏃 运行

```bash
uvicorn main:app --reload
```

或使用新的模块化入口：

```bash
uvicorn app.main:app --reload
```

## 🌐 访问

- **首页**: http://127.0.0.1:8000/
- **API 文档**: http://127.0.0.1:8000/docs
- **管理后台**: http://127.0.0.1:8000/admin
  - 用户名: `SCAVI`
  - 密码: `SCAVI123`

## 📝 数据库表结构

### categories (分类表)
- `id`: 主键
- `name`: 分类名称
- `slug`: URL 标识
- `order`: 排序权重
- `is_active`: 是否启用

### products (产品表)
- `id`: 主键
- `category_id`: 分类ID（外键）
- `name`: 产品名称
- `slug`: URL 标识
- `description`: 产品简介
- `key_features`: 核心卖点（JSON 数组）
- `images`: 图片URL列表（JSON 数组）
- `specs`: 规格参数（JSON 对象）
- `is_active`: 是否展示

### hero_slides (轮播图表)
- `id`: 主键
- `title`: 标题
- `subtitle`: 副标题
- `image`: 图片URL
- `description`: 描述文本
- `link`: 跳转链接
- `button_text`: 按钮文案
- `order`: 排序权重
- `is_active`: 是否启用

## 🔌 API 端点

### 只读接口（供前端调用）

- `GET /api/slides` - 获取首页轮播图列表
- `GET /api/categories` - 获取分类列表
- `GET /api/products` - 获取产品列表（支持 `?category_id=1` 过滤）
- `GET /api/products/{id}` - 获取产品详情

## 🎯 使用场景

1. **管理后台**：登录后管理轮播图、分类和产品
2. **前端调用**：Next.js 前端通过 API 获取数据并渲染页面
3. **纯展示**：系统不处理表单提交，专注于内容展示
