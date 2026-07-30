import React from 'react';
import { ReportItem, StatusType } from '../types';
import { TableRow } from './TableRow';
import { CustomCheckbox } from './CustomCheckbox';
import { Pagination } from './Pagination';
import { ArrowUpDown, ArrowUp, ArrowDown, FileSearch, RefreshCw } from 'lucide-react';

export type SortField = 'date' | 'total' | null;
export type SortDirection = 'asc' | 'desc';

interface ReportsTableProps {
  reports: ReportItem[];
  isLoading: boolean;
  selectedIds: string[];
  onToggleSelectAll: () => void;
  onToggleSelect: (id: string) => void;
  onStatusChange: (id: string, newStatus: StatusType) => void;
  onViewDetails: (report: ReportItem) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onMarkReimbursed: (id: string) => void;
  onAddComment: (report: ReportItem) => void;
  sortField: SortField;
  sortDirection: SortDirection;
  onSortChange: (field: SortField) => void;
  onClearFilters: () => void;
  currentPage?: number;
  totalPages?: number;
  pageSize?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
}

export const ReportsTable: React.FC<ReportsTableProps> = ({
  reports,
  isLoading,
  selectedIds,
  onToggleSelectAll,
  onToggleSelect,
  onStatusChange,
  onViewDetails,
  onApprove,
  onReject,
  onMarkReimbursed,
  onAddComment,
  sortField,
  sortDirection,
  onSortChange,
  onClearFilters,
  currentPage,
  totalPages,
  pageSize = 10,
  totalItems = 0,
  onPageChange
}) => {
  const allSelected = reports.length > 0 && reports.every((r) => selectedIds.includes(r.id));

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-[#9CA3AF] opacity-60 group-hover:opacity-100" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-[#6C5CE7]" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-[#6C5CE7]" />
    );
  };

  return (
    <div className="w-full bg-white border-b border-[#EAEAEA] overflow-hidden">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-left border-collapse">
          {/* Table Header */}
          <thead>
            <tr className="h-11 bg-[#F7F7F8] border-b border-[#EAEAEA] text-[11px] font-semibold text-[#6B7280] select-none">
              <th className="px-5 py-3 w-12 text-center">
                <CustomCheckbox
                  checked={allSelected}
                  onChange={onToggleSelectAll}
                  id="select-all-checkbox"
                />
              </th>
              <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px] text-[#6B7280]">
                Report #
              </th>
              <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px] text-[#6B7280]">
                Submitter
              </th>
              <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px] text-[#6B7280]">
                Report Name
              </th>

              {/* Sortable: Date */}
              <th
                className="px-4 py-3 cursor-pointer group hover:text-[#1F2937] transition-colors"
                onClick={() => onSortChange('date')}
              >
                <div className="flex items-center gap-1.5 uppercase tracking-wider text-[11px] text-[#6B7280]">
                  <span>Date</span>
                  {renderSortIcon('date')}
                </div>
              </th>

              <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px] text-[#6B7280]">
                Status
              </th>
              <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px] text-[#6B7280]">
                Approver
              </th>

              {/* Sortable: Total */}
              <th
                className="px-4 py-3 cursor-pointer group hover:text-[#1F2937] transition-colors text-right"
                onClick={() => onSortChange('total')}
              >
                <div className="flex items-center justify-end gap-1.5 uppercase tracking-wider text-[11px] text-[#6B7280]">
                  <span>Total</span>
                  {renderSortIcon('total')}
                </div>
              </th>

              <th className="px-5 py-3 text-right uppercase tracking-wider text-[11px] text-[#6B7280]">
                Action
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {isLoading ? (
              // Skeleton pulse loaders
              Array.from({ length: 6 }).map((_, idx) => (
                <tr key={`skeleton-${idx}`} className="h-[64px] border-b border-[#EAEAEA] animate-pulse">
                  <td className="px-5 py-3.5">
                    <div className="w-5 h-5 rounded bg-[#EAEAEA]" />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="w-20 h-5 rounded bg-[#EAEAEA]" />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#EAEAEA]" />
                      <div className="space-y-1">
                        <div className="w-24 h-3.5 rounded bg-[#EAEAEA]" />
                        <div className="w-16 h-3 rounded bg-[#EAEAEA]" />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="w-40 h-4 rounded bg-[#EAEAEA]" />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="w-20 h-3.5 rounded bg-[#EAEAEA]" />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="w-20 h-5 rounded-full bg-[#EAEAEA]" />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="w-24 h-3.5 rounded bg-[#EAEAEA]" />
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="w-16 h-4 rounded bg-[#EAEAEA] ml-auto" />
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="w-5 h-5 rounded-lg bg-[#EAEAEA] ml-auto" />
                  </td>
                </tr>
              ))
            ) : reports.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={9} className="py-16 text-center">
                  <div className="max-w-md mx-auto flex flex-col items-center justify-center space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-[#635BFF]/10 text-[#635BFF] flex items-center justify-center">
                      <FileSearch className="w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-[#1F2937]">No reports found</h3>
                      <p className="text-xs text-[#6B7280]">
                        We couldn't find any expense reports matching your search query or active filter.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={onClearFilters}
                      className="px-3.5 py-1.5 rounded-[10px] bg-[#635BFF] hover:bg-[#5249E0] text-white text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Clear filters</span>
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              reports.map((report) => (
                <TableRow
                  key={report.id}
                  report={report}
                  isSelected={selectedIds.includes(report.id)}
                  onToggleSelect={onToggleSelect}
                  onStatusChange={onStatusChange}
                  onViewDetails={onViewDetails}
                  onApprove={onApprove}
                  onReject={onReject}
                  onMarkReimbursed={onMarkReimbursed}
                  onAddComment={onAddComment}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Embedded Table Footer Pagination */}
      {!isLoading && currentPage !== undefined && totalPages !== undefined && onPageChange && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
};
