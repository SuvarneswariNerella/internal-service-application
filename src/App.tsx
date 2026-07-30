/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { ReportItem, StatusType, TabType, NavItem, NotificationItem } from './types';
import { INITIAL_REPORTS, INITIAL_NOTIFICATIONS } from './mockData';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { Tabs } from './components/Tabs';
import { ReportsTable, SortField, SortDirection } from './components/ReportsTable';
import { BulkActionBar } from './components/BulkActionBar';
import { Pagination } from './components/Pagination';
import { ReportDetailModal } from './components/ReportDetailModal';
import { Download, RefreshCw, Sparkles, CheckCircle, Plus } from 'lucide-react';

export default function App() {
  const [reports, setReports] = useState<ReportItem[]>(INITIAL_REPORTS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [activeNavItem, setActiveNavItem] = useState<NavItem>('Reports');
  const [activeTab, setActiveTab] = useState<TabType>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReportForModal, setSelectedReportForModal] = useState<ReportItem | null>(null);

  const PAGE_SIZE = 10;

  // Simulate initial mount data fetch loader (800ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Filter reports based on Tab and Search Query
  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      // Tab filter
      if (activeTab === 'Awaiting Approval' && report.status !== 'Pending') return false;
      if (activeTab === 'Awaiting Reimbursement' && report.status !== 'Approved') return false;
      if (activeTab === 'Reimbursed' && report.status !== 'Reimbursed') return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNum = report.reportNumber.toLowerCase().includes(q);
        const matchSubmitter = report.submitter.name.toLowerCase().includes(q);
        const matchName = report.reportName.toLowerCase().includes(q);
        const matchCategory = report.category.toLowerCase().includes(q);
        if (!matchNum && !matchSubmitter && !matchName && !matchCategory) {
          return false;
        }
      }

      return true;
    });
  }, [reports, activeTab, searchQuery]);

  // Sort filtered reports
  const sortedReports = useMemo(() => {
    if (!sortField) return filteredReports;

    return [...filteredReports].sort((a, b) => {
      if (sortField === 'total') {
        return sortDirection === 'asc' ? a.total - b.total : b.total - a.total;
      }
      if (sortField === 'date') {
        // Simple string/date comparison
        return sortDirection === 'asc'
          ? a.dateRange.localeCompare(b.dateRange)
          : b.dateRange.localeCompare(a.dateRange);
      }
      return 0;
    });
  }, [filteredReports, sortField, sortDirection]);

  // Paginate sorted reports
  const totalPages = Math.ceil(sortedReports.length / PAGE_SIZE) || 1;
  const paginatedReports = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedReports.slice(start, start + PAGE_SIZE);
  }, [sortedReports, currentPage]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab]);

  // Counts for tabs
  const tabCounts = useMemo<Record<TabType, number>>(() => {
    return {
      All: reports.length,
      'Awaiting Approval': reports.filter((r) => r.status === 'Pending').length,
      'Awaiting Reimbursement': reports.filter((r) => r.status === 'Approved').length,
      Reimbursed: reports.filter((r) => r.status === 'Reimbursed').length,
    };
  }, [reports]);

  // Selection handlers
  const handleToggleSelectAll = () => {
    const currentPaginatedIds = paginatedReports.map((r) => r.id);
    const allPaginatedSelected = currentPaginatedIds.every((id) => selectedIds.includes(id));

    if (allPaginatedSelected) {
      setSelectedIds(selectedIds.filter((id) => !currentPaginatedIds.includes(id)));
    } else {
      const combined = Array.from(new Set([...selectedIds, ...currentPaginatedIds]));
      setSelectedIds(combined);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  // Status Change Handler
  const handleStatusChange = (id: string, newStatus: StatusType) => {
    setReports((prev) =>
      prev.map((rep) => {
        if (rep.id === id) {
          return { ...rep, status: newStatus };
        }
        return rep;
      })
    );

    // If modal is open for this report, update modal report
    if (selectedReportForModal && selectedReportForModal.id === id) {
      setSelectedReportForModal((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    // Add activity notification
    const targetRep = reports.find((r) => r.id === id);
    if (targetRep) {
      const newNotif: NotificationItem = {
        id: `notif-${Date.now()}`,
        title: `Status Updated to ${newStatus}`,
        description: `Report ${targetRep.reportNumber} (${targetRep.reportName}) status changed to ${newStatus}.`,
        timestamp: 'Just now',
        unread: true,
        type: newStatus === 'Approved' ? 'approval' : 'reimbursement',
      };
      setNotifications((prev) => [newNotif, ...prev]);
    }
  };

  // Bulk Handlers
  const handleBulkApprove = () => {
    setReports((prev) =>
      prev.map((r) => (selectedIds.includes(r.id) ? { ...r, status: 'Approved' } : r))
    );
    setSelectedIds([]);
  };

  const handleBulkReimburse = () => {
    setReports((prev) =>
      prev.map((r) => (selectedIds.includes(r.id) ? { ...r, status: 'Reimbursed' } : r))
    );
    setSelectedIds([]);
  };

  const handleExportCSV = () => {
    const itemsToExport =
      selectedIds.length > 0
        ? reports.filter((r) => selectedIds.includes(r.id))
        : filteredReports;

    const headers = [
      'Report #',
      'Submitter',
      'Submitter Email',
      'Report Name',
      'Category',
      'Date Range',
      'Status',
      'Approver',
      'Total Amount ($)'
    ];

    const rows = itemsToExport.map((r) => [
      r.reportNumber,
      `"${r.submitter.name}"`,
      `"${r.submitter.email}"`,
      `"${r.reportName}"`,
      `"${r.category}"`,
      `"${r.dateRange}"`,
      r.status,
      `"${r.approver.name}"`,
      r.total
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Expinova_Reports_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Comment Handler
  const handleAddComment = (reportId: string, text: string) => {
    const newComment = {
      id: `c-${Date.now()}`,
      author: 'Jayson Tatum',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      text,
      timestamp: 'Just now'
    };

    setReports((prev) =>
      prev.map((r) => {
        if (r.id === reportId) {
          return {
            ...r,
            comments: [...r.comments, newComment]
          };
        }
        return r;
      })
    );

    if (selectedReportForModal && selectedReportForModal.id === reportId) {
      setSelectedReportForModal((prev) =>
        prev
          ? {
              ...prev,
              comments: [...prev.comments, newComment]
            }
          : null
      );
    }
  };

  // Sort Handler
  const handleSortChange = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortField(null);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F8] text-[#1F2937] font-sans flex antialiased">
      {/* 1. Sidebar Nav (fixed 240px) */}
      <Sidebar
        activeItem={activeNavItem}
        onSelectNavItem={(item) => setActiveNavItem(item)}
      />

      {/* Main Content Area */}
      <div className="pl-[240px] flex-1 flex flex-col min-w-0">
        {/* 2. Top Bar */}
        <TopBar
          title={activeNavItem}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          notifications={notifications}
          onMarkAllNotificationsRead={() =>
            setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
          }
          onSwitchView={() => {
            alert('Switched workspace view to "My Personal Expenses"');
          }}
        />

        {/* View Content Conditional Rendering */}
        {activeNavItem !== 'Reports' ? (
          <main className="p-8 flex-1">
            <div className="max-w-4xl mx-auto bg-white rounded-xl p-8 border border-[#EAEAEA] shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-center space-y-4">
              <div className="w-14 h-14 rounded-xl bg-[#635BFF]/10 text-[#635BFF] flex items-center justify-center mx-auto">
                <Sparkles className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-bold text-[#1F2937]">
                {activeNavItem} View
              </h2>
              <p className="text-xs text-[#6B7280] max-w-md mx-auto leading-relaxed">
                You are currently viewing the {activeNavItem} section. Return to the Reports module to inspect, review, and manage team expense submissions.
              </p>
              <button
                type="button"
                onClick={() => setActiveNavItem('Reports')}
                className="px-4 py-2 bg-[#635BFF] hover:bg-[#5249E0] text-white text-xs font-semibold rounded-[10px] shadow-xs transition-colors cursor-pointer"
              >
                Return to Reports Panel
              </button>
            </div>
          </main>
        ) : (
          <main className="flex-1 flex flex-col min-w-0">
            {/* 3. Tabs Header Row */}
            <div className="bg-white border-b border-[#EAEAEA] px-6 sm:px-8">
              <Tabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                counts={tabCounts}
              />
            </div>

            {/* 4. Table Content Container */}
            <div className="flex-1 w-full">
              <ReportsTable
                reports={paginatedReports}
                isLoading={isLoading}
                selectedIds={selectedIds}
                onToggleSelectAll={handleToggleSelectAll}
                onToggleSelect={handleToggleSelect}
                onStatusChange={handleStatusChange}
                onViewDetails={(report) => setSelectedReportForModal(report)}
                onApprove={(id) => handleStatusChange(id, 'Approved')}
                onReject={(id) => handleStatusChange(id, 'Rejected')}
                onMarkReimbursed={(id) => handleStatusChange(id, 'Reimbursed')}
                onAddComment={(report) => setSelectedReportForModal(report)}
                sortField={sortField}
                sortDirection={sortDirection}
                onSortChange={handleSortChange}
                onClearFilters={() => {
                  setSearchQuery('');
                  setActiveTab('All');
                }}
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={PAGE_SIZE}
                totalItems={sortedReports.length}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </div>
          </main>
        )}
      </div>

      {/* 5. Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedIds.length}
        onBulkApprove={handleBulkApprove}
        onBulkReimburse={handleBulkReimburse}
        onExportCSV={handleExportCSV}
        onClearSelection={handleClearSelection}
      />

      {/* Report Detail Modal / Slide-over */}
      <ReportDetailModal
        report={selectedReportForModal}
        onClose={() => setSelectedReportForModal(null)}
        onStatusChange={handleStatusChange}
        onAddComment={handleAddComment}
      />
    </div>
  );
}
