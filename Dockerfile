# 前端构建阶段：Node 只存在于构建镜像中
FROM node:20-bookworm-slim AS frontend-builder

WORKDIR /app

COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

COPY frontend ./frontend
RUN cd frontend && npm run build


# 后端运行阶段：只保留 Python 运行环境和已构建的前端产物
FROM python:3.10-slim

WORKDIR /app

RUN sed -i 's/deb.debian.org/mirrors.aliyun.com/g' /etc/apt/sources.list.d/debian.sources || \
    sed -i 's/deb.debian.org/mirrors.aliyun.com/g' /etc/apt/sources.list || true

RUN apt-get update && apt-get install -y \
    gcc \
    default-libmysqlclient-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir poetry==1.7.1

RUN poetry config virtualenvs.create false

COPY pyproject.toml poetry.lock* ./

RUN if [ ! -f poetry.lock ]; then \
        echo "⚠️  poetry.lock 不存在，正在生成..." && \
        poetry lock --no-update; \
    fi && \
    poetry install --no-interaction --no-ansi --no-root

COPY . .

# 使用构建阶段生成的 static，避免依赖服务器宿主机 Node.js
COPY --from=frontend-builder /app/static ./static

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

