"""管理后台 API - 需要认证的 CRUD 操作"""
from fastapi import APIRouter, Depends, HTTPException, status, Request, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
import traceback
import logging
import os
import shutil
from pathlib import Path
import stat
from app.core.database import get_db
from app.core.oss_service import oss_service
from app.models.catalog import Category, Product, Tag, product_tag_association
from app.models.content import HeroSlide
from app.models.admin import Admin
from sqlalchemy import insert, delete
from app.api.routes import ProductResponse, CategoryResponse, HeroSlideResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin", tags=["管理后台"])

# 文件上传目录（使用绝对路径，基于项目根目录）
# 从 app/api/admin.py 到项目根目录：app/api/admin.py -> app/api -> app -> 项目根目录
BASE_DIR = Path(__file__).parent.parent.parent  # 项目根目录
UPLOAD_DIR = BASE_DIR / "static" / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
logger.info(f"文件上传目录: {UPLOAD_DIR.absolute()}")
logger.info(f"上传目录是否存在: {UPLOAD_DIR.exists()}")
logger.info(f"上传目录可写: {UPLOAD_DIR.is_dir() and os.access(UPLOAD_DIR, os.W_OK)}")


# ==================== 认证依赖 ====================
async def get_current_admin(request: Request, db: AsyncSession = Depends(get_db)) -> Admin:
    """获取当前登录的管理员（从 session 中）"""
    # 从 session 中获取管理员 ID
    admin_id = request.session.get("admin_id")
    
    if not admin_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="请先登录"
        )
    
    # 查询管理员
    result = await db.execute(
        select(Admin).where(Admin.id == admin_id, Admin.is_active == True)
    )
    admin = result.scalar_one_or_none()
    
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="管理员不存在或已被禁用"
        )
    
    return admin


