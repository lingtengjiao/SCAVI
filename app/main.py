"""FastAPI 应用入口"""
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware
from pathlib import Path
import os
from app.core.config import SECRET_KEY
from app.core.database import engine
from app.models.base import Base
from app.api.routes import router
from app.api.auth import router as auth_router
from app.api.admin import router as admin_router
from app.api.proxy import router as proxy_router

# ==================== FastAPI App ====================
app = FastAPI(
    title="SCAVI CMS API",
    description="B2B 产品展示系统 - 纯展示型 CMS",
    version="2.0.0"
)

# 添加 Session 中间件（前端管理后台认证需要）
app.add_middleware(SessionMiddleware, secret_key=SECRET_KEY)

# ==================== API 路由 ====================
app.include_router(router)  # 公开 API（只读）
app.include_router(auth_router)  # 认证 API
app.include_router(admin_router)  # 管理后台 API（需要认证）
app.include_router(proxy_router)  # OSS 文件代理（解决 CORS 问题）

# ==================== 静态文件服务 ====================
# 静态文件目录路径
static_dir = Path(__file__).parent.parent / "static"
assets_dir = static_dir / "assets"

# 如果静态文件目录存在，挂载静态文件
if static_dir.exists():
    # 挂载静态资源（JS、CSS、图片等）
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")
    
    # 挂载上传文件目录
    upload_dir = static_dir / "uploads"
    upload_dir.mkdir(parents=True, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=str(upload_dir)), name="uploads")
    
    # SPA 路由处理：所有非 API 和管理后台的路由都返回 index.html
    @app.get("/", response_class=FileResponse)
    async def serve_index():
        """首页 - 返回前端 index.html"""
        index_path = static_dir / "index.html"
        if index_path.exists():
            return FileResponse(str(index_path))
        else:
            raise HTTPException(status_code=404, detail="Frontend not built. Please run 'npm run build' in the frontend directory.")
    
    @app.get("/{full_path:path}")
    async def serve_spa(request: Request, full_path: str):
        """SPA 路由处理 - 所有前端路由都返回 index.html"""
        # 排除 API 路由和文档路由
        if (full_path.startswith("api/") or 
            full_path.startswith("docs") or 
            full_path.startswith("openapi.json")):
            raise HTTPException(status_code=404, detail="Not found")
        
        # 如果是静态资源文件，尝试直接返回
        if full_path.startswith("assets/"):
            file_path = static_dir / full_path
            if file_path.exists() and file_path.is_file():
                return FileResponse(str(file_path))
        
        # 其他所有路由都返回 index.html（SPA 路由）
        index_path = static_dir / "index.html"
        if index_path.exists():
            return FileResponse(str(index_path))
        else:
            raise HTTPException(status_code=404, detail="Frontend not built. Please run 'npm run build' in the frontend directory.")
else:
    # 如果静态文件目录不存在，提供一个提示页面
    @app.get("/", response_class=HTMLResponse)
    async def root():
        """首页 - 提示构建前端"""
        return """
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SCAVI CMS</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }
            .container {
                background: white;
                border-radius: 16px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                padding: 40px;
                max-width: 600px;
                width: 100%;
                text-align: center;
            }
            h1 { color: #333; margin-bottom: 10px; font-size: 32px; }
            .subtitle { color: #666; margin-bottom: 40px; font-size: 16px; }
                .warning { 
                    background: #fff3cd; 
                    border: 1px solid #ffc107; 
                    border-radius: 8px; 
                    padding: 20px; 
                    margin-bottom: 20px; 
                    color: #856404;
                }
            .links { display: flex; flex-direction: column; gap: 16px; }
            .link {
                display: block;
                padding: 16px 24px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                text-decoration: none;
                border-radius: 8px;
                font-size: 18px;
                font-weight: 500;
                transition: transform 0.2s, box-shadow 0.2s;
            }
            .link:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
            }
            .link.secondary {
                background: #f5f5f5;
                color: #333;
            }
            .link.secondary:hover {
                background: #e8e8e8;
                box-shadow: 0 8px 20px rgba(0,0,0,0.1);
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🚀 SCAVI CMS</h1>
                <p class="subtitle">FastAPI 内容管理系统</p>
                <div class="warning">
                    <strong>⚠️ 前端未构建</strong><br>
                    请在前端目录运行 <code>npm run build</code> 来构建前端应用
                </div>
            <div class="links">
                    <a href="/admin/dashboard" class="link">进入管理后台</a>
                <a href="/docs" class="link secondary">查看 API 文档</a>
            </div>
        </div>
    </body>
    </html>
    """


# ==================== 启动事件 ====================
@app.on_event("startup")
async def startup():
    """启动时创建数据库表"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ 数据库表已创建")


@app.on_event("shutdown")
async def shutdown():
    """关闭时清理"""
    await engine.dispose()
    print("✅ 数据库连接已关闭")

