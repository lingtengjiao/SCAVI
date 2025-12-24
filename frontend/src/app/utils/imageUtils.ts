/**
 * 图片工具函数 - 处理 OSS URL 预览
 */

/**
 * 将 OSS URL 转换为代理 URL（用于预览，解决 CORS 问题）
 * 如果是本地路径，直接返回
 */
export function getImagePreviewUrl(url: string | null | undefined): string {
  if (!url) return '';
  
  // 如果是 OSS URL（以 http:// 或 https:// 开头），使用代理
  if (url.startsWith('http://') || url.startsWith('https://')) {
    // 从 OSS URL 中提取路径部分
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname.substring(1); // 移除开头的 /
      return `/api/proxy/oss/${path}`;
    } catch (e) {
      console.error('无法解析 OSS URL:', url, e);
      return url; // 如果解析失败，返回原 URL
    }
  }
  
  // 本地路径直接返回
  return url;
}

/**
 * 获取最终的文件 URL（用于保存到数据库，不使用代理）
 */
export function getFinalFileUrl(url: string | null | undefined): string {
  if (!url) return '';
  
  // 如果是代理 URL，转换为原始 OSS URL
  if (url.startsWith('/api/proxy/oss/')) {
    const path = url.replace('/api/proxy/oss/', '');
    // 根据配置构建 OSS URL（这里需要从环境变量或配置中获取）
    // 暂时返回原路径，让后端处理
    return path;
  }
  
  return url;
}

