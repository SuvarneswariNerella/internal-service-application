import React, { useState } from 'react';
import { NavItem } from '../types';
import {
  FileText,
  LayoutDashboard,
  Plane,
  CreditCard,
  PieChart,
  Wallet,
  Building2,
  ChevronDown,
  ChevronRight,
  Settings,
  User,
  Layers
} from 'lucide-react';

interface SidebarProps {
  activeItem: NavItem;
  onSelectNavItem: (item: NavItem) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeItem, onSelectNavItem }) => {
  const [isAdminOpen, setIsAdminOpen] = useState(true);
  const [isMyViewOpen, setIsMyViewOpen] = useState(false);

  const adminNavs: Array<{ name: NavItem; icon: React.ReactNode }> = [
    { name: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { name: 'Trips', icon: <Plane className="w-4 h-4" /> },
    { name: 'Reports', icon: <FileText className="w-4 h-4" /> },
    { name: 'Advances', icon: <Wallet className="w-4 h-4" /> },
    { name: 'Corporate Cards', icon: <CreditCard className="w-4 h-4" /> },
    { name: 'Budgets', icon: <Building2 className="w-4 h-4" /> },
    { name: 'Analytics', icon: <PieChart className="w-4 h-4" /> },
  ];

  const myViewNavs: Array<{ name: NavItem; icon: React.ReactNode }> = [
    { name: 'Dashboard' as NavItem, icon: <LayoutDashboard className="w-4 h-4" /> },
    { name: 'Reports' as NavItem, icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-[240px] h-screen bg-white border-r border-[#EAEAEA] flex flex-col fixed top-0 left-0 z-30 select-none">
      {/* Logo Header */}
      <div className="h-[72px] px-6 flex items-center gap-3 border-b border-[#EAEAEA] shrink-0">
        <div className="w-8 h-8 rounded-[10px] bg-[#635BFF] flex items-center justify-center text-white shadow-xs">
          <FileText className="w-4 h-4 stroke-[2.5]" />
        </div>
        <div>
          <span className="text-lg font-bold text-[#1F2937] tracking-tight block leading-none">
            Expinova
          </span>
          <span className="text-[10px] font-medium text-[#6B7280] block mt-0.5">
            Enterprise Admin
          </span>
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-3 py-5 space-y-5 scrollbar-thin">
        {/* Group 1: My View */}
        <div>
          <button
            type="button"
            onClick={() => setIsMyViewOpen(!isMyViewOpen)}
            className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-semibold text-[#6B7280] hover:text-[#1F2937] transition-colors rounded-md group"
          >
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-[#6B7280] group-hover:text-[#635BFF]" />
              <span className="uppercase tracking-wider">My View</span>
            </div>
            {isMyViewOpen ? (
              <ChevronDown className="w-3.5 h-3.5 text-[#6B7280]" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-[#6B7280]" />
            )}
          </button>

          {isMyViewOpen && (
            <div className="mt-1 space-y-0.5 pl-2">
              {myViewNavs.map((item) => {
                const isActive = activeItem === item.name;
                return (
                  <button
                    key={`my-${item.name}`}
                    type="button"
                    onClick={() => onSelectNavItem(item.name)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-[10px] text-xs font-medium transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-[#635BFF] text-white shadow-xs font-semibold'
                        : 'text-[#1F2937] hover:bg-[#F7F7F8] hover:text-[#635BFF]'
                    }`}
                  >
                    <span className={isActive ? 'text-white' : 'text-[#6B7280]'}>
                      {item.icon}
                    </span>
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Group 2: Admin View */}
        <div>
          <button
            type="button"
            onClick={() => setIsAdminOpen(!isAdminOpen)}
            className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-semibold text-[#6B7280] hover:text-[#1F2937] transition-colors rounded-md group"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-[#6B7280] group-hover:text-[#635BFF]" />
              <span className="uppercase tracking-wider">Admin View</span>
            </div>
            {isAdminOpen ? (
              <ChevronDown className="w-3.5 h-3.5 text-[#6B7280]" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-[#6B7280]" />
            )}
          </button>

          {isAdminOpen && (
            <div className="mt-1 space-y-0.5">
              {adminNavs.map((item) => {
                const isActive = activeItem === item.name;
                return (
                  <button
                    key={`admin-${item.name}`}
                    type="button"
                    onClick={() => onSelectNavItem(item.name)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-[10px] text-xs font-medium transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-[#635BFF] text-white shadow-xs font-semibold'
                        : 'text-[#1F2937] hover:bg-[#F7F7F8] hover:text-[#635BFF]'
                    }`}
                  >
                    <span className={isActive ? 'text-white' : 'text-[#6B7280]'}>
                      {item.icon}
                    </span>
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Pinned Bottom Settings */}
      <div className="p-3 border-t border-[#EAEAEA] bg-white shrink-0">
        <button
          type="button"
          onClick={() => onSelectNavItem('Settings')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-[10px] text-xs font-medium transition-all duration-150 cursor-pointer ${
            activeItem === 'Settings'
              ? 'bg-[#635BFF] text-white shadow-xs font-semibold'
              : 'text-[#1F2937] hover:bg-[#F7F7F8] hover:text-[#635BFF]'
          }`}
        >
          <Settings className={`w-4 h-4 ${activeItem === 'Settings' ? 'text-white' : 'text-[#6B7280]'}`} />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
};
