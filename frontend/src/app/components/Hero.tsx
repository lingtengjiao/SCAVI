import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { HeroSlide } from "../types/admin";

interface HeroProps {
  banners?: HeroSlide[];
}

export function Hero({ banners }: HeroProps) {
  const defaultSlides: HeroSlide[] = [
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1741635622077-db2a3ee14a73?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHdlYXJpbmclMjBzaWxrJTIwcm9iZSUyMGx1eHVyeXxlbnwxfHx8fDE3NjU2MDU3ODV8MA&ixlib=rb-4.1.0&q=80&w=1080",
      title: "SCAVI",
      subtitle: "Professional Lingerie Manufacturer",
      description: "Defining elegance through OEM/ODM excellence and customized design.",
      link: "#factory-contact",
      buttonText: "Partner With Us",
      textColor: "white"
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1707280133212-53c57117fe5c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwbHV4dXJ5JTIwbGluZ2VyaWUlMjBsYWNlJTIwZGV0YWlsfGVufDF8fHx8MTc2NTYwNTc4Nnww&ixlib=rb-4.1.0&q=80&w=1080",
      title: "Exquisite Craftsmanship",
      subtitle: "Detailed to Perfection",
      description: "Premium materials and intricate lace details for the modern brand.",
      link: "#products",
      buttonText: "View Products",
      textColor: "white"
    },
    {
      id: 3,
      image: "https://images.unsplash.com/photo-1549488350-a9202534f595?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHwld2hpdGUlMjBsaW5nZXJpZSUyMHdlZGRpbmd8ZW58MXx8fHwxNzY1NjA2MDAwfDA&ixlib=rb-4.1.0&q=80&w=1080",
      title: "Global Standards",
      subtitle: "Export Ready",
      description: "Meeting international quality standards with sustainable production.",
      link: "#factory-contact",
      buttonText: "Learn More",
      textColor: "white"
    }
  ];
  
  // 按 order 排序，如果没有数据则使用默认数据
  const sortedBanners = banners && banners.length > 0 
    ? [...banners].sort((a, b) => (a.order || 0) - (b.order || 0))
    : defaultSlides;
  const slides = sortedBanners;
  
  // 调试日志
  React.useEffect(() => {
    console.log("Hero 组件轮播图数据：", {
      banners: banners?.length || 0,
      slides: slides.length,
      usingDefault: slides === defaultSlides
    });
  }, [banners, slides]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrent((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrent((prev) => (prev - 1 + slides.length) % slides.length);

  // Get current text color with fallback to white
  const currentTextColor = slides[current].textColor || 'white';
  const isWhiteText = currentTextColor === 'white';

  return (
    <section id="home" className="relative h-[calc(100vh-80px)] min-h-[600px] flex items-center justify-center overflow-hidden bg-gray-100">
      {/* Carousel Background */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0 z-0"
        >
           <div className="absolute inset-0 bg-black/20 z-10" />
           <img
            src={slides[current].image}
            alt="Hero Slide"
            className="w-full h-full object-cover"
          />
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <button 
        onClick={prevSlide}
        className={`absolute left-4 md:left-8 z-30 p-3 rounded-full transition-all hidden md:block ${
          isWhiteText 
            ? 'text-white/70 hover:text-white hover:bg-white/10 border border-white/20' 
            : 'text-gray-900/70 hover:text-gray-900 hover:bg-gray-900/10 border border-gray-900/20'
        }`}
      >
        <ChevronLeft size={32} />
      </button>
      <button 
        onClick={nextSlide}
        className={`absolute right-4 md:right-8 z-30 p-3 rounded-full transition-all hidden md:block ${
          isWhiteText 
            ? 'text-white/70 hover:text-white hover:bg-white/10 border border-white/20' 
            : 'text-gray-900/70 hover:text-gray-900 hover:bg-gray-900/10 border border-gray-900/20'
        }`}
      >
        <ChevronRight size={32} />
      </button>

      {/* Indicators */}
      <div className="absolute bottom-10 z-30 flex gap-4">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`transition-all duration-300 rounded-full ${
              isWhiteText
                ? index === current ? "bg-white w-3 h-3" : "bg-white/40 w-2 h-2 hover:bg-white/60"
                : index === current ? "bg-gray-900 w-3 h-3" : "bg-gray-900/40 w-2 h-2 hover:bg-gray-900/60"
            }`}
          />
        ))}
      </div>

      {/* Content */}
      <div className={`relative z-20 text-center px-6 max-w-5xl mx-auto ${isWhiteText ? 'text-white' : 'text-gray-900'}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.8 }}
          >
            <span className={`block text-xs md:text-sm uppercase tracking-[0.4em] mb-6 font-medium ${
              isWhiteText ? 'text-white/80' : 'text-gray-900/80'
            }`}>
              {slides[current].subtitle}
            </span>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif mb-8 leading-tight">
              {slides[current].title}
            </h1>

            <p className={`text-lg md:text-xl font-light tracking-wide mb-12 max-w-2xl mx-auto ${
              isWhiteText ? 'text-white/90' : 'text-gray-900/90'
            }`}>
              {slides[current].description}
            </p>

            <div>
              {slides[current].link?.startsWith('#') ? (
              <a
                href={slides[current].link}
                  onClick={(e) => {
                    e.preventDefault();
                    const targetId = slides[current].link?.replace('#', '');
                    const element = document.getElementById(targetId || '');
                    if (element) {
                      const headerOffset = 80;
                      const elementPosition = element.getBoundingClientRect().top;
                      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                      window.scrollTo({
                        top: offsetPosition,
                        behavior: "smooth"
                      });
                    }
                  }}
                  className={`inline-flex items-center gap-3 px-10 py-4 uppercase tracking-widest text-xs font-bold transition-all duration-300 ${
                    isWhiteText 
                      ? 'bg-white text-gray-900 hover:bg-gray-100' 
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {slides[current].buttonText} <ArrowRight size={16} />
                </a>
              ) : (
                <a
                  href={slides[current].link || '#'}
                className={`inline-flex items-center gap-3 px-10 py-4 uppercase tracking-widest text-xs font-bold transition-all duration-300 ${
                  isWhiteText 
                    ? 'bg-white text-gray-900 hover:bg-gray-100' 
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}
              >
                {slides[current].buttonText} <ArrowRight size={16} />
              </a>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}