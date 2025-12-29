import React from "react";

interface FooterProps {
  onNavigate?: (href: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="bg-gray-950 text-white py-12 border-t border-gray-800">
      <div className="container mx-auto px-6 flex flex-col items-center gap-6">
        <div className="text-gray-500 text-xs tracking-wide">
          &copy; {new Date().getFullYear()} SCAVI. All rights reserved.
        </div>
      </div>
    </footer>
  );
}


