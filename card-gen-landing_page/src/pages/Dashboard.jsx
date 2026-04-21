import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { apiService } from '../lib/api.js';
import { CreditCard, Calendar, Users, Share2, Heart, Download, Eye, TrendingUp, MousePointerClick, MessageCircle, Smartphone, Monitor, Tablet, Lock, ChevronDown, Search, X, Check, Crown, Sparkles, Zap, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserPlanRazorpay } from '../hooks/useUserPlanRazorpay.js';

/* ─── Tiny inline bar chart (no library needed) ─── */
function MiniBarChart({ data, color = '#6366f1', height = 100 }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-[6px] h-full w-full" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t-md transition-all duration-500"
            style={{
              height: `${(d.value / max) * 100}%`,
              minHeight: d.value > 0 ? 4 : 1,
              background: `linear-gradient(to top, ${color}, ${color}88)`,
            }}
          />
          <span className="text-[9px] text-slate-500 font-medium leading-none">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Donut ring (SVG) ─── */
function DonutChart({ segments, size = 120, strokeWidth = 18 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  let offset = 0;

  return (
    <svg width={size} height={size} className="block mx-auto">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />
      {segments.map((seg, i) => {
        const pct = seg.value / total;
        const dash = pct * circumference;
        const gap = circumference - dash;
        const currentOffset = offset;
        offset += dash;
        return (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-currentOffset}
            strokeLinecap="round"
            className="transition-all duration-700"
            style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
          />
        );
      })}
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" className="text-lg font-extrabold fill-slate-900">
        {total}
      </text>
    </svg>
  );
}

/* ─── Searchable Card Selector Dropdown ─── */
function CardSelector({ cards, selectedCardId, onSelect, getLabel, disabled }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const selectedCard = cards.find(c => String(c._id) === String(selectedCardId));

  const filtered = cards.filter(c => {
    if (!search.trim()) return true;
    return getLabel(c).toLowerCase().includes(search.toLowerCase());
  });

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled || cards.length === 0}
        onClick={() => { setOpen(!open); setSearch(''); }}
        className="w-full bg-white border-2 border-slate-200 rounded-2xl px-4 py-3.5 text-left text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-400 transition-colors flex items-center justify-between disabled:opacity-50 shadow-sm"
      >
        <span className="truncate">{selectedCard ? getLabel(selectedCard) : 'Select a card'}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden"
          >
            {/* Search */}
            <div className="p-3 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search cards..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2.5 bg-slate-50 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-200 border border-slate-100"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div className="max-h-[220px] overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4 font-medium">No cards match your search</p>
              ) : (
                filtered.map((card, idx) => {
                  const isSelected = String(card._id) === String(selectedCardId);
                  return (
                    <motion.button
                      key={card._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      type="button"
                      onClick={() => { onSelect(card._id); setOpen(false); setSearch(''); }}
                      className={`w-full text-left px-4 py-3 text-sm font-semibold transition-colors flex items-center justify-between ${
                        isSelected
                          ? 'bg-indigo-500 text-white'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate">{getLabel(card)}</span>
                      {isSelected && <Check className="w-4 h-4 flex-shrink-0" />}
                    </motion.button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Upgrade Modal (DB-driven, same as Appointments) ─── */
function UpgradeModal({ open, onClose, userPlan, basicAmount, proAmount, proPayableAmount, discountedPrices, couponCode, setCouponCode, couponApplying, couponApplyError, handleApplyCoupon, handlePlanPurchase, planLoading, selectedPlan, planError }) {
  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 px-4 pb-0 sm:pb-4"
        onClick={() => !planLoading && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="text-center px-6 pt-8 pb-5">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-200">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">Choose Your Plan</h2>
            <p className="text-xs text-slate-500 font-medium mt-1.5 max-w-xs mx-auto">Unlock detailed analytics, device insights, and event tracking for your cards.</p>
          </div>

          {/* Coupon */}
          <div className="px-5 mb-4">
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <Gift className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => { setCouponCode(e.target.value); }}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-200"
                  placeholder="Have a coupon code?"
                  disabled={planLoading || couponApplying}
                />
              </div>
              <button
                type="button"
                onClick={handleApplyCoupon}
                disabled={planLoading || couponApplying || !couponCode?.trim()}
                className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform"
              >
                {couponApplying ? "…" : "Apply"}
              </button>
            </div>
            {couponApplyError && (
              <p className="text-[11px] text-red-500 font-medium mt-1.5">{couponApplyError}</p>
            )}
          </div>

          {planError && (
            <div className="mx-5 mb-3 bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">{planError}</div>
          )}

          {/* Plan Cards */}
          <div className="px-5 pb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Individual / Basic Plan */}
            <div className={`rounded-2xl border-2 p-5 flex flex-col justify-between ${selectedPlan === 'basic' ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200'}`}>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Individual</h3>
                    <p className="text-[10px] text-slate-500 font-semibold">one time</p>
                  </div>
                </div>
                <p className="text-2xl font-extrabold text-slate-900 mb-1">
                  {(() => {
                    const base = basicAmount ?? 0;
                    const final = discountedPrices?.basic != null ? discountedPrices.basic : base;
                    if (discountedPrices?.basic != null && discountedPrices.basic < base) {
                      return (<><span className="text-sm text-slate-400 line-through mr-1">₹{base}</span><span>₹{final}</span></>);
                    }
                    return <>₹{final}</>;
                  })()}
                </p>
                {userPlan === 'basic' && (
                  <p className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-50 text-[11px] font-medium text-green-700 mb-2">
                    <Check className="w-3 h-3 mr-1" /> Current plan
                  </p>
                )}
                <p className="text-[11px] text-slate-500 font-medium">Starter plan with limited features.</p>
              </div>
              <button
                type="button"
                disabled={planLoading || userPlan === 'basic'}
                onClick={() => handlePlanPurchase('basic')}
                className="mt-4 w-full py-3 rounded-xl text-sm font-extrabold border-2 border-slate-200 text-slate-800 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
              >
                {userPlan === 'basic' ? 'Current Plan' : planLoading && selectedPlan === 'basic' ? 'Processing…' : 'Choose Basic'}
              </button>
            </div>

            {/* Business / Pro Plan */}
            <div className={`rounded-2xl border-2 p-5 flex flex-col justify-between relative ${selectedPlan === 'pro' ? 'border-purple-500 ring-2 ring-purple-100' : 'border-purple-300 bg-purple-50/30'}`}>
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-extrabold rounded-full uppercase tracking-wider">Most Popular</span>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-md">
                    <Crown className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Business</h3>
                    <p className="text-[10px] text-slate-500 font-semibold">one time</p>
                  </div>
                </div>
                <p className="text-2xl font-extrabold text-slate-900 mb-1">
                  {(() => {
                    const base = proPayableAmount ?? proAmount ?? 0;
                    const final = discountedPrices?.pro != null ? discountedPrices.pro : base;
                    if (discountedPrices?.pro != null && discountedPrices.pro < base) {
                      return (<><span className="text-sm text-slate-400 line-through mr-1">₹{base}</span><span>₹{final}</span></>);
                    }
                    return <>₹{final}</>;
                  })()}
                </p>
                {userPlan === 'basic' && basicAmount != null && proAmount != null && proAmount > basicAmount && (
                  <p className="text-[10px] text-slate-500 mb-1">
                    You already paid ₹{basicAmount}. Pay remaining ₹{proPayableAmount} to upgrade.
                  </p>
                )}
                <p className="text-[11px] text-slate-500 font-medium">Unlock full access and all features.</p>
              </div>
              <button
                type="button"
                disabled={planLoading}
                onClick={() => handlePlanPurchase('pro')}
                className="mt-4 w-full py-3 rounded-xl text-sm font-extrabold bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
              >
                {planLoading && selectedPlan === 'pro' ? 'Processing…' : 'Choose Pro'}
              </button>
            </div>
          </div>

          {/* Close */}
          <div className="px-6 pb-8 text-center">
            <button onClick={() => !planLoading && onClose()} className="text-xs text-slate-500 font-semibold hover:text-slate-800 transition-colors" disabled={planLoading}>
              Maybe later
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}


export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userName, setUserName] = useState('User');
  const [cards, setCards] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState('');
  const [statsLoading, setStatsLoading] = useState(false);
  const [stats, setStats] = useState({
    cardAppointments: 0,
    hasCard: false,
    cardViews: 0,
    cardShares: 0,
    cardLikes: 0,
    cardDownloads: 0,
    cardData: null,
  });
  const [loading, setLoading] = useState(true);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [weeklyViewsData, setWeeklyViewsData] = useState([]);

  // Plan states
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [planUpgradeMessage, setPlanUpgradeMessage] = useState("");
  const [planUpgradeError, setPlanUpgradeError] = useState("");
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

  // Load plan pricing from backend
  useEffect(() => {
    const loadPlans = async () => {
      try {
        const res = await apiService.getPlans();
        if (res.success && Array.isArray(res.data)) {
          setPlans(res.data);
        }
      } catch (err) {
        console.log("Failed to load plans for dashboard:", err);
      }
    };
    loadPlans();
  }, []);

  const SELECTED_CARD_STORAGE_KEY = 'dashboard_selected_card_id';

  // Check if user has a paid plan
  const userPlan = user?.plan || "free";
  const hasPlan = !!(user?.plan && user.plan !== 'free' && user.plan !== 'none');

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
          setUpgradeOpen(false);
          setSelectedPlan(null);
          try {
            await window.location.reload(); // Simple reload to get updated plan
          } catch (err) {
            console.log("Error refreshing user after plan upgrade:", err);
          }
        },
        onFailure: (msg) => {
          setPlanUpgradeError(msg || "Payment failed or cancelled. Please try again.");
          setUpgradeOpen(false);
          setSelectedPlan(null);
        },
      });
    } catch (err) {
      setPlanUpgradeError(err?.message || "Failed to start payment. Please try again.");
      setUpgradeOpen(false);
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

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      console.log('Dashboard - User object:', user);
      console.log('Dashboard - User ID:', user._id);

      try {
        const userResponse = await apiService.getUserById(user._id);
        if (userResponse.success && userResponse.data) {
          setUserName(userResponse.data.name || 'User');
        } else {
          setUserName(user.name || 'User');
        }
      } catch {
        setUserName(user.name || 'User');
      }

      const myCardsRes = await apiService.getMyCards();
      const list = myCardsRes.success && Array.isArray(myCardsRes.data) ? myCardsRes.data : [];
      setCards(list);

      const stored = localStorage.getItem(SELECTED_CARD_STORAGE_KEY) || '';
      const storedOk = stored && list.some((c) => String(c._id) === String(stored));
      const initial = storedOk ? stored : (list[0]?._id || '');
      setSelectedCardId(initial);

      setLoading(false);
    };

    fetchData();
  }, [user]);

  useEffect(() => {
    let cancelled = false;

    const fetchStatsForCard = async (cardId) => {
      if (!cardId) {
        setStats({
          cardAppointments: 0,
          hasCard: false,
          cardViews: 0,
          cardShares: 0,
          cardLikes: 0,
          cardDownloads: 0,
          cardData: null,
        });
        return;
      }

      setStatsLoading(true);
      try {
        localStorage.setItem(SELECTED_CARD_STORAGE_KEY, String(cardId));

        const cardResponse = await apiService.getCardById(cardId);
        const cardStatsSource = cardResponse.success ? (cardResponse.data?.card || cardResponse.data) : null;

        const cardViews = cardStatsSource?.views ?? cardStatsSource?.totalViews ?? 0;
        const cardShares = cardStatsSource?.shares ?? cardStatsSource?.totalShares ?? 0;
        const cardLikes = cardStatsSource?.likes ?? cardStatsSource?.totalLikes ?? 0;
        const cardDownloads = cardStatsSource?.downloads ?? cardStatsSource?.totalDownloads ?? 0;

        const appointmentsResponse = await apiService.getCardAppointments(cardId, {
          page: 1,
          limit: 1000,
        });
        let cardAppointments = 0;
        if (appointmentsResponse.success && appointmentsResponse.data) {
          if (appointmentsResponse.data.appointments) {
            cardAppointments = appointmentsResponse.data.appointments.length;
          } else if (Array.isArray(appointmentsResponse.data)) {
            cardAppointments = appointmentsResponse.data.length;
          }
        }

        if (cancelled) return;
        setStats({
          cardAppointments,
          hasCard: true,
          cardViews,
          cardShares,
          cardLikes,
          cardDownloads,
          cardData: { id: cardId, data: cardResponse.data },
        });
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    };

    fetchStatsForCard(selectedCardId);
    return () => {
      cancelled = true;
    };
  }, [selectedCardId]);

  /* Fetch weekly views data from backend for mobile chart */
  useEffect(() => {
    let cancelled = false;
    const fetchWeeklyViews = async () => {
      if (!selectedCardId) {
        setWeeklyViewsData([]);
        return;
      }
      try {
        const res = await apiService.getCardWeeklyViews(selectedCardId);
        if (!cancelled && res.success && Array.isArray(res.data)) {
          setWeeklyViewsData(res.data);
        }
      } catch (err) {
        console.log('Failed to fetch weekly views:', err);
      }
    };
    fetchWeeklyViews();
    return () => { cancelled = true; };
  }, [selectedCardId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  /* ───── Sample / derived data for charts ───── */
  // viewsPerDay is used by the desktop chart (unchanged)
  const weekLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const viewsPerDay = weekLabels.map((label, i) => ({
    label,
    value: Math.max(0, Math.round((stats.cardViews / 7) * (0.5 + Math.sin(i * 1.2) * 0.5 + Math.random() * 0.4))),
  }));

  const topEvents = [
    { label: 'Card Shares', value: stats.cardShares },
    { label: 'Contact Downloads', value: stats.cardDownloads },
    { label: 'Contacts / Leads', value: stats.cardAppointments },
    { label: 'Card Likes', value: stats.cardLikes },
  ];

  // NOTE: No device-level tracking in backend yet — these are commented out
  // const mobileViews = Math.round(stats.cardViews * 0.68);
  // const desktopViews = Math.round(stats.cardViews * 0.28);
  // const tabletViews = stats.cardViews - mobileViews - desktopViews;

  /* ───── DESKTOP VIEW (unchanged) ───── */
  const DesktopDashboard = (
    <div className="hidden lg:block w-full mx-auto font-poppins px-4 sm:px-6 lg:px-8 mt-6">
      <div className="mb-8 flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Welcome back, {userName}!
          </h1>
          <p className="text-slate-600 text-lg">
            Here's an overview of your account
          </p>
        </div>

        <div className="flex flex-col lg:items-end gap-1">
          <label className="text-xs font-medium text-slate-500">Selected card</label>
          <select
            value={selectedCardId}
            onChange={(e) => setSelectedCardId(e.target.value)}
            className="min-w-[220px] max-w-[320px] w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={statsLoading || cards.length === 0}
          >
            {cards.length === 0 ? (
              <option value="">No cards yet</option>
            ) : (
              cards.map((c) => (
                <option key={c._id} value={c._id}>
                  {getCardLabel(c)}
                </option>
              ))
            )}
          </select>
          {statsLoading ? (
            <div className="text-[11px] text-slate-500">Loading card stats…</div>
          ) : null}
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${stats.hasCard
                ? 'bg-green-100 text-green-700'
                : 'bg-amber-100 text-amber-700'
                }`}
            >
              {stats.hasCard ? 'Active' : 'Not Created'}
            </span>
          </div>
          <h3 className="text-slate-600 text-sm font-medium mb-1">Business Card</h3>
          <p className="text-2xl font-bold text-slate-900">
            {cards.length}
          </p>
          {stats.hasCard && stats.cardData && (
            <p className="text-xs text-slate-500 mt-1">
              {(() => {
                const c = cards.find((x) => String(x._id) === String(selectedCardId));
                return c ? getCardLabel(c) : 'Active Card';
              })()}
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <h3 className="text-slate-600 text-sm font-medium mb-1">Card Appointments</h3>
          <p className="text-2xl font-bold text-slate-900">{stats.cardAppointments}</p>
          <p className="text-xs text-slate-500 mt-1">Appointments for your card</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <h3 className="text-slate-600 text-sm font-medium mb-1">Card Views</h3>
          <p className="text-2xl font-bold text-slate-900">{stats.cardViews}</p>
          <p className="text-xs text-slate-500 mt-1">Times your card was viewed</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Share2 className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
          <h3 className="text-slate-600 text-sm font-medium mb-1">Card Shares</h3>
          <p className="text-2xl font-bold text-slate-900">{stats.cardShares}</p>
          <p className="text-xs text-slate-500 mt-1">Times your card link was shared</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-rose-100 rounded-lg flex items-center justify-center">
              <Heart className="w-6 h-6 text-rose-600" />
            </div>
          </div>
          <h3 className="text-slate-600 text-sm font-medium mb-1">Card Likes</h3>
          <p className="text-2xl font-bold text-slate-900">{stats.cardLikes}</p>
          <p className="text-xs text-slate-500 mt-1">People who liked your card</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Download className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <h3 className="text-slate-600 text-sm font-medium mb-1">Contact Downloads</h3>
          <p className="text-2xl font-bold text-slate-900">{stats.cardDownloads}</p>
          <p className="text-xs text-slate-500 mt-1">Downloads of your contact</p>
        </div>
      </div>
    </div>
  );

  /* ───── MOBILE VIEW (premium analytics) ───── */
  const MobileDashboard = (
    <div className="lg:hidden w-full font-poppins overflow-x-hidden bg-white">
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Dashboard</p>
            <h1 className="text-xl font-extrabold text-slate-900 leading-tight mt-1">
              Hi, {userName?.split(' ')[0]} 👋
            </h1>
          </div>
          <img src={user?.photoURL || "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=80"} alt="avatar" className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md" />
        </div>

        {/* Custom Searchable Card Selector */}
        <CardSelector
          cards={cards}
          selectedCardId={selectedCardId}
          onSelect={setSelectedCardId}
          getLabel={getCardLabel}
          disabled={statsLoading}
        />
        {statsLoading && <p className="text-[10px] text-slate-500 animate-pulse mt-2">Loading stats…</p>}
      </div>

      {/* Stat Cards Row */}
      <div className="px-4 mb-5 overflow-x-auto scrollbar-hide">
        <div className="flex gap-3 min-w-max pr-4">
          {[
            { icon: Eye, label: 'Views', value: stats.cardViews, color: 'bg-blue-50', iconColor: 'text-blue-600' },
            { icon: Share2, label: 'Shares', value: stats.cardShares, color: 'bg-indigo-50', iconColor: 'text-indigo-600' },
            { icon: Heart, label: 'Likes', value: stats.cardLikes, color: 'bg-rose-50', iconColor: 'text-rose-500' },
            { icon: Download, label: 'Downloads', value: stats.cardDownloads, color: 'bg-purple-50', iconColor: 'text-purple-600' },
            { icon: Calendar, label: 'Leads', value: stats.cardAppointments, color: 'bg-emerald-50', iconColor: 'text-emerald-600' },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`${s.color} rounded-2xl px-5 py-4 min-w-[120px] flex flex-col items-start shadow-sm border border-black/5 relative`}
              onClick={() => !hasPlan && setUpgradeOpen(true)}
            >
              <s.icon className={`w-5 h-5 ${s.iconColor} mb-2`} />
              {hasPlan ? (
                <span className="text-xl font-extrabold text-slate-900 leading-none">{s.value}</span>
              ) : (
                <span className="text-xl font-extrabold text-slate-400 leading-none flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" /> —
                </span>
              )}
              <span className="text-[10px] font-semibold text-slate-500 mt-1">{s.label}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Weekly Views Bar Chart (real data from backend) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mx-4 mb-5 bg-slate-50 rounded-3xl p-5 border border-slate-100"
      >
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-500" />
              Weekly Views
            </h3>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Last 7 days</p>
          </div>
          {hasPlan ? (
            <span className="text-xl font-extrabold text-indigo-600">{stats.cardViews}</span>
          ) : (
            <span className="text-sm font-extrabold text-slate-400 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" /> Hidden
            </span>
          )}
        </div>
        <MiniBarChart
          data={
            weeklyViewsData.length > 0
              ? weeklyViewsData.map(d => ({
                  label: (() => {
                    const [, m, day] = d.date.split('-');
                    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                    return `${months[parseInt(m, 10) - 1]} ${parseInt(day, 10)}`;
                  })(),
                  value: d.value,
                }))
              : [{ label: '-', value: 0 }]
          }
          color="#6366f1"
          height={90}
        />
      </motion.div>

      {/* ── Engagement Pie Chart ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mx-4 mb-5 bg-gradient-to-br from-slate-50 to-indigo-50/40 rounded-3xl p-5 border border-indigo-100 relative overflow-hidden"
      >
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-teal-500" />
              Engagement Breakdown
            </h3>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">
              {hasPlan ? 'Interaction distribution' : 'Upgrade to see details'}
            </p>
          </div>
          {!hasPlan && (
            <button onClick={() => setUpgradeOpen(true)} className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-indigo-500 text-white text-[10px] font-extrabold shadow-sm active:scale-95 transition-transform z-10">
              <Lock className="w-3 h-3" /> Upgrade
            </button>
          )}
        </div>
        <div className={!hasPlan ? 'opacity-40 blur-[2px] pointer-events-none select-none' : ''}>
          <DonutChart
            size={150}
            strokeWidth={24}
            segments={[
              { value: hasPlan ? stats.cardViews : 40, color: '#6366f1' },
              { value: hasPlan ? stats.cardShares : 15, color: '#f59e0b' },
              { value: hasPlan ? stats.cardLikes : 10, color: '#ef4444' },
              { value: hasPlan ? stats.cardDownloads : 8, color: '#8b5cf6' },
              { value: hasPlan ? stats.cardAppointments : 5, color: '#10b981' },
            ]}
          />
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
            {[
              { label: 'Views', color: '#6366f1', value: hasPlan ? stats.cardViews : '—' },
              { label: 'Shares', color: '#f59e0b', value: hasPlan ? stats.cardShares : '—' },
              { label: 'Likes', color: '#ef4444', value: hasPlan ? stats.cardLikes : '—' },
              { label: 'Downloads', color: '#8b5cf6', value: hasPlan ? stats.cardDownloads : '—' },
              { label: 'Leads', color: '#10b981', value: hasPlan ? stats.cardAppointments : '—' },
            ].map((l, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: l.color }} />
                <span className="text-[10px] font-semibold text-slate-600">{l.label}</span>
                <span className="text-[10px] font-extrabold text-slate-800">{l.value}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Performance Score Ring ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mx-4 mb-5 bg-gradient-to-br from-emerald-50 to-teal-50/30 rounded-3xl p-5 border border-emerald-100 relative overflow-hidden"
      >
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-500" />
              Performance Score
            </h3>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">
              {hasPlan ? 'Based on card engagement' : 'Upgrade to unlock'}
            </p>
          </div>
          {!hasPlan && (
            <button onClick={() => setUpgradeOpen(true)} className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-500 text-white text-[10px] font-extrabold shadow-sm active:scale-95 transition-transform z-10">
              <Lock className="w-3 h-3" /> Upgrade
            </button>
          )}
        </div>
        <div className={!hasPlan ? 'opacity-40 blur-[2px] pointer-events-none select-none' : ''}>
          {(() => {
            const total = stats.cardViews + stats.cardShares + stats.cardLikes + stats.cardDownloads;
            const scoreRaw = total === 0 ? 0 : Math.min(100, Math.round(
              (stats.cardShares / Math.max(stats.cardViews, 1)) * 40 +
              (stats.cardLikes / Math.max(stats.cardViews, 1)) * 30 +
              (stats.cardDownloads / Math.max(stats.cardViews, 1)) * 30
            ));
            const score = hasPlan ? scoreRaw : 72;
            const radius = 50;
            const circumference = 2 * Math.PI * radius;
            const strokeDash = (score / 100) * circumference;
            const scoreColor = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
            return (
              <div className="flex items-center gap-5">
                <svg width={130} height={130} className="flex-shrink-0">
                  <circle cx={65} cy={65} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={10} />
                  <circle
                    cx={65} cy={65} r={radius} fill="none"
                    stroke={scoreColor}
                    strokeWidth={10}
                    strokeDasharray={`${strokeDash} ${circumference - strokeDash}`}
                    strokeDashoffset={circumference / 4}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                    style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                  />
                  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" className="text-2xl font-extrabold" fill={scoreColor}>
                    {score}
                  </text>
                  <text x="50%" y="62%" textAnchor="middle" dominantBaseline="central" className="text-[8px] font-semibold" fill="#94a3b8">
                    / 100
                  </text>
                </svg>
                <div className="flex flex-col gap-2.5">
                  {[
                    { label: 'Share rate', pct: hasPlan ? Math.min(100, Math.round((stats.cardShares / Math.max(stats.cardViews, 1)) * 100)) : 35, color: '#6366f1' },
                    { label: 'Like rate', pct: hasPlan ? Math.min(100, Math.round((stats.cardLikes / Math.max(stats.cardViews, 1)) * 100)) : 22, color: '#ef4444' },
                    { label: 'Save rate', pct: hasPlan ? Math.min(100, Math.round((stats.cardDownloads / Math.max(stats.cardViews, 1)) * 100)) : 15, color: '#8b5cf6' },
                  ].map((m, i) => (
                    <div key={i}>
                      <div className="flex justify-between mb-0.5">
                        <span className="text-[10px] font-semibold text-slate-600">{m.label}</span>
                        <span className="text-[10px] font-extrabold text-slate-800">{m.pct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${m.pct}%` }}
                          transition={{ duration: 0.8, delay: 0.4 + i * 0.1 }}
                          className="h-full rounded-full"
                          style={{ background: m.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      </motion.div>

      {/* ── Top Events ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="mx-4 mb-5 bg-[#fef9ef] rounded-3xl p-5 border border-orange-100 relative overflow-hidden"
      >
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <MousePointerClick className="w-4 h-4 text-orange-500" />
              Top Events
            </h3>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">
              {hasPlan ? 'Event analytics' : 'Sample data'}
            </p>
          </div>
          {!hasPlan && (
            <button onClick={() => setUpgradeOpen(true)} className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-orange-400 text-white text-[10px] font-extrabold shadow-sm active:scale-95 transition-transform z-10">
              <Lock className="w-3 h-3" /> Upgrade
            </button>
          )}
        </div>
        <div className={`bg-white rounded-2xl border border-orange-100 overflow-hidden ${!hasPlan ? 'opacity-50 blur-[1px]' : ''}`}>
          <div className="flex justify-between items-center px-4 py-2 border-b border-orange-50">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Event</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Count</span>
          </div>
          {topEvents.map((evt, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.05 }}
              className={`flex justify-between items-center px-4 py-3 ${i < topEvents.length - 1 ? 'border-b border-slate-50' : ''}`}
            >
              <span className="text-xs font-semibold text-slate-700">{evt.label}</span>
              <span className="text-sm font-extrabold text-slate-900">{hasPlan ? evt.value : '—'}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── Views by Device — COMMENTED OUT: No device-level tracking in backend yet ──
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="mx-4 mb-5 bg-[#f5f3ff] rounded-3xl p-5 border border-purple-100 relative overflow-hidden"
      >
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-purple-500" />
              Views by Devices
            </h3>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">
              {hasPlan ? 'Device breakdown' : 'Sample data'}
            </p>
          </div>
          {!hasPlan && (
            <button onClick={() => setUpgradeOpen(true)} className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-purple-500 text-white text-[10px] font-extrabold shadow-sm active:scale-95 transition-transform z-10">
              <Lock className="w-3 h-3" /> Upgrade
            </button>
          )}
        </div>
        <div className={`bg-white rounded-2xl border border-purple-100 overflow-hidden ${!hasPlan ? 'opacity-50 blur-[1px]' : ''}`}>
          <div className="flex justify-between items-center px-4 py-2 border-b border-purple-50">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Device</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Views</span>
          </div>
          {[
            { icon: Smartphone, label: 'Mobile', value: mobileViews },
            { icon: Monitor, label: 'Desktop', value: desktopViews },
            { icon: Tablet, label: 'Tablet', value: tabletViews },
          ].map((d, i, arr) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.05 }}
              className={`flex justify-between items-center px-4 py-3 ${i < arr.length - 1 ? 'border-b border-slate-50' : ''}`}
            >
              <div className="flex items-center gap-2">
                <d.icon className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-700">{d.label}</span>
              </div>
              <span className="text-sm font-extrabold text-slate-900">{hasPlan ? d.value : '—'}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
      */}

      {/* Upgrade Modal */}
        <UpgradeModal 
          open={upgradeOpen} 
          onClose={() => setUpgradeOpen(false)}
          userPlan={userPlan}
          basicAmount={basicAmount}
          proAmount={proAmount}
          proPayableAmount={proPayableAmount}
          discountedPrices={discountedPrices}
          couponCode={couponCode}
          setCouponCode={setCouponCode}
          couponApplying={couponApplying}
          couponApplyError={couponApplyError}
          handleApplyCoupon={handleApplyCoupon}
          handlePlanPurchase={handlePlanPurchase}
          planLoading={planLoading}
          selectedPlan={selectedPlan}
          planError={planError || planUpgradeError}
        />
    </div>
  );

  return (
    <>
      {DesktopDashboard}
      {MobileDashboard}
    </>
  );
}
