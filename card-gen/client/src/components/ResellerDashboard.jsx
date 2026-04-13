import React, { useEffect, useState } from "react";
import { Wallet, Users, CreditCard, ArrowLeft } from "lucide-react";
import { resellerAPI } from "../api/reseller";
import { walletAPI } from "../api/wallet";
import { useToast } from "../contexts/ToastContext";

export default function ResellerDashboard({ onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [wallet, setWallet] = useState(null);
  const { error: showError } = useToast();

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [s, w] = await Promise.all([
          resellerAPI.getStats().catch(() => null),
          walletAPI.getMyWallet().catch(() => null),
        ]);
        setStats(s?.data || null);
        setWallet(w?.data || null);
      } catch (e) {
        showError(e?.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, [showError]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reseller Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of your users, cards, and wallet.</p>
      </div>
      <button
        onClick={() => onNavigate && onNavigate("resellerWallet")}
        className="mt-1 text-sm text-white bg-blue-600 flex items-center gap-2 px-4 py-2 rounded-lg"
      >
        <Wallet className="h-5 w-5" /> Recharge</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50">
              <Wallet className="h-5 w-5 text-emerald-700" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Wallet balance</div>
              <div className="text-xl font-semibold text-gray-900">
                ₹{wallet?.walletBalance ?? stats?.walletBalance ?? 0}
              </div>
              <div className="text-xs text-gray-500">
                Cost per card: ₹{wallet?.costPerCard ?? stats?.costPerCard ?? 0}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50">
              <Users className="h-5 w-5 text-blue-700" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Users created</div>
              <div className="text-xl font-semibold text-gray-900">
                {stats?.usersCount ?? 0}
              </div>
              <button
                onClick={() => onNavigate && onNavigate("resellerUsers")}
                className="mt-1 text-xs text-blue-600 hover:text-blue-700"
              >
                Manage users
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-50">
              <CreditCard className="h-5 w-5 text-purple-700" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Cards generated</div>
              <div className="text-xl font-semibold text-gray-900">
                {stats?.cardsCount ?? 0}
              </div>
              <button
                onClick={() => onNavigate && onNavigate("resellerUsers")}
                className="mt-1 text-xs text-blue-600 hover:text-blue-700"
              >
                Generate a card
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

