import React from 'react';
import { User, RefreshCw, LogOut, ShieldCheck, ExternalLink } from 'lucide-react';

interface UserDropdownProps {
  userName: string;
  userRole: string;
  onSwitchView: () => void;
  onClose: () => void;
}

export const UserDropdown: React.FC<UserDropdownProps> = ({
  userName,
  userRole,
  onSwitchView,
  onClose
}) => {
  return (
    <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white shadow-2xl border border-[#EDEDF0] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 py-2 text-xs text-[#374151]">
      <div className="px-4 py-2.5 border-b border-[#EDEDF0] bg-[#FAF9FF]">
        <p className="font-semibold text-sm text-[#1A1A1A]">{userName}</p>
        <p className="text-[#6B7280] text-xs flex items-center gap-1.5 mt-0.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#6C5CE7]" />
          {userRole}
        </p>
      </div>

      <div className="py-1">
        <button
          type="button"
          onClick={() => {
            onClose();
          }}
          className="w-full text-left px-4 py-2.5 flex items-center gap-2.5 hover:bg-[#F9F9FB] transition-colors"
        >
          <User className="w-4 h-4 text-[#6B7280]" />
          <span>Profile & Account</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onSwitchView();
            onClose();
          }}
          className="w-full text-left px-4 py-2.5 flex items-center gap-2.5 hover:bg-[#F5F4FF] text-[#6C5CE7] font-semibold transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Switch to My View</span>
        </button>
      </div>

      <div className="border-t border-[#EDEDF0] pt-1">
        <button
          type="button"
          onClick={() => {
            onClose();
            alert('Logging out of Expinova session...');
          }}
          className="w-full text-left px-4 py-2.5 flex items-center gap-2.5 hover:bg-[#FEE2E2] text-[#DC2626] font-medium transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
};
