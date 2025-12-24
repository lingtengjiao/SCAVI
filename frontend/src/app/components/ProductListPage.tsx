import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Filter, Grid, List, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ProductType } from "./Products";
import { fetchProductStatistics } from "../services/api";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Category, TagItem } from "../types/admin";

interface ProductListPageProps {
  products: ProductType[];
  onProductClick: (product: ProductType) => void;
  onBack: () => void;
  categories?: Category[];
  tags?: TagItem[];
  selectedCategory?: string; // 预设选中的分类
  onCategoryClick?: (category: Category) => void; // 分类点击回调
}

const sortOptions = [
  { value: "newest", label: "Newest First" },
  { value: "name-asc", label: "Name: A-Z" },
  { value: "name-desc", label: "Name: Z-A" }
];

export function ProductListPage({ products, onProductClick, onBack, categories, tags, selectedCategory: initialCategory, onCategoryClick }: ProductListPageProps) {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || "All");
  
  // 组件加载日志
  useEffect(() => {
    console.log("[ProductListPage] ========== 组件已加载 ==========");
    console.log("[ProductListPage] 接收到的 props:", {
      productsCount: products.length,
      categoriesCount: categories?.length || 0,
      initialCategory: initialCategory || "All",
      tagsCount: tags?.length || 0
    });
  }, []);
  
  // 当 initialCategory 改变时，更新 selectedCategory（用于分类页面）
  useEffect(() => {
    if (initialCategory && initialCategory !== selectedCategory) {
      console.log(`[ProductListPage] 更新选中的分类: ${selectedCategory} -> ${initialCategory}`);
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});

  // 从API获取产品统计数据
  useEffect(() => {
    console.log("[ProductListPage] ========== 开始加载统计数据 ==========");
    console.log("[ProductListPage] 当前 products 数量:", products.length);
    console.log("[ProductListPage] 当前 categories 数量:", categories?.length);
    console.log("[ProductListPage] 当前 categories 列表:", categories?.map(c => c.name));
    
    const loadStatistics = async () => {
      try {
        console.log("[ProductListPage] 调用 fetchProductStatistics...");
        const stats = await fetchProductStatistics(false); // 只统计启用的产品（官网不显示草稿）
        console.log("[ProductListPage] ✅ 产品统计数据获取成功:", stats);
        console.log("[ProductListPage] stats.by_category 类型:", typeof stats.by_category);
        console.log("[ProductListPage] stats.by_category 内容:", stats.by_category);
        console.log("[ProductListPage] stats.by_category 键:", Object.keys(stats.by_category || {}));
        console.log("[ProductListPage] stats.by_category 值:", Object.values(stats.by_category || {}));
        
        // 确保 by_category 存在且是对象
        if (stats.by_category && typeof stats.by_category === 'object') {
          console.log("[ProductListPage] 设置 categoryCounts...");
          setCategoryCounts(stats.by_category);
          console.log("[ProductListPage] ✅ categoryCounts 已更新:", stats.by_category);
        } else {
          console.error("[ProductListPage] ❌ stats.by_category 格式错误:", stats.by_category);
          throw new Error("统计数据格式错误");
        }
      } catch (error: any) {
        console.error("[ProductListPage] ❌ 获取产品统计数据失败:", error);
        console.error("[ProductListPage] 错误详情:", {
          message: error?.message,
          stack: error?.stack
        });
        // 如果接口失败，回退到前端计算
        const fallbackCounts: Record<string, number> = {};
        if (categories) {
          categories.forEach(cat => {
            const count = products.filter(p => {
              const productCategory = String(p.category || '').trim();
              const targetCategory = String(cat.name || '').trim();
              return productCategory === targetCategory;
            }).length;
            fallbackCounts[cat.name] = count;
            console.log(`[ProductListPage] 回退计算: "${cat.name}" = ${count}`);
          });
        }
        // 计算总数
        fallbackCounts["All"] = products.length;
        console.log("[ProductListPage] 使用回退数据:", fallbackCounts);
        setCategoryCounts(fallbackCounts);
      }
    };
    
    loadStatistics();
    console.log("[ProductListPage] ========================================");
  }, [products, categories]);

  // Build category list with "All" option at the beginning and only active categories
  const activeCategoriesList = categories 
    ? categories
        .filter(cat => cat.status === "Active")
        .sort((a, b) => a.order - b.order)
    : [];
  
  const displayCategories = ["All", ...activeCategoriesList.map(c => c.name)];

  // Get active tags sorted by order
  const activeTags = tags 
    ? tags.sort((a, b) => a.order - b.order)
    : [];

  // Toggle tag selection
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedCategory("All");
    setSelectedTags([]);
  };

  // Filter products by category and tags
  const filteredProducts = products.filter(p => {
    const matchCategory = selectedCategory === "All" || p.category === selectedCategory;
    const matchTags = selectedTags.length === 0 || 
      (p.tags && selectedTags.some(tag => p.tags!.includes(tag)));
    return matchCategory && matchTags;
  });
  
  // 调试日志：显示过滤后的产品数量
  useEffect(() => {
    console.log(`[ProductListPage] 过滤后的产品数量: ${filteredProducts.length} (选中分类: "${selectedCategory}")`);
    console.log(`[ProductListPage] 总产品数: ${products.length}`);
    console.log(`[ProductListPage] categoryCounts:`, categoryCounts);
  }, [filteredProducts.length, selectedCategory, products.length, categoryCounts]);

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "name-asc":
        return a.title.localeCompare(b.title);
      case "name-desc":
        return b.title.localeCompare(a.title);
      case "newest":
      default:
        // Sort by order if available, otherwise by id
        return (a.order || 0) - (b.order || 0);
    }
  });

  // Get product count for each category
  // 优先使用从API获取的统计数据，如果没有则回退到前端计算
  const getCategoryCount = useCallback((category: string) => {
    console.log(`[getCategoryCount] ========== 计算分类数量 ==========`);
    console.log(`[getCategoryCount] 分类名称: "${category}"`);
    console.log(`[getCategoryCount] categoryCounts 状态:`, categoryCounts);
    console.log(`[getCategoryCount] categoryCounts 键:`, Object.keys(categoryCounts));
    console.log(`[getCategoryCount] categoryCounts 值:`, Object.values(categoryCounts));
    
    // 如果已经有统计数据，直接使用
    if (Object.keys(categoryCounts).length > 0) {
      if (category === "All") {
        // 计算总数（所有分类的数量之和）
        const total = Object.values(categoryCounts).reduce((sum, count) => sum + count, 0);
        console.log(`[getCategoryCount] All: 使用统计数据 = ${total}`, categoryCounts);
        return total;
      }
      // 直接查找分类名称对应的数量
      const count = categoryCounts[category] ?? 0;
      console.log(`[getCategoryCount] "${category}": 查找结果 = ${count}`);
      console.log(`[getCategoryCount] categoryCounts["${category}"] =`, categoryCounts[category]);
      console.log(`[getCategoryCount] ========================================`);
      return count;
    }
    
    // 回退到前端计算
    console.log(`[getCategoryCount] "${category}": 使用前端计算（统计数据未加载）`);
    console.log(`[getCategoryCount] 当前 products 数量: ${products.length}`);
    if (category === "All") {
      const total = products.length;
      console.log(`[getCategoryCount] All: 前端计算 = ${total}`);
      return total;
    }
    const matchingProducts = products.filter(p => {
      const productCategory = String(p.category || '').trim();
      const targetCategory = String(category || '').trim();
      return productCategory === targetCategory;
    });
    console.log(`[getCategoryCount] "${category}": 前端计算 = ${matchingProducts.length}`);
    console.log(`[getCategoryCount] ========================================`);
    return matchingProducts.length;
  }, [categoryCounts, products]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Back Button - Minimalist Design */}
          <button
            onClick={onBack}
            className="group mb-8 flex items-center gap-2 text-sm text-gray-400 hover:text-gray-900 transition-colors duration-300"
          >
            <svg 
              className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="uppercase tracking-widest text-xs font-medium">Back</span>
          </button>

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-serif tracking-tight mb-2">Product Collection</h1>
              <p className="text-sm text-gray-400 uppercase tracking-widest">
                {filteredProducts.length} {filteredProducts.length === 1 ? "Product" : "Products"}
                {selectedCategory !== "All" && ` — ${selectedCategory}`}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="hidden md:flex border border-gray-200 rounded-md">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 ${viewMode === "grid" ? "bg-gray-100" : "hover:bg-gray-50"}`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 ${viewMode === "list" ? "bg-gray-100" : "hover:bg-gray-50"}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>

              {/* Mobile Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="md:hidden flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-md hover:bg-gray-50"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </button>
            </div>
          </div>

          {/* Desktop Filters */}
          <div className="hidden md:block space-y-4">
            {/* Categories */}
            <div className="flex items-center gap-2 flex-wrap">
              {displayCategories.map(categoryName => {
                const category = categoryName === "All" 
                  ? null 
                  : activeCategoriesList.find(c => c.name === categoryName);
                
                return (
                  <button
                    key={categoryName}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (categoryName === "All") {
                        setSelectedCategory("All");
                      } else if (category && category._originalId) {
                        // 跳转到分类页面
                        navigate(`/categories/${category._originalId}`);
                      } else if (category && onCategoryClick) {
                        onCategoryClick(category);
                      } else {
                        setSelectedCategory(categoryName);
                      }
                    }}
                    className={`px-4 py-2 rounded-full text-sm transition-all ${
                      selectedCategory === categoryName
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {categoryName}
                    <span className="ml-2 text-xs opacity-70">
                      ({getCategoryCount(categoryName)})
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Tags and Sort */}
            <div className="flex items-center justify-between gap-4">
              {/* Tags - 只有当当前分类有产品时才显示 */}
              {filteredProducts.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-gray-500 mr-1">Tags:</span>
                  {activeTags.map(tag => (
                    <button
                      key={tag.name}
                      onClick={() => toggleTag(tag.name)}
                      className={`px-4 py-1.5 text-[11px] uppercase tracking-wider font-medium transition-all ${
                        selectedTags.includes(tag.name)
                          ? "bg-gray-900 text-white shadow-sm"
                          : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {tag.name}
                    </button>
                  ))}
                  {(selectedCategory !== "All" || selectedTags.length > 0) && (
                    <button
                      onClick={clearFilters}
                      className="ml-2 text-xs text-gray-400 hover:text-gray-900 underline"
                    >
                      Clear All
                    </button>
                  )}
                </div>
              )}

              {/* Sort */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-sm text-gray-500">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-1.5 border border-gray-200 rounded-md text-sm bg-white hover:bg-gray-50 cursor-pointer"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 bg-black/50 z-50"
            onClick={() => setShowFilters(false)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-2xl p-6 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Filters</h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium mb-3">Category</h4>
                  <div className="space-y-2">
                    {displayCategories.map(categoryName => {
                      const category = categoryName === "All" 
                        ? null 
                        : activeCategoriesList.find(c => c.name === categoryName);
                      
                      return (
                      <button
                          key={categoryName}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (categoryName === "All") {
                              setSelectedCategory("All");
                              setShowFilters(false);
                            } else if (category && category._originalId) {
                              // 跳转到分类页面
                              navigate(`/categories/${category._originalId}`);
                              setShowFilters(false);
                            } else {
                              setSelectedCategory(categoryName);
                          setShowFilters(false);
                            }
                        }}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                            selectedCategory === categoryName
                            ? "bg-gray-900 text-white"
                            : "hover:bg-gray-100"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                            <span>{categoryName}</span>
                          <span className="text-xs opacity-70">
                              {getCategoryCount(categoryName)}
                          </span>
                        </div>
                      </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-3">Sort By</h4>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm bg-white"
                  >
                    {sortOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tags - 只有当当前分类有产品时才显示 */}
                {filteredProducts.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-3">Tags</h4>
                    <div className="space-y-2">
                      {activeTags.map(tag => (
                        <button
                          key={tag.name}
                          onClick={() => toggleTag(tag.name)}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                            selectedTags.includes(tag.name)
                              ? "bg-gray-900 text-white"
                              : "hover:bg-gray-100"
                          }`}
                        >
                          {tag.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="text-sm text-gray-500 hover:text-gray-900"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Grid */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {sortedProducts.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <Filter className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-500">Try adjusting your filters</p>
          </div>
        ) : (
          <motion.div
            layout
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
                : "space-y-6"
            }
          >
            {sortedProducts.map((product, index) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                {viewMode === "grid" ? (
                  <ProductCardGrid product={product} onClick={() => onProductClick(product)} />
                ) : (
                  <ProductCardList product={product} onClick={() => onProductClick(product)} />
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

// Grid Card Component
function ProductCardGrid({ product, onClick }: { product: ProductType; onClick: () => void }) {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("[ProductCardGrid] 点击产品:", product.id, product.title);
    onClick();
  };

  return (
    <div
      className="group cursor-pointer"
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="aspect-square bg-gray-100 rounded-sm overflow-hidden mb-4 relative">
        <motion.img
          src={product.image}
          alt={product.title}
          className="w-full h-full object-cover"
          animate={{ scale: isHovered ? 1.05 : 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          className="absolute inset-0 bg-black/20 flex items-center justify-center"
        >
          <span className="text-white text-sm font-medium px-6 py-2 border border-white rounded-full">
            View Details
          </span>
        </motion.div>

        {product.tags && product.tags.length > 0 && (
          <div className="absolute top-3 left-3">
            <Badge className="bg-white/90 text-gray-900 hover:bg-white text-xs">
              {product.tags[0]}
            </Badge>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <h3 className="font-medium text-gray-900 group-hover:text-gray-600 transition-colors">
          {product.title}
        </h3>
        <p className="text-sm text-gray-500">{product.category}</p>
        {product.price && (
          <p className="text-sm font-medium">{product.price}</p>
        )}
      </div>
    </div>
  );
}

// List Card Component
function ProductCardList({ product, onClick }: { product: ProductType; onClick: () => void }) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("[ProductCardList] 点击产品:", product.id, product.title);
    onClick();
  };

  return (
    <div
      className="group cursor-pointer bg-white border border-gray-200 rounded-md overflow-hidden hover:shadow-lg transition-shadow"
      onClick={handleClick}
    >
      <div className="flex gap-6 p-6">
        <div className="w-48 h-48 flex-shrink-0 bg-gray-100 rounded-sm overflow-hidden">
          <img
            src={product.image}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>

        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-xl font-medium text-gray-900 mb-1 group-hover:text-gray-600 transition-colors">
                  {product.title}
                </h3>
                <p className="text-sm text-gray-500">{product.category}</p>
              </div>
              {product.price && (
                <p className="text-lg font-medium">{product.price}</p>
              )}
            </div>

            <p className="text-gray-600 text-sm mt-4 line-clamp-2">
              {product.description}
            </p>

            {product.tags && product.tags.length > 0 && (
              <div className="flex gap-2 mt-4">
                {product.tags.slice(0, 3).map((tag, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="text-xs bg-gray-100 text-gray-700"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 mt-4">
            <button className="text-sm font-medium text-gray-900 hover:text-gray-600 transition-colors">
              View Details →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}