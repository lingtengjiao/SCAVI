import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Category, TagItem } from "../types/admin";

export interface ProductType {
  id: number;
  title: string;
  category: string;
  image: string;
  description: string;
  tags?: string[];
  // Extended fields for admin
  sku?: string;
  status?: string;
  material?: string;
  care?: string;
  features?: string[];
  gallery?: string[];
  video?: string;
  price?: string;
  order?: number; // Display order
}

// Fallback subcategories for when tags are not provided
const defaultSubCategories: Record<string, string[]> = {
    "All": ["New Arrivals", "Best Sellers", "Sale", "Limited Edition"],
    "Bra": ["Wireless", "Underwire", "Push-up", "Bralette", "Lace"],
    "Panty": ["Brief", "Thong", "Boyshort", "Seamless"],
    "Sportswear": ["Leggings", "Sports Bra", "Tops", "Sets"],
    "Bra Accessories": ["Straps", "Extenders", "Pads"],
    "Shapewear": ["Bodysuit", "Control Panty", "Waist Trainer"],
    "Swimwear": ["One-Piece", "Bikini", "Cover-up"]
};

// 假数据已移除，现在只使用从 API 获取的真实数据
// export const products: ProductType[] = [...]; // 已删除假数据

interface ProductsProps {
  onProductSelect?: (product: ProductType) => void;
  onViewAllProducts?: () => void;
  products?: ProductType[];
  categories?: Category[];
  tags?: TagItem[];
  maxDisplay?: number; // 最大显示数量（用于首页限制显示）
}

