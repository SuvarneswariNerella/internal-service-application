import React, { useState, useRef, useEffect } from 'react';
import { StatusType } from '../types';
import { MoreVertical, Eye, CheckCircle2, XCircle, DollarSign, Download, MessageSquare } from 'lucide-react';

interface KebabMenuProps {
  status: StatusType;
  onViewDetails: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onMarkReimbursed?: () => void;
  onDownloadReceipt?: () => void;
  onAddComment?: () => void;
}

export const KebabMenu: React.FC<KebabMenuProps> = ({
  status,
  onViewDetails,
  onApprove,
  onReject,
  onMarkReimbursed,
  onDownloadReceipt,
  onAddComment
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:text-[#374151] hover:bg-[#F1F1F4] transition-colors"
        aria-label="More options"
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-52 rounded-xl bg-white shadow-xl border border-[#EAEAEA] z-50 py-1.5 text-xs text-[#1F2937] font-medium animate-in fade-in zoom-in-95 duration-100">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
              onViewDetails();
            }}
            className="w-full text-left px-3.5 py-2 flex items-center gap-2.5 hover:bg-[#F7F7F8] text-[#1F2937] transition-colors cursor-pointer"
          >
            <Eye className="w-4 h-4 text-[#635BFF]" />
            <span>View Details</span>
          </button>

          {status === 'Pending' && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  if (onApprove) onApprove();
                }}
                className="w-full text-left px-3.5 py-2 flex items-center gap-2.5 hover:bg-[#DCFCE7] text-[#16A34A] transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve Report</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  if (onReject) onReject();
                }}
                className="w-full text-left px-3.5 py-2 flex items-center gap-2.5 hover:bg-[#FEE2E2] text-[#DC2626] transition-colors cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject Report</span>
              </button>
            </>
          )}

          {status === 'Approved' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
                if (onMarkReimbursed) onMarkReimbursed();
              }}
              className="w-full text-left px-3.5 py-2 flex items-center gap-2.5 hover:bg-[#DBEAFE] text-[#2563EB] transition-colors cursor-pointer"
            >
              <DollarSign className="w-4 h-4" />
              <span>Mark as Reimbursed</span>
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
              if (onDownloadReceipt) onDownloadReceipt();
            }}
            className="w-full text-left px-3.5 py-2 flex items-center gap-2.5 hover:bg-[#F7F7F8] text-[#1F2937] transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#6B7280]" />
            <span>Download Receipts (PDF)</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
              if (onAddComment) onAddComment();
            }}
            className="w-full text-left px-3.5 py-2 flex items-center gap-2.5 hover:bg-[#F7F7F8] text-[#1F2937] transition-colors border-t border-[#EAEAEA] mt-1 pt-2 cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 text-[#6B7280]" />
            <span>Add Comment</span>
          </button>
        </div>
      )}
    </div>
  );
};
