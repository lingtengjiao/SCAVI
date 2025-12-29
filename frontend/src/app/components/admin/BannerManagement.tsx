import React, { useState } from "react";
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Trash2, 
  Edit,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  Image as ImageIcon,
  Upload,
  X,
  CheckCircle2,
  ExternalLink,
  GripVertical
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "../ui/dropdown-menu";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { HeroSlide } from "../../types/admin";
import { createHeroSlide, updateHeroSlide, deleteHeroSlide, uploadFile } from "../../services/adminApi";
import { useData } from "../../context/DataContext";
import { getImagePreviewUrl } from "../../utils/imageUtils";

// Re-export for backward compatibility
export type { HeroSlide };

interface BannerManagementProps {
  banners: HeroSlide[];
  onUpdate: (banners: HeroSlide[]) => void;
}

export function BannerManagement({ banners, onUpdate }: BannerManagementProps) {
  const { refreshData } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<HeroSlide | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState<HeroSlide | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [bannerForm, setBannerForm] = useState({
    title: "",
    subtitle: "",
    description: "",
    link: "",
    buttonText: "",
    image: "",
    textColor: "white" as "white" | "black",
    status: "active" as "active" | "draft"
  });

  const handleOpenDialog = (banner?: HeroSlide) => {
    if (banner) {
      setEditingBanner(banner);
      // 统一 status 格式：将 "Active"/"Inactive" 转换为 "active"/"draft"
      let statusValue: "active" | "draft" = banner.status || "active";
      if (statusValue === "Active") {
        statusValue = "active";
      } else if (statusValue === "Inactive") {
        statusValue = "draft";
      }
      
      setBannerForm({
        title: banner.title,
        subtitle: banner.subtitle,
        description: banner.description,
        link: banner.link,
        buttonText: banner.buttonText,
        image: banner.image,
        textColor: banner.textColor || "white",
        status: statusValue
      });
      // 使用代理 URL 显示预览（如果是 OSS URL）
      setImagePreview(banner.image ? getImagePreviewUrl(banner.image) : null);
    } else {
      setEditingBanner(null);
      setBannerForm({
        title: "",
        subtitle: "",
        description: "",
        link: "",
        buttonText: "",
        image: "",
        textColor: "white",
        status: "active"
      });
      setImagePreview(null);
    }
    setDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("请上传图片文件");
      e.target.value = "";
      return;
    }

    // 检查文件大小（限制 10MB）
    if (file.size > 10 * 1024 * 1024) {
      toast.error("图片文件大小不能超过 10MB");
      e.target.value = "";
      return;
    }

    try {
      toast.loading("正在上传图片...");
      console.log("[handleImageUpload] 开始上传图片文件:", file.name);
      
      // 先显示预览（使用 base64）
      const reader = new FileReader();
      reader.onloadend = () => {
        const previewUrl = reader.result as string;
        setImagePreview(previewUrl);
      };
      reader.readAsDataURL(file);

      // 上传文件到服务器
      const imageUrl = await uploadFile(file);
      console.log("[handleImageUpload] 上传成功，返回的URL:", imageUrl);

      // 验证 URL：允许本地路径 (/uploads/) 或 OSS URL (http:// 或 https://)
      if (!imageUrl || (!imageUrl.startsWith('/uploads/') && !imageUrl.startsWith('http://') && !imageUrl.startsWith('https://'))) {
        throw new Error('上传的图片URL无效');
      }
      
      // 更新表单中的图片 URL
      setBannerForm(prev => ({ ...prev, image: imageUrl }));
      
      // 如果上传成功，保持 base64 预览，或者使用代理 URL（如果是 OSS URL）
      // imagePreview 已经是 base64，保持不变即可
      // 如果后续需要显示实际 URL，可以使用 getImagePreviewUrl(imageUrl)
      
      toast.dismiss();
      toast.success("图片上传成功");
      console.log("[handleImageUpload] 图片URL已设置:", imageUrl);
    } catch (error: any) {
      toast.dismiss();
      console.error("图片上传失败:", error);
      toast.error(error?.message || "图片上传失败，请重试");
      setImagePreview(null);
    }
    
    e.target.value = "";
  };

  const handleRemoveImage = () => {
    setBannerForm(prev => ({ ...prev, image: "" }));
    setImagePreview(null);
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bannerForm.title.trim() || !bannerForm.subtitle.trim() || !bannerForm.image) {
      toast.error("标题、副标题和图片是必填项");
      return;
    }

    try {
    if (editingBanner) {
        // Edit existing banner - 从 id 中提取数字 ID
        const slideId = typeof editingBanner.id === 'number' 
          ? editingBanner.id 
          : parseInt(String(editingBanner.id).replace('slide-', ''));
        
        if (isNaN(slideId)) {
          toast.error("无效的轮播图 ID");
          return;
        }

        // 统一 status 转换：active -> true, draft -> false
        const isActive = bannerForm.status === "active";
        console.log("[handleSaveBanner] 更新轮播图 Status 转换:", {
          status: bannerForm.status,
          isActive: isActive
        });

        await updateHeroSlide(slideId, {
              title: bannerForm.title,
              subtitle: bannerForm.subtitle,
          description: bannerForm.description || undefined,
          link: bannerForm.link || undefined,
          button_text: bannerForm.buttonText || undefined,
              image: bannerForm.image,
          text_color: bannerForm.textColor,
          is_active: isActive,  // 使用转换后的布尔值
        });
        
        toast.success(`轮播图 "${bannerForm.title}" 更新成功`);
    } else {
      // Add new banner
        // 统一 status 转换：active -> true, draft -> false
        const isActive = bannerForm.status === "active";
        console.log("[handleSaveBanner] 创建轮播图 Status 转换:", {
          status: bannerForm.status,
          isActive: isActive
        });

        await createHeroSlide({
        title: bannerForm.title,
        subtitle: bannerForm.subtitle,
          description: bannerForm.description || undefined,
          link: bannerForm.link || undefined,
          button_text: bannerForm.buttonText || undefined,
        image: bannerForm.image,
          text_color: bannerForm.textColor,
          order: banners.length + 1,
          is_active: isActive,  // 使用转换后的布尔值
        });
      
        toast.success(`轮播图 "${bannerForm.title}" 创建成功`);
    }

      // 刷新数据
      await refreshData();

    setDialogOpen(false);
    setBannerForm({
      title: "",
      subtitle: "",
      description: "",
      link: "",
      buttonText: "",
      image: "",
      textColor: "white",
      status: "active"
    });
    setImagePreview(null);
    setEditingBanner(null);
    } catch (error: any) {
      toast.error(error.message || "操作失败");
    }
  };

  const handleDeleteBanner = async (banner: HeroSlide) => {
    try {
      // 从 id 中提取数字 ID
      const slideId = typeof banner.id === 'number' 
        ? banner.id 
        : parseInt(String(banner.id).replace('slide-', ''));
      
      if (isNaN(slideId)) {
        toast.error("无效的轮播图 ID");
        return;
      }

      await deleteHeroSlide(slideId);
      toast.success(`轮播图 "${banner.title}" 删除成功`);
      
      // 刷新数据
      await refreshData();
    } catch (error: any) {
      toast.error(error.message || "删除失败");
    }
  };

  const moveBannerUp = async (banner: HeroSlide) => {
    const currentIndex = banners.findIndex(b => b.id === banner.id);
    if (currentIndex <= 0) return;

    const previousBanner = banners[currentIndex - 1];
    const slideId = typeof banner.id === 'number' 
      ? banner.id 
      : parseInt(String(banner.id).replace('slide-', ''));
    const previousSlideId = typeof previousBanner.id === 'number'
      ? previousBanner.id
      : parseInt(String(previousBanner.id).replace('slide-', ''));

    if (isNaN(slideId) || isNaN(previousSlideId)) {
      toast.error("无效的轮播图 ID");
      return;
    }

    try {
      // 交换两个轮播图的 order
      const newOrder = previousBanner.order;
      const oldOrder = banner.order;

      await updateHeroSlide(slideId, { order: newOrder });
      await updateHeroSlide(previousSlideId, { order: oldOrder });

      toast.success("轮播图顺序已更新");
      await refreshData();
    } catch (error: any) {
      toast.error(error.message || "更新失败");
    }
  };

  const moveBannerDown = async (banner: HeroSlide) => {
    const currentIndex = banners.findIndex(b => b.id === banner.id);
    if (currentIndex >= banners.length - 1) return;

    const nextBanner = banners[currentIndex + 1];
    const slideId = typeof banner.id === 'number' 
      ? banner.id 
      : parseInt(String(banner.id).replace('slide-', ''));
    const nextSlideId = typeof nextBanner.id === 'number'
      ? nextBanner.id
      : parseInt(String(nextBanner.id).replace('slide-', ''));

    if (isNaN(slideId) || isNaN(nextSlideId)) {
      toast.error("无效的轮播图 ID");
      return;
    }

    try {
      // 交换两个轮播图的 order
      const newOrder = nextBanner.order;
      const oldOrder = banner.order;

      await updateHeroSlide(slideId, { order: newOrder });
      await updateHeroSlide(nextSlideId, { order: oldOrder });

      toast.success("轮播图顺序已更新");
      await refreshData();
    } catch (error: any) {
      toast.error(error.message || "更新失败");
    }
  };

  // 按 order 排序并过滤
  const filteredBanners = banners
    .filter(b => 
    b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.subtitle.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Hero Banners</h3>
          <p className="text-sm text-gray-500 mt-1">Manage homepage carousel slides</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search banners..." 
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            className="bg-gray-900 hover:bg-gray-800 gap-2 w-full sm:w-auto"
            onClick={() => handleOpenDialog()}
          >
            <Plus size={16} /> Add Banner
          </Button>
        </div>
      </div>

      {/* Banner Cards Grid */}
      {filteredBanners.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="text-center text-gray-500">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <ImageIcon className="h-8 w-8 text-gray-400" />
              </div>
              <p className="font-medium text-gray-900 mb-1">No banners found</p>
              <p className="text-sm">Create your first banner to get started</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredBanners.map((banner, index, array) => (
            <Card key={banner.id} className="group hover:shadow-lg transition-all duration-300 border-gray-200">
              <CardContent className="p-0">
                {/* Image Preview */}
                <div className="relative aspect-[16/9] overflow-hidden bg-gray-100 rounded-t-lg">
                  <img 
                    src={banner.image} 
                    alt={banner.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Order Badge */}
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-black/80 text-white hover:bg-black/80 backdrop-blur-sm font-mono">
                      #{index + 1}
                    </Badge>
                  </div>

                  {/* Actions Overlay */}
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2">
                    {/* Order Controls */}
                    <div className="flex flex-col gap-1">
                      <Button 
                        variant="secondary" 
                        size="icon" 
                        className="h-8 w-8 bg-white/90 hover:bg-white shadow-sm backdrop-blur-sm"
                        onClick={() => moveBannerUp(banner)}
                        disabled={index === 0}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="icon" 
                        className="h-8 w-8 bg-white/90 hover:bg-white shadow-sm backdrop-blur-sm"
                        onClick={() => moveBannerDown(banner)}
                        disabled={index === array.length - 1}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* More Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="secondary" 
                          size="icon"
                          className="h-8 w-8 bg-white/90 hover:bg-white shadow-sm backdrop-blur-sm"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleOpenDialog(banner)}>
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600" 
                          onClick={() => {
                            setBannerToDelete(banner);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Gradient Overlay at Bottom */}
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />
                  
                  {/* Button Text Preview */}
                  {banner.buttonText && (
                    <div className="absolute bottom-3 left-3">
                      <Badge variant="secondary" className="bg-white/90 text-gray-900 hover:bg-white/90 backdrop-blur-sm">
                        {banner.buttonText}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 space-y-3">
                  {/* Title & Subtitle */}
                  <div>
                    <h4 className="font-semibold text-gray-900 text-lg mb-1 line-clamp-1">
                      {banner.title}
                    </h4>
                    <p className="text-sm text-gray-600 line-clamp-1">
                      {banner.subtitle}
                    </p>
                  </div>

                  {/* Description */}
                  {banner.description && (
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {banner.description}
                    </p>
                  )}

                  {/* Link */}
                  {banner.link && (
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <ExternalLink className="h-3 w-3" />
                      <span className="truncate">{banner.link}</span>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleOpenDialog(banner)}
                    >
                      <Edit className="h-3.5 w-3.5 mr-1.5" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      onClick={() => {
                        setBannerToDelete(banner);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Banner Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSaveBanner}>
            <DialogHeader>
              <DialogTitle>
                {editingBanner ? "Edit Banner" : "Add New Banner"}
              </DialogTitle>
              <DialogDescription>
                {editingBanner 
                  ? "Update the banner information below." 
                  : "Create a new banner for the homepage carousel."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-5 py-6">
              {/* Image Upload */}
              <div className="space-y-2">
                <Label>Banner Image *</Label>
                {!imagePreview && !bannerForm.image ? (
                  <label className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center gap-3 hover:bg-gray-50 hover:border-gray-400 transition-all cursor-pointer text-center group">
                    <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                      <Upload className="h-7 w-7 text-gray-400 group-hover:text-gray-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-1">Click to upload banner image</div>
                      <div className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</div>
                      <div className="text-xs text-gray-400 mt-1">Recommended: 1920×1080px (16:9 ratio)</div>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleImageUpload}
                    />
                  </label>
                ) : (
                  <div className="relative rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-100">
                    <img 
                      src={imagePreview || getImagePreviewUrl(bannerForm.image)} 
                      alt="Preview" 
                      className="w-full h-64 object-cover"
                      onError={(e) => {
                        console.error('图片加载失败:', imagePreview || bannerForm.image);
                        // 如果代理失败，尝试直接使用原 URL
                        const originalUrl = bannerForm.image;
                        if (e.currentTarget.src.startsWith('/api/proxy/oss/') && originalUrl) {
                          e.currentTarget.src = originalUrl;
                        }
                      }}
                    />
                    <button 
                      type="button"
                      className="absolute top-3 right-3 bg-white hover:bg-red-50 text-red-600 rounded-full p-2 shadow-lg transition-colors"
                      onClick={handleRemoveImage}
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="absolute bottom-3 left-3">
                      <div className="bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg flex items-center gap-2 shadow-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-xs font-medium text-gray-900">Image uploaded successfully</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Title & Subtitle */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="banner-title">Title *</Label>
                  <Input 
                    id="banner-title"
                    placeholder="e.g. SCAVI"
                    value={bannerForm.title}
                    onChange={(e) => setBannerForm({...bannerForm, title: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="banner-subtitle">Subtitle *</Label>
                  <Input 
                    id="banner-subtitle"
                    placeholder="e.g. Professional Lingerie Manufacturer"
                    value={bannerForm.subtitle}
                    onChange={(e) => setBannerForm({...bannerForm, subtitle: e.target.value})}
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="banner-description">Description</Label>
                <Textarea 
                  id="banner-description"
                  placeholder="Brief description of what this banner promotes..."
                  className="min-h-[100px] resize-none"
                  value={bannerForm.description}
                  onChange={(e) => setBannerForm({...bannerForm, description: e.target.value})}
                />
              </div>

              {/* Link & Button Text */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="banner-link">Link URL</Label>
                  <Input 
                    id="banner-link"
                    placeholder="e.g. #products or https://..."
                    value={bannerForm.link}
                    onChange={(e) => setBannerForm({...bannerForm, link: e.target.value})}
                  />
                  <p className="text-xs text-gray-500">Use #section-id for internal links</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="banner-button">Button Text</Label>
                  <Input 
                    id="banner-button"
                    placeholder="e.g. View Products"
                    value={bannerForm.buttonText}
                    onChange={(e) => setBannerForm({...bannerForm, buttonText: e.target.value})}
                  />
                </div>
              </div>

              {/* Text Color Selector */}
              <div className="space-y-2">
                <Label>Text Color</Label>
                <p className="text-xs text-gray-500 mb-3">Choose text color for optimal contrast with your banner image</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setBannerForm({...bannerForm, textColor: 'white'})}
                    className={`relative p-4 border-2 rounded-lg transition-all ${
                      bannerForm.textColor === 'white' 
                        ? 'border-gray-900 bg-gray-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">Aa</span>
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-gray-900 text-sm">White Text</div>
                        <div className="text-xs text-gray-500">Best for dark images</div>
                      </div>
                    </div>
                    {bannerForm.textColor === 'white' && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle2 className="h-5 w-5 text-gray-900" />
                      </div>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setBannerForm({...bannerForm, textColor: 'black'})}
                    className={`relative p-4 border-2 rounded-lg transition-all ${
                      bannerForm.textColor === 'black' 
                        ? 'border-gray-900 bg-gray-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                        <span className="text-gray-900 font-semibold text-sm">Aa</span>
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-gray-900 text-sm">Black Text</div>
                        <div className="text-xs text-gray-500">Best for light images</div>
                      </div>
                    </div>
                    {bannerForm.textColor === 'black' && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle2 className="h-5 w-5 text-gray-900" />
                      </div>
                    )}
                  </button>
                </div>
              </div>

              {/* Status Selector */}
              <div className="space-y-2">
                <Label htmlFor="banner-status">Status</Label>
                <Select 
                  value={bannerForm.status} 
                  onValueChange={(val: "active" | "draft") => setBannerForm({...bannerForm, status: val})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">Active banners will be displayed on the homepage</p>
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-gray-900 hover:bg-gray-800">
                {editingBanner ? "Update" : "Create"} Banner
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Banner Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={(e) => {
            e.preventDefault();
            if (bannerToDelete) {
              handleDeleteBanner(bannerToDelete);
            }
            setDeleteDialogOpen(false);
          }}>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <DialogTitle className="text-left">
                    Delete Banner
                  </DialogTitle>
                  <DialogDescription className="text-left">
                    This action cannot be undone
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-gray-600">
                You are about to delete the banner <span className="font-semibold text-gray-900">"{bannerToDelete?.title}"</span>. This will remove it from the homepage carousel.
              </p>
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
                Delete Banner
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}