import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Scan, ChevronDown } from 'lucide-react';
import { NotificationItem } from '../types';
import { NotificationDropdown } from './NotificationDropdown';
import { UserDropdown } from './UserDropdown';

interface TopBarProps {
  title: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  notifications: NotificationItem[];
  onMarkAllNotificationsRead: () => void;
  onSwitchView: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  title,
  searchQuery,
  onSearchChange,
  notifications,
  onMarkAllNotificationsRead,
  onSwitchView,
}) => {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => n.unread).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-[72px] bg-white border-b border-[#EAEAEA] px-6 sm:px-8 flex items-center justify-between sticky top-0 z-20">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-[#1F2937] tracking-tight leading-tight">
          {title}
        </h1>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Search Input */}
        <div className="relative w-48 sm:w-72">
          <Search className="w-4 h-4 text-[#9CA3AF] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search report #, submitter..."
            className="w-full h-10 pl-9 pr-4 bg-[#F7F7F8] hover:bg-[#EDEDF0] focus:bg-white text-xs font-medium text-[#1F2937] placeholder-[#9CA3AF] rounded-[10px] border border-[#EAEAEA] focus:border-[#635BFF] focus:ring-2 focus:ring-[#635BFF]/20 outline-none transition-all duration-150"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#9CA3AF] hover:text-[#1F2937]"
            >
              ✕
            </button>
          )}
        </div>

        {/* Scan / Quick Action */}
        <button
          type="button"
          onClick={() => alert('Opening AI Receipt Scanner...')}
          className="w-10 h-10 rounded-[10px] bg-[#F7F7F8] hover:bg-[#F0EEFF] text-[#6B7280] hover:text-[#635BFF] border border-[#EAEAEA] flex items-center justify-center transition-all duration-150 cursor-pointer"
          title="AI Receipt Scanner"
        >
          <Scan className="w-4 h-4" />
        </button>

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="w-10 h-10 rounded-[10px] bg-[#F7F7F8] hover:bg-[#F0EEFF] text-[#6B7280] hover:text-[#635BFF] border border-[#EAEAEA] flex items-center justify-center transition-all duration-150 relative cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-[#DC2626] rounded-full ring-2 ring-white" />
            )}
          </button>

          {isNotifOpen && (
            <NotificationDropdown
              notifications={notifications}
              onMarkAllRead={onMarkAllNotificationsRead}
              onClose={() => setIsNotifOpen(false)}
            />
          )}
        </div>

        {/* User Profile */}
        <div className="relative pl-2 border-l border-[#EAEAEA]" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2.5 p-1 rounded-[10px] hover:bg-[#F7F7F8] transition-all duration-150 cursor-pointer"
          >
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
              alt="Jayson"
              className="w-8 h-8 rounded-full object-cover ring-1 ring-[#EAEAEA]"
            />
            <div className="text-left hidden md:block">
              <span className="text-xs font-semibold text-[#1F2937] block leading-tight">
                Jayson
              </span>
              <span className="text-[10px] font-medium text-[#6B7280] block">
                VP of Product
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#6B7280]" />
          </button>

          {isUserMenuOpen && (
            <UserDropdown
              userName="Jayson Tatum"
              userRole="VP of Product (Admin)"
              onSwitchView={onSwitchView}
              onClose={() => setIsUserMenuOpen(false)}
            />
          )}
        </div>
      </div>
    </header>
  );
};
