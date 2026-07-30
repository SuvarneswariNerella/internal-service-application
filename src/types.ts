export type StatusType = 'Approved' | 'Pending' | 'Rejected' | 'Reimbursed';

export interface ReportItem {
  id: string;
  reportNumber: string;
  submitter: {
    name: string;
    email: string;
    avatar: string;
    role: string;
  };
  reportName: string;
  category: string;
  dateRange: string;
  submittedDate: string;
  status: StatusType;
  approver: {
    name: string;
    avatar: string;
    title: string;
  };
  total: number;
  expensesCount: number;
  description: string;
  comments: Array<{
    id: string;
    author: string;
    avatar: string;
    text: string;
    timestamp: string;
  }>;
}

export type TabType = 'All' | 'Awaiting Approval' | 'Awaiting Reimbursement' | 'Reimbursed';

export type NavItem = 'Dashboard' | 'Trips' | 'Reports' | 'Advances' | 'Corporate Cards' | 'Budgets' | 'Analytics' | 'Settings';

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  unread: boolean;
  type: 'approval' | 'reimbursement' | 'comment' | 'submission';
}
