import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Plus,
  Search,
  Server,
  Globe,
  Building2,
  Copy,
  Clock,
  Eye,
  Edit,
  Terminal,
  CreditCard,
  FolderGit2,
  X,
} from "lucide-react";
import PageWrapper from "@/components/ui/PageWrapper";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import StatusPill from "@/components/ui/StatusPill";
import { Card } from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import ServerFormModal from "@/components/ServerFormModal";
import { serversApi, type Server as ServerType } from "@/api/servers";
import { clientsApi, type Client } from "@/api/clients";
import { projectsApi, type Project } from "@/api/projects";
import type { PaginationMeta } from "@/types";
import { useToastStore } from "@/store/toastStore";
import { cn } from "@/utils/cn";

function getDaysUntil(dateStr: string | undefined): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function FadeDivider() {
  return <div className="mx-4 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />;
}

function ServerCardItem({
  server,
  onEdit,
}: {
  server: ServerType;
  onEdit: (server: ServerType) => void;
}) {
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);
  const days = getDaysUntil(server.expiryDate);

  const handleCopyIP = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (server.ipAddress) {
      navigator.clipboard.writeText(server.ipAddress);
      addToast("IP Address copied to clipboard!", "success");
    }
  };

  return (
    <Card
      onClick={() => navigate(`/servers/${server.id}`)}
      className="overflow-hidden hover:shadow-lg hover:border-indigo-200 transition-all duration-200 h-full flex flex-col cursor-pointer group"
    >
      {/* Header + Provider */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
              <Server className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate group-hover:text-indigo-600 transition-colors">
                {server.name}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5 truncate">{server.provider || "Cloud Server"}</p>
            </div>
          </div>
          <div className="shrink-0">
            <StatusPill status={server.status} />
          </div>
        </div>

        {/* IP Address & Client/Project details */}
        <div className="space-y-1.5 text-xs">
          {server.ipAddress ? (
            <div className="flex items-center justify-between text-gray-700 bg-gray-50 px-2.5 py-1.5 rounded-md border border-gray-100">
              <div className="flex items-center gap-2 font-mono text-xs font-semibold">
                <Globe className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>{server.ipAddress}</span>
              </div>
              <button
                onClick={handleCopyIP}
                className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                title="Copy IP Address"
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-400 font-mono">
              <Globe className="w-3 h-3 text-gray-300 shrink-0" />
              <span>No IP Address</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 text-gray-600 pt-0.5">
            <div className="flex items-center gap-1.5 truncate">
              <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="truncate font-medium">{server.client?.name || "Unassigned Client"}</span>
            </div>
            {server.project?.name && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 shrink-0">
                <FolderGit2 className="w-3 h-3 text-indigo-500" />
                {server.project.name}
              </span>
            )}
          </div>
        </div>
      </div>

      <FadeDivider />

      {/* Renewal Cost & Expiry KPI Box Grid */}
      <div className="px-4 py-3">
        <div className="grid grid-cols-2 gap-2.5">
          {/* Renewal Cost KPI */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/servers/${server.id}`);
            }}
            className="bg-gray-50 hover:bg-blue-50/80 transition-all rounded-lg px-2.5 py-2 cursor-pointer group/kpi border border-transparent hover:border-blue-200"
          >
            <p className="text-[9px] font-medium text-gray-500 uppercase tracking-wider mb-0.5 group-hover/kpi:text-blue-600 flex items-center gap-1">
              <CreditCard className="w-2.5 h-2.5" /> Renewal Cost
            </p>
            <div className="flex items-baseline gap-0.5">
              <span className="text-sm font-bold text-gray-900 group-hover/kpi:text-blue-700">
                {server.renewalCost ? `₹${Number(server.renewalCost).toLocaleString("en-IN")}` : "—"}
              </span>
              {server.renewalFrequency && (
                <span className="text-[9px] text-gray-500">/{server.renewalFrequency.slice(0, 3)}</span>
              )}
            </div>
          </div>

          {/* Expiry Days KPI */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/servers/${server.id}`);
            }}
            className={cn(
              "bg-gray-50 transition-all rounded-lg px-2.5 py-2 cursor-pointer group/kpi border border-transparent",
              days !== null && days <= 30
                ? "hover:bg-red-50/80 hover:border-red-200"
                : "hover:bg-amber-50/80 hover:border-amber-200"
            )}
          >
            <p
              className={cn(
                "text-[9px] font-medium uppercase tracking-wider mb-0.5 flex items-center gap-1",
                days !== null && days <= 30
                  ? "text-red-500 group-hover/kpi:text-red-600"
                  : "text-gray-500 group-hover/kpi:text-amber-600"
              )}
            >
              <Clock className="w-2.5 h-2.5" /> Expiry Status
            </p>
            <div className="flex items-baseline gap-1">
              <span
                className={cn(
                  "text-sm font-bold",
                  days !== null && days <= 30
                    ? "text-red-600"
                    : "text-gray-900 group-hover/kpi:text-amber-700"
                )}
              >
                {days !== null ? (days <= 0 ? "Expired" : `${days}d`) : "—"}
              </span>
              <span className="text-[9px] text-gray-400 font-medium">
                {days !== null && days > 0 ? "remaining" : ""}
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
            onClick={() => navigate(`/servers/${server.id}`)}
            className="flex flex-col items-center gap-0.5 py-2.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="text-[9px] font-medium">View Details</span>
          </button>
          <button
            onClick={handleCopyIP}
            className="flex flex-col items-center gap-0.5 py-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="text-[9px] font-medium">Copy IP</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(server);
            }}
            className="flex flex-col items-center gap-0.5 py-2.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
          >
            <Edit className="w-3.5 h-3.5" />
            <span className="text-[9px] font-medium">Edit Server</span>
          </button>
        </div>
      </div>
    </Card>
  );
}

