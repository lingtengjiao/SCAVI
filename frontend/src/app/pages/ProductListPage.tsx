import React from "react";
import { useNavigate } from "react-router-dom";
import { ProductListPage as ProductListPageComponent } from "../components/ProductListPage";
import { useData } from "../context/DataContext";

export default function ProductListPage() {
  const navigate = useNavigate();
  const { products, categories, tags, loading } = useData();
  
  if (loading) {
    return (
      <div className="min-h-screen font-sans text-gray-900 bg-white selection:bg-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <ProductListPageComponent
      products={products}
      categories={categories}
      tags={tags}
      onProductClick={(product) => {
        console.log("[ProductListPage] 点击产品，准备跳转:", product.id, product.title);
        navigate(`/products/${product.id}`);
      }}
      onBack={() => {
        navigate("/");
      }}
    />
  );
}

