"""管理员认证 API"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.requests import Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
import bcrypt
from datetime import datetime
from app.core.database import get_db
from app.models.admin import Admin

router = APIRouter(prefix="/api/auth", tags=["认证"])

security = HTTPBearer(auto_error=False)


# ==================== Pydantic Schemas ====================
class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    success: bool
    message: str
    admin_id: Optional[int] = None
    username: Optional[str] = None


class AdminInfo(BaseModel):
    id: int
    username: str
    email: Optional[str]
    is_superuser: bool
    
    class Config:
        from_attributes = True


# ==================== 认证依赖 ====================
async def get_current_admin(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> Admin:
    """获取当前登录的管理员"""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="未提供认证信息"
        )
    
    # 这里可以使用 JWT token，暂时使用简单的 session 方式
    # 实际应该从 token 中解析 admin_id
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="请使用 session 认证"
    )


# ==================== API Endpoints ====================
@router.post("/login", response_model=LoginResponse)
async def login(
    login_data: LoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """管理员登录"""
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"登录请求: username={login_data.username}")
    
    if not login_data.username or not login_data.password:
        logger.warning("登录失败: 用户名或密码为空")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="用户名和密码不能为空"
        )
    
    # 查询管理员
    result = await db.execute(
        select(Admin).where(Admin.username == login_data.username)
    )
    admin = result.scalar_one_or_none()
    
    if not admin:
        logger.warning(f"登录失败: 用户不存在 username={login_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误"
        )
    
    logger.info(f"找到管理员: id={admin.id}, is_active={admin.is_active}")
    
    if not admin.is_active:
        logger.warning(f"登录失败: 账户已被禁用 username={login_data.username}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="账户已被禁用"
        )
    
    # 验证密码
    try:
        logger.info("开始验证密码...")
        password_valid = bcrypt.checkpw(
            login_data.password.encode('utf-8'),
            admin.password_hash.encode('utf-8')
        )
        logger.info(f"密码验证结果: {password_valid}")
    except Exception as e:
        logger.error(f"密码验证异常: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="密码验证失败"
        )
    
    if not password_valid:
        logger.warning(f"登录失败: 密码错误 username={login_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码错误"
        )
    
    # 更新最后登录时间
    admin.last_login = datetime.utcnow()
    await db.commit()
    
    # 设置 session
    request.session["admin_id"] = admin.id
    request.session["admin_username"] = admin.username
    request.session["authenticated"] = True
    
    logger.info(f"登录成功: admin_id={admin.id}, username={admin.username}")
    logger.info(f"Session 设置: admin_id={request.session.get('admin_id')}")
    
    return LoginResponse(
        success=True,
        message="登录成功",
        admin_id=admin.id,
        username=admin.username
    )


@router.get("/me", response_model=AdminInfo)
async def get_current_user_info(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """获取当前用户信息（需要认证）"""
    admin_id = request.session.get("admin_id")
    
    if not admin_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="请先登录"
        )
    
    result = await db.execute(
        select(Admin).where(Admin.id == admin_id, Admin.is_active == True)
    )
    admin = result.scalar_one_or_none()
    
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="管理员不存在或已被禁用"
        )
    
    return AdminInfo(
        id=admin.id,
        username=admin.username,
        email=admin.email,
        is_superuser=admin.is_superuser
    )


@router.post("/logout")
async def logout(request: Request):
    """登出"""
    request.session.clear()
    return {"success": True, "message": "已登出"}

