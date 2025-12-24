#!/usr/bin/env python3
"""
创建初始管理员账号
"""
import asyncio
import bcrypt
from app.core.database import async_session_maker
from app.models.admin import Admin
from datetime import datetime


async def create_admin(username: str, password: str, email: str = None, is_superuser: bool = True):
    """创建管理员账号"""
    async with async_session_maker() as session:
        # 检查用户名是否已存在
        from sqlalchemy import select
        result = await session.execute(select(Admin).where(Admin.username == username))
        existing_admin = result.scalar_one_or_none()
        
        if existing_admin:
            print(f"❌ 管理员 '{username}' 已存在")
            return False
        
        # 加密密码
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # 创建管理员
        admin = Admin(
            username=username,
            password_hash=password_hash,
            email=email,
            is_active=True,
            is_superuser=is_superuser,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        session.add(admin)
        await session.commit()
        
        print(f"✅ 管理员 '{username}' 创建成功！")
        print(f"   用户名: {username}")
        print(f"   邮箱: {email or '未设置'}")
        print(f"   超级管理员: {'是' if is_superuser else '否'}")
        return True


async def main():
    """主函数"""
    print("🔐 创建管理员账号\n")
    
    # 创建默认管理员
    await create_admin(
        username="SCAVI",
        password="SCAVI123",
        email=None,
        is_superuser=True
    )
    
    print("\n💡 提示：")
    print("   - 访问管理后台: http://localhost:8000/admin")
    print("   - 用户名: SCAVI")
    print("   - 密码: SCAVI123")


if __name__ == "__main__":
    asyncio.run(main())

