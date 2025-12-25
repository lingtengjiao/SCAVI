"""数据库初始化模块"""
import bcrypt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import async_session_maker
from app.core.config import ADMIN_USERNAME, ADMIN_PASSWORD
from app.models.admin import Admin
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


async def init_default_admin():
    """初始化默认管理员账户（如果不存在）"""
    async with async_session_maker() as session:
        try:
            # 检查管理员是否已存在
            result = await session.execute(
                select(Admin).where(Admin.username == ADMIN_USERNAME)
            )
            existing_admin = result.scalar_one_or_none()
            
            if existing_admin:
                print(f"✅ 管理员账户 '{ADMIN_USERNAME}' 已存在，跳过创建")
                logger.info(f"管理员账户 '{ADMIN_USERNAME}' 已存在，跳过创建")
                return
            
            # 创建默认管理员
            password_hash = bcrypt.hashpw(
                ADMIN_PASSWORD.encode('utf-8'),
                bcrypt.gensalt()
            ).decode('utf-8')
            
            admin = Admin(
                username=ADMIN_USERNAME,
                password_hash=password_hash,
                email=None,
                is_active=True,
                is_superuser=True,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            session.add(admin)
            await session.commit()
            
            print(f"✅ 默认管理员账户 '{ADMIN_USERNAME}' 创建成功")
            print(f"   用户名: {ADMIN_USERNAME}")
            print(f"   密码: {ADMIN_PASSWORD}")
            print(f"   访问地址: http://localhost:8000/admin/login")
            logger.info(f"默认管理员账户 '{ADMIN_USERNAME}' 创建成功")
            
        except Exception as e:
            print(f"❌ 创建默认管理员账户失败: {str(e)}")
            logger.error(f"创建默认管理员账户失败: {str(e)}", exc_info=True)
            await session.rollback()
            # 不抛出异常，避免影响应用启动

