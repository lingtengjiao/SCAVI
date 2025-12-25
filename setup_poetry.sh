#!/bin/bash
# Poetry 初始化脚本

echo "🚀 初始化 Poetry 环境..."

# 检查 Poetry 是否已安装
if ! command -v poetry &> /dev/null; then
    echo "❌ Poetry 未安装，正在安装..."
    curl -sSL https://install.python-poetry.org | python3 -
    export PATH="$HOME/.local/bin:$PATH"
fi

echo "✅ Poetry 已安装"

# 安装依赖并生成 lock 文件
echo "📦 安装依赖并生成 poetry.lock..."
poetry install

echo "✅ 完成！"
echo ""
echo "💡 下一步："
echo "   1. 检查生成的 poetry.lock 文件"
echo "   2. 运行 docker-compose build 测试 Docker 构建"
echo "   3. 提交 pyproject.toml 和 poetry.lock 到 Git"

