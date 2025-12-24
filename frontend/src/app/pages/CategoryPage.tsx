import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ProductListPage as ProductListPageComponent } from "../components/ProductListPage";
import { useData } from "../context/DataContext";

export default function CategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const { products, categories, tags, loading: contextLoading } = useData();

  // 查找分类信息
  const category = categories.find(cat => cat._originalId === parseInt(categoryId || "0", 10));

  if (contextLoading) {
    return (
      <div className="min-h-screen font-sans text-gray-900 bg-white selection:bg-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!categoryId || !category) {
    return (
      <div className="min-h-screen font-sans text-gray-900 bg-white selection:bg-gray-200 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">分类不存在</p>
          <button
            onClick={() => navigate("/products")}
            className="text-gray-900 underline"
          >
            返回产品列表
          </button>
        </div>
      </div>
    );
  }

  // 使用所有产品数据，让 ProductListPageComponent 自己根据 selectedCategory 过滤
  // 这样 getCategoryCount 才能正确计算每个分类的产品数量
  return (
    <ProductListPageComponent
      products={products}
      categories={categories}
      tags={tags}
      selectedCategory={category.name}
      onProductClick={(product) => {
        console.log("[CategoryPage] 点击产品，准备跳转:", product.id, product.title);
        navigate(`/products/${product.id}`);
      }}
      onBack={() => {
        navigate("/products");
      }}
    />
  );
}

