import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import Layout from "@/components/layout/Layout";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import ClientsPage from "@/pages/ClientsPage";
import ClientDetailPage from "@/pages/ClientDetailPage";
import ClientCreatePage from "@/pages/ClientCreatePage";
import ProjectsPage from "@/pages/ProjectsPage";
import ProjectDetailPage from "@/pages/ProjectDetailPage";
import ProjectCreatePage from "@/pages/ProjectCreatePage";
import ServersPage from "@/pages/ServersPage";
import ServerDetailPage from "@/pages/ServerDetailPage";
import ServerCreatePage from "@/pages/ServerCreatePage";
import DomainsPage from "@/pages/DomainsPage";
import DomainDetailPage from "@/pages/DomainDetailPage";
import DomainCreatePage from "@/pages/DomainCreatePage";
import RemindersPage from "@/pages/RemindersPage";
import UrlsPage from "@/pages/UrlsPage";
import UrlCreatePage from "@/pages/UrlCreatePage";
import UrlDetailPage from "@/pages/UrlDetailPage";
import QrCodesPage from "@/pages/QrCodesPage";
import QrCodeCreatePage from "@/pages/QrCodeCreatePage";
import QrCodeDetailPage from "@/pages/QrCodeDetailPage";
import FinancePage from "@/pages/FinancePage";
import AuditLogsPage from "@/pages/AuditLogsPage";
import PlaceholderPage from "@/pages/PlaceholderPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="clients/new" element={<ClientCreatePage />} />
        <Route path="clients/:id" element={<ClientDetailPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/new" element={<ProjectCreatePage />} />
        <Route path="projects/:id" element={<ProjectDetailPage />} />
        <Route path="servers" element={<ServersPage />} />
        <Route path="servers/new" element={<ServerCreatePage />} />
        <Route path="servers/:id" element={<ServerDetailPage />} />
        <Route path="domains" element={<DomainsPage />} />
        <Route path="domains/new" element={<DomainCreatePage />} />
        <Route path="domains/:id" element={<DomainDetailPage />} />
        <Route path="finance" element={<FinancePage />} />
        <Route path="reminders" element={<RemindersPage />} />
        <Route path="urls" element={<UrlsPage />} />
        <Route path="urls/new" element={<UrlCreatePage />} />
        <Route path="urls/:id" element={<UrlDetailPage />} />
        <Route path="qr-codes" element={<QrCodesPage />} />
        <Route path="qr-codes/new" element={<QrCodeCreatePage />} />
        <Route path="qr-codes/:id" element={<QrCodeDetailPage />} />
        <Route path="audit-logs" element={<AuditLogsPage />} />
        <Route path="settings" element={<PlaceholderPage title="Settings" />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
