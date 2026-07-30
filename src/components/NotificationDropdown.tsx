import React from 'react';
import { NotificationItem } from '../types';
import { Bell, CheckCheck, Clock, FileCheck, MessageSquare, AlertCircle } from 'lucide-react';

interface NotificationDropdownProps {
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  onClose: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  onMarkAllRead,
  onClose
}) => {
  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-[#EDEDF0] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
      <div className="p-4 bg-[#FAF9FF] border-b border-[#EDEDF0] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#6C5CE7]" />
          <h3 className="text-sm font-semibold text-[#1A1A1A]">Notifications</h3>
          {notifications.some(n => n.unread) && (
            <span className="px-2 py-0.5 text-[10px] font-bold bg-[#6C5CE7] text-white rounded-full">
              {notifications.filter(n => n.unread).length} new
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onMarkAllRead}
          className="text-xs font-semibold text-[#6C5CE7] hover:text-[#5A4BD6] flex items-center gap-1 transition-colors"
        >
          <CheckCheck className="w-3.5 h-3.5" />
          Mark all read
        </button>
      </div>

      <div className="max-h-[360px] overflow-y-auto divide-y divide-[#EDEDF0]">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#9CA3AF]">No notifications</div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              className={`p-3.5 hover:bg-[#F9F9FB] transition-colors flex gap-3 ${
                item.unread ? 'bg-[#F5F4FF]/50' : ''
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {item.type === 'approval' && (
                  <div className="w-8 h-8 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                )}
                {item.type === 'reimbursement' && (
                  <div className="w-8 h-8 rounded-full bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center">
                    <FileCheck className="w-4 h-4" />
                  </div>
                )}
                {item.type === 'comment' && (
                  <div className="w-8 h-8 rounded-full bg-[#F5F4FF] text-[#6C5CE7] flex items-center justify-center">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                )}
                {item.type === 'submission' && (
                  <div className="w-8 h-8 rounded-full bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center">
                    <FileCheck className="w-4 h-4" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-xs font-semibold text-[#1A1A1A] truncate">{item.title}</h4>
                  <span className="text-[10px] text-[#9CA3AF] flex items-center gap-1 shrink-0">
                    <Clock className="w-2.5 h-2.5" />
                    {item.timestamp}
                  </span>
                </div>
                <p className="text-xs text-[#6B7280] line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-3 bg-[#FAF9FF] border-t border-[#EDEDF0] text-center">
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-semibold text-[#6B7280] hover:text-[#1A1A1A] transition-colors"
        >
          Close Panel
        </button>
      </div>
    </div>
  );
};