# ==================== 文件上传 API ====================
@router.post("/upload-temp")
async def upload_temp_file(
    file: UploadFile = File(...),
    admin: Admin = Depends(get_current_admin)
):
    """上传临时文件（用于预览，上传到 temp/ 目录）"""
    try:
        # 验证文件类型
        allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4", "video/webm", "video/quicktime"]
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"不支持的文件类型: {file.content_type}"
            )
        
        # 生成文件名
        file_ext = Path(file.filename).suffix
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{timestamp}_{file.filename}"
        
        logger.info(f"========== 临时文件上传开始 ==========")
        logger.info(f"文件名: {file.filename}")
        logger.info(f"文件类型: {file.content_type}")
        logger.info(f"OSS 服务状态: {'启用' if oss_service.enabled else '未启用（使用本地存储）'}")
        
        # 重置文件指针（确保从头读取）
        await file.seek(0)
        content = await file.read()
        file_size = len(content)
        logger.info(f"读取文件内容大小: {file_size} 字节")
        
        # 尝试上传到 OSS 临时目录
        file_url = None
        if oss_service.enabled:
            try:
                file_url = oss_service.upload_file(content, filename, file.content_type, is_temp=True)
                if file_url:
                    logger.info(f"✅ 临时文件已上传到 OSS: {file_url}")
                else:
                    logger.warning("OSS 上传失败，回退到本地存储")
            except Exception as e:
                logger.error(f"OSS 上传异常: {str(e)}")
                logger.warning("回退到本地存储")
        
        # 如果 OSS 未启用或上传失败，使用本地存储
        if not file_url:
            temp_dir = UPLOAD_DIR / "temp"
            temp_dir.mkdir(parents=True, exist_ok=True)
            file_path = temp_dir / filename
            logger.info(f"使用本地存储，目标路径: {file_path.absolute()}")
            
            try:
                with open(file_path, "wb") as buffer:
                    buffer.write(content)
                    buffer.flush()
                    os.fsync(buffer.fileno())
                
                file_url = f"/uploads/temp/{filename}"
                logger.info(f"✅ 临时文件已保存到本地: {file_url}")
            except Exception as e:
                logger.error(f"❌ 文件写入失败: {str(e)}")
                logger.error(traceback.format_exc())
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"文件保存失败: {str(e)}"
                )
        
        logger.info(f"========== 临时文件上传成功 ==========")
        logger.info(f"URL: {file_url}")
        logger.info(f"大小: {file_size} 字节")
        return {"url": file_url, "filename": filename, "is_temp": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"临时文件上传失败: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"临时文件上传失败: {str(e)}"
        )


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    admin: Admin = Depends(get_current_admin)
):
    """上传文件（图片或视频）- 直接上传到正式位置"""
    try:
        # 验证文件类型
        allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4", "video/webm", "video/quicktime"]
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"不支持的文件类型: {file.content_type}"
            )
        
        # 生成文件名
        file_ext = Path(file.filename).suffix
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{timestamp}_{file.filename}"
        
        logger.info(f"========== 文件上传开始 ==========")
        logger.info(f"文件名: {file.filename}")
        logger.info(f"文件类型: {file.content_type}")
        logger.info(f"OSS 服务状态: {'启用' if oss_service.enabled else '未启用（使用本地存储）'}")
        
        # 重置文件指针（确保从头读取）
        await file.seek(0)
        content = await file.read()
        file_size = len(content)
        logger.info(f"读取文件内容大小: {file_size} 字节")
        
        # 尝试上传到 OSS（正式位置）
        file_url = None
        if oss_service.enabled:
            try:
                file_url = oss_service.upload_file(content, filename, file.content_type, is_temp=False)
                if file_url:
                    logger.info(f"✅ 文件已上传到 OSS: {file_url}")
                else:
                    logger.warning("OSS 上传失败，回退到本地存储")
            except Exception as e:
                logger.error(f"OSS 上传异常: {str(e)}")
                logger.warning("回退到本地存储")
        
        # 如果 OSS 未启用或上传失败，使用本地存储
        if not file_url:
            file_path = UPLOAD_DIR / filename
            logger.info(f"使用本地存储，目标路径: {file_path.absolute()}")
            
            # 确保目录存在
            UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
            
            try:
                with open(file_path, "wb") as buffer:
                    buffer.write(content)
                    buffer.flush()
                    os.fsync(buffer.fileno())
                
                # 验证文件是否真的保存成功
                if not file_path.exists():
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="文件保存失败：文件不存在"
                    )
                
                file_url = f"/uploads/{filename}"
                logger.info(f"✅ 文件已保存到本地: {file_url}")
            except Exception as e:
                logger.error(f"❌ 文件写入失败: {str(e)}")
                logger.error(traceback.format_exc())
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"文件保存失败: {str(e)}"
                )
        
        logger.info(f"========== 文件上传成功 ==========")
        logger.info(f"URL: {file_url}")
        logger.info(f"大小: {file_size} 字节")
        return {"url": file_url, "filename": filename}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"文件上传失败: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"文件上传失败: {str(e)}"
        )


