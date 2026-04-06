import React, { useEffect, useMemo, useState } from "react";
import { resellerAPI } from "../api/reseller";
import { useToast } from "../contexts/ToastContext";

export default function ResellerUsers({ onGenerateForUser, onEditCardForUser }) {
  const { success: showSuccess, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
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

  const users = useMemo(() => usersRes?.data?.users || usersRes?.users || [], [usersRes]);

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
  }, [selectedUser?._id, showError]);

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
    if (onGenerateForUser) onGenerateForUser(selectedUser);
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
              className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium disabled:opacity-50"
              disabled={!selectedUser}
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
                    <div className="text-sm font-semibold text-gray-900">
                      {c.name || c.data?.CompanyName || c.data?.name || "Untitled card"}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Card Type : {c.categoryId} card
                      <br />
                      Updated {c.updatedAt ? new Date(c.updatedAt).toLocaleDateString() : ""}
                      {c.lastEditedBy ? ` · Edited by ${c.lastEditedBy}` : ""}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          onEditCardForUser && onEditCardForUser(selectedUser, c._id)
                        }
                        className="flex-1 min-w-[100px] px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium"
                      >
                        Edit
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
                        onClick={() => handleDeleteCard(c)}
                        disabled={deletingId === c._id}
                        className="w-full sm:w-auto px-3 py-2 rounded-lg border border-red-200 text-red-700 text-xs font-medium hover:bg-red-50 disabled:opacity-50"
                      >
                        {deletingId === c._id ? "Deleting…" : "Delete"}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
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
    </div>
  );
}

