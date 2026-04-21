import React, { useEffect, useState, useMemo } from "react";
import { 
  Wallet, Users, CreditCard, TrendingUp, Activity, 
  PieChart as PieChartIcon, BarChart3, Clock, 
  ArrowUpRight, ArrowDownLeft, ChevronRight
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend, ComposedChart, Line
} from "recharts";
import { resellerAPI } from "../api/reseller";
import { walletAPI } from "../api/wallet";
import { useToast } from "../contexts/ToastContext";

const COLORS = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

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

  const chartData = useMemo(() => {
    if (!wallet?.transactions || wallet.transactions.length === 0) {
      return { balanceTrend: [], typeStats: [], dailyActivity: [] };
    }

    const txs = [...wallet.transactions].filter(t => t.status === "success" || t.status === "Completed");
    txs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    let currentBalance = wallet.walletBalance || 0;
    const dailyBalances = new Map();

    // Map to store latest balance for each date (working backwards)
    // The first time we see a date, it holds the final balance for that day.
    dailyBalances.set("Today", currentBalance);

    txs.forEach((tx) => {
      const date = new Date(tx.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" });
      
      // If we haven't recorded a balance for this day yet, the current 'currentBalance'
      // represents the state of the wallet at the END of this day's activity.
      if (!dailyBalances.has(date)) {
        dailyBalances.set(date, currentBalance);
      }

      // Roll back internal state to get the previous balance
      if (tx.type === "credit") currentBalance -= tx.amount;
      else if (tx.type === "debit") currentBalance += tx.amount;
    });

    // Convert Map to array and reverse to chronological
    const balanceTrend = Array.from(dailyBalances.entries())
      .map(([date, balance]) => ({ date, balance }))
      .reverse()
      .slice(-10);

    // 2. Type Stats
    const reasons = {};
    txs.forEach(tx => {
      const r = tx.reason ? tx.reason.replace(/_/g, ' ') : "Other";
      reasons[r] = (reasons[r] || 0) + tx.amount;
    });
    const typeStats = Object.entries(reasons).map(([name, value]) => ({ name, value }));

    // 3. Daily Activity
    const dailyMap = {};
    txs.forEach(tx => {
      const date = new Date(tx.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" });
      if (!dailyMap[date]) dailyMap[date] = { date, credit: 0, debit: 0 };
      if (tx.type === "credit") dailyMap[date].credit += tx.amount;
      else dailyMap[date].debit += tx.amount;
    });
    const dailyActivity = Object.values(dailyMap).reverse().slice(-7);

    return { balanceTrend, typeStats, dailyActivity };
  }, [wallet]);


  const summaryCards = [
    {
      title: "Wallet Balance",
      value: `₹${wallet?.walletBalance?.toLocaleString() ?? stats?.walletBalance?.toLocaleString() ?? 0}`,
      sub: `Unit Cost: ₹${wallet?.costPerCard ?? stats?.costPerCard ?? 0}`,
      icon: Wallet,
      color: "indigo",
      action: () => onNavigate?.("resellerWallet"),
      btn: "Recharge",
      trend: "+12.5%",
      isPositive: true
    },
    {
      title: "Managed Users",
      value: stats?.usersCount ?? 0,
      sub: "Active accounts",
      icon: Users,
      color: "emerald",
      action: () => onNavigate?.("resellerUsers"),
      btn: "Manage",
      trend: "+3",
      isPositive: true
    },
    {
      title: "Total Cards",
      value: stats?.cardsCount ?? 0,
      sub: "Generated templates",
      icon: CreditCard,
      color: "amber",
      action: () => onNavigate?.("resellerUsers"),
      btn: "Generate",
      trend: "+8",
      isPositive: true
    }
  ];

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-500 font-medium">Syncing Analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 bg-[#F8FAFC] min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Business Overview</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <p className="text-slate-500 text-sm font-medium">System operational • Last sync: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
            <Clock className="h-4 w-4" /> History
          </button> */}
          <button 
            onClick={() => onNavigate?.("resellerWallet")}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 flex items-center gap-2"
          >
            Add Funds <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {summaryCards.map((card, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 group">
            <div className="flex justify-between items-start">
              <div className={`p-3 rounded-xl bg-${card.color}-50 text-${card.color}-600 group-hover:scale-110 transition-transform`}>
                <card.icon className="h-5 w-5" />
              </div>
              {/* <div className={`flex items-center gap-1 text-xs font-bold ${card.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                {card.isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownLeft className="h-3 w-3" />}
                {card.trend}
              </div> */}
            </div>
            <div className="mt-5">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{card.title}</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{card.value}</h3>
              <p className="text-slate-400 text-sm mt-1">{card.sub}</p>
            </div>
            {/* <div className="mt-5 pt-4 border-t border-slate-50 flex justify-between items-center">
               <button 
                onClick={card.action}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 underline decoration-indigo-200 underline-offset-4"
               >
                 {card.btn} Account
               </button>
               <ChevronRight className="h-4 w-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
            </div> */}
          </div>
        ))}
      </div>

      {/* Primary Graphs Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Wallet Trend - 2/3 width */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Wallet Performance</h4>
                <p className="text-xs text-slate-400">Balance history over recent transactions</p>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-slate-50 text-slate-500 text-[10px] font-bold rounded-lg border border-slate-100">REAL-TIME</span>
            </div>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.balanceTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#94A3B8', fontWeight: 600}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#94A3B8'}} tickFormatter={(v) => `₹${v}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '12px', padding: '12px' }}
                  itemStyle={{ color: '#F8FAFC', fontSize: '12px', fontWeight: 'bold' }}
                  labelStyle={{ color: '#94A3B8', fontSize: '10px', marginBottom: '4px', fontWeight: 'bold' }}
                  formatter={(value) => [`₹${value.toLocaleString()}`, "Balance"]}
                />
                <Area 
                  type="monotone" 
                  dataKey="balance" 
                  stroke="#6366F1" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#trendGradient)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Spend Distribution - 1/3 width */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-amber-50 rounded-lg">
              <PieChartIcon className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900">Allocation</h4>
              <p className="text-xs text-slate-400">Spending by category</p>
            </div>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="h-[220px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.typeStats.length ? chartData.typeStats : [{name: 'No Volume', value: 1}]}
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.typeStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                    {!chartData.typeStats.length && <Cell fill="#F1F5F9" />}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => `₹${value.toLocaleString()}`}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Total Volume</span>
                <span className="text-xl font-black text-slate-900">₹{chartData.typeStats.reduce((a,b) => a+b.value, 0).toLocaleString()}</span>
              </div>
            </div>
            <div className="mt-8 w-full space-y-3">
              {chartData.typeStats.slice(0, 3).map((stat, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}} />
                    <span className="text-sm font-semibold text-slate-600 capitalize">{stat.name}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">₹{stat.value.toLocaleString()}</span>
                </div>
              ))}
              {chartData.typeStats.length === 0 && (
                <p className="text-center text-slate-400 text-xs italic">No transaction data available</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Chart & Metric Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Activity - Grouped Bar */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
           <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Daily Activity</h4>
                <p className="text-xs text-slate-400">Income vs Spending (last active days)</p>
              </div>
            </div>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.dailyActivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F8FAFC" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#64748B', fontWeight: 600}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94A3B8'}} tickFormatter={(v) => `₹${v}`} />
                <Tooltip 
                   cursor={{fill: '#F8FAFC'}}
                   contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 'bold' }} />
                <Bar name="Credits (+)" dataKey="credit" fill="#10B981" radius={[6, 6, 0, 0]} barSize={24} />
                <Bar name="Spending (-)" dataKey="debit" fill="#F43F5E" radius={[6, 6, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Growth & Efficiency */}
        <div className="bg-indigo-600 rounded-2xl p-8 border border-indigo-700 shadow-lg shadow-indigo-100 text-white flex flex-col justify-between">
           <div>
              <div className="flex items-center gap-2 text-indigo-200 uppercase text-[10px] font-black tracking-[0.2em] mb-4">
                <Activity className="h-4 w-4" /> Reseller Score
              </div>
              <h2 className="text-4xl font-black mb-2">92%</h2>
              <p className="text-indigo-100 text-sm opacity-80 leading-relaxed font-medium">Your business health is excellent. Continue generating cards to maintain your reseller tier.</p>
           </div>
           
           <div className="space-y-6 mt-8">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-indigo-100">
                  <span>Card Utilization</span>
                  <span>{stats?.usersCount ? (stats.cardsCount / stats.usersCount).toFixed(1) : 0} avg</span>
                </div>
                <div className="h-2 bg-indigo-500/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white rounded-full" 
                    style={{ width: `${Math.min(100, (stats?.cardsCount / (stats?.usersCount || 1)) * 30)}%` }} 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div className="p-4 bg-indigo-500/20 rounded-xl border border-indigo-400/20">
                    <p className="text-[10px] uppercase font-bold text-indigo-200">User Growth</p>
                    <p className="text-lg font-black mt-1">High</p>
                 </div>
                 <div className="p-4 bg-indigo-500/20 rounded-xl border border-indigo-400/20">
                    <p className="text-[10px] uppercase font-bold text-indigo-200">Retention</p>
                    <p className="text-lg font-black mt-1">Stable</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}



