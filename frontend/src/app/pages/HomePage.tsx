import React from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { Hero } from "../components/Hero";
import { Products, ProductType } from "../components/Products";
import { FactoryContact } from "../components/FactoryContact";
import { Footer } from "../components/Footer";
import { Toaster } from "../components/ui/sonner";
import { useData } from "../context/DataContext";

export default function HomePage() {
  const navigate = useNavigate();
  const { products, categories, tags, banners, loading } = useData();

  const handleNavigation = (href: string) => {
    if (href === "admin") {
      navigate("/admin/login");
      return;
    }

    const targetId = href.replace("#", "");
    const element = document.getElementById(targetId);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  const handleProductSelect = (product: ProductType) => {
    console.log("HomePage - handleProductSelect 被调用:", { productId: product?.id, productTitle: product?.title });
    if (product && product.id) {
      console.log("跳转到产品详情页:", `/products/${product.id}`);
      navigate(`/products/${product.id}`);
    } else {
      console.warn("无法跳转：产品数据无效", product);
    }
  };
  
  // 调试日志
  React.useEffect(() => {
    console.log("HomePage - 产品数据:", {
      productsLength: products.length,
      categoriesLength: categories.length,
      tagsLength: tags.length,
      loading
    });
  }, [products.length, categories.length, tags.length, loading]);

  if (loading) {
    return (
      <div className="min-h-screen font-sans text-gray-900 bg-white selection:bg-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
        <Toaster />
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans text-gray-900 bg-white selection:bg-gray-200">
      <Navbar onNavigate={handleNavigation} />
      <main>
        <Hero banners={banners} />
        <Products
          products={products}
          categories={categories}
          tags={tags}
          maxDisplay={8}
          onProductSelect={handleProductSelect}
          onViewAllProducts={() => {
            navigate("/products");
          }}
        />
        <FactoryContact />
      </main>
      <Footer />
      <Toaster />
    </div>
  );
}

