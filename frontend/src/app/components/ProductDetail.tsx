import React, { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Check, ShieldCheck, Ruler, Play, Pause, AlertCircle, Mail, Phone, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "./ui/dialog";

interface Product {
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
}

interface ProductDetailProps {
  product: Product;
  onBack: () => void;
}

type MediaType = 'image' | 'video';

interface MediaItem {
  type: MediaType;
  url: string;
  poster?: string;
}

export function ProductDetail({ product, onBack }: ProductDetailProps) {
  // Build gallery from product data
  const buildGallery = (): MediaItem[] => {
    const items: MediaItem[] = [];
    
    // 使用 gallery 数组（如果存在且不为空）
    // gallery 已经包含了主图，不需要单独添加 product.image
    if (product.gallery && product.gallery.length > 0) {
      // 去重，避免重复显示同一张图片
      const uniqueImages = Array.from(new Set(product.gallery));
      uniqueImages.forEach(url => {
        if (url && url.trim()) {
        items.push({ type: 'image', url });
        }
      });
    } else if (product.image) {
      // 如果没有 gallery，只显示主图
      items.push({ type: 'image', url: product.image });
    }
    
    // 只有在实际存在视频时才添加视频
    if (product.video && product.video.trim()) {
      console.log('[ProductDetail] 产品视频URL:', product.video);
      items.push({ 
        type: 'video', 
        url: product.video, 
        poster: product.image || product.gallery?.[0] 
      });
    } else {
      console.log('[ProductDetail] 产品没有视频:', { video: product.video, productId: product.id });
    }
    
    // 如果没有任何媒体，至少显示主图
    if (items.length === 0 && product.image) {
      items.push({ type: 'image', url: product.image });
    }
    
    return items;
  };

  const gallery = buildGallery();

  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const activeMedia = gallery[activeIndex];

  // Reset view when product changes
  useEffect(() => {
    setActiveIndex(0);
    setIsPlaying(false);
    setVideoError(false);
  }, [product]);

  const handleThumbnailClick = (index: number) => {
    setActiveIndex(index);
    setIsPlaying(false);
    setVideoError(false);
  };

  const toggleVideo = () => {
    if (videoRef.current && !videoError) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
            playPromise.catch((error) => {
                console.error("Video play failed:", error);
                // Autoplay policy or other error
                setIsPlaying(false);
            });
        }
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVideoError = () => {
      console.error("Video failed to load");
      setVideoError(true);
      setIsPlaying(false);
  };

  // Mock details
  const details = {
    material: product.material || "85% Polyamide, 15% Elastane",
    care: product.care || "Hand wash cold, dry flat",
    features: product.features || [
      "Premium French lace detailing",
      "Adjustable straps for perfect fit",
      "Soft, breathable lining",
      "Nickel-free hardware",
    ],
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="pt-24 pb-20 bg-white min-h-screen"
    >
      <div className="container mx-auto px-6">
        {/* Breadcrumb / Back */}
        <button
          onClick={onBack}
          className="group flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-8 transition-colors uppercase tracking-widest"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Products
        </button>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
          {/* Product Media Gallery */}
          <div className="w-full lg:w-1/2">
            
            {/* Main Media Display */}
            <div className="aspect-square overflow-hidden bg-gray-100 relative group">
              {activeMedia.type === 'video' ? (
                <div className="w-full h-full relative">
                  {!videoError ? (
                      <>
                        <video
                            ref={videoRef}
                            src={activeMedia.url}
                            poster={activeMedia.poster}
                            className="w-full h-full object-cover"
                            loop
                            playsInline
                            onError={handleVideoError}
                            onClick={toggleVideo}
                        />
                        {/* Play Overlay Button */}
                        <button
                            onClick={toggleVideo}
                            className={`absolute inset-0 flex items-center justify-center bg-black/10 transition-opacity duration-300 ${
                            isPlaying ? "opacity-0 group-hover:opacity-100" : "opacity-100"
                            }`}
                        >
                            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/40 shadow-lg hover:scale-110 transition-transform">
                            {isPlaying ? <Pause className="text-white fill-white" /> : <Play className="text-white fill-white ml-1" />}
                            </div>
                        </button>
                      </>
                  ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-400">
                          <AlertCircle size={48} className="mb-2 opacity-50" />
                          <p className="text-xs uppercase tracking-widest">Video Unavailable</p>
                      </div>
                  )}
                </div>
              ) : (
                <img
                  src={activeMedia.url}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Thumbnail Grid */}
            <div className="grid grid-cols-4 gap-4 mt-4">
              {gallery.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleThumbnailClick(index)}
                  className={`aspect-square overflow-hidden bg-gray-50 relative border-2 transition-all ${
                    activeIndex === index ? "border-gray-900" : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <img 
                    src={item.type === 'video' && item.poster ? item.poster : item.url} 
                    alt={`View ${index + 1}`} 
                    className="w-full h-full object-cover" 
                  />
                  {item.type === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <Play size={20} className="text-white fill-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="w-full lg:w-1/2">
            <span className="text-gray-400 uppercase tracking-widest text-sm block mb-2">
              {product.category}
            </span>
            <h1 className="text-4xl md:text-5xl font-serif text-gray-900 mb-6">
              {product.title}
            </h1>
            
            <p className="text-gray-600 leading-relaxed mb-8 text-lg">
              {product.description}
            </p>

            {/* Divider */}
            <div className="w-full h-px bg-gray-200 my-8" />

            {/* Features */}
            <div className="mb-10">
              <h3 className="font-serif text-xl mb-4">Key Features</h3>
              <ul className="space-y-3">
                {details.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-gray-600">
                    <Check size={18} className="text-gray-900" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Materials & Care */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              <div className="bg-gray-50 p-6">
                <div className="flex items-center gap-2 mb-3 text-gray-900 font-bold uppercase tracking-widest text-xs">
                  <ShieldCheck size={16} /> Material
                </div>
                <p className="text-gray-600 text-sm">{details.material}</p>
              </div>
              <div className="bg-gray-50 p-6">
                <div className="flex items-center gap-2 mb-3 text-gray-900 font-bold uppercase tracking-widest text-xs">
                  <Ruler size={16} /> Care Guide
                </div>
                <p className="text-gray-600 text-sm">{details.care}</p>
              </div>
            </div>

            {/* CTA */}
            <div className="space-y-4">
              <Dialog>
                <DialogTrigger className="block w-full bg-gray-900 text-white text-center py-4 uppercase tracking-widest text-sm font-bold hover:bg-gray-800 transition-colors">
                  Inquire for Pricing (OEM/ODM)
                </DialogTrigger>
                <DialogContent className="sm:max-w-md bg-white text-gray-900">
                  <DialogHeader>
                    <DialogTitle className="text-center font-serif text-2xl uppercase tracking-widest mb-4">Contact Us</DialogTitle>
                    <DialogDescription className="text-center text-gray-500 text-sm mb-6">
                      Please contact our sales team directly for pricing and manufacturing inquiries.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6 px-4 pb-6">
                    <div className="space-y-4">
                      {/* Email */}
                      <a 
                        href={`mailto:sunly@scaviguangdong.com?subject=Inquiry about ${product.title}`}
                        className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-gray-100 transition-colors rounded-lg group"
                      >
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-700 group-hover:bg-gray-300 transition-colors">
                          <Mail size={18} />
                        </div>
                        <div className="flex-1">
                           <div className="text-xs text-gray-400 uppercase tracking-wider font-bold">Email</div>
                           <div className="text-gray-900 font-medium break-all">sunly@scaviguangdong.com</div>
                        </div>
                      </a>

                      {/* Phone */}
                      <a 
                        href="tel:+8613929207272"
                        className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-gray-100 transition-colors rounded-lg group"
                      >
                         <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-700 group-hover:bg-gray-300 transition-colors">
                          <Phone size={18} />
                        </div>
                        <div className="flex-1">
                           <div className="text-xs text-gray-400 uppercase tracking-wider font-bold">Phone</div>
                           <div className="text-gray-900 font-medium">+86 13929207272</div>
                        </div>
                      </a>

                      {/* Address */}
                      <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                         <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-700 mt-1 shrink-0">
                          <MapPin size={18} />
                        </div>
                        <div className="flex-1">
                           <div className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-1">Factory Location</div>
                           <div className="text-gray-900 text-sm leading-relaxed">
                              Room 301, Building 1, No. 2, Yiheng Road, Xitou, Houjie Town, Dongguan City, Guangdong Province
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <p className="text-center text-xs text-gray-400">
                * Minimum Order Quantity (MOQ) applies for custom manufacturing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}