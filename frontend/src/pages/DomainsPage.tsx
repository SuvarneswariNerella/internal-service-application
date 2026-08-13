import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Plus,
  Search,
  Globe,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  Building2,
  Lock,
  Clock,
  Eye,
  Edit,
  FolderGit2,
} from "lucide-react";
import PageWrapper from "@/components/ui/PageWrapper";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import DomainFormModal from "@/components/DomainFormModal";
import { domainsApi, type Domain } from "@/api/domains";
import { clientsApi, type Client } from "@/api/clients";
import { projectsApi, type Project } from "@/api/projects";
import type { PaginationMeta } from "@/types";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { cn } from "@/utils/cn";

function getDaysUntil(dateStr: string | undefined): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function FadeDivider() {
  return <div className="mx-4 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />;
}

function DomainCardItem({
  domain,
  onEdit,
}: {
  domain: Domain;
  onEdit: (domain: Domain) => void;
}) {
  const navigate = useNavigate();
  const domainDays = getDaysUntil(domain.expirationDate);
  const sslDays = getDaysUntil(domain.sslExpiration);
  const websiteUrl = domain.domain.startsWith("http") ? domain.domain : `https://${domain.domain}`;

  return (
    <Card
      onClick={() => navigate(`/domains/${domain.id}`)}
      className="overflow-hidden hover:shadow-lg hover:border-indigo-200 transition-all duration-200 h-full flex flex-col cursor-pointer group"
    >
      {/* Header + Registrar */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate group-hover:text-indigo-600 transition-colors">
                  {domain.domain}
                </h3>
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-1 rounded text-gray-400 hover:text-indigo-600 transition-colors shrink-0"
                  title={`Open ${domain.domain} in new tab`}
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-xs text-gray-500 mt-0.5 truncate">{domain.registrar || "Domain Registrar"}</p>
            </div>
          </div>

          <div className="shrink-0">
            {domain.autoRenewal ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                <ToggleRight className="w-3.5 h-3.5 text-green-600" />
                Auto ON
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500 border border-gray-200">
                <ToggleLeft className="w-3.5 h-3.5 text-gray-400" />
                Auto OFF
              </span>
            )}
          </div>
        </div>

        {/* DNS & Client Info */}
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2 text-gray-600">
            <Globe className="w-3 h-3 text-gray-400 shrink-0" />
            <span className="truncate">{domain.dnsProvider || "Standard DNS"}</span>
          </div>
          <div className="flex items-center justify-between gap-2 text-gray-600">
            <div className="flex items-center gap-1.5 truncate">
              <Building2 className="w-3 h-3 text-gray-400 shrink-0" />
              <span className="truncate">{domain.client?.name || "Unassigned Client"}</span>
            </div>
            {domain.project?.name && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 shrink-0">
                <FolderGit2 className="w-3 h-3 text-indigo-500" />
                {domain.project.name}
              </span>
            )}
          </div>
        </div>
      </div>

      <FadeDivider />

      {/* Domain Expiry & SSL Security KPI Grid */}
      <div className="px-4 py-3">
        <div className="grid grid-cols-2 gap-2.5">
          {/* Domain Expiry KPI */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/domains/${domain.id}`);
            }}
            className={cn(
              "bg-gray-50 transition-all rounded-lg px-2.5 py-2 cursor-pointer group/kpi border border-transparent",
              domainDays !== null && domainDays <= 30
                ? "hover:bg-red-50/80 hover:border-red-200"
                : "hover:bg-blue-50/80 hover:border-blue-200"
            )}
          >
            <p
              className={cn(
                "text-[9px] font-medium uppercase tracking-wider mb-0.5 flex items-center gap-1",
                domainDays !== null && domainDays <= 30
                  ? "text-red-500 group-hover/kpi:text-red-600"
                  : "text-gray-500 group-hover/kpi:text-blue-600"
              )}
            >
              <Clock className="w-2.5 h-2.5" /> Domain Expiry
            </p>
            <div className="flex items-baseline gap-1">
              <span
                className={cn(
                  "text-sm font-bold",
                  domainDays !== null && domainDays <= 30
                    ? "text-red-600"
                    : "text-gray-900 group-hover/kpi:text-blue-700"
                )}
              >
                {domainDays !== null ? (domainDays <= 0 ? "Expired" : `${domainDays}d`) : "—"}
              </span>
              <span className="text-[9px] text-gray-400 font-medium">
                {domainDays !== null && domainDays > 0 ? "remaining" : ""}
              </span>
            </div>
          </div>

          {/* SSL Security KPI */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/domains/${domain.id}`);
            }}
            className={cn(
              "bg-gray-50 transition-all rounded-lg px-2.5 py-2 cursor-pointer group/kpi border border-transparent",
              sslDays !== null && sslDays <= 30
                ? "hover:bg-red-50/80 hover:border-red-200"
                : "hover:bg-emerald-50/80 hover:border-emerald-200"
            )}
          >
            <p
              className={cn(
                "text-[9px] font-medium uppercase tracking-wider mb-0.5 flex items-center gap-1",
                sslDays !== null && sslDays <= 30
                  ? "text-red-500 group-hover/kpi:text-red-600"
                  : "text-gray-500 group-hover/kpi:text-emerald-600"
              )}
            >
              <Lock className="w-2.5 h-2.5" /> SSL Security
            </p>
            <div className="flex items-baseline gap-1">
              <span
                className={cn(
                  "text-sm font-bold",
                  sslDays !== null && sslDays <= 30
                    ? "text-red-600"
                    : "text-gray-900 group-hover/kpi:text-emerald-700"
                )}
              >
                {sslDays !== null ? (sslDays <= 0 ? "Expired" : `${sslDays}d`) : "—"}
              </span>
              <span className="text-[9px] text-gray-400 font-medium">
                {sslDays !== null && sslDays > 0 ? "active" : ""}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer Grid (Matching Client Card) */}
      <div className="mt-auto">
        <FadeDivider />
        <div className="grid grid-cols-3 divide-x divide-gray-100">
          <button
            onClick={() => navigate(`/domains/${domain.id}`)}
            className="flex flex-col items-center gap-0.5 py-2.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="text-[9px] font-medium">View Details</span>
          </button>
          <a
            href={websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex flex-col items-center gap-0.5 py-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="text-[9px] font-medium">Open Web</span>
          </a>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(domain);
            }}
            className="flex flex-col items-center gap-0.5 py-2.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
          >
            <Edit className="w-3.5 h-3.5" />
            <span className="text-[9px] font-medium">Edit Domain</span>
          </button>
        </div>
      </div>
    </Card>
  );
}

