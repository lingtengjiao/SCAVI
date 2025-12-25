"""OSS 对象存储配置"""
import os
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

# OSS 类型：aliyun, tencent, aws, qiniu 等（为空则不使用 OSS）
OSS_TYPE = os.getenv("OSS_TYPE", "").lower().strip()

# 阿里云 OSS 配置
ALIYUN_OSS_ACCESS_KEY_ID = os.getenv("ALIYUN_OSS_ACCESS_KEY_ID", "")
ALIYUN_OSS_ACCESS_KEY_SECRET = os.getenv("ALIYUN_OSS_ACCESS_KEY_SECRET", "")
ALIYUN_OSS_ENDPOINT = os.getenv("ALIYUN_OSS_ENDPOINT", "")  # 例如: oss-cn-hangzhou.aliyuncs.com
ALIYUN_OSS_BUCKET_NAME = os.getenv("ALIYUN_OSS_BUCKET_NAME", "")
ALIYUN_OSS_BUCKET_DOMAIN = os.getenv("ALIYUN_OSS_BUCKET_DOMAIN", "")  # 自定义域名，例如: https://cdn.example.com

# 腾讯云 COS 配置
TENCENT_COS_SECRET_ID = os.getenv("TENCENT_COS_SECRET_ID", "")
TENCENT_COS_SECRET_KEY = os.getenv("TENCENT_COS_SECRET_KEY", "")
TENCENT_COS_REGION = os.getenv("TENCENT_COS_REGION", "")  # 例如: ap-guangzhou
TENCENT_COS_BUCKET_NAME = os.getenv("TENCENT_COS_BUCKET_NAME", "")
TENCENT_COS_DOMAIN = os.getenv("TENCENT_COS_DOMAIN", "")  # 自定义域名

# AWS S3 配置
AWS_S3_ACCESS_KEY_ID = os.getenv("AWS_S3_ACCESS_KEY_ID", "")
AWS_S3_SECRET_ACCESS_KEY = os.getenv("AWS_S3_SECRET_ACCESS_KEY", "")
AWS_S3_REGION = os.getenv("AWS_S3_REGION", "")  # 例如: us-east-1
AWS_S3_BUCKET_NAME = os.getenv("AWS_S3_BUCKET_NAME", "")
AWS_S3_DOMAIN = os.getenv("AWS_S3_DOMAIN", "")  # 自定义域名

# 通用配置
OSS_PREFIX = os.getenv("OSS_PREFIX", "uploads")  # OSS 中的路径前缀，例如: uploads
OSS_USE_HTTPS = os.getenv("OSS_USE_HTTPS", "true").lower() == "true"  # 是否使用 HTTPS

# 验证配置
def validate_oss_config() -> tuple[bool, str]:
    """验证 OSS 配置是否完整"""
    # 如果 OSS_TYPE 为空，表示不使用 OSS，直接返回 True
    if not OSS_TYPE:
        return True, ""
    
    if OSS_TYPE == "aliyun":
        if not all([ALIYUN_OSS_ACCESS_KEY_ID, ALIYUN_OSS_ACCESS_KEY_SECRET, ALIYUN_OSS_ENDPOINT, ALIYUN_OSS_BUCKET_NAME]):
            return False, "阿里云 OSS 配置不完整，请检查环境变量"
        return True, ""
    elif OSS_TYPE == "tencent":
        if not all([TENCENT_COS_SECRET_ID, TENCENT_COS_SECRET_KEY, TENCENT_COS_REGION, TENCENT_COS_BUCKET_NAME]):
            return False, "腾讯云 COS 配置不完整，请检查环境变量"
        return True, ""
    elif OSS_TYPE == "aws":
        if not all([AWS_S3_ACCESS_KEY_ID, AWS_S3_SECRET_ACCESS_KEY, AWS_S3_REGION, AWS_S3_BUCKET_NAME]):
            return False, "AWS S3 配置不完整，请检查环境变量"
        return True, ""
    else:
        return False, f"不支持的 OSS 类型: {OSS_TYPE}"

