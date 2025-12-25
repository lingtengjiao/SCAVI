#!/bin/bash
# 启动脚本：同时运行后端和前端监听

# 检查前端目录是否存在
if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
    # 检查前端依赖是否已安装
    if [ ! -d "frontend/node_modules" ]; then
        echo "📦 前端依赖未安装，正在安装..."
        cd frontend && npm install && cd ..
    fi
    
    # 启动前端文件监听（后台运行，输出到日志）
    echo "🔄 启动前端文件监听..."
    python watch_frontend.py > /proc/1/fd/1 2>&1 &
    WATCH_PID=$!
    
    # 等待一下，确保监听启动
    sleep 2
    echo "✅ 前端监听已启动 (PID: $WATCH_PID)"
else
    echo "⚠️  前端目录不存在，跳过前端监听"
    WATCH_PID=""
fi

# 启动 FastAPI 应用
echo "🚀 启动 FastAPI 应用..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 清理：当 uvicorn 退出时，也停止监听进程
if [ -n "$WATCH_PID" ]; then
    trap "kill $WATCH_PID 2>/dev/null" EXIT
fi