export function Products({ onProductSelect, onViewAllProducts, products: productsProp, categories: categoriesProp, tags: tagsProp, maxDisplay }: ProductsProps) {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeSubCategory, setActiveSubCategory] = useState<string | null>(null);

  // 只使用传入的产品数据，不使用假数据
  const productsData = productsProp || [];
  
  // 调试日志
  React.useEffect(() => {
    console.log("Products 组件 - 接收到的产品数据:", {
      productsPropLength: productsProp?.length || 0,
      productsDataLength: productsData.length,
      hasOnProductSelect: !!onProductSelect,
      products: productsData.slice(0, 3).map(p => ({ id: p.id, title: p.title }))
    });
  }, [productsProp, productsData.length, onProductSelect]);
  
  // Build category list with "All" option at the beginning
  const activeCategoriesList = categoriesProp 
    ? categoriesProp
        .filter(cat => cat.status === "Active")
        .sort((a, b) => a.order - b.order)
    : [];
  
  const displayCategories = ["All", ...activeCategoriesList.map(c => c.name)];

  const filteredProducts = productsData
    .filter(product => {
      const matchCategory = activeCategory === "All" || product.category === activeCategory;
      const matchTag = !activeSubCategory || (product.tags && product.tags.includes(activeSubCategory));
      return matchCategory && matchTag;
    })
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  // 如果指定了 maxDisplay，只显示前 N 个产品（用于首页）
  const displayedProducts = maxDisplay && maxDisplay > 0 
    ? filteredProducts.slice(0, maxDisplay)
    : filteredProducts;

  // Get tags that are actually used in the current category
  // 获取当前分类下产品实际使用的标签
  const productsInCurrentCategory = productsData.filter(product => 
    activeCategory === "All" || product.category === activeCategory
  );
  
  const usedTagsInCategory = new Set<string>();
  productsInCurrentCategory.forEach(product => {
    if (product.tags && product.tags.length > 0) {
      product.tags.forEach(tag => usedTagsInCategory.add(tag));
    }
  });

  // Filter tags to only show those used in current category
  // 只显示当前分类下实际使用的标签
  const currentSubTags = tagsProp 
    ? tagsProp
        .filter(tag => usedTagsInCategory.has(tag.name)) // 只保留实际使用的标签
        .sort((a, b) => a.order - b.order)
        .map(tag => tag.name)
    : (defaultSubCategories[activeCategory] || []).filter(tag => usedTagsInCategory.has(tag));

  return (
    <section id="products" className="py-24 md:py-32 bg-white">
      <div className="container mx-auto px-6">
        
        {/* Header Section - Optimized Layout */}
        <div className="mb-16 md:mb-20">
          {/* Title Area */}
          <div className="mb-12">
            <span className="text-gray-400 uppercase tracking-[0.3em] text-[10px] font-medium mb-3 block">
              Collection 2025
            </span>
            <h2 className="text-5xl md:text-6xl font-serif text-gray-900 leading-tight tracking-tight">
              The Collection
            </h2>
          </div>
          
          {/* Category Navigation - Horizontal Layout */}
          <div className="space-y-8">
            {/* Main Categories - Clean tabs */}
            <div className="flex flex-wrap items-center gap-x-10 gap-y-3 border-b border-gray-200 pb-1">
              {displayCategories.map((category) => {
                const categoryObj = category === "All" 
                  ? null 
                  : activeCategoriesList.find(c => c.name === category);
                
                return (
                <button
                  key={category}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (category === "All") {
                        setActiveCategory("All");
                        setActiveSubCategory(null);
                      } else if (categoryObj && categoryObj._originalId) {
                        // 跳转到分类页面
                        navigate(`/categories/${categoryObj._originalId}`);
                      } else {
                        setActiveCategory(category);
                        setActiveSubCategory(null);
                      }
                    }}
                  className={`text-sm uppercase tracking-[0.15em] transition-all duration-300 relative pb-4 ${
                    activeCategory === category
                      ? "text-gray-900 font-semibold"
                      : "text-gray-400 hover:text-gray-700 font-medium"
                  }`}
                >
                  {category}
                  {activeCategory === category && (
                    <motion.div 
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-900"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
                );
              })}
            </div>

            {/* Sub-Category Tags - Refined pills */}
            <AnimatePresence mode="wait">
              <motion.div 
                key={activeCategory}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="flex flex-wrap items-center gap-3"
              >
                {currentSubTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setActiveSubCategory(tag === activeSubCategory ? null : tag)}
                    className={`px-5 py-2 text-[11px] uppercase tracking-[0.15em] font-medium transition-all duration-300 ${
                      activeSubCategory === tag 
                        ? "bg-gray-900 text-white shadow-sm" 
                        : "bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Products Grid */}
        <motion.div 
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16 min-h-[400px]"
        >
          {displayedProducts.length === 0 ? (
            <div className="col-span-full text-center py-20">
              <p className="text-gray-500 text-sm uppercase tracking-widest">暂无产品</p>
            </div>
          ) : (
          <AnimatePresence mode="popLayout">
            {displayedProducts.map((product) => (
              <motion.div
                layout
                key={product.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="group cursor-pointer flex flex-col"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log("产品卡片点击:", { productId: product.id, productTitle: product.title, hasOnProductSelect: !!onProductSelect });
                  if (product && product.id) {
                    if (onProductSelect) {
                      console.log("调用 onProductSelect");
                      onProductSelect(product);
                    } else {
                      // 如果没有传入 onProductSelect，直接使用 navigate
                      console.log("直接使用 navigate 跳转");
                      navigate(`/products/${product.id}`);
                    }
                  } else {
                    console.warn("无法跳转：产品 ID 无效", product);
                  }
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (product && product.id) {
                      if (onProductSelect) {
                        onProductSelect(product);
                      } else {
                        navigate(`/products/${product.id}`);
                      }
                    }
                  }
                }}
              >
                {/* Image Container - Strictly Square */}
                <div className="relative overflow-hidden aspect-square mb-6 bg-gray-50">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                  />
                  {/* Minimal Overlay */}
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>

                {/* Content - Left Aligned, Clean */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-gray-400 uppercase tracking-[0.2em]">{product.category}</span>
                  <h3 className="text-base font-serif text-gray-900 group-hover:text-gray-600 transition-colors duration-300">
                    {product.title}
                  </h3>
                  <div className="w-0 group-hover:w-full h-px bg-gray-200 mt-4 transition-all duration-500 ease-out" />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          )}
        </motion.div>

        {/* View All Products Button */}
        {/* 当设置了 maxDisplay 且过滤后的产品数量超过 maxDisplay 时，显示"View All"按钮 */}
        {onViewAllProducts && (maxDisplay && maxDisplay > 0 && filteredProducts.length > maxDisplay || !maxDisplay) && (
          <div className="flex justify-center mt-16 md:mt-24">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onViewAllProducts) {
                  onViewAllProducts();
                }
              }}
              className="group flex items-center gap-3 px-8 py-4 border border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-all duration-300 rounded-sm"
            >
              <span className="text-sm uppercase tracking-widest font-medium">View All Products</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}