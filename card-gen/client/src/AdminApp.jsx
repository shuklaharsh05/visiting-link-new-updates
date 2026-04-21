import { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';
import BusinessDirectory from './components/BusinessDirectory';
import CardGenerator from './components/CardGenerator';
import AdminManagement from './components/AdminManagement';
import CouponManagement from './components/CouponManagement';
import CalendarBoard from './components/CalendarBoard';
import CreateUser from './components/CreateUser';
import Sidebar from './components/Sidebar';
import ResellerDashboard from './components/ResellerDashboard';
import ResellerUsers from './components/ResellerUsers';
import ResellerWallet from './components/ResellerWallet';
import ResellerNotifications from './components/ResellerNotifications';
import { 
  Wallet, 
  MessageSquare, 
  Bell, 
  ChevronDown, 
  Search, 
  Plus, 
  LayoutGrid, 
  List, 
  User, 
  LogOut,
  ChevronRight,
  Clock
} from 'lucide-react';
import { getAuthData, clearAuthData } from './api/auth';
import { walletAPI } from './api/wallet';
import { getAllInquiries } from './api/inquiries';
import { useToast } from './contexts/ToastContext';

// Admin Panel App - separate from website
const AdminApp = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [inquiryId, setInquiryId] = useState(undefined);
  const [generatedCardId, setGeneratedCardId] = useState(undefined);
  const [resellerTargetUserId, setResellerTargetUserId] = useState(undefined);
  const [resellerEditCardId, setResellerEditCardId] = useState(undefined);

  const [walletBalance, setWalletBalance] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [activeTab, setActiveTab] = useState('today');

  useEffect(() => {
    const authData = getAuthData();
    if (authData?.isAuthenticated) {
      setIsAuthenticated(true);
      if (authData?.user?.role === 'admin') {
        fetchWallet();
      }
    }
  }, []);

  const fetchWallet = async () => {
    try {
      const res = await walletAPI.getMyWallet();
      setWalletBalance(res?.data?.walletBalance || 0);
    } catch (e) {
      console.error('Failed to fetch wallet:', e);
    }
  };

  const [unreadCount, setUnreadCount] = useState(0);
  const { success: showSuccess } = useToast();

  const checkNotifications = async () => {
    try {
      const auth = getAuthData();
      if (!auth?.isAuthenticated) return;

      const [inquiries, wallet] = await Promise.all([
        getAllInquiries({ limit: 1 }).catch(() => []),
        auth?.user?.role === 'admin' ? walletAPI.getMyWallet().catch(() => null) : null
      ]);

      const latestInquiry = enquiries[0];
      const latestNotificationId = latestInquiry?._id;
      const storedLastId = localStorage.getItem('lastNotificationId');

      if (latestNotificationId && latestNotificationId !== storedLastId) {
        if (storedLastId) {
          showSuccess("New Inquiry Received!");
          setUnreadCount(prev => prev + 1);
        }
        localStorage.setItem('lastNotificationId', latestNotificationId);
      }
    } catch (e) {
      console.error("Polling error:", e);
    }
  };

  useEffect(() => {
    checkNotifications();
    const interval = setInterval(checkNotifications, 40000); // Poll every 40s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (currentPage === 'resellerNotifications') {
      setUnreadCount(0);
    }
  }, [currentPage]);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };
 
  const handleLogout = () => {
    clearAuthData();
    setIsAuthenticated(false);
    setCurrentPage('dashboard');
    setInquiryId(undefined);
    setGeneratedCardId(undefined);
    setResellerTargetUserId(undefined);
    setResellerEditCardId(undefined);
    localStorage.removeItem('lastNotificationId');
  };
 
  const handleGenerateCard = (inquiry, inquiryId, generatedCardId) => {
    console.log('AdminApp - handleGenerateCard called with:');
    console.log('  inquiryId:', inquiryId);
    console.log('  generatedCardId:', generatedCardId);
    setInquiryId(inquiryId);
    setGeneratedCardId(generatedCardId);
    setCurrentPage('generator');
  };
 
  const handleCardGenerated = (card) => {
    console.log('Card generated:', card);
    setGeneratedCardId(card._id);
    // Optionally navigate back to directory or show success message
  };
 
  const handleBackToDirectory = () => {
    setCurrentPage('directory');
    setInquiryId(undefined);
    setGeneratedCardId(undefined);
  };
 
  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />;
  }
 
  const authData = getAuthData();
  const userRole = authData?.user?.role || (authData?.isAdmin ? 'admin' : 'user');
  
  // Debug logging
  console.log('AdminApp - Auth Data:', authData);
  console.log('AdminApp - User Role:', userRole);
 
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return userRole === 'superadmin' ? <Dashboard onNavigate={setCurrentPage} /> : <ResellerDashboard onNavigate={setCurrentPage} />;
      case 'directory':
        return <BusinessDirectory onEditCard={handleGenerateCard} searchTerm={searchTerm} />;
      case 'resellerNotifications':
        return <ResellerNotifications />;
      case 'resellerDashboard':
        return <ResellerDashboard onNavigate={setCurrentPage} />;
      case 'resellerUsers':
        return (
          <ResellerUsers
            searchTerm={searchTerm}
            viewMode={viewMode}
            onGenerateForUser={(u) => {
              setResellerTargetUserId(u?._id);
              setResellerEditCardId(undefined);
              setCurrentPage("resellerGenerate");
            }}
            onEditCardForUser={(u, cardId) => {
              setResellerTargetUserId(u?._id);
              setResellerEditCardId(cardId);
              setCurrentPage("resellerGenerate");
            }}
          />
        );
      case 'resellerWallet':
        return <ResellerWallet />;
      case 'resellerGenerate':
        return (
          <CardGenerator
            mode="reseller"
            targetUserId={resellerTargetUserId}
            editCardId={resellerEditCardId}
            onBack={() => setCurrentPage("resellerUsers")}
          />
        );
      case 'generator':
        return (
          <CardGenerator 
            inquiryId={inquiryId}
            onBack={handleBackToDirectory}
            onCardGenerated={handleCardGenerated}
          />
        );
      case 'createUser':
        return userRole === 'superadmin' ? <CreateUser onNavigateToDirectory={() => setCurrentPage('directory')} /> : <BusinessDirectory onEditCard={handleGenerateCard} />;
      case 'admins':
        return userRole === 'superadmin' ? <AdminManagement /> : <BusinessDirectory onEditCard={handleGenerateCard} />;
      case 'coupons':
        return userRole === 'superadmin' ? <CouponManagement /> : <BusinessDirectory onEditCard={handleGenerateCard} />;
      case 'calendar':
        return userRole === 'superadmin' ? <CalendarBoard /> : <BusinessDirectory onEditCard={handleGenerateCard} />;
      default:
        return userRole === 'superadmin' ? <Dashboard onNavigate={setCurrentPage} /> : <ResellerDashboard onNavigate={setCurrentPage} />;
    }
  };
 
  return (
    <div className="flex h-screen bg-[#f3f4f9] text-gray-800 font-sans">
      <Sidebar 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage}
        onLogout={handleLogout}
      />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Lavender Header Section */}
        <header className="px-6 pt-6 pb-2 shrink-0">
          <div className="bg-[#8B5CF6] rounded-[24px] px-4 py-5 flex items-center justify-between shadow-sm">
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Digital Businesses card
            </h1>
            
            <div className="flex items-center gap-6">
              {/* Wallet Info */}
              {userRole === 'admin' && (
                <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl flex items-center gap-3 border border-white/20">
                  <div className="bg-white p-1.5 rounded-lg shadow-sm">
                    <Wallet className="h-5 w-5 text-[#6348ef]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-white/80 font-medium uppercase tracking-wider leading-none mb-0.5">Balance</span>
                    <span className="text-white font-bold text-lg leading-none">₹{walletBalance}</span>
                  </div>
                </div>
              )}
 
              {/* Utility Icons */}
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setCurrentPage('resellerNotifications')}
                  className="p-2.5 bg-white/20 hover:bg-white/30 rounded-full transition-colors text-white relative"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#8B5CF6] animate-bounce-gentle">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Profile Section */}
              <div className="relative">
                <button 
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-3 bg-white/20 hover:bg-white/30 p-1.5 pr-4 rounded-full transition-all border border-white/10 group"
                >
                  <div className="relative">
                    <img 
                      src={authData?.user?.avatar || "https://ui-avatars.com/api/?name=" + (authData?.user?.name || "Admin") + "&background=6348ef&color=fff"} 
                      alt="Avatar" 
                      className="w-10 h-10 rounded-full border-2 border-white/50 object-cover"
                    />
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-lavender-300 rounded-full"></div>
                  </div>
                  <div className="flex flex-col items-start min-w-0">
                    <span className="text-white font-semibold text-sm leading-none mb-1 truncate w-full">
                      {authData?.user?.name || authData?.user?.username || 'Admin'}
                    </span>
                    <span className="text-white/70 text-[10px] truncate w-full">
                      {authData?.user?.email || authData?.user?.phone || 'admin@vcard.com'}
                    </span>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-white transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Profile Dropdown */}
                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)}></div>
                    <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in duration-200 text-gray-700">
                      <div className="p-4 border-b border-gray-50 flex items-center gap-3">
                        <img 
                          src={authData?.user?.avatar || "https://ui-avatars.com/api/?name=" + (authData?.user?.name || "Admin") + "&background=eee&color=6348ef"} 
                          alt="Avatar" 
                          className="w-10 h-10 rounded-full border border-gray-100"
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-sm truncate">
                            {authData?.user?.name || authData?.user?.username || 'Admin'}
                          </span>
                          <span className="text-[10px] text-gray-400 truncate">
                            {authData?.user?.email || authData?.user?.phone}
                          </span>
                        </div>
                      </div>
                      <div className="p-2">
                        <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium">
                          <User className="h-4 w-4 text-gray-400" />
                          My Profile
                        </button>
                        <button 
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-red-50 transition-colors text-sm font-medium text-red-600"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Action/Filter Bar Section */}
        <section className="px-6 py-2 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              className="flex items-center gap-3 bg-black hover:bg-gray-900 text-white px-6 py-3 rounded-full shadow-lg shadow-black/10 transition-all active:scale-95 group font-semibold text-sm"
              onClick={() => setCurrentPage('createUser')}
            >
              <div className="bg-white/20 rounded-full p-0.5">
                <Plus className="h-4 w-4" />
              </div>
              Create New User
            </button>

            <div className="flex-1 bg-white rounded-full px-6 py-3 flex items-center gap-4 shadow-sm border border-gray-100/50">
              <span className="text-gray-400 text-sm font-medium whitespace-nowrap">Date & Time (All In one)</span>
              <div className="w-[1px] h-6 bg-gray-100"></div>
              <div className="flex-1 flex items-center gap-3">
                <input 
                  type="text" 
                  placeholder="Type Name Here and phone Number / GSTIN"
                  className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-gray-800 placeholder:text-gray-300"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div className="flex items-center gap-3 p-1.5 bg-white/50 backdrop-blur-sm rounded-full border border-white">
              {['today', 'tomorrow', 'yesterday'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2 rounded-full text-xs font-bold transition-all capitalize shadow-sm ${
                    activeTab === tab 
                      ? 'bg-[#6a4ef1] text-white' 
                      : 'bg-[#96a9ef] text-white/90 hover:bg-[#8699ef]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

          
          </div>
        </section>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto px-6 py-4">
          {renderCurrentPage()}
        </main>
      </div>
    </div>
  );
};

export default AdminApp;
