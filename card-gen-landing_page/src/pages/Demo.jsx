import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { apiService } from "../lib/api.js";
import { 
  User, 
  ChevronLeft, 
  ChevronRight, 
  ShoppingCart,
  Loader2,
  ArrowLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import UserCardGenerator from "../components/UserCardGenerator.jsx";
import CardPreviewModal from "../components/CardPreviewModal.jsx";

export default function Demo() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState("browse"); // "browse" | "edit"
  const [previewCard, setPreviewCard] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTemplateIndex, setCurrentTemplateIndex] = useState(0);

  // Fallback images
  const fallbacks = [
    "https://i.pinimg.com/1200x/7f/ca/52/7fca52a9941e0115dbe4e285a664d23b.jpg",
    "https://i.pinimg.com/736x/d7/3b/2f/d73b2fdb504fb14f859dda2852b35923.jpg",
    "https://i.pinimg.com/736x/5a/ca/dd/5acadd9456422d3c7dcd5c0aa29fd592.jpg",
    "https://i.pinimg.com/736x/2f/72/07/2f720701e929c8ddc6956b9841eadcd3.jpg"
  ];

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const res = await apiService.getCategories();
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setCategories(res.data);
        const linkCat = res.data.find(c => c.categoryName?.toLowerCase() === "link" || c.categoryId === "link");
        setSelectedCategory(linkCat || res.data[0]);
      } else {
        // Fallback categories if backend fails or empty
        const fallbackCats = [
          { categoryId: 'multilink-basic', categoryName: 'Multilink Basic' },
          { categoryId: 'link', categoryName: 'Link' },
          { categoryId: 'link-pro', categoryName: 'Link Pro' },
          { categoryId: 'mini-web-card', categoryName: 'Mini web card' }
        ];
        setCategories(fallbackCats);
        setSelectedCategory(fallbackCats[1]);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    const loadTemplates = async () => {
      if (!selectedCategory) return;
      setLoading(true);
      const res = await apiService.getTemplatesByCategory(selectedCategory.categoryId);
      if (res.success && res.data?.templates?.length > 0) {
        setTemplates(res.data.templates);
      } else {
        // Fallback mockup templates
        setTemplates([
          { templateId: 't1', name: 'Premium Design 1', price: 799, preview: '' },
          { templateId: 't2', name: 'Premium Design 2', price: 999, preview: '' },
          { templateId: 't3', name: 'Premium Design 3', price: 1299, preview: '' }
        ]);
      }
      setCurrentTemplateIndex(0);
      setLoading(false);
    };
    if (selectedCategory?.categoryId) {
        loadTemplates();
    }
  }, [selectedCategory]);

  const nextTemplate = () => {
    if (templates.length === 0) return;
    setCurrentTemplateIndex((prev) => (prev + 1) % templates.length);
  };

  const prevTemplate = () => {
    if (templates.length === 0) return;
    setCurrentTemplateIndex((prev) => (prev - 1 + templates.length) % templates.length);
  };

  const currentTemplate = templates[currentTemplateIndex];
  const templateImage = currentTemplate?.preview || fallbacks[currentTemplateIndex % fallbacks.length];

  if (view === "edit") {
    return (
      <div className="w-full bg-white min-h-screen font-poppins">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* <div className="mb-6">
            <button 
              onClick={() => setView("browse")}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-semibold text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Templates
            </button>
          </div> */}
          <UserCardGenerator 
            user={user} 
            existingCard={null} 
            selectedTemplate={{
              categoryId: selectedCategory?.categoryId,
              templateId: currentTemplate?.templateId,
              name: currentTemplate?.name
            }} 
            onBack={() => setView("browse")} 
            onSaved={() => {
              setView("browse");
              navigate("/my-card");
            }} 
            onPreview={(card) => setPreviewCard(card)} 
          />
        </div>
        <CardPreviewModal 
          isOpen={!!previewCard} 
          onClose={() => setPreviewCard(null)} 
          card={previewCard} 
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col py-6 h-[80vh] bg-white font-poppins min-h-[calc(100vh-80px)] overflow-hidden">
      
      {/* Segmented Control Category Tabs with Sliding Background */}
      <div className="shrink-0 w-full overflow-x-auto scrollbar-hide max-w-[95%] mx-auto">
        <div className="bg-[#f0edff] rounded-full p-[4px] flex items-center justify-between relative shadow-inner min-w-max md:min-w-0">
          {categories.map((cat) => {
            const isSelected = selectedCategory?.categoryId === cat.categoryId;
            return (
              <button
                key={cat.categoryId}
                onClick={() => setSelectedCategory(cat)}
                className={`relative flex-1 py-3 px-3 text-[12px] sm:text-xs font-semibold whitespace-nowrap transition-colors z-10 ${
                  isSelected ? "text-[#4B2C8B]" : "text-[#9E86D4]"
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-white rounded-full shadow-sm"
                    initial={false}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{cat.categoryName || cat.categoryId}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Template Slider */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 relative min-h-0 py-4">
        {loading ? (
          <div className="flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-[#4B2C8B] animate-spin" />
          </div>
        ) : templates.length > 0 ? (
          <div className="relative w-full h-[95%] max-w-[320px] max-h-[600px] perspective-1000 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTemplate?.templateId}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="w-full h-full rounded-[2.5rem] overflow-hidden shadow-xl relative border border-slate-100 bg-white"
              >
                <img
                  src={templateImage}
                  alt={currentTemplate?.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                
                {/* Visual indicator for "Direct Payment" */}
                <div className="absolute right-0 top-[60%] -translate-y-1/2 bg-white/70 backdrop-blur-sm p-4 rounded-l-xl border border-white/60 border-r-0">
                   <p className="text-[10px] font-bold text-black uppercase tracking-widest [writing-mode:vertical-lr]">Direct Payment</p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation Arrows */}
            <button 
              onClick={prevTemplate}
              className="absolute left-[-20px] top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg border border-slate-100 flex items-center justify-center text-black z-10 active:scale-90 transition-transform"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button 
              onClick={nextTemplate}
              className="absolute right-[-20px] top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg border border-slate-100 flex items-center justify-center text-black z-10 active:scale-90 transition-transform"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        ) : (
          <div className="text-center text-gray-400 font-medium">
            No templates found.
          </div>
        )}
      </div>

      {/* Bottom Buttons */}
      <div className="px-6 py-4 pb-8 shrink-0">
        <div className="flex gap-4">
          <button 
            className="flex-[1.2] bg-[#E5E7EB] text-black py-4 rounded-[1.2rem] font-bold text-sm flex items-center justify-center gap-3 shadow-none active:scale-95 transition-transform"
            onClick={() => currentTemplate && setView("edit")}
          >
            <ShoppingCart className="w-5 h-5" />
            <span>₹ {currentTemplate?.price || '799'}/-</span>
          </button>
          
          <button 
            className="flex-1 bg-[#332b40] text-white py-4 rounded-[1.2rem] font-bold text-sm flex items-center justify-center gap-2 shadow-none border border-black/10 active:scale-95 transition-transform"
            onClick={() => window.open("https://wa.me/919236553585", "_blank")}
          >
            <User className="w-5 h-5 fill-white/20" />
            <span className="uppercase tracking-wider">Hire Designer</span>
          </button>
        </div>
      </div>
    </div>
  );
}
