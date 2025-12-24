# 数据库配置说明

## ✅ 配置完成

数据库和管理后台已成功配置！

## 数据库信息

- **数据库名称**: SCAVI
- **数据库类型**: MySQL
- **字符集**: utf8mb4
- **排序规则**: utf8mb4_unicode_ci

### 当前数据库表

- `categories` - 产品分类表
- `hero_slides` - 首页轮播图表
- `products` - 产品表

## 管理后台登录信息

- **访问地址**: http://localhost:8000/admin
- **用户名**: `SCAVI`
- **密码**: `SCAVI123`

## 配置文件

所有配置都在 `.env` 文件中：

```env
# 数据库配置
DB_USER=root
DB_PASSWORD=suantian51
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=SCAVI

# 安全配置
SECRET_KEY=scavi-secret-key-2024-change-in-production

# 管理后台配置
ADMIN_USERNAME=SCAVI
ADMIN_PASSWORD=SCAVI123
```

## 注意事项

1. **生产环境**: 请修改 `.env` 文件中的 `SECRET_KEY` 为更安全的随机字符串
2. **数据库密码**: 当前使用默认密码，生产环境请修改
3. **管理员密码**: 如需修改，更新 `.env` 文件中的 `ADMIN_PASSWORD` 并重启服务器

## 验证配置

如果遇到问题，可以运行以下命令验证配置：

```bash
# 检查数据库连接
mysql -u root -psuantian51 -e "USE SCAVI; SHOW TABLES;"

# 检查 .env 文件
cat .env
```

## 数据库操作

### 查看所有表
```sql
USE SCAVI;
SHOW TABLES;
```

### 查看表结构
```sql
DESCRIBE products;
DESCRIBE categories;
DESCRIBE hero_slides;
```

### 备份数据库
```bash
mysqldump -u root -psuantian51 SCAVI > backup.sql
```

### 恢复数据库
```bash
mysql -u root -psuantian51 SCAVI < backup.sql
```

