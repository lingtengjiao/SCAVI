"""API 路由 - 只读接口"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import Optional, List
from pydantic import BaseModel
from app.core.database import get_db
from app.models.catalog import Category, Product, Tag, product_tag_association
from app.models.content import HeroSlide


router = APIRouter(prefix="/api", tags=["API"])


# ==================== Pydantic Schemas ====================
class CategoryResponse(BaseModel):
    id: int
    name: str
    slug: str
    order: int
    is_active: bool
    
    class Config:
        from_attributes = True


class TagResponse(BaseModel):
    id: int
    name: str
    color: str
    order: int
    is_active: bool
    
    class Config:
        from_attributes = True


class ProductResponse(BaseModel):
    id: int
    name: str
    slug: Optional[str]
    description: Optional[str]
    key_features: Optional[List[str]]
    images: Optional[List[str]]
    video: Optional[str]  # 独立的视频字段
    specs: Optional[dict]  # specs 不再包含 video
    order: int
    is_active: bool
    category_id: Optional[int]
    category: Optional[CategoryResponse] = None
    tags: List[TagResponse] = []
    
    class Config:
        from_attributes = True


class HeroSlideResponse(BaseModel):
    id: int
    title: str
    subtitle: Optional[str]
    image: str
    description: Optional[str]
    link: Optional[str]
    button_text: Optional[str]
    text_color: Optional[str]
    order: int
    is_active: bool
    
    class Config:
        from_attributes = True


# ==================== API Endpoints ====================
@router.get("/tags", response_model=List[TagResponse])
async def get_tags(db: AsyncSession = Depends(get_db)):
    """获取标签列表（仅返回启用的且至少关联了一个启用产品的标签，按 order 排序）"""
    from sqlalchemy import exists
    
    # 子查询：查找至少关联了一个启用产品的标签
    # 使用 exists() 子查询来检查标签是否有关联的启用产品
    subquery = (
        select(1)
        .select_from(product_tag_association)
        .join(Product, product_tag_association.c.product_id == Product.id)
        .where(
            product_tag_association.c.tag_id == Tag.id,
            Product.is_active == True
        )
    )
    
    # 只返回启用的标签，且该标签至少关联了一个启用产品
    result = await db.execute(
        select(Tag)
        .where(
            Tag.is_active == True,
            exists(subquery)
        )
        .order_by(Tag.order, Tag.name)
    )
    tags = result.scalars().all()
    return tags


@router.get("/slides", response_model=List[HeroSlideResponse])
async def get_slides(db: AsyncSession = Depends(get_db)):
    """获取首页轮播图列表（仅返回启用的，按 order 排序）"""
    result = await db.execute(
        select(HeroSlide)
        .where(HeroSlide.is_active == True)
        .order_by(HeroSlide.order, HeroSlide.id)
    )
    slides = result.scalars().all()
    return slides


@router.get("/categories", response_model=List[CategoryResponse])
async def get_categories(db: AsyncSession = Depends(get_db)):
    """获取分类列表（仅返回启用的，按 order 排序）"""
    result = await db.execute(
        select(Category)
        .where(Category.is_active == True)
        .order_by(Category.order, Category.name)
    )
    categories = result.scalars().all()
    return categories


@router.get("/products", response_model=List[ProductResponse])
async def get_products(
    category_id: Optional[int] = None,
    include_inactive: bool = False,  # 新增参数：是否包含未启用的产品
    db: AsyncSession = Depends(get_db)
):
    """获取产品列表（支持按分类过滤，包含标签）
    
    Args:
        category_id: 可选的分类 ID，用于过滤产品
        include_inactive: 是否包含未启用的产品（默认 False，只返回启用的）
    """
    query = (
        select(Product)
        .options(selectinload(Product.category), selectinload(Product.tags))
    )
    
    # 如果不包含未启用的，只返回启用的产品
    if not include_inactive:
        query = query.where(Product.is_active == True)
    
    if category_id:
        query = query.where(Product.category_id == category_id)
    
    # 只按 ID 排序，避免 order 字段导致的排序内存问题
    query = query.order_by(Product.id)
    result = await db.execute(query)
    products = result.scalars().unique().all()
    return products


@router.get("/products/statistics")
async def get_product_statistics(
    include_inactive: bool = False,
    db: AsyncSession = Depends(get_db)
):
    """获取产品统计数据（按分类统计产品数量）"""
    from sqlalchemy import func
    
    # 构建查询
    query = select(Product.category_id, func.count(Product.id).label('count'))
    
    # 如果不包含未启用的，只统计启用的产品
    if not include_inactive:
        query = query.where(Product.is_active == True)
    
    # 按分类分组
    query = query.group_by(Product.category_id)
    
    result = await db.execute(query)
    stats = result.all()
    
    # 获取所有分类信息
    categories_result = await db.execute(
        select(Category).where(Category.is_active == True)
    )
    categories = {cat.id: cat for cat in categories_result.scalars().all()}
    
    # 构建返回数据
    statistics = {}
    total_count = 0
    
    for category_id, count in stats:
        if category_id and category_id in categories:
            category_name = categories[category_id].name
            statistics[category_name] = count
            total_count += count
        elif category_id is None:
            # 未分类的产品
            statistics['Uncategorized'] = count
            total_count += count
    
    # 确保所有启用的分类都在统计中（即使没有产品也显示0）
    for cat_id, cat in categories.items():
        if cat.name not in statistics:
            statistics[cat.name] = 0
    
    return {
        "total": total_count,
        "by_category": statistics,
        "include_inactive": include_inactive
    }


@router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(product_id: int, db: AsyncSession = Depends(get_db)):
    """获取产品详情（包含标签）"""
    result = await db.execute(
        select(Product)
        .where(Product.id == product_id)
        .options(selectinload(Product.category), selectinload(Product.tags))
    )
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(status_code=404, detail="产品不存在")
    
    return product

