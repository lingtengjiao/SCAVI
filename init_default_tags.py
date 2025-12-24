"""
初始化默认标签到数据库
"""
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import async_session_maker
from app.models.catalog import Tag

# 默认标签配置
DEFAULT_TAGS = [
    {
        "name": "New Arrival",
        "color": "#10b981",  # 绿色
        "order": 1,
        "is_active": True,
    },
    {
        "name": "Bestseller",
        "color": "#f59e0b",  # 橙色
        "order": 2,
        "is_active": True,
    },
    {
        "name": "Limited Edition",
        "color": "#ef4444",  # 红色
        "order": 3,
        "is_active": True,
    },
    {
        "name": "Sustainable",
        "color": "#06b6d4",  # 青色
        "order": 4,
        "is_active": True,
    },
    {
        "name": "Sale",
        "color": "#8b5cf6",  # 紫色
        "order": 5,
        "is_active": True,
    },
]


async def init_default_tags():
    """初始化默认标签"""
    async with async_session_maker() as session:
        created_count = 0
        updated_count = 0
        
        for tag_data in DEFAULT_TAGS:
            # 检查标签是否已存在
            result = await session.execute(
                select(Tag).where(Tag.name == tag_data["name"])
            )
            existing_tag = result.scalar_one_or_none()
            
            if existing_tag:
                # 更新现有标签
                existing_tag.color = tag_data["color"]
                existing_tag.order = tag_data["order"]
                existing_tag.is_active = tag_data["is_active"]
                updated_count += 1
                print(f"✅ 更新标签: {tag_data['name']}")
            else:
                # 创建新标签
                new_tag = Tag(
                    name=tag_data["name"],
                    color=tag_data["color"],
                    order=tag_data["order"],
                    is_active=tag_data["is_active"],
                )
                session.add(new_tag)
                created_count += 1
                print(f"✅ 创建标签: {tag_data['name']}")
        
        await session.commit()
        
        print(f"\n📊 统计:")
        print(f"  - 创建: {created_count} 个标签")
        print(f"  - 更新: {updated_count} 个标签")
        print(f"  - 总计: {len(DEFAULT_TAGS)} 个标签")


if __name__ == "__main__":
    print("🏷️  初始化默认标签...")
    print("=" * 50)
    asyncio.run(init_default_tags())
    print("=" * 50)
    print("✅ 默认标签初始化完成！")

