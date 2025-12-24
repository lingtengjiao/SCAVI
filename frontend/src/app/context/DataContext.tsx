import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ProductType } from "../components/Products";
import { Category, TagItem, HeroSlide } from "../types/admin";
import {
  fetchHeroSlides,
  fetchCategories,
  fetchProducts,
  fetchTags,
  convertApiProductToProductType,
  convertApiHeroSlideToHeroSlide,
  convertApiTagToTagItem,
} from "../services/api";
import { toast } from "sonner";
// 不再导入假数据

interface DataContextType {
  products: ProductType[];
  categories: Category[];
  tags: TagItem[];
  banners: HeroSlide[];
  loading: boolean;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<ProductType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [banners, setBanners] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log("[DataContext] 开始加载数据...");
      
      const [heroSlidesData, categoriesData, productsData, tagsData] = await Promise.all([
        fetchHeroSlides().catch((err) => {
          console.error("[DataContext] 获取轮播图失败:", err);
          toast.error("无法加载轮播图数据");
          return [];
        }),
        fetchCategories().catch((err) => {
          console.error("[DataContext] 获取分类失败:", err);
          toast.error("无法加载分类数据");
          return [];
        }),
        fetchProducts(undefined, false).catch((err) => {
          console.error("[DataContext] 获取产品失败:", err);
          toast.error("无法加载产品数据");
          return [];
        }),
        fetchTags().catch((err) => {
          console.error("[DataContext] 获取标签失败:", err);
          toast.error("无法加载标签数据");
          return [];
        }),
      ]);
      
      console.log("[DataContext] 数据加载完成:", {
        heroSlides: heroSlidesData.length,
        categories: categoriesData.length,
        products: productsData.length,
        tags: tagsData.length,
      });

      const convertedBanners = heroSlidesData.map(convertApiHeroSlideToHeroSlide);
      console.log("轮播图数据加载：", {
        apiData: heroSlidesData.length,
        converted: convertedBanners.length,
        banners: convertedBanners
      });
      setBanners(convertedBanners.length > 0 ? convertedBanners : []);

      const convertedCategories: Category[] = categoriesData.map((cat, index) => ({
        id: cat.slug || `category-${cat.id}`,
        name: cat.name,
        count: productsData.filter(p => p.category_id === cat.id).length,
        status: cat.is_active ? "Active" : "Inactive",
        order: cat.order || index + 1,
        _originalId: cat.id, // 保存原始的数字 ID
      }));
      setCategories(convertedCategories.length > 0 ? convertedCategories : []);

      const convertedProducts = productsData.map(convertApiProductToProductType);
      // 只使用从 API 获取的产品数据，不使用假数据
      console.log("========== DataContext - 产品数据转换 ==========");
      console.log("产品数据:", {
        apiProductsCount: productsData.length,
        convertedProductsCount: convertedProducts.length,
        allProductIds: convertedProducts.map(p => p.id),
        allProductCategories: [...new Set(convertedProducts.map(p => p.category))],
      });
      
      // 按分类统计产品数量
      const categoryCounts: Record<string, number> = {};
      convertedProducts.forEach(p => {
        const catName = p.category || 'Uncategorized';
        categoryCounts[catName] = (categoryCounts[catName] || 0) + 1;
      });
      console.log("按分类统计:", categoryCounts);
      
      if (convertedProducts.length === 0) {
        console.warn("⚠️ 警告：没有从 API 获取到任何产品数据！");
        toast.warning("没有产品数据，请检查数据库或联系管理员");
      } else {
        console.log(`✅ 成功加载 ${convertedProducts.length} 个产品`);
      }
      console.log("================================================");
      
      setProducts(convertedProducts);

      // 计算每个标签关联的产品数量
      const tagsWithCounts = tagsData.map(tag => {
        const productCount = productsData.filter(p => 
          p.tags && p.tags.some(t => t.id === tag.id)
        ).length;
        return convertApiTagToTagItem(tag, productCount);
      });
      setTags(tagsWithCounts);

    } catch (error) {
      console.error("Failed to load data from API:", error);
      toast.error("无法加载数据");
      // 不设置假数据，保持空数组
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <DataContext.Provider value={{ products, categories, tags, banners, loading, refreshData: loadData }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}

