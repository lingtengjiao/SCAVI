# 使用 Python 3.10-slim 作为基础镜像
FROM python:3.10-slim

# 设置工作目录
WORKDIR /app

# 更换 Debian 软件源为阿里云镜像（针对国内服务器加速）
RUN sed -i 's/deb.debian.org/mirrors.aliyun.com/g' /etc/apt/sources.list.d/debian.sources || \
    sed -i 's/deb.debian.org/mirrors.aliyun.com/g' /etc/apt/sources.list || true

# 安装系统依赖（MySQL 客户端库、Poetry、Node.js 等）
RUN apt-get update && apt-get install -y \
    gcc \
    default-libmysqlclient-dev \
    pkg-config \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# 安装 Poetry（使用官方安装脚本）
RUN pip install --no-cache-dir poetry==1.7.1

# 配置 Poetry：不使用虚拟环境（因为 Docker 容器本身就是隔离的）
RUN poetry config virtualenvs.create false

# 复制 Poetry 配置文件
COPY pyproject.toml poetry.lock* ./

# 安装 Python 依赖（使用 Poetry）
# 如果 poetry.lock 不存在，先生成 lock 文件再安装
RUN if [ ! -f poetry.lock ]; then \
        echo "⚠️  poetry.lock 不存在，正在生成..." && \
        poetry lock --no-update; \
    fi && \
    poetry install --no-interaction --no-ansi --no-root

# 复制应用代码
COPY . .

# 安装前端依赖（如果 frontend 目录存在）
RUN if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then \
        echo "📦 安装前端依赖..." && \
        cd frontend && \
        npm install && \
        cd ..; \
    fi

# 暴露端口
EXPOSE 8000

# 使用启动脚本（支持前端热重载）
CMD ["./start.sh"]

