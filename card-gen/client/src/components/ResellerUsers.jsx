import React, { useEffect, useMemo, useState } from "react";
import { BarChart3, CalendarCheck2, Download, Eye, Heart, Pen, Share2, Trash2, X } from "lucide-react";
import { resellerAPI } from "../api/reseller";
import { walletAPI } from "../api/wallet";
import { getCardAnalytics } from "../api/cards";
import { getNegativeFeedbacks, getReviewFunnelStats } from "../api/reviewFunnel";
import { useToast } from "../contexts/ToastContext";

export default function ResellerUsers({ onGenerateForUser, onEditCardForUser }) {
  const { success: showSuccess, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState(null);
  const [usersRes, setUsersRes] = useState({ users: [], pagination: null });
  const [search, setSearch] = useState("");
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

  const walletBalance = Number(wallet?.walletBalance ?? 0);
  const costPerCard = Number(wallet?.costPerCard ?? 0);
  const hasSufficientWallet = costPerCard > 0 ? walletBalance >= costPerCard : true;

  const load = async () => {
    setLoading(true);
    try {
      const u = await resellerAPI.listUsers({ page: 1, limit: 50, search });
      setUsersRes(u);
    } catch (e) {
      showError(e?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600 mt-1">Select a user to view and manage their cards.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium"
        >
          Create user
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-4 bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-gray-900">User list</h2>
              <button
                onClick={load}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs"
              >
                Refresh
              </button>
            </div>
            <div className="mt-3 flex gap-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <button
                onClick={load}
                className="px-3 py-2 rounded-lg border border-gray-300 text-sm"
              >
                Search
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-100 max-h-[70vh] overflow-auto">
            {users.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">No users found.</div>
            ) : (
              users.map((u) => (
                <button
                  key={u._id}
                  onClick={() => setSelectedUser(u)}
                  className={`w-full text-left p-4 hover:bg-gray-50 ${
                    selectedUser?._id === u._id ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="font-medium text-gray-900">{u.name}</div>
                  <div className="text-xs text-gray-500">
                    {u.phone} {u.email ? `· ${u.email}` : ""}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-8 bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Cards</h2>
              <p className="text-xs text-gray-500">
                {selectedUser
                  ? `${selectedUser.name} · ${selectedUser.phone}${selectedUser.email ? ` · ${selectedUser.email}` : ""}`
                  : "Select a user to view cards"}
              </p>
            </div>
            <button
              type="button"
              onClick={goGenerate}
              className={`px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50 ${
                !selectedUser ? "bg-gray-500" : "bg-gray-900"
              } ${selectedUser && !hasSufficientWallet ? "opacity-60" : ""}`}
              disabled={!selectedUser}
              aria-disabled={selectedUser && !hasSufficientWallet}
              title={
                !hasSufficientWallet && selectedUser
                  ? `Insufficient balance. Balance ₹${walletBalance} / Cost ₹${costPerCard}`
                  : undefined
              }
            >
              + New card
            </button>
          </div>

          <div className="p-4">
            {cardsLoading ? (
              <div className="text-sm text-gray-500">Loading cards…</div>
            ) : userCards.length === 0 ? (
              <div className="text-sm text-gray-500">
                {selectedUser ? "No cards yet. Create the first one." : "—"}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {userCards.map((c) => (
                  <div key={c._id} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center gap-4">
                      <img src={c.data?.logo || c.data?.media || ""} alt={c.name || c.data?.CompanyName || c.data?.name || "Untitled card"} className="w-16 h-16 rounded-full " />
                    <div className="">
                      <p className="text-base font-semibold text-gray-900">{c.name || c.data?.CompanyName || c.data?.name || "Untitled card"}</p>
                    
                      <p className="text-xs text-gray-500 mt-1">Card Type : {c.categoryId} card</p>
                      <p className="text-xs text-gray-500">Updated {c.updatedAt ? new Date(c.updatedAt).toLocaleDateString() : ""}</p>
                      <p className="text-xs text-gray-500 mt-1">{c.lastEditedBy ? ` Edited by ${c.lastEditedBy}` : ""}</p>
                    </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          onEditCardForUser && onEditCardForUser(selectedUser, c._id)
                        }
                        className="min-w-[20px] px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium"
                      >
                        <Pen className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => window.open(c.shareableLink, "_blank")}
                        className="flex-1 min-w-[100px] px-3 py-2 rounded-lg border border-gray-300 text-xs font-medium"
                      >
                         Open Card
                      </button>
                      <button
                        type="button"
                        onClick={() => handleViewStats(c)}
                        className="flex-1 min-w-[100px] px-3 py-2 rounded-lg border border-gray-300 text-xs font-medium"
                      >
                        View Stats
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCard(c)}
                        disabled={deletingId === c._id}
                        className="w-full sm:w-auto px-3 py-2 rounded-lg border border-red-200 text-red-700 text-xs font-medium hover:bg-red-50 disabled:opacity-50"
                      >
                        {/* {deletingId === c._id ? "Deleting…" : "Delete"} */}
                        <Trash2 className="h-4 w-4" />
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

