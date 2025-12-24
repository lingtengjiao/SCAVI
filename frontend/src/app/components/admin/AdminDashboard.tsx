import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Package, 
  Settings, 
  LogOut, 
  Plus, 
  Search, 
  MoreHorizontal, 
  Trash2, 
  Edit,
  FolderTree,
  ArrowLeft,
  Upload,
  Save,
  CheckCircle2,
  X,
  ImageIcon,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  Tag,
  Image
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "../ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "../ui/dropdown-menu";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../ui/card";
import { ProductType } from "../Products";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { AddProductForm } from "./AddProductForm";
import { BannerManagement } from "./BannerManagement";
import { Category, TagItem, HeroSlide } from "../../types/admin";
import { createTag, updateTag, deleteTag, createCategory, updateCategory, deleteCategory, createProduct, updateProduct, deleteProduct, uploadFile, uploadVideo, uploadTempFile, moveTempFilesToFinal } from "../../services/adminApi";
import { useData } from "../../context/DataContext";

interface AdminDashboardProps {
  onLogout: () => void;
  products: ProductType[];
  categories: Category[];
  tags: TagItem[];
  banners: HeroSlide[];
  onProductsUpdate: (products: ProductType[]) => void;
  onCategoriesUpdate: () => void | Promise<void>;
  onTagsUpdate: () => void | Promise<void>;
  onBannersUpdate: () => void | Promise<void>;
}

