import React, { useState } from 'react';
import { ReportItem, StatusType } from '../types';
import { StatusPill } from './StatusPill';
import {
  X,
  FileText,
  User,
  Calendar,
  CheckCircle2,
  XCircle,
  DollarSign,
  Download,
  Send,
  Building,
  Paperclip,
  Tag,
  Clock
} from 'lucide-react';

interface ReportDetailModalProps {
  report: ReportItem | null;
  onClose: () => void;
  onStatusChange: (id: string, newStatus: StatusType) => void;
  onAddComment: (id: string, text: string) => void;
}

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  report,
  onClose,
  onStatusChange,
  onAddComment
}) => {
  const [commentInput, setCommentInput] = useState('');

  if (!report) return null;

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    onAddComment(report.id, commentInput.trim());
    setCommentInput('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-[#EDEDF0] animate-in slide-in-from-right duration-250"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-[#EDEDF0] bg-[#FAF9FF] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#6C5CE7]/10 text-[#6C5CE7] flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#6C5CE7] bg-[#F5F4FF] px-2.5 py-0.5 rounded-full">
                  {report.reportNumber}
                </span>
                <StatusPill
                  status={report.status}
                  onStatusChange={(newSt) => onStatusChange(report.id, newSt)}
                />
              </div>
              <h2 className="text-lg font-bold text-[#1A1A1A] mt-1 leading-snug">
                {report.reportName}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-[#F1F1F4] text-[#6B7280] flex items-center justify-center border border-[#EDEDF0] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Summary Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#F9F9FB] border border-[#EDEDF0]">
              <span className="text-xs font-semibold text-[#9CA3AF] uppercase block mb-1">
                Total Amount
              </span>
              <span className="text-xl font-bold text-[#1A1A1A]">
                ${report.total.toLocaleString()}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#F9F9FB] border border-[#EDEDF0]">
              <span className="text-xs font-semibold text-[#9CA3AF] uppercase block mb-1">
                Category
              </span>
              <span className="text-sm font-semibold text-[#374151] flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#6C5CE7]" />
                {report.category}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#F9F9FB] border border-[#EDEDF0] col-span-2 sm:col-span-1">
              <span className="text-xs font-semibold text-[#9CA3AF] uppercase block mb-1">
                Date Period
              </span>
              <span className="text-xs font-semibold text-[#374151] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#6C5CE7]" />
                {report.dateRange}
              </span>
            </div>
          </div>

          {/* Submitter & Approver Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Submitter */}
            <div className="p-4 rounded-xl border border-[#EDEDF0] bg-white">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF] block mb-3">
                Submitted By
              </span>
              <div className="flex items-center gap-3">
                <img
                  src={report.submitter.avatar}
                  alt={report.submitter.name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-[#EDEDF0]"
                />
                <div>
                  <h4 className="text-sm font-bold text-[#1A1A1A]">{report.submitter.name}</h4>
                  <p className="text-xs text-[#6B7280]">{report.submitter.role}</p>
                  <p className="text-[11px] text-[#9CA3AF]">{report.submitter.email}</p>
                </div>
              </div>
            </div>

            {/* Approver */}
            <div className="p-4 rounded-xl border border-[#EDEDF0] bg-white">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF] block mb-3">
                Assigned Approver
              </span>
              <div className="flex items-center gap-3">
                <img
                  src={report.approver.avatar}
                  alt={report.approver.name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-[#EDEDF0]"
                />
                <div>
                  <h4 className="text-sm font-bold text-[#1A1A1A]">{report.approver.name}</h4>
                  <p className="text-xs text-[#6B7280]">{report.approver.title}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Report Description */}
          <div className="p-4 rounded-xl border border-[#EDEDF0] bg-white space-y-2">
            <h3 className="text-xs font-bold uppercase text-[#9CA3AF] tracking-wider">
              Business Justification / Description
            </h3>
            <p className="text-xs text-[#374151] leading-relaxed">
              {report.description}
            </p>
          </div>

          {/* Attached Receipts */}
          <div className="p-4 rounded-xl border border-[#EDEDF0] bg-[#FAF9FF] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase text-[#6C5CE7] tracking-wider flex items-center gap-1.5">
                <Paperclip className="w-4 h-4" />
                Attached Receipts ({report.expensesCount} itemized receipts)
              </h3>
              <button
                type="button"
                onClick={() => alert(`Downloading receipts bundle for ${report.reportNumber}...`)}
                className="px-3 py-1 rounded-lg bg-white border border-[#EDEDF0] text-xs font-semibold text-[#6C5CE7] hover:bg-[#F5F4FF] transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                Download PDF Package
              </button>
            </div>
            <div className="p-3 bg-white rounded-lg border border-[#EDEDF0] flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-xs text-[#374151]">
                <FileText className="w-4 h-4 text-[#6C5CE7]" />
                <span className="font-medium">{report.reportNumber}_Receipts_Bundle.pdf</span>
                <span className="text-[10px] text-[#9CA3AF]">(4.2 MB)</span>
              </div>
              <span className="text-[11px] text-[#16A34A] font-semibold bg-[#DCFCE7] px-2 py-0.5 rounded">
                OCR Verified
              </span>
            </div>
          </div>

          {/* Comments & Activity Log */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase text-[#9CA3AF] tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#6B7280]" />
              Audit Log & Comments
            </h3>

            <div className="space-y-3">
              {report.comments.length === 0 ? (
                <p className="text-xs text-[#9CA3AF] italic p-3 bg-[#F9F9FB] rounded-xl text-center">
                  No comments added yet. Use the input below to add notes.
                </p>
              ) : (
                report.comments.map((c) => (
                  <div key={c.id} className="p-3.5 rounded-xl border border-[#EDEDF0] bg-white flex gap-3">
                    <img
                      src={c.avatar}
                      alt={c.author}
                      className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-[#1A1A1A]">{c.author}</span>
                        <span className="text-[10px] text-[#9CA3AF]">{c.timestamp}</span>
                      </div>
                      <p className="text-xs text-[#374151] leading-relaxed">{c.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Comment Form */}
            <form onSubmit={handleSubmitComment} className="flex gap-2 pt-2">
              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Add a comment or audit note..."
                className="flex-1 px-3.5 py-2 rounded-xl border border-[#E5E7EB] text-xs font-medium text-[#1A1A1A] placeholder-[#9CA3AF] focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/20 outline-none"
              />
              <button
                type="submit"
                disabled={!commentInput.trim()}
                className="px-4 py-2 bg-[#6C5CE7] hover:bg-[#5A4BD6] disabled:opacity-40 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Post</span>
              </button>
            </form>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#EDEDF0] bg-[#FAF9FF] flex items-center justify-between shrink-0">
          <div className="text-xs text-[#6B7280]">
            Submitted on <span className="font-semibold text-[#1A1A1A]">{report.submittedDate}</span>
          </div>

          <div className="flex items-center gap-2">
            {report.status === 'Pending' && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onStatusChange(report.id, 'Approved');
                  }}
                  className="px-4 py-2 bg-[#22C55E] hover:bg-[#16A34A] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve Report</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onStatusChange(report.id, 'Rejected');
                  }}
                  className="px-4 py-2 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject</span>
                </button>
              </>
            )}

            {report.status === 'Approved' && (
              <button
                type="button"
                onClick={() => {
                  onStatusChange(report.id, 'Reimbursed');
                }}
                className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <DollarSign className="w-4 h-4" />
                <span>Mark as Reimbursed</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-[#F1F1F4] text-[#374151] border border-[#E5E7EB] rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
