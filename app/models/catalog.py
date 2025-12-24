"""产品目录模型 - Category、Product、Tag"""
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Text, Integer, Boolean, ForeignKey, JSON, Table, Column
from typing import Optional, List
from app.models.base import Base

# 产品-标签关联表（多对多）
product_tag_association = Table(
    "product_tags",
    Base.metadata,
    Column("product_id", Integer, ForeignKey("products.id"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id"), primary_key=True),
)


class Category(Base):
    """产品分类 - 维度表（单级分类，极简版）"""
    __tablename__ = "categories"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, comment="分类名称")
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, comment="URL 标识")
    order: Mapped[int] = mapped_column(Integer, default=0, comment="排序权重")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, comment="是否启用")
    
    # 关联关系
    products: Mapped[List["Product"]] = relationship("Product", back_populates="category")

    def __repr__(self):
        return f"<Category(id={self.id}, name='{self.name}')>"


class Tag(Base):
    """标签模型 - 用于产品标签（如：New Arrival, Bestseller 等）"""
    __tablename__ = "tags"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, comment="标签名称")
    color: Mapped[str] = mapped_column(String(20), default="#10b981", comment="标签颜色（十六进制）")
    order: Mapped[int] = mapped_column(Integer, default=0, comment="排序权重")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, comment="是否启用")
    
    # 关联关系
    products: Mapped[List["Product"]] = relationship(
        "Product", 
        secondary=product_tag_association, 
        back_populates="tags"
    )

    def __repr__(self):
        return f"<Tag(id={self.id}, name='{self.name}')>"


class Product(Base):
    """产品 - B2B 展示（基于前端 ProductType 设计）"""
    __tablename__ = "products"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    category_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("categories.id"), 
        nullable=True, 
        comment="分类ID"
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False, comment="产品名称（对应前端 title）")
    slug: Mapped[Optional[str]] = mapped_column(String(200), unique=True, nullable=True, comment="SKU/URL 标识")
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True, comment="产品简介")
    
    # 核心卖点/特性（JSON 数组）
    key_features: Mapped[Optional[List[str]]] = mapped_column(
        JSON, 
        nullable=True, 
        comment="核心卖点/特性列表（JSON 数组）"
    )
    
    # 图片列表（JSON 数组）- 第一个为主图
    images: Mapped[Optional[List[str]]] = mapped_column(
        JSON, 
        nullable=True, 
        comment="图片URL列表（JSON 数组），第一个为主图"
    )
    
    # 视频 URL（独立字段）
    video: Mapped[Optional[str]] = mapped_column(
        String(500), 
        nullable=True, 
        comment="产品视频 URL"
    )
    
    # 规格参数（JSON 对象）- 包含 material, care, price 等（不再包含 video）
    specs: Mapped[Optional[dict]] = mapped_column(
        JSON, 
        nullable=True, 
        comment="规格参数（JSON 对象：material, care, price 等）"
    )
    
    # 排序权重（对应前端 order）
    order: Mapped[int] = mapped_column(Integer, default=0, comment="排序权重（数字越小越靠前）")
    
    # 状态（对应前端 status）
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, comment="是否展示")
    
    created_at: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, comment="创建时间")
    updated_at: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, comment="更新时间")
    
    # 关联关系
    category: Mapped[Optional["Category"]] = relationship("Category", back_populates="products")
    tags: Mapped[List["Tag"]] = relationship(
        "Tag", 
        secondary=product_tag_association, 
        back_populates="products"
    )

    def __repr__(self):
        return f"<Product(id={self.id}, name='{self.name}')>"

