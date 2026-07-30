import React from 'react';
import { CheckCircle2, DollarSign, Download, X } from 'lucide-react';

interface BulkActionBarProps {
  selectedCount: number;
  onBulkApprove: () => void;
  onBulkReimburse: () => void;
  onExportCSV: () => void;
  onClearSelection: () => void;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedCount,
  onBulkApprove,
  onBulkReimburse,
  onExportCSV,
  onClearSelection
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#1A1A1A] text-white px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-5 fade-in duration-200 border border-white/10 max-w-2xl w-11/12 sm:w-auto">
      <div className="flex items-center gap-2 pr-4 border-r border-white/20">
        <span className="w-6 h-6 rounded-full bg-[#635BFF] text-white text-xs font-bold flex items-center justify-center">
          {selectedCount}
        </span>
        <span className="text-xs font-semibold whitespace-nowrap">
          {selectedCount === 1 ? '1 report selected' : `${selectedCount} reports selected`}
        </span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={onBulkApprove}
          className="px-3.5 py-1.5 rounded-lg bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Bulk Approve</span>
        </button>

        <button
          type="button"
          onClick={onBulkReimburse}
          className="px-3.5 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <DollarSign className="w-4 h-4" />
          <span>Mark as Reimbursed</span>
        </button>

        <button
          type="button"
          onClick={onExportCSV}
          className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>

      <button
        type="button"
        onClick={onClearSelection}
        className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors ml-auto"
        title="Clear Selection"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
