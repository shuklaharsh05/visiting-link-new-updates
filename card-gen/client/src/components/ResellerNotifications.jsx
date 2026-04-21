import React, { useEffect, useState, useMemo } from "react";
import { 
  Bell, History, MessageSquare, Info, Shield, 
  ChevronRight, Clock, Trash2, CheckCircle2, 
  ArrowDownLeft, ArrowUpRight, User, Layout
} from "lucide-react";
import { walletAPI } from "../api/wallet";
import * as inquiryAPI from "../api/inquiries";
import { useToast } from "../contexts/ToastContext";

export default function ResellerNotifications() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ wallet: null, inquiries: [] });
  const { error: showError } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [walletRes, inquiriesRes] = await Promise.all([
        walletAPI.getMyWallet().catch(() => null),
        inquiryAPI.getAllInquiries({ limit: 10 }).catch(() => [])
      ]);
      setData({
        wallet: walletRes?.data || null,
        inquiries: inquiriesRes || []
      });
    } catch (e) {
      showError("Failed to fetch notification data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const notifications = useMemo(() => {
    const list = [];

    // 1. Alert: Low Balance
    if (data.wallet && data.wallet.walletBalance < 1000) {
      list.push({
        id: "low-balance",
        type: "alert",
        title: "Wallet balance is low",
        message: `Your balance (₹${data.wallet.walletBalance}) is low. Top up to avoid interruption in card creation.`,
        time: "Action required",
        icon: Info,
        color: "text-amber-600",
        bg: "bg-amber-50"
      });
    }

    // 2. Wallet Transactions (Last 5)
    if (data.wallet?.transactions) {
      data.wallet.transactions.slice(0, 5).forEach((t, i) => {
        const isCredit = t.type === "credit";
        const isProcessing = t.status && !['success', 'Completed'].includes(t.status);
        
        list.push({
          id: `tx-${i}`,
          type: isCredit ? (isProcessing ? "processing" : "success") : "wallet",
          title: isCredit 
            ? (isProcessing ? "Recharge Processing" : "Funds Added") 
            : "Wallet Deduction",
          message: isProcessing 
            ? `Your recharge of ₹${t.amount} is currently being processed.`
            : `${isCredit ? "Received" : "Spent"} ₹${t.amount} for ${t.reason?.replace(/_/g, ' ') || 'transaction'}.`,
          time: t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "Recently",
          icon: isProcessing ? Clock : (isCredit ? ArrowDownLeft : ArrowUpRight),
          color: isProcessing ? "text-amber-500" : (isCredit ? "text-emerald-600" : "text-slate-600"),
          bg: isProcessing ? "bg-amber-50" : (isCredit ? "bg-emerald-50" : "bg-slate-50")
        });
      });
    }

    // 3. New Inquiries (Last 5)
    if (data.inquiries) {
      data.inquiries.slice(0, 5).forEach((inq, i) => {
        list.push({
          id: `inq-${i}`,
          type: "lead",
          title: "New Inquiry Received",
          message: `Lead from ${inq.name} (${inq.businessType || 'General'}) regarding design services.`,
          time: inq.createdAt ? new Date(inq.createdAt).toLocaleDateString() : "Just now",
          icon: MessageSquare,
          color: "text-indigo-600",
          bg: "bg-indigo-50"
        });
      });
    }

    // Sort by type priority or just return
    return list;
  }, [data]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-500 font-medium">Fetching updates...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 bg-[#F8FAFC] min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Bell className="h-7 w-7 text-indigo-600" />
            Notification Center
          </h1>
          <p className="text-slate-500 text-sm mt-1">Real-time alerts for your wallet, leads, and account activity</p>
        </div>
        <div className="flex items-center gap-3">
           <button onClick={fetchData} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 text-xs font-bold hover:bg-slate-50 transition-all">
             Refresh Feed
           </button>
        </div>
      </div>

      <div className="max-w-4xl">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-50">
            {notifications.length === 0 ? (
              <div className="p-20 text-center flex flex-col items-center gap-4">
                <div className="p-5 bg-slate-50 rounded-full text-slate-300">
                  <Bell className="h-10 w-10" />
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900">All caught up!</p>
                  <p className="text-sm text-slate-400 mt-1">Check back later for new updates and leads.</p>
                </div>
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="p-6 hover:bg-slate-50/80 transition-all group flex items-start gap-5 border-l-4 border-transparent hover:border-indigo-600">
                  <div className={`p-3 rounded-2xl ${n.bg} ${n.color} group-hover:scale-110 transition-transform shadow-sm`}>
                     <n.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight truncate">
                        {n.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none shrink-0">
                         <Clock className="h-3.5 w-3.5" /> {n.time}
                      </div>
                    </div>
                    <p className="text-slate-500 text-sm mt-2 leading-relaxed font-medium pr-4">
                      {n.message}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
           <div className="p-6 bg-indigo-600 rounded-3xl text-white shadow-lg shadow-indigo-100 flex flex-col justify-between h-40">
              <Layout className="h-8 w-8 opacity-20" />
              <div>
                <p className="text-xs font-bold text-indigo-100 uppercase tracking-widest">Leads Dashboard</p>
                <div className="flex items-center justify-between mt-1">
                  <h3 className="text-2xl font-semibold">{data.inquiries?.length || 0} Total leads</h3>
                  <ChevronRight className="h-5 w-5" />
                </div>
              </div>
           </div>
           <div className="p-6 bg-slate-900 rounded-3xl text-white shadow-lg shadow-slate-100 flex flex-col justify-between h-40">
              <User className="h-8 w-8 opacity-20" />
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Account Health</p>
                <div className="flex items-center justify-between mt-1">
                  <h3 className="text-2xl font-semibold">{data.wallet?.walletBalance < 1000 ? 'Needs Attention' : 'Excellent'}</h3>
                  <ChevronRight className="h-5 w-5" />
                </div>
              </div>
           </div>
        </div> */}
      </div>
    </div>
  );
}

