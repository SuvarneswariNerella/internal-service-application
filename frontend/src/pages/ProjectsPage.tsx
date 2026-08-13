import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Search, FolderKanban, Calendar, Cpu, User, ChevronRight } from "lucide-react";
import PageWrapper from "@/components/ui/PageWrapper";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import StatusPill from "@/components/ui/StatusPill";
import { Card } from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import ProjectFormModal from "@/components/ProjectFormModal";
import { projectsApi, type Project } from "@/api/projects";
import { clientsApi, type Client } from "@/api/clients";
import type { PaginationMeta } from "@/types";
import { useWorkspaceStore } from "@/store/workspaceStore";

export default function ProjectsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const clientIdParam = searchParams.get("clientId") || "";

  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState(clientIdParam);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const { globalWorkspaceId } = useWorkspaceStore();

  useEffect(() => {
    clientsApi.list({ 
      pageSize: 100,
      workspaceId: globalWorkspaceId === "all" ? undefined : globalWorkspaceId
    }).then((res) => {
      if (res.data.success && res.data.data) {
        setClients(res.data.data);
      }
    }).catch(console.error);
  }, [globalWorkspaceId]);

  useEffect(() => {
    setSelectedClientId(clientIdParam);
  }, [clientIdParam]);

  const handleClientFilterChange = (newClientId: string) => {
    setSelectedClientId(newClientId);
    setPage(1);
    if (newClientId) {
      setSearchParams({ clientId: newClientId });
    } else {
      setSearchParams({});
    }
  };

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const res = await projectsApi.list({
        page,
        pageSize: 12,
        search,
        status: statusFilter,
        clientId: selectedClientId || undefined,
        workspaceId: globalWorkspaceId === "all" ? undefined : globalWorkspaceId,
      });
      if (res.data.success && res.data.data) {
        setProjects(res.data.data);
        if (res.data.pagination) setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [page, search, statusFilter, selectedClientId, globalWorkspaceId]);

  return (
    <PageWrapper>
      <PageHeader
        title="Projects"
        description="Manage your projects across all clients and internal operations"
        icon={<FolderKanban className="w-5 h-5" />}
        action={
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Project
          </Button>
        }
      />

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects by name, description, technology..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="flex gap-3">
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
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">All Status</option>
              <option value="PLANNING">Planning</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="COMPLETED">Completed</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-none">
              <div className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <div>
                  <Skeleton className="h-4 w-40 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card className="p-12 text-center">
          <FolderKanban className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No projects found</p>
        </Card>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Project Name</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Technology</th>
                  <th className="py-3 px-4">Start Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                {projects.map((project) => (
                  <tr
                    key={project.id}
                    className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    {/* Project Name */}
                    <td className="py-3 px-4 font-semibold text-gray-900">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
                          <FolderKanban className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <Link
                            to={`/projects/${project.id}`}
                            className="hover:text-indigo-600 transition-colors block font-semibold text-gray-900 truncate"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {project.name}
                          </Link>
                          {project.description && (
                            <p className="text-[11px] text-gray-400 truncate max-w-xs font-normal">{project.description}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Client */}
                    <td className="py-3 px-4 text-gray-700 font-medium">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>{project.client?.name || "—"}</span>
                      </div>
                    </td>

                    {/* Technology */}
                    <td className="py-3 px-4">
                      {project.technology ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-xs font-medium border border-gray-200">
                          <Cpu className="w-3 h-3 text-gray-500" />
                          {project.technology}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    {/* Start Date */}
                    <td className="py-3 px-4 text-gray-600 font-medium">
                      {project.startDate ? (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>{new Date(project.startDate).toLocaleDateString()}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <StatusPill status={project.status} />
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/projects/${project.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span>View</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

      <ProjectFormModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={() => fetchProjects()}
      />
    </PageWrapper>
  );
}
