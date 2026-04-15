import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import { apiService } from "../lib/api.js";
import { Star, MousePointerClick, MessageSquare } from "lucide-react";

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

export default function Reviews() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewStats, setReviewStats] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);

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
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Reviews</h1>
          <p className="text-sm text-slate-600">
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
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700">
          Create a card first to start collecting reviews.
        </div>
      ) : reviewLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700">
          Loading review stats…
        </div>
      ) : !reviewStats ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700">
          No review activity yet for this card.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Star className="w-4 h-4 text-yellow-500" /> Avg rating
              </div>
              <div className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">
                {average ? average.toFixed(2) : "0.00"}
              </div>
              <div className="text-xs text-slate-500 mt-1">{totalRatings} total ratings</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Star className="w-4 h-4 text-slate-700" /> Ratings
              </div>
              <div className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">{totalRatings}</div>
              <div className="text-xs text-slate-500 mt-1">How many people rated</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <MousePointerClick className="w-4 h-4 text-blue-600" /> Google clicks
              </div>
              <div className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">{googleClicks}</div>
              <div className="text-xs text-slate-500 mt-1">Clicked “Leave a Review”</div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 mb-6">
            <div className="text-sm font-semibold text-slate-900 mb-3">Ratings breakdown</div>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((r) => {
                const count = Number(ratingCounts?.[r] ?? 0);
                const pct = totalRatings > 0 ? Math.round((count / totalRatings) * 100) : 0;
                return (
                  <div key={r} className="flex items-center gap-3">
                    <div className="w-10 text-xs font-medium text-slate-700">{r}★</div>
                    <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-slate-900" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="w-20 text-right text-xs text-slate-600 tabular-nums">
                      {count} ({pct}%)
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <MessageSquare className="w-4 h-4 text-rose-600" />
                Feedbacks
              </div>
              <div className="text-xs text-slate-500">
                {feedbacks.length ? `Latest ${feedbacks.length}` : ""}
              </div>
            </div>

            {feedbacks.length === 0 ? (
              <div className="text-sm text-slate-600">No feedback yet.</div>
            ) : (
              <div className="space-y-3">
                {feedbacks.map((f) => (
                  <div key={f._id || `${f.createdAt}-${f.rating}`} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-xs text-slate-600">
                          {Number(f.rating ?? 0)}★{f.name ? ` · ${f.name}` : ""}{f.phone ? ` · ${f.phone}` : ""}
                        </div>
                        <div className="mt-1 text-sm text-slate-900 whitespace-pre-wrap break-words">
                          {f.feedback}
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-500 shrink-0">
                        {f.createdAt ? new Date(f.createdAt).toLocaleString() : ""}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

