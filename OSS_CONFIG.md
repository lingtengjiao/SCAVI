# OSS 对象存储配置指南

本文档说明如何配置 OSS（对象存储服务）来存储图片和视频文件。

## 支持的 OSS 服务

- **阿里云 OSS**（默认）
- 腾讯云 COS
- AWS S3

## 配置步骤

### 1. 安装 OSS SDK

根据你使用的 OSS 服务，安装对应的 SDK：

#### 阿里云 OSS（默认）
```bash
pip install oss2
```

#### 腾讯云 COS
```bash
pip install cos-python-sdk-v5
```

#### AWS S3
```bash
pip install boto3
```

### 2. 配置环境变量

在项目根目录的 `.env` 文件中添加以下配置：

#### 阿里云 OSS 配置（推荐）

```env
# OSS 类型
OSS_TYPE=aliyun

# 阿里云 OSS 配置
ALIYUN_OSS_ACCESS_KEY_ID=your_access_key_id
ALIYUN_OSS_ACCESS_KEY_SECRET=your_access_key_secret
ALIYUN_OSS_ENDPOINT=oss-cn-hangzhou.aliyuncs.com
ALIYUN_OSS_BUCKET_NAME=your-bucket-name
ALIYUN_OSS_BUCKET_DOMAIN=https://cdn.example.com  # 可选：自定义域名

# 通用配置
OSS_PREFIX=uploads  # OSS 中的路径前缀
OSS_USE_HTTPS=true  # 是否使用 HTTPS
```

#### 腾讯云 COS 配置

```env
# OSS 类型
OSS_TYPE=tencent

# 腾讯云 COS 配置
TENCENT_COS_SECRET_ID=your_secret_id
TENCENT_COS_SECRET_KEY=your_secret_key
TENCENT_COS_REGION=ap-guangzhou
TENCENT_COS_BUCKET_NAME=your-bucket-name
TENCENT_COS_DOMAIN=https://cdn.example.com  # 可选：自定义域名

# 通用配置
OSS_PREFIX=uploads
OSS_USE_HTTPS=true
```

#### AWS S3 配置

```env
# OSS 类型
OSS_TYPE=aws

# AWS S3 配置
AWS_S3_ACCESS_KEY_ID=your_access_key_id
AWS_S3_SECRET_ACCESS_KEY=your_secret_access_key
AWS_S3_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-bucket-name
AWS_S3_DOMAIN=https://cdn.example.com  # 可选：自定义域名

# 通用配置
OSS_PREFIX=uploads
OSS_USE_HTTPS=true
```

### 3. 获取 OSS 凭证

#### 阿里云 OSS

1. 登录 [阿里云控制台](https://oss.console.aliyun.com/)
2. 创建 Bucket（存储空间）
3. 在 [访问控制](https://ram.console.aliyun.com/manage/ak) 中创建 AccessKey
4. 记录 AccessKey ID 和 AccessKey Secret

#### 腾讯云 COS

1. 登录 [腾讯云控制台](https://console.cloud.tencent.com/cos)
2. 创建存储桶
3. 在 [API 密钥管理](https://console.cloud.tencent.com/cam/capi) 中创建密钥
4. 记录 SecretId 和 SecretKey

#### AWS S3

1. 登录 [AWS 控制台](https://console.aws.amazon.com/)
2. 创建 S3 Bucket
3. 在 [IAM](https://console.aws.amazon.com/iam/) 中创建用户并生成访问密钥
4. 记录 Access Key ID 和 Secret Access Key

### 4. 配置 Bucket 权限

确保 Bucket 允许公共读取（用于前端访问图片和视频）：

#### 阿里云 OSS
- 在 Bucket 的"读写权限"中设置为"公共读"

#### 腾讯云 COS
- 在存储桶的"权限管理"中设置为"公有读私有写"

#### AWS S3
- 在 Bucket 策略中添加公共读取权限

### 5. 配置自定义域名（可选）

为了更好的性能和 CDN 加速，建议配置自定义域名：

1. 在 OSS 控制台中绑定自定义域名
2. 配置 CDN（可选）
3. 在 `.env` 文件中设置 `*_DOMAIN` 变量

### 6. 验证配置

启动服务后，检查日志中是否有以下信息：

```
阿里云 OSS 客户端初始化成功: https://your-bucket.oss-cn-hangzhou.aliyuncs.com
```

如果看到 "OSS 配置验证失败" 或 "将使用本地存储模式"，请检查环境变量配置。

## 文件存储结构

文件在 OSS 中的存储路径格式：

```
uploads/2024/12/15/20241215_143022_filename.jpg
```

- `uploads/` - 路径前缀（可通过 `OSS_PREFIX` 配置）
- `2024/12/15/` - 按日期组织的目录
- `20241215_143022_filename.jpg` - 带时间戳的文件名

## 回退机制

如果 OSS 配置不完整或上传失败，系统会自动回退到本地存储模式，确保服务正常运行。

## 注意事项

1. **安全性**：不要将 `.env` 文件提交到版本控制系统
2. **成本**：OSS 存储和流量会产生费用，注意监控使用量
3. **备份**：建议定期备份重要文件
4. **CDN**：配置 CDN 可以加速文件访问并降低流量成本

## 故障排查

### OSS 上传失败

1. 检查环境变量是否正确配置
2. 检查 AccessKey/SecretKey 是否有效
3. 检查 Bucket 名称和区域是否正确
4. 检查网络连接是否正常
5. 查看服务日志获取详细错误信息

### 文件无法访问

1. 检查 Bucket 的公共读取权限
2. 检查自定义域名是否正确配置
3. 检查 CDN 配置（如果使用）
4. 检查文件 URL 是否正确

