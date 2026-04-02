import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  LayoutDashboard,
  Users,
  LogOut,
  UserCog,
  Calendar,
  UserPlus,
  Tag,
  Wallet,
} from 'lucide-react';
import { getAuthData } from '../api/auth';

const TOOLTIP_OFFSET = 8;

const Sidebar = ({ currentPage, setCurrentPage, onLogout }) => {
  const authData = getAuthData();
  const userRole = authData?.user?.role || 'admin';
  const [tooltip, setTooltip] = useState(null);

  const menuItems = [];
  if (userRole === 'superadmin') {
    menuItems.push({ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard });
    menuItems.push({ id: 'directory', label: 'Business Directory', icon: Users });
    menuItems.push({ id: 'createUser', label: 'Create User', icon: UserPlus });
    menuItems.push({ id: 'admins', label: 'Admin Management', icon: UserCog });
    menuItems.push({ id: 'calendar', label: 'Calendar', icon: Calendar });
    menuItems.push({ id: 'coupons', label: 'Coupons', icon: Tag });
  } else {
    menuItems.push({ id: 'resellerDashboard', label: 'Dashboard', icon: LayoutDashboard });
    menuItems.push({ id: 'resellerUsers', label: 'Users', icon: Users });
    menuItems.push({ id: 'resellerWallet', label: 'Wallet', icon: Wallet });
  }

  const showTooltip = (label, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      label,
      left: rect.right + TOOLTIP_OFFSET,
      top: rect.top + rect.height / 2,
    });
  };

  const hideTooltip = () => setTooltip(null);

  const tooltipEl = tooltip && (
    <span
      className="fixed px-3 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg whitespace-nowrap pointer-events-none z-[9999] shadow-lg -translate-y-1/2"
      style={{ left: tooltip.left, top: tooltip.top }}
    >
      {tooltip.label}
    </span>
  );

  return (
    <>
      <aside className="relative flex flex-col h-full w-16 bg-white shadow-lg border-r border-gray-200 shrink-0 overflow-visible">
        {/* Header: logo only */}
        <div className="flex items-center justify-center p-3 border-b border-gray-200 shrink-0">
          <img
            src="/vl-logo.jpeg"
            alt="Logo"
            className="h-8 w-8 shrink-0 object-contain"
            title={`Welcome, ${authData.user?.username || 'Admin'}`}
          />
        </div>

        {/* Nav: icons only, label on hover */}
        <nav className="flex-1 mt-4 px-2 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setCurrentPage(item.id)}
                    onMouseEnter={(e) => showTooltip(item.label, e)}
                    onMouseLeave={hideTooltip}
                    className={`w-full flex items-center justify-center px-2 py-3 rounded-lg transition-colors duration-200 ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}`}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout: icon only, label on hover */}
        <div className="p-2 border-t border-gray-200 shrink-0">
          <button
            onClick={onLogout}
            onMouseEnter={(e) => showTooltip('Logout', e)}
            onMouseLeave={hideTooltip}
            className="w-full flex items-center justify-center px-2 py-3 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5 shrink-0" />
          </button>
        </div>
      </aside>
      {tooltip && typeof document !== 'undefined' && createPortal(tooltipEl, document.body)}
    </>
  );
};

export default Sidebar;