import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Building2,
  FolderKanban,
  Server,
  Globe,
  Mail,
  User,
  MapPin,
  Star,
  Clock,
  KeyRound,
  CreditCard,
  Eye,
  FolderOpen,
} from "lucide-react";
import PageWrapper from "@/components/ui/PageWrapper";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import StatusPill from "@/components/ui/StatusPill";
import { Card } from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import ClientFormModal from "@/components/ClientFormModal";
import { cn } from "@/utils/cn";
import { clientsApi, type Client } from "@/api/clients";
import type { PaginationMeta } from "@/types";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} mins ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs} hrs ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 30) return `${diffDays} days ago`;
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths} months ago`;
}

function RenewalBadge({ days }: { days: number | null }) {
  if (days === null) return null;

  let colorClass = "bg-green-50 text-green-700 border-green-200";
  if (days <= 7) colorClass = "bg-red-50 text-red-700 border-red-200";
  else if (days <= 15) colorClass = "bg-amber-50 text-amber-700 border-amber-200";
  else if (days <= 30) colorClass = "bg-orange-50 text-orange-700 border-orange-200";

  return (
    <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border", colorClass)}>
      <Clock className="w-3 h-3" />
      Renewal in {days} Days
    </span>
  );
}

function FadeDivider() {
  return <div className="mx-4 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />;
}

function ClientCard({ client }: { client: Client }) {
  const navigate = useNavigate();
  const [isStarred, setIsStarred] = useState(false);

  return (
    <Card
      onClick={() => navigate(`/clients/${client.id}`)}
      className="overflow-hidden hover:shadow-lg hover:border-indigo-200 transition-all duration-200 h-full flex flex-col cursor-pointer group"
    >
      {/* Header + Contact */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center shrink-0 shadow-sm">
              <span className="text-xs font-bold text-white">{getInitials(client.name)}</span>
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate group-hover:text-indigo-600 transition-colors">{client.name}</h3>
              <p className="text-xs text-gray-500 mt-0.5 truncate">{client.company}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <StatusPill status={client.status} />
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsStarred(!isStarred); }}
              className="p-1 rounded-md hover:bg-gray-100 transition-colors"
            >
              <Star className={cn("w-3.5 h-3.5", isStarred ? "fill-amber-400 text-amber-400" : "text-gray-300")} />
            </button>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2 text-gray-600">
            <User className="w-3 h-3 text-gray-400 shrink-0" />
            <span className="truncate">{client.contactPerson}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Mail className="w-3 h-3 text-gray-400 shrink-0" />
            <span className="truncate">{client.email}</span>
          </div>
          {client.address && (
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
              <span className="truncate">{client.address}</span>
            </div>
          )}
        </div>
      </div>

      <FadeDivider />

      {/* Retainer Value & Active Services KPI Cards */}
      <div className="px-4 py-3">
        <div className="grid grid-cols-2 gap-2.5">
          <div
            onClick={(e) => { e.stopPropagation(); navigate(`/clients/${client.id}`); }}
            className="bg-gray-50 hover:bg-blue-50/80 transition-all rounded-lg px-2.5 py-2 cursor-pointer group/kpi border border-transparent hover:border-blue-200"
          >
            <p className="text-[9px] font-medium text-gray-500 uppercase tracking-wider mb-0.5 group-hover/kpi:text-blue-600">Retainer Value</p>
            <div className="flex items-baseline gap-0.5">
              <span className="text-base font-bold text-gray-900 group-hover/kpi:text-blue-700">₹{(client.totalBilling ?? 0).toLocaleString("en-IN")}</span>
              <span className="text-[9px] text-gray-500">/mo</span>
            </div>
          </div>
          <div
            onClick={(e) => { e.stopPropagation(); navigate(`/clients/${client.id}`); }}
            className="bg-gray-50 hover:bg-green-50/80 transition-all rounded-lg px-2.5 py-2 cursor-pointer group/kpi border border-transparent hover:border-green-200"
          >
            <p className="text-[9px] font-medium text-gray-500 uppercase tracking-wider mb-0.5 group-hover/kpi:text-green-600">Active Services</p>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-bold text-gray-900 group-hover/kpi:text-green-700">{client.activeServices ?? 0}</span>
              <span className="text-[10px] text-green-600 font-medium">Active</span>
            </div>
          </div>
        </div>
      </div>

      <FadeDivider />

      {/* Resource Counts KPI Items */}
      <div className="px-4 py-3">
        <div className="grid grid-cols-4 gap-1.5">
          <div
            onClick={(e) => { e.stopPropagation(); navigate(`/clients/${client.id}`); }}
            className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
          >
            <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center shrink-0">
              <Globe className="w-3 h-3 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-900 leading-none">{client._count?.domains ?? 0}</p>
              <p className="text-[9px] text-gray-500 mt-0.5">Domains</p>
            </div>
          </div>
          <div
            onClick={(e) => { e.stopPropagation(); navigate(`/clients/${client.id}`); }}
            className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-violet-50 transition-colors cursor-pointer"
          >
            <div className="w-6 h-6 rounded-md bg-violet-50 flex items-center justify-center shrink-0">
              <Server className="w-3 h-3 text-violet-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-900 leading-none">{client._count?.servers ?? 0}</p>
              <p className="text-[9px] text-gray-500 mt-0.5">Servers</p>
            </div>
          </div>
          <div
            onClick={(e) => { e.stopPropagation(); navigate(`/clients/${client.id}`); }}
            className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer"
          >
            <div className="w-6 h-6 rounded-md bg-emerald-50 flex items-center justify-center shrink-0">
              <FolderKanban className="w-3 h-3 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-900 leading-none">{client._count?.projects ?? 0}</p>
              <p className="text-[9px] text-gray-500 mt-0.5">Projects</p>
            </div>
          </div>
          <div
            onClick={(e) => { e.stopPropagation(); navigate(`/clients/${client.id}`); }}
            className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-amber-50 transition-colors cursor-pointer"
          >
            <div className="w-6 h-6 rounded-md bg-amber-50 flex items-center justify-center shrink-0">
              <FolderOpen className="w-3 h-3 text-amber-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-900 leading-none">{client.assetCount ?? 0}</p>
              <p className="text-[9px] text-gray-500 mt-0.5">Assets</p>
            </div>
          </div>
        </div>
      </div>

      <FadeDivider />

      {/* Tech Tags + Renewal & Updated */}
      <div className="px-4 py-3 space-y-2">
        <div className="flex flex-wrap items-center gap-1">
          {(client.technologies ?? []).slice(0, 2).map((tech) => (
            <span key={tech} className="inline-flex items-center px-1.5 py-0.5 rounded bg-gray-100 text-[10px] font-medium text-gray-600 border border-gray-200">
              {tech}
            </span>
          ))}
          {(client.technologies?.length ?? 0) > 2 && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-indigo-50 text-[10px] font-medium text-indigo-600 border border-indigo-200">
              +{client.technologies!.length - 2} More
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[10px] text-gray-400">Updated {timeAgo(client.updatedAt)}</span>
          <RenewalBadge days={client.daysUntilRenewal ?? null} />
        </div>
      </div>

      {/* Action Buttons: View Profile, Credentials, Billing (Edit Client removed) */}
      <div className="mt-auto">
        <FadeDivider />
        <div className="grid grid-cols-3 divide-x divide-gray-100">
          <button
            onClick={() => navigate(`/clients/${client.id}`)}
            className="flex flex-col items-center gap-0.5 py-2.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="text-[9px] font-medium">View Profile</span>
          </button>
          <button
            onClick={() => navigate(`/clients/${client.id}`)}
            className="flex flex-col items-center gap-0.5 py-2.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span className="text-[9px] font-medium">Credentials</span>
          </button>
          <button
            onClick={() => navigate(`/clients/${client.id}`)}
            className="flex flex-col items-center gap-0.5 py-2.5 text-gray-500 hover:text-green-600 hover:bg-green-50 transition-colors"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span className="text-[9px] font-medium">Billing</span>
          </button>
        </div>
      </div>
    </Card>
  );
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const res = await clientsApi.list({ page, pageSize: 12, search, status: statusFilter });
      if (res.data.success && res.data.data) {
        setClients(res.data.data);
        if (res.data.pagination) setPagination(res.data.pagination);
      } else {
        setClients([]);
      }
    } catch (err) {
      console.error("Failed to fetch clients:", err);
      setClients([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [page, search, statusFilter]);

  return (
    <PageWrapper>
      <PageHeader
        title="Clients"
        description="Manage your client information"
        action={
          <Link to="/clients/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Client
            </Button>
          </Link>
        }
      />

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search clients..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <Skeleton className="h-10 rounded-lg" />
                <Skeleton className="h-10 rounded-lg" />
                <Skeleton className="h-10 rounded-lg" />
              </div>
              <Skeleton className="h-6 w-32 rounded-full mb-3" />
              <Skeleton className="h-12 rounded-lg" />
            </Card>
          ))}
        </div>
      ) : clients.length === 0 ? (
        <Card className="p-12 text-center">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No clients found</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {clients.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {((pagination.page - 1) * pagination.pageSize) + 1} to {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total}
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
            <Button variant="secondary" size="sm" disabled={page === pagination.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </div>
      )}

      <ClientFormModal
        isOpen={!!editingClient}
        onClose={() => setEditingClient(null)}
        client={editingClient}
        onSuccess={fetchClients}
      />
    </PageWrapper>
  );
}
