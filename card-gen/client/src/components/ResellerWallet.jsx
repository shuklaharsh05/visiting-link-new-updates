import React, { useEffect, useState } from "react";
import { 
  Wallet, RefreshCw, Plus, ArrowUpRight, ArrowDownLeft, 
  History, CreditCard, ShieldCheck, HelpCircle, ChevronRight, Clock
} from "lucide-react";
import { walletAPI } from "../api/wallet";
import { useToast } from "../contexts/ToastContext";

const QUICK_AMOUNTS = [500, 1000, 2000, 5000];

export default function ResellerWallet() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [amount, setAmount] = useState("");
  const { success: showSuccess, error: showError } = useToast();

  const refresh = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    
    try {
      const res = await walletAPI.getMyWallet();
      setWallet(res?.data || null);
    } catch (e) {
      showError(e?.message || "Failed to load wallet data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const startRecharge = async () => {
    const v = Number(amount);
    if (!v || Number.isNaN(v) || v < 100) {
      showError("Minimum recharge amount is ₹100");
      return;
    }
    try {
      const order = await walletAPI.createRechargeOrder(v);
      if (!order?.success) throw new Error(order?.error || "Failed to initiate transaction");

      const key = order.key;
      if (!key) throw new Error("Payment gateway configuration missing");

      if (!window.Razorpay) {
        showError("Payment gateway (Razorpay) failed to initialize");
        return;
      }

      const rzp = new window.Razorpay({
        key,
        amount: order.amount * 100,
        currency: "INR",
        order_id: order.orderId,
        name: "Admin Wallet Top-up",
        description: `Recharge for ${v} credits`,
        prefill: {
           name: "Admin User",
        },
        theme: { color: "#6366F1" },
        handler: async (response) => {
          try {
            const verify = await walletAPI.verifyRecharge(response);
            if (!verify?.success) throw new Error(verify?.error || "Payment verification failed");
            showSuccess(`Wallet successfully credited with ₹${v}`);
            setAmount("");
            await refresh(true);
          } catch (e) {
            showError(e?.message || "Verification failed. Contact support.");
          }
        },
      });
      rzp.open();
    } catch (e) {
      showError(e?.message || "Payment request failed");
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-500 font-medium">Loading Wallet...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-[#F8FAFC] overflow-hidden flex flex-col">

      {/* Header */}
      <div className="px-6 md:px-8 pt-4 md:pt-6 pb-6 shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              <Wallet className="h-7 w-7 text-indigo-600" />
              Wallet & Billing
            </h1>
            <p className="text-slate-500 text-sm mt-1">Manage your funds and view transaction history</p>
          </div>
          <button 
            onClick={() => refresh(true)}
            disabled={refreshing}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center w-fit"
          >
            <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Main Balance Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50 rounded-full -mr-24 -mt-24 opacity-20 group-hover:scale-110 transition-transform duration-500" />
            <div className="relative z-10">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-indigo-500 mb-2 block">Available Credits</span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-slate-900">₹{wallet?.walletBalance?.toLocaleString() ?? 0}</span>
                <span className="text-slate-400 font-bold text-xs tracking-tighter">INR</span>
              </div>
              <div className="mt-4 flex items-center gap-3 text-slate-500">
                <div className="p-1.5 bg-slate-50 rounded-md">
                  <History className="h-3.5 w-3.5" />
                </div>
                <span className="text-[10px] font-semibold">Base cost: ₹{wallet?.costPerCard ?? 0} / card</span>
              </div>
            </div>
          </div>

          {/* Quick Recharge Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-center">
            <p className="text-[12px] font-bold text-slate-400 uppercase mb-3 tracking-tight">Quick Top-up</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {QUICK_AMOUNTS.map(amt => (
                <button 
                  key={amt}
                  onClick={() => setAmount(amt.toString())}
                  className="px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[16px] font-bold text-slate-600 hover:border-indigo-600 hover:text-indigo-600 transition-all"
                >
                  +₹{amt}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[14px]">₹</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Amount"
                  className="w-full pl-6 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-[14px] font-bold focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                />
              </div>
              <button
                onClick={startRecharge}
                className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-[14px] font-semibold hover:bg-slate-900 transition-all flex items-center gap-2 shadow-sm"
              >
                Top Up <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Section - The only scrollable part */}
      <div className="flex-1 min-h-0 px-6 md:px-8 pb-8 flex flex-col">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col h-full overflow-hidden">
          <div className="p-5 border-b border-slate-50 flex items-center justify-between shrink-0">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <History className="h-4 w-4 text-slate-400" />
              Activity
            </h2>
            <span className="text-[10px] font-semibold bg-slate-100 px-2 py-1 rounded-md text-slate-500">RECENT</span>
          </div>
          
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50 reseller-scrollbar pr-1">
            {(wallet?.transactions || []).length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center gap-3">
                <div className="p-4 bg-slate-50 rounded-full text-slate-300">
                  <CreditCard className="h-8 w-8" />
                </div>
                <p className="text-sm font-bold text-slate-400">No transactions recorded yet</p>
              </div>
            ) : (
              wallet.transactions.map((t, idx) => (
                <div key={idx} className="p-4 hover:bg-slate-50/50 transition-colors group cursor-default">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                       <div className={`p-1.5 rounded-lg ${t.type === 'credit' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                         {t.type === 'credit' ? <ArrowDownLeft className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
                       </div>
                       <span className="text-sm font-semibold text-slate-700 capitalize">{t.reason ? t.reason.replace(/_/g, ' ') : t.type}</span>
                    </div>
                    <span className={`text-sm font-bold ${t.type === 'credit' ? 'text-emerald-600' : 'text-slate-900'}`}>
                      {t.type === 'credit' ? '+' : '-'}₹{t.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                     <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
                        <Clock className="h-3 w-3" />
                        {t.createdAt ? new Date(t.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "N/A"}
                     </div>
                     <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter ${
                       t.status === 'success' || t.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 
                       t.status === 'failed' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                     }`}>
                       {t.status || "Completed"}
                     </span>
                  </div>
                </div>
              ))
            )}
            <div className="p-4 text-center">
              <span className="text-[10px] text-slate-400 font-bold">End of history</span>
            </div>
          </div>
        </div>
      </div>
    </div>


  );
}


