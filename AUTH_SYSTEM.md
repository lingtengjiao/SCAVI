# 管理员认证系统说明

## ✅ 已实现的认证功能

### 1. 后端认证 API

**位置**: `app/api/auth.py`

**API 端点**:
- `POST /api/auth/login` - 管理员登录
- `POST /api/auth/logout` - 登出
- `GET /api/auth/me` - 获取当前用户信息（预留）

### 2. 前端认证系统

**位置**: `frontend/src/app/context/AuthContext.tsx`

**功能**:
- 登录状态管理
- localStorage 持久化（24小时有效期）
- 自动登录状态恢复
- 登出功能

### 3. 权限控制

**管理后台页面保护**:
- `AdminDashboardPage` 会自动检查登录状态
- 未登录用户会被重定向到登录页
- 已登录用户访问登录页会被重定向到管理后台

## 🔐 登录流程

1. **用户访问** `/admin/login`
2. **输入用户名和密码**
3. **前端调用** `POST /api/auth/login`
4. **后端验证**:
   - 检查用户名是否存在
   - 检查账户是否启用
   - 使用 bcrypt 验证密码
   - 更新最后登录时间
5. **返回结果**:
   - 成功：返回 `{success: true, admin_id, username}`
   - 失败：返回错误信息
6. **前端处理**:
   - 成功：保存到 localStorage，跳转到管理后台
   - 失败：显示错误信息

## 🔒 安全特性

1. **密码加密**: 使用 bcrypt 加密存储
2. **账户状态检查**: 禁用账户无法登录
3. **错误信息**: 不泄露具体错误原因（统一提示"用户名或密码错误"）
4. **Session 管理**: 登录状态保存在 localStorage（24小时有效期）
5. **自动登出**: 过期后自动清除登录状态

## 📝 使用说明

### 登录

访问: http://localhost:8000/admin/login

**默认管理员账号**:
- 用户名: `SCAVI`
- 密码: `SCAVI123`

### 权限检查

管理后台页面 (`/admin/dashboard`) 会自动检查：
- 如果未登录 → 重定向到 `/admin/login`
- 如果已登录 → 正常显示管理界面

### 登出

点击管理后台的"登出"按钮，会：
1. 清除 localStorage 中的登录信息
2. 调用后端登出接口
3. 重定向到首页

## 🔧 API 使用示例

### 登录请求

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"SCAVI","password":"SCAVI123"}'
```

### 成功响应

```json
{
  "success": true,
  "message": "登录成功",
  "admin_id": 1,
  "username": "SCAVI"
}
```

### 失败响应

```json
{
  "detail": "用户名或密码错误"
}
```

## 🚨 错误处理

### 常见错误

1. **用户名或密码错误** (401)
   - 用户名不存在
   - 密码不正确

2. **账户已被禁用** (403)
   - `is_active = False` 的账户无法登录

3. **请求格式错误** (400)
   - 缺少用户名或密码

## 💡 注意事项

1. **密码安全**: 生产环境请使用强密码
2. **HTTPS**: 生产环境必须使用 HTTPS
3. **Token 过期**: 当前使用 localStorage，24小时后自动过期
4. **多设备登录**: 当前系统支持多设备同时登录
5. **Session 管理**: 未来可以升级为 JWT token 或更安全的 session 管理

## 🔄 未来改进

- [ ] 实现 JWT token 认证
- [ ] 添加登录尝试次数限制
- [ ] 添加验证码功能
- [ ] 实现记住我功能
- [ ] 添加登录日志记录
- [ ] 实现单点登录 (SSO)

