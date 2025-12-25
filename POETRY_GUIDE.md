# Poetry 依赖管理指南

## 📦 为什么使用 Poetry？

Poetry 是现代化的 Python 依赖管理工具，相比传统的 `requirements.txt`，它有以下优势：

1. **自动依赖解析**：自动处理依赖冲突和版本兼容性
2. **锁定文件**：`poetry.lock` 确保所有环境使用完全相同的依赖版本
3. **依赖分类**：可以区分生产依赖和开发依赖
4. **避免遗漏**：使用 `poetry add` 会自动更新配置文件，不会忘记添加依赖

## 🚀 快速开始

### 安装 Poetry

```bash
# macOS / Linux
curl -sSL https://install.python-poetry.org | python3 -

# 或使用 pip
pip install poetry
```

### 初始化项目（已完成）

项目已经配置了 `pyproject.toml`，你可以直接使用。

### 安装依赖

```bash
# 安装所有依赖（包括开发依赖）
poetry install

# 只安装生产依赖
poetry install --only=main
```

## 📝 日常使用

### 添加新依赖

当你需要使用一个新包时：

```bash
# 添加生产依赖
poetry add itsdangerous

# 添加开发依赖
poetry add --group dev pytest

# 添加带版本的依赖
poetry add fastapi==0.109.0

# 添加带额外功能的依赖
poetry add uvicorn[standard]
```

**重要**：添加依赖后，`pyproject.toml` 和 `poetry.lock` 会自动更新！

### 移除依赖

```bash
poetry remove package-name
```

### 更新依赖

```bash
# 更新所有依赖到最新兼容版本
poetry update

# 更新特定包
poetry update fastapi
```

### 查看依赖

```bash
# 查看依赖树
poetry show --tree

# 查看已安装的包
poetry show
```

## 🐳 Docker 集成

### 开发流程（推荐）

1. **添加新依赖时**：
   ```bash
   poetry add new-package
   ```

2. **立即测试**：
   ```bash
   docker-compose build
   docker-compose up
   ```
   
   如果构建失败，说明依赖有问题，可以立即修复。

3. **提交代码**：
   ```bash
   git add pyproject.toml poetry.lock
   git commit -m "Add new-package dependency"
   ```

### 从 Poetry 导出 requirements.txt（备用）

如果你需要 `requirements.txt`（比如某些 CI/CD 系统需要），可以导出：

```bash
# 导出生产依赖
poetry export -f requirements.txt --output requirements.txt --without-hashes

# 导出包含开发依赖
poetry export -f requirements.txt --output requirements-dev.txt --with dev --without-hashes
```

## 🔄 迁移检查清单

- [x] 创建 `pyproject.toml`
- [x] 更新 `Dockerfile` 使用 Poetry
- [x] 创建 `.dockerignore`
- [ ] 运行 `poetry install` 生成 `poetry.lock`
- [ ] 测试 Docker 构建：`docker-compose build`
- [ ] 测试应用运行：`docker-compose up`

## 💡 最佳实践

1. **总是提交 `poetry.lock`**：确保团队使用相同的依赖版本
2. **使用 `poetry add` 而不是手动编辑**：避免格式错误和遗漏
3. **定期更新**：`poetry update` 保持依赖最新
4. **Docker 优先开发**：添加依赖后立即在 Docker 中测试

## 🆘 常见问题

### Q: 如果忘记用 Poetry 添加依赖怎么办？

A: 在 Docker 构建时会报错，这是好事！立即运行：
```bash
poetry add missing-package
docker-compose build
```

### Q: 如何从 requirements.txt 迁移？

A: 项目已经迁移完成。如果以后需要从 requirements.txt 导入：
```bash
poetry add $(cat requirements.txt)
```

### Q: Poetry 和 pip 可以混用吗？

A: 不推荐。在 Poetry 项目中，应该始终使用 `poetry add` 和 `poetry install`。

## 📚 更多资源

- [Poetry 官方文档](https://python-poetry.org/docs/)
- [Poetry CLI 命令参考](https://python-poetry.org/docs/cli/)

