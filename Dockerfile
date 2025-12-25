# 使用 Python 3.10-slim 作为基础镜像
FROM python:3.10-slim

# 设置工作目录
WORKDIR /app

# 安装系统依赖（MySQL 客户端库、Poetry 等）
RUN apt-get update && apt-get install -y \
    gcc \
    default-libmysqlclient-dev \
    pkg-config \
    curl \
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

# 暴露端口
EXPOSE 8000

# 启动命令（使用 uvicorn 的 reload 模式支持热重载）
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

