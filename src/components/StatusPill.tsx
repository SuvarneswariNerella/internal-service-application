import React, { useState, useRef, useEffect } from 'react';
import { StatusType } from '../types';
import { ChevronDown, Check } from 'lucide-react';

interface StatusPillProps {
  status: StatusType;
  onStatusChange?: (newStatus: StatusType) => void;
  interactive?: boolean;
}

const STATUS_CONFIG: Record<StatusType, { bg: string; text: string; label: string }> = {
  Approved: { bg: 'bg-[#DCFCE7]', text: 'text-[#16A34A]', label: 'Approved' },
  Pending: { bg: 'bg-[#FEF3C7]', text: 'text-[#D97706]', label: 'Pending' },
  Rejected: { bg: 'bg-[#FEE2E2]', text: 'text-[#DC2626]', label: 'Rejected' },
  Reimbursed: { bg: 'bg-[#DBEAFE]', text: 'text-[#2563EB]', label: 'Reimbursed' }
};

const ALL_STATUSES: StatusType[] = ['Pending', 'Approved', 'Reimbursed', 'Rejected'];

export const StatusPill: React.FC<StatusPillProps> = ({
  status,
  onStatusChange,
  interactive = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const config = STATUS_CONFIG[status] || STATUS_CONFIG.Pending;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (newStatus: StatusType) => {
    if (onStatusChange && newStatus !== status) {
      onStatusChange(newStatus);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (interactive) setIsOpen(!isOpen);
        }}
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-150 ${config.bg} ${config.text} ${
          interactive ? 'hover:opacity-80 cursor-pointer shadow-xs' : 'cursor-default'
        }`}
        title={interactive ? 'Click to change status' : undefined}
      >
        <span>{config.label}</span>
        {interactive && <ChevronDown className="w-3 h-3 opacity-70" />}
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-40 rounded-xl bg-white shadow-lg border border-[#EAEAEA] z-50 py-1.5 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1 text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider">
            Change Status
          </div>
          {ALL_STATUSES.map((st) => {
            const stConfig = STATUS_CONFIG[st];
            const isSelected = st === status;
            return (
              <button
                key={st}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(st);
                }}
                className={`w-full text-left px-3 py-1.5 text-xs font-medium flex items-center justify-between hover:bg-[#F7F7F8] transition-colors cursor-pointer ${
                  isSelected ? 'bg-[#635BFF]/10 text-[#635BFF] font-semibold' : 'text-[#1F2937]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${stConfig.bg}`} />
                  <span>{stConfig.label}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#635BFF]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
