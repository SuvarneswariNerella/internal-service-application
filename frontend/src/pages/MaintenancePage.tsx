import { useState, useEffect } from "react";
import { Plus, Search, MoreVertical, Edit2, Trash2, Activity, CheckCircle2, List, Wrench } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import PageWrapper from "@/components/ui/PageWrapper";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";

import { maintenanceApi, type MaintenanceRecord } from "@/api/maintenance";
import MaintenanceFormModal from "@/components/MaintenanceFormModal";
import TicketDetailModal from "@/components/TicketDetailModal";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useToastStore } from "@/store/toastStore";

export default function MaintenancePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [stats, setStats] = useState({ openTickets: 0, resolvedThisMonth: 0, avgResolutionTime: "N/A", allTickets: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecord | undefined>();
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  const { globalWorkspaceId } = useWorkspaceStore();
  const addToast = useToastStore((s) => s.addToast);

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const res = await maintenanceApi.list({
        search,
        status: statusFilter,
        priority: priorityFilter,
        workspaceId: globalWorkspaceId === "all" ? undefined : globalWorkspaceId,
      });
      if (res.data.success && res.data.data) {
        setRecords(res.data.data);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
    } catch (err) {
      console.error("Failed to load maintenance records:", err);
      addToast("Failed to load maintenance records", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [search, statusFilter, priorityFilter, globalWorkspaceId]);

  useEffect(() => {
    const ticketId = searchParams.get("ticketId");
    if (ticketId) {
      // If there's a ticket id in the url, load it for editing
      const record = records.find(r => r.id === ticketId);
      if (record) {
        setSelectedRecord(record);
        setIsModalOpen(true);
      }
      searchParams.delete("ticketId");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, records]);

  const handleEdit = (e: React.MouseEvent, record: MaintenanceRecord) => {
    e.stopPropagation();
    setSelectedTicketId(record.id);
    setIsDetailModalOpen(true);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this ticket?")) return;
    try {
      await maintenanceApi.delete(id);
      addToast("Ticket deleted", "success");
      fetchRecords();
    } catch (err) {
      console.error("Failed to delete ticket:", err);
      addToast("Failed to delete ticket", "error");
    }
  };

  return (
    <PageWrapper>
      <PageHeader
        title="Maintenance & Support"
        icon={<Wrench className="w-6 h-6" />}
        description="Manage client requests, bug reports, and maintenance tasks."
        action={
          <Button
            onClick={() => {
              setSelectedRecord(undefined);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-[#5438FF] hover:bg-[#4328E0] text-white rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Ticket
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 mt-2">
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-50 text-indigo-500 rounded-lg">
              <Activity className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-gray-600">Open Tickets</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.openTickets}</div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-50 text-emerald-500 rounded-lg">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-gray-600">Resolved (This Month)</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.resolvedThisMonth}</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-50 text-blue-500 rounded-lg">
              <List className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-gray-600">All Tickets</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.allTickets}</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5438FF]/20 focus:border-[#5438FF] transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-40 py-2 px-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#5438FF]/20 focus:border-[#5438FF] transition-all cursor-pointer appearance-none"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full md:w-40 py-2 px-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#5438FF]/20 focus:border-[#5438FF] transition-all cursor-pointer appearance-none"
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>

      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/50 border-b border-gray-100 text-gray-500 uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="px-6 py-4">Ticket</th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Assignee</th>
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Loading tickets...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No tickets found.
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr 
                    key={record.id} 
                    className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
                    onClick={(e) => handleEdit(e, record)}
                  >
                    <td className="px-6 py-4 font-semibold text-[#0056b3] text-[15px]">{record.ticketNumber || "TKT-PENDING"}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{record.client?.name || "-"}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-gray-900">{record.title}</span>
                        <span className="text-xs text-gray-500 capitalize">{record.type?.toLowerCase()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold w-fit ${
                        record.status === "RESOLVED" ? "bg-emerald-50 text-emerald-600" :
                        record.status === "IN_PROGRESS" ? "bg-indigo-50 text-indigo-600" :
                        record.status === "CANCELLED" ? "bg-gray-100 text-gray-600" :
                        "bg-amber-50 text-amber-600"
                      }`}>
                        {record.status === "IN_PROGRESS" ? "In Progress" : 
                         record.status === "PENDING" ? "Waiting on Client" : 
                         record.status === "RESOLVED" ? "Resolved" : 
                         "Cancelled"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">
                        {record.assignee?.name || record.assigneeName || <span className="text-gray-400 italic">Unassigned</span>}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[13px] font-medium ${
                        record.priority === "CRITICAL" ? "text-red-600" :
                        record.priority === "HIGH" ? "text-orange-500" :
                        record.priority === "MEDIUM" ? "text-blue-500" :
                        "text-gray-500"
                      }`}>
                        {record.priority.charAt(0) + record.priority.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="relative flex items-center justify-end h-8">
                        <div className="absolute right-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                          <button
                            onClick={(e) => handleEdit(e, record)}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-md hover:bg-indigo-50 transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(e, record.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md transition-opacity group-hover:opacity-0 inline-flex">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <MaintenanceFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        record={selectedRecord}
        onSuccess={fetchRecords}
      />
      <TicketDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedTicketId(null);
        }}
        ticketId={selectedTicketId}
        onUpdate={fetchRecords}
      />
    </PageWrapper>
  );
}
