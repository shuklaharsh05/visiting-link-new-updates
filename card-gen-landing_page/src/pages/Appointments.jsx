import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { apiService } from '../lib/api.js';
import { useUserPlanRazorpay } from '../hooks/useUserPlanRazorpay.js';
import { Calendar, Mail, Phone, MessageSquare, Filter, User, CreditCard, Download, Calendar as CalendarIcon, Eye, X, AlertCircle, Lock, Users, ClipboardList, Search, Check, Gift, HelpCircle, MessageCircle, ArrowLeft } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';

export default function Appointments() {
  const { user, refreshUser } = useAuth();
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  
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

  const [appointments, setAppointments] = useState([]);
  const [allAppointments, setAllAppointments] = useState([]); // Store all appointments for client-side filtering
  const [loading, setLoading] = useState(true); // initial page load
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: ''
  });
  const [cards, setCards] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Subscription/plan restrictions 
  const userPlan = user?.plan || "free";
  const isPremiumUser = userPlan === "basic" || userPlan === "pro";
  const isPro = true; // Keep true to allow page access, but use isPremiumUser for content gating

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [planUpgradeMessage, setPlanUpgradeMessage] = useState("");
  const [planUpgradeError, setPlanUpgradeError] = useState("");
  const [plans, setPlans] = useState([]);
  const [couponCode, setCouponCode] = useState("");
  const [couponApplying, setCouponApplying] = useState(false);
  const [couponApplyError, setCouponApplyError] = useState("");
  const [discountedPrices, setDiscountedPrices] = useState({ basic: null, pro: null });

  // New states for mobile tabs
  const [activeTab, setActiveTab] = useState('appointments'); // 'interested', 'appointments', 'saved'
  const [activeDetailType, setActiveDetailType] = useState('appointment'); // 'appointment' or 'interested'
  const [vcfLeads, setVcfLeads] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [vcfLeadsLoading, setVcfLeadsLoading] = useState(false);
  const [contactsLoading, setContactsLoading] = useState(false);

  const {
    initiatePlanPayment,
    loading: planLoading,
    error: planError,
  } = useUserPlanRazorpay();

  // Load plan pricing from backend so we always show correct amounts
  useEffect(() => {
    const loadPlans = async () => {
      try {
        const res = await apiService.getPlans();
        if (res.success && Array.isArray(res.data)) {
          setPlans(res.data);
        }
      } catch (err) {
        console.log("Failed to load plans for appointments page:", err);
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

  const SELECTED_CARD_STORAGE_KEY = 'appointments_selected_card_id';

  const getCardLabel = (card) => {
    if (!card) return 'Card';
    const name =
      card.name ||
      card.data?.CompanyName ||
      card.data?.companyName ||
      card.data?.storeName ||
      card.data?.name ||
      '';
    if (name && String(name).trim()) return String(name).trim();
    return card.templateId || card.categoryId || 'Untitled card';
  };

  const fetchAppointments = async (status = '') => {
    if (!user || !selectedCardId) return;

    setAppointmentsLoading(true);
    
    try {
      // Fetch all appointments for user's card
      console.log('🎯 Calling getCardAppointments with:', { 
        cardId: selectedCardId, 
        status
      });
      const response = await apiService.getCardAppointments(selectedCardId, {
        page: 1,
        limit: 1000, // Fetch a large number to get all appointments
        status: status && status.trim() !== '' ? status : undefined
      });
      
      console.log('Appointments API response:', response);
      
      if (response.success && response.data) {
        if (response.data.appointments) {
          // Handle paginated response for card appointments
          const fetchedAppointments = Array.isArray(response.data.appointments) ? response.data.appointments : [];
          setAllAppointments(fetchedAppointments);
          setAppointments(fetchedAppointments);
        } else {
          // Handle non-paginated response
          const fetchedAppointments = Array.isArray(response.data) ? response.data : [];
          setAllAppointments(fetchedAppointments);
          setAppointments(fetchedAppointments);
        }
      } else {
        console.log('Appointments API failed:', response.error);
        setAllAppointments([]);
        setAppointments([]);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setAllAppointments([]);
      setAppointments([]);
    } finally {
      setAppointmentsLoading(false);
    }
  };

  // Client-side filtering function
  const applyFilters = (status = '', startDate = '', endDate = '') => {
    console.log('🔍 Applying client-side filters:', { status, startDate, endDate });
    
    let filteredAppointments = [...allAppointments];
    
    // Filter by status
    if (status && status.trim() !== '') {
      filteredAppointments = filteredAppointments.filter(appointment => 
        appointment.status && appointment.status.toLowerCase() === status.toLowerCase()
      );
    }
    
    // Filter by date range
    if (startDate && startDate.trim() !== '') {
      const start = new Date(startDate);
      filteredAppointments = filteredAppointments.filter(appointment => {
        const appointmentDate = new Date(appointment.created_at || appointment.createdAt);
        return appointmentDate >= start;
      });
    }
    
    if (endDate && endDate.trim() !== '') {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Include the entire end date
      filteredAppointments = filteredAppointments.filter(appointment => {
        const appointmentDate = new Date(appointment.created_at || appointment.createdAt);
        return appointmentDate <= end;
      });
    }
    
    console.log('🔍 Filtered appointments:', filteredAppointments);
    setAppointments(filteredAppointments);
  };

  // Load cards + restore selected card
  useEffect(() => {
    let cancelled = false;
    const loadCards = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const res = await apiService.getMyCards();
        const list = res.success && Array.isArray(res.data) ? res.data : [];
        if (cancelled) return;
        setCards(list);
        const stored = localStorage.getItem(SELECTED_CARD_STORAGE_KEY) || '';
        const storedOk = stored && list.some((c) => String(c._id) === String(stored));
        const initial = storedOk ? stored : (list[0]?._id || '');
        setSelectedCardId(initial);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadCards();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Fetch appointments when selected card or server-side status filter changes
  useEffect(() => {
    if (!user || !selectedCardId) return;
    localStorage.setItem(SELECTED_CARD_STORAGE_KEY, String(selectedCardId));
    fetchAppointments(filters.status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedCardId, filters.status]);

  // Apply client-side filters when filters change
  useEffect(() => {
    if (allAppointments.length > 0) {
      applyFilters(filters.status, filters.startDate, filters.endDate);
    }
  }, [filters.status, filters.startDate, filters.endDate, allAppointments]);

  // Fetch VCF leads (Interested Clients)
  const fetchVcfLeads = async () => {
    setVcfLeadsLoading(true);
    try {
      const res = await apiService.getMyVcfLeads();
      if (res.success) {
        setVcfLeads(res.data || []);
      }
    } catch (error) {
      console.error('Error fetching VCF leads:', error);
    } finally {
      setVcfLeadsLoading(false);
    }
  };

  // Fetch Saved Contacts
  const fetchContacts = async () => {
    if (!user) return;
    setContactsLoading(true);
    try {
      const res = await apiService.getContacts(user._id || user.id);
      if (res.success) {
        setContacts(res.data || []);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setContactsLoading(false);
    }
  };

  // Fetch data when active tab changes on mobile
  useEffect(() => {
    if (activeTab === 'interested' && vcfLeads.length === 0) {
      fetchVcfLeads();
    } else if (activeTab === 'saved' && contacts.length === 0) {
      fetchContacts();
    }
  }, [activeTab]);

  const maskPhone = (phone) => {
    if (!phone) return 'N/A';
    const cleanPhone = String(phone).replace(/\D/g, '');
    if (cleanPhone.length < 5) return '*****' + cleanPhone;
    return 'XXXXX' + cleanPhone.slice(-5);
  };

  const maskEmail = (email) => {
    if (!email) return 'N/A';
    const [name, domain] = email.split('@');
    if (!domain) return '***@***.***';
    const maskedName = name.length > 2 ? name[0] + '*'.repeat(name.length - 1) : '*'.repeat(name.length);
    return `${maskedName}@${domain}`;
  };

  const LockedInfo = ({ label, value, type }) => {
    // If user is premium, show the real info everywhere
    if (isPremiumUser) {
      return <span>{value || 'N/A'}</span>;
    }

    const maskedValue = type === 'phone' ? maskPhone(value) : maskEmail(value);

    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowPlanModal(true);
        }}
        className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all group border border-slate-100"
        title="Upgrade to unlock details"
      >
        <span className="font-mono text-[11px] sm:text-xs tracking-wider">{maskedValue}</span>
        <Lock className="w-3 h-3 flex-shrink-0 group-hover:scale-110 transition-transform" />
      </button>
    );
  };

  const MobileDataCard = ({ item, type }) => {
    const name = item.visitorName || item.name || item.full_name || item.visitor_name || item.customer_name || item.data?.name || 'Lead';
    const message = type === 'appointment' ? item.message : type === 'interested' ? (item.purpose || 'Interested in your VCF') : item.email;
    const dateStr = new Date(item.created_at || item.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    const timeStr = new Date(item.created_at || item.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    
    // Masking logic
    const phone = item.visitorPhone || item.phone || '';
    
    const handleAction = (action) => {
      if (action === 'preview') {
        setSelectedAppointment(item);
        setActiveDetailType(type);
        setShowModal(true);
        return;
      }

      if (!isPremiumUser && type !== 'saved') {
        setShowPlanModal(true);
        return;
      }
      
      if (action === 'whatsapp') {
        const cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone) {
          window.open(`https://wa.me/${cleanPhone}`, '_blank');
        } else {
          alert('No phone number available');
        }
      } else if (action === 'call') {
        if (phone) {
          window.location.href = `tel:${phone}`;
        } else {
          alert('No phone number available');
        }
      }
    };

    const ActionButton = ({ icon: Icon, label, onClick, color, variant = 'solid' }) => (
      <button
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        className={`flex items-center justify-center gap-1 px-3 py-2 rounded-full text-[11px] font-semibold transition-all active:scale-95 whitespace-nowrap shadow-sm min-w-0 ${
          variant === 'solid' ? `${color} text-white` : 'border border-slate-900 bg-white text-slate-900'
        }`}
      >
        <Icon className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="truncate">{label}</span>
      </button>
    );

    return (
      <div className="bg-white border border-slate-200 rounded-[10px] px-3 py-3 mb-4 shadow-sm w-full" onClick={() => handleAction('preview')}>
        <div className="flex gap-4">
          <div className="w-14 h-14 rounded-full bg-purple-50 flex-shrink-0 flex items-center justify-center overflow-hidden border border-purple-100/50">
            {item.avatar || item.image ? (
              <img src={item.avatar || item.image} alt={name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-7 h-7 text-blue-500" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <h3 className="text-base font-extrabold text-[#111] truncate pr-2">
                {name}
              </h3>
              <div className="text-[10px] text-slate-500 whitespace-nowrap flex gap-1 items-center mt-1">
                <span>{dateStr}</span>
                <span>{timeStr} Min</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-1 line-clamp-1">{message || 'No message'}</p>
            
            <div className="flex items-center gap-2 mt-4 overflow-x-auto no-scrollbar">
              <ActionButton icon={Eye} label="Preview" onClick={() => handleAction('preview')} variant="outline" />
              <ActionButton icon={MessageSquare} label="WhatsApp" color="bg-[#00D95F]" onClick={() => handleAction('whatsapp')} />
              <ActionButton icon={Phone} label="Call Now" color="bg-[#2DB6E8]" onClick={() => handleAction('call')} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const CustomCardSelector = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const selectedCard = cards.find(c => String(c._id) === String(selectedCardId));

    const filteredCards = cards.filter(c => 
      getCardLabel(c).toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="relative flex-1 sm:w-[320px] overflow-visible">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3 flex items-center justify-between text-sm font-bold text-slate-800 shadow-sm hover:border-blue-300 transition-all active:scale-[0.98]"
        >
          <div className="flex items-center gap-3 truncate">
            <CreditCard className="w-4 h-4 text-blue-600 font-bold" />
            <span className="truncate">{selectedCard ? getCardLabel(selectedCard) : 'Select a Business Card'}</span>
          </div>
          <Filter className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
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
                {filteredCards.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">No cards found</div>
                ) : (
                  filteredCards.map((c) => (
                    <button
                      key={c._id}
                      onClick={() => {
                        setSelectedCardId(String(c._id));
                        setIsOpen(false);
                        setSearchTerm('');
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors text-left ${
                        String(c._id) === String(selectedCardId) 
                          ? 'bg-blue-50 text-blue-700' 
                          : 'hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${String(c._id) === String(selectedCardId) ? 'bg-purple-100 text-blue-600' : 'bg-slate-100'}`}>
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate text-slate-800">{getCardLabel(c)}</p>
                        <p className="text-[10px] opacity-70 truncate">{c.templateId || 'Standard Template'}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const handlePlanPurchase = async (planKey) => {
    if (!user) return;
    setSelectedPlan(planKey);
    setPlanUpgradeMessage("");
    setPlanUpgradeError("");

    try {
      await initiatePlanPayment({
        plan: planKey,
        couponCode: couponCode || undefined,
        customerName: user.name,
        customerEmail: user.email,
        customerPhone: user.phone,
        onSuccess: async () => {
          setPlanUpgradeMessage(
            planKey === "basic"
              ? "Basic plan activated. Reloading your access…"
              : "Pro plan activated. Reloading your access…"
          );
          setShowPlanModal(false);
          setSelectedPlan(null);
          try {
            await refreshUser();
          } catch (err) {
            console.log("Error refreshing user after plan upgrade:", err);
          }
        },
        onFailure: (msg) => {
          setPlanUpgradeError(msg || "Payment failed or cancelled. Please try again.");
          setShowPlanModal(false);
          setSelectedPlan(null);
        },
      });
    } catch (err) {
      setPlanUpgradeError(err?.message || "Failed to start payment. Please try again.");
      setShowPlanModal(false);
      setSelectedPlan(null);
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

      if (basicRes.success) {
        const val = basicRes.data?.amount ?? basicRes.data?.data?.amount ?? basicRes.amount;
        if (typeof val === "number") next.basic = val;
      }
      if (proRes.success) {
        const val = proRes.data?.amount ?? proRes.data?.data?.amount ?? proRes.amount;
        if (typeof val === "number") next.pro = val;
      }

      if (!basicRes.success && !proRes.success) {
        setCouponApplyError(
          basicRes.error || proRes.error || "Invalid or expired coupon code."
        );
        setDiscountedPrices({ basic: null, pro: null });
      } else {
        setDiscountedPrices(next);
      }
    } catch (err) {
      setCouponApplyError(
        err?.message || "Failed to apply coupon. Please try again."
      );
      setDiscountedPrices({ basic: null, pro: null });
    } finally {
      setCouponApplying(false);
    }
  };

  // Plan gating removed (isPro forced true above). Keeping legacy UI unreachable.
  if (!isPro) {
    return (
      <div className="w-full mx-auto font-poppins px-4 sm:px-6 lg:px-8 mt-6">
        {showPlanModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
            onClick={() => !planLoading && setShowPlanModal(false)}
          >
            <div
              className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-7 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl sm:text-2xl font-bold text-center text-slate-900">
                Choose Your Plan
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 text-center mb-2">
                Upgrade your account to unlock appointments. Prices are loaded from backend.
              </p>
              <div className="mb-3 flex flex-col sm:flex-row gap-2 items-center">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value);
                    setCouponApplyError("");
                  }}
                  className="w-full sm:flex-1 border border-slate-300 rounded-full px-3 py-1.5 text-xs sm:text-sm"
                  placeholder="Have a coupon code?"
                  disabled={planLoading || couponApplying}
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={
                    planLoading ||
                    couponApplying ||
                    !couponCode.trim()
                  }
                  className="px-3 py-1.5 rounded-full bg-slate-900 text-white text-xs sm:text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {couponApplying ? "Applying…" : "Apply"}
                </button>
              </div>
              {couponApplyError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-xs text-red-700">
                  {couponApplyError}
                </div>
              )}
              {planError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs sm:text-sm text-red-700">
                  {planError}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  className={`border rounded-2xl p-4 flex flex-col justify-between ${
                    selectedPlan === "basic"
                      ? "border-blue-600 ring-2 ring-blue-100"
                      : "border-slate-200"
                  }`}
                >
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Individual</h3>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      {(() => {
                        const base = basicAmount ?? 0;
                        const final =
                          discountedPrices.basic != null
                            ? discountedPrices.basic
                            : base;
                        if (
                          discountedPrices.basic != null &&
                          discountedPrices.basic < base
                        ) {
                          return (
                            <>
                              <span className="text-sm text-slate-400 line-through mr-1">
                                ₹{base}
                              </span>
                              <span>₹{final}</span>
                            </>
                          );
                        }
                        return <>₹{final}</>;
                      })()}
                    </p>
                    {userPlan === "basic" && (
                      <p className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-50 text-[11px] font-medium text-green-700 mt-2">
                        Current plan
                      </p>
                    )}
                    <p className="text-xs text-slate-500 mt-1">
                      Starter plan with limited features.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={planLoading || userPlan === "basic"}
                    onClick={() => handlePlanPurchase("basic")}
                    className="mt-4 w-full py-2 rounded-full text-sm font-semibold border border-slate-300 text-slate-800 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {userPlan === "basic"
                      ? "Current Plan"
                      : planLoading && selectedPlan === "basic"
                      ? "Processing…"
                      : "Choose Basic"}
                  </button>
                </div>

                <div
                  className={`border rounded-2xl p-4 flex flex-col justify-between ${
                    selectedPlan === "pro"
                      ? "border-blue-600 ring-2 ring-blue-100"
                      : "border-slate-200"
                  }`}
                >
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Business</h3>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      {(() => {
                        const base = proPayableAmount ?? proAmount ?? 0;
                        const final =
                          discountedPrices.pro != null
                            ? discountedPrices.pro
                            : base;
                        if (discountedPrices.pro != null && discountedPrices.pro < base) {
                          return (
                            <>
                              <span className="text-sm text-slate-400 line-through mr-1">
                                ₹{base}
                              </span>
                              <span>₹{final}</span>
                            </>
                          );
                        }
                        return <>₹{final}</>;
                      })()}
                    </p>
                    {userPlan === "basic" && basicAmount != null && proAmount != null && proAmount > basicAmount && (
                      <p className="text-[11px] text-slate-500 mt-1">
                        You already paid ₹{basicAmount}. Pay remaining ₹{proPayableAmount} to upgrade to Pro.
                      </p>
                    )}
                    <p className="text-xs text-slate-500 mt-1">
                      Unlock full appointments access and all features.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={planLoading}
                    onClick={() => handlePlanPurchase("pro")}
                    className="mt-4 w-full py-2 rounded-full text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {planLoading && selectedPlan === "pro" ? "Processing…" : "Choose Pro"}
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !planLoading && setShowPlanModal(false)}
                className="w-full text-xs sm:text-sm text-slate-500 mt-2"
                disabled={planLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }


  const handleStatusFilter = (status) => {
    console.log('📊 Status filter changed:', status);
    setFilters(prev => ({ ...prev, status }));
  };

  const handleDateFilter = (field, value) => {
    console.log('🗓️ Date filter changed:', { field, value });
    setFilters(prev => {
      const newFilters = { ...prev, [field]: value };
      console.log('🗓️ New filters state:', newFilters);
      return newFilters;
    });
  };

  const clearFilters = () => {
    console.log('🧹 Clearing all filters');
    setFilters({ status: '', startDate: '', endDate: '' });
  };


  // Export appointments to Excel using xlsx library
  const exportToExcel = () => {
    if (!appointments || appointments.length === 0) {
      alert('No appointments to export');
      return;
    }

    console.log('📊 Exporting appointments to Excel:', appointments);

    // Prepare data for Excel
    const excelData = appointments.map(appointment => ({
      'Name': appointment.name || '',
      'Email': appointment.email || '',
      'Phone': appointment.phone || '',
      'Status': appointment.status || '',
      'Message': appointment.message || '',
      'Date': new Date(appointment.created_at || appointment.createdAt).toLocaleDateString('en-US')
    }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const colWidths = [
      { wch: 20 }, // Name
      { wch: 30 }, // Email
      { wch: 15 }, // Phone
      { wch: 12 }, // Status
      { wch: 40 }, // Message
      { wch: 12 }  // Date
    ];
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Appointments');

    // Generate Excel file with proper format
    const fileName = `appointments_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // Generate the Excel file as a buffer
    const excelBuffer = XLSX.write(wb, { 
      bookType: 'xlsx', 
      type: 'array' 
    });
    
    // Create blob and download
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log('📊 Excel file generated and downloaded:', fileName);
  };

  // Helper render functions
  const renderAppointmentsContent = () => {
    return (
      <>
        <div className="hidden sm:block mt-4 sm:mt-6 bg-white border border-slate-200 rounded-xl p-4 sm:p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className='flex-1'>
                <label className="block text-sm font-normal text-slate-700 mb-2">
                  Status Filter
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                >
                  <option value="">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              
              <div className='flex-1'>
                <label className="block text-sm font-normal text-slate-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleDateFilter('startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                />
              </div>
              
              <div className='flex-1'>
                <label className="block text-sm font-normal text-slate-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleDateFilter('endDate', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="w-full md:w-auto px-4 py-2 text-sm sm:text-base text-slate-600 hover:text-slate-800 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
            
            <div className="mt-4 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
              {appointmentsLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs sm:text-sm text-blue-700">Loading appointments...</span>
                </div>
              ) : selectedCardId ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-gray-900 flex-shrink-0" />
                    <span className="text-xs sm:text-sm lg:text-base font-normal text-black truncate">
                      Showing appointments for:{" "}
                      <span className="font-semibold">
                        {(() => {
                          const c = cards.find((x) => String(x._id) === String(selectedCardId));
                          return c ? getCardLabel(c) : "Selected card";
                        })()}
                      </span>
                    </span>
                  </div>
                  <div className="flex-shrink-0">
                    {Array.isArray(appointments) && appointments.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                            Total: {appointments.length}
                          </h3>
                        </div>
                      )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-blue-700">
                    No card found. Create a business card first to view appointments.
                  </span>
                </div>
              )}
            </div>
          </div>

        {!Array.isArray(appointments) || appointments.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 sm:p-12 text-center mt-6">
            <Calendar className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">
              No appointments found
            </h3>
            <p className="text-sm sm:text-base text-slate-600">
              {!selectedCardId
                ? 'You need to create a business card first. Go to "My Card" to create one.'
                : 'No appointments have been booked for this card yet.'}
            </p>
          </div>
        ) : (
          <div className="w-full rounded-xl overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Phone</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Message</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {appointments.map((appointment) => (
                    <tr key={appointment.id || appointment._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-normal text-slate-900">
                        {appointment.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 flex-shrink-0" />
                          <LockedInfo value={appointment.email} type="email" />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 flex-shrink-0" />
                          <LockedInfo value={appointment.phone} type="phone" />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">
                        {appointment.message || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                        {new Date(appointment.created_at || appointment.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            setSelectedAppointment(appointment);
                            setShowModal(true);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile List View */}
            <div className="sm:hidden mt-2">
               {appointments.map((appointment) => (
                 <MobileDataCard 
                   key={appointment.id || appointment._id} 
                   item={appointment} 
                   type="appointment" 
                 />
               ))}
            </div>
          </div>
        )}
      </>
    );
  };

  const renderInterestedClientsContent = () => {
    if (vcfLeadsLoading) {
      return (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center mt-6">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading interested clients...</p>
        </div>
      );
    }

    return (
      <>
        {vcfLeads.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center mt-6">
            <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No interested clients</h3>
            <p className="text-sm text-slate-600">Clients who showed interest in downloading your VCF will appear here.</p>
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-4">
            {vcfLeads.map((lead) => (
              <MobileDataCard 
                key={lead._id} 
                item={lead} 
                type="interested" 
              />
            ))}
          </div>
        )}
      </>
    );
  };

  const renderSavedContactsContent = () => {
    if (contactsLoading) {
      return (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center mt-6">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading saved contacts...</p>
        </div>
      );
    }

    return (
      <>
        {contacts.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center mt-6">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No saved contacts</h3>
            <p className="text-sm text-slate-600">Your saved networking contacts will appear here.</p>
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-4">
            {contacts.map((contact) => (
              <MobileDataCard 
                key={contact._id} 
                item={contact} 
                type="saved" 
              />
            ))}
          </div>
        )}
      </>
    );
  };

  return (
    <div className="w-full mx-auto font-poppins bg px-3 sm:px-6 lg:px-8 mt-6">
      <div className="mb-6 sm:mb-8">
        {/* Mobile Tab Slider */}
        <div className="sm:hidden mb-6">
          <div className="relative flex items-center bg-[#8B5CF6] rounded-xl p-1 gap-2 shadow-inner h-14">
            {/* Sliding Background Block */}
            <div 
              className="absolute h-[calc(100%-8px)] rounded-lg bg-[#C4B5FD] shadow-md transition-all duration-300 ease-in-out"
              style={{ 
                width: 'calc(33.33% - 4px)', 
                left: activeTab === 'interested' ? '4px' : 
                      activeTab === 'appointments' ? '33.33%' : '66.66%',
              }}
            />
            
            <button
              onClick={() => setActiveTab('interested')}
              className={`relative z-10 flex-1 h-full flex items-center justify-center text-[13px] font-bold transition-colors duration-300 ${
                activeTab === 'interested' ? 'text-white' : 'text-white'
              }`}
            >
              Interested Clients
            </button>
            <button
              onClick={() => setActiveTab('appointments')}
              className={`relative z-10 flex-1 h-full flex items-center justify-center text-[13px] font-bold transition-colors duration-300 ${
                activeTab === 'appointments' ? 'text-white' : 'text-white'
              }`}
            >
              Appointments
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`relative z-10 flex-1 h-full flex items-center justify-center text-[13px] font-bold transition-colors duration-300 ${
                activeTab === 'saved' ? 'text-white' : 'text-white'
              }`}
            >
              Saved Contacts
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className='hidden md:block'>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-2">Appointments</h1>
            <p className="text-slate-600 text-base sm:text-lg">
              Manage your client inquiries and appointment requests
            </p>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto overflow-visible">
            <CustomCardSelector />
            { (activeTab === 'appointments' || window.innerWidth >= 640) && appointments.length > 0 && (
              <button
                onClick={() => {
                  if (isPremiumUser) {
                    exportToExcel();
                  } else {
                    setShowPlanModal(true);
                  }
                }}
                className={`inline-flex items-center justify-center gap-2 px-6 py-3 md:rounded-full rounded-2xl text-sm font-bold transition-all shadow-sm whitespace-nowrap ${
                  isPremiumUser 
                    ? "bg-green-600 text-white hover:bg-green-700 hover:shadow-md" 
                    : "bg-white text-slate-700 border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {!isPremiumUser && <Lock className="w-3.5 h-3.5" />}
                <span>Export</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="mt-4">
          {/* Desktop View: Always show appointments */}
          <div className="hidden sm:block">
            {renderAppointmentsContent()}
          </div>

          {/* Mobile View: Tab-based content */}
          <div className="sm:hidden">
            {activeTab === 'appointments' && renderAppointmentsContent()}
            {activeTab === 'interested' && renderInterestedClientsContent()}
            {activeTab === 'saved' && renderSavedContactsContent()}
          </div>
        </div>


      {/* Appointment Details Modal */}
      {showModal && selectedAppointment && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-2 sm:p-4 animate-modal-fade">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto m-2 sm:m-0 border border-white/20 animate-modal-scale">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 tracking-tight">
                {activeDetailType === 'appointment' ? 'Appointment Details' : 'Client Details'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedAppointment(null);
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
              </button>
            </div>
            
            <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="text-xs sm:text-sm font-semibold text-slate-700 mb-1 block">Name</label>
                  <div className="flex items-center gap-2 text-slate-900">
                    <User className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500 flex-shrink-0" />
                    <span className="text-sm sm:text-base break-words font-semibold">
                      {selectedAppointment.visitorName || 
                       selectedAppointment.name || 
                       selectedAppointment.full_name || 
                       selectedAppointment.visitor_name || 
                       'Lead'}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="text-xs sm:text-sm font-semibold text-slate-700 mb-1 block">Email</label>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500 flex-shrink-0" />
                    <div className="text-xs sm:text-sm break-all">
                      <LockedInfo value={selectedAppointment.email} type="email" />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="text-xs sm:text-sm font-semibold text-slate-700 mb-1 block">Phone</label>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500 flex-shrink-0" />
                    <div className="text-sm sm:text-base">
                      <LockedInfo value={selectedAppointment.visitorPhone || selectedAppointment.phone} type="phone" />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="text-xs sm:text-sm font-semibold text-slate-700 mb-1 block">Date</label>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">
                      {new Date(selectedAppointment.created_at || selectedAppointment.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </div>
              
              {(selectedAppointment.message || activeDetailType === 'interested') && (
                <div>
                  <label className="text-xs sm:text-sm font-semibold text-slate-700 mb-2 block">
                    {activeDetailType === 'appointment' ? 'Message' : 'Interest Type'}
                  </label>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 sm:p-4">
                    <div className="flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap break-words font-medium text-slate-800">
                        {selectedAppointment.purpose || selectedAppointment.message || 'Showed interest in downloading VCF Business Card'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-4 sm:px-6 py-3 sm:py-4 flex justify-end">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedAppointment(null);
                }}
                className="px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm sm:text-base"
              >
                Close
              </button>
            </div>
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
              <div className={`relative overflow-hidden border-2 rounded-[32px] p-6 transition-all ${selectedPlan === "basic" ? "border-purple-500 bg-purple-50/10 shadow-lg shadow-purple-50" : "border-slate-100 bg-white"}`}>
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
                    "Unlock all lead contact details",
                    "Real-time appointment alerts",
                    "Basic performance analytics"
                  ].map((feat, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
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
              <div className={`relative overflow-hidden border-2 rounded-[32px] p-6 transition-all bg-gradient-to-br from-white to-purple-50/30 ${selectedPlan === "pro" ? "border-purple-600 bg-purple-50/20 shadow-xl shadow-purple-100" : "border-slate-100"}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-extrabold text-purple-900">Business</h3>
                    <p className="text-xs text-purple-600/70 mt-0.5 font-medium">Maximum growth tools</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-2xl font-black text-purple-900 leading-none">₹{discountedPrices.pro ?? proPayableAmount ?? (proPlan?.amount || 0)}</span>
                    <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider mt-1">Full access</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-3 mb-6">
                  {[
                    "Export all data to Excel",
                    "Priority 1-on-1 support",
                    "Advanced white-label features"
                  ].map((feat, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-white stroke-[3]" />
                      </div>
                      <span className="text-xs sm:text-sm text-slate-700 font-semibold">{feat}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handlePlanPurchase("pro")}
                  disabled={planLoading || userPlan === "pro"}
                  className="w-full py-4 rounded-2xl text-[13px] font-black bg-gradient-to-r from-purple-600 to-indigo-700 text-white shadow-lg shadow-purple-200 hover:shadow-purple-300 hover:from-purple-700 hover:to-indigo-800 transition-all active:scale-95 disabled:opacity-50"
                >
                  {userPlan === "pro" ? "Active Plan" : "Choose Business Plan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Floating Help Button */}
      <button
        onClick={() => setIsHelpModalOpen(true)}
        className="fixed bottom-24 sm:bottom-8 right-6 z-40 bg-slate-900 text-white rounded-full shadow-2xl flex items-center gap-2 hover:bg-slate-800 transition-all active:scale-95 group lg:flex"
      >
        <div className="bg-black/70 p-3 rounded-full">
          <HelpCircle className="w-6 h-6 text-white" />
        </div>
        <span className="text-sm font-bold pr-2 hidden sm:inline">Help & Support</span>
      </button>

      {/* Help Modal */}
      {isHelpModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-modal-fade" 
            onClick={() => setIsHelpModalOpen(false)}
          />
          <div className="relative bg-white rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl animate-modal-scale max-h-[90vh] flex flex-col">
            <div className="px-6 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center">
                  <HelpCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Help & Support</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none mt-1">Get Assistance</p>
                </div>
              </div>
              <button 
                onClick={() => setIsHelpModalOpen(false)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
              {/* WhatsApp Section */}
              <div className="bg-gradient-to-br from-[#00D95F]/10 to-emerald-50 rounded-3xl p-6 border border-[#00D95F]/20">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-[#00D95F] flex items-center justify-center shadow-lg shadow-[#00D95F]/20 mb-4 animate-bounce-gentle">
                    <MessageCircle className="w-8 h-8 text-white fill-white/20" />
                  </div>
                  <h4 className="text-lg font-black text-slate-900 mb-2">Chat with an Expert</h4>
                  <p className="text-sm text-slate-600 font-medium mb-6">Need help setting up your card or managing appointments? Our team is available 24/7 on WhatsApp.</p>
                  <button 
                    onClick={() => window.open("https://wa.me/919236553585", "_blank")}
                    className="w-full bg-[#00D95F] text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-[#00D95F]/20 hover:bg-[#00c556] transition-all flex items-center justify-center gap-2"
                  >
                    Start Chatting
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </button>
                </div>
              </div>

              {/* FAQ Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest ml-1">Quick Guide</h4>
                <div className="space-y-3">
                  {[
                    { q: "How to export appointments?", a: "Upgrade to the Business Plan to unlock the 'Download Excel' button in your appointments tab." },
                    { q: "Why are contact details locked?", a: "Lead phone numbers and emails are secured. You can unlock them by choosing any of our premium plans." },
                    { q: "How to change card settings?", a: "Go to the 'My Card' page from the bottom menu to edit your card details anytime." }
                  ].map((faq, i) => (
                    <div key={i} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                      <p className="text-[13px] font-black text-slate-900 mb-1">{faq.q}</p>
                      <p className="text-xs text-slate-600 font-medium leading-relaxed">{faq.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-5 bg-slate-50 border-t border-slate-100 text-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">VisitingLink © 2024</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
