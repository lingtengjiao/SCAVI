#!/usr/bin/env python3
"""测试 OSS 上传功能"""
import sys
import os
from pathlib import Path

# 添加项目路径
sys.path.insert(0, str(Path(__file__).parent))

from app.core.oss_service import oss_service
from app.core.oss_config import validate_oss_config

def test_oss_config():
    """测试 OSS 配置"""
    print("=" * 60)
    print("测试 OSS 配置")
    print("=" * 60)
    
    is_valid, error_msg = validate_oss_config()
    if not is_valid:
        print(f"❌ OSS 配置验证失败: {error_msg}")
        return False
    
    print("✅ OSS 配置验证通过")
    print(f"   OSS 类型: {oss_service.oss_type}")
    print(f"   Bucket: {oss_service.bucket_name}")
    print(f"   域名: {oss_service.domain}")
    print(f"   路径前缀: {oss_service.prefix}")
    print(f"   使用 HTTPS: {oss_service.use_https}")
    print(f"   服务状态: {'启用' if oss_service.enabled else '未启用'}")
    
    if not oss_service.enabled:
        print("❌ OSS 服务未启用，无法继续测试")
        return False
    
    return True

def test_oss_upload():
    """测试 OSS 文件上传"""
    print("\n" + "=" * 60)
    print("测试 OSS 文件上传")
    print("=" * 60)
    
    # 创建一个测试文件
    test_content = b"Hello, OSS! This is a test file for SCAVI CMS."
    test_filename = "test_oss_upload.txt"
    
    print(f"📤 准备上传测试文件: {test_filename}")
    print(f"   文件大小: {len(test_content)} 字节")
    
    try:
        # 上传文件
        file_url = oss_service.upload_file(
            test_content,
            test_filename,
            content_type="text/plain"
        )
        
        if file_url:
            print(f"✅ 文件上传成功!")
            print(f"   URL: {file_url}")
            
            # 验证 URL 格式
            if file_url.startswith("http://") or file_url.startswith("https://"):
                print(f"   ✅ URL 格式正确（OSS 地址）")
            elif file_url.startswith("/uploads/"):
                print(f"   ⚠️  URL 格式为本地路径（可能回退到本地存储）")
            else:
                print(f"   ⚠️  未知的 URL 格式")
            
            return True, file_url
        else:
            print("❌ 文件上传失败：返回 URL 为空")
            return False, None
            
    except Exception as e:
        print(f"❌ 文件上传异常: {str(e)}")
        import traceback
        traceback.print_exc()
        return False, None

def test_oss_delete(file_url):
    """测试 OSS 文件删除"""
    if not file_url:
        print("\n⚠️  跳过删除测试（上传失败）")
        return
    
    print("\n" + "=" * 60)
    print("测试 OSS 文件删除")
    print("=" * 60)
    
    print(f"🗑️  准备删除文件: {file_url}")
    
    try:
        success = oss_service.delete_file(file_url)
        if success:
            print("✅ 文件删除成功!")
        else:
            print("❌ 文件删除失败")
    except Exception as e:
        print(f"❌ 文件删除异常: {str(e)}")
        import traceback
        traceback.print_exc()

def main():
    """主测试函数"""
    print("\n" + "🚀 开始测试 OSS 功能" + "\n")
    
    # 测试配置
    if not test_oss_config():
        print("\n❌ 配置测试失败，请检查 .env 文件中的 OSS 配置")
        return
    
    # 测试上传
    success, file_url = test_oss_upload()
    
    # 测试删除（如果上传成功）
    if success:
        test_oss_delete(file_url)
    
    print("\n" + "=" * 60)
    if success:
        print("✅ 所有测试通过！OSS 功能正常工作")
    else:
        print("❌ 测试失败，请检查配置和网络连接")
    print("=" * 60 + "\n")

if __name__ == "__main__":
    main()

