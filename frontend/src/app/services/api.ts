/**
 * API 服务层 - 与后端 FastAPI 通信
 */

const API_BASE_URL = '/api';

// API 响应类型定义
export interface ApiCategory {
  id: number;
  name: string;
  slug: string;
  order: number;
  is_active: boolean;
}

export interface ApiTag {
  id: number;
  name: string;
  color: string;
  order: number;
  is_active: boolean;
}

export interface ApiProduct {
  id: number;
  name: string;
  slug: string | null;
  description: string | null;
  key_features: string[] | null;
  images: string[] | null;
  video: string | null;  // 独立的视频字段
  specs: Record<string, any> | null;  // specs 不再包含 video
  order: number;
  is_active: boolean;
  category_id: number | null;
  category?: ApiCategory;
  tags: ApiTag[];
}

export interface ApiHeroSlide {
  id: number;
  title: string;
  subtitle: string | null;
  image: string;
  description: string | null;
  link: string | null;
  button_text: string | null;
  text_color: string | null;
  order: number;
  is_active: boolean;
}

/**
 * 获取标签列表
 */
export async function fetchTags(): Promise<ApiTag[]> {
  const response = await fetch(`${API_BASE_URL}/tags`);
  if (!response.ok) {
    throw new Error(`Failed to fetch tags: ${response.statusText}`);
  }
  return response.json();
}

/**
 * 获取首页轮播图
 */
export async function fetchHeroSlides(): Promise<ApiHeroSlide[]> {
  const url = `${API_BASE_URL}/slides`;
  console.log(`[API] 获取轮播图列表: ${url}`);
  const response = await fetch(url);
  console.log(`[API] 轮播图列表响应: ${response.status} ${response.statusText}`);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[API] 获取轮播图列表失败: ${response.status} - ${errorText}`);
    throw new Error(`Failed to fetch hero slides: ${response.statusText}`);
  }
  
  const data = await response.json();
  console.log(`[API] 轮播图列表数据:`, { count: data.length, sample: data });
  return data;
}

/**
 * 获取分类列表
 */
export async function fetchCategories(): Promise<ApiCategory[]> {
  const url = `${API_BASE_URL}/categories`;
  console.log(`[API] 获取分类列表: ${url}`);
  const response = await fetch(url);
  console.log(`[API] 分类列表响应: ${response.status} ${response.statusText}`);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[API] 获取分类列表失败: ${response.status} - ${errorText}`);
    throw new Error(`Failed to fetch categories: ${response.statusText}`);
  }
  
  const data = await response.json();
  console.log(`[API] 分类列表数据:`, { count: data.length, sample: data });
  return data;
}

/**
 * 获取产品统计数据
 * @param includeInactive 是否包含未启用的产品（默认 false）
 */
export async function fetchProductStatistics(includeInactive: boolean = false): Promise<{
  total: number;
  by_category: Record<string, number>;
  include_inactive: boolean;
}> {
  const params = new URLSearchParams();
  if (includeInactive) {
    params.append('include_inactive', 'true');
  }
  
  const url = `${API_BASE_URL}/products/statistics${params.toString() ? '?' + params.toString() : ''}`;
  
  console.log(`[API] 获取产品统计数据: ${url}`);
  const response = await fetch(url);
  console.log(`[API] 产品统计数据响应: ${response.status} ${response.statusText}`);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[API] 获取产品统计数据失败: ${response.status} - ${errorText}`);
    throw new Error(`Failed to fetch product statistics: ${response.statusText}`);
  }
  
  const data = await response.json();
  console.log(`[API] 产品统计数据:`, data);
  return data;
}

/**
 * 获取产品列表
 * @param categoryId 可选的分类 ID，用于过滤产品
 * @param includeInactive 是否包含未启用的产品（默认 false，只返回启用的）
 */
export async function fetchProducts(categoryId?: number, includeInactive: boolean = false): Promise<ApiProduct[]> {
  const params = new URLSearchParams();
  if (categoryId) {
    params.append('category_id', categoryId.toString());
  }
  if (includeInactive) {
    params.append('include_inactive', 'true');
  }
  
  const url = `${API_BASE_URL}/products${params.toString() ? '?' + params.toString() : ''}`;
  
  console.log(`[API] 获取产品列表: ${url}`);
  const response = await fetch(url);
  console.log(`[API] 产品列表响应: ${response.status} ${response.statusText}`);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[API] 获取产品列表失败: ${response.status} - ${errorText}`);
    throw new Error(`Failed to fetch products: ${response.statusText}`);
  }
  
  const data = await response.json();
  console.log(`[API] 产品列表数据:`, { count: data.length, sample: data.slice(0, 2) });
  return data;
}

