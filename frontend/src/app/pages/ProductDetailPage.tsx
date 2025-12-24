import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ProductDetail } from "../components/ProductDetail";
import { ProductType } from "../components/Products";
import { fetchProduct, convertApiProductToProductType } from "../services/api";
import { toast } from "sonner";

export default function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProduct = async () => {
      if (!productId) {
        navigate("/");
        return;
      }

      try {
        setLoading(true);
        const productIdNum = parseInt(productId, 10);
        if (isNaN(productIdNum)) {
          navigate("/");
          return;
        }

        const apiProduct = await fetchProduct(productIdNum);
        const convertedProduct = convertApiProductToProductType(apiProduct);
        setProduct(convertedProduct);
      } catch (error) {
        console.error("Failed to load product:", error);
        toast.error("产品不存在");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId, navigate]);

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

  if (!product) {
    return null;
  }

  return (
    <ProductDetail
      product={product}
      onBack={() => {
        navigate("/products");
      }}
    />
  );
}

