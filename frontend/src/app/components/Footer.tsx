import React from "react";
import { Link, useNavigate } from "react-router-dom";

interface FooterProps {
  onNavigate?: (href: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  const navigate = useNavigate();

  const handleAdminClick = () => {
    if (onNavigate) {
      onNavigate('admin');
    } else {
      navigate('/admin/login');
    }
  };

  return (
    <footer className="bg-gray-950 text-white py-12 border-t border-gray-800">
      <div className="container mx-auto px-6 flex flex-col items-center gap-6">
        <div className="text-gray-500 text-xs tracking-wide">
          &copy; {new Date().getFullYear()} SCAVI. All rights reserved.
        </div>
        
        <button 
          onClick={handleAdminClick}
          className="text-gray-700 hover:text-gray-400 transition-colors text-[10px] uppercase tracking-widest font-medium"
        >
          Admin Portal
        </button>
      </div>
    </footer>
  );
}