/**
 * 获取单个产品详情
 * @param productId 产品 ID
 */
export async function fetchProduct(productId: number): Promise<ApiProduct> {
  const response = await fetch(`${API_BASE_URL}/products/${productId}`);
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Product not found');
    }
    throw new Error(`Failed to fetch product: ${response.statusText}`);
  }
  return response.json();
}

/**
 * 将后端 API 产品格式转换为前端 ProductType 格式
 */
export function convertApiProductToProductType(apiProduct: ApiProduct): any {
  // 从 tags 中提取标签名称，如果没有则使用 key_features
  const tagNames = apiProduct.tags && apiProduct.tags.length > 0
    ? apiProduct.tags.map(tag => tag.name)
    : (apiProduct.key_features || []);
  
  // 处理图片数组：确保去重和过滤空值
  const images = apiProduct.images || [];
  const uniqueImages = Array.from(new Set(images.filter(img => img && img.trim())));
  
  // 使用独立的 video 字段，如果不存在则尝试从 specs.video 获取（向后兼容）
  const videoUrl = apiProduct.video || apiProduct.specs?.video || undefined;
  console.log(`[convertApiProductToProductType] 产品 ID=${apiProduct.id}, video字段:`, apiProduct.video, 'specs.video:', apiProduct.specs?.video, '最终video:', videoUrl);
  
  return {
    id: apiProduct.id,
    title: apiProduct.name,
    category: apiProduct.category?.name || 'Uncategorized',
    image: uniqueImages.length > 0 ? uniqueImages[0] : '',
    description: apiProduct.description || '',
    tags: tagNames,
    sku: apiProduct.slug || undefined,
    status: apiProduct.is_active ? 'active' : 'draft',  // 使用小写，与表单选项一致
    material: apiProduct.specs?.material || undefined,
    care: apiProduct.specs?.care || undefined,
    features: apiProduct.key_features || [],
    gallery: uniqueImages, // 使用去重后的图片数组
    video: videoUrl,  // 使用独立的 video 字段
    price: apiProduct.specs?.price || undefined,
    order: apiProduct.order || apiProduct.id, // 使用 order 字段，如果没有则使用 ID
  };
}

/**
 * 将后端 API HeroSlide 格式转换为前端 HeroSlide 格式
 */
export function convertApiHeroSlideToHeroSlide(apiSlide: ApiHeroSlide): any {
  return {
    id: apiSlide.id,
    image: apiSlide.image,
    title: apiSlide.title,
    subtitle: apiSlide.subtitle || '',
    description: apiSlide.description || '',
    link: apiSlide.link || '#',
    buttonText: apiSlide.button_text || 'Learn More',
    textColor: (apiSlide.text_color as 'white' | 'black') || 'white', // 使用后端返回的 text_color
    order: apiSlide.order,
    status: apiSlide.is_active ? 'active' : 'draft', // 转换 is_active 为 status
  };
}

/**
 * 将后端 API Tag 格式转换为前端 TagItem 格式
 */
export function convertApiTagToTagItem(apiTag: ApiTag, productCount: number = 0): any {
  return {
    id: `tag-${apiTag.id}`,
    name: apiTag.name,
    count: productCount,
    color: apiTag.color,
    order: apiTag.order,
  };
}

