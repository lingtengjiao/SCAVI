# 快速部署指南

## 一键部署

### 前提条件

1. **安装 sshpass**（用于自动 SSH 登录）:
   ```bash
   # macOS
   brew install hudochenkov/sshpass/sshpass
   
   # Linux (Ubuntu/Debian)
   sudo apt-get install sshpass
   ```

2. **确保本地项目已构建前端**:
   ```bash
   cd frontend
   npm install
   npm run build
   cd ..
   ```

### 执行部署

```bash
# 给脚本添加执行权限（如果还没有）
chmod +x deploy.sh

# 运行部署脚本
./deploy.sh
```

脚本会自动完成所有部署步骤，包括：
- ✅ 检查本地文件
- ✅ 连接服务器
- ✅ 安装 Docker 和 Docker Compose（如果需要）
- ✅ 创建项目目录
- ✅ 上传项目文件
- ✅ 配置环境变量
- ✅ 构建和启动服务

### 部署完成后

访问地址：
- **前端网站**: http://101.200.222.115
- **管理后台**: http://101.200.222.115/admin
- **API 文档**: http://101.200.222.115/docs

## 手动部署（如果自动部署失败）

### 1. 连接服务器

```bash
ssh root@101.200.222.115
# 密码: Suantian51
```

### 2. 安装 Docker

```bash
curl -fsSL https://get.docker.com | sh
systemctl start docker
systemctl enable docker
```

### 3. 安装 Docker Compose

```bash
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

### 4. 创建项目目录

```bash
mkdir -p /opt/scavi
cd /opt/scavi
```

### 5. 上传项目文件

在**本地机器**上执行：

```bash
# 打包项目
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

在**服务器**上执行：

```bash
cd /opt/scavi
tar -xzf scavi.tar.gz
rm scavi.tar.gz
```

### 6. 创建环境变量文件

```bash
cat > .env << 'EOF'
DB_PASSWORD=suantian51
SECRET_KEY=$(openssl rand -hex 32)
ADMIN_USERNAME=SCAVI
ADMIN_PASSWORD=SCAVI123
OSS_TYPE=aliyun
ALIYUN_OSS_ACCESS_KEY_ID=your_access_key_id_here
ALIYUN_OSS_ACCESS_KEY_SECRET=your_access_key_secret_here
ALIYUN_OSS_ENDPOINT=oss-cn-beijing.aliyuncs.com
ALIYUN_OSS_BUCKET_NAME=scavi
OSS_PREFIX=uploads
EOF
```

### 7. 构建前端（如果还没有构建）

```bash
cd frontend
npm install
npm run build
cd ..
```

### 8. 启动服务

```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

### 9. 查看服务状态

```bash
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs -f
```

## 常用命令

```bash
# 查看服务状态
docker-compose -f docker-compose.prod.yml ps

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f

# 重启服务
docker-compose -f docker-compose.prod.yml restart

# 停止服务
docker-compose -f docker-compose.prod.yml down

# 更新部署
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
```

## 故障排查

### 无法访问网站

1. 检查防火墙：
   ```bash
   firewall-cmd --list-ports
   # 如果没有 80 端口，添加：
   firewall-cmd --permanent --add-port=80/tcp
   firewall-cmd --reload
   ```

2. 检查服务状态：
   ```bash
   docker-compose -f docker-compose.prod.yml ps
   ```

3. 查看日志：
   ```bash
   docker-compose -f docker-compose.prod.yml logs nginx
   ```

### 数据库连接失败

```bash
# 检查数据库容器
docker ps | grep mysql

# 查看数据库日志
docker logs scavi-mysql

# 测试数据库连接
docker exec scavi-mysql mysql -u root -psuantian51 -e "SHOW DATABASES;"
```

## 安全建议

1. **修改默认密码**（重要！）
2. **配置防火墙**，只开放必要端口
3. **定期备份数据库**
4. **配置 HTTPS**（使用 Let's Encrypt 免费证书）

