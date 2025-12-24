import React, { useState, useEffect } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { useData } from "../context/DataContext";

interface NavbarProps {
  onNavigate?: (sectionId: string) => void;
}

export function Navbar({ onNavigate }: NavbarProps) {
  const navigate = useNavigate();
  const { categories } = useData();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProductsMenuOpen, setIsProductsMenuOpen] = useState(false);
  const closeTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // We no longer need scroll detection for color change, as it will be solid white.
  // But we might want shadow on scroll.
  const [isScrolled, setIsScrolled] = useState(false);
  
  React.useEffect(() => {
     const handleScroll = () => setIsScrolled(window.scrollY > 0);
     window.addEventListener("scroll", handleScroll);
     return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(href);
    }
    const targetId = href.replace("#", "");
    const element = document.getElementById(targetId);
    if (element) {
        // Adjust scroll offset for sticky navbar height (approx 80px)
        const headerOffset = 80;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        
        window.scrollTo({
            top: offsetPosition,
            behavior: "smooth"
        });
    }
    setIsMobileMenuOpen(false);
  };

  const navLinks = [
    { name: "Home", href: "#home" },
    { name: "Products", href: "#products", hasDropdown: true },
    { name: "Factory & Contact", href: "#factory-contact" },
  ];

  // 获取活跃的分类列表
  const activeCategories = categories
    .filter(cat => cat.status === "Active")
    .sort((a, b) => a.order - b.order);

  return (
    <>
    <nav
      className={`sticky top-0 z-50 bg-white transition-shadow duration-300 ${
        isScrolled ? "shadow-md" : "border-b border-gray-100"
      }`}
    >
      <div className="container mx-auto px-6 h-20 flex justify-between items-center">
        {/* Logo */}
        <a 
          href="#home"
          onClick={(e) => handleLinkClick(e, "#home")}
          className="text-2xl font-serif tracking-widest font-bold text-gray-900"
        >
          SCAVI
        </a>

        {/* Desktop Menu */}
        <div className="hidden md:flex space-x-12 items-center">
          {navLinks.map((link) => {
            if (link.hasDropdown && link.name === "Products") {
              return (
                <div
                  key={link.name}
                  className="relative"
                  onMouseEnter={() => {
                    // 清除任何待关闭的定时器
                    if (closeTimeoutRef.current) {
                      clearTimeout(closeTimeoutRef.current);
                      closeTimeoutRef.current = null;
                    }
                    setIsProductsMenuOpen(true);
                  }}
                  onMouseLeave={() => {
                    // 延迟关闭，给用户时间移动到下拉菜单
                    closeTimeoutRef.current = setTimeout(() => {
                      setIsProductsMenuOpen(false);
                    }, 200); // 200ms 延迟
                  }}
                >
                  <a
                    href={link.href}
                    onClick={(e) => handleLinkClick(e, link.href)}
                    className="text-sm uppercase tracking-widest text-gray-600 hover:text-gray-900 transition-colors font-medium flex items-center gap-1"
                  >
                    {link.name}
                    <ChevronDown size={14} className={`transition-transform ${isProductsMenuOpen ? 'rotate-180' : ''}`} />
                  </a>
                  {isProductsMenuOpen && activeCategories.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      onMouseEnter={() => {
                        // 鼠标进入下拉菜单时，清除关闭定时器
                        if (closeTimeoutRef.current) {
                          clearTimeout(closeTimeoutRef.current);
                          closeTimeoutRef.current = null;
                        }
                      }}
                      onMouseLeave={() => {
                        // 鼠标离开下拉菜单时，延迟关闭
                        closeTimeoutRef.current = setTimeout(() => {
                          setIsProductsMenuOpen(false);
                        }, 200);
                      }}
                      className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 shadow-lg rounded-sm py-2 z-50"
                    >
                      <a
                        href="/products"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate("/products");
                          setIsProductsMenuOpen(false);
                        }}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 uppercase tracking-widest"
                      >
                        All Products
                      </a>
                      <div className="border-t border-gray-200 my-1"></div>
                      {activeCategories.map((category) => (
                        <a
                          key={category.id}
                          href={`/categories/${category._originalId}`}
                          onClick={(e) => {
                            e.preventDefault();
                            navigate(`/categories/${category._originalId}`);
                            setIsProductsMenuOpen(false);
                          }}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 uppercase tracking-widest"
                        >
                          {category.name}
                        </a>
                      ))}
                    </motion.div>
                  )}
                </div>
              );
            }
            return (
            <a
              key={link.name}
              href={link.href}
              onClick={(e) => handleLinkClick(e, link.href)}
              className="text-sm uppercase tracking-widest text-gray-600 hover:text-gray-900 transition-colors font-medium"
            >
              {link.name}
            </a>
            );
          })}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-gray-900 focus:outline-none"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="absolute top-full left-0 right-0 bg-white border-t border-gray-100 shadow-xl overflow-hidden"
          >
            <div className="flex flex-col p-6 space-y-4">
              {navLinks.map((link) => {
                if (link.hasDropdown && link.name === "Products") {
                  return (
                    <div key={link.name} className="space-y-2">
                      <a
                        href={link.href}
                        className="text-gray-800 uppercase tracking-widest text-sm py-3 border-b border-gray-100 hover:text-gray-500 cursor-pointer flex items-center justify-between"
                        onClick={(e) => handleLinkClick(e, link.href)}
                      >
                        {link.name}
                        <ChevronDown size={16} />
                      </a>
                      <div className="pl-4 space-y-2">
                        <a
                          href="/products"
                          onClick={(e) => {
                            e.preventDefault();
                            navigate("/products");
                            setIsMobileMenuOpen(false);
                          }}
                          className="block text-gray-600 uppercase tracking-widest text-xs py-2 hover:text-gray-900"
                        >
                          All Products
                        </a>
                        {activeCategories.map((category) => (
                          <a
                            key={category.id}
                            href={`/categories/${category._originalId}`}
                            onClick={(e) => {
                              e.preventDefault();
                              navigate(`/categories/${category._originalId}`);
                              setIsMobileMenuOpen(false);
                            }}
                            className="block text-gray-600 uppercase tracking-widest text-xs py-2 hover:text-gray-900"
                          >
                            {category.name}
                          </a>
                        ))}
                      </div>
                    </div>
                  );
                }
                return (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-gray-800 uppercase tracking-widest text-sm py-3 border-b border-gray-100 last:border-0 hover:text-gray-500 cursor-pointer"
                  onClick={(e) => handleLinkClick(e, link.href)}
                >
                  {link.name}
                </a>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
    </>
  );
}
