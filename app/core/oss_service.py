"""OSS 对象存储服务"""
import os
import logging
from typing import Optional, BinaryIO
from datetime import datetime
from pathlib import Path
from app.core.oss_config import (
    OSS_TYPE,
    ALIYUN_OSS_ACCESS_KEY_ID,
    ALIYUN_OSS_ACCESS_KEY_SECRET,
    ALIYUN_OSS_ENDPOINT,
    ALIYUN_OSS_BUCKET_NAME,
    ALIYUN_OSS_BUCKET_DOMAIN,
    TENCENT_COS_SECRET_ID,
    TENCENT_COS_SECRET_KEY,
    TENCENT_COS_REGION,
    TENCENT_COS_BUCKET_NAME,
    TENCENT_COS_DOMAIN,
    AWS_S3_ACCESS_KEY_ID,
    AWS_S3_SECRET_ACCESS_KEY,
    AWS_S3_REGION,
    AWS_S3_BUCKET_NAME,
    AWS_S3_DOMAIN,
    OSS_PREFIX,
    OSS_USE_HTTPS,
    validate_oss_config
)

logger = logging.getLogger(__name__)


class OSSService:
    """OSS 服务基类"""
    
    def __init__(self):
        self.oss_type = OSS_TYPE
        self.prefix = OSS_PREFIX
        self.use_https = OSS_USE_HTTPS
        
        # 验证配置
        is_valid, error_msg = validate_oss_config()
        if not is_valid:
            logger.warning(f"OSS 配置验证失败: {error_msg}")
            logger.warning("将使用本地存储模式")
            self.enabled = False
        else:
            self.enabled = True
            self._init_client()
    
    def _init_client(self):
        """初始化 OSS 客户端"""
        if self.oss_type == "aliyun":
            self._init_aliyun_oss()
        elif self.oss_type == "tencent":
            self._init_tencent_cos()
        elif self.oss_type == "aws":
            self._init_aws_s3()
        else:
            self.enabled = False
            logger.error(f"不支持的 OSS 类型: {self.oss_type}")
    
    def _init_aliyun_oss(self):
        """初始化阿里云 OSS 客户端"""
        try:
            import oss2
            self.client = oss2.Bucket(
                oss2.Auth(ALIYUN_OSS_ACCESS_KEY_ID, ALIYUN_OSS_ACCESS_KEY_SECRET),
                f"https://{ALIYUN_OSS_ENDPOINT}",
                ALIYUN_OSS_BUCKET_NAME
            )
            self.bucket_name = ALIYUN_OSS_BUCKET_NAME
            self.domain = ALIYUN_OSS_BUCKET_DOMAIN or f"https://{ALIYUN_OSS_BUCKET_NAME}.{ALIYUN_OSS_ENDPOINT}"
            logger.info(f"阿里云 OSS 客户端初始化成功: {self.domain}")
        except ImportError:
            logger.error("未安装 oss2 库，请运行: pip install oss2")
            self.enabled = False
        except Exception as e:
            logger.error(f"阿里云 OSS 客户端初始化失败: {str(e)}")
            self.enabled = False
    
    def _init_tencent_cos(self):
        """初始化腾讯云 COS 客户端"""
        try:
            from qcloud_cos import CosConfig
            from qcloud_cos import CosS3Client
            config = CosConfig(
                Region=TENCENT_COS_REGION,
                SecretId=TENCENT_COS_SECRET_ID,
                SecretKey=TENCENT_COS_SECRET_KEY,
                Scheme='https' if OSS_USE_HTTPS else 'http'
            )
            self.client = CosS3Client(config)
            self.bucket_name = TENCENT_COS_BUCKET_NAME
            self.domain = TENCENT_COS_DOMAIN or f"https://{TENCENT_COS_BUCKET_NAME}.cos.{TENCENT_COS_REGION}.myqcloud.com"
            logger.info(f"腾讯云 COS 客户端初始化成功: {self.domain}")
        except ImportError:
            logger.error("未安装 qcloud-python-sdk 库，请运行: pip install cos-python-sdk-v5")
            self.enabled = False
        except Exception as e:
            logger.error(f"腾讯云 COS 客户端初始化失败: {str(e)}")
            self.enabled = False
    
    def _init_aws_s3(self):
        """初始化 AWS S3 客户端"""
        try:
            import boto3
            self.client = boto3.client(
                's3',
                aws_access_key_id=AWS_S3_ACCESS_KEY_ID,
                aws_secret_access_key=AWS_S3_SECRET_ACCESS_KEY,
                region_name=AWS_S3_REGION
            )
            self.bucket_name = AWS_S3_BUCKET_NAME
            self.domain = AWS_S3_DOMAIN or f"https://{AWS_S3_BUCKET_NAME}.s3.{AWS_S3_REGION}.amazonaws.com"
            logger.info(f"AWS S3 客户端初始化成功: {self.domain}")
        except ImportError:
            logger.error("未安装 boto3 库，请运行: pip install boto3")
            self.enabled = False
        except Exception as e:
            logger.error(f"AWS S3 客户端初始化失败: {str(e)}")
            self.enabled = False
    
    def _generate_object_key(self, filename: str, is_temp: bool = False) -> str:
        """生成 OSS 对象键（路径）"""
        # 按日期组织文件：uploads/2024/12/15/filename.jpg 或 temp/2024/12/15/filename.jpg
        date_path = datetime.now().strftime("%Y/%m/%d")
        prefix = "temp" if is_temp else self.prefix
        return f"{prefix}/{date_path}/{filename}"
    
    def upload_file(self, file_content: bytes, filename: str, content_type: Optional[str] = None, is_temp: bool = False) -> Optional[str]:
        """上传文件到 OSS
        
        Args:
            file_content: 文件内容（字节）
            filename: 文件名
            content_type: 文件 MIME 类型
            is_temp: 是否为临时文件（上传到 temp/ 目录）
        
        Returns:
            文件 URL，如果上传失败返回 None
        """
        if not self.enabled:
            return None
        
        try:
            object_key = self._generate_object_key(filename, is_temp=is_temp)
            
            if self.oss_type == "aliyun":
                return self._upload_to_aliyun(file_content, object_key, content_type)
            elif self.oss_type == "tencent":
                return self._upload_to_tencent(file_content, object_key, content_type)
            elif self.oss_type == "aws":
                return self._upload_to_aws(file_content, object_key, content_type)
            else:
                logger.error(f"不支持的 OSS 类型: {self.oss_type}")
                return None
        except Exception as e:
            logger.error(f"文件上传到 OSS 失败: {str(e)}")
            return None
    
    def _upload_to_aliyun(self, file_content: bytes, object_key: str, content_type: Optional[str] = None) -> str:
        """上传到阿里云 OSS"""
        headers = {}
        if content_type:
            headers['Content-Type'] = content_type
        
        self.client.put_object(object_key, file_content, headers=headers)
        
        # 返回文件 URL
        if ALIYUN_OSS_BUCKET_DOMAIN:
            # 使用自定义域名
            protocol = "https" if self.use_https else "http"
            return f"{protocol}://{ALIYUN_OSS_BUCKET_DOMAIN}/{object_key}"
        else:
            # 使用默认域名
            protocol = "https" if self.use_https else "http"
            return f"{protocol}://{self.bucket_name}.{ALIYUN_OSS_ENDPOINT}/{object_key}"
    
    def _upload_to_tencent(self, file_content: bytes, object_key: str, content_type: Optional[str] = None) -> str:
        """上传到腾讯云 COS"""
        from qcloud_cos.cos_exception import CosClientError
        
        try:
            response = self.client.put_object(
                Bucket=self.bucket_name,
                Body=file_content,
                Key=object_key,
                ContentType=content_type or 'application/octet-stream'
            )
            
            # 返回文件 URL
            if TENCENT_COS_DOMAIN:
                protocol = "https" if self.use_https else "http"
                return f"{protocol}://{TENCENT_COS_DOMAIN}/{object_key}"
            else:
                protocol = "https" if self.use_https else "http"
                return f"{protocol}://{self.bucket_name}.cos.{TENCENT_COS_REGION}.myqcloud.com/{object_key}"
        except CosClientError as e:
            logger.error(f"腾讯云 COS 上传失败: {str(e)}")
            raise
    
    def _upload_to_aws(self, file_content: bytes, object_key: str, content_type: Optional[str] = None) -> str:
        """上传到 AWS S3"""
        extra_args = {}
        if content_type:
            extra_args['ContentType'] = content_type
        
        self.client.put_object(
            Bucket=self.bucket_name,
            Key=object_key,
            Body=file_content,
            **extra_args
        )
        
        # 返回文件 URL
        if AWS_S3_DOMAIN:
            protocol = "https" if self.use_https else "http"
            return f"{protocol}://{AWS_S3_DOMAIN}/{object_key}"
        else:
            protocol = "https" if self.use_https else "http"
            return f"{protocol}://{self.bucket_name}.s3.{AWS_S3_REGION}.amazonaws.com/{object_key}"
    
    def delete_file(self, url: str) -> bool:
        """从 OSS 删除文件
        
        Args:
            url: 文件 URL
        
        Returns:
            是否删除成功
        """
        if not self.enabled:
            return False
        
        try:
            # 从 URL 中提取 object_key
            object_key = self._extract_object_key_from_url(url)
            if not object_key:
                return False
            
            if self.oss_type == "aliyun":
                self.client.delete_object(object_key)
            elif self.oss_type == "tencent":
                self.client.delete_object(Bucket=self.bucket_name, Key=object_key)
            elif self.oss_type == "aws":
                self.client.delete_object(Bucket=self.bucket_name, Key=object_key)
            else:
                return False
            
            logger.info(f"文件删除成功: {object_key}")
            return True
        except Exception as e:
            logger.error(f"文件删除失败: {str(e)}")
            return False
    
    def _extract_object_key_from_url(self, url: str) -> Optional[str]:
        """从 URL 中提取 object_key"""
        try:
            # 移除协议和域名部分
            if "://" in url:
                parts = url.split("://", 1)
                path = parts[1].split("/", 1)
                if len(path) > 1:
                    return path[1]
            return None
        except Exception:
            return None
    
    def move_file(self, source_url: str, target_filename: str) -> Optional[str]:
        """将文件从临时位置移动到正式位置（OSS 中复制文件）
        
        Args:
            source_url: 源文件 URL（临时文件）
            target_filename: 目标文件名
        
        Returns:
            新文件 URL，如果移动失败返回 None
        """
        if not self.enabled:
            return None
        
        try:
            # 从源 URL 提取 object_key
            source_key = self._extract_object_key_from_url(source_url)
            if not source_key:
                logger.error(f"无法从 URL 提取 object_key: {source_url}")
                return None
            
            # 生成目标 object_key
            target_key = self._generate_object_key(target_filename, is_temp=False)
            
            # 在 OSS 中复制文件
            if self.oss_type == "aliyun":
                # 阿里云 OSS copy_object 格式: copy_object(target_key, source_bucket, source_key)
                self.client.copy_object(target_key, self.bucket_name, source_key)
                # 删除临时文件
                self.client.delete_object(source_key)
            elif self.oss_type == "tencent":
                # 复制文件
                copy_source = {"Bucket": self.bucket_name, "Key": source_key}
                self.client.copy_object(
                    Bucket=self.bucket_name,
                    Key=target_key,
                    CopySource=copy_source
                )
                # 删除临时文件
                self.client.delete_object(Bucket=self.bucket_name, Key=source_key)
            elif self.oss_type == "aws":
                # 复制文件
                copy_source = {"Bucket": self.bucket_name, "Key": source_key}
                self.client.copy_object(
                    CopySource=copy_source,
                    Bucket=self.bucket_name,
                    Key=target_key
                )
                # 删除临时文件
                self.client.delete_object(Bucket=self.bucket_name, Key=source_key)
            else:
                return None
            
            # 生成新文件 URL
            if self.oss_type == "aliyun":
                if ALIYUN_OSS_BUCKET_DOMAIN:
                    protocol = "https" if self.use_https else "http"
                    return f"{protocol}://{ALIYUN_OSS_BUCKET_DOMAIN}/{target_key}"
                else:
                    protocol = "https" if self.use_https else "http"
                    return f"{protocol}://{self.bucket_name}.{ALIYUN_OSS_ENDPOINT}/{target_key}"
            elif self.oss_type == "tencent":
                if TENCENT_COS_DOMAIN:
                    protocol = "https" if self.use_https else "http"
                    return f"{protocol}://{TENCENT_COS_DOMAIN}/{target_key}"
                else:
                    protocol = "https" if self.use_https else "http"
                    return f"{protocol}://{self.bucket_name}.cos.{TENCENT_COS_REGION}.myqcloud.com/{target_key}"
            elif self.oss_type == "aws":
                if AWS_S3_DOMAIN:
                    protocol = "https" if self.use_https else "http"
                    return f"{protocol}://{AWS_S3_DOMAIN}/{target_key}"
                else:
                    protocol = "https" if self.use_https else "http"
                    return f"{protocol}://{self.bucket_name}.s3.{AWS_S3_REGION}.amazonaws.com/{target_key}"
            
            return None
        except Exception as e:
            logger.error(f"移动文件失败: {str(e)}")
            return None


# 全局 OSS 服务实例
oss_service = OSSService()

