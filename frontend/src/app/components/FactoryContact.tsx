import React from "react";
import { motion } from "motion/react";
import { Mail, Phone, MapPin, Factory, PenTool, CheckCircle2 } from "lucide-react";

export function FactoryContact() {
  return (
    <section id="factory-contact" className="bg-white">
      {/* Factory Intro Section */}
      <div className="py-20 md:py-32 container mx-auto px-6 border-t border-gray-100">
        <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 items-center">
          
          {/* Text Content */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="w-full lg:w-1/2"
          >
            <div className="mb-10">
              <span className="text-gray-500 uppercase tracking-[0.2em] text-sm mb-4 block font-medium">About The Factory</span>
              <h2 className="text-4xl md:text-5xl font-serif text-gray-900 mb-6 leading-tight">
                Manufacturing <br/>Excellence
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                SCAVI is a premier lingerie manufacturer dedicated to high-quality OEM and ODM production. 
                With advanced facilities and a skilled workforce, we transform creative concepts into market-ready collections.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10">
              <div className="bg-gray-50 p-6 border border-gray-100">
                <Factory className="w-8 h-8 text-gray-900 mb-4" />
                <h4 className="font-serif text-lg text-gray-900 mb-2">OEM Services</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Precision manufacturing with scalable capacity and rigorous quality assurance.
                </p>
              </div>
              <div className="bg-gray-50 p-6 border border-gray-100">
                <PenTool className="w-8 h-8 text-gray-900 mb-4" />
                <h4 className="font-serif text-lg text-gray-900 mb-2">ODM Design</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Full-service design development tailored to your brand's unique identity.
                </p>
              </div>
            </div>

            <div className="space-y-4 border-t border-gray-100 pt-8">
               <div className="flex items-center gap-3 text-gray-700">
                  <CheckCircle2 className="text-gray-900 w-5 h-5 shrink-0" />
                  <span className="text-sm tracking-wide font-medium">State-of-the-art Production Lines</span>
               </div>
               <div className="flex items-center gap-3 text-gray-700">
                  <CheckCircle2 className="text-gray-900 w-5 h-5 shrink-0" />
                  <span className="text-sm tracking-wide font-medium">Ethical & Sustainable Sourcing</span>
               </div>
               <div className="flex items-center gap-3 text-gray-700">
                  <CheckCircle2 className="text-gray-900 w-5 h-5 shrink-0" />
                  <span className="text-sm tracking-wide font-medium">Global Logistics & Export Standards</span>
               </div>
            </div>
          </motion.div>

          {/* Image */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="w-full lg:w-1/2"
          >
             <div className="relative aspect-[4/5] bg-gray-100 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1742674537189-415cfb85ce05?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB0ZXh0aWxlJTIwZmFjdG9yeSUyMHNld2luZyUyMG1hY2hpbmV8ZW58MXx8fHwxNzY1NjA1Nzg1fDA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Factory Production Line"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 border-[1px] border-white/20 m-4 pointer-events-none" />
             </div>
          </motion.div>
        </div>
      </div>

      {/* Contact Section - Optimized Layout */}
      <div className="bg-gray-950 text-white py-24">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
            <div className="max-w-xl">
              <span className="text-gray-400 uppercase tracking-[0.2em] text-sm mb-3 block font-medium">Get In Touch</span>
              <h2 className="text-3xl md:text-5xl font-serif text-white">Contact Us</h2>
            </div>
            <p className="text-gray-400 max-w-md text-sm md:text-base leading-relaxed">
              We welcome partnerships from around the globe. Contact us today to discuss your manufacturing needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email Card */}
            <div className="group bg-white/5 border border-white/10 p-8 hover:bg-white/10 transition-all duration-300 flex flex-col justify-between min-h-[200px]">
              <div className="mb-6">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                   <Mail className="w-5 h-5 text-white" />
                </div>
                <h4 className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-2">Email Inquiry</h4>
                <a href="mailto:sunly@scaviguangdong.com" className="text-xl md:text-2xl font-serif text-white hover:text-gray-300 transition-colors break-all">
                  sunly@scaviguangdong.com
                </a>
              </div>
            </div>

            {/* Phone Card */}
            <div className="group bg-white/5 border border-white/10 p-8 hover:bg-white/10 transition-all duration-300 flex flex-col justify-between min-h-[200px]">
               <div className="mb-6">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                   <Phone className="w-5 h-5 text-white" />
                </div>
                <h4 className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-2">Call Us</h4>
                <a href="tel:+8613929207272" className="text-xl md:text-2xl font-serif text-white hover:text-gray-300 transition-colors">
                  +86 13929207272
                </a>
              </div>
            </div>

            {/* Address Card - Full Width */}
            <div className="group md:col-span-2 bg-white/5 border border-white/10 p-8 hover:bg-white/10 transition-all duration-300 flex flex-col md:flex-row md:items-center gap-6 min-h-[160px]">
               <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <MapPin className="w-5 h-5 text-white" />
               </div>
               <div>
                  <h4 className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-2">Factory Location</h4>
                  <p className="text-xl md:text-2xl font-serif text-white leading-snug max-w-3xl">
                    Room 301, Building 1, No. 2, Yiheng Road, Xitou, Houjie Town, Dongguan City, Guangdong Province
                  </p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
