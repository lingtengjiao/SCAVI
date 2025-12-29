# SCAVI 项目部署指南

## 服务器信息

- **公网IP**: 101.200.222.115
- **用户名**: root
- **密码**: Suantian51
- **部署目录**: /opt/scavi

## 快速部署

### 方法一：使用部署脚本（推荐）

1. **安装 sshpass**（如果还没有安装）:
   ```bash
   # macOS
   brew install hudochenkov/sshpass/sshpass
   
   # Linux
   sudo apt-get install sshpass
   ```

2. **运行部署脚本**:
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

   脚本会自动完成：
   - 检查本地文件
   - 连接服务器
   - 安装 Docker 和 Docker Compose（如果需要）
   - 上传项目文件
   - 构建和启动服务

### 方法二：手动部署

#### 1. 准备服务器环境

```bash
# SSH 连接到服务器
ssh root@101.200.222.115

# 安装 Docker
curl -fsSL https://get.docker.com | sh
systemctl start docker
systemctl enable docker

# 安装 Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 创建项目目录
mkdir -p /opt/scavi
cd /opt/scavi
```

#### 2. 上传项目文件

在本地机器上：

```bash
# 打包项目（排除不需要的文件）
tar --exclude='.git' \
    --exclude='node_modules' \
    --exclude='__pycache__' \
    --exclude='*.pyc' \
    --exclude='.DS_Store' \
    --exclude='mysql-data' \
    -czf scavi.tar.gz .

# 上传到服务器
scp scavi.tar.gz root@101.200.222.115:/opt/scavi/
```

在服务器上：

```bash
cd /opt/scavi
tar -xzf scavi.tar.gz
rm scavi.tar.gz
```

#### 3. 配置环境变量

创建 `.env` 文件：

```bash
cat > .env << 'EOF'
# 数据库配置
DB_PASSWORD=suantian51

# 应用配置
SECRET_KEY=$(openssl rand -hex 32)
ADMIN_USERNAME=SCAVI
ADMIN_PASSWORD=SCAVI123

# 阿里云 OSS 配置
OSS_TYPE=aliyun
ALIYUN_OSS_ACCESS_KEY_ID=your_access_key_id_here
ALIYUN_OSS_ACCESS_KEY_SECRET=your_access_key_secret_here
ALIYUN_OSS_ENDPOINT=oss-cn-beijing.aliyuncs.com
ALIYUN_OSS_BUCKET_NAME=scavi
OSS_PREFIX=uploads
EOF
```

#### 4. 构建前端（如果还没有构建）

```bash
cd frontend
npm install
npm run build
cd ..
```

#### 5. 启动服务

```bash
# 使用生产环境配置启动
docker-compose -f docker-compose.prod.yml up -d --build

# 查看服务状态
docker-compose -f docker-compose.prod.yml ps

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f
```

## 服务管理

### 查看服务状态

```bash
cd /opt/scavi
docker-compose -f docker-compose.prod.yml ps
```

### 查看日志

```bash
# 查看所有服务日志
docker-compose -f docker-compose.prod.yml logs -f

# 查看特定服务日志
docker-compose -f docker-compose.prod.yml logs -f web
docker-compose -f docker-compose.prod.yml logs -f nginx
docker-compose -f docker-compose.prod.yml logs -f db
```

### 重启服务

```bash
# 重启所有服务
docker-compose -f docker-compose.prod.yml restart

# 重启特定服务
docker-compose -f docker-compose.prod.yml restart web
```

### 停止服务

```bash
docker-compose -f docker-compose.prod.yml down
```

### 更新部署

```bash
# 1. 停止服务
docker-compose -f docker-compose.prod.yml down

# 2. 备份数据（重要！）
cp -r mysql-data mysql-data.backup.$(date +%Y%m%d_%H%M%S)

# 3. 更新代码（重新上传或 git pull）

# 4. 重新构建和启动
docker-compose -f docker-compose.prod.yml up -d --build
```

## 访问地址

部署成功后，可以通过以下地址访问：

- **前端网站**: http://101.200.222.115
- **管理后台**: http://101.200.222.115/admin
- **API 文档**: http://101.200.222.115/docs
- **健康检查**: http://101.200.222.115/health

## 防火墙配置

如果无法访问，请检查服务器防火墙：

```bash
# 查看防火墙状态
systemctl status firewalld
# 或
ufw status

# 开放端口（如果需要）
firewall-cmd --permanent --add-port=80/tcp
firewall-cmd --permanent --add-port=443/tcp
firewall-cmd --reload

# 或使用 ufw
ufw allow 80/tcp
ufw allow 443/tcp
```

## 数据备份

### 备份数据库

```bash
# 在服务器上执行
docker exec scavi-mysql mysqldump -u root -psuantian51 SCAVI > backup_$(date +%Y%m%d).sql

# 或备份整个数据目录
tar -czf mysql-data-backup-$(date +%Y%m%d).tar.gz mysql-data/
```

### 恢复数据库

```bash
# 恢复 SQL 文件
docker exec -i scavi-mysql mysql -u root -psuantian51 SCAVI < backup_20231229.sql

# 或恢复数据目录
tar -xzf mysql-data-backup-20231229.tar.gz
```

## 故障排查

### 服务无法启动

1. 检查 Docker 是否运行：
   ```bash
   systemctl status docker
   ```

2. 检查端口是否被占用：
   ```bash
   netstat -tulpn | grep :80
   ```

3. 查看详细错误日志：
   ```bash
   docker-compose -f docker-compose.prod.yml logs
   ```

### 无法访问网站

1. 检查 nginx 容器是否运行：
   ```bash
   docker ps | grep nginx
   ```

2. 检查 nginx 配置：
   ```bash
   docker exec scavi-nginx nginx -t
   ```

3. 检查防火墙设置

### 数据库连接失败

1. 检查数据库容器是否运行：
   ```bash
   docker ps | grep mysql
   ```

2. 检查数据库日志：
   ```bash
   docker logs scavi-mysql
   ```

3. 测试数据库连接：
   ```bash
   docker exec scavi-mysql mysql -u root -psuantian51 -e "SHOW DATABASES;"
   ```

## 安全建议

1. **修改默认密码**：
   - 修改数据库 root 密码
   - 修改管理员账户密码
   - 修改服务器 root 密码

2. **配置 HTTPS**：
   - 申请 SSL 证书
   - 配置 nginx SSL
   - 更新 docker-compose.prod.yml 中的 SSL 配置

3. **限制数据库访问**：
   - 生产环境不暴露 MySQL 端口
   - 使用强密码
   - 定期备份数据

4. **定期更新**：
   - 更新系统补丁
   - 更新 Docker 镜像
   - 更新应用代码

## 联系支持

如有问题，请查看日志文件或联系技术支持。

