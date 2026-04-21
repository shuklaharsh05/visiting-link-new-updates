import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { apiService } from "../lib/api.js";
import {
  ClipboardList,
  Phone,
  User,
  Calendar,
  CreditCard,
  Search,
  AlertCircle,
  Loader2,
  Lock,
  Mail,
  X,
  MessageSquare,
  Check,
  Gift
} from "lucide-react";
import { useUserPlanRazorpay } from "../hooks/useUserPlanRazorpay.js";

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return String(iso);
  }
}

export default function InterestedCandidates() {
  const { user, refreshUser } = useAuth();
  
  // Custom styles for animations
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes modalFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes modalScaleIn {
        from { opacity: 0; transform: scale(0.95) translateY(10px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
      }
      .animate-modal-fade {
        animation: modalFadeIn 0.3s ease-out forwards;
      }
      .animate-modal-scale {
        animation: modalScaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      }
      @keyframes dropdownIn {
        from { opacity: 0; transform: translateY(-10px) scale(0.95); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      .animate-dropdown-in {
        animation: dropdownIn 0.2s ease-out forwards;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const [leads, setLeads] = useState([]);
  const [cards, setCards] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState('');
  const [loading, setLoading] = useState(true);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Premium state
  const userPlan = user?.plan || "free";
  const isPremiumUser = userPlan === "basic" || userPlan === "pro";

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [plans, setPlans] = useState([]);
  const [couponCode, setCouponCode] = useState("");
  const [couponApplying, setCouponApplying] = useState(false);
  const [couponApplyError, setCouponApplyError] = useState("");
  const [discountedPrices, setDiscountedPrices] = useState({ basic: null, pro: null });

  const {
    initiatePlanPayment,
    loading: planLoading,
    error: planError,
  } = useUserPlanRazorpay();

  // Load plan pricing
  useEffect(() => {
    const loadPlans = async () => {
      try {
        const res = await apiService.getPlans();
        if (res.success && Array.isArray(res.data)) {
          setPlans(res.data);
        }
      } catch (err) {
        console.log("Failed to load plans:", err);
      }
    };
    loadPlans();
  }, []);

  const basicPlan = plans.find((p) => p.key === "basic");
  const proPlan = plans.find((p) => p.key === "pro");
  const basicAmount = typeof basicPlan?.amount === "number" ? basicPlan.amount : null;
  const proAmount = typeof proPlan?.amount === "number" ? proPlan.amount : null;
  const proPayableAmount =
    userPlan === "basic" && basicAmount != null && proAmount != null && proAmount > basicAmount
      ? proAmount - basicAmount
      : proAmount;

  const handlePlanPurchase = async (planKey) => {
    if (!user) return;
    setSelectedPlan(planKey);
    try {
      await initiatePlanPayment({
        plan: planKey,
        couponCode: couponCode || undefined,
        customerName: user.name,
        customerEmail: user.email,
        customerPhone: user.phone,
        onSuccess: async () => {
          setShowPlanModal(false);
          await refreshUser();
        },
        onFailure: () => {
          setShowPlanModal(false);
          setSelectedPlan(null);
        },
      });
    } catch (err) {
      setShowPlanModal(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponApplying(true);
    setCouponApplyError("");
    try {
      const [basicRes, proRes] = await Promise.all([
        apiService.previewUserPlanPrice("basic", couponCode.trim()),
        apiService.previewUserPlanPrice("pro", couponCode.trim()),
      ]);
      const next = { basic: null, pro: null };
      if (basicRes.success) next.basic = basicRes.data?.amount ?? basicRes.amount;
      if (proRes.success) next.pro = proRes.data?.amount ?? proRes.amount;
      setDiscountedPrices(next);
      if (!basicRes.success && !proRes.success) {
        setCouponApplyError("Invalid or expired coupon code.");
      }
    } catch (err) {
      setCouponApplyError("Failed to apply coupon.");
    } finally {
      setCouponApplying(false);
    }
  };

  const maskPhone = (phone) => {
    if (!phone) return 'N/A';
    const cleanPhone = String(phone).replace(/\D/g, '');
    if (cleanPhone.length < 5) return 'XXXXX' + cleanPhone;
    return 'XXXXX' + cleanPhone.slice(-5);
  };

  const getCardLabel = (card) => {
    if (!card) return 'Card';
    const name = card.name || card.data?.CompanyName || card.data?.companyName || card.data?.storeName || card.data?.name || '';
    if (name && String(name).trim()) return String(name).trim();
    return card.templateId || card.categoryId || 'Untitled card';
  };

  useEffect(() => {
    const loadCards = async () => {
      if (!user) return;
      setCardsLoading(true);
      try {
        const res = await apiService.getMyCards();
        if (res.success && Array.isArray(res.data)) {
          setCards(res.data);
        }
      } finally {
        setCardsLoading(false);
      }
    };
    loadCards();
  }, [user]);

  const CustomCardSelector = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const selectedCard = cards.find(c => String(c._id) === String(selectedCardId));

    const filteredCards = cards.filter(c => 
      getCardLabel(c).toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="relative w-full max-w-sm">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-2.5 flex items-center justify-between text-sm font-bold text-slate-800 shadow-sm hover:border-blue-300 transition-all active:scale-[0.98]"
        >
          <div className="flex items-center gap-3 truncate">
            <CreditCard className="w-4 h-4 text-blue-600" />
            <span className="truncate">{selectedCard ? getCardLabel(selectedCard) : 'All Business Cards'}</span>
          </div>
          <Search className={`w-4 h-4 text-slate-400 transition-all ${isOpen ? 'opacity-0 scale-0' : 'opacity-100 scale-100'}`} />
          {isOpen && <X className="w-4 h-4 text-slate-400 absolute right-12 animate-in fade-in" />}
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-[60]" onClick={() => setIsOpen(false)} />
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-[70] overflow-hidden animate-dropdown-in">
              <div className="p-3 border-b border-slate-50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search your cards..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
              
              <div className="max-h-[250px] overflow-y-auto p-2">
                <button
                  onClick={() => {
                    setSelectedCardId('');
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors text-left ${
                    selectedCardId === '' ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100">
                    <Users className="w-4 h-4" />
                  </div>
                  <p className="text-sm font-bold">All Cards</p>
                </button>
                {filteredCards.map((c) => (
                  <button
                    key={c._id}
                    onClick={() => {
                      setSelectedCardId(String(c._id));
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors text-left mt-1 ${
                      String(c._id) === String(selectedCardId) 
                        ? 'bg-blue-50 text-blue-700' 
                        : 'hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${String(c._id) === String(selectedCardId) ? 'bg-blue-100' : 'bg-slate-100'}`}>
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{getCardLabel(c)}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };
  const ActionButton = ({ icon: Icon, label, onClick, color, variant = 'solid' }) => (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-full text-[11px] font-extrabold transition-all active:scale-95 whitespace-nowrap shadow-sm min-w-0 ${
        variant === 'solid' ? `${color} text-white` : 'border border-slate-900 bg-white text-slate-900'
      }`}
    >
      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  );

  const MobileDataCard = ({ item }) => {
    const name = item.visitorName || 'Lead';
    const dateStr = formatDate(item.createdAt);
    
    const handleAction = (action) => {
      if (!isPremiumUser) {
        setShowPlanModal(true);
        return;
      }
      
      if (action === 'whatsapp') {
        const cleanPhone = (item.visitorPhone || '').replace(/\D/g, '');
        if (cleanPhone) window.open(`https://wa.me/${cleanPhone}`, '_blank');
      } else if (action === 'call') {
        if (item.visitorPhone) window.location.href = `tel:${item.visitorPhone}`;
      }
    };

    return (
      <div className="bg-white border border-slate-200 rounded-[30px] p-4 mb-4 shadow-sm w-full">
        <div className="flex gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-50 flex-shrink-0 flex items-center justify-center overflow-hidden border border-blue-100/50">
            <User className="w-7 h-7 text-blue-500" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <h3 className="text-base font-extrabold text-[#111] truncate pr-2">
                {name}
              </h3>
              <div className="text-[10px] text-slate-500 whitespace-nowrap flex gap-1 items-center mt-1">
                <Calendar className="w-3 h-3" />
                <span>{dateStr}</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-1 line-clamp-1">{item.purpose || 'Interested in your VCF'}</p>
            
            <div className="flex items-center gap-2 mt-4 overflow-x-auto no-scrollbar">
              <ActionButton icon={MessageSquare} label="WhatsApp" color="bg-[#00D95F]" onClick={() => handleAction('whatsapp')} />
              <ActionButton icon={Phone} label="Call Now" color="bg-[#2DB6E8]" onClick={() => handleAction('call')} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const LockedInfo = ({ value }) => {
    if (isPremiumUser) return <span>{value || 'N/A'}</span>;
    return (
      <button 
        onClick={() => setShowPlanModal(true)}
        className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all border border-slate-100 group"
      >
        <span className="font-mono text-[11px] tracking-wider">{maskPhone(value)}</span>
        <Lock className="w-3 h-3 group-hover:scale-110 transition-transform" />
      </button>
    );
  };

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);
      setError("");
      const res = await apiService.getMyVcfLeads();
      if (res.success && Array.isArray(res.data)) {
        setLeads(res.data);
      } else {
        setLeads([]);
        setError(res.error || "Could not load interested candidates");
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const filtered = useMemo(() => {
    let result = [...leads];
    
    // Filter by card
    if (selectedCardId) {
      result = result.filter(row => String(row.cardId) === String(selectedCardId));
    }
    
    // Filter by search query
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter((row) => {
        const blob = [
          row.visitorName,
          row.visitorPhone,
          row.purpose,
          row.cardLabel,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return blob.includes(q);
      });
    }
    
    return result;
  }, [leads, searchQuery, selectedCardId]);

  return (
    <div className="w-full mx-auto font-poppins px-4 sm:px-6 lg:px-8 mt-6">
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
              Interested candidates
            </h1>
            <p className="text-slate-600 text-sm sm:text-base max-w-2xl">
              People who entered their details before downloading your VCF
              contact card.
            </p>
          </div>
          <CustomCardSelector />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="search"
              placeholder="Search by name, phone, card, purpose…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <p className="text-sm text-slate-500">
            {filtered.length} of {leads.length} shown
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500 gap-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading…</span>
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 p-8 text-red-600">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            {leads.length === 0
              ? "No submissions yet. When someone downloads your card and fills the form, they will appear here."
              : "No matches for your search."}
          </div>
        ) : (
          <div className="overflow-hidden">
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 whitespace-nowrap">Name</th>
                    <th className="px-4 py-3 whitespace-nowrap">Number</th>
                    <th className="px-4 py-3 min-w-[140px]">Purpose</th>
                    <th className="px-4 py-3 whitespace-nowrap">Card</th>
                    <th className="px-4 py-3 whitespace-nowrap">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((row) => (
                    <tr key={row._id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-slate-900">
                          <User className="w-4 h-4 text-slate-400 shrink-0" />
                          {row.visitorName || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                          <LockedInfo value={row.visitorPhone} />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700 max-w-xs">
                        {row.purpose ? (
                          <span className="line-clamp-3">{row.purpose}</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-slate-800">
                          <CreditCard className="w-4 h-4 text-slate-400 shrink-0" />
                          {row.cardLabel || "Card"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                          {formatDate(row.createdAt)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="sm:hidden p-4 space-y-4">
               {filtered.map((row) => (
                 <MobileDataCard key={row._id} item={row} />
               ))}
            </div>
          </div>
        )}
      </div>

      {/* Plan Upgrade Modal */}
      {showPlanModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 animate-modal-fade"
          onClick={() => !planLoading && setShowPlanModal(false)}
        >
          <div
            className="bg-white rounded-[32px] max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl overflow-y-auto max-h-[92vh] border border-white/20 animate-modal-scale"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                Choose Your Plan
              </h2>
              <button 
                onClick={() => setShowPlanModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <div className="flex flex-col gap-3">
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Gift className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value);
                    setCouponApplyError("");
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-24 py-3.5 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                  placeholder="Enter coupon code"
                  disabled={planLoading || couponApplying}
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={planLoading || couponApplying || !couponCode.trim()}
                  className="absolute right-2 top-1.5 bottom-1.5 px-5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 disabled:opacity-50 transition-all active:scale-95"
                >
                  {couponApplying ? "..." : "Apply"}
                </button>
              </div>
              
              {couponApplyError && (
                <div className="px-4 py-2 bg-red-50 border border-red-100 rounded-xl text-[10px] sm:text-xs text-red-600 animate-in slide-in-from-top-1">
                  {couponApplyError}
                </div>
              )}
            </div>
            
            <div className="space-y-4 pt-2">
              {/* Individual Plan */}
              <div className={`relative overflow-hidden border-2 rounded-[32px] p-6 transition-all ${selectedPlan === "basic" ? "border-blue-500 bg-blue-50/10 shadow-lg shadow-blue-50" : "border-slate-100 bg-white"}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900">Individual</h3>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">For professionals & creators</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-2xl font-black text-slate-900 leading-none">₹{discountedPrices.basic ?? basicAmount ?? (basicPlan?.amount || 0)}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">One-time</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-3 mb-6">
                  {[
                    "Unlock all candidate numbers",
                    "Download lead information",
                    "Basic submission stats"
                  ].map((feat, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-blue-600 stroke-[3]" />
                      </div>
                      <span className="text-xs sm:text-sm text-slate-700 font-medium">{feat}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handlePlanPurchase("basic")}
                  disabled={planLoading || userPlan === "basic"}
                  className="w-full py-3 rounded-2xl text-[13px] font-black border-2 border-slate-100 text-slate-700 hover:bg-slate-50 hover:border-slate-200 transition-all active:scale-95 disabled:opacity-50"
                >
                  {userPlan === "basic" ? "Active Plan" : "Choose Individual"}
                </button>
              </div>

              {/* Pro Plan */}
              <div className={`relative overflow-hidden border-2 rounded-[32px] p-6 transition-all bg-gradient-to-br from-white to-blue-50/30 ${selectedPlan === "pro" ? "border-blue-600 bg-blue-50/20 shadow-xl shadow-blue-100" : "border-slate-100"}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-extrabold text-blue-900">Business</h3>
                    <p className="text-xs text-blue-600/70 mt-0.5 font-medium">Maximum growth tools</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-2xl font-black text-blue-900 leading-none">₹{discountedPrices.pro ?? proPayableAmount ?? (proPlan?.amount || 0)}</span>
                    <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider mt-1">Full access</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-3 mb-6">
                  {[
                    "Priority candidate alerts",
                    "Advanced analytics suite",
                    "Premium VCF features"
                  ].map((feat, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-white stroke-[3]" />
                      </div>
                      <span className="text-xs sm:text-sm text-slate-700 font-semibold">{feat}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handlePlanPurchase("pro")}
                  disabled={planLoading || userPlan === "pro"}
                  className="w-full py-4 rounded-2xl text-[13px] font-black bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-200 hover:shadow-blue-300 hover:from-blue-700 hover:to-blue-800 transition-all active:scale-95 disabled:opacity-50"
                >
                  {userPlan === "pro" ? "Active Plan" : "Choose Business Plan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
