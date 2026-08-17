import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { financeApi, type FinanceRecord } from "@/api/finance";
import { DollarSign, Search, Filter, Plus, FileText, CheckCircle2, AlertCircle, Clock, Eye, Download, Check, Layers } from "lucide-react";
import FinanceDocumentViewModal from "@/components/FinanceDocumentViewModal";
import FinanceEditModal from "@/components/FinanceEditModal";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useToastStore } from "@/store/toastStore";
import { format } from "date-fns";
import TemplateLibraryView from "@/components/finance/TemplateLibraryView";

export default function FinancePage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState("All Documents");
  
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [clientFilter, setClientFilter] = useState("ALL");
  
  const [viewingRecord, setViewingRecord] = useState<FinanceRecord | null>(null);
  const [quickEditRecord, setQuickEditRecord] = useState<FinanceRecord | null>(null);
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const { globalWorkspaceId } = useWorkspaceStore();
  const addToast = useToastStore((s) => s.addToast);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const res = await financeApi.list({
        workspaceId: globalWorkspaceId === "all" ? undefined : globalWorkspaceId,
      });
      if (res.data.success) {
        setRecords(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load finance records", err);
      addToast("Failed to load records", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [globalWorkspaceId]);

  const filteredRecords = records.filter(r => {
    const clientName = (r.client?.name || r.project?.client?.name || r.metadata?.builderData?.clientName || "").toLowerCase();
    const projectName = (r.project?.name || "").toLowerCase();
    const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase()) || 
                          projectName.includes(search.toLowerCase()) ||
                          clientName.includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || 
                          (statusFilter === "PENDING" ? (r.status === "PENDING" || r.status === "DRAFT") : r.status === statusFilter);
    const matchesType = typeFilter === "ALL" || 
                        (typeFilter === "PURCHASE_ORDER" ? r.type.startsWith("PURCHASE_ORDER") : r.type === typeFilter);
    // Add tab filtering logic here if needed (e.g. Invoices tab)
    const matchesTab = activeTab === "All Documents" || 
                       (activeTab === "Invoices" && r.type === "INVOICE") ||
                       (activeTab === "Estimates/Proposals" && r.type === "QUOTATION") ||
                       (activeTab === "Purchase Orders" && r.type.startsWith("PURCHASE_ORDER"));
    const actualClientId = r.clientId || r.project?.clientId;
    const matchesClient = clientFilter === "ALL" || actualClientId === clientFilter;
    
    return matchesSearch && matchesStatus && matchesType && matchesTab && matchesClient;
  });

  const uniqueClients = Array.from(
    new Map(
      records
        .map(r => r.client || r.project?.client)
        .filter((c): c is NonNullable<typeof c> => !!c)
        .map(c => [c.id, c])
    ).values()
  );

  const totalAmount = filteredRecords.reduce((sum, r) => sum + Number(r.amount), 0);
  const paidAmount = filteredRecords.filter(r => r.status === "PAID").reduce((sum, r) => sum + Number(r.amount), 0);
  const overdueAmount = filteredRecords.filter(r => r.status === "OVERDUE").reduce((sum, r) => sum + Number(r.amount), 0);
  const outstandingAmount = filteredRecords.filter(r => r.status === "PENDING" || r.status === "OVERDUE").reduce((sum, r) => sum + Number(r.amount), 0);

  const isEstimates = activeTab === "Estimates/Proposals" || typeFilter === "QUOTATION";
  const isPOs = activeTab === "Purchase Orders" || typeFilter === "PURCHASE_ORDER";
  const totalTitle = isEstimates ? "Total Estimated (₹)" : isPOs ? "Total POs (₹)" : (activeTab === "All Documents" && typeFilter === "ALL") ? "Total Amount (₹)" : "Total Invoiced (₹)";

  const handleCreateClick = () => {
    setShowCreateModal(true);
  };

  const handleDuplicate = async (record: FinanceRecord) => {
    try {
      const duplicatePayload = {
        projectId: record.projectId,
        type: record.type,
        title: `${record.title}-COPY`,
        amount: Number(record.amount),
        currency: record.currency || "INR",
        status: "DRAFT",
        dueDate: record.dueDate,
        notes: record.notes,
        metadata: record.metadata
      };
      const res = await financeApi.create(duplicatePayload);
      if (res.data.success) {
        addToast("Document duplicated successfully", "success");
        setViewingRecord(null);
        loadRecords();
      }
    } catch (err) {
      console.error(err);
      addToast("Failed to duplicate document", "error");
    }
  };

  const handleMarkPaid = async (record: FinanceRecord) => {
    try {
      setMarkingPaidId(record.id);
      await financeApi.update(record.id, { 
        status: "PAID",
        paidDate: new Date().toISOString()
      });
      addToast("Document marked as paid", "success");
      loadRecords();
    } catch (error) {
      console.error("Failed to mark as paid:", error);
      addToast("Failed to update status", "error");
    } finally {
      setMarkingPaidId(null);
    }
  };

  const handleUseTemplate = (template: any) => {
    let docType = "invoice";
    if (template.type === "PROPOSALS") docType = "estimate";
    if (template.type === "PURCHASE_ORDERS" || template.type === "PURCHASE_ORDER") docType = "po";
    
    navigate(`/finance/document-builder?type=${docType}&templateId=${template.id}`);
  };

  const handleDocumentTypeSelect = (type: string) => {
    setShowCreateModal(false);
    navigate(`/finance/document-builder?type=${type}`);
  };

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8 bg-gray-50/30 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-[24px] font-bold text-[#1e1b4b] flex items-center gap-2">
            <div className="bg-[#5438FF]/10 p-1.5 rounded-md text-[#5438FF]">
              <DollarSign className="w-5 h-5" />
            </div>
            Financials & Documents
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage invoices, proposals, purchase orders, and recurring billing templates in one hub.
          </p>
        </div>
        <button
          onClick={handleCreateClick}
          className="flex items-center gap-2 bg-[#5438FF] hover:bg-[#4328E0] text-white px-5 py-2.5 rounded-lg text-[14px] font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Document
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 pt-2">
        {["All Documents", "Invoices", "Estimates/Proposals", "Purchase Orders", "Template Library"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 border ${
              activeTab === tab 
                ? "bg-[#5438FF] text-white border-[#5438FF]" 
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {tab === "All Documents" && <FileText className="w-4 h-4" />}
            {tab === "Invoices" && <DollarSign className="w-4 h-4" />}
            {tab === "Estimates/Proposals" && <FileText className="w-4 h-4" />}
            {tab === "Purchase Orders" && <Layers className="w-4 h-4" />}
            {tab === "Template Library" && <FileText className="w-4 h-4" />}
            {tab}
          </button>
        ))}
      </div>

      {/* Stats Cards & Filter Bar */}
      {activeTab !== "Template Library" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] relative overflow-hidden">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">{totalTitle}</p>
          <h3 className="text-2xl font-extrabold text-gray-900 mb-2">₹{totalAmount.toLocaleString()}</h3>
          <p className="text-xs text-gray-500 font-medium">Across {filteredRecords.length} document(s)</p>
          <div className="absolute top-1/2 -translate-y-1/2 right-6 w-10 h-10 rounded-full bg-[#EEF0FF] flex items-center justify-center text-[#5438FF]">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-[0_2px_10px_-4px_rgba(16,185,129,0.05)] relative overflow-hidden">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Paid (₹)</p>
          <h3 className="text-2xl font-extrabold text-emerald-600 mb-2">₹{paidAmount.toLocaleString()}</h3>
          <p className="text-xs text-emerald-600/80 font-medium">Collected & settled</p>
          <div className="absolute top-1/2 -translate-y-1/2 right-6 w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-[0_2px_10px_-4px_rgba(244,63,94,0.05)] relative overflow-hidden">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Overdue (₹)</p>
          <h3 className="text-2xl font-extrabold text-rose-600 mb-2">₹{overdueAmount.toLocaleString()}</h3>
          <p className="text-xs text-rose-600/80 font-medium">Action required</p>
          <div className="absolute top-1/2 -translate-y-1/2 right-6 w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-[0_2px_10px_-4px_rgba(245,158,11,0.05)] relative overflow-hidden">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Outstanding (₹)</p>
          <h3 className="text-2xl font-extrabold text-amber-500 mb-2">₹{outstandingAmount.toLocaleString()}</h3>
          <p className="text-xs text-amber-600/80 font-medium">Sent + Overdue total</p>
          <div className="absolute top-1/2 -translate-y-1/2 right-6 w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Advanced Filter Bar */}
      <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-sm flex flex-col xl:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search document ID, client name, company, description."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 border border-transparent hover:border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#5438FF]/20 focus:border-[#5438FF] transition-all"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-2">

          <div className="flex items-center gap-2 border-r border-gray-200 pr-2 pl-1">
            <Layers className="w-4 h-4 text-gray-400 ml-2" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-transparent text-sm font-semibold text-gray-700 py-2.5 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Types</option>
              <option value="INVOICE">Invoices</option>
              <option value="QUOTATION">Estimates</option>
              <option value="PURCHASE_ORDER">Purchase Orders</option>
              <option value="TEMPLATE">Templates</option>
            </select>
          </div>

          <div className="flex items-center gap-2 border-r border-gray-200 pr-2 pl-1">
            <Filter className="w-4 h-4 text-gray-400 ml-2" />
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="bg-transparent text-sm font-semibold text-gray-700 py-2.5 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Clients ({uniqueClients.length})</option>
              {uniqueClients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 pl-1">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-sm font-semibold text-gray-700 py-2.5 pl-2 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Draft/Pending</option>
              <option value="PAID">Paid</option>
              <option value="OVERDUE">Overdue</option>
            </select>
          </div>
        </div>
      </div>
      </>
      )}

      {/* Table OR Template Library View */}
      {activeTab === "Template Library" ? (
        <TemplateLibraryView onUseTemplate={handleUseTemplate} />
      ) : (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white border-b border-gray-200">
                <th className="px-6 py-4 text-[11px] font-extrabold text-gray-500 uppercase tracking-widest">Client</th>
                <th className="px-6 py-4 text-[11px] font-extrabold text-gray-500 uppercase tracking-widest">Company</th>
                <th className="px-6 py-4 text-[11px] font-extrabold text-gray-500 uppercase tracking-widest">Document ID</th>
                <th className="px-6 py-4 text-[11px] font-extrabold text-gray-500 uppercase tracking-widest text-center">Type</th>
                <th className="px-6 py-4 text-[11px] font-extrabold text-gray-500 uppercase tracking-widest text-right">Amount (₹)</th>
                <th className="px-6 py-4 text-[11px] font-extrabold text-gray-500 uppercase tracking-widest">Issue Date</th>
                <th className="px-6 py-4 text-[11px] font-extrabold text-gray-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[11px] font-extrabold text-gray-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500 font-medium">Loading records...</td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500 font-medium">No documents found matching your filters.</td>
                </tr>
              ) : (
                filteredRecords.map(record => {
                  const clientName = record.client?.name || record.project?.client?.name || record.metadata?.builderData?.clientName || "Unknown Client";
                  const docTitle = record.title || "Untitled Document";
                  const docDesc = record.project?.name || "General Maintenance";
                  const isPaid = record.status === "PAID";
                  const isDraft = record.status === "DRAFT" || record.status === "PENDING";
                  
                  let displayType = record.type.startsWith("PURCHASE_ORDER") ? "PO" : 
                                    record.type === "QUOTATION" ? "Estimate" : 
                                    record.type.charAt(0) + record.type.slice(1).toLowerCase();
                  if (record.type === "PURCHASE_ORDER_OUTGOING") {
                    displayType += " (Outgoing)";
                  } else if (record.type === "PURCHASE_ORDER_INCOMING") {
                    displayType += " (Incoming)";
                  } else if (record.type === "PURCHASE_ORDER" && record.metadata?.poDirection) {
                    displayType += record.metadata.poDirection === "OUTGOING" ? " (Outgoing)" : " (Incoming)";
                  }
                  
                  return (
                    <tr key={record.id} className="hover:bg-gray-50/80 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="font-bold text-[#111827] text-[14px] whitespace-normal max-w-[180px] leading-snug">
                          {clientName}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EEF0FF] text-[#5438FF] text-[12px] font-bold">
                          <Layers className="w-3.5 h-3.5" />
                          Edunura
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 text-gray-400">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-[#111827] text-[14px]">{docTitle}</div>
                            <div className="text-[12px] font-medium text-gray-500 truncate max-w-[250px]">{docDesc}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="inline-block px-3 py-1 rounded-md bg-gray-50 text-gray-600 text-[13px] font-semibold border border-gray-200">
                          {displayType}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right font-extrabold text-[#111827] text-[14px]">
                        ₹{Number(record.amount).toLocaleString()}
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-[13px] font-semibold text-gray-600">
                          {record.createdAt ? format(new Date(record.createdAt), "yyyy-MM-dd") : "-"}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-bold ${
                          isPaid ? "text-emerald-700 bg-emerald-50 border border-emerald-100" :
                          isDraft ? "text-gray-700 bg-gray-100 border border-gray-200" :
                          record.status === "OVERDUE" ? "text-rose-700 bg-rose-50 border border-rose-100" :
                          "text-blue-700 bg-blue-50 border border-blue-100"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            isPaid ? "bg-emerald-500" :
                            isDraft ? "bg-gray-500" :
                            record.status === "OVERDUE" ? "bg-rose-500" :
                            "bg-blue-500"
                          }`} />
                          {record.status.charAt(0) + record.status.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            className="p-2 text-gray-400 hover:text-gray-900 transition-colors"
                            onClick={() => setViewingRecord(record)}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            className="p-2 text-gray-400 hover:text-gray-900 transition-colors"
                            onClick={() => {
                              setViewingRecord(record);
                              setTimeout(() => window.print(), 500);
                            }}
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          {isPaid ? (
                            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 text-emerald-600 text-[12px] font-bold hover:bg-emerald-50 transition-colors">
                              <Check className="w-3.5 h-3.5" />
                              Paid
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleMarkPaid(record)}
                              disabled={markingPaidId === record.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-[12px] font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                              {markingPaidId === record.id ? <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" /> : null}
                              Mark Paid
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      <FinanceDocumentViewModal
        isOpen={!!viewingRecord}
        onClose={() => setViewingRecord(null)}
        record={viewingRecord}
        onEdit={(r) => {
          setViewingRecord(null);
          setQuickEditRecord(r);
        }}
        onDuplicate={handleDuplicate}
        onViewInvoice={async (invoiceId) => {
          try {
            const res = await financeApi.get(invoiceId);
            if (res.data.success && res.data.data) {
              setViewingRecord(res.data.data);
            }
          } catch (err) {
            console.error(err);
            addToast("Failed to fetch invoice details", "error");
          }
        }}
        onConvertSuccess={async (newInvoiceId) => {
          try {
            // First load the full list to update the table in the background
            loadRecords(); 
            // Then fetch the specific invoice to view
            const res = await financeApi.get(newInvoiceId);
            if (res.data.success && res.data.data) {
              setViewingRecord(res.data.data);
              addToast("Invoice created successfully", "success");
            }
          } catch (err) {
            console.error(err);
            loadRecords(); // Fallback to just loading records
          }
        }}
      />

      <FinanceEditModal
        isOpen={!!quickEditRecord}
        onClose={() => setQuickEditRecord(null)}
        record={quickEditRecord}
        onSuccess={() => {
          loadRecords();
        }}
      />

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Create Document</h2>
              <p className="text-sm text-gray-500 mb-6">Select the type of document you want to create.</p>
              
              <div className="space-y-3">
                <button
                  onClick={() => handleDocumentTypeSelect("invoice")}
                  className="w-full flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-[#5438FF] hover:bg-[#5438FF]/5 text-left transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-[#5438FF] group-hover:text-white transition-colors">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Invoice</div>
                    <div className="text-xs text-gray-500">Bill clients for products or services</div>
                  </div>
                </button>
                
                <button
                  onClick={() => handleDocumentTypeSelect("estimate")}
                  className="w-full flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 text-left transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Estimates & Proposals</div>
                    <div className="text-xs text-gray-500">Send quotes before starting work</div>
                  </div>
                </button>
                
                <button
                  onClick={() => handleDocumentTypeSelect("po")}
                  className="w-full flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 text-left transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Purchase Order</div>
                    <div className="text-xs text-gray-500">Order goods or services from vendors</div>
                  </div>
                </button>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
