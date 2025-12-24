/**
 * 管理后台 API 服务 - 需要认证的 CRUD 操作
 */

const ADMIN_API_BASE_URL = '/api/admin';

// 请求配置
async function authenticatedFetch(url: string, options: RequestInit = {}) {
  console.log(`[API] 请求: ${options.method || 'GET'} ${url}`, options.body ? (options.body instanceof FormData ? '[FormData]' : JSON.parse(options.body as string)) : null);
  
  // 如果是 FormData，不要设置 Content-Type，让浏览器自动设置（包含 boundary）
  const isFormData = options.body instanceof FormData;
  const headers: HeadersInit = isFormData 
    ? { ...options.headers } // FormData 时不设置 Content-Type
    : { 'Content-Type': 'application/json', ...options.headers };
  
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // 包含 cookies/session
  });

  console.log(`[API] 响应: ${response.status} ${response.statusText}`);

  if (response.status === 401) {
    // 未授权，清除登录状态并跳转到登录页
    localStorage.removeItem('scavi_admin_auth');
    window.location.href = '/admin/login';
    throw new Error('未授权，请重新登录');
  }

  if (!response.ok) {
    let errorData;
    try {
      const text = await response.text();
      console.error(`[API] 错误响应内容:`, text);
      errorData = JSON.parse(text);
    } catch {
      errorData = { detail: `请求失败 (${response.status} ${response.statusText})` };
    }
    const errorMessage = errorData.detail || errorData.message || `请求失败 (${response.status})`;
    console.error(`[API] 错误:`, errorMessage);
    throw new Error(errorMessage);
  }

  const result = await response.json();
  console.log(`[API] 成功响应:`, result);
  return result;
}

// ==================== 文件上传 ====================
/**
 * 上传临时文件（用于预览，上传到临时目录）
 */
export async function uploadTempFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  
  console.log('[uploadTempFile] ========== 开始上传临时文件 ==========');
  console.log('[uploadTempFile] 文件信息:', {
    name: file.name,
    type: file.type,
    size: file.size,
    lastModified: new Date(file.lastModified).toISOString()
  });
  
  try {
    const response = await authenticatedFetch(`${ADMIN_API_BASE_URL}/upload-temp`, {
      method: 'POST',
      body: formData,
      headers: {},
    });
    
    const fileUrl = response?.url || response?.data?.url;
    if (!fileUrl) {
      console.error('[uploadTempFile] ❌ 响应中没有URL字段:', response);
      throw new Error('上传失败：服务器未返回文件URL');
    }
    
    // 如果是 OSS URL（以 http:// 或 https:// 开头），直接使用
    // 如果是本地路径（以 /uploads/ 开头），直接使用
    let finalUrl = fileUrl;
    if (!fileUrl.startsWith('http://') && !fileUrl.startsWith('https://') && !fileUrl.startsWith('/uploads/')) {
      finalUrl = `/uploads/${fileUrl}`;
    }
    
    console.log('[uploadTempFile] ✅ 临时文件上传成功');
    console.log('[uploadTempFile] URL:', finalUrl);
    console.log('[uploadTempFile] ========================================');
    
    return finalUrl;
  } catch (error: any) {
    console.error('[uploadTempFile] ❌ 上传失败:', error);
    throw error;
  }
}

/**
 * 将临时文件移动到正式位置（提交产品时调用）
 */
export async function moveTempFilesToFinal(tempUrls: string[]): Promise<string[]> {
  console.log('[moveTempFilesToFinal] ========== 移动临时文件 ==========');
  console.log('[moveTempFilesToFinal] 临时文件数量:', tempUrls.length);
  
  try {
    const response = await authenticatedFetch(`${ADMIN_API_BASE_URL}/move-temp-to-final`, {
      method: 'POST',
      body: JSON.stringify({ temp_urls: tempUrls }),
    });
    
    const finalUrls = response?.urls || [];
    console.log('[moveTempFilesToFinal] ✅ 文件移动成功');
    console.log('[moveTempFilesToFinal] 正式文件数量:', finalUrls.length);
    console.log('[moveTempFilesToFinal] ========================================');
    
    return finalUrls;
  } catch (error: any) {
    console.error('[moveTempFilesToFinal] ❌ 移动失败:', error);
    throw error;
  }
}