@router.post("/upload-video")
async def upload_video(
    file: UploadFile = File(...),
    admin: Admin = Depends(get_current_admin)
):
    """专门上传视频文件的接口"""
    try:
        # 验证文件类型（只允许视频）
        allowed_video_types = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo", "video/ogg"]
        if file.content_type not in allowed_video_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"不支持的视频类型: {file.content_type}。支持的格式：MP4, WEBM, MOV, AVI, OGG"
            )
        
        # 检查文件大小（限制 100MB）
        file_size_limit = 100 * 1024 * 1024  # 100MB
        # 注意：UploadFile 的 size 属性可能不可用，需要在读取时检查
        
        # 生成文件名
        file_ext = Path(file.filename).suffix
        if not file_ext:
            # 根据 content_type 推断扩展名
            ext_map = {
                "video/mp4": ".mp4",
                "video/webm": ".webm",
                "video/quicktime": ".mov",
                "video/x-msvideo": ".avi",
                "video/ogg": ".ogg"
            }
            file_ext = ext_map.get(file.content_type, ".mp4")
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{timestamp}_video{file_ext}"
        
        logger.info(f"========== 视频上传开始 ==========")
        logger.info(f"文件名: {file.filename}")
        logger.info(f"文件类型: {file.content_type}")
        logger.info(f"OSS 服务状态: {'启用' if oss_service.enabled else '未启用（使用本地存储）'}")
        
        # 重置文件指针
        await file.seek(0)
        
        # 读取文件内容并检查大小
        content = await file.read()
        file_size = len(content)
        
        if file_size > file_size_limit:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"视频文件过大: {file_size / 1024 / 1024:.2f}MB，最大允许 100MB"
            )
        
        logger.info(f"视频文件大小: {file_size} 字节 ({file_size / 1024 / 1024:.2f}MB)")
        
        # 尝试上传到 OSS
        video_url = None
        if oss_service.enabled:
            try:
                video_url = oss_service.upload_file(content, filename, file.content_type)
                if video_url:
                    logger.info(f"✅ 视频已上传到 OSS: {video_url}")
                else:
                    logger.warning("OSS 上传失败，回退到本地存储")
            except Exception as e:
                logger.error(f"OSS 上传异常: {str(e)}")
                logger.warning("回退到本地存储")
        
        # 如果 OSS 未启用或上传失败，使用本地存储
        if not video_url:
            file_path = UPLOAD_DIR / filename
            logger.info(f"使用本地存储，目标路径: {file_path.absolute()}")
            
            # 确保目录存在
            UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
            
            try:
                with open(file_path, "wb") as buffer:
                    buffer.write(content)
                    buffer.flush()
                    os.fsync(buffer.fileno())
                
                # 验证文件是否真的保存成功
                if not file_path.exists():
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="视频保存失败：文件不存在"
                    )
                
                saved_size = file_path.stat().st_size
                video_url = f"/uploads/{filename}"
                logger.info(f"✅ 视频已保存到本地: {video_url}")
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"❌ 视频文件写入失败: {str(e)}")
                logger.error(traceback.format_exc())
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"视频保存失败: {str(e)}"
                )
        
        logger.info(f"========== 视频上传成功 ==========")
        logger.info(f"URL: {video_url}")
        logger.info(f"大小: {file_size} 字节")
        
        return {
            "success": True,
            "url": video_url,
            "filename": filename,
            "size": file_size,
            "message": "视频上传成功"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"视频上传失败: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"视频上传失败: {str(e)}"
        )


class MoveTempFilesRequest(BaseModel):
    temp_urls: List[str]


@router.post("/move-temp-to-final")
async def move_temp_to_final(
    request: MoveTempFilesRequest,
    admin: Admin = Depends(get_current_admin)
):
    """将临时文件移动到正式位置（提交产品时调用）
    
    Args:
        temp_urls: 临时文件 URL 列表
    
    Returns:
        正式文件 URL 列表
    """
    try:
        logger.info(f"========== 移动临时文件到正式位置 ==========")
        logger.info(f"临时文件数量: {len(request.temp_urls)}")
        
        final_urls = []
        for temp_url in request.temp_urls:
            logger.info(f"处理临时文件: {temp_url}")
            
            # 从临时 URL 中提取文件名
            if temp_url.startswith('/uploads/temp/'):
                # 本地临时文件
                filename = temp_url.replace('/uploads/temp/', '')
                # 移动到正式位置
                temp_path = UPLOAD_DIR / "temp" / filename
                final_path = UPLOAD_DIR / filename
                
                if temp_path.exists():
                    import shutil
                    shutil.move(str(temp_path), str(final_path))
                    final_url = f"/uploads/{filename}"
                    final_urls.append(final_url)
                    logger.info(f"✅ 本地文件移动成功: {final_url}")
                else:
                    logger.warning(f"⚠️  临时文件不存在: {temp_path}")
                    final_urls.append(temp_url)  # 保持原 URL
            elif temp_url.startswith('http://') or temp_url.startswith('https://'):
                # OSS 临时文件
                if oss_service.enabled:
                    # 从 URL 中提取文件名
                    filename = Path(temp_url).name
                    final_url = oss_service.move_file(temp_url, filename)
                    if final_url:
                        final_urls.append(final_url)
                        logger.info(f"✅ OSS 文件移动成功: {final_url}")
                    else:
                        logger.warning(f"⚠️  OSS 文件移动失败，保持原 URL")
                        final_urls.append(temp_url)
                else:
                    # OSS 未启用，保持原 URL
                    final_urls.append(temp_url)
            else:
                # 已经是正式路径，直接使用
                final_urls.append(temp_url)
        
        logger.info(f"========== 文件移动完成 ==========")
        logger.info(f"正式文件数量: {len(final_urls)}")
        return {"urls": final_urls}
    except Exception as e:
        logger.error(f"移动文件失败: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"移动文件失败: {str(e)}"
        )


