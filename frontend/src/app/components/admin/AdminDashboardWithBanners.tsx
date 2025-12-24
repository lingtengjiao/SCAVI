import React, { useState } from "react";
import { Image } from "lucide-react";
import { Button } from "../ui/button";
import { AdminDashboard } from "./AdminDashboard";
import { BannerManagement, HeroSlide } from "./BannerManagement";

interface AdminDashboardWithBannersProps {
  onLogout: () => void;
}

export function AdminDashboardWithBanners({ onLogout }: AdminDashboardWithBannersProps) {
  const [activeTab, setActiveTab] = useState("products");
  
  // Banners management state
  const [localBanners, setLocalBanners] = useState<HeroSlide[]>([
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1741635622077-db2a3ee14a73?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHdlYXJpbmclMjBzaWxrJTIwcm9iZSUyMGx1eHVyeXxlbnwxfHx8fDE3NjU2MDU3ODV8MA&ixlib=rb-4.1.0&q=80&w=1080",
      title: "SCAVI",
      subtitle: "Professional Lingerie Manufacturer",
      description: "Defining elegance through OEM/ODM excellence and customized design.",
      link: "#factory-contact",
      buttonText: "Partner With Us",
      order: 1
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1707280133212-53c57117fe5c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwbHV4dXJ5JTIwbGluZ2VyaWUlMjBsYWNlJTIwZGV0YWlsfGVufDF8fHx8MTc2NTYwNTc4Nnww&ixlib=rb-4.1.0&q=80&w=1080",
      title: "Exquisite Craftsmanship",
      subtitle: "Detailed to Perfection",
      description: "Premium materials and intricate lace details for the modern brand.",
      link: "#products",
      buttonText: "View Products",
      order: 2
    },
    {
      id: 3,
      image: "https://images.unsplash.com/photo-1549488350-a9202534f595?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHwld2hpdGUlMjBsaW5nZXJpZSUyMHdlZGRpbmd8ZW58MXx8fHwxNzY1NjA2MDAwfDA&ixlib=rb-4.1.0&q=80&w=1080",
      title: "Global Standards",
      subtitle: "Export Ready",
      description: "Meeting international quality standards with sustainable production.",
      link: "#factory-contact",
      buttonText: "Learn More",
      order: 3
    }
  ]);

  if (activeTab === "banners") {
    return (
      <div className="flex h-screen bg-gray-50 font-sans text-gray-900">
        {/* Render Banners Tab */}
        <BannerManagement 
          banners={localBanners}
          onUpdate={setLocalBanners}
        />
      </div>
    );
  }

  return <AdminDashboard onLogout={onLogout} />;
}
