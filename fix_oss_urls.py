#!/usr/bin/env python3
"""修复数据库中错误的 OSS URL（移除多余的 /uploads/ 前缀）"""
import sys
import asyncio
from pathlib import Path

# 添加项目路径
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import select
from app.core.database import async_session_maker
from app.models.catalog import Product
from app.models.content import HeroSlide

async def fix_product_urls():
    """修复产品表中的错误 URL"""
    async with async_session_maker() as session:
        # 获取所有产品
        result = await session.execute(select(Product))
        products = result.scalars().all()
        
        fixed_count = 0
        for product in products:
            updated = False
            
            # 修复 images 数组
            if product.images:
                fixed_images = []
                for img_url in product.images:
                    # 如果 URL 以 /uploads/https:// 或 /uploads/http:// 开头，移除 /uploads/ 前缀
                    if img_url.startswith('/uploads/https://') or img_url.startswith('/uploads/http://'):
                        fixed_url = img_url.replace('/uploads/', '', 1)
                        fixed_images.append(fixed_url)
                        print(f"  修复图片 URL: {img_url} -> {fixed_url}")
                        updated = True
                    else:
                        fixed_images.append(img_url)
                if updated:
                    product.images = fixed_images
            
            # 修复 video 字段
            if product.video:
                if product.video.startswith('/uploads/https://') or product.video.startswith('/uploads/http://'):
                    product.video = product.video.replace('/uploads/', '', 1)
                    print(f"  修复视频 URL: {product.video}")
                    updated = True
            
            if updated:
                fixed_count += 1
                print(f"✅ 修复产品 ID={product.id}: {product.name}")
        
        if fixed_count > 0:
            await session.commit()
            print(f"\n✅ 共修复 {fixed_count} 个产品的 URL")
        else:
            print("\n✅ 没有需要修复的产品 URL")

async def fix_slide_urls():
    """修复轮播图表中的错误 URL"""
    async with async_session_maker() as session:
        # 获取所有轮播图
        result = await session.execute(select(HeroSlide))
        slides = result.scalars().all()
        
        fixed_count = 0
        for slide in slides:
            if slide.image:
                if slide.image.startswith('/uploads/https://') or slide.image.startswith('/uploads/http://'):
                    old_url = slide.image
                    slide.image = slide.image.replace('/uploads/', '', 1)
                    print(f"✅ 修复轮播图 ID={slide.id}: {old_url} -> {slide.image}")
                    fixed_count += 1
        
        if fixed_count > 0:
            await session.commit()
            print(f"\n✅ 共修复 {fixed_count} 个轮播图的 URL")
        else:
            print("\n✅ 没有需要修复的轮播图 URL")

async def main():
    """主函数"""
    print("=" * 60)
    print("开始修复数据库中的错误 OSS URL")
    print("=" * 60)
    
    print("\n1. 修复产品表...")
    await fix_product_urls()
    
    print("\n2. 修复轮播图表...")
    await fix_slide_urls()
    
    print("\n" + "=" * 60)
    print("修复完成！")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())

