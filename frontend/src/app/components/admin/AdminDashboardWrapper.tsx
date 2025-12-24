import React from "react";
import { AdminDashboard } from "./AdminDashboard";
import { ProductType } from "../Products";
import { Category, TagItem, HeroSlide } from "../../types/admin";

interface AdminDashboardWrapperProps {
  onLogout: () => void;
  products: ProductType[];
  categories: Category[];
  tags: TagItem[];
  banners: HeroSlide[];
  onProductsUpdate: (products: ProductType[]) => void;
  onCategoriesUpdate: (categories: Category[]) => void;
  onTagsUpdate: (tags: TagItem[]) => void;
  onBannersUpdate: (banners: HeroSlide[]) => void;
}

/**
 * Wrapper component to integrate data flow between App.tsx and AdminDashboard
 * This component receives data from App and passes it to AdminDashboard
 */
export function AdminDashboardWrapper({
  onLogout,
  products,
  categories,
  tags,
  banners,
  onProductsUpdate,
  onCategoriesUpdate,
  onTagsUpdate,
  onBannersUpdate
}: AdminDashboardWrapperProps) {
  // For now, we pass through to the original AdminDashboard
  // In the future, we can intercept and transform data here if needed
  
  return (
    <AdminDashboard 
      onLogout={onLogout}
      products={products}
      categories={categories}
      tags={tags}
      banners={banners}
      onProductsUpdate={onProductsUpdate}
      onCategoriesUpdate={onCategoriesUpdate}
      onTagsUpdate={onTagsUpdate}
      onBannersUpdate={onBannersUpdate}
    />
  );
}
