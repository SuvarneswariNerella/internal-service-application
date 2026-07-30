import React from 'react';
import { ReportItem, StatusType } from '../types';
import { CustomCheckbox } from './CustomCheckbox';
import { StatusPill } from './StatusPill';
import { KebabMenu } from './KebabMenu';

interface TableRowProps {
  report: ReportItem;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onStatusChange: (id: string, newStatus: StatusType) => void;
  onViewDetails: (report: ReportItem) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onMarkReimbursed: (id: string) => void;
  onAddComment: (report: ReportItem) => void;
}

export const TableRow: React.FC<TableRowProps> = ({
  report,
  isSelected,
  onToggleSelect,
  onStatusChange,
  onViewDetails,
  onApprove,
  onReject,
  onMarkReimbursed,
  onAddComment
}) => {
  return (
    <tr
      onClick={() => onViewDetails(report)}
      className={`h-[64px] border-b border-[#EAEAEA] transition-colors duration-150 cursor-pointer select-none ${
        isSelected
          ? 'bg-[#F0EEFF] hover:bg-[#E8E5FF]'
          : 'bg-white hover:bg-[#F7F7F8]'
      }`}
    >
      {/* Checkbox */}
      <td
        className="px-5 py-3.5 w-12 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <CustomCheckbox
          checked={isSelected}
          onChange={() => onToggleSelect(report.id)}
          id={`checkbox-${report.id}`}
        />
      </td>

      {/* Report # */}
      <td className="px-4 py-3.5 whitespace-nowrap">
        <span className="font-mono text-xs font-semibold text-[#635BFF] bg-[#635BFF]/10 px-2.5 py-1 rounded-md">
          {report.reportNumber}
        </span>
      </td>

      {/* Submitter (Avatar + Name) */}
      <td className="px-4 py-3.5 whitespace-nowrap">
        <div className="flex items-center gap-2.5">
          <img
            src={report.submitter.avatar}
            alt={report.submitter.name}
            className="w-8 h-8 rounded-full object-cover ring-1 ring-[#EAEAEA] shrink-0"
          />
          <div>
            <div className="text-xs font-semibold text-[#1F2937] leading-tight">
              {report.submitter.name}
            </div>
            <div className="text-[10px] font-medium text-[#6B7280]">
              {report.submitter.role}
            </div>
          </div>
        </div>
      </td>

      {/* Report Name */}
      <td className="px-4 py-3.5 max-w-xs">
        <div className="text-xs font-medium text-[#1F2937] truncate" title={report.reportName}>
          {report.reportName}
        </div>
        <div className="text-[10px] text-[#6B7280]">
          {report.category} • {report.expensesCount} items
        </div>
      </td>

      {/* Date */}
      <td className="px-4 py-3.5 whitespace-nowrap text-xs font-medium text-[#6B7280]">
        {report.dateRange}
      </td>

      {/* Status Pill */}
      <td className="px-4 py-3.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
        <StatusPill
          status={report.status}
          onStatusChange={(newStatus) => onStatusChange(report.id, newStatus)}
        />
      </td>

      {/* Approver */}
      <td className="px-4 py-3.5 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <img
            src={report.approver.avatar}
            alt={report.approver.name}
            className="w-7 h-7 rounded-full object-cover ring-1 ring-[#EAEAEA] shrink-0"
          />
          <span className="text-xs font-medium text-[#1F2937]">
            {report.approver.name}
          </span>
        </div>
      </td>

      {/* Total Amount */}
      <td className="px-4 py-3.5 whitespace-nowrap text-right">
        <span className="text-xs sm:text-sm font-bold text-[#1F2937]">
          ${report.total.toLocaleString()}
        </span>
      </td>

      {/* Action / Kebab Menu */}
      <td className="px-5 py-3.5 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
        <KebabMenu
          status={report.status}
          onViewDetails={() => onViewDetails(report)}
          onApprove={() => onApprove(report.id)}
          onReject={() => onReject(report.id)}
          onMarkReimbursed={() => onMarkReimbursed(report.id)}
          onDownloadReceipt={() => alert(`Downloading receipts for ${report.reportNumber}...`)}
          onAddComment={() => onAddComment(report)}
        />
      </td>
    </tr>
  );
};