export default function ServersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const clientIdParam = searchParams.get("clientId") || "";
  const projectIdParam = searchParams.get("projectId") || "";

  const [servers, setServers] = useState<ServerType[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedClientId, setSelectedClientId] = useState(clientIdParam);
  const [selectedProjectId, setSelectedProjectId] = useState(projectIdParam);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<ServerType | null>(null);

  useEffect(() => {
    clientsApi
      .list({ pageSize: 100 })
      .then((res) => {
        if (res.data.success && res.data.data) {
          setClients(res.data.data);
        }
      })
      .catch(console.error);

    projectsApi
      .list({ pageSize: 1000 })
      .then((res) => {
        if (res.data.success && res.data.data) {
          setProjects(res.data.data);
        }
      })
      .catch(console.error);
  }, []);

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

  const fetchServers = async () => {
    setIsLoading(true);
    try {
      const res = await serversApi.list({
        page,
        pageSize: 12,
        search,
        status: statusFilter,
        clientId: selectedClientId || undefined,
        projectId: selectedProjectId || undefined,
      });
      if (res.data.success && res.data.data) {
        setServers(res.data.data);
        if (res.data.pagination) setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error("Failed to fetch servers:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServers();
  }, [page, search, statusFilter, selectedClientId, selectedProjectId]);

  const selectedProjectObj = projects.find((p) => p.id === selectedProjectId);
  const selectedClientObj = clients.find((c) => c.id === selectedClientId);

  const clearProjectFilter = () => {
    setSelectedProjectId("");
    setPage(1);
    if (selectedClientId) {
      setSearchParams({ clientId: selectedClientId });
    } else {
      setSearchParams({});
    }
  };

  return (
    <PageWrapper>
      <PageHeader
        title="Servers"
        description="Manage your infrastructure servers across all clients and application services"
        action={
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Server
          </Button>
        }
      />

      {/* Active Project Filter Context Banner */}
      {selectedProjectId && selectedProjectObj && (
        <div className="bg-indigo-50/90 border border-indigo-100 rounded-xl px-4 py-2.5 mb-4 flex items-center justify-between shadow-2xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-xs font-medium text-indigo-900">
            <FolderGit2 className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              Showing servers for project: <strong className="font-semibold text-indigo-950">{selectedProjectObj.name}</strong>
              {selectedClientObj && <span className="text-indigo-600 text-[11px] ml-1">({selectedClientObj.name})</span>}
            </span>
          </div>
          <button
            onClick={clearProjectFilter}
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900 hover:bg-indigo-100/70 px-2 py-1 rounded-lg transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear Project Filter</span>
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search servers by name, provider, IP..."
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

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="EXPIRING_SOON">Expiring Soon</option>
              <option value="EXPIRED">Expired</option>
              <option value="DECOMMISSIONED">Decommissioned</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-5">
              <Skeleton className="h-5 w-40 mb-3" />
              <Skeleton className="h-4 w-28 mb-4" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </Card>
          ))}
        </div>
      ) : servers.length === 0 ? (
        <Card className="p-12 text-center">
          <Server className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No servers found</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {servers.map((server) => (
            <ServerCardItem key={server.id} server={server} onEdit={(s) => setEditingServer(s)} />
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
      <ServerFormModal
        isOpen={isAddOpen || !!editingServer}
        server={editingServer}
        lockedClientId={isAddOpen && selectedProjectId ? selectedClientId : undefined}
        lockedProjectId={isAddOpen ? selectedProjectId : undefined}
        onClose={() => {
          setIsAddOpen(false);
          setEditingServer(null);
        }}
        onSuccess={() => fetchServers()}
      />
    </PageWrapper>
  );
}
