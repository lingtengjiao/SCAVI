#!/usr/bin/env python3
"""
数据库迁移脚本 - 更新表结构以匹配前端数据结构
运行此脚本会删除旧表并创建新表（注意：会丢失数据！）
"""
import asyncio
from app.core.database import engine
from app.models.base import Base
from app.models.catalog import Category, Product, Tag
from app.models.content import HeroSlide
from app.models.admin import Admin

async def migrate():
    """迁移数据库表结构"""
    print("🔄 开始数据库迁移...")
    print("⚠️  警告：这将删除所有现有表并重新创建（会丢失数据）")
    
    async with engine.begin() as conn:
        # 删除所有表
        print("\n📋 删除旧表...")
        await conn.run_sync(Base.metadata.drop_all)
        print("✅ 旧表已删除")
        
        # 创建新表
        print("\n📋 创建新表...")
        await conn.run_sync(Base.metadata.create_all)
        print("✅ 新表已创建")
        
        print("\n📊 表结构：")
        print("  - categories (分类表)")
        print("  - products (产品表，包含 order 字段)")
        print("  - tags (标签表)")
        print("  - product_tags (产品-标签关联表)")
        print("  - hero_slides (轮播图表，包含 text_color 字段)")
        print("  - admins (管理员账户表)")
        
    print("\n✅ 数据库迁移完成！")
    print("\n💡 提示：现在可以通过管理后台 (http://localhost:8000/admin) 添加数据")

if __name__ == "__main__":
    asyncio.run(migrate())

