#!/bin/bash
# 服务器首次初始化脚本
# 使用方法：在服务器上以 root 身份运行此脚本
# 注意：此脚本只需在第一次部署时运行一次

set -e

REPO_URL="https://github.com/lingtengjiao/SCAVI.git"
DEPLOY_DIR="/opt/scavi"

echo "=============================="
echo "  SCAVI 服务器初始化脚本"
echo "=============================="

# 1. 安装 Docker
if ! command -v docker &> /dev/null; then
    echo "==> 安装 Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    echo "✅ Docker 安装完成"
else
    echo "✅ Docker 已安装: $(docker --version)"
fi

# 2. 安装 Docker Compose Plugin（v2）
if ! docker compose version &> /dev/null; then
    echo "==> 安装 Docker Compose..."
    apt-get update -qq && apt-get install -y docker-compose-plugin
    echo "✅ Docker Compose 安装完成"
else
    echo "✅ Docker Compose 已安装: $(docker compose version)"
fi

# 3. 安装 Git 和 Node.js 20
if ! command -v git &> /dev/null; then
    echo "==> 安装 Git..."
    apt-get update -qq && apt-get install -y git
fi

if ! command -v node &> /dev/null; then
    echo "==> 安装 Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    echo "✅ Node.js 安装完成: $(node -v)"
else
    echo "✅ Node.js 已安装: $(node -v)"
fi

# 4. 克隆仓库
if [ ! -d "$DEPLOY_DIR" ]; then
    echo "==> 克隆仓库到 $DEPLOY_DIR..."
    mkdir -p "$(dirname $DEPLOY_DIR)"
    git clone "$REPO_URL" "$DEPLOY_DIR"
else
    echo "✅ 仓库已存在，执行 git pull..."
    cd "$DEPLOY_DIR" && git pull origin main
fi

cd "$DEPLOY_DIR"

# 5. 创建 .env 文件
if [ ! -f ".env" ]; then
    echo ""
    echo "==> 创建 .env 文件..."
    echo "⚠️  请手动编辑 .env 文件填入真实配置："
    cp .env.example .env
    echo ""
    echo "  需要填写的关键配置："
    echo "  - DB_PASSWORD       数据库密码"
    echo "  - SECRET_KEY        应用密钥（随机字符串）"
    echo "  - ADMIN_USERNAME    管理员账号"
    echo "  - ADMIN_PASSWORD    管理员密码"
    echo "  - 阿里云 OSS 相关配置（如使用）"
    echo ""
    echo "  运行以下命令编辑："
    echo "    nano /opt/scavi/.env"
    echo ""
    read -p "是否现在编辑 .env？(y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        nano .env
    fi
else
    echo "✅ .env 文件已存在"
fi

# 6. 构建前端
echo "==> 构建前端..."
cd frontend
npm install
npm run build
cd ..

# 7. 创建 uploads 目录
mkdir -p static/uploads

# 8. 启动服务
echo "==> 启动 Docker 服务..."
docker compose -f docker-compose.prod.yml up -d --build

echo ""
echo "==> 等待服务启动（30秒）..."
sleep 30

# 9. 健康检查
echo "==> 健康检查..."
docker compose -f docker-compose.prod.yml ps

if curl -sf http://localhost/health; then
    echo ""
    echo "=============================="
    echo "  ✅ 服务器初始化完成！"
    echo "=============================="
    echo ""
    echo "  访问地址："
    echo "  - 网站首页：http://$(curl -s ifconfig.me)"
    echo "  - API 文档：http://$(curl -s ifconfig.me)/docs"
    echo "  - 管理后台：http://$(curl -s ifconfig.me)/admin"
    echo ""
    echo "  后续通过 git push 到 main 分支即可自动部署"
else
    echo ""
    echo "  ⚠️  健康检查失败，请查看日志："
    echo "    docker compose -f /opt/scavi/docker-compose.prod.yml logs"
fi
