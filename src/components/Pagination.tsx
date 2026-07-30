import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange
}) => {
  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const getPageNumbers = () => {
    const pages: number[] = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="px-6 py-3.5 bg-white border-t border-[#EAEAEA] flex flex-col sm:flex-row items-center justify-between gap-3 select-none">
      <div className="text-xs text-[#6B7280] font-medium">
        Showing <span className="font-semibold text-[#1F2937]">{startItem}</span>–
        <span className="font-semibold text-[#1F2937]">{endItem}</span> of{' '}
        <span className="font-semibold text-[#1F2937]">{totalItems}</span> reports
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1.5 rounded-[10px] border border-[#EAEAEA] text-xs font-semibold text-[#1F2937] hover:bg-[#F7F7F8] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Previous</span>
        </button>

        <div className="flex items-center gap-1 mx-1.5">
          {getPageNumbers().map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={`w-8 h-8 rounded-[10px] text-xs font-semibold transition-all cursor-pointer ${
                currentPage === page
                  ? 'bg-[#635BFF] text-white shadow-xs'
                  : 'text-[#1F2937] hover:bg-[#F7F7F8] hover:text-[#635BFF]'
              }`}
            >
              {page}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          className="px-3 py-1.5 rounded-[10px] border border-[#EAEAEA] text-xs font-semibold text-[#1F2937] hover:bg-[#F7F7F8] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
        >
          <span>Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