export function AdminDashboard({ 
  onLogout,
  products: localProducts,
  categories: localCategories,
  tags: localTags,
  banners: localBanners,
  onProductsUpdate,
  onCategoriesUpdate,
  onTagsUpdate,
  onBannersUpdate
}: AdminDashboardProps) {
  const { refreshData } = useData();
  const location = useLocation();
  const navigate = useNavigate();
  
  // 从路由路径获取当前激活的tab
  const getActiveTab = () => {
    const path = location.pathname;
    console.log("[AdminDashboard] 当前路径:", path);
    
    // 先检查特殊路径（add和edit）
    if (path.includes("/admin/products/add") || (path.includes("/admin/products/") && path.includes("/edit"))) {
      console.log("[AdminDashboard] 检测到 add-product 页面");
      return "add-product";
    }
    // 然后检查其他路径（按优先级）
    if (path.includes("/admin/categories")) {
      console.log("[AdminDashboard] 检测到 categories 页面");
      return "categories";
    }
    if (path.includes("/admin/tags")) {
      console.log("[AdminDashboard] 检测到 tags 页面");
      return "tags";
    }
    if (path.includes("/admin/banners")) {
      console.log("[AdminDashboard] 检测到 banners 页面");
      return "banners";
    }
    if (path.includes("/admin/settings")) {
      console.log("[AdminDashboard] 检测到 settings 页面");
      return "settings";
    }
    if (path.includes("/admin/products")) {
      console.log("[AdminDashboard] 检测到 products 页面");
      return "products";
    }
    if (path.includes("/admin/dashboard") || path === "/admin") {
      console.log("[AdminDashboard] 检测到 dashboard 页面");
      return "dashboard";
    }
    console.log("[AdminDashboard] 默认返回 dashboard");
    return "dashboard";
  };
  
  const activeTab = getActiveTab();
  
  // 调试：当路径变化时输出
  useEffect(() => {
    console.log("[AdminDashboard] 路径变化，当前 activeTab:", activeTab, "路径:", location.pathname);
  }, [location.pathname, activeTab]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categorySearchTerm, setCategorySearchTerm] = useState("");

  // 调试日志：检查接收到的产品数据
  useEffect(() => {
    console.log("[AdminDashboard] 接收到的产品数据:", {
      productsCount: localProducts.length,
      products: localProducts.slice(0, 5).map(p => ({ id: p.id, title: p.title, category: p.category, status: p.status })),
      allProductIds: localProducts.map(p => p.id)
    });
  }, [localProducts.length]);
  
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: "", status: "Active" });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [tagSearchTerm, setTagSearchTerm] = useState("");
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagItem | null>(null);
  const [tagForm, setTagForm] = useState({ name: "", color: "#10b981" });
  const [tagDeleteDialogOpen, setTagDeleteDialogOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<TagItem | null>(null);
  
  // Edit product state
  const [editingProduct, setEditingProduct] = useState<ProductType | null>(null);
  
  // Enhanced form state for new product
  const [newProduct, setNewProduct] = useState({
    title: "",
    category: "",
    sku: "",
    price: "",
    status: "active",
    description: "",
    material: "",
    care: "",
    features: [""] as string[],
    gallery: [] as string[],
    video: "",
    videoFile: null as string | null, // For video file upload preview
    tags: [] as string[] // Tags for the product
  });

  const filteredProducts = localProducts
    .filter(p => 
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除这个产品吗？")) {
      return;
    }

    try {
      // 获取产品 ID（如果是数字，直接使用）
      let productId: number;
      if (typeof id === 'number') {
        productId = id;
      } else {
        toast.error("无法找到产品 ID");
        return;
      }

      await deleteProduct(productId);
      toast.success("产品删除成功");
      
      // 刷新管理后台产品列表（重要：必须调用 onProductsUpdate 来刷新列表）
      await onProductsUpdate([]);
      
      // 同时刷新公共数据
      await refreshData();
    } catch (error: any) {
      console.error("产品删除失败：", error);
      toast.error(error.message || "删除失败");
    }
  };

  const moveProductUp = (product: ProductType) => {
    const sortedProducts = [...localProducts].sort((a, b) => (a.order || 0) - (b.order || 0));
    const currentIndex = sortedProducts.findIndex(p => p.id === product.id);
    if (currentIndex <= 0) return;

    const newProducts = [...sortedProducts];
    const temp = newProducts[currentIndex];
    newProducts[currentIndex] = newProducts[currentIndex - 1];
    newProducts[currentIndex - 1] = temp;

    // Update order numbers
    newProducts.forEach((p, idx) => p.order = idx + 1);
    onProductsUpdate(newProducts);
    toast.success("Product order updated");
  };

  const moveProductDown = (product: ProductType) => {
    const sortedProducts = [...localProducts].sort((a, b) => (a.order || 0) - (b.order || 0));
    const currentIndex = sortedProducts.findIndex(p => p.id === product.id);
    if (currentIndex >= sortedProducts.length - 1) return;

    const newProducts = [...sortedProducts];
    const temp = newProducts[currentIndex];
    newProducts[currentIndex] = newProducts[currentIndex + 1];
    newProducts[currentIndex + 1] = temp;

    // Update order numbers
    newProducts.forEach((p, idx) => p.order = idx + 1);
    onProductsUpdate(newProducts);
    toast.success("Product order updated");
  };

  // Image upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const fileArray = Array.from(files);
    
    // 验证所有文件
    for (const file of fileArray) {
      if (!file.type.startsWith("image/")) {
        toast.error(`文件 ${file.name} 不是图片文件`);
        continue;
      }
      
      // 检查文件大小（限制 10MB）
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`文件 ${file.name} 大小超过 10MB`);
        continue;
      }
    }

    // 上传所有文件
    try {
      toast.loading("正在上传图片...");
      const uploadPromises = fileArray
        .filter(file => file.type.startsWith("image/") && file.size <= 10 * 1024 * 1024)
        .map(async (file) => {
          console.log("[handleImageUpload] 开始上传图片文件:", file.name);
          
          // 上传临时文件到服务器（用于预览）
          const imageUrl = await uploadTempFile(file);
          console.log("[handleImageUpload] 临时文件上传成功，返回的URL:", imageUrl);

          // 验证 URL（可以是 OSS URL 或本地路径）
          if (!imageUrl) {
            throw new Error(`上传的图片URL无效: ${imageUrl}`);
          }
          
          return imageUrl;
        });

      const uploadedUrls = await Promise.all(uploadPromises);
      
      // 更新产品图片列表
      setNewProduct(prev => ({
        ...prev,
        gallery: [...prev.gallery, ...uploadedUrls]
      }));
      
      toast.dismiss();
      toast.success(`成功上传 ${uploadedUrls.length} 张图片`);
      console.log("[handleImageUpload] 所有图片上传成功:", uploadedUrls);
    } catch (error: any) {
      toast.dismiss();
      console.error("图片上传失败:", error);
      toast.error(error?.message || "图片上传失败，请重试");
    }
    
    // Reset input
    e.target.value = "";
  };

  // Video upload handler - 使用专门的视频上传接口
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast.error("请上传视频文件");
      e.target.value = "";
      return;
    }

    // 检查文件大小（限制 100MB）
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      toast.error(`视频文件过大: ${(file.size / 1024 / 1024).toFixed(2)}MB，最大允许 100MB`);
      e.target.value = "";
      return;
    }

    try {
      // 显示上传中提示
      toast.loading("正在上传视频...");
      
      console.log('[handleVideoUpload] ========== 开始上传视频 ==========');
      console.log('[handleVideoUpload] 视频信息:', {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileSizeMB: (file.size / 1024 / 1024).toFixed(2) + 'MB'
      });
      
      // 使用临时上传接口（用于预览）
      const videoUrl = await uploadTempFile(file);
      
      console.log('[handleVideoUpload] ✅ 临时视频上传成功，返回的URL:', videoUrl);
      
      // 验证URL格式（可以是 OSS URL 或本地路径）
      if (!videoUrl) {
        console.error('[handleVideoUpload] ❌ URL格式不正确:', videoUrl);
        throw new Error('视频URL格式不正确');
      }
      
      // 使用 FileReader 读取文件用于预览
      const reader = new FileReader();
      reader.onloadend = () => {
        const previewUrl = reader.result as string;
        console.log('[handleVideoUpload] 设置产品视频URL:', videoUrl);
        setNewProduct(prev => ({
          ...prev,
          videoFile: previewUrl, // 用于预览的 base64 URL
          video: videoUrl // 存储服务器返回的 URL（独立字段）
        }));
        toast.dismiss();
        toast.success("视频上传成功");
        console.log('[handleVideoUpload] ========================================');
      };
      reader.onerror = () => {
        console.error('[handleVideoUpload] FileReader 错误');
        toast.dismiss();
        toast.error("视频预览失败，但上传成功");
        // 即使预览失败，也要保存URL
        setNewProduct(prev => ({
          ...prev,
          video: videoUrl
        }));
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      toast.dismiss();
      console.error("[handleVideoUpload] ❌ 视频上传失败:", error);
      console.error("[handleVideoUpload] 错误详情:", {
        message: error?.message,
        stack: error?.stack,
        response: error?.response
      });
      toast.error(error?.message || "视频上传失败，请重试");
    }
    
    // Reset input
    e.target.value = "";
  };

  // Remove video
  const handleRemoveVideo = () => {
    setNewProduct(prev => ({
      ...prev,
      videoFile: null,
      video: ""
    }));
  };

  // Remove image from gallery
  const handleRemoveImage = (index: number) => {
    setNewProduct(prev => ({
      ...prev,
      gallery: prev.gallery.filter((_, i) => i !== index)
    }));
  };

  // Feature management
  const handleAddFeature = () => {
    setNewProduct(prev => ({
      ...prev,
      features: [...prev.features, ""]
    }));
  };

  const handleRemoveFeature = (index: number) => {
    setNewProduct(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const handleFeatureChange = (index: number, value: string) => {
    setNewProduct(prev => ({
      ...prev,
      features: prev.features.map((f, i) => i === index ? value : f)
    }));
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 表单验证
    if (!newProduct.title || !newProduct.title.trim()) {
      toast.error("产品名称是必填项");
      return;
    }

    if (newProduct.gallery.length === 0) {
      toast.error("请至少上传一张产品图片");
      return;
    }
    
    try {
      // 查找分类 ID
      let categoryId: number | undefined;
      if (newProduct.category) {
        const category = localCategories.find(c => c.name === newProduct.category);
        if (category && category._originalId) {
          categoryId = category._originalId;
        } else {
          console.warn("未找到分类，将创建无分类产品");
        }
      }

      // 查找标签 ID
      const tagIds: number[] = [];
      if (newProduct.tags && newProduct.tags.length > 0) {
        newProduct.tags.forEach(tagName => {
          const tag = localTags.find(t => t.name === tagName);
          if (tag) {
            // 从 tag.id 中提取数字 ID (格式: "tag-1")
            const tagId = parseInt(tag.id.replace('tag-', ''));
            if (!isNaN(tagId)) {
              tagIds.push(tagId);
            }
          }
        });
      }

      // 将临时文件移动到正式位置
      let finalImages = newProduct.gallery;
      let finalVideo = newProduct.video;
      
      // 收集所有临时文件 URL
      const tempUrls: string[] = [];
      newProduct.gallery.forEach(url => {
        // 检查是否为临时文件（temp/ 目录或临时 OSS 路径）
        if (url.includes('/temp/') || (url.includes('temp/') && (url.startsWith('http://') || url.startsWith('https://')))) {
          tempUrls.push(url);
        }
      });
      if (newProduct.video && (newProduct.video.includes('/temp/') || (newProduct.video.includes('temp/') && (newProduct.video.startsWith('http://') || newProduct.video.startsWith('https://'))))) {
        tempUrls.push(newProduct.video);
      }
      
      // 如果有临时文件，先移动到正式位置
      if (tempUrls.length > 0) {
        toast.loading("正在处理文件...");
        try {
          const finalUrls = await moveTempFilesToFinal(tempUrls);
          console.log("[handleAddProduct] 文件移动成功:", finalUrls);
          
          // 更新图片和视频 URL
          let urlIndex = 0;
          finalImages = newProduct.gallery.map(url => {
            if (url.includes('/temp/') || (url.includes('temp/') && (url.startsWith('http://') || url.startsWith('https://')))) {
              return finalUrls[urlIndex++] || url;
            }
            return url;
          });
          
          if (newProduct.video && (newProduct.video.includes('/temp/') || (newProduct.video.includes('temp/') && (newProduct.video.startsWith('http://') || newProduct.video.startsWith('https://'))))) {
            finalVideo = finalUrls[urlIndex] || newProduct.video;
          }
          
          toast.dismiss();
        } catch (error: any) {
          toast.dismiss();
          console.error("[handleAddProduct] 文件移动失败:", error);
          toast.error("文件处理失败，请重试");
          return;
        }
      }

      const productData = {
        name: newProduct.title.trim(),
        slug: newProduct.sku?.trim() || undefined,
        description: newProduct.description?.trim() || undefined,
        category_id: categoryId,
        key_features: newProduct.features.filter(f => f.trim() !== ""),
        images: finalImages.length > 0 ? finalImages : undefined,
        video: finalVideo?.trim() || undefined,  // 独立的视频字段
        specs: {
          material: newProduct.material?.trim() || undefined,
          care: newProduct.care?.trim() || undefined,
          price: newProduct.price?.trim() || undefined,
          // video 已移除，现在使用独立的 video 字段
        },
        order: localProducts.length + 1,
        is_active: newProduct.status === "active",
        tag_ids: tagIds.length > 0 ? tagIds : undefined,
      };

      console.log("创建产品，发送数据：", productData);

      const result = await createProduct(productData);
      
      console.log("产品创建成功，返回结果：", result);
      toast.success(`产品 "${newProduct.title}" 创建成功`);
      
      // 刷新管理后台产品列表（重要：必须调用 onProductsUpdate 来刷新列表）
      await onProductsUpdate([]);
      
      // 同时刷新公共数据
      await refreshData();
      
    navigate("/admin/products");
    
    // Reset form
    setNewProduct({
      title: "",
      category: "",
      sku: "",
      price: "",
      status: "active",
      description: "",
      material: "",
      care: "",
      features: [""],
      gallery: [],
      video: "",
      videoFile: null,
      tags: []
    });
    } catch (error: any) {
      console.error("产品创建失败，详细错误：", {
        error,
        message: error?.message,
        stack: error?.stack,
        response: error?.response
      });
      const errorMessage = error?.message || error?.detail || "创建失败，请检查网络连接或刷新页面重试";
      toast.error(errorMessage);
    }
  };

  // Handle edit product
  const handleEditProduct = (product: ProductType) => {
    setEditingProduct(product);
    // 统一 status 格式：将 "Active"/"Inactive" 转换为 "active"/"draft"
    let statusValue = product.status || "active";
    if (statusValue === "Active") {
      statusValue = "active";
    } else if (statusValue === "Inactive") {
      statusValue = "draft";
    }
    
    setNewProduct({
      title: product.title,
      category: product.category,
      sku: product.sku || "",
      price: typeof product.price === "string" ? product.price : "",
      status: statusValue,
      description: product.description,
      material: product.material || "",
      care: product.care || "",
      features: product.features && product.features.length > 0 ? product.features : [""],
      gallery: product.gallery || [product.image],
      video: product.video || "",
      videoFile: null,
      tags: product.tags || []
    });
    navigate(`/admin/products/${product.id}/edit`);
  };

  // Handle update product
  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingProduct) return;
    
    try {
      // 获取产品 ID（如果是数字，直接使用）
      let productId: number;
      if (typeof editingProduct.id === 'number') {
        productId = editingProduct.id;
      } else {
        toast.error("无法找到产品 ID，请刷新页面重试");
        return;
      }

      // 查找分类 ID
      let categoryId: number | undefined;
      if (newProduct.category) {
        const category = localCategories.find(c => c.name === newProduct.category);
        if (category && category._originalId) {
          categoryId = category._originalId;
        }
      }

      // 查找标签 ID
      const tagIds: number[] = [];
      if (newProduct.tags && newProduct.tags.length > 0) {
        newProduct.tags.forEach(tagName => {
          const tag = localTags.find(t => t.name === tagName);
          if (tag) {
            // 从 tag.id 中提取数字 ID (格式: "tag-1")
            const tagId = parseInt(tag.id.replace('tag-', ''));
            if (!isNaN(tagId)) {
              tagIds.push(tagId);
            }
          }
        });
      }

      // 将临时文件移动到正式位置
      let finalImages = newProduct.gallery;
      let finalVideo = newProduct.video;
      
      // 收集所有临时文件 URL
      const tempUrls: string[] = [];
      newProduct.gallery.forEach(url => {
        // 检查是否为临时文件（temp/ 目录或临时 OSS 路径）
        if (url.includes('/temp/') || (url.includes('temp/') && (url.startsWith('http://') || url.startsWith('https://')))) {
          tempUrls.push(url);
        }
      });
      if (newProduct.video && (newProduct.video.includes('/temp/') || (newProduct.video.includes('temp/') && (newProduct.video.startsWith('http://') || newProduct.video.startsWith('https://'))))) {
        tempUrls.push(newProduct.video);
      }
      
      // 如果有临时文件，先移动到正式位置
      if (tempUrls.length > 0) {
        toast.loading("正在处理文件...");
        try {
          const finalUrls = await moveTempFilesToFinal(tempUrls);
          console.log("[handleUpdateProduct] 文件移动成功:", finalUrls);
          
          // 更新图片和视频 URL
          let urlIndex = 0;
          finalImages = newProduct.gallery.map(url => {
            if (url.includes('/temp/') || (url.includes('temp/') && (url.startsWith('http://') || url.startsWith('https://')))) {
              return finalUrls[urlIndex++] || url;
            }
            return url;
          });
          
          if (newProduct.video && (newProduct.video.includes('/temp/') || (newProduct.video.includes('temp/') && (newProduct.video.startsWith('http://') || newProduct.video.startsWith('https://'))))) {
            finalVideo = finalUrls[urlIndex] || newProduct.video;
          }
          
          toast.dismiss();
        } catch (error: any) {
          toast.dismiss();
          console.error("[handleUpdateProduct] 文件移动失败:", error);
          toast.error("文件处理失败，请重试");
          return;
        }
      }

      console.log("更新产品，数据：", {
        name: newProduct.title,
        slug: newProduct.sku || undefined,
        description: newProduct.description || undefined,
        category_id: categoryId,
        key_features: newProduct.features.filter(f => f.trim() !== ""),
        images: newProduct.gallery.length > 0 ? newProduct.gallery : undefined,
        video: newProduct.video?.trim() || undefined,  // 独立的视频字段
        specs: {
          material: newProduct.material || undefined,
          care: newProduct.care || undefined,
          price: newProduct.price || undefined,
          // video 已移除，现在使用独立的 video 字段
        },
        is_active: newProduct.status === "active",
        tag_ids: tagIds.length > 0 ? tagIds : undefined,
      });

      // 统一 status 转换：active -> true, draft/archived -> false
      const isActive = newProduct.status === "active";
      console.log("[handleUpdateProduct] Status 转换:", {
        status: newProduct.status,
        isActive: isActive
      });

      const updateData = {
        name: newProduct.title,
        slug: newProduct.sku || undefined,
        description: newProduct.description || undefined,
        category_id: categoryId,
        key_features: newProduct.features.filter(f => f.trim() !== ""),
        images: finalImages.length > 0 ? finalImages : undefined,
        video: finalVideo?.trim() || undefined,  // 独立的视频字段
        specs: {
          material: newProduct.material || undefined,
          care: newProduct.care || undefined,
          price: newProduct.price || undefined,
          // video 已移除，现在使用独立的 video 字段
        },
        is_active: isActive,  // 使用转换后的布尔值
        tag_ids: tagIds.length > 0 ? tagIds : undefined,
      };
      
      console.log("[handleUpdateProduct] 发送更新数据:", JSON.stringify(updateData, null, 2));
      console.log("[handleUpdateProduct] is_active 值:", isActive, "类型:", typeof isActive);

      await updateProduct(productId, updateData);
      
      console.log("产品更新成功，is_active:", isActive);
      toast.success(`产品 "${newProduct.title}" 更新成功`);
      
      // 刷新管理后台产品列表（重要：必须调用 onProductsUpdate 来刷新列表）
      await onProductsUpdate([]);
      
      // 同时刷新公共数据
      await refreshData();
      
    navigate("/admin/products");
    setEditingProduct(null);
    
    // Reset form
    setNewProduct({
      title: "",
      category: "",
      sku: "",
      price: "",
      status: "active",
      description: "",
      material: "",
      care: "",
      features: [""],
      gallery: [],
      video: "",
      videoFile: null,
      tags: []
    });
    } catch (error: any) {
      console.error("产品更新失败：", error);
      toast.error(error.message || "更新失败，请检查网络连接或刷新页面重试");
    }
  };

  // Category management functions
  const handleOpenCategoryDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({ name: category.name, status: category.status });
    } else {
      setEditingCategory(null);
      setCategoryForm({ name: "", status: "Active" });
    }
    setCategoryDialogOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!categoryForm.name.trim()) {
      toast.error("分类名称是必填项");
      return;
    }

    try {
    if (editingCategory) {
        // Edit existing category - 使用 _originalId 获取数字 ID
        const categoryId = editingCategory._originalId;
        
        if (!categoryId) {
          toast.error("无法找到分类 ID，请刷新页面重试");
          return;
      }
      
        await updateCategory(categoryId, {
        name: categoryForm.name,
          slug: categoryForm.name.toLowerCase().replace(/\s+/g, "-"),
          is_active: categoryForm.status === "Active",
        });
        
        toast.success(`分类 "${categoryForm.name}" 更新成功`);
      } else {
        // Add new category
      // Check if category already exists
      if (localCategories.some(cat => cat.name.toLowerCase() === categoryForm.name.toLowerCase())) {
          toast.error("分类已存在");
        return;
      }
      
        console.log("创建分类，数据：", {
          name: categoryForm.name,
          slug: categoryForm.name.toLowerCase().replace(/\s+/g, "-"),
          order: localCategories.length + 1,
          is_active: categoryForm.status === "Active",
        });

        const result = await createCategory({
          name: categoryForm.name,
          slug: categoryForm.name.toLowerCase().replace(/\s+/g, "-"),
          order: localCategories.length + 1,
          is_active: categoryForm.status === "Active",
        });
        
        console.log("分类创建成功，返回结果：", result);
        toast.success(`分类 "${categoryForm.name}" 创建成功`);
    }

      // 刷新数据
      await refreshData();

    setCategoryDialogOpen(false);
    setCategoryForm({ name: "", status: "Active" });
    setEditingCategory(null);
    } catch (error: any) {
      console.error("分类操作失败：", error);
      const errorMessage = error?.message || error?.detail || "操作失败，请检查网络连接或刷新页面重试";
      toast.error(errorMessage);
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    try {
      const categoryId = category._originalId;
      
      if (!categoryId) {
        toast.error("无法找到分类 ID，请刷新页面重试");
        return;
    }

      await deleteCategory(categoryId);
      toast.success(`分类 "${category.name}" 删除成功`);
      
      // 刷新数据
      await refreshData();
    } catch (error: any) {
      toast.error(error.message || "删除失败");
    }
  };

  // Category sorting functions
  const moveCategoryUp = async (category: Category) => {
    const currentIndex = localCategories.findIndex(c => c.id === category.id);
    if (currentIndex <= 0) return;

    const previousCategory = localCategories[currentIndex - 1];
    const categoryId = category._originalId;
    const previousCategoryId = previousCategory._originalId;

    if (!categoryId || !previousCategoryId) {
      toast.error("无法找到分类 ID，请刷新页面重试");
      return;
    }

    try {
      // 交换两个分类的 order
      const newOrder = previousCategory.order;
      const oldOrder = category.order;

      await updateCategory(categoryId, { order: newOrder });
      await updateCategory(previousCategoryId, { order: oldOrder });

      toast.success("分类顺序已更新");
      await refreshData();
    } catch (error: any) {
      toast.error(error.message || "更新失败");
    }
  };

  const moveCategoryDown = async (category: Category) => {
    const currentIndex = localCategories.findIndex(c => c.id === category.id);
    if (currentIndex >= localCategories.length - 1) return;

    const nextCategory = localCategories[currentIndex + 1];
    const categoryId = category._originalId;
    const nextCategoryId = nextCategory._originalId;

    if (!categoryId || !nextCategoryId) {
      toast.error("无法找到分类 ID，请刷新页面重试");
      return;
    }

    try {
      // 交换两个分类的 order
      const newOrder = nextCategory.order;
      const oldOrder = category.order;

      await updateCategory(categoryId, { order: newOrder });
      await updateCategory(nextCategoryId, { order: oldOrder });

      toast.success("分类顺序已更新");
      await refreshData();
    } catch (error: any) {
      toast.error(error.message || "更新失败");
    }
  };

  // Update category counts dynamically
  const categoriesWithCounts = localCategories.map(cat => ({
    ...cat,
    count: localProducts.filter(p => p.category === cat.name).length
  }));

  // Tag management functions
  const handleOpenTagDialog = (tag?: TagItem) => {
    if (tag) {
      setEditingTag(tag);
      setTagForm({ name: tag.name, color: tag.color });
    } else {
      setEditingTag(null);
      setTagForm({ name: "", color: "#10b981" });
    }
    setTagDialogOpen(true);
  };

  const handleSaveTag = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tagForm.name.trim()) {
      toast.error("Tag name is required");
      return;
    }

    try {
    if (editingTag) {
        // Edit existing tag - 从 id 中提取数字 ID (格式: "tag-1")
        const tagId = parseInt(editingTag.id.replace('tag-', ''));
        if (isNaN(tagId)) {
          toast.error("无效的标签 ID");
          return;
      }
      
        await updateTag(tagId, {
        name: tagForm.name,
        color: tagForm.color,
        });
      
        toast.success(`标签 "${tagForm.name}" 更新成功`);
      } else {
        // Add new tag
      // Check if tag already exists
      if (localTags.some(t => t.name.toLowerCase() === tagForm.name.toLowerCase())) {
          toast.error("标签已存在");
        return;
      }
      
        await createTag({
          name: tagForm.name,
          color: tagForm.color,
          order: localTags.length + 1,
        });
        
        toast.success(`标签 "${tagForm.name}" 创建成功`);
    }

      // 刷新数据
      await refreshData();

    setTagDialogOpen(false);
    setTagForm({ name: "", color: "#10b981" });
    setEditingTag(null);
    } catch (error: any) {
      toast.error(error.message || "操作失败");
    }
  };

  const handleDeleteTag = async (tag: TagItem) => {
    try {
      // 从 id 中提取数字 ID (格式: "tag-1")
      const tagId = parseInt(tag.id.replace('tag-', ''));
      if (isNaN(tagId)) {
        toast.error("无效的标签 ID");
        return;
    }

      await deleteTag(tagId);
      toast.success(`标签 "${tag.name}" 删除成功`);
      
      // 刷新数据
      await refreshData();
    } catch (error: any) {
      toast.error(error.message || "删除失败");
    }
  };

  // Tag sorting functions
  const moveTagUp = async (tag: TagItem) => {
    const currentIndex = localTags.findIndex(t => t.id === tag.id);
    if (currentIndex <= 0) return;

    const previousTag = localTags[currentIndex - 1];
    const tagId = parseInt(tag.id.replace('tag-', ''));
    const previousTagId = parseInt(previousTag.id.replace('tag-', ''));

    if (isNaN(tagId) || isNaN(previousTagId)) {
      toast.error("无效的标签 ID");
      return;
    }

    try {
      // 交换两个标签的 order
      const newOrder = previousTag.order;
      const oldOrder = tag.order;

      await updateTag(tagId, { order: newOrder });
      await updateTag(previousTagId, { order: oldOrder });

      toast.success("标签顺序已更新");
      await refreshData();
    } catch (error: any) {
      toast.error(error.message || "更新失败");
    }
  };

  const moveTagDown = async (tag: TagItem) => {
    const currentIndex = localTags.findIndex(t => t.id === tag.id);
    if (currentIndex >= localTags.length - 1) return;

    const nextTag = localTags[currentIndex + 1];
    const tagId = parseInt(tag.id.replace('tag-', ''));
    const nextTagId = parseInt(nextTag.id.replace('tag-', ''));

    if (isNaN(tagId) || isNaN(nextTagId)) {
      toast.error("无效的标签 ID");
      return;
    }

    try {
      // 交换两个标签的 order
      const newOrder = nextTag.order;
      const oldOrder = tag.order;

      await updateTag(tagId, { order: newOrder });
      await updateTag(nextTagId, { order: oldOrder });

      toast.success("标签顺序已更新");
      await refreshData();
    } catch (error: any) {
      toast.error(error.message || "更新失败");
    }
  };

  // Update tag counts dynamically and sort by order
  const tagsWithCounts = localTags
    .map(tag => ({
    ...tag,
    count: localProducts.filter(p => p.tags?.includes(tag.name)).length
    }))
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-xl font-serif font-bold tracking-wide">SCAVI <span className="text-gray-400 font-sans text-xs uppercase tracking-widest block mt-1">Admin Portal</span></h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <Button 
            variant={activeTab === "dashboard" ? "secondary" : "ghost"} 
            className="w-full justify-start gap-3"
            onClick={() => navigate("/admin/dashboard")}
          >
            <LayoutDashboard size={18} /> Dashboard
          </Button>
          <Button 
            variant={activeTab === "products" || activeTab === "add-product" ? "secondary" : "ghost"} 
            className="w-full justify-start gap-3"
            onClick={() => navigate("/admin/products")}
          >
            <Package size={18} /> Products
          </Button>
          <Button 
            variant={activeTab === "categories" ? "secondary" : "ghost"} 
            className="w-full justify-start gap-3"
            onClick={() => navigate("/admin/categories")}
          >
            <FolderTree size={18} /> Categories
          </Button>
          <Button 
            variant={activeTab === "tags" ? "secondary" : "ghost"} 
            className="w-full justify-start gap-3"
            onClick={() => navigate("/admin/tags")}
          >
            <Tag size={18} /> Tags
          </Button>
          <Button 
            variant={activeTab === "banners" ? "secondary" : "ghost"} 
            className="w-full justify-start gap-3"
            onClick={() => navigate("/admin/banners")}
          >
            <Image size={18} /> Banners
          </Button>
          <Button 
            variant={activeTab === "settings" ? "secondary" : "ghost"} 
            className="w-full justify-start gap-3"
            onClick={() => navigate("/admin/settings")}
          >
            <Settings size={18} /> Settings
          </Button>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <Button 
            variant="outline" 
            className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={onLogout}
          >
            <LogOut size={18} /> Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-4">
             {(activeTab === "add-product") && (
                <Button variant="ghost" size="icon" onClick={() => {
                  navigate("/admin/products");
                  setEditingProduct(null);
                }}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
             )}
             <h2 className="text-lg font-medium capitalize">
                {activeTab === "add-product" ? (editingProduct ? "Edit Product" : "Add New Product") : activeTab}
             </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold">
              AD
            </div>
          </div>
        </header>

        <div className="p-8">
          {activeTab === "dashboard" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Total Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{localProducts.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Active Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{localCategories.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Pending Inquiries</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">12</div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "products" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="relative w-72">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                  <Input 
                    placeholder="Search products..." 
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button 
                    className="bg-gray-900 hover:bg-gray-800 gap-2"
                    onClick={() => navigate("/admin/products/add")}
                >
                  <Plus size={16} /> Add Product
                </Button>
              </div>

              <div className="bg-white rounded-md border border-gray-200 overflow-hidden shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Order</TableHead>
                      <TableHead className="w-[80px]">Image</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product, index) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono">#{index + 1}</Badge>
                            <div className="flex flex-col gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => moveProductUp(product)}
                                disabled={index === 0}
                              >
                                <ChevronUp className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => moveProductDown(product)}
                                disabled={index === filteredProducts.length - 1}
                              >
                                <ChevronDown className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="w-10 h-10 rounded overflow-hidden bg-gray-100 border border-gray-100">
                            <img src={product.image} alt="" className="w-full h-full object-cover" />
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{product.title}</TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell>
                          <button
                            onClick={async () => {
                              try {
                                // 获取产品 ID
                                let productId: number;
                                if (typeof product.id === 'number') {
                                  productId = product.id;
                                } else {
                                  toast.error("无法找到产品 ID，请刷新页面重试");
                                  return;
                                }

                                // 切换状态：Active -> Draft, Draft -> Active
                                const currentStatus = product.status || "active";
                                const newStatus = currentStatus === "active" || currentStatus === "Active" ? "draft" : "active";
                                const isActive = newStatus === "active";

                                console.log("[快速切换状态] 产品 ID:", productId);
                                console.log("[快速切换状态] 当前状态:", currentStatus, "-> 新状态:", newStatus, "is_active:", isActive);

                                // 调用更新接口
                                await updateProduct(productId, {
                                  is_active: isActive
                                });

                                toast.success(`产品状态已更新为 ${isActive ? "Active" : "Draft"}`);
                                
                                // 刷新产品列表
                                await onProductsUpdate([]);
                              } catch (error: any) {
                                console.error("快速切换状态失败：", error);
                                toast.error(error?.message || "状态更新失败，请重试");
                              }
                            }}
                            className="cursor-pointer"
                          >
                            <Badge 
                              variant="secondary" 
                              className={
                                (product.status === "active" || product.status === "Active")
                                  ? "bg-green-100 text-green-800 hover:bg-green-200 border-green-200 cursor-pointer"
                                  : "bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200 cursor-pointer"
                              }
                            >
                              {product.status === "active" || product.status === "Active" ? "Active" : "Draft"}
                            </Badge>
                          </button>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleEditProduct(product)}>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(product.id)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredProducts.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10 text-gray-500">
                          No products found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {activeTab === "add-product" && (
            <AddProductForm 
              product={newProduct}
              categories={localCategories}
              tags={localTags}
              isEditing={!!editingProduct}
              onProductChange={setNewProduct}
              onImageUpload={handleImageUpload}
              onVideoUpload={handleVideoUpload}
              onRemoveImage={handleRemoveImage}
              onRemoveVideo={handleRemoveVideo}
              onAddFeature={handleAddFeature}
              onRemoveFeature={handleRemoveFeature}
              onFeatureChange={handleFeatureChange}
              onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct}
              onCancel={() => {
                navigate("/admin/products");
                setEditingProduct(null);
              }}
            />
          )}

          {activeTab === "categories" && (
             <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div className="relative w-72">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                        <Input 
                            placeholder="Search categories..." 
                            className="pl-8"
                            value={categorySearchTerm}
                            onChange={(e) => setCategorySearchTerm(e.target.value)}
                        />
                    </div>
                    <Button 
                        className="bg-gray-900 hover:bg-gray-800 gap-2"
                        onClick={() => handleOpenCategoryDialog()}
                    >
                        <Plus size={16} /> Add Category
                    </Button>
                </div>

                <div className="bg-white rounded-md border border-gray-200 overflow-hidden shadow-sm">
                    {categoriesWithCounts.filter(cat => cat.name.toLowerCase().includes(categorySearchTerm.toLowerCase())).length === 0 ? (
                        <div className="py-12 text-center text-gray-500">
                            <FolderTree className="mx-auto h-12 w-12 mb-4 opacity-20" />
                            <p>No categories found</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">Order</TableHead>
                                    <TableHead>Category Name</TableHead>
                                    <TableHead className="w-[120px]">Products</TableHead>
                                    <TableHead className="w-[120px]">Status</TableHead>
                                    <TableHead className="text-right w-[80px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {categoriesWithCounts
                                    .filter(cat => cat.name.toLowerCase().includes(categorySearchTerm.toLowerCase()))
                                    .map((cat, index, array) => (
                                    <TableRow key={cat.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="flex flex-col gap-0.5">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-5 w-5 p-0 hover:bg-gray-100"
                                                        onClick={() => moveCategoryUp(cat)}
                                                        disabled={index === 0}
                                                    >
                                                        <ChevronUp className={`h-3.5 w-3.5 ${index === 0 ? 'text-gray-300' : 'text-gray-600'}`} />
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-5 w-5 p-0 hover:bg-gray-100"
                                                        onClick={() => moveCategoryDown(cat)}
                                                        disabled={index === array.length - 1}
                                                    >
                                                        <ChevronDown className={`h-3.5 w-3.5 ${index === array.length - 1 ? 'text-gray-300' : 'text-gray-600'}`} />
                                                    </Button>
                                                </div>
                                                <span className="text-sm text-gray-500 font-mono">#{index + 1}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">{cat.name}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">{cat.count}</span>
                                                <span className="text-xs text-gray-500">
                                                    {cat.count === 1 ? "product" : "products"}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        // 获取类目 ID
                                                        const categoryId = cat._originalId;
                                                        if (!categoryId) {
                                                            toast.error("无法找到类目 ID，请刷新页面重试");
                                                            return;
                                                        }

                                                        // 切换状态：Active -> Inactive, Inactive -> Active
                                                        const currentStatus = cat.status || "Active";
                                                        const newStatus = currentStatus === "Active" ? "Inactive" : "Active";
                                                        const isActive = newStatus === "Active";

                                                        console.log("[快速切换类目状态] 类目 ID:", categoryId);
                                                        console.log("[快速切换类目状态] 当前状态:", currentStatus, "-> 新状态:", newStatus, "is_active:", isActive);

                                                        // 调用更新接口
                                                        await updateCategory(categoryId, {
                                                            is_active: isActive
                                                        });

                                                        toast.success(`类目状态已更新为 ${newStatus}`);
                                                        
                                                        // 刷新类目列表
                                                        await refreshData();
                                                    } catch (error: any) {
                                                        console.error("快速切换类目状态失败：", error);
                                                        toast.error(error?.message || "状态更新失败，请重试");
                                                    }
                                                }}
                                                className="cursor-pointer"
                                            >
                                                <Badge 
                                                    variant="secondary" 
                                                    className={
                                                        cat.status === "Active"
                                                            ? "bg-green-100 text-green-800 hover:bg-green-200 border-green-200 cursor-pointer"
                                                            : "bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200 cursor-pointer"
                                                    }
                                                >
                                                    {cat.status}
                                                </Badge>
                                            </button>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="h-4 w-4 text-gray-400" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => handleOpenCategoryDialog(cat)}>
                                                        <Edit className="mr-2 h-4 w-4" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem 
                                                        className="text-red-600" 
                                                        onClick={() => {
                                                          setCategoryToDelete(cat);
                                                          setDeleteDialogOpen(true);
                                                        }}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>

                {/* Category Dialog */}
                <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                    <DialogContent className="sm:max-w-md">
                        <form onSubmit={handleSaveCategory}>
                            <DialogHeader>
                                <DialogTitle>
                                    {editingCategory ? "Edit Category" : "Add New Category"}
                                </DialogTitle>
                                <DialogDescription>
                                    {editingCategory 
                                        ? "Update the category information below." 
                                        : "Create a new product category."}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="category-name">Category Name</Label>
                                    <Input 
                                        id="category-name"
                                        placeholder="e.g. Lingerie Sets"
                                        value={categoryForm.name}
                                        onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="category-status">Status</Label>
                                    <Select 
                                        value={categoryForm.status} 
                                        onValueChange={(val) => setCategoryForm({...categoryForm, status: val})}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Active">Active</SelectItem>
                                            <SelectItem value="Inactive">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => setCategoryDialogOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" className="bg-gray-900 hover:bg-gray-800">
                                    {editingCategory ? "Update" : "Create"} Category
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Delete Category Dialog */}
                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <DialogContent className="sm:max-w-lg">
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          if (categoryToDelete) {
                            handleDeleteCategory(categoryToDelete);
                          }
                          setDeleteDialogOpen(false);
                        }}>
                            <DialogHeader>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                                        <AlertTriangle className="h-6 w-6 text-red-600" />
                                    </div>
                                    <div>
                                        <DialogTitle className="text-left">
                                            Delete Category
                                        </DialogTitle>
                                        <DialogDescription className="text-left">
                                            This action cannot be undone
                                        </DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>
                            <div className="py-4 space-y-4">
                                <p className="text-sm text-gray-600">
                                    You are about to delete the category <span className="font-semibold text-gray-900">"{categoryToDelete?.name}"</span>.
                                </p>
                                {categoryToDelete && categoryToDelete.count > 0 && (
                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                        <div className="flex gap-3">
                                            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                            <div className="text-sm">
                                                <p className="font-medium text-amber-900 mb-1">Warning</p>
                                                <p className="text-amber-700">
                                                    This category has <span className="font-semibold">{categoryToDelete.count} product(s)</span> associated with it. Deleting this category will remove it from these products.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <DialogFooter className="gap-2">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => setDeleteDialogOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" className="bg-red-600 hover:bg-red-700">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Category
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
             </div>
          )}

          {activeTab === "tags" && (
             <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div className="relative w-72">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                        <Input 
                            placeholder="Search tags..." 
                            className="pl-8"
                            value={tagSearchTerm}
                            onChange={(e) => setTagSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button 
                        className="bg-gray-900 hover:bg-gray-800 gap-2"
                        onClick={() => handleOpenTagDialog()}
                    >
                        <Plus size={16} /> Add Tag
                    </Button>
                </div>

                <div className="bg-white rounded-md border border-gray-200 overflow-hidden shadow-sm">
                    {tagsWithCounts.filter(tag => tag.name.toLowerCase().includes(tagSearchTerm.toLowerCase())).length === 0 ? (
                        <div className="py-12 text-center text-gray-500">
                            <Tag className="mx-auto h-12 w-12 mb-4 opacity-20" />
                            <p>No tags found</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">Order</TableHead>
                                    <TableHead>Tag Name</TableHead>
                                    <TableHead className="w-[120px]">Products</TableHead>
                                    <TableHead className="w-[120px]">Color</TableHead>
                                    <TableHead className="text-right w-[80px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tagsWithCounts
                                    .filter(tag => tag.name.toLowerCase().includes(tagSearchTerm.toLowerCase()))
                                    .map((tag, index, array) => (
                                    <TableRow key={tag.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="flex flex-col gap-0.5">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-5 w-5 p-0 hover:bg-gray-100"
                                                        onClick={() => moveTagUp(tag)}
                                                        disabled={index === 0}
                                                    >
                                                        <ChevronUp className={`h-3.5 w-3.5 ${index === 0 ? 'text-gray-300' : 'text-gray-600'}`} />
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-5 w-5 p-0 hover:bg-gray-100"
                                                        onClick={() => moveTagDown(tag)}
                                                        disabled={index === array.length - 1}
                                                    >
                                                        <ChevronDown className={`h-3.5 w-3.5 ${index === array.length - 1 ? 'text-gray-300' : 'text-gray-600'}`} />
                                                    </Button>
                                                </div>
                                                <span className="text-sm text-gray-500 font-mono">#{index + 1}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">{tag.name}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">{tag.count}</span>
                                                <span className="text-xs text-gray-500">
                                                    {tag.count === 1 ? "product" : "products"}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="h-4 w-4 rounded-full" style={{ backgroundColor: tag.color }}></div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="h-4 w-4 text-gray-400" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => handleOpenTagDialog(tag)}>
                                                        <Edit className="mr-2 h-4 w-4" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem 
                                                        className="text-red-600" 
                                                        onClick={() => {
                                                          setTagToDelete(tag);
                                                          setTagDeleteDialogOpen(true);
                                                        }}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>

                {/* Tag Dialog */}
                <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
                    <DialogContent className="sm:max-w-md">
                        <form onSubmit={handleSaveTag}>
                            <DialogHeader>
                                <DialogTitle>
                                    {editingTag ? "Edit Tag" : "Add New Tag"}
                                </DialogTitle>
                                <DialogDescription>
                                    {editingTag 
                                        ? "Update the tag information below." 
                                        : "Create a new product tag."}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="tag-name">Tag Name</Label>
                                    <Input 
                                        id="tag-name"
                                        placeholder="e.g. New Arrival"
                                        value={tagForm.name}
                                        onChange={(e) => setTagForm({...tagForm, name: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tag-color">Color</Label>
                                    <Input 
                                        id="tag-color"
                                        placeholder="e.g. #10b981"
                                        value={tagForm.color}
                                        onChange={(e) => setTagForm({...tagForm, color: e.target.value})}
                                        required
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => setTagDialogOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" className="bg-gray-900 hover:bg-gray-800">
                                    {editingTag ? "Update" : "Create"} Tag
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Delete Tag Dialog */}
                <Dialog open={tagDeleteDialogOpen} onOpenChange={setTagDeleteDialogOpen}>
                    <DialogContent className="sm:max-w-lg">
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          if (tagToDelete) {
                            handleDeleteTag(tagToDelete);
                          }
                          setTagDeleteDialogOpen(false);
                        }}>
                            <DialogHeader>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                                        <AlertTriangle className="h-6 w-6 text-red-600" />
                                    </div>
                                    <div>
                                        <DialogTitle className="text-left">
                                            Delete Tag
                                        </DialogTitle>
                                        <DialogDescription className="text-left">
                                            This action cannot be undone
                                        </DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>
                            <div className="py-4 space-y-4">
                                <p className="text-sm text-gray-600">
                                    You are about to delete the tag <span className="font-semibold text-gray-900">"{tagToDelete?.name}"</span>.
                                </p>
                                {tagToDelete && tagToDelete.count > 0 && (
                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                        <div className="flex gap-3">
                                            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                            <div className="text-sm">
                                                <p className="font-medium text-amber-900 mb-1">Warning</p>
                                                <p className="text-amber-700">
                                                    This tag has <span className="font-semibold">{tagToDelete.count} product(s)</span> associated with it. Deleting this tag will remove it from these products.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <DialogFooter className="gap-2">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => setTagDeleteDialogOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" className="bg-red-600 hover:bg-red-700">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Tag
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
             </div>
          )}

          {activeTab === "banners" && (
            <div>
              <BannerManagement banners={localBanners} onUpdate={onBannersUpdate} />
            </div>
          )}

          {activeTab === "settings" && (
            <div className="max-w-2xl">
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>Manage your store preferences.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500">Settings panel placeholder.</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}