# 自动初始化说明

## ✅ 已实现功能

现在当你运行 `docker-compose up -d` 时，系统会自动完成以下初始化：

### 1. 数据库表自动创建

应用启动时会自动创建所有数据库表：
- `categories` - 产品分类表
- `products` - 产品表
- `tags` - 标签表
- `product_tags` - 产品-标签关联表
- `hero_slides` - 轮播图表
- `admins` - 管理员账户表

**实现位置**: `app/main.py` 的 `startup` 事件

### 2. 默认管理员账户自动创建

如果数据库中不存在默认管理员账户，系统会自动创建：

- **用户名**: `SCAVI`（可通过环境变量 `ADMIN_USERNAME` 配置）
- **密码**: `SCAVI123`（可通过环境变量 `ADMIN_PASSWORD` 配置）
- **权限**: 超级管理员
- **状态**: 已激活

**实现位置**: `app/core/init_db.py`

**特点**:
- ✅ 如果管理员已存在，会跳过创建（不会重复创建）
- ✅ 如果管理员不存在，会自动创建
- ✅ 密码使用 bcrypt 加密存储
- ✅ 不会影响应用启动（即使创建失败也不会中断启动）

## 🚀 使用方法

### 首次启动

```bash
# 启动所有服务
docker-compose up -d

# 查看启动日志
docker-compose logs -f web
```

你会看到类似输出：
```
✅ 数据库表已创建
✅ 默认管理员账户 'SCAVI' 创建成功
   用户名: SCAVI
   密码: SCAVI123
   访问地址: http://localhost:8000/admin/login
```

### 后续启动

如果管理员已存在，会看到：
```
✅ 数据库表已创建
✅ 管理员账户 'SCAVI' 已存在，跳过创建
```

## ⚙️ 配置

### 环境变量

在 `docker-compose.yml` 中可以配置：

```yaml
environment:
  - ADMIN_USERNAME=SCAVI      # 默认管理员用户名
  - ADMIN_PASSWORD=SCAVI123   # 默认管理员密码
```

### 修改默认管理员

1. **修改环境变量**（推荐）:
   ```yaml
   # docker-compose.yml
   environment:
     - ADMIN_USERNAME=your_username
     - ADMIN_PASSWORD=your_password
   ```

2. **重启服务**:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

3. **删除旧管理员**（如果需要）:
   ```bash
   docker-compose exec db mysql -uroot -psuantian51 SCAVI -e "DELETE FROM admins WHERE username='SCAVI';"
   docker-compose restart web
   ```

## 🔍 验证

### 检查数据库表

```bash
docker-compose exec db mysql -uroot -psuantian51 SCAVI -e "SHOW TABLES;"
```

### 检查管理员账户

```bash
docker-compose exec db mysql -uroot -psuantian51 SCAVI -e "SELECT id, username, is_active, is_superuser FROM admins;"
```

### 测试登录

访问: http://localhost:8000/admin/login

使用默认凭据登录：
- 用户名: `SCAVI`
- 密码: `SCAVI123`

## 📝 技术细节

### 初始化流程

1. **应用启动** (`app/main.py`)
   ```python
   @app.on_event("startup")
   async def startup():
       # 1. 创建数据库表
       async with engine.begin() as conn:
           await conn.run_sync(Base.metadata.create_all)
       
       # 2. 初始化默认管理员
       from app.core.init_db import init_default_admin
       await init_default_admin()
   ```

2. **管理员初始化** (`app/core/init_db.py`)
   - 检查管理员是否存在
   - 如果不存在，创建新管理员
   - 使用 bcrypt 加密密码
   - 记录日志

### 安全特性

- ✅ 密码使用 bcrypt 加密（不可逆）
- ✅ 不会覆盖已存在的管理员
- ✅ 错误处理完善，不会影响应用启动
- ✅ 支持通过环境变量配置

## 🎯 优势

1. **零配置启动**: 无需手动创建数据库表和管理员
2. **自动化**: 每次启动自动检查并初始化
3. **安全**: 密码加密存储，不会明文保存
4. **灵活**: 支持环境变量配置
5. **可靠**: 错误处理完善，不会因初始化失败而影响应用

## 💡 注意事项

1. **生产环境**: 请修改默认密码，使用强密码
2. **多管理员**: 可以通过管理后台或 API 创建更多管理员
3. **数据持久化**: MySQL 数据保存在 `./mysql-data` 目录
4. **备份**: 定期备份数据库数据

