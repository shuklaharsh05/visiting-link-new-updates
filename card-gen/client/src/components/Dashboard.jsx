import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  CreditCard,
  Building2,
  TrendingUp,
  Calendar,
  Activity,
  Eye,
  Plus,
  Settings,
  Database,
  UserCircle,
} from 'lucide-react';
import { getCategories } from '../api/categories';
import { getAllCardsDebug } from '../api/cards';
import { getAllInquiries } from '../api/inquiries';
import { getAllUsers } from '../api/users';
import { resellerAPI } from '../api/reseller';
import { useToast } from '../contexts/ToastContext';

const Dashboard = ({ onNavigate }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    categories: 0,
    cards: 0,
    users: 0,
    amount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalRows, setModalRows] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const { success: showSuccess, error: showError } = useToast();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);

      try {
        const [
          topStatsRes,
          cardsResponse,
          inquiriesRes,
          usersRes,
        ] = await Promise.all([
          resellerAPI.getDashboardStats(),
          getAllCardsDebug().catch(() => ({ cards: [] })),
          // Load first page of inquiries with pagination metadata
          getAllInquiries({ page: 1, limit: 50, raw: true }).catch(() => null),
          // Load just enough users to get total count
          getAllUsers({ page: 1, limit: 1, raw: true }).catch(() => null),
        ]);

        const inquiriesData = inquiriesRes
          ? Array.isArray(inquiriesRes.data)
            ? inquiriesRes.data
            : inquiriesRes.data?.inquiries || inquiriesRes.data || []
          : [];
        const top = topStatsRes?.data || {};

        setStats({
          categories: Number(top.totalCategories || 0),
          cards: Number(top.totalCards || 0),
          users: Number(top.totalUsers || 0),
          amount: Number(top.totalAmount || 0),
        });

        // Build recent activity (submissions + generated cards)
        const inquiryItems = inquiriesData.slice(0, 10).map((inq) => ({
          id: inq._id,
          type: 'submission',
          action: `New submission from ${inq.name || inq.email || 'Unknown'
            }`,
          time: inq.createdAt,
          admin: inq.assignedTo || 'Unassigned',
        }));

        const cardArray = Array.isArray(cardsResponse)
          ? cardsResponse
          : cardsResponse?.cards || cardsResponse || [];
        const cardItems = cardArray.slice(0, 10).map((card) => {
          const data = card.data || {};
          const title = data.storeName || data.companyName || data.customCardData?.companyName || card.title || 'Card';
          const assigned = card.clientId?.assignedTo || 'Unassigned';
          return {
            id: card._id,
            type: 'generation',
            action: `Business card generated for ${title}`,
            time: card.createdAt || card.updatedAt,
            admin: assigned
          };
        });

        const combined = [...inquiryItems, ...cardItems]
          .filter(it => it.time)
          .sort((a, b) => new Date(b.time) - new Date(a.time))
          .slice(0, 12);
        setActivity(combined);
      } catch (apiError) {
        // Fallback to previous local counting to keep UX intact if new API fails
        const [categoriesResponse, cardsResponse, usersRes] = await Promise.all([
          getCategories().catch(() => ({ data: [] })),
          getAllCardsDebug().catch(() => ({ cards: [] })),
          getAllUsers({ page: 1, limit: 1, raw: true }).catch(() => null),
        ]);
        const categories = categoriesResponse.data || categoriesResponse || [];
        const cardsCount = Array.isArray(cardsResponse)
          ? cardsResponse.length
          : cardsResponse?.cards?.length || cardsResponse?.length || 0;
        const usersData = usersRes?.data?.users || usersRes?.users || [];
        const usersCount =
          usersRes?.data?.pagination?.totalUsers ??
          usersRes?.pagination?.totalUsers ??
          usersData.length;
        setStats({
          categories: categories.length || 0,
          cards: cardsCount || 0,
          users: usersCount || 0,
          amount: 0,
        });
      }
    } catch (error) {
      // console.error('Dashboard: Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const currency = (v) =>
    `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  const openBreakdownModal = async (key, title) => {
    if (key === 'categories') return;
    setModalOpen(true);
    setModalTitle(title);
    setModalRows([]);
    setModalLoading(true);
    try {
      let res;
      if (key === 'cards') {
        res = await resellerAPI.getCardsBreakdown();
        const d = res?.data || {};
        setModalRows([
          { label: 'Admin Cards', value: Number(d.byAdmin || 0) },
          { label: 'User Cards (Self-created)', value: Number(d.byUser || 0) },
          { label: 'Superadmin Cards', value: Number(d.bySuperadmin || 0) },
          { label: 'Total Cards', value: Number(d.totalCards || 0), strong: true },
        ]);
      } else if (key === 'users') {
        res = await resellerAPI.getUsersBreakdown();
        const d = res?.data || {};
        setModalRows([
          { label: 'Users by Admins', value: Number(d.createdByAdmins || 0) },
          { label: 'Direct Signups', value: Number(d.directUsers || 0) },
          { label: 'Users by Superadmin', value: Number(d.createdBySuperadmin || 0) },
          { label: 'Total Users', value: Number(d.totalUsers || 0), strong: true },
        ]);
      } else if (key === 'amount') {
        res = await resellerAPI.getRevenueBreakdown();
        const d = res?.data || {};
        setModalRows([
          { label: 'Wallet Recharge Total', value: currency(d.walletRechargeTotal), money: true },
          { label: 'User Payment Total', value: currency(d.userPaymentTotal), money: true },
          { label: 'Total Amount', value: currency(d.totalAmount), money: true, strong: true },
        ]);
      }
    } catch (e) {
      showError(e?.error || e?.message || 'Failed to load breakdown');
      setModalRows([]);
    } finally {
      setModalLoading(false);
    }
  };

  const statsData = [
    {
      key: 'categories',
      title: 'Total Categories',
      value: stats.categories,
      icon: Database,
      color: 'blue'
    },
    {
      key: 'cards',
      title: 'Total Cards',
      value: stats.cards,
      icon: CreditCard,
      color: 'purple'
    },
    {
      key: 'users',
      title: 'Total Users',
      value: stats.users,
      icon: Users,
      color: 'orange'
    },
    {
      key: 'amount',
      title: 'Total Amount',
      value: currency(stats.amount),
      icon: TrendingUp,
      color: 'green'
    }
  ];

  const formatTime = (iso) => {
    try {
      const d = new Date(iso);
      const diff = (Date.now() - d.getTime()) / 1000;
      if (diff < 60) return `${Math.floor(diff)}s ago`;
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      return d.toLocaleString();
    } catch {
      return '';
    }
  };

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-700 border-blue-200',
      green: 'bg-green-50 text-green-700 border-green-200',
      purple: 'bg-purple-50 text-purple-700 border-purple-200',
      orange: 'bg-orange-50 text-orange-700 border-orange-200',
    };
    return colors[color] || colors.blue;
  };

  const getIconBgColor = (color) => {
    const colors = {
      blue: 'bg-blue-100',
      green: 'bg-green-100',
      purple: 'bg-purple-100',
      orange: 'bg-orange-100',
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="p-6 space-y-6 h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your business cards.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/user-details')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 border border-gray-300 transition-colors"
          >
            <UserCircle className="h-4 w-4" />
            <span>View users details</span>
          </button>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
              </div>
              <div>
                <div className="w-24 h-4 bg-gray-200 rounded mb-2"></div>
                <div className="w-16 h-8 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))
        ) : (
          statsData.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <button
                key={index}
                type="button"
                onClick={() => openBreakdownModal(stat.key, stat.title)}
                className="text-left bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow w-full"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${getIconBgColor(stat.color)}`}>
                    <Icon className={`h-6 w-6 ${stat.color === 'blue' ? 'text-blue-600' : stat.color === 'green' ? 'text-green-600' : stat.color === 'purple' ? 'text-purple-600' : 'text-orange-600'}`} />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-1">{stat.title}</h3>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </button>
            );
          })
        )}
      </div>

      <div className="">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            </div>
          </div>
          <div className="p-6 h-[58vh] overflow-y-auto">
            <div className="space-y-4">
              {activity.map((item) => (
                <div key={`${item.type}-${item.id}`} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${item.type === 'submission' ? 'bg-blue-500' :
                        item.type === 'generation' ? 'bg-green-500' :
                          'bg-orange-500'
                      }`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.action}</p>
                      <p className="text-xs text-gray-500">{formatTime(item.time)}</p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600">{item.admin}</div>
                </div>
              ))}
              {(!loading && activity.length === 0) && (
                <div className="text-sm text-gray-500">No recent activity</div>
              )}
            </div>
          </div>
        </div>

      </div>

      {modalOpen && (
        <div className="fixed inset-0 !mt-0 z-[9998] flex items-center justify-center p-4 bg-black/50">
          <div
            className="absolute inset-0"
            onClick={() => setModalOpen(false)}
            aria-hidden
          />
          <div className="relative bg-white w-full max-w-md rounded-xl shadow-xl border border-gray-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">{modalTitle} Breakdown</h3>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setModalOpen(false)}
                type="button"
              >
                ✕
              </button>
            </div>
            <div className="p-5">
              {modalLoading ? (
                <div className="text-sm text-gray-500">Loading breakdown...</div>
              ) : modalRows.length === 0 ? (
                <div className="text-sm text-gray-500">No data available.</div>
              ) : (
                <div className="space-y-2">
                  {modalRows.map((row, i) => (
                    <div
                      key={`${row.label}-${i}`}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg ${row.strong ? 'bg-gray-100 font-semibold' : 'bg-gray-50'}`}
                    >
                      <span className="text-sm text-gray-700">{row.label}</span>
                      <span className="text-sm text-gray-900">{row.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;