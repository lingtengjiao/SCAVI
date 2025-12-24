#!/bin/bash

# 构建脚本 - 构建前端并准备运行后端

echo "🚀 开始构建前端..."

# 进入前端目录
cd frontend

# 检查 node_modules 是否存在
if [ ! -d "node_modules" ]; then
    echo "📦 安装前端依赖..."
    if command -v pnpm &> /dev/null; then
        pnpm install
    elif command -v npm &> /dev/null; then
        npm install
    else
        echo "❌ 错误: 未找到 npm 或 pnpm，请先安装 Node.js"
        exit 1
    fi
fi

# 构建前端
echo "🔨 构建前端应用..."
if command -v pnpm &> /dev/null; then
    pnpm build
else
    npm run build
fi

# 返回项目根目录
cd ..

echo "✅ 构建完成！"
echo ""
echo "现在可以运行后端："
echo "  uvicorn app.main:app --reload"
echo ""
echo "或者使用 Python:"
echo "  python -m uvicorn app.main:app --reload"

