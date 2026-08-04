import { useState, useEffect } from "react";
import { financeApi, type FinanceRecord } from "@/api/finance";
import { Wallet, Search, Filter, Plus, FileText, ArrowDownRight, Clock, Pencil, Trash2 } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import FinanceFormModal from "@/components/FinanceFormModal";
import { useToastStore } from "@/store/toastStore";
import { format } from "date-fns";

export default function FinancePage() {
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FinanceRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const addToast = useToastStore((s) => s.addToast);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const res = await financeApi.list();
      if (res.data.success) {
        setRecords(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load finance records", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const filteredRecords = records.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase()) || 
                          r.project?.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalAmount = records.reduce((sum, r) => sum + Number(r.amount), 0);
  const pendingAmount = records.filter(r => r.status === "PENDING").reduce((sum, r) => sum + Number(r.amount), 0);
  const paidAmount = records.filter(r => r.status === "PAID").reduce((sum, r) => sum + Number(r.amount), 0);

  const handleCreateClick = () => {
    setEditingRecord(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (record: FinanceRecord) => {
    setEditingRecord(record);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this finance record?")) return;
    setDeletingId(id);
    try {
      const res = await financeApi.delete(id);
      if (res.data.success) {
        addToast("Finance record deleted successfully", "success");
        loadRecords();
      }
    } catch (err) {
      console.error("Failed to delete record", err);
      addToast("Failed to delete finance record", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const handleModalSuccess = () => {
    loadRecords();
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      INVOICE: "bg-blue-50 text-blue-700 border-blue-200",
      RECEIPT: "bg-emerald-50 text-emerald-700 border-emerald-200",
      QUOTATION: "bg-violet-50 text-violet-700 border-violet-200",
      CONTRACT: "bg-amber-50 text-amber-700 border-amber-200",
      EXPENSE: "bg-rose-50 text-rose-700 border-rose-200",
    };
    return colors[type] || "bg-gray-100 text-gray-600 border-gray-200";
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Finance & Documents"
        description="Manage invoices, receipts, and project financial records"
        action={
          <button
            onClick={handleCreateClick}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Record
          </button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Tracked</p>
            <h3 className="text-2xl font-bold text-gray-900">₹{totalAmount.toLocaleString()}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Pending & Due</p>
            <h3 className="text-2xl font-bold text-gray-900">₹{pendingAmount.toLocaleString()}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <ArrowDownRight className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Paid / Cleared</p>
            <h3 className="text-2xl font-bold text-gray-900">₹{paidAmount.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title or project..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
            <option value="OVERDUE">Overdue</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="DRAFT">Draft</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
              <th className="p-4 font-semibold">Title / Project</th>
              <th className="p-4 font-semibold">Type</th>
              <th className="p-4 font-semibold">Amount</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold">Dates</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-400">Loading records...</td>
              </tr>
            ) : filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-400">No finance records found.</td>
              </tr>
            ) : (
              filteredRecords.map(record => (
                <tr key={record.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="p-4">
                    <p className="font-semibold text-gray-900">{record.title}</p>
                    <p className="text-xs text-gray-500">{record.project?.name || "Unknown Project"}</p>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${getTypeColor(record.type)}`}>
                      <FileText className="w-3.5 h-3.5" />
                      {record.type}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="font-mono font-bold text-gray-900">₹{Number(record.amount).toLocaleString()}</span>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border
                      ${record.status === "PAID" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : 
                        record.status === "PENDING" ? "bg-amber-50 text-amber-700 border-amber-200" :
                        record.status === "OVERDUE" ? "bg-rose-50 text-rose-700 border-rose-200" :
                        record.status === "CANCELLED" ? "bg-gray-50 text-gray-500 border-gray-200" :
                        "bg-blue-50 text-blue-700 border-blue-200"}`}
                    >
                      {record.status}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-gray-500">
                    {record.dueDate && (
                      <p>Due: <span className="font-medium text-gray-900">{format(new Date(record.dueDate), "MMM d, yyyy")}</span></p>
                    )}
                    {record.paidDate && (
                      <p>Paid: <span className="font-medium text-emerald-600">{format(new Date(record.paidDate), "MMM d, yyyy")}</span></p>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEditClick(record)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(record.id)}
                        disabled={deletingId === record.id}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Finance Form Modal */}
      <FinanceFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRecord(null);
        }}
        record={editingRecord}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
