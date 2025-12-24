"""内容模型 - HeroSlide (首页轮播图)"""
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Text, Integer, Boolean
from typing import Optional
from app.models.base import Base


class HeroSlide(Base):
    """首页轮播图（基于前端 HeroSlide 设计）"""
    __tablename__ = "hero_slides"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False, comment="标题")
    subtitle: Mapped[Optional[str]] = mapped_column(String(200), nullable=True, comment="副标题")
    image: Mapped[str] = mapped_column(String(500), nullable=False, comment="图片URL")
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True, comment="描述文本")
    link: Mapped[Optional[str]] = mapped_column(String(500), nullable=True, comment="跳转链接")
    button_text: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, default="查看详情", comment="按钮文案（对应前端 buttonText）")
    text_color: Mapped[Optional[str]] = mapped_column(String(20), nullable=True, default="white", comment="文本颜色（white/black，对应前端 textColor）")
    order: Mapped[int] = mapped_column(Integer, default=0, comment="排序权重（数字越小越靠前）")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, comment="是否启用")
    
    def __repr__(self):
        return f"<HeroSlide(id={self.id}, title='{self.title}')>"