export default function DomainsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const clientIdParam = searchParams.get("clientId") || "";
  const projectIdParam = searchParams.get("projectId") || "";

  const [domains, setDomains] = useState<Domain[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [search, setSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState(clientIdParam);
  const [selectedProjectId, setSelectedProjectId] = useState(projectIdParam);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const { globalWorkspaceId } = useWorkspaceStore();
  const [editingDomain, setEditingDomain] = useState<Domain | null>(null);

  useEffect(() => {
    clientsApi
      .list({ 
        pageSize: 100,
        workspaceId: globalWorkspaceId === "all" ? undefined : globalWorkspaceId
      })
      .then((res) => {
        if (res.data.success && res.data.data) {
          setClients(res.data.data);
        }
      })
      .catch(console.error);

    projectsApi
      .list({ 
        pageSize: 1000,
        workspaceId: globalWorkspaceId === "all" ? undefined : globalWorkspaceId
      })
      .then((res) => {
        if (res.data.success && res.data.data) {
          setProjects(res.data.data);
        }
      })
      .catch(console.error);
  }, [globalWorkspaceId]);

  useEffect(() => {
    setSelectedClientId(clientIdParam);
  }, [clientIdParam]);

  useEffect(() => {
    setSelectedProjectId(projectIdParam);
  }, [projectIdParam]);

  const filteredProjects = selectedClientId
    ? projects.filter((p) => p.clientId === selectedClientId)
    : projects;

  const handleClientFilterChange = (newClientId: string) => {
    setSelectedClientId(newClientId);
    setSelectedProjectId("");
    setPage(1);
    const newParams: Record<string, string> = {};
    if (newClientId) newParams.clientId = newClientId;
    setSearchParams(newParams);
  };

  const handleProjectFilterChange = (newProjectId: string) => {
    setSelectedProjectId(newProjectId);
    setPage(1);
    const newParams: Record<string, string> = {};
    if (selectedClientId) newParams.clientId = selectedClientId;
    if (newProjectId) newParams.projectId = newProjectId;
    setSearchParams(newParams);
  };

  const fetchDomains = async () => {
    setIsLoading(true);
    try {
      const res = await domainsApi.list({
        page,
        pageSize: 12,
        search,
        clientId: selectedClientId || undefined,
        projectId: selectedProjectId || undefined,
        workspaceId: globalWorkspaceId === "all" ? undefined : globalWorkspaceId,
      });
      if (res.data.success && res.data.data) {
        setDomains(res.data.data);
        if (res.data.pagination) setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDomains();
  }, [page, search, selectedClientId, selectedProjectId, globalWorkspaceId]);

  return (
    <PageWrapper>
      <PageHeader
        title="Domains"
        description="Manage your domain names across all clients and application services"
        icon={<Globe className="w-5 h-5" />}
        action={
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Domain
          </Button>
        }
      />

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search domains by name, registrar, DNS..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex flex-wrap sm:flex-nowrap gap-3">
            <select
              value={selectedClientId}
              onChange={(e) => handleClientFilterChange(e.target.value)}
              className="h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">All Clients (Full Application)</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.company})
                </option>
              ))}
            </select>

            <select
              value={selectedProjectId}
              onChange={(e) => handleProjectFilterChange(e.target.value)}
              className="h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">All Projects</option>
              {filteredProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-5">
              <Skeleton className="h-5 w-40 mb-3" />
              <Skeleton className="h-4 w-28" />
            </Card>
          ))}
        </div>
      ) : domains.length === 0 ? (
        <Card className="p-12 text-center">
          <Globe className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No domains found</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {domains.map((domain) => (
            <DomainCardItem key={domain.id} domain={domain} onEdit={(d) => setEditingDomain(d)} />
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {(pagination.page - 1) * pagination.pageSize + 1} to{" "}
            {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total}
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page === pagination.totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Add / Edit Modals */}
      <DomainFormModal
        isOpen={isAddOpen || !!editingDomain}
        domain={editingDomain}
        onClose={() => {
          setIsAddOpen(false);
          setEditingDomain(null);
        }}
        onSuccess={() => fetchDomains()}
      />
    </PageWrapper>
  );
}
