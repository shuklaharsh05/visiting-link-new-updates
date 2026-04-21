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
      <aside className="relative flex flex-col h-full w-14 bg-white shadow-sm border-r border-gray-100 shrink-0 overflow-visible">
        {/* Header: logo only */}
        <div className="flex items-center justify-center py-6 shrink-0">
          <div className="h-8 w-8 bg-[#6348ef] rounded-[10px] flex items-center justify-center shadow-lg shadow-indigo-200">
            <LayoutDashboard className="h-4 w-4 text-white" />
          </div>
        </div>

        {/* Nav: icons only, label on hover */}
        <nav className="flex-1 px-2 mt-4">
          <ul className="space-y-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <li key={item.id} className="relative">
                  <button
                    onClick={() => setCurrentPage(item.id)}
                    onMouseEnter={(e) => showTooltip(item.label, e)}
                    onMouseLeave={hideTooltip}
                    className={`w-full flex items-center justify-center py-2 rounded-xl transition-all duration-300 ${
                      isActive
                        ? 'text-indigo-600 bg-indigo-50/50'
                        : 'text-gray-400 hover:text-indigo-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 shrink-0 transition-transform duration-300 ${isActive ? 'scale-110' : ''}`}
                    />
                    {isActive && (
                      <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-indigo-600 rounded-r-full" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
      {tooltip && typeof document !== 'undefined' && createPortal(tooltipEl, document.body)}
    </>
  );
};

export default Sidebar;