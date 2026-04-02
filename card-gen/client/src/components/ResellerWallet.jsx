import React, { useEffect, useState } from "react";
import { walletAPI } from "../api/wallet";
import { useToast } from "../contexts/ToastContext";

export default function ResellerWallet() {
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState(null);
  const [amount, setAmount] = useState("");
  const { success: showSuccess, error: showError } = useToast();

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await walletAPI.getMyWallet();
      setWallet(res?.data || null);
    } catch (e) {
      showError(e?.message || "Failed to load wallet");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const startRecharge = async () => {
    const v = Number(amount);
    if (!v || Number.isNaN(v) || v <= 0) {
      showError("Enter a valid amount");
      return;
    }
    try {
      const order = await walletAPI.createRechargeOrder(v);
      if (!order?.success) throw new Error(order?.error || "Failed to create order");

      const key = order.key;
      if (!key) throw new Error("Missing Razorpay key");

      if (!window.Razorpay) {
        showError("Razorpay script not loaded in admin panel");
        return;
      }

      const rzp = new window.Razorpay({
        key,
        amount: order.amount * 100,
        currency: "INR",
        order_id: order.orderId,
        name: "Wallet Recharge",
        description: "Admin wallet recharge",
        handler: async (response) => {
          try {
            const verify = await walletAPI.verifyRecharge(response);
            if (!verify?.success) throw new Error(verify?.error || "Verification failed");
            showSuccess("Wallet recharged");
            await refresh();
          } catch (e) {
            showError(e?.message || "Recharge verification failed");
          }
        },
      });
      rzp.open();
    } catch (e) {
      showError(e?.message || "Recharge failed");
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Wallet</h1>
        <p className="text-gray-600 mt-1">Balance, recharge, and transaction history.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="text-xs text-gray-500">Balance</div>
          <div className="text-2xl font-semibold text-gray-900">₹{wallet?.walletBalance ?? 0}</div>
          <div className="text-xs text-gray-500">Cost per card: ₹{wallet?.costPerCard ?? 0}</div>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Recharge amount"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-40"
          />
          <button
            onClick={startRecharge}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium"
          >
            Recharge
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Transactions</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {(wallet?.transactions || []).length === 0 ? (
            <div className="p-4 text-sm text-gray-500">No transactions yet.</div>
          ) : (
            wallet.transactions.map((t, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium text-gray-900">
                    {t.type.toUpperCase()} ₹{t.amount}
                  </div>
                  <div className="text-xs text-gray-500">
                    {t.reason || t.method || "transaction"} · {t.status || "success"}
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {t.createdAt ? new Date(t.createdAt).toLocaleString() : ""}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