# ==================== API Endpoints ====================
@router.get("/products", response_model=List[ProductResponse])
async def get_all_products(
    admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """获取所有产品列表（管理后台用，包括未启用的）"""
    try:
        # 先简单查询，避免 ORDER BY 导致的排序内存问题
        query = (
            select(Product)
            .options(selectinload(Product.category), selectinload(Product.tags))
            .order_by(Product.id)  # 只按 ID 排序，避免 order 字段的问题
        )
        result = await db.execute(query)
        products = result.scalars().unique().all()
        
        logger.info(f"[get_all_products] 查询到 {len(products)} 个产品")
        for p in products:
            logger.info(f"[get_all_products] 产品 ID={p.id}, name={p.name}, is_active={p.is_active}, order={p.order}")
        
        return products
    except Exception as e:
        logger.error(f"[get_all_products] 查询失败: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取产品列表失败: {str(e)}"
        )


# ==================== Pydantic Schemas ====================
class ProductCreate(BaseModel):
    name: str
    slug: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    key_features: Optional[List[str]] = None
    images: Optional[List[str]] = None
    video: Optional[str] = None  # 独立的视频字段
    specs: Optional[dict] = None  # specs 不再包含 video
    order: int = 0
    is_active: bool = True
    tag_ids: Optional[List[int]] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    key_features: Optional[List[str]] = None
    images: Optional[List[str]] = None
    video: Optional[str] = None  # 独立的视频字段
    specs: Optional[dict] = None  # specs 不再包含 video
    order: Optional[int] = None
    is_active: Optional[bool] = None
    tag_ids: Optional[List[int]] = None


class CategoryCreate(BaseModel):
    name: str
    slug: str
    order: int = 0
    is_active: bool = True


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    order: Optional[int] = None
    is_active: Optional[bool] = None


class TagCreate(BaseModel):
    name: str
    color: str = "#10b981"
    order: int = 0
    is_active: bool = True


class TagUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    order: Optional[int] = None
    is_active: Optional[bool] = None


class HeroSlideCreate(BaseModel):
    title: str
    subtitle: Optional[str] = None
    image: str
    description: Optional[str] = None
    link: Optional[str] = None
    button_text: Optional[str] = None
    text_color: Optional[str] = "white"
    order: int = 0
    is_active: bool = True


class HeroSlideUpdate(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    image: Optional[str] = None
    description: Optional[str] = None
    link: Optional[str] = None
    button_text: Optional[str] = None
    text_color: Optional[str] = None
    order: Optional[int] = None
    is_active: Optional[bool] = None


# ==================== 产品管理 API ====================
@router.post("/products", status_code=status.HTTP_201_CREATED)
async def create_product(
    product_data: ProductCreate,
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """创建产品（需要登录）"""
    try:
        logger.info(f"创建产品请求: {product_data.model_dump()}")
        
        # 检查 slug 是否已存在
        if product_data.slug:
            result = await db.execute(
                select(Product).where(Product.slug == product_data.slug)
            )
            if result.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="产品 slug 已存在"
                )
        
        # 创建产品
        # 确保 JSON 字段正确序列化（空列表/空字典转为 None）
        key_features = product_data.key_features if (product_data.key_features and len(product_data.key_features) > 0) else None
        
        # 处理 images 数组：确保 OSS URL 不被错误处理
        images = None
        if product_data.images and len(product_data.images) > 0:
            processed_images = []
            for img_url in product_data.images:
                # 如果是 OSS URL（以 http:// 或 https:// 开头），直接使用
                if img_url.startswith('http://') or img_url.startswith('https://'):
                    processed_images.append(img_url)
                # 如果是本地路径（以 /uploads/ 开头），直接使用
                elif img_url.startswith('/uploads/'):
                    processed_images.append(img_url)
                # 否则添加 /uploads/ 前缀（兼容旧格式）
                else:
                    processed_images.append(f'/uploads/{img_url}')
            images = processed_images if processed_images else None
        
        # 处理 video 字段：OSS URL 直接使用，本地路径添加前缀
        video = None
        if product_data.video:
            # 如果是 OSS URL（以 http:// 或 https:// 开头），直接使用
            if product_data.video.startswith('http://') or product_data.video.startswith('https://'):
                video = product_data.video
                logger.info(f"视频字段（OSS URL）: {video}")
            # 如果是本地路径（以 /uploads/ 开头），直接使用
            elif product_data.video.startswith('/uploads/'):
                video = product_data.video
                logger.info(f"视频字段（本地路径）: {video}")
            # 否则添加 /uploads/ 前缀（兼容旧格式）
            else:
                video = f'/uploads/{product_data.video}'
                logger.info(f"视频字段转换: {product_data.video} -> {video}")
        
        # 处理 specs（不再包含 video）
        specs = None
        if product_data.specs:
            # 移除 video 字段（如果存在），因为现在使用独立的 video 字段
            processed_specs = {k: v for k, v in product_data.specs.items() if k != 'video' and v is not None and v != ''}
            
            # 如果处理后的 specs 不为空，才赋值
            if len(processed_specs) > 0:
                specs = processed_specs
        
        logger.info(f"产品数据准备: name={product_data.name}, video={video}, key_features={key_features}, images={images}, specs={specs}")
        
        product = Product(
            name=product_data.name,
            slug=product_data.slug,
            description=product_data.description,
            category_id=product_data.category_id,
            key_features=key_features,
            images=images,
            video=video,  # 使用独立的 video 字段
            specs=specs,
            order=product_data.order,
            is_active=product_data.is_active,
            created_at=datetime.utcnow().isoformat(),
            updated_at=datetime.utcnow().isoformat()
        )
        
        db.add(product)
        await db.flush()  # 获取产品 ID，此时 product.id 已可用
        
        # 关联标签（使用 association 表直接插入，避免访问关联关系）
        if product_data.tag_ids and len(product_data.tag_ids) > 0:
            # 验证标签是否存在
            result = await db.execute(
                select(Tag).where(Tag.id.in_(product_data.tag_ids))
            )
            tags = result.scalars().all()
            if len(tags) != len(product_data.tag_ids):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="部分标签不存在"
                )
            # 直接插入关联表，避免访问关联关系
            if tags:
                await db.execute(
                    insert(product_tag_association).values([
                        {"product_id": product.id, "tag_id": tag.id}
                        for tag in tags
                    ])
                )
        
        await db.commit()
        
        # 不需要重新查询或访问关联关系，直接返回成功
        logger.info(f"产品创建成功: ID={product.id}, name={product.name}")
        return {"success": True, "message": "产品创建成功", "id": product.id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"创建产品失败: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"创建产品失败: {str(e)}"
        )


@router.put("/products/{product_id}")
async def update_product(
    product_id: int,
    product_data: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """更新产品（需要登录）"""
    try:
        logger.info(f"更新产品请求: product_id={product_id}, data={product_data.model_dump()}")
        
        result = await db.execute(
            select(Product).where(Product.id == product_id)
        )
        product = result.scalar_one_or_none()
        
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="产品不存在"
            )
        
        logger.info(f"更新前产品状态: is_active={product.is_active}")
        
        # 更新字段
        if product_data.name is not None:
            product.name = product_data.name
        if product_data.slug is not None:
            # 检查 slug 是否被其他产品使用
            if product_data.slug != product.slug:
                result = await db.execute(
                    select(Product).where(Product.slug == product_data.slug)
                )
                if result.scalar_one_or_none():
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="产品 slug 已存在"
                    )
            product.slug = product_data.slug
        if product_data.description is not None:
            product.description = product_data.description
        if product_data.category_id is not None:
            product.category_id = product_data.category_id
        if product_data.key_features is not None:
            product.key_features = product_data.key_features
        if product_data.images is not None:
            # 处理 images 数组：确保 OSS URL 不被错误处理
            processed_images = []
            for img_url in product_data.images:
                # 如果是 OSS URL（以 http:// 或 https:// 开头），直接使用
                if img_url.startswith('http://') or img_url.startswith('https://'):
                    processed_images.append(img_url)
                # 如果是本地路径（以 /uploads/ 开头），直接使用
                elif img_url.startswith('/uploads/'):
                    processed_images.append(img_url)
                # 否则添加 /uploads/ 前缀（兼容旧格式）
                else:
                    processed_images.append(f'/uploads/{img_url}')
            product.images = processed_images if processed_images else None
        if product_data.video is not None:
            # 处理 video 字段：OSS URL 直接使用，本地路径添加前缀
            # 如果是 OSS URL（以 http:// 或 https:// 开头），直接使用
            if product_data.video.startswith('http://') or product_data.video.startswith('https://'):
                product.video = product_data.video
                logger.info(f"视频字段（OSS URL）: {product.video}")
            # 如果是本地路径（以 /uploads/ 开头），直接使用
            elif product_data.video.startswith('/uploads/'):
                product.video = product_data.video
                logger.info(f"视频字段（本地路径）: {product.video}")
            # 否则添加 /uploads/ 前缀（兼容旧格式）
            else:
                product.video = f'/uploads/{product_data.video}'
                logger.info(f"视频字段转换: {product_data.video} -> {product.video}")
        if product_data.specs is not None:
            # 处理 specs（不再包含 video，因为现在使用独立的 video 字段）
            # 移除 video 字段（如果存在）
            processed_specs = {k: v for k, v in product_data.specs.items() if k != 'video' and v is not None and v != ''}
            
            # 如果处理后的 specs 不为空，才赋值
            if len(processed_specs) > 0:
                product.specs = processed_specs
            else:
                product.specs = None
        if product_data.order is not None:
            product.order = product_data.order
        if product_data.is_active is not None:
            logger.info(f"更新 is_active: {product.is_active} -> {product_data.is_active}")
            product.is_active = product_data.is_active
            logger.info(f"更新后 is_active: {product.is_active}")
        else:
            logger.warning(f"is_active 字段为 None，不更新")
        
        product.updated_at = datetime.utcnow().isoformat()
        
        # 更新标签关联（使用 association 表直接操作）
        if product_data.tag_ids is not None:
            # 先删除所有现有关联
            await db.execute(
                delete(product_tag_association).where(
                    product_tag_association.c.product_id == product_id
                )
            )
            # 再插入新的关联
            if len(product_data.tag_ids) > 0:
                result = await db.execute(
                    select(Tag).where(Tag.id.in_(product_data.tag_ids))
                )
                tags = result.scalars().all()
                if tags:
                    await db.execute(
                        insert(product_tag_association).values([
                            {"product_id": product_id, "tag_id": tag.id}
                            for tag in tags
                        ])
                    )
        
        await db.commit()
        
        logger.info(f"产品更新成功: ID={product_id}, is_active={product.is_active}")
        return {"success": True, "message": "产品更新成功"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"更新产品失败: {str(e)}")
        logger.error(traceback.format_exc())
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"更新产品失败: {str(e)}"
        )


