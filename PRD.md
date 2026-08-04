# Product Requirements Document (PRD)

# Internal Operations Management System (IOMS)

**Version:** 1.0  
**Status:** Draft

## 1. Product Overview

### Purpose
Develop a centralized web application that helps the organization manage client information, infrastructure assets, project credentials, domain/server lifecycle, and internal utilities from a single dashboard.

## 2. Problem Statement

Current information such as client details, billing, assets, credentials, domains, and servers is scattered across spreadsheets and documents, causing missed renewals, lost credentials, and poor visibility.

## 3. Goals

- Centralize client information
- Track servers and domains
- Store project credentials securely
- Generate short URLs and QR codes
- Send renewal reminders
- Support both client and internal resources

## 4. User Roles

| Role | Responsibilities |
|------|------------------|
| Admin | Full access |
| Project Manager | Manage clients and projects |
| Developer | View assigned assets and credentials |
| Accounts | Billing management |
| Operations | Domain/server management |

## 5. Modules

### Client Management
- Client profile
- Multiple projects
- Billing
- Assets
- Login credentials

Client fields:
- Name
- Company
- Contact Person
- Email
- Phone
- Address
- Status
- Notes

### Project Management
Fields:
- Project Name
- Description
- Technology
- Start Date
- End Date
- Status
- Project Manager

#### Billing
- Billing Type
- Amount
- Currency
- Due Date
- Payment Status
- Invoice Number

#### Assets
- Git Repository
- Production URL
- Staging URL
- Documentation
- Database
- API Collection
- Design Files

#### Credentials
- Portal Name
- Username
- Password (Encrypted)
- Notes

### Server Management
Fields:
- Server Name
- Provider
- IP Address
- Purchase Date
- Expiry Date
- Renewal Cost
- Renewal Frequency
- Status

### Domain Management
Fields:
- Domain
- Registrar
- Purchase Date
- Expiration Date
- SSL Expiration
- Renewal Cost
- DNS Provider
- Auto Renewal

### Reminder Module
Automatic reminders:
- 90 days
- 60 days
- 30 days
- 15 days
- 7 days
- 3 days
- 1 day

Notification Channels:
- Dashboard
- Email
- Teams/Slack (Future)

### URL Shortener
- Create Short URL
- Custom Alias
- Expiry Date
- Click Analytics
- QR Code
- Download QR

### QR Code Generator
Generate QR Codes for:
- URLs
- Text
- Email
- Phone
- Wi-Fi

Download:
- PNG
- SVG

## Internal Resources

Resources may optionally belong to a client.

Examples:
- Company Website
- Internal Server
- HR Portal
- Internal APIs
- Office Domains

## Relationships

```text
Client
├── Projects
│   ├── Billing
│   ├── Assets
│   └── Credentials
├── Domains
├── Servers
└── Short URLs

Internal
├── Domains
├── Servers
├── Short URLs
└── QR Codes
```

## Dashboard
- Total Clients
- Active Projects
- Domains Expiring Soon
- Servers Expiring Soon
- Pending Billing
- Recent Activities
- URL Analytics

## Search
Global search across:
- Clients
- Projects
- Domains
- Servers
- Billing
- URLs

## Security
- RBAC
- Encrypted credentials
- Audit logs
- Session timeout
- Login history
- 2FA (Future)

## Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| Performance | <3 sec dashboard load |
| Availability | 99.9% uptime |
| Scalability | 10,000+ records |
| Backup | Daily |
| Security | Encryption at rest & transit |

## Future Enhancements
- Document management
- Task management
- Ticketing
- Calendar integration
- Cloud provider integrations
- Mobile application

## Suggested Tech Stack

- React + TypeScript
- Node.js (Express/NestJS)
- MySQL
- Prisma ORM
- JWT Authentication
