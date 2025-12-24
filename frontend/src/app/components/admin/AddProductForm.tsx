import React from "react";
import { Upload, Save, X, Plus, CheckCircle2, Trash2, ImageIcon, Tag } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Category, TagItem } from "../../types/admin";
import { getImagePreviewUrl } from "../../utils/imageUtils";

interface ProductFormData {
  title: string;
  category: string;
  sku: string;
  price: string;
  status: string;
  description: string;
  material: string;
  care: string;
  features: string[];
  gallery: string[];
  video: string;
  videoFile: string | null;
  tags: string[];
}

interface AddProductFormProps {
  product: ProductFormData;
  categories: Category[];
  tags?: TagItem[];
  isEditing?: boolean;
  onProductChange: (product: ProductFormData) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onVideoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
  onRemoveVideo: () => void;
  onAddFeature: () => void;
  onRemoveFeature: (index: number) => void;
  onFeatureChange: (index: number, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export function AddProductForm({
  product,
  categories,
  tags,
  isEditing = false,
  onProductChange,
  onImageUpload,
  onVideoUpload,
  onRemoveImage,
  onRemoveVideo,
  onAddFeature,
  onRemoveFeature,
  onFeatureChange,
  onSubmit,
  onCancel
}: AddProductFormProps) {
  return (
    <div className="max-w-6xl mx-auto">
      <form onSubmit={onSubmit}>
        {/* Media Upload Section - Most Important */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Product Images */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Product Images *
              </CardTitle>
              <CardDescription>Upload product photos. First image will be the main display.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center gap-3 hover:bg-gray-50 hover:border-gray-400 transition-all cursor-pointer text-center group">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                  <Upload className="h-8 w-8 text-gray-400 group-hover:text-gray-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700">Click to upload images</div>
                  <div className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</div>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  multiple 
                  accept="image/*" 
                  onChange={onImageUpload}
                />
              </label>
              
              {product.gallery.length === 0 ? (
                <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No images uploaded yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {product.gallery.map((img, index) => (
                    <div key={index} className="relative group rounded-lg overflow-hidden border-2 border-gray-200 hover:border-gray-400 transition-colors aspect-square">
                      <img src={getImagePreviewUrl(img)} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" onError={(e) => {
                        console.error('图片加载失败:', img);
                        // 如果代理失败，尝试直接使用原 URL
                        if (e.currentTarget.src.startsWith('/api/proxy/oss/')) {
                          e.currentTarget.src = img;
                        }
                      }} />
                      {index === 0 && (
                        <div className="absolute top-2 left-2 bg-gray-900 text-white text-xs px-3 py-1 rounded-full uppercase tracking-wide font-bold shadow-lg">
                          Main Image
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button 
                          type="button"
                          className="bg-white hover:bg-red-50 text-red-600 rounded-full p-2 shadow-lg transition-colors"
                          onClick={() => onRemoveImage(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {product.gallery.length > 0 && (
                <div className="text-xs text-gray-500 flex items-center gap-2 pt-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  {product.gallery.length} image{product.gallery.length !== 1 ? 's' : ''} uploaded
                </div>
              )}
            </CardContent>
          </Card>

          {/* Product Video */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Product Video (Optional)
              </CardTitle>
              <CardDescription>Upload a video to showcase your product in action.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center gap-3 hover:bg-gray-50 hover:border-gray-400 transition-all cursor-pointer text-center group">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                  <svg className="h-8 w-8 text-gray-400 group-hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700">Click to upload video</div>
                  <div className="text-xs text-gray-500 mt-1">MP4, WEBM, MOV up to 50MB</div>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="video/*" 
                  onChange={onVideoUpload}
                />
              </label>

              {product.videoFile ? (
                <div className="relative rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-100">
                  <video 
                    src={product.videoFile} 
                    controls 
                    className="w-full max-h-64 object-contain bg-black"
                  />
                  <button 
                    type="button"
                    className="absolute top-2 right-2 bg-white hover:bg-red-50 text-red-600 rounded-full p-2 shadow-lg transition-colors"
                    onClick={onRemoveVideo}
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="p-3 bg-white border-t border-gray-200">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="truncate">{product.video}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  <svg className="h-12 w-12 mx-auto mb-2 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm">No video uploaded yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Product Details and Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Product Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Product Information</CardTitle>
                <CardDescription>Enter the basic details about the product.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Product Name *</Label>
                  <Input 
                    id="title" 
                    placeholder="e.g. Silk Lace Balconette Bra" 
                    value={product.title}
                    onChange={e => onProductChange({...product, title: e.target.value})}
                    required
                    className="text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Describe your product features, materials, and benefits..." 
                    className="min-h-[140px] text-base"
                    value={product.description}
                    onChange={e => onProductChange({...product, description: e.target.value})}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Material & Care</CardTitle>
                <CardDescription>Provide fabric composition and care instructions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="material">Material Composition</Label>
                  <Input 
                    id="material" 
                    placeholder="e.g. 85% Polyamide, 15% Elastane" 
                    value={product.material}
                    onChange={e => onProductChange({...product, material: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="care">Care Instructions</Label>
                  <Input 
                    id="care" 
                    placeholder="e.g. Hand wash cold, dry flat" 
                    value={product.care}
                    onChange={e => onProductChange({...product, care: e.target.value})}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Features</CardTitle>
                <CardDescription>List the key features and highlights.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {product.features.map((feature, index) => (
                  <div key={index} className="flex gap-2">
                    <Input 
                      placeholder={`Feature ${index + 1}`}
                      value={feature}
                      onChange={e => onFeatureChange(index, e.target.value)}
                    />
                    {product.features.length > 1 && (
                      <Button 
                        type="button"
                        variant="outline" 
                        size="icon"
                        onClick={() => onRemoveFeature(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button 
                  type="button"
                  variant="outline" 
                  size="sm"
                  onClick={onAddFeature}
                  className="w-full"
                >
                  <Plus size={14} className="mr-2" /> Add Feature
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - Pricing & Meta */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pricing & Inventory</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <Input 
                    id="price" 
                    placeholder="$0.00" 
                    value={product.price}
                    onChange={e => onProductChange({...product, price: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input 
                    id="sku" 
                    placeholder="SC-001" 
                    value={product.sku}
                    onChange={e => onProductChange({...product, sku: e.target.value})}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="category">Product Category</Label>
                  <Select 
                    value={product.category} 
                    onValueChange={val => onProductChange({...product, category: val})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(c => (
                        <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Product Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={product.status} 
                    onValueChange={val => onProductChange({...product, status: val})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Tags
                </CardTitle>
                <CardDescription>Select tags to categorize this product.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tags && tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {tags.map(tag => {
                        const isSelected = product.tags.includes(tag.name);
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => {
                              const newTags = isSelected
                                ? product.tags.filter(t => t !== tag.name)
                                : [...product.tags, tag.name];
                              onProductChange({...product, tags: newTags});
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border-2 ${
                              isSelected
                                ? 'bg-gray-900 text-white border-gray-900'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <div 
                                className="h-2 w-2 rounded-full" 
                                style={{ backgroundColor: tag.color }}
                              ></div>
                              {tag.name}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No tags available. Create tags in the Tags section.</p>
                  )}
                  {product.tags.length > 0 && (
                    <div className="pt-2 border-t border-gray-100">
                      <div className="text-xs text-gray-500">
                        {product.tags.length} tag{product.tags.length !== 1 ? 's' : ''} selected
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
          <Button type="button" variant="outline" size="lg" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" size="lg" className="bg-gray-900 hover:bg-gray-800 gap-2 px-8">
            <Save size={18} /> {isEditing ? "Update Product" : "Save Product"}
          </Button>
        </div>
      </form>
    </div>
  );
}