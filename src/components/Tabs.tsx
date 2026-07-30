import React from 'react';
import { TabType } from '../types';

interface TabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  counts: Record<TabType, number>;
}

export const Tabs: React.FC<TabsProps> = ({ activeTab, onTabChange, counts }) => {
  const tabsList: TabType[] = [
    'All',
    'Awaiting Approval',
    'Awaiting Reimbursement',
    'Reimbursed'
  ];

  return (
    <div className="flex items-center gap-6 sm:gap-8 select-none overflow-x-auto scrollbar-none">
      {tabsList.map((tab) => {
        const isActive = activeTab === tab;
        const count = counts[tab] || 0;

        return (
          <button
            key={tab}
            type="button"
            onClick={() => onTabChange(tab)}
            className={`py-3.5 text-xs sm:text-sm font-medium flex items-center gap-2 border-b-2 transition-all duration-150 cursor-pointer whitespace-nowrap ${
              isActive
                ? 'border-[#635BFF] text-[#635BFF] font-semibold'
                : 'border-transparent text-[#6B7280] hover:text-[#1F2937] hover:border-[#EAEAEA]'
            }`}
          >
            <span>{tab}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-colors ${
                isActive
                  ? 'bg-[#635BFF]/10 text-[#635BFF]'
                  : 'bg-[#F7F7F8] text-[#6B7280]'
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
