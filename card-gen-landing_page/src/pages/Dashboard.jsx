import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { apiService } from '../lib/api.js';
import { CreditCard, Calendar, Users, Share2, Heart, Download } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userName, setUserName] = useState('User');
  const [cards, setCards] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState('');
  const [statsLoading, setStatsLoading] = useState(false);
  const [stats, setStats] = useState({
    cardAppointments: 0,
    hasCard: false,
    cardViews: 0,
    cardShares: 0,
    cardLikes: 0,
    cardDownloads: 0,
    cardData: null,
  });
  const [loading, setLoading] = useState(true);

  const SELECTED_CARD_STORAGE_KEY = 'dashboard_selected_card_id';

  const getCardLabel = (card) => {
    if (!card) return 'Card';
    const name =
      card.name ||
      card.data?.CompanyName ||
      card.data?.companyName ||
      card.data?.storeName ||
      card.data?.name ||
      '';
    if (name && String(name).trim()) return String(name).trim();
    return card.templateId || card.categoryId || 'Untitled card';
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      // If user has no inquiries, send them to My Card to submit one (no need to fetch)
      // if (!user.inquiries || !Array.isArray(user.inquiries) || user.inquiries.length === 0) {
      //   setLoading(false);
      //   navigate('/my-card', { replace: true });
      //   return;
      // }

      console.log('Dashboard - User object:', user);
      console.log('Dashboard - User ID:', user._id);

      // Fetch user name (keep existing behavior)
      try {
        const userResponse = await apiService.getUserById(user._id);
        if (userResponse.success && userResponse.data) {
          setUserName(userResponse.data.name || 'User');
        } else {
          setUserName(user.name || 'User');
        }
      } catch {
        setUserName(user.name || 'User');
      }

      // Load all cards for selector
      const myCardsRes = await apiService.getMyCards();
      const list = myCardsRes.success && Array.isArray(myCardsRes.data) ? myCardsRes.data : [];
      setCards(list);

      const stored = localStorage.getItem(SELECTED_CARD_STORAGE_KEY) || '';
      const storedOk = stored && list.some((c) => String(c._id) === String(stored));
      const initial = storedOk ? stored : (list[0]?._id || '');
      setSelectedCardId(initial);

      setLoading(false);
    };

    fetchData();
  }, [user]);

  useEffect(() => {
    let cancelled = false;

    const fetchStatsForCard = async (cardId) => {
      if (!cardId) {
        setStats({
          cardAppointments: 0,
          hasCard: false,
          cardViews: 0,
          cardShares: 0,
          cardLikes: 0,
          cardDownloads: 0,
          cardData: null,
        });
        return;
      }

      setStatsLoading(true);
      try {
        localStorage.setItem(SELECTED_CARD_STORAGE_KEY, String(cardId));

        const cardResponse = await apiService.getCardById(cardId);
        const cardStatsSource = cardResponse.success ? (cardResponse.data?.card || cardResponse.data) : null;

        const cardViews = cardStatsSource?.views ?? cardStatsSource?.totalViews ?? 0;
        const cardShares = cardStatsSource?.shares ?? cardStatsSource?.totalShares ?? 0;
        const cardLikes = cardStatsSource?.likes ?? cardStatsSource?.totalLikes ?? 0;
        const cardDownloads = cardStatsSource?.downloads ?? cardStatsSource?.totalDownloads ?? 0;

        const appointmentsResponse = await apiService.getCardAppointments(cardId, {
          page: 1,
          limit: 1000,
        });
        let cardAppointments = 0;
        if (appointmentsResponse.success && appointmentsResponse.data) {
          if (appointmentsResponse.data.appointments) {
            cardAppointments = appointmentsResponse.data.appointments.length;
          } else if (Array.isArray(appointmentsResponse.data)) {
            cardAppointments = appointmentsResponse.data.length;
          }
        }

        if (cancelled) return;
        setStats({
          cardAppointments,
          hasCard: true,
          cardViews,
          cardShares,
          cardLikes,
          cardDownloads,
          cardData: { id: cardId, data: cardResponse.data },
        });
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    };

    fetchStatsForCard(selectedCardId);
    return () => {
      cancelled = true;
    };
  }, [selectedCardId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto font-poppins px-4 sm:px-6 lg:px-8 mt-6">
      <div className="mb-8 flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Welcome back, {userName}!
          </h1>
          <p className="text-slate-600 text-lg">
            Here's an overview of your account
          </p>
        </div>

        <div className="flex flex-col lg:items-end gap-1">
          <label className="text-xs font-medium text-slate-500">Selected card</label>
          <select
            value={selectedCardId}
            onChange={(e) => setSelectedCardId(e.target.value)}
            className="min-w-[220px] max-w-[320px] w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={statsLoading || cards.length === 0}
          >
            {cards.length === 0 ? (
              <option value="">No cards yet</option>
            ) : (
              cards.map((c) => (
                <option key={c._id} value={c._id}>
                  {getCardLabel(c)}
                </option>
              ))
            )}
          </select>
          {statsLoading ? (
            <div className="text-[11px] text-slate-500">Loading card stats…</div>
          ) : null}
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${stats.hasCard
                ? 'bg-green-100 text-green-700'
                : 'bg-amber-100 text-amber-700'
                }`}
            >
              {stats.hasCard ? 'Active' : 'Not Created'}
            </span>
          </div>
          <h3 className="text-slate-600 text-sm font-medium mb-1">Business Card</h3>
          <p className="text-2xl font-bold text-slate-900">
            {cards.length}
          </p>
          {stats.hasCard && stats.cardData && (
            <p className="text-xs text-slate-500 mt-1">
              {(() => {
                const c = cards.find((x) => String(x._id) === String(selectedCardId));
                return c ? getCardLabel(c) : 'Active Card';
              })()}
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <h3 className="text-slate-600 text-sm font-medium mb-1">Card Appointments</h3>
          <p className="text-2xl font-bold text-slate-900">{stats.cardAppointments}</p>
          <p className="text-xs text-slate-500 mt-1">Appointments for your card</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <h3 className="text-slate-600 text-sm font-medium mb-1">Card Views</h3>
          <p className="text-2xl font-bold text-slate-900">{stats.cardViews}</p>
          <p className="text-xs text-slate-500 mt-1">Times your card was viewed</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Share2 className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
          <h3 className="text-slate-600 text-sm font-medium mb-1">Card Shares</h3>
          <p className="text-2xl font-bold text-slate-900">{stats.cardShares}</p>
          <p className="text-xs text-slate-500 mt-1">Times your card link was shared</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-rose-100 rounded-lg flex items-center justify-center">
              <Heart className="w-6 h-6 text-rose-600" />
            </div>
          </div>
          <h3 className="text-slate-600 text-sm font-medium mb-1">Card Likes</h3>
          <p className="text-2xl font-bold text-slate-900">{stats.cardLikes}</p>
          <p className="text-xs text-slate-500 mt-1">People who liked your card</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Download className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <h3 className="text-slate-600 text-sm font-medium mb-1">Contact Downloads</h3>
          <p className="text-2xl font-bold text-slate-900">{stats.cardDownloads}</p>
          <p className="text-xs text-slate-500 mt-1">Downloads of your contact</p>
        </div>
      </div>

    </div>
  );
}
