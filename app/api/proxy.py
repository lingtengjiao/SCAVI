"""OSS 文件代理 - 用于解决 CORS 问题"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse, Response
import httpx
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/proxy", tags=["代理"])


@router.get("/oss/{file_path:path}")
async def proxy_oss_file(file_path: str):
    """代理 OSS 文件请求（解决 CORS 问题）
    
    Args:
        file_path: OSS 文件路径（从 temp/ 或 uploads/ 开始）
    """
    try:
        # 构建完整的 OSS URL
        from app.core.oss_config import (
            OSS_TYPE,
            ALIYUN_OSS_BUCKET_NAME,
            ALIYUN_OSS_ENDPOINT,
            ALIYUN_OSS_BUCKET_DOMAIN,
            TENCENT_COS_BUCKET_NAME,
            TENCENT_COS_REGION,
            TENCENT_COS_DOMAIN,
            AWS_S3_BUCKET_NAME,
            AWS_S3_REGION,
            AWS_S3_DOMAIN,
            OSS_USE_HTTPS
        )
        
        # 构建 OSS URL
        if OSS_TYPE == "aliyun":
            if ALIYUN_OSS_BUCKET_DOMAIN:
                oss_url = f"{'https' if OSS_USE_HTTPS else 'http'}://{ALIYUN_OSS_BUCKET_DOMAIN}/{file_path}"
            else:
                oss_url = f"{'https' if OSS_USE_HTTPS else 'http'}://{ALIYUN_OSS_BUCKET_NAME}.{ALIYUN_OSS_ENDPOINT}/{file_path}"
        elif OSS_TYPE == "tencent":
            if TENCENT_COS_DOMAIN:
                oss_url = f"{'https' if OSS_USE_HTTPS else 'http'}://{TENCENT_COS_DOMAIN}/{file_path}"
            else:
                oss_url = f"{'https' if OSS_USE_HTTPS else 'http'}://{TENCENT_COS_BUCKET_NAME}.cos.{TENCENT_COS_REGION}.myqcloud.com/{file_path}"
        elif OSS_TYPE == "aws":
            if AWS_S3_DOMAIN:
                oss_url = f"{'https' if OSS_USE_HTTPS else 'http'}://{AWS_S3_DOMAIN}/{file_path}"
            else:
                oss_url = f"{'https' if OSS_USE_HTTPS else 'http'}://{AWS_S3_BUCKET_NAME}.s3.{AWS_S3_REGION}.amazonaws.com/{file_path}"
        else:
            raise HTTPException(status_code=400, detail="不支持的 OSS 类型")
        
        logger.info(f"代理 OSS 文件: {oss_url}")
        
        # 使用 httpx 获取文件
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            response = await client.get(oss_url)
            response.raise_for_status()
            
            # 确定 Content-Type
            content_type = response.headers.get("Content-Type", "application/octet-stream")
            
            # 返回文件流
            return Response(
                content=response.content,
                media_type=content_type,
                headers={
                    "Cache-Control": "public, max-age=31536000",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
                    "Access-Control-Allow-Headers": "*",
                }
            )
    except httpx.HTTPStatusError as e:
        logger.error(f"代理 OSS 文件失败 (HTTP {e.response.status_code}): {str(e)}")
        raise HTTPException(status_code=e.response.status_code, detail=f"无法获取文件: {str(e)}")
    except httpx.RequestError as e:
        logger.error(f"代理 OSS 文件请求失败: {str(e)}")
        raise HTTPException(status_code=502, detail=f"无法连接到 OSS: {str(e)}")
    except Exception as e:
        logger.error(f"代理 OSS 文件异常: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"代理失败: {str(e)}")

