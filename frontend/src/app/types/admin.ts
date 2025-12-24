/**
 * Shared type definitions for Admin Dashboard
 * This ensures type consistency across all admin components and the main application
 */

export interface Category {
  id: string; // 前端使用的 ID（slug）
  name: string;
  count: number;
  status: string;
  order: number;
  _originalId?: number; // 后端数据库的数字 ID（用于 API 调用）
}

export interface TagItem {
  id: string;
  name: string;
  count: number;
  color: string;
  order: number;
}

export interface HeroSlide {
  id: number;
  image: string;
  title: string;
  subtitle: string;
  description: string;
  link: string;
  buttonText: string;
  order?: number;
  textColor?: 'white' | 'black'; // Text color for optimal contrast
  status?: 'active' | 'draft'; // Status field (Active/Draft)
}

// Re-export for convenience
export type { Category as AdminCategory, TagItem as AdminTag, HeroSlide as Banner };