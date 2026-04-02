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
import { getAuthData, clearAuthData } from './api/auth';

// Admin Panel App - separate from website
const AdminApp = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [inquiryId, setInquiryId] = useState(undefined);
  const [generatedCardId, setGeneratedCardId] = useState(undefined);
  const [resellerTargetUserId, setResellerTargetUserId] = useState(undefined);
  const [resellerEditCardId, setResellerEditCardId] = useState(undefined);

  useEffect(() => {
    // Check if user is already authenticated
    const authData = getAuthData();
    if (authData?.isAuthenticated) {
      setIsAuthenticated(true);
    }
  }, []);

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
        return userRole === 'superadmin' ? <Dashboard onNavigate={setCurrentPage} /> : <BusinessDirectory onEditCard={handleGenerateCard} />;
      case 'directory':
        return <BusinessDirectory onEditCard={handleGenerateCard} />;
      case 'resellerDashboard':
        return <ResellerDashboard onNavigate={setCurrentPage} />;
      case 'resellerUsers':
        return (
          <ResellerUsers
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
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage}
        onLogout={handleLogout}
      />
      <main className="flex-1 overflow-auto">
        {renderCurrentPage()}
      </main>
    </div>
  );
};

export default AdminApp;
