import { ReportItem, NotificationItem } from './types';

export const INITIAL_REPORTS: ReportItem[] = [
  {
    id: 'rep-001',
    reportNumber: 'EXP-2024-001',
    submitter: {
      name: 'Eleanor Vance',
      email: 'eleanor.vance@expinova.io',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      role: 'Senior Product Manager'
    },
    reportName: 'Trip to New York - Tech Summit 2024',
    category: 'Business Travel',
    dateRange: 'Apr 12 - Apr 18, 2024',
    submittedDate: 'Apr 19, 2024',
    status: 'Pending',
    approver: {
      name: 'Jayson Tatum',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      title: 'VP of Product'
    },
    total: 124500,
    expensesCount: 14,
    description: 'Conference passes, executive hotel suite stays, client dinners at Manhattan, and flights for 5 product team leads.',
    comments: [
      {
        id: 'c-1',
        author: 'Jayson Tatum',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        text: 'Please ensure all hotel itemized receipts are attached.',
        timestamp: 'Apr 19, 2024 at 2:15 PM'
      },
      {
        id: 'c-2',
        author: 'Eleanor Vance',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        text: 'Itemized hotel receipts updated and attached to the PDF summary.',
        timestamp: 'Apr 19, 2024 at 3:40 PM'
      }
    ]
  },
  {
    id: 'rep-002',
    reportNumber: 'EXP-2024-002',
    submitter: {
      name: 'Marcus Chen',
      email: 'marcus.chen@expinova.io',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      role: 'Global Enterprise Sales Lead'
    },
    reportName: 'Client Visit - Chicago Enterprise Pitch',
    category: 'Sales & Hospitality',
    dateRange: 'Apr 08 - Apr 11, 2024',
    submittedDate: 'Apr 12, 2024',
    status: 'Approved',
    approver: {
      name: 'Sarah Jenkins',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      title: 'Head of Global Sales'
    },
    total: 98200,
    expensesCount: 8,
    description: 'Enterprise client entertainment, private dining room booking, and regional flight accommodations for Q2 contract renewal.',
    comments: [
      {
        id: 'c-3',
        author: 'Sarah Jenkins',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
        text: 'Approved. Great job closing the Midwest contract renewal!',
        timestamp: 'Apr 13, 2024 at 10:00 AM'
      }
    ]
  },
  {
    id: 'rep-003',
    reportNumber: 'EXP-2024-003',
    submitter: {
      name: 'Sophia Rodriguez',
      email: 'sophia.rodriguez@expinova.io',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      role: 'Director of Engineering'
    },
    reportName: 'Team Offsite - Austin Leadership Retreat',
    category: 'Team Building',
    dateRange: 'Apr 02 - Apr 06, 2024',
    submittedDate: 'Apr 07, 2024',
    status: 'Reimbursed',
    approver: {
      name: 'Jayson Tatum',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      title: 'VP of Product'
    },
    total: 165000,
    expensesCount: 22,
    description: 'Annual engineering leadership summit in Austin: resort accommodations, workshop venue rental, catered dinners, and group transit.',
    comments: [
      {
        id: 'c-4',
        author: 'Finance Bot',
        avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
        text: 'Direct deposit payment processed via ACH wire transfer #98421.',
        timestamp: 'Apr 10, 2024 at 9:15 AM'
      }
    ]
  },
  {
    id: 'rep-004',
    reportNumber: 'EXP-2024-004',
    submitter: {
      name: 'David Kim',
      email: 'david.kim@expinova.io',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      role: 'Staff Solutions Architect'
    },
    reportName: 'AWS re:Invent Partner Meeting - Las Vegas',
    category: 'Conferences',
    dateRange: 'Apr 15 - Apr 18, 2024',
    submittedDate: 'Apr 19, 2024',
    status: 'Pending',
    approver: {
      name: 'Sophia Rodriguez',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      title: 'Director of Engineering'
    },
    total: 112000,
    expensesCount: 11,
    description: 'Partner booth sponsorship additions, cloud architecture workshop passes, and executive networking dinners.',
    comments: []
  },
  {
    id: 'rep-005',
    reportNumber: 'EXP-2024-005',
    submitter: {
      name: 'Amara Okeeke',
      email: 'amara.okeeke@expinova.io',
      avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&auto=format&fit=crop&q=80',
      role: 'Head of People & Culture'
    },
    reportName: 'Q2 Global All-Hands & Recruiting Fair - London',
    category: 'HR & Recruiting',
    dateRange: 'Apr 20 - Apr 25, 2024',
    submittedDate: 'Apr 26, 2024',
    status: 'Approved',
    approver: {
      name: 'Jayson Tatum',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      title: 'VP of Product'
    },
    total: 148900,
    expensesCount: 18,
    description: 'London campus hall rental, key European candidate dinners, AV equipment rentals, and trans-Atlantic business class flights.',
    comments: []
  },
  {
    id: 'rep-006',
    reportNumber: 'EXP-2024-006',
    submitter: {
      name: 'Liam O\'Connor',
      email: 'liam.oconnor@expinova.io',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
      role: 'Infrastructure Lead'
    },
    reportName: 'Q1 Data Center Hardware Procurement - San Jose',
    category: 'Equipment & Infrastructure',
    dateRange: 'Apr 01 - Apr 05, 2024',
    submittedDate: 'Apr 06, 2024',
    status: 'Rejected',
    approver: {
      name: 'Sophia Rodriguez',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      title: 'Director of Engineering'
    },
    total: 175400,
    expensesCount: 6,
    description: 'On-site server rack verification, specialized network testing gear, emergency travel, and technician meal stipends.',
    comments: [
      {
        id: 'c-5',
        author: 'Sophia Rodriguez',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
        text: 'Hardware purchases must be routed through the Procurement PO portal rather than employee expense reports.',
        timestamp: 'Apr 08, 2024 at 11:30 AM'
      }
    ]
  },
  {
    id: 'rep-007',
    reportNumber: 'EXP-2024-007',
    submitter: {
      name: 'Clara Oswald',
      email: 'clara.oswald@expinova.io',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      role: 'Regional Marketing Manager'
    },
    reportName: 'European Brand Roadshow - Paris & Berlin',
    category: 'Marketing',
    dateRange: 'Apr 10 - Apr 17, 2024',
    submittedDate: 'Apr 18, 2024',
    status: 'Pending',
    approver: {
      name: 'Sarah Jenkins',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      title: 'Head of Global Sales'
    },
    total: 139800,
    expensesCount: 16,
    description: 'Venue bookings in Paris and Berlin, promotional media production, localized PR agency retainer, and travel.',
    comments: []
  },
  {
    id: 'rep-008',
    reportNumber: 'EXP-2024-008',
    submitter: {
      name: 'Lucas Rossi',
      email: 'lucas.rossi@expinova.io',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
      role: 'Principal Security Analyst'
    },
    reportName: 'Cybersecurity Audit & Compliance Review - DC',
    category: 'Compliance',
    dateRange: 'Apr 03 - Apr 07, 2024',
    submittedDate: 'Apr 08, 2024',
    status: 'Reimbursed',
    approver: {
      name: 'Jayson Tatum',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      title: 'VP of Product'
    },
    total: 89500,
    expensesCount: 7,
    description: 'Washington DC government compliance audit sessions, external auditor consulting stipends, and secure transport.',
    comments: []
  },
  {
    id: 'rep-009',
    reportNumber: 'EXP-2024-009',
    submitter: {
      name: 'Hannah Abbott',
      email: 'hannah.abbott@expinova.io',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: 'UX Research Director'
    },
    reportName: 'Customer Insights Lab - Seattle & Vancouver',
    category: 'Design & Research',
    dateRange: 'Apr 14 - Apr 19, 2024',
    submittedDate: 'Apr 20, 2024',
    status: 'Approved',
    approver: {
      name: 'Jayson Tatum',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      title: 'VP of Product'
    },
    total: 104300,
    expensesCount: 12,
    description: 'Usability testing facility leases, participant honorariums, cross-border high-speed rail passes, and user research software.',
    comments: []
  },
  {
    id: 'rep-010',
    reportNumber: 'EXP-2024-010',
    submitter: {
      name: 'Viktor Krum',
      email: 'viktor.krum@expinova.io',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
      role: 'Nordics Sales Manager'
    },
    reportName: 'Client Renewal Roadshow - Stockholm & Oslo',
    category: 'Sales & Hospitality',
    dateRange: 'Apr 11 - Apr 15, 2024',
    submittedDate: 'Apr 16, 2024',
    status: 'Pending',
    approver: {
      name: 'Sarah Jenkins',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      title: 'Head of Global Sales'
    },
    total: 118600,
    expensesCount: 9,
    description: 'Executive luncheons, Nordic client gifts, regional flights, and hotel accommodations for account team.',
    comments: []
  },
  {
    id: 'rep-011',
    reportNumber: 'EXP-2024-011',
    submitter: {
      name: 'Nadia Patel',
      email: 'nadia.patel@expinova.io',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      role: 'Fintech Operations Lead'
    },
    reportName: 'Banking Partner Integration Summit - Charlotte',
    category: 'Business Operations',
    dateRange: 'Apr 05 - Apr 09, 2024',
    submittedDate: 'Apr 10, 2024',
    status: 'Reimbursed',
    approver: {
      name: 'Jayson Tatum',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      title: 'VP of Product'
    },
    total: 82100,
    expensesCount: 6,
    description: 'Banking partner legal workshops, secure token hardware testing, flight & hotel lodging.',
    comments: []
  },
  {
    id: 'rep-012',
    reportNumber: 'EXP-2024-012',
    submitter: {
      name: 'Gabriel Sterling',
      email: 'gabriel.sterling@expinova.io',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      role: 'Chief Legal Officer'
    },
    reportName: 'M&A Due Diligence - San Francisco',
    category: 'Legal & Executive',
    dateRange: 'Apr 18 - Apr 22, 2024',
    submittedDate: 'Apr 23, 2024',
    status: 'Approved',
    approver: {
      name: 'Jayson Tatum',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      title: 'VP of Product'
    },
    total: 179500,
    expensesCount: 15,
    description: 'Outside counsel retainers, confidential meeting room rentals, air transport, and executive dining.',
    comments: []
  },
  {
    id: 'rep-013',
    reportNumber: 'EXP-2024-013',
    submitter: {
      name: 'Maya Lin',
      email: 'maya.lin@expinova.io',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: 'Design Systems Lead'
    },
    reportName: 'Config 2024 Design Conference - San Francisco',
    category: 'Conferences',
    dateRange: 'Apr 22 - Apr 26, 2024',
    submittedDate: 'Apr 27, 2024',
    status: 'Approved',
    approver: {
      name: 'Sophia Rodriguez',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      title: 'Director of Engineering'
    },
    total: 86400,
    expensesCount: 8,
    description: 'Design conference tickets for 4 designers, team Airbnb lodging, workshops, and transit.',
    comments: []
  },
  {
    id: 'rep-014',
    reportNumber: 'EXP-2024-014',
    submitter: {
      name: 'Ethan Hunt',
      email: 'ethan.hunt@expinova.io',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
      role: 'Field Operations Specialist'
    },
    reportName: 'Emergency Infrastructure Inspection - Denver',
    category: 'Field Operations',
    dateRange: 'Apr 25 - Apr 28, 2024',
    submittedDate: 'Apr 29, 2024',
    status: 'Pending',
    approver: {
      name: 'Sophia Rodriguez',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      title: 'Director of Engineering'
    },
    total: 94100,
    expensesCount: 5,
    description: 'Last-minute flight bookings, 4WD vehicle rentals for mountain site access, specialized gear.',
    comments: []
  }
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n-1',
    title: 'Report Approval Required',
    description: 'Eleanor Vance submitted "Trip to New York" ($124,500) awaiting your approval.',
    timestamp: '10 min ago',
    unread: true,
    type: 'approval'
  },
  {
    id: 'n-2',
    title: 'Report Reimbursed',
    description: 'Sophia Rodriguez report "Team Offsite - Austin" ($165,000) was marked as reimbursed.',
    timestamp: '2 hours ago',
    unread: true,
    type: 'reimbursement'
  },
  {
    id: 'n-3',
    title: 'New Comment on EXP-2024-001',
    description: 'Eleanor Vance added a comment: "Itemized hotel receipts updated..."',
    timestamp: '5 hours ago',
    unread: true,
    type: 'comment'
  },
  {
    id: 'n-4',
    title: 'Report Approved',
    description: 'Marcus Chen report "Client Visit - Chicago" was approved by Sarah Jenkins.',
    timestamp: 'Yesterday',
    unread: false,
    type: 'approval'
  },
  {
    id: 'n-5',
    title: 'Report Submitted',
    description: 'David Kim submitted "AWS re:Invent Partner Meeting" ($112,000).',
    timestamp: '2 days ago',
    unread: false,
    type: 'submission'
  }
];
