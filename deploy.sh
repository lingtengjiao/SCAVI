#!/bin/bash
# SCAVI 项目部署脚本
# 使用方法: ./deploy.sh [服务器IP] [用户名]

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置
SERVER_IP="${1:-101.200.222.115}"
SERVER_USER="${2:-root}"
SERVER_PASSWORD="${3:-Suantian51}"
PROJECT_NAME="SCAVI"
REMOTE_DIR="/opt/scavi"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  SCAVI 项目部署脚本${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "服务器: ${YELLOW}${SERVER_USER}@${SERVER_IP}${NC}"
echo -e "项目目录: ${YELLOW}${REMOTE_DIR}${NC}"
echo ""

# 检查本地是否有必要的文件
echo -e "${YELLOW}[1/8] 检查本地文件...${NC}"
if [ ! -f "docker-compose.prod.yml" ]; then
    echo -e "${RED}错误: docker-compose.prod.yml 不存在${NC}"
    exit 1
fi
if [ ! -f "Dockerfile" ]; then
    echo -e "${RED}错误: Dockerfile 不存在${NC}"
    exit 1
fi
echo -e "${GREEN}✓ 本地文件检查完成${NC}"

# 检查 SSH 连接
echo -e "${YELLOW}[2/8] 检查服务器连接...${NC}"
if ! sshpass -p "${SERVER_PASSWORD}" ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} "echo '连接成功'" 2>/dev/null; then
    echo -e "${RED}错误: 无法连接到服务器${NC}"
    echo -e "${YELLOW}提示: 请确保已安装 sshpass: brew install hudochenkov/sshpass/sshpass${NC}"
    exit 1
fi
echo -e "${GREEN}✓ 服务器连接成功${NC}"

# 在服务器上创建项目目录
echo -e "${YELLOW}[3/8] 创建服务器目录...${NC}"
sshpass -p "${SERVER_PASSWORD}" ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
    mkdir -p /opt/scavi
    mkdir -p /opt/scavi/mysql-data
    mkdir -p /opt/scavi/static/uploads
    mkdir -p /opt/scavi/nginx
ENDSSH
echo -e "${GREEN}✓ 目录创建完成${NC}"

# 检查服务器上的 Docker 和 Docker Compose
echo -e "${YELLOW}[4/8] 检查服务器环境...${NC}"
sshpass -p "${SERVER_PASSWORD}" ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
    if ! command -v docker &> /dev/null; then
        echo "安装 Docker..."
        curl -fsSL https://get.docker.com | sh
        systemctl start docker
        systemctl enable docker
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        echo "安装 Docker Compose..."
        curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
    fi
ENDSSH
echo -e "${GREEN}✓ 环境检查完成${NC}"

# 打包项目文件（排除不需要的文件）
echo -e "${YELLOW}[5/8] 打包项目文件...${NC}"
TEMP_TAR=$(mktemp)
tar --exclude='.git' \
    --exclude='node_modules' \
    --exclude='__pycache__' \
    --exclude='*.pyc' \
    --exclude='.DS_Store' \
    --exclude='mysql-data' \
    --exclude='.env' \
    -czf "${TEMP_TAR}" .
echo -e "${GREEN}✓ 文件打包完成${NC}"

# 上传文件到服务器
echo -e "${YELLOW}[6/8] 上传文件到服务器...${NC}"
sshpass -p "${SERVER_PASSWORD}" scp -o StrictHostKeyChecking=no "${TEMP_TAR}" ${SERVER_USER}@${SERVER_IP}:${REMOTE_DIR}/project.tar.gz
rm "${TEMP_TAR}"
echo -e "${GREEN}✓ 文件上传完成${NC}"

# 在服务器上解压和部署
echo -e "${YELLOW}[7/8] 在服务器上部署...${NC}"
sshpass -p "${SERVER_PASSWORD}" ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_IP} << ENDSSH
    cd ${REMOTE_DIR}
    
    # 解压文件
    tar -xzf project.tar.gz
    rm project.tar.gz
    
    # 确保 .env 文件存在
    if [ ! -f .env ]; then
        echo "创建 .env 文件..."
        cat > .env << 'ENVEOF'
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
ENVEOF
    fi
    
    # 构建前端（如果还没有构建）
    if [ ! -d "static/assets" ]; then
        echo "构建前端..."
        cd frontend
        npm install
        npm run build
        cd ..
    fi
    
    # 停止旧容器（如果存在）
    docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
    
    # 启动服务
    echo "启动服务..."
    docker-compose -f docker-compose.prod.yml up -d --build
    
    # 等待服务启动
    sleep 10
    
    # 检查服务状态
    docker-compose -f docker-compose.prod.yml ps
ENDSSH
echo -e "${GREEN}✓ 部署完成${NC}"

# 显示部署信息
echo -e "${YELLOW}[8/8] 部署信息${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}部署成功！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "访问地址:"
echo -e "  - 前端网站: ${YELLOW}http://${SERVER_IP}${NC}"
echo -e "  - 管理后台: ${YELLOW}http://${SERVER_IP}/admin${NC}"
echo -e "  - API 文档: ${YELLOW}http://${SERVER_IP}/docs${NC}"
echo ""
echo -e "服务器管理命令:"
echo -e "  ${YELLOW}ssh ${SERVER_USER}@${SERVER_IP}${NC}"
echo -e "  ${YELLOW}cd ${REMOTE_DIR}${NC}"
echo -e "  ${YELLOW}docker-compose -f docker-compose.prod.yml logs -f${NC}  # 查看日志"
echo -e "  ${YELLOW}docker-compose -f docker-compose.prod.yml restart${NC}   # 重启服务"
echo -e "  ${YELLOW}docker-compose -f docker-compose.prod.yml down${NC}      # 停止服务"
echo ""

