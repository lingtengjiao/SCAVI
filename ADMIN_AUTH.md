# 管理后台认证系统

## 概述

所有管理后台的操作都需要用户登录后才能执行。系统提供了两种管理界面：

1. **SQLAdmin 管理后台** (`/admin`) - 基于 SQLAlchemy 的自动生成管理界面
2. **前端管理后台** (`/admin/dashboard`) - 自定义 React 管理界面

## 认证方式

### Session 认证

系统使用 **Session 认证**，登录后会在服务器端设置 session，前端通过 cookies 自动携带 session 信息。

### 登录流程

1. 访问 `/admin/login` 或 `/api/auth/login`
2. 输入用户名和密码
3. 后端验证成功后设置 session
4. 后续请求自动携带 session cookie

## 受保护的操作

### SQLAdmin 管理后台 (`/admin`)

所有 SQLAdmin 的操作都通过 `AdminAuth` 进行保护：
- ✅ 查看数据
- ✅ 创建数据
- ✅ 更新数据
- ✅ 删除数据

**访问方式：**
- 直接访问 `/admin` 会自动跳转到登录页
- 登录后可以访问所有管理功能

### 后端管理 API (`/api/admin/*`)

所有管理 API 都需要通过 `get_current_admin` 依赖进行认证：

#### 产品管理
- `POST /api/admin/products` - 创建产品
- `PUT /api/admin/products/{id}` - 更新产品
- `DELETE /api/admin/products/{id}` - 删除产品

#### 分类管理
- `POST /api/admin/categories` - 创建分类
- `PUT /api/admin/categories/{id}` - 更新分类
- `DELETE /api/admin/categories/{id}` - 删除分类

#### 标签管理
- `POST /api/admin/tags` - 创建标签
- `PUT /api/admin/tags/{id}` - 更新标签
- `DELETE /api/admin/tags/{id}` - 删除标签

#### 轮播图管理
- `POST /api/admin/slides` - 创建轮播图
- `PUT /api/admin/slides/{id}` - 更新轮播图
- `DELETE /api/admin/slides/{id}` - 删除轮播图

**未登录访问会返回：**
```json
{
  "detail": "请先登录"
}
```

**状态码：** `401 Unauthorized`

### 前端管理后台 (`/admin/dashboard`)

前端管理后台通过 `AuthContext` 进行权限控制：
- 未登录访问会自动重定向到 `/admin/login`
- 所有 API 调用都会自动携带 session cookie
- 如果 API 返回 401，会自动跳转到登录页

## 公开 API（无需认证）

以下 API 是公开的，无需登录即可访问：

- `GET /api/products` - 获取产品列表
- `GET /api/products/{id}` - 获取产品详情
- `GET /api/categories` - 获取分类列表
- `GET /api/tags` - 获取标签列表
- `GET /api/slides` - 获取轮播图列表

## 认证 API

### 登录
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "SCAVI",
  "password": "SCAVI123"
}
```

**响应：**
```json
{
  "success": true,
  "message": "登录成功",
  "admin_id": 1,
  "username": "SCAVI"
}
```

### 获取当前用户信息
```http
GET /api/auth/me
```

**响应：**
```json
{
  "id": 1,
  "username": "SCAVI",
  "email": null,
  "is_superuser": true
}
```

### 登出
```http
POST /api/auth/logout
```

**响应：**
```json
{
  "success": true,
  "message": "已登出"
}
```

## 测试认证

### 测试未登录访问
```bash
curl -X POST http://localhost:8000/api/admin/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Product"}'
```

**预期响应：**
```json
{
  "detail": "请先登录"
}
```

### 测试登录后访问
```bash
# 1. 登录并保存 cookies
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"SCAVI","password":"SCAVI123"}' \
  -c cookies.txt

# 2. 使用 cookies 访问管理 API
curl -X POST http://localhost:8000/api/admin/products \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"name":"Test Product"}'
```

**预期响应：**
```json
{
  "success": true,
  "message": "产品创建成功",
  "id": 1
}
```

## 安全说明

1. **Session 安全**：Session 使用 `SECRET_KEY` 进行签名，确保 session 数据不被篡改
2. **密码加密**：所有密码使用 `bcrypt` 进行哈希存储，不会以明文形式存储
3. **账户状态**：只有 `is_active=True` 的管理员账户才能登录
4. **自动登出**：前端可以设置 session 过期时间（当前为 24 小时）

## 默认管理员账户

- **用户名：** `SCAVI`
- **密码：** `SCAVI123`
- **超级管理员：** 是

可以通过 `create_admin.py` 脚本创建新的管理员账户。

