import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminDashboard } from "../components/admin/AdminDashboard";
import { Toaster } from "../components/ui/sonner";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { getAllProducts, getAllCategories, getAllSlides } from "../services/adminApi";
import { convertApiProductToProductType, convertApiHeroSlideToHeroSlide, ApiCategory, ApiHeroSlide } from "../services/api";
import { ProductType } from "../components/Products";
import { Category, HeroSlide } from "../types/admin";

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading, logout } = useAuth();
  const { tags, refreshData, loading: dataLoading } = useData();
  const [adminProducts, setAdminProducts] = useState<ProductType[]>([]);
  const [adminCategories, setAdminCategories] = useState<Category[]>([]);
  const [adminBanners, setAdminBanners] = useState<HeroSlide[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingBanners, setLoadingBanners] = useState(true);

  // 从管理后台 API 获取所有产品（包括未启用的）
  useEffect(() => {
    const loadAdminProducts = async () => {
      if (!isAuthenticated) return;
      
      try {
        setLoadingProducts(true);
        console.log("[AdminDashboardPage] 从管理后台 API 获取所有产品...");
        const apiProducts = await getAllProducts();
        const convertedProducts = apiProducts.map(convertApiProductToProductType);
        console.log("[AdminDashboardPage] 管理后台产品数据:", {
          productsCount: convertedProducts.length,
          sampleProducts: convertedProducts.slice(0, 3).map(p => ({ id: p.id, title: p.title, category: p.category, status: p.status }))
        });
        setAdminProducts(convertedProducts);
      } catch (error) {
        console.error("[AdminDashboardPage] 获取管理后台产品失败:", error);
        setAdminProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    };

    if (isAuthenticated && !authLoading) {
      loadAdminProducts();
    }
  }, [isAuthenticated, authLoading]);

  // 从管理后台 API 获取所有类目（包括未启用的）
  useEffect(() => {
    const loadAdminCategories = async () => {
      if (!isAuthenticated) return;
      
      try {
        setLoadingCategories(true);
        console.log("[AdminDashboardPage] 从管理后台 API 获取所有类目...");
        const apiCategories: ApiCategory[] = await getAllCategories();
        const convertedCategories: Category[] = apiCategories.map((cat, index) => ({
          id: cat.slug || `category-${cat.id}`,
          name: cat.name,
          count: adminProducts.filter(p => p.category === cat.name).length,
          status: cat.is_active ? "Active" : "Inactive",
          order: cat.order || index + 1,
          _originalId: cat.id, // 保存原始的数字 ID
        }));
        console.log("[AdminDashboardPage] 管理后台类目数据:", {
          categoriesCount: convertedCategories.length,
          sampleCategories: convertedCategories.slice(0, 3).map(c => ({ id: c.id, name: c.name, status: c.status }))
        });
        setAdminCategories(convertedCategories);
      } catch (error) {
        console.error("[AdminDashboardPage] 获取管理后台类目失败:", error);
        setAdminCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };

    if (isAuthenticated && !authLoading) {
      loadAdminCategories();
    }
  }, [isAuthenticated, authLoading, adminProducts.length]); // 依赖 adminProducts.length 以便在产品加载后更新类目计数

  // 从管理后台 API 获取所有轮播图（包括未启用的）
  useEffect(() => {
    const loadAdminBanners = async () => {
      if (!isAuthenticated) return;
      
      try {
        setLoadingBanners(true);
        console.log("[AdminDashboardPage] 从管理后台 API 获取所有轮播图...");
        const apiBanners: ApiHeroSlide[] = await getAllSlides();
        const convertedBanners = apiBanners.map(convertApiHeroSlideToHeroSlide);
        console.log("[AdminDashboardPage] 管理后台轮播图数据:", {
          bannersCount: convertedBanners.length,
          sampleBanners: convertedBanners.slice(0, 3).map(b => ({ id: b.id, title: b.title, status: b.status }))
        });
        setAdminBanners(convertedBanners);
      } catch (error) {
        console.error("[AdminDashboardPage] 获取管理后台轮播图失败:", error);
        setAdminBanners([]);
      } finally {
        setLoadingBanners(false);
      }
    };

    if (isAuthenticated && !authLoading) {
      loadAdminBanners();
    }
  }, [isAuthenticated, authLoading]);

  // 权限检查
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/admin/login");
    }
  }, [isAuthenticated, authLoading, navigate]);

  // 如果未认证，显示加载或重定向
  if (authLoading) {
    return (
      <div className="min-h-screen font-sans text-gray-900 bg-white selection:bg-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">验证中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // 会被 useEffect 重定向
  }

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // 如果还在加载，显示加载状态
  if (loadingProducts || loadingCategories || loadingBanners) {
    return (
      <div className="min-h-screen font-sans text-gray-900 bg-white selection:bg-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">加载数据...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <AdminDashboard
        onLogout={handleLogout}
        products={adminProducts}
        categories={adminCategories}
        tags={tags}
        banners={adminBanners}
        onProductsUpdate={async () => { 
          // 重新加载管理后台产品
          const apiProducts = await getAllProducts();
          const convertedProducts = apiProducts.map(convertApiProductToProductType);
          setAdminProducts(convertedProducts);
          // 更新类目计数
          const apiCategories: ApiCategory[] = await getAllCategories();
          const convertedCategories: Category[] = apiCategories.map((cat, index) => ({
            id: cat.slug || `category-${cat.id}`,
            name: cat.name,
            count: convertedProducts.filter(p => p.category === cat.name).length,
            status: cat.is_active ? "Active" : "Inactive",
            order: cat.order || index + 1,
            _originalId: cat.id,
          }));
          setAdminCategories(convertedCategories);
          await refreshData(); 
        }}
        onCategoriesUpdate={async () => { 
          // 重新加载管理后台类目
          const apiCategories: ApiCategory[] = await getAllCategories();
          const convertedCategories: Category[] = apiCategories.map((cat, index) => ({
            id: cat.slug || `category-${cat.id}`,
            name: cat.name,
            count: adminProducts.filter(p => p.category === cat.name).length,
            status: cat.is_active ? "Active" : "Inactive",
            order: cat.order || index + 1,
            _originalId: cat.id,
          }));
          setAdminCategories(convertedCategories);
          await refreshData(); 
        }}
        onTagsUpdate={async () => { await refreshData(); }}
        onBannersUpdate={async () => { 
          // 重新加载管理后台轮播图
          const apiBanners: ApiHeroSlide[] = await getAllSlides();
          const convertedBanners = apiBanners.map(convertApiHeroSlideToHeroSlide);
          setAdminBanners(convertedBanners);
          await refreshData(); 
        }}
      />
      <Toaster />
    </>
  );
}

