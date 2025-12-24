# 管理员账户管理说明

## 📋 管理员表结构

管理员账户存储在 `admins` 表中，包含以下字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| username | VARCHAR(50) | 用户名（唯一） |
| password_hash | VARCHAR(255) | 密码哈希（bcrypt 加密） |
| email | VARCHAR(100) | 邮箱（可选） |
| is_active | BOOLEAN | 是否启用 |
| is_superuser | BOOLEAN | 是否超级管理员 |
| last_login | DATETIME | 最后登录时间 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

## 🔐 创建管理员账号

### 方法 1: 使用脚本（推荐）

```bash
python3 create_admin.py
```

这会创建默认管理员：
- 用户名: `SCAVI`
- 密码: `SCAVI123`
- 超级管理员: 是

### 方法 2: 手动创建

```python
python3 -c "
import asyncio
import bcrypt
from app.core.database import async_session_maker
from app.models.admin import Admin
from datetime import datetime

async def create():
    async with async_session_maker() as session:
        password_hash = bcrypt.hashpw('YOUR_PASSWORD'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        admin = Admin(
            username='YOUR_USERNAME',
            password_hash=password_hash,
            email='your@email.com',
            is_active=True,
            is_superuser=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        session.add(admin)
        await session.commit()
        print('管理员创建成功')

asyncio.run(create())
"
```

## 🔑 修改密码

### 方法 1: 使用脚本

修改 `create_admin.py` 脚本，添加密码修改功能，或创建新脚本：

```python
# change_password.py
import asyncio
import bcrypt
from app.core.database import async_session_maker
from app.models.admin import Admin
from sqlalchemy import select

async def change_password(username: str, new_password: str):
    async with async_session_maker() as session:
        result = await session.execute(select(Admin).where(Admin.username == username))
        admin = result.scalar_one_or_none()
        
        if not admin:
            print(f"管理员 '{username}' 不存在")
            return
        
        admin.password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        await session.commit()
        print(f"密码已更新")

asyncio.run(change_password("SCAVI", "NEW_PASSWORD"))
```

### 方法 2: 通过数据库直接修改（不推荐）

```sql
-- 注意：需要先使用 bcrypt 加密密码
UPDATE admins SET password_hash = '加密后的密码哈希' WHERE username = 'SCAVI';
```

## 🔒 安全说明

1. **密码加密**: 所有密码使用 bcrypt 加密存储，不会以明文形式保存
2. **密码管理**: 在管理后台中，密码哈希字段被排除，不能直接编辑
3. **登录记录**: 每次成功登录会更新 `last_login` 字段
4. **账户状态**: 可以通过 `is_active` 字段禁用/启用账户

## 📝 管理后台使用

1. 访问管理后台: http://localhost:8000/admin
2. 使用创建的管理员账号登录
3. 在"管理员账户"页面可以：
   - 查看所有管理员
   - 编辑管理员信息（用户名、邮箱、状态等）
   - 查看最后登录时间
   - **注意**: 密码不能在此处修改，需要使用脚本

## 🚨 注意事项

1. **初始管理员**: 首次部署后，务必运行 `create_admin.py` 创建管理员账号
2. **密码安全**: 生产环境请使用强密码
3. **超级管理员**: `is_superuser` 字段可用于区分普通管理员和超级管理员（未来可扩展权限系统）
4. **账户禁用**: 可以通过设置 `is_active = False` 来禁用账户，而不是删除

## 🔄 认证流程

1. 用户输入用户名和密码
2. 系统从数据库查询对应的管理员记录
3. 使用 bcrypt 验证密码
4. 如果验证通过，更新 `last_login` 并创建 session
5. 后续请求通过 session 验证身份

## 📚 相关文件

- `app/models/admin.py` - 管理员模型
- `app/admin/auth.py` - 认证逻辑
- `app/admin/views.py` - 管理后台视图
- `create_admin.py` - 创建管理员脚本

