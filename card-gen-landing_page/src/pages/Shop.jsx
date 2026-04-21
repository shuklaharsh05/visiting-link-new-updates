import React from "react";
import { ShoppingCart, Star, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const PRODUCTS = [
  {
    id: 1,
    name: "Classic Smart Card",
    price: 799,
    description: "Matte finish with high-quality NFC chip.",
    image: "https://images.unsplash.com/photo-1614064641938-3b9b4a9b4a9b?w=400",
    rating: 4.8,
    reviews: 124
  },
  {
    id: 2,
    name: "Premium Metal Card",
    price: 1999,
    description: "Stainless steel finish for the ultimate impression.",
    image: "https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?w=400",
    rating: 5.0,
    reviews: 86
  },
  {
    id: 3,
    name: "Eco Bamboo Card",
    price: 999,
    description: "Sustainable bamboo wood with NFC technology.",
    image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400",
    rating: 4.7,
    reviews: 52
  },
  {
    id: 4,
    name: "PVC transparent Card",
    price: 699,
    description: "Modern transparent look with embedded chip.",
    image: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=400",
    rating: 4.5,
    reviews: 210
  }
];

export default function Shop() {
  return (
    <div className="w-full bg-slate-50 min-h-screen font-poppins pb-24 lg:pb-12">
      {/* Header */}
      <div className="px-6 pt-10 pb-6 lg:px-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Shop</h1>
        <p className="text-slate-500 text-sm mt-2 font-medium">Upgrade your networking with our premium smart cards.</p>
      </div>

      {/* Grid */}
      <div className="px-4 lg:px-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-8">
          {PRODUCTS.map((product, idx) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 flex flex-col group active:scale-[0.98] transition-transform"
            >
              {/* Image Container */}
              <div className="relative aspect-square overflow-hidden bg-slate-100">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                  <span className="text-[10px] font-bold text-slate-700">{product.rating}</span>
                </div>
              </div>

              {/* Info */}
              <div className="p-4 flex flex-col flex-1">
                <h3 className="text-sm font-bold text-slate-800 line-clamp-1">{product.name}</h3>
                <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-relaxed h-8">
                  {product.description}
                </p>
                
                <div className="mt-4 flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-400 font-semibold line-through">₹{product.price + 200}</span>
                    <span className="text-sm font-black text-slate-900 leading-tight">₹{product.price}</span>
                  </div>
                  <button className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform">
                    <ShoppingCart className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Special Offer Section */}
      <div className="px-4 mt-10 lg:px-8">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl">
          <div className="relative z-10">
            <h2 className="text-2xl font-black mb-2 leading-tight">Custom Bulk Orders</h2>
            <p className="text-blue-100 text-xs font-medium max-w-[200px] mb-6 leading-relaxed">
              Need more than 50 cards for your team? Get special corporate pricing.
            </p>
            <button className="bg-white text-blue-600 px-6 py-3 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-transform">
              Contact Sales <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          
          {/* Decorative shapes */}
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute right-10 top-10 w-20 h-20 bg-blue-400/20 rounded-full blur-2xl"></div>
        </div>
      </div>
    </div>
  );
}
