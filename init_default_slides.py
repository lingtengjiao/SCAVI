"""
初始化默认轮播图到数据库
"""
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import async_session_maker
from app.models.content import HeroSlide

# 默认轮播图配置
DEFAULT_SLIDES = [
    {
        "title": "SCAVI",
        "subtitle": "Professional Lingerie Manufacturer",
        "image": "https://images.unsplash.com/photo-1741635622077-db2a3ee14a73?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHdlYXJpbmclMjBzaWxrJTIwcm9iZSUyMGx1eHVyeXxlbnwxfHx8fDE3NjU2MDU3ODV8MA&ixlib=rb-4.1.0&q=80&w=1080",
        "description": "Defining elegance through OEM/ODM excellence and customized design.",
        "link": "#factory-contact",
        "button_text": "Partner With Us",
        "text_color": "white",
        "order": 1,
        "is_active": True,
    },
    {
        "title": "Exquisite Craftsmanship",
        "subtitle": "Detailed to Perfection",
        "image": "https://images.unsplash.com/photo-1707280133212-53c57117fe5c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwbHV4dXJ5JTIwbGluZ2VyaWUlMjBsYWNlJTIwZGV0YWlsfGVufDF8fHx8MTc2NTYwNTc4Nnww&ixlib=rb-4.1.0&q=80&w=1080",
        "description": "Premium materials and intricate lace details for the modern brand.",
        "link": "#products",
        "button_text": "View Products",
        "text_color": "white",
        "order": 2,
        "is_active": True,
    },
    {
        "title": "Global Standards",
        "subtitle": "Export Ready",
        "image": "https://images.unsplash.com/photo-1549488350-a9202534f595?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHwld2hpdGUlMjBsaW5nZXJpZSUyMHdlZGRpbmd8ZW58MXx8fHwxNzY1NjA2MDAwfDA&ixlib=rb-4.1.0&q=80&w=1080",
        "description": "Meeting international quality standards with sustainable production.",
        "link": "#factory-contact",
        "button_text": "Learn More",
        "text_color": "white",
        "order": 3,
        "is_active": True,
    },
]


async def init_default_slides():
    """初始化默认轮播图"""
    async with async_session_maker() as session:
        created_count = 0
        updated_count = 0
        
        for slide_data in DEFAULT_SLIDES:
            # 检查轮播图是否已存在（通过 title 和 order）
            result = await session.execute(
                select(HeroSlide).where(
                    HeroSlide.title == slide_data["title"],
                    HeroSlide.order == slide_data["order"]
                )
            )
            existing_slide = result.scalar_one_or_none()
            
            if existing_slide:
                # 更新现有轮播图
                existing_slide.subtitle = slide_data["subtitle"]
                existing_slide.image = slide_data["image"]
                existing_slide.description = slide_data["description"]
                existing_slide.link = slide_data["link"]
                existing_slide.button_text = slide_data["button_text"]
                existing_slide.text_color = slide_data["text_color"]
                existing_slide.is_active = slide_data["is_active"]
                updated_count += 1
                print(f"✅ 更新轮播图: {slide_data['title']}")
            else:
                # 创建新轮播图
                new_slide = HeroSlide(
                    title=slide_data["title"],
                    subtitle=slide_data["subtitle"],
                    image=slide_data["image"],
                    description=slide_data["description"],
                    link=slide_data["link"],
                    button_text=slide_data["button_text"],
                    text_color=slide_data["text_color"],
                    order=slide_data["order"],
                    is_active=slide_data["is_active"],
                )
                session.add(new_slide)
                created_count += 1
                print(f"✅ 创建轮播图: {slide_data['title']}")
        
        await session.commit()
        
        print(f"\n📊 统计:")
        print(f"  - 创建: {created_count} 个轮播图")
        print(f"  - 更新: {updated_count} 个轮播图")
        print(f"  - 总计: {len(DEFAULT_SLIDES)} 个轮播图")


if __name__ == "__main__":
    print("🖼️  初始化默认轮播图...")
    print("=" * 50)
    asyncio.run(init_default_slides())
    print("=" * 50)
    print("✅ 默认轮播图初始化完成！")