@router.delete("/products/{product_id}")
async def delete_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """删除产品（需要登录）"""
    result = await db.execute(
        select(Product).where(Product.id == product_id)
    )
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="产品不存在"
        )
    
    await db.delete(product)
    await db.commit()
    
    return {"success": True, "message": "产品删除成功"}


# ==================== 分类管理 API ====================
@router.get("/categories", response_model=List[CategoryResponse])
async def get_all_categories(
    admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """获取所有分类列表（管理后台用，包括未启用的）"""
    try:
        result = await db.execute(
            select(Category)
            .order_by(Category.order, Category.name)
        )
        categories = result.scalars().all()
        
        logger.info(f"[get_all_categories] 查询到 {len(categories)} 个分类")
        for c in categories:
            logger.info(f"[get_all_categories] 分类 ID={c.id}, name={c.name}, is_active={c.is_active}")
        
        return categories
    except Exception as e:
        logger.error(f"[get_all_categories] 查询失败: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取分类列表失败: {str(e)}"
        )


@router.post("/categories", status_code=status.HTTP_201_CREATED)
async def create_category(
    category_data: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """创建分类（需要登录）"""
    # 检查 slug 是否已存在
    result = await db.execute(
        select(Category).where(Category.slug == category_data.slug)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="分类 slug 已存在"
        )
    
    category = Category(
        name=category_data.name,
        slug=category_data.slug,
        order=category_data.order,
        is_active=category_data.is_active
    )
    
    db.add(category)
    await db.commit()
    # 不需要 refresh，直接返回即可
    
    return {"success": True, "message": "分类创建成功", "id": category.id}


@router.put("/categories/{category_id}")
async def update_category(
    category_id: int,
    category_data: CategoryUpdate,
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """更新分类（需要登录）"""
    result = await db.execute(
        select(Category).where(Category.id == category_id)
    )
    category = result.scalar_one_or_none()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="分类不存在"
        )
    
    if category_data.name is not None:
        category.name = category_data.name
    if category_data.slug is not None:
        if category_data.slug != category.slug:
            result = await db.execute(
                select(Category).where(Category.slug == category_data.slug)
            )
            if result.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="分类 slug 已存在"
                )
        category.slug = category_data.slug
    if category_data.order is not None:
        category.order = category_data.order
    if category_data.is_active is not None:
        category.is_active = category_data.is_active
    
    await db.commit()
    
    return {"success": True, "message": "分类更新成功"}


@router.delete("/categories/{category_id}")
async def delete_category(
    category_id: int,
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """删除分类（需要登录）"""
    result = await db.execute(
        select(Category).where(Category.id == category_id)
    )
    category = result.scalar_one_or_none()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="分类不存在"
        )
    
    await db.delete(category)
    await db.commit()
    
    return {"success": True, "message": "分类删除成功"}


# ==================== 标签管理 API ====================
@router.post("/tags", status_code=status.HTTP_201_CREATED)
async def create_tag(
    tag_data: TagCreate,
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """创建标签（需要登录）"""
    # 检查名称是否已存在
    result = await db.execute(
        select(Tag).where(Tag.name == tag_data.name)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="标签名称已存在"
        )
    
    tag = Tag(
        name=tag_data.name,
        color=tag_data.color,
        order=tag_data.order,
        is_active=tag_data.is_active
    )
    
    db.add(tag)
    await db.commit()
    # 不需要 refresh，直接返回即可
    
    return {"success": True, "message": "标签创建成功", "id": tag.id}


@router.put("/tags/{tag_id}")
async def update_tag(
    tag_id: int,
    tag_data: TagUpdate,
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """更新标签（需要登录）"""
    result = await db.execute(
        select(Tag).where(Tag.id == tag_id)
    )
    tag = result.scalar_one_or_none()
    
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="标签不存在"
        )
    
    if tag_data.name is not None:
        if tag_data.name != tag.name:
            result = await db.execute(
                select(Tag).where(Tag.name == tag_data.name)
            )
            if result.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="标签名称已存在"
                )
        tag.name = tag_data.name
    if tag_data.color is not None:
        tag.color = tag_data.color
    if tag_data.order is not None:
        tag.order = tag_data.order
    if tag_data.is_active is not None:
        tag.is_active = tag_data.is_active
    
    await db.commit()
    
    return {"success": True, "message": "标签更新成功"}


@router.delete("/tags/{tag_id}")
async def delete_tag(
    tag_id: int,
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """删除标签（需要登录）"""
    result = await db.execute(
        select(Tag).where(Tag.id == tag_id)
    )
    tag = result.scalar_one_or_none()
    
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="标签不存在"
        )
    
    await db.delete(tag)
    await db.commit()
    
    return {"success": True, "message": "标签删除成功"}


# ==================== 轮播图管理 API ====================
@router.get("/slides", response_model=List[HeroSlideResponse])
async def get_all_slides(
    admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """获取所有轮播图列表（管理后台用，包括未启用的）"""
    try:
        result = await db.execute(
            select(HeroSlide)
            .order_by(HeroSlide.order, HeroSlide.id)
        )
        slides = result.scalars().all()
        
        logger.info(f"[get_all_slides] 查询到 {len(slides)} 个轮播图")
        for s in slides:
            logger.info(f"[get_all_slides] 轮播图 ID={s.id}, title={s.title}, is_active={s.is_active}")
        
        return slides
    except Exception as e:
        logger.error(f"[get_all_slides] 查询失败: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取轮播图列表失败: {str(e)}"
        )


@router.post("/slides", status_code=status.HTTP_201_CREATED)
async def create_slide(
    slide_data: HeroSlideCreate,
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """创建轮播图（需要登录）"""
    try:
        logger.info(f"创建轮播图请求: title={slide_data.title}, image={slide_data.image}")
        
        slide = HeroSlide(
            title=slide_data.title,
            subtitle=slide_data.subtitle,
            image=slide_data.image,
            description=slide_data.description,
            link=slide_data.link,
            button_text=slide_data.button_text,
            text_color=slide_data.text_color,
            order=slide_data.order,
            is_active=slide_data.is_active
        )
        
        db.add(slide)
        await db.commit()
        # 不需要 refresh，直接返回即可
        
        logger.info(f"轮播图创建成功: ID={slide.id}, title={slide.title}")
        return {"success": True, "message": "轮播图创建成功", "id": slide.id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"创建轮播图失败: {str(e)}")
        logger.error(traceback.format_exc())
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"创建轮播图失败: {str(e)}"
        )


@router.put("/slides/{slide_id}")
async def update_slide(
    slide_id: int,
    slide_data: HeroSlideUpdate,
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """更新轮播图（需要登录）"""
    try:
        logger.info(f"更新轮播图请求: slide_id={slide_id}, data={slide_data.model_dump()}")
        
        result = await db.execute(
            select(HeroSlide).where(HeroSlide.id == slide_id)
        )
        slide = result.scalar_one_or_none()
        
        if not slide:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="轮播图不存在"
            )
        
        if slide_data.title is not None:
            slide.title = slide_data.title
        if slide_data.subtitle is not None:
            slide.subtitle = slide_data.subtitle
        if slide_data.image is not None:
            slide.image = slide_data.image
        if slide_data.description is not None:
            slide.description = slide_data.description
        if slide_data.link is not None:
            slide.link = slide_data.link
        if slide_data.button_text is not None:
            slide.button_text = slide_data.button_text
        if slide_data.text_color is not None:
            slide.text_color = slide_data.text_color
        if slide_data.order is not None:
            slide.order = slide_data.order
        if slide_data.is_active is not None:
            slide.is_active = slide_data.is_active
        
        await db.commit()
        
        logger.info(f"轮播图更新成功: ID={slide_id}")
        return {"success": True, "message": "轮播图更新成功"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"更新轮播图失败: {str(e)}")
        logger.error(traceback.format_exc())
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"更新轮播图失败: {str(e)}"
        )


@router.delete("/slides/{slide_id}")
async def delete_slide(
    slide_id: int,
    db: AsyncSession = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """删除轮播图（需要登录）"""
    result = await db.execute(
        select(HeroSlide).where(HeroSlide.id == slide_id)
    )
    slide = result.scalar_one_or_none()
    
    if not slide:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="轮播图不存在"
        )
    
    await db.delete(slide)
    await db.commit()
    
    return {"success": True, "message": "轮播图删除成功"}

