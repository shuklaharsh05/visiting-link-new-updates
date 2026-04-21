import { useEffect, useMemo, useState, useRef } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { apiService } from "../lib/api.js";
import { 
  Star, 
  MousePointerClick, 
  MessageSquare, 
  ChevronDown, 
  Search, 
  X, 
  Check, 
  TrendingUp, 
  Eye,
  Award,
  ThumbsUp,
  Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SELECTED_CARD_STORAGE_KEY = "reviews_selected_card_id";

const getCardLabel = (card) => {
  if (!card) return "Card";
  const name =
    card.name ||
    card.data?.CompanyName ||
    card.data?.companyName ||
    card.data?.storeName ||
    card.data?.name ||
    "";
  if (name && String(name).trim()) return String(name).trim();
  return card.templateId || card.categoryId || "Untitled card";
};

/* ─── Tiny inline bar chart (reused from Dashboard) ─── */
function MiniBarChart({ data, color = '#6366f1', height = 100 }) {
  if (!data || data.length === 0) return null;
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

/* ─── Donut ring (SVG - reused from Dashboard) ─── */
function DonutChart({ segments, size = 120, strokeWidth = 18, centerLabel = "" }) {
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
      <text x="50%" y="46%" textAnchor="middle" dominantBaseline="central" className="text-xl font-bold fill-slate-900">
        {centerLabel}
      </text>
      <text x="50%" y="62%" textAnchor="middle" dominantBaseline="central" className="text-[10px] font-semibold fill-slate-400">
        AVG
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
      <button
        type="button"
        disabled={disabled || cards.length === 0}
        onClick={() => { setOpen(!open); setSearch(''); }}
        className="w-full bg-white border-2 border-slate-200 rounded-2xl px-4 py-3.5 text-left text-sm font-semibold text-slate-800 focus:outline-none focus:border-indigo-400 transition-colors flex items-center justify-between disabled:opacity-50 shadow-sm"
      >
        <span className="truncate">{selectedCard ? getLabel(selectedCard) : 'Select a card'}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden"
          >
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

export default function Reviews() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewStats, setReviewStats] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);

  const userName = user?.displayName || user?.name || "User";

  const selectedCard = useMemo(
    () => cards.find((c) => String(c._id) === String(selectedCardId)) || null,
    [cards, selectedCardId]
  );

  useEffect(() => {
    const loadCards = async () => {
      if (!user) return;
      setLoading(true);
      const myCardsRes = await apiService.getMyCards();
      const list = myCardsRes.success && Array.isArray(myCardsRes.data) ? myCardsRes.data : [];
      setCards(list);

      const stored = localStorage.getItem(SELECTED_CARD_STORAGE_KEY) || "";
      const storedOk = stored && list.some((c) => String(c._id) === String(stored));
      const initial = storedOk ? stored : (list[0]?._id || "");
      setSelectedCardId(initial);
      setLoading(false);
    };
    loadCards();
  }, [user]);

  useEffect(() => {
    const run = async () => {
      if (!selectedCardId) {
        setReviewStats(null);
        setFeedbacks([]);
        return;
      }
      setReviewLoading(true);
      try {
        localStorage.setItem(SELECTED_CARD_STORAGE_KEY, String(selectedCardId));
        const [statsRes, fbRes] = await Promise.all([
          apiService.getReviewFunnelStats(selectedCardId),
          apiService.getReviewFeedbacks(selectedCardId, { limit: 25 }),
        ]);

        setReviewStats(statsRes.success ? statsRes.data : null);
        setFeedbacks(fbRes.success && Array.isArray(fbRes.data) ? fbRes.data : []);
      } finally {
        setReviewLoading(false);
      }
    };
    run();
  }, [selectedCardId]);

  const totalRatings = Number(reviewStats?.totalRatings ?? 0);
  const googleClicks = Number(reviewStats?.googleClicks ?? 0);
  const ratingCounts = reviewStats?.ratingCounts || {};
  const average =
    totalRatings > 0
      ? (1 * Number(ratingCounts?.[1] ?? 0) +
          2 * Number(ratingCounts?.[2] ?? 0) +
          3 * Number(ratingCounts?.[3] ?? 0) +
          4 * Number(ratingCounts?.[4] ?? 0) +
          5 * Number(ratingCounts?.[5] ?? 0)) /
        totalRatings
      : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  /* ───── DESKTOP VIEW ───── */
  const DesktopReviews = (
    <div className="hidden lg:block mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Reviews</h1>
          <p className="text-sm text-slate-600 mt-1">
            Track ratings and capture negative feedback privately.
          </p>
        </div>

        <div className="w-full sm:w-[360px]">
          <label className="block text-xs font-medium text-slate-700 mb-1">Select card</label>
          <select
            value={selectedCardId}
            onChange={(e) => setSelectedCardId(e.target.value)}
            className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white"
            disabled={reviewLoading || cards.length === 0}
          >
            {cards.length === 0 ? <option value="">No cards</option> : null}
            {cards.map((c) => (
              <option key={c._id} value={c._id}>
                {getCardLabel(c)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!selectedCard ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700 font-medium">
          Create a card first to start collecting reviews.
        </div>
      ) : reviewLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700 animate-pulse font-medium">
          Loading review stats…
        </div>
      ) : !reviewStats ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700 font-medium text-center">
          No review activity yet for this card.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-tight">
                <Star className="w-4 h-4 text-yellow-500" /> Avg rating
              </div>
              <div className="mt-2 text-3xl font-bold text-slate-900 tabular-nums">
                {average ? average.toFixed(2) : "0.00"}
              </div>
              <div className="text-xs text-slate-500 mt-1.5 font-semibold">{totalRatings} total ratings</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-tight">
                <Award className="w-4 h-4 text-indigo-500" /> Total Ratings
              </div>
              <div className="mt-2 text-3xl font-bold text-slate-900 tabular-nums">{totalRatings}</div>
              <div className="text-xs text-slate-500 mt-1.5 font-semibold">Engagement count</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-tight">
                <MousePointerClick className="w-4 h-4 text-blue-600" /> Google clicks
              </div>
              <div className="mt-2 text-3xl font-bold text-slate-900 tabular-nums">{googleClicks}</div>
              <div className="text-xs text-slate-500 mt-1.5 font-semibold">Clicked “Leave a Review”</div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 mb-8 shadow-sm">
            <div className="text-sm font-bold text-slate-900 mb-5 flex items-center gap-2 uppercase tracking-wide">
              <TrendingUp className="w-4 h-4 text-indigo-500" />
              Ratings breakdown
            </div>
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((r) => {
                const count = Number(ratingCounts?.[r] ?? 0);
                const pct = totalRatings > 0 ? Math.round((count / totalRatings) * 100) : 0;
                return (
                  <div key={r} className="flex items-center gap-4">
                    <div className="w-12 text-xs font-semibold text-slate-700">{r} ★</div>
                    <div className="flex-1 h-3 rounded-full bg-slate-100 overflow-hidden shadow-inner">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1, ease: 'circOut' }}
                        className="h-full bg-slate-900 rounded-full" 
                      />
                    </div>
                    <div className="w-24 text-right text-xs font-semibold text-slate-600 tabular-nums">
                      {count} <span className="text-slate-400 font-semibold">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 uppercase tracking-wide">
                <MessageSquare className="w-4 h-4 text-rose-500" />
                Customer Feedbacks
              </div>
              <div className="text-xs font-semibold text-slate-400">
                {feedbacks.length ? `LAST ${feedbacks.length} ENTRIES` : ""}
              </div>
            </div>

            {feedbacks.length === 0 ? (
              <div className="text-sm text-slate-500 font-medium italic py-4">No specific feedback comments yet.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {feedbacks.map((f, i) => (
                  <motion.div 
                    key={f._id || i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 hover:bg-white hover:border-slate-200 transition-all cursor-default"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex items-center text-xs font-semibold text-slate-900 bg-yellow-100 px-1.5 py-0.5 rounded">
                            {Number(f.rating ?? 0)} ★
                          </div>
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-tighter">
                            {f.createdAt ? new Date(f.createdAt).toLocaleDateString() : ""}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-slate-700 mb-2">
                          {f.name || f.full_name || f.visitorName || f.customer_name || f.fullName || (f.phone ? `Phone: ${f.phone}` : "Valued Customer")}
                        </div>
                        <div className="text-sm text-slate-600 font-medium leading-relaxed whitespace-pre-wrap break-words italic">
                          "{f.feedback || f.message}"
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

  /* ───── MOBILE VIEW ───── */
  const MobileReviews = (
    <div className="lg:hidden w-full font-poppins overflow-x-hidden bg-white">
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Analytics</p>
            <h1 className="text-xl font-bold text-slate-900 leading-tight mt-1">
              Hi, {userName?.split(' ')[0]} 👋
            </h1>
          </div>
          <img src={user?.photoURL || "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=80"} alt="avatar" className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md" />
        </div>

        <CardSelector
          cards={cards}
          selectedCardId={selectedCardId}
          onSelect={setSelectedCardId}
          getLabel={getCardLabel}
          disabled={reviewLoading}
        />
        {reviewLoading && <p className="text-[10px] text-slate-500 animate-pulse mt-2 font-medium">Syncing review data…</p>}
      </div>

      {!selectedCard ? (
        <div className="mx-4 mt-4 p-8 bg-slate-50 rounded-3xl border border-dashed border-slate-300 text-center">
          <Award className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-600">No cards found</p>
          <p className="text-xs text-slate-400 mt-1">Create a card to see reviews</p>
        </div>
      ) : (
        <>
          {/* Stat Cards Row */}
          <div className="px-4 mb-6 overflow-x-auto scrollbar-hide">
            <div className="flex gap-3 min-w-max pr-4">
              {[
                { icon: Star, label: 'Avg Rating', value: average ? average.toFixed(2) : "0.00", color: 'bg-yellow-50', iconColor: 'text-yellow-600' },
                { icon: Award, label: 'Total Ratings', value: totalRatings, color: 'bg-indigo-50', iconColor: 'text-indigo-600' },
                { icon: MousePointerClick, label: 'Google Clicks', value: googleClicks, color: 'bg-blue-50', iconColor: 'text-blue-600' },
                { icon: ThumbsUp, label: 'Feedback', value: feedbacks.length, color: 'bg-rose-50', iconColor: 'text-rose-500' },
              ].map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={`${s.color} rounded-2xl px-5 py-4 min-w-[125px] flex flex-col items-start shadow-sm border border-black/5`}
                >
                  <s.icon className={`w-5 h-5 ${s.iconColor} mb-2`} />
                  <span className="text-xl font-bold text-slate-900 leading-none">{s.value}</span>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase mt-1 tracking-tight">{s.label}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Charts Row */}
          <div className="px-4 mb-6 grid grid-cols-1 gap-5">
            {/* Donut Chart - Rating Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-50 rounded-3xl p-5 border border-slate-100 flex flex-col items-center"
            >
              <div className="w-full flex justify-between items-center mb-5">
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5 text-indigo-500" />
                  Rating Split
                </h3>
              </div>
              <DonutChart 
                size={140}
                strokeWidth={22}
                centerLabel={average ? average.toFixed(1) : "0"}
                segments={[
                  { value: Number(ratingCounts?.[5] ?? 0), color: '#10b981' }, 
                  { value: Number(ratingCounts?.[4] ?? 0), color: '#84cc16' }, 
                  { value: Number(ratingCounts?.[3] ?? 0), color: '#eab308' }, 
                  { value: Number(ratingCounts?.[2] ?? 0), color: '#f97316' }, 
                  { value: Number(ratingCounts?.[1] ?? 0), color: '#ef4444' }, 
                ]}
              />
              <div className="grid grid-cols-3 gap-y-3 gap-x-6 mt-6 w-full px-2">
                {[5, 4, 3, 2, 1].map((r, i) => {
                  const colors = ['#10b981', '#84cc16', '#eab308', '#f97316', '#ef4444'];
                  const count = Number(ratingCounts?.[r] ?? 0);
                  return (
                    <div key={r} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: colors[i] }} />
                      <span className="text-[10px] font-bold text-slate-600 truncate">{r} ★</span>
                      <span className="text-[10px] font-semibold text-slate-400">{count}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Ratings Bar Chart Breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[#fcfaff] rounded-3xl p-5 border border-indigo-50"
            >
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-5 flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-purple-500" />
                Breakdown
              </h3>
              <div className="space-y-3.5">
                {[5, 4, 3, 2, 1].map((r, i) => {
                  const count = Number(ratingCounts?.[r] ?? 0);
                  const pct = totalRatings > 0 ? Math.round((count / totalRatings) * 100) : 0;
                  return (
                    <div key={r} className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-slate-500 w-6">{r}★</span>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, delay: 0.2 + i * 0.05 }}
                          className="h-full bg-slate-900 rounded-full" 
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-slate-900 w-8 text-right underline decoration-slate-200 underline-offset-2">{count}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* Feedbacks Grid - Premium Mobile Style */}
          <div className="px-5 mb-10">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-rose-500" />
              Latest Reviews
            </h3>
            {feedbacks.length === 0 ? (
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 text-center">
                <p className="text-xs font-bold text-slate-400">No text reviews yet</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {feedbacks.map((f, i) => (
                  <motion.div
                    key={f._id || i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 px-2.5 py-1 bg-yellow-400 text-white text-[10px] font-black italic rounded-bl-xl">
                      {Number(f.rating ?? 0)} ★
                    </div>
                    <div className="flex flex-col gap-1.5 pt-1">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-500 uppercase">
                          {(f.name || f.full_name || f.visitorName || f.customer_name || "A").charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-slate-900 truncate max-w-[150px]">
                            {f.name || f.full_name || f.visitorName || f.customer_name || f.fullName || (f.phone ? `Phone: ${f.phone}`: "Valued Customer")}
                          </span>
                          <span className="text-[9px] font-semibold text-slate-400 flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5" />
                            {f.createdAt ? new Date(f.createdAt).toLocaleDateString() : ""}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs font-medium text-slate-600 leading-relaxed mt-1 italic border-l-2 border-slate-100 pl-3 py-1">
                        "{f.feedback || f.message}"
                      </p>
                      {f.phone && (
                        <div className="mt-2 pt-2 border-t border-slate-50 flex justify-end">
                          <span className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">Phone: {f.phone}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

  return (
    <>
      {DesktopReviews}
      {MobileReviews}
    </>
  );
}

