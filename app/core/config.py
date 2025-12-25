"""环境变量配置"""
import os
from dotenv import load_dotenv

load_dotenv()

# 数据库配置
# 优先从环境变量读取，Docker 环境中默认使用服务名 "db"
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "suantian51")
DB_HOST = os.getenv("DB_HOST", "db")  # Docker 环境默认使用服务名，本地开发时通过环境变量覆盖
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME", "SCAVI")

DATABASE_URL = (
    f"mysql+aiomysql://{DB_USER}:{DB_PASSWORD}"
    f"@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"
)

# 安全配置
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-this-in-production")

# 管理后台配置
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "SCAVI")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "SCAVI123")