/**
 * 上传文件（图片或视频）- 直接上传到正式位置（保留用于兼容）
 */
export async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  
  console.log('[uploadFile] ========== 开始上传文件 ==========');
  console.log('[uploadFile] 文件信息:', {
    name: file.name,
    type: file.type,
    size: file.size,
    lastModified: new Date(file.lastModified).toISOString()
  });
  
  try {
    const response = await authenticatedFetch(`${ADMIN_API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
      headers: {}, // 不要设置 Content-Type，让浏览器自动设置（包含 boundary）
    });
    
    console.log('[uploadFile] 上传响应:', response);
    console.log('[uploadFile] 响应类型:', typeof response);
    console.log('[uploadFile] 响应键:', Object.keys(response));
    
    // 后端返回的是 { url: "/uploads/filename" 或 "https://..." (OSS URL), filename: "filename" }
    const fileUrl = response?.url || response?.data?.url;
    if (!fileUrl) {
      console.error('[uploadFile] ❌ 响应中没有URL字段:', response);
      throw new Error('上传失败：服务器未返回文件URL');
    }
    
    // 如果是 OSS URL（以 http:// 或 https:// 开头），直接使用
    // 如果是本地路径（以 /uploads/ 开头），直接使用
    // 否则添加 /uploads/ 前缀（兼容旧格式）
    let finalUrl = fileUrl;
    if (!fileUrl.startsWith('http://') && !fileUrl.startsWith('https://') && !fileUrl.startsWith('/uploads/')) {
      finalUrl = `/uploads/${fileUrl}`;
    }
    
    console.log('[uploadFile] ✅ 文件上传成功');
    console.log('[uploadFile] 原始URL:', fileUrl);
    console.log('[uploadFile] 最终URL:', finalUrl);
    console.log('[uploadFile] ========================================');
    
    return finalUrl; // 返回文件 URL
  } catch (error: any) {
    console.error('[uploadFile] ❌ 上传失败:', error);
    console.error('[uploadFile] 错误详情:', {
      message: error?.message,
      stack: error?.stack,
      response: error?.response
    });
    throw error;
  }
}

/**
 * 上传视频文件（专门用于产品视频）
 */
export async function uploadVideo(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  
  console.log('[uploadVideo] ========== 开始上传视频 ==========');
  console.log('[uploadVideo] 视频信息:', {
    name: file.name,
    type: file.type,
    size: file.size,
    sizeMB: (file.size / 1024 / 1024).toFixed(2) + 'MB',
    lastModified: new Date(file.lastModified).toISOString()
  });
  
  try {
    const response = await authenticatedFetch(`${ADMIN_API_BASE_URL}/upload-video`, {
      method: 'POST',
      body: formData,
      headers: {}, // 不要设置 Content-Type，让浏览器自动设置（包含 boundary）
    });
    
    console.log('[uploadVideo] 上传响应:', response);
    
    // 后端返回的是 { success: true, url: "/uploads/filename" 或 "https://..." (OSS URL), filename: "filename", size: 12345, message: "视频上传成功" }
    const videoUrl = response?.url;
    if (!videoUrl) {
      console.error('[uploadVideo] ❌ 响应中没有URL字段:', response);
      throw new Error('上传失败：服务器未返回视频URL');
    }
    
    // 如果是 OSS URL（以 http:// 或 https:// 开头），直接使用
    // 如果是本地路径（以 /uploads/ 开头），直接使用
    // 否则添加 /uploads/ 前缀（兼容旧格式）
    let finalUrl = videoUrl;
    if (!videoUrl.startsWith('http://') && !videoUrl.startsWith('https://') && !videoUrl.startsWith('/uploads/')) {
      finalUrl = `/uploads/${videoUrl}`;
    }
    
    console.log('[uploadVideo] ✅ 视频上传成功');
    console.log('[uploadVideo] 原始URL:', videoUrl);
    console.log('[uploadVideo] 最终URL:', finalUrl);
    console.log('[uploadVideo] 文件大小:', response?.size, '字节');
    console.log('[uploadVideo] ========================================');
    
    return finalUrl; // 返回视频 URL
  } catch (error: any) {
    console.error('[uploadVideo] ❌ 视频上传失败:', error);
    console.error('[uploadVideo] 错误详情:', {
      message: error?.message,
      stack: error?.stack,
      response: error?.response
    });
    throw error;
  }
}

// ==================== 产品管理 ====================
/**
 * 获取所有产品（管理后台用，包括未启用的）
 */
export async function getAllProducts() {
  return authenticatedFetch(`${ADMIN_API_BASE_URL}/products`);
}

export interface ProductCreateData {
  name: string;
  slug?: string;
  description?: string;
  category_id?: number;
  key_features?: string[];
  images?: string[];
  video?: string;  // 独立的视频字段
  specs?: Record<string, any>;  // specs 不再包含 video
  order?: number;
  is_active?: boolean;
  tag_ids?: number[];
}

export interface ProductUpdateData extends Partial<ProductCreateData> {}

export async function createProduct(data: ProductCreateData) {
  return authenticatedFetch(`${ADMIN_API_BASE_URL}/products`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateProduct(productId: number, data: ProductUpdateData) {
  return authenticatedFetch(`${ADMIN_API_BASE_URL}/products/${productId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteProduct(productId: number) {
  return authenticatedFetch(`${ADMIN_API_BASE_URL}/products/${productId}`, {
    method: 'DELETE',
  });
}

// ==================== 分类管理 ====================
export interface CategoryCreateData {
  name: string;
  slug: string;
  order?: number;
  is_active?: boolean;
}

export interface CategoryUpdateData extends Partial<CategoryCreateData> {}

/**
 * 获取所有分类（管理后台用，包括未启用的）
 */
export async function getAllCategories() {
  return authenticatedFetch(`${ADMIN_API_BASE_URL}/categories`);
}

export async function createCategory(data: CategoryCreateData) {
  return authenticatedFetch(`${ADMIN_API_BASE_URL}/categories`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCategory(categoryId: number, data: CategoryUpdateData) {
  return authenticatedFetch(`${ADMIN_API_BASE_URL}/categories/${categoryId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteCategory(categoryId: number) {
  return authenticatedFetch(`${ADMIN_API_BASE_URL}/categories/${categoryId}`, {
    method: 'DELETE',
  });
}

// ==================== 标签管理 ====================
export interface TagCreateData {
  name: string;
  color?: string;
  order?: number;
  is_active?: boolean;
}

export interface TagUpdateData extends Partial<TagCreateData> {}

export async function createTag(data: TagCreateData) {
  return authenticatedFetch(`${ADMIN_API_BASE_URL}/tags`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTag(tagId: number, data: TagUpdateData) {
  return authenticatedFetch(`${ADMIN_API_BASE_URL}/tags/${tagId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteTag(tagId: number) {
  return authenticatedFetch(`${ADMIN_API_BASE_URL}/tags/${tagId}`, {
    method: 'DELETE',
  });
}

// ==================== 轮播图管理 ====================
export interface HeroSlideCreateData {
  title: string;
  subtitle?: string;
  image: string;
  description?: string;
  link?: string;
  button_text?: string;
  text_color?: string;
  order?: number;
  is_active?: boolean;
}

export interface HeroSlideUpdateData extends Partial<HeroSlideCreateData> {}

/**
 * 获取所有轮播图（管理后台用，包括未启用的）
 */
export async function getAllSlides() {
  return authenticatedFetch(`${ADMIN_API_BASE_URL}/slides`);
}

export async function createHeroSlide(data: HeroSlideCreateData) {
  return authenticatedFetch(`${ADMIN_API_BASE_URL}/slides`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateHeroSlide(slideId: number, data: HeroSlideUpdateData) {
  return authenticatedFetch(`${ADMIN_API_BASE_URL}/slides/${slideId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteHeroSlide(slideId: number) {
  return authenticatedFetch(`${ADMIN_API_BASE_URL}/slides/${slideId}`, {
    method: 'DELETE',
  });
}

