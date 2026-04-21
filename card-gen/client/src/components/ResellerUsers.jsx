import React, { useEffect, useMemo, useState } from "react";
import { BarChart3, CalendarCheck2, Download, Eye, Heart, Pen, Share2, Trash2, X, ChevronRight, LayoutGrid, Plus } from "lucide-react";
import { resellerAPI } from "../api/reseller";
import { walletAPI } from "../api/wallet";
import { getCardAnalytics } from "../api/cards";
import { getNegativeFeedbacks, getReviewFunnelStats } from "../api/reviewFunnel";
import { useToast } from "../contexts/ToastContext";

export default function ResellerUsers({ onGenerateForUser, onEditCardForUser, searchTerm: globalSearchTerm = "" }) {
  const { success: showSuccess, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState(null);
  const [usersRes, setUsersRes] = useState({ users: [], pagination: null });
  const [localSearch, setLocalSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    phone: "",
    password: "",
    email: "",
    businessType: "",
  });

  const [selectedUser, setSelectedUser] = useState(null);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [userCards, setUserCards] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
  const [statsOpen, setStatsOpen] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsCard, setStatsCard] = useState(null);
  const [stats, setStats] = useState(null);
  const [reviewStats, setReviewStats] = useState(null);
  const [reviewFeedbacks, setReviewFeedbacks] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [statsTab, setStatsTab] = useState("appointments"); // appointments | reviews

  const users = useMemo(() => usersRes?.data?.users || usersRes?.users || [], [usersRes]);

  const filteredCards = useMemo(() => {
    if (!globalSearchTerm) return userCards;
    const q = globalSearchTerm.toLowerCase();
    return userCards.filter(c => 
      (c.name || "").toLowerCase().includes(q) || 
      (c.data?.CompanyName || "").toLowerCase().includes(q) ||
      (c.data?.phone || "").toLowerCase().includes(q)
    );
  }, [userCards, globalSearchTerm]);

  const walletBalance = Number(wallet?.walletBalance ?? 0);
  const costPerCard = Number(wallet?.costPerCard ?? 0);
  const hasSufficientWallet = costPerCard > 0 ? walletBalance >= costPerCard : true;

  const load = async () => {
    setLoading(true);
    try {
      const u = await resellerAPI.listUsers({ page: 1, limit: 100, search: globalSearchTerm || localSearch });
      setUsersRes(u);
    } catch (e) {
      showError(e?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [globalSearchTerm]);

  useEffect(() => {
    walletAPI
      .getMyWallet()
      .then((res) => setWallet(res?.data ?? res ?? null))
      .catch(() => null);
  }, []);

  useEffect(() => {
    const run = async () => {
      if (!selectedUser?._id) {
        setUserCards([]);
        return;
      }
      setCardsLoading(true);
      try {
        const res = await resellerAPI.listCardsForUser(selectedUser._id);
        setUserCards(Array.isArray(res?.data) ? res.data : []);
      } catch (e) {
        showError(e?.error || e?.message || "Failed to load user cards");
        setUserCards([]);
      } finally {
        setCardsLoading(false);
      }
    };
    run();
  }, [selectedUser?._id]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const res = await resellerAPI.createUser(createForm);
      if (!res?.success) throw new Error(res?.error || "Failed to create user");
      showSuccess("User created");
      setShowCreate(false);
      setCreateForm({ name: "", phone: "", password: "", email: "", businessType: "" });
      await load();
    } catch (e2) {
      const serverValidation =
        Array.isArray(e2?.errors) && e2.errors.length
          ? e2.errors[0]?.msg || e2.errors[0]?.message
          : "";
      showError(e2?.error || serverValidation || e2?.message || "Failed to create user");
    }
  };

  const goGenerate = () => {
    if (!selectedUser?._id) {
      showError("Select a user first");
      return;
    }
    if (!hasSufficientWallet) {
      showError(
        "Not enough wallet balance to create this card. Please recharge your wallet and try again."
      );
      return;
    }
    if (onGenerateForUser) onGenerateForUser(selectedUser);
  };

  const handleViewStats = async (card) => {
    if (!card?._id) return;
    setStatsOpen(true);
    setStatsCard(card);
    setStats(null);
    setReviewStats(null);
    setReviewFeedbacks([]);
    setStatsTab("appointments");
    setStatsLoading(true);
    setReviewLoading(true);
    try {
      const [res, rfStats, rfFeedbacks] = await Promise.all([
        getCardAnalytics(card._id),
        getReviewFunnelStats(card._id).catch(() => null),
        getNegativeFeedbacks(card._id, { limit: 10 }).catch(() => null),
      ]);
      setStats(res || null);
      setReviewStats(rfStats?.data ?? rfStats ?? null);
      const items = rfFeedbacks?.data ?? rfFeedbacks ?? [];
      setReviewFeedbacks(Array.isArray(items) ? items : []);
    } catch (e) {
      showError(e?.message || "Failed to load analytics");
      setStatsOpen(false);
      setStatsCard(null);
    } finally {
      setStatsLoading(false);
      setReviewLoading(false);
    }
  };

  const closeStats = () => {
    setStatsOpen(false);
    setStats(null);
    setStatsCard(null);
    setStatsLoading(false);
    setReviewStats(null);
    setReviewFeedbacks([]);
    setReviewLoading(false);
    setStatsTab("appointments");
  };

  const handleDeleteCard = async (card) => {
    if (!selectedUser?._id || !card?._id) return;
    const title = card.name || card.data?.CompanyName || "this card";
    const ok = window.confirm(
      `Delete "${title}"? The card cost will be refunded to your wallet (if this card was billed to your account).`
    );
    if (!ok) return;
    setDeletingId(card._id);
    try {
      const res = await resellerAPI.deleteCardForUser(selectedUser._id, card._id);
      if (!res?.success) throw new Error(res?.error || "Delete failed");
      const refund = res.refundAmount != null ? Number(res.refundAmount) : 0;
      showSuccess(
        refund > 0
          ? `Card deleted. ₹${refund} refunded to your wallet.`
          : "Card deleted."
      );
      const next = await resellerAPI.listCardsForUser(selectedUser._id);
      setUserCards(Array.isArray(next?.data) ? next.data : []);
    } catch (e) {
      showError(e?.error || e?.message || "Failed to delete card");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (    <div className="h-full flex flex-col bg-white rounded-[20px] p-8 shadow-sm border border-gray-100">
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-10 overflow-hidden">
        {/* User List Panel */}
        <div className="lg:col-span-4 flex flex-col min-h-0 border-r border-gray-100 pr-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-semibold text-gray-900 tracking-tight">User List</h2>
            <button
              onClick={load}
              className="text-gray-900 hover:text-indigo-600 font-semibold text-xl transition-colors"
            >
              Refresh
            </button>
          </div>
          
          <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
            {users.length === 0 ? (
              <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-gray-400 font-medium font-sans">No users found.</p>
              </div>
            ) : (
              users.map((u) => {
                const isActive = selectedUser?._id === u._id;
                return (
                  <button
                    key={u._id}
                    onClick={() => setSelectedUser(u)}
                    className={`w-full text-left px-5 py-4 rounded-[16px] transition-all  duration-300 border ${
                      isActive 
                        ? 'bg-[#8B5CF6] text-white border-[#C2B0F3] shadow-md' 
                        : 'bg-white border-gray-300 hover:border-indigo-200'
                    }`}
                  >
                    <div className={`text-xl font-medium tracking-tight ${isActive ? 'text-white' : 'text-gray-800'}`}>
                      {u.name || 'Dummy Card One'}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Cards Display Panel */}
        <div className="lg:col-span-8 flex flex-col min-h-0">
           <div className="flex justify-end mb-8">
              <button
                type="button"
                onClick={goGenerate}
                className="flex items-center gap-2 px-6 py-2 bg-[#FF0000] hover:bg-[#D00] text-white rounded-full font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50"
                disabled={!selectedUser}
              >
                <div className="bg-white rounded-full p-0.5">
                  <Plus className="h-3 w-3 text-[#FF0000] stroke-[4px]" />
                </div>
                New Card
              </button>
           </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {cardsLoading ? (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#C2B0F3]" />
              </div>
            ) : filteredCards.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center bg-gray-50 rounded-[20px] border-2 border-dashed border-gray-200 p-12">
                <p className="text-gray-400 font-semibold text-xl">
                  {selectedUser ? "No cards match your search" : "Select a user to view their cards"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-6">
                {filteredCards.map((c) => (
                  <div key={c._id} className="bg-white rounded-[16px] px-3 py-4 shadow-sm border border-gray-200 flex items-center gap-4 hover:shadow-md transition-all relative group">
                    {/* Card Content */}
                    <div className="relative shrink-0">
                      <img 
                        src={c.data?.logo || c.data?.media || "https://ui-avatars.com/api/?name=" + (c.name || 'C') + "&background=D2B0J9&color=fff"} 
                        alt="Logo" 
                        className="w-20 h-20 rounded-full object-cover border-2 border-gray-50 shadow-sm"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-[#5B88FF] text-white text-[10px] font-semibold uppercase px-3 py-1 rounded-[4px] whitespace-nowrap">
                          Order Print
                        </span>
                        <button 
                          onClick={() => handleViewStats(c)}
                          className="text-gray-400 hover:text-indigo-600"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 leading-tight mb-0.5 truncate uppercase tracking-tight">
                        {c.name || c.data?.CompanyName || c.data?.name || "Untitled card"}
                      </h3>
                      
                      <div className="flex flex-col gap-0">
                        <p className="text-[11px] text-gray-500 font-semibold">P : NO : {c.phone || c.data?.phone || '9236553585'}</p>
                        <p className="text-[10px] text-gray-400 font-medium">Date : {c.updatedAt ? new Date(c.updatedAt).toLocaleDateString('en-GB') : '23 Aug 2025'}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col justify-between items-end gap-6">
                       <button
                        onClick={() => handleDeleteCard(c)}
                        disabled={deletingId === c._id}
                        className="text-gray-400 hover:text-red-500 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onEditCardForUser && onEditCardForUser(selectedUser, c._id)}
                        className="p-2 bg-black text-white rounded-full hover:bg-gray-800 transition-all"
                      >
                        <Pen className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 !mt-0 z-[9998] flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-xl w-full max-w-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Create user</h3>
              <button onClick={() => setShowCreate(false)} className="text-xs text-gray-500">
                Close
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                  <input
                    value={createForm.name}
                    onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    value={createForm.phone}
                    onChange={(e) => setCreateForm((p) => ({ ...p, phone: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={createForm.password}
                    onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email (optional)</label>
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Business type (optional)</label>
                <input
                  value={createForm.businessType}
                  onChange={(e) => setCreateForm((p) => ({ ...p, businessType: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <button className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium">
                Create user
              </button>
            </form>
          </div>
        </div>
      )}

      {statsOpen && (
        <div className="fixed inset-0 !mt-0 z-[9998] flex items-center justify-center bg-black/60 px-4">
          <div className="bg-white rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl border border-gray-100">
            <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-gray-900">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <h3 className="text-base font-semibold">Card analytics</h3>
                </div>
                <p className="text-xs text-gray-500 mt-1 truncate">
                  {statsCard?.name ||
                    statsCard?.data?.CompanyName ||
                    statsCard?.data?.name ||
                    "Untitled card"}
                </p>
              </div>
              <button
                type="button"
                onClick={closeStats}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5">
              {statsLoading ? (
                <div className="text-sm text-gray-500">Loading analytics…</div>
              ) : !stats ? (
                <div className="text-sm text-gray-500">No analytics available.</div>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setStatsTab("appointments")}
                      className={[
                        "px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors",
                        statsTab === "appointments"
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      Appointments
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatsTab("reviews")}
                      className={[
                        "px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors",
                        statsTab === "reviews"
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      Reviews
                    </button>
                  </div>

                  {statsTab === "appointments" ? (
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="rounded-xl border border-gray-200 p-3">
                        <div className="flex items-center gap-2 text-gray-700 text-xs">
                          <Eye className="h-4 w-4 text-indigo-600" /> Views
                        </div>
                        <div className="text-xl font-semibold text-gray-900 mt-1">
                          {Number(stats.views ?? 0)}
                        </div>
                      </div>
                      <div className="rounded-xl border border-gray-200 p-3">
                        <div className="flex items-center gap-2 text-gray-700 text-xs">
                          <CalendarCheck2 className="h-4 w-4 text-emerald-600" /> Appointments
                        </div>
                        <div className="text-xl font-semibold text-gray-900 mt-1">
                          {Number(stats.appointments ?? 0)}
                        </div>
                      </div>
                      <div className="rounded-xl border border-gray-200 p-3">
                        <div className="flex items-center gap-2 text-gray-700 text-xs">
                          <Share2 className="h-4 w-4 text-sky-600" /> Shares
                        </div>
                        <div className="text-xl font-semibold text-gray-900 mt-1">
                          {Number(stats.shares ?? 0)}
                        </div>
                      </div>
                      <div className="rounded-xl border border-gray-200 p-3">
                        <div className="flex items-center gap-2 text-gray-700 text-xs">
                          <Heart className="h-4 w-4 text-rose-600" /> Likes
                        </div>
                        <div className="text-xl font-semibold text-gray-900 mt-1">
                          {Number(stats.likes ?? 0)}
                        </div>
                      </div>
                      <div className="rounded-xl border border-gray-200 p-3">
                        <div className="flex items-center gap-2 text-gray-700 text-xs">
                          <Download className="h-4 w-4 text-gray-700" /> Contact downloads
                        </div>
                        <div className="text-xl font-semibold text-gray-900 mt-1">
                          {Number(stats.contactDownloads ?? stats.downloads ?? 0)}
                        </div>
                      </div>
                      <div className="rounded-xl border border-gray-200 p-3">
                        <div className="flex items-center gap-2 text-gray-700 text-xs">
                          <Download className="h-4 w-4 text-violet-600" /> Saves
                        </div>
                        <div className="text-xl font-semibold text-gray-900 mt-1">
                          {Number(stats.saves ?? 0)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="rounded-xl border border-gray-200 p-4">
                        <div className="text-sm font-semibold text-gray-900">Ratings</div>
                        {reviewLoading ? (
                          <div className="text-xs text-gray-500 mt-2">Loading review stats…</div>
                        ) : !reviewStats ? (
                          <div className="text-xs text-gray-500 mt-2">No review stats yet.</div>
                        ) : (
                          <div className="mt-3 grid grid-cols-2 gap-3">
                            <div className="rounded-lg border border-gray-100 p-3">
                              <div className="text-xs text-gray-600">Total ratings</div>
                              <div className="text-lg font-semibold text-gray-900">
                                {Number(reviewStats.totalRatings ?? 0)}
                              </div>
                            </div>
                            <div className="rounded-lg border border-gray-100 p-3">
                              <div className="text-xs text-gray-600">Google clicks</div>
                              <div className="text-lg font-semibold text-gray-900">
                                {Number(reviewStats.googleClicks ?? 0)}
                              </div>
                            </div>
                            <div className="col-span-2 rounded-lg border border-gray-100 p-3">
                              <div className="text-xs text-gray-600 mb-2">Ratings breakdown</div>
                              <div className="grid grid-cols-5 gap-2 text-center">
                                {[1, 2, 3, 4, 5].map((r) => (
                                  <div key={r} className="rounded-md bg-gray-50 px-2 py-1">
                                    <div className="text-[11px] text-gray-600">{r}★</div>
                                    <div className="text-sm font-semibold text-gray-900">
                                      {Number(reviewStats?.ratingCounts?.[r] ?? 0)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="rounded-xl border border-gray-200 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-semibold text-gray-900">Feedback (1–2★)</div>
                          <div className="text-xs text-gray-500">
                            {reviewFeedbacks.length ? `Latest ${reviewFeedbacks.length}` : ""}
                          </div>
                        </div>
                        {reviewLoading ? (
                          <div className="text-xs text-gray-500 mt-2">Loading feedback…</div>
                        ) : reviewFeedbacks.length === 0 ? (
                          <div className="text-xs text-gray-500 mt-2">No feedback yet.</div>
                        ) : (
                          <div className="mt-3 space-y-3 max-h-72 overflow-auto pr-1">
                            {reviewFeedbacks.map((f) => (
                              <div
                                key={f._id || `${f.createdAt}-${f.rating}`}
                                className="rounded-lg border border-gray-100 p-3 bg-white"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="text-xs text-gray-600">
                                      {Number(f.rating ?? 0)}★{f.name ? ` · ${f.name}` : ""}{f.phone ? ` · ${f.phone}` : ""}
                                    </div>
                                    <div className="text-sm text-gray-900 mt-1 whitespace-pre-wrap break-words">
                                      {f.feedback}
                                    </div>
                                  </div>
                                  <div className="text-[11px] text-gray-500 shrink-0">
                                    {f.createdAt ? new Date(f.createdAt).toLocaleString() : ""}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

