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
  Eye,
  Wallet,
  FolderOpen,
} from "lucide-react";
import PageWrapper from "@/components/ui/PageWrapper";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import ClientFormModal from "@/components/ClientFormModal";
import { cn } from "@/utils/cn";
import { clientsApi, type Client } from "@/api/clients";
import type { PaginationMeta } from "@/types";
import { useWorkspaceStore } from "@/store/workspaceStore";

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


function ClientCard({ client }: { client: Client }) {
  const navigate = useNavigate();
  const [isStarred, setIsStarred] = useState(false);

  return (
    <div
      onClick={() => navigate(`/clients/${client.id}`)}
      className="rounded-[20px] bg-white border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] transition-all duration-300 overflow-hidden flex flex-col h-full cursor-pointer group font-sans"
    >
      {/* Top Section - Plain Background */}
      <div className="relative px-4 pt-4 pb-2 bg-transparent">
        {/* Content */}
        <div className="relative z-10">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              {/* Avatar */}
              <div className="w-[42px] h-[42px] bg-[#6145FA] rounded-full flex items-center justify-center shrink-0">
                <span className="text-[16px] font-bold text-white tracking-wide">{getInitials(client.name)}</span>
              </div>
              <div className="flex flex-col min-w-0">
                <h3 className="font-bold text-[#111827] text-[15px] leading-tight tracking-wide truncate">{client.name}</h3>
                <p className="text-[10px] text-gray-500 font-medium tracking-wide mt-0.5 truncate">{client.company}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
              <div className="px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-sm bg-[#B4F7D8] text-[#059669]">
                {client.status.charAt(0).toUpperCase() + client.status.slice(1).toLowerCase()}
              </div>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsStarred(!isStarred); }}
                className="hover:scale-110 transition-transform p-0.5"
              >
                <Star className={cn("w-[18px] h-[18px]", isStarred ? "fill-[#F59E0B] text-[#F59E0B]" : "text-gray-400 opacity-90")} strokeWidth={isStarred ? 2 : 1.5} />
              </button>
            </div>
          </div>

          {/* Contact Details */}
          <div className="mt-3 flex flex-col gap-1">
            <div className="flex items-center gap-2.5 text-gray-600">
              <div className="w-4 h-4 flex items-center justify-center shrink-0 opacity-90">
                <User className="w-[13px] h-[13px]" fill="currentColor" strokeWidth={1} />
              </div>
              <span className="text-[12px] font-medium tracking-wide truncate">{client.contactPerson}</span>
            </div>
            <div className="flex items-center gap-2.5 text-gray-600">
              <div className="w-4 h-4 flex items-center justify-center shrink-0 opacity-90">
                <Mail className="w-[13px] h-[13px]" fill="currentColor" strokeWidth={1} />
              </div>
              <span className="text-[12px] font-medium tracking-wide truncate">{client.email}</span>
            </div>
            {client.address && (
              <div className="flex items-center gap-2.5 text-gray-600">
                <div className="w-4 h-4 flex items-center justify-center shrink-0 opacity-90">
                  <MapPin className="w-[13px] h-[13px]" fill="currentColor" strokeWidth={1} />
                </div>
                <span className="text-[12px] font-medium tracking-wide truncate">{client.address}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-3 flex flex-col gap-3 flex-1">
        {/* Retainer & Active Services */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-xl border border-[#EEF0F8] bg-[#F8F9FE] p-2.5 flex items-start justify-between gap-1.5 group/kpi transition-colors hover:border-[#3B4BE8]/30">
            <div className="flex flex-col min-w-0">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1 truncate">Retainer Value</p>
              <div className="flex items-baseline gap-1 flex-wrap">
                <span className="text-[17px] font-bold text-[#111827] tracking-tight truncate">₹{(client.retainer ?? 0).toLocaleString("en-IN")}</span>
                <span className="text-[11px] font-medium text-gray-500">/mo</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#EEF0F8] bg-[#F8F9FE] p-2.5 flex items-start justify-between gap-1.5 group/kpi transition-colors hover:border-[#10B981]/30">
            <div className="flex flex-col min-w-0">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1 truncate">Active Services</p>
              <div className="flex items-baseline gap-1 flex-wrap">
                <span className="text-[17px] font-bold text-[#111827] tracking-tight truncate">{client.activeServices ?? 0}</span>
                <span className="text-[11px] font-medium text-gray-500">Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Stats */}
        <div className="rounded-xl border border-[#EEF0F8] bg-white p-2.5 grid grid-cols-4 gap-1 w-full">
          <div className="flex flex-col xl:flex-row items-center gap-1.5 justify-center">
            <div className="w-[28px] h-[28px] rounded-[8px] bg-[#EEF2FF] flex items-center justify-center shrink-0">
              <Globe className="w-[13px] h-[13px] text-[#3B4BE8]" />
            </div>
            <div className="flex flex-col items-center xl:items-start text-center xl:text-left">
              <span className="text-[13px] font-bold text-[#111827] leading-none mb-0.5">{client._count?.domains ?? 0}</span>
              <span className="text-[9px] font-medium text-gray-500 leading-none">Domains</span>
            </div>
          </div>

          <div className="flex flex-col xl:flex-row items-center gap-1.5 justify-center">
            <div className="w-[28px] h-[28px] rounded-[8px] bg-[#F3E8FF] flex items-center justify-center shrink-0">
              <Server className="w-[13px] h-[13px] text-[#A855F7]" />
            </div>
            <div className="flex flex-col items-center xl:items-start text-center xl:text-left">
              <span className="text-[13px] font-bold text-[#111827] leading-none mb-0.5">{client._count?.servers ?? 0}</span>
              <span className="text-[9px] font-medium text-gray-500 leading-none">Servers</span>
            </div>
          </div>

          <div className="flex flex-col xl:flex-row items-center gap-1.5 justify-center">
            <div className="w-[28px] h-[28px] rounded-[8px] bg-[#DCFCE7] flex items-center justify-center shrink-0">
              <FolderKanban className="w-[13px] h-[13px] text-[#22C55E]" />
            </div>
            <div className="flex flex-col items-center xl:items-start text-center xl:text-left">
              <span className="text-[13px] font-bold text-[#111827] leading-none mb-0.5">{client._count?.projects ?? 0}</span>
              <span className="text-[9px] font-medium text-gray-500 leading-none">Projects</span>
            </div>
          </div>

          <div className="flex flex-col xl:flex-row items-center gap-1.5 justify-center">
            <div className="w-[28px] h-[28px] rounded-[8px] bg-[#FFEDD5] flex items-center justify-center shrink-0">
              <FolderOpen className="w-[13px] h-[13px] text-[#F97316]" />
            </div>
            <div className="flex flex-col items-center xl:items-start text-center xl:text-left">
              <span className="text-[13px] font-bold text-[#111827] leading-none mb-0.5">{client.assetCount ?? 0}</span>
              <span className="text-[9px] font-medium text-gray-500 leading-none">Assets</span>
            </div>
          </div>
        </div>

        {/* Tags Row */}
        <div className="flex flex-wrap items-center gap-2 mt-1 mb-2">
          {(client.technologies ?? []).slice(0, 2).map((tech) => (
            <span key={tech} className="inline-flex items-center px-2.5 py-1 rounded-[6px] text-[12px] font-medium border bg-gray-50 text-gray-800 border-gray-200">
              {tech}
            </span>
          ))}
          {(client.technologies?.length ?? 0) > 2 && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-[6px] text-[12px] font-medium border bg-gray-50 text-gray-800 border-gray-200">
              +{client.technologies!.length - 2} More
            </span>
          )}
        </div>

        {/* Updated & Renewal */}
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-medium text-gray-500">Updated {timeAgo(client.updatedAt)}</span>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFF7ED] border border-[#FFEDD5] text-[#EA580C] text-[12px] font-bold">
            <Clock className="w-[14px] h-[14px]" />
            {client.daysUntilRenewal !== null ? `Renewal in ${client.daysUntilRenewal} Days` : 'No Expiry'}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-auto grid grid-cols-2 divide-x divide-gray-200/80 border-t border-[#EEF0F8] bg-[#F8F9FE]">
        <button
          onClick={(e) => { e.stopPropagation(); navigate(`/clients/${client.id}`); }}
          className="flex items-center justify-center gap-2 py-3 text-[#3B4BE8] hover:bg-[#EEF2FF] transition-colors group/btn"
        >
          <div className="w-[24px] h-[24px] rounded-[6px] bg-[#EEF2FF] flex items-center justify-center border border-[#E0E7FF] group-hover/btn:bg-white group-hover/btn:border-transparent transition-all">
            <Eye className="w-[13px] h-[13px]" />
          </div>
          <span className="text-[12px] font-bold tracking-wide">View Profile</span>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); navigate(`/finance?clientId=${client.id}`); }}
          className="flex items-center justify-center gap-2 py-3 text-[#3B4BE8] hover:bg-[#EEF2FF] transition-colors group/btn"
        >
          <div className="w-[24px] h-[24px] rounded-[6px] bg-[#EEF2FF] flex items-center justify-center border border-[#E0E7FF] group-hover/btn:bg-white group-hover/btn:border-transparent transition-all">
            <Wallet className="w-[13px] h-[13px]" />
          </div>
          <span className="text-[12px] font-bold tracking-wide">Finance</span>
        </button>
      </div>
    </div>
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
  const { globalWorkspaceId } = useWorkspaceStore();

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const res = await clientsApi.list({ 
        page, 
        pageSize: 12, 
        search, 
        status: statusFilter,
        workspaceId: globalWorkspaceId === "all" ? undefined : globalWorkspaceId 
      });
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
  }, [page, search, statusFilter, globalWorkspaceId]);

  return (
    <PageWrapper>
      <PageHeader
        title="Clients"
        description="Manage your clients, their contact information, and account status."
        icon={<Building2 className="w-5 h-5" />}
        action={
          !globalWorkspaceId ? (
            <Button disabled className="opacity-50 cursor-not-allowed">
              <Plus className="w-4 h-4 mr-2" />
              Loading Workspace...
            </Button>
          ) : (
            <Link to="/clients/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Client
              </Button>
            </Link>
          )
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
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
