import { useState, useEffect } from "react";
import { X, Receipt, FileEdit, QrCode, Check } from "lucide-react";
import { format } from "date-fns";
import { financeApi, type FinanceRecord } from "@/api/finance";
import { useToastStore } from "@/store/toastStore";

interface FinanceEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: FinanceRecord | null;
  onSuccess: (updatedRecord: FinanceRecord) => void;
}

export default function FinanceEditModal({
  isOpen,
  onClose,
  record,
  onSuccess,
}: FinanceEditModalProps) {
  const addToast = useToastStore((s) => s.addToast);
  
  // Form State
  const [docNumber, setDocNumber] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [amount, setAmount] = useState(0);
  const [issueDate, setIssueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [includeUpi, setIncludeUpi] = useState(true);
  const [upiId, setUpiId] = useState("");
  const [payeeName, setPayeeName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && record) {
      setDocNumber(record.title || "");
      
      // Parse base type (strip OUTGOING/INCOMING for the selector)
      let baseType = record.type;
      if (baseType.startsWith("PURCHASE_ORDER")) baseType = "PURCHASE_ORDER";
      setType(baseType);
      
      setStatus(record.status || "");
      setAmount(record.amount || 0);
      setIssueDate(record.createdAt ? format(new Date(record.createdAt), "yyyy-MM-dd") : "");
      
      const meta = record.metadata || {};
      setNotes(record.notes || "");
      setIncludeUpi(meta.includeUpi !== false);
      setUpiId(meta.upiId || "");
      setPayeeName(meta.payeeName || "");
    }
  }, [isOpen, record]);

  if (!isOpen || !record) return null;

  const clientName = record.metadata?.builderData?.clientName || record.project?.client?.name || "Unknown Client";

  const handleSave = async () => {
    if (!record) return;
    setIsSaving(true);
    try {
      // Retain direction if it was a PO
      let finalType = type;
      if (type === "PURCHASE_ORDER" && record.type.startsWith("PURCHASE_ORDER")) {
        finalType = record.type; 
      }

      const existingMeta = record.metadata || {};
      const payload = {
        title: docNumber,
        type: finalType,
        status,
        amount: Number(amount),
        createdAt: issueDate ? new Date(issueDate).toISOString() : record.createdAt,
        notes,
        metadata: {
          ...existingMeta,
          includeUpi,
          upiId,
          payeeName
        }
      };

      const res = await financeApi.update(record.id, payload);
      if (res.data.success) {
        addToast("Document updated successfully", "success");
        onSuccess(res.data.data!);
        onClose();
      }
    } catch (err: any) {
      addToast(err?.response?.data?.error || "Failed to update document", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Format Type String for header badge
  let displayType = record.type.startsWith("PURCHASE_ORDER") ? "Purchase Order" : 
                    record.type === "QUOTATION" ? "Estimate" : 
                    record.type.charAt(0) + record.type.slice(1).toLowerCase();

  const isDraft = status === "DRAFT" || status === "PENDING";
  const isPaid = status === "PAID";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-500/20 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-[800px] max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col border border-gray-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="bg-[#EEF0FF] p-3 rounded-2xl text-[#5438FF]">
              <Receipt className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-[20px] font-extrabold text-[#111827] tracking-tight">{docNumber}</h2>
                <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-[11px] font-bold border border-gray-200">
                  {displayType}
                </span>
              </div>
              <p className="text-[14px] text-gray-600 font-medium">
                Client: <span className="font-bold text-[#111827]">{clientName}</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-bold ${
              isPaid ? "text-emerald-700 bg-emerald-50 border border-emerald-100" :
              isDraft ? "text-gray-700 bg-gray-100 border border-gray-200" :
              status === "OVERDUE" ? "text-rose-700 bg-rose-50 border border-rose-100" :
              "text-blue-700 bg-blue-50 border border-blue-100"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                isPaid ? "bg-emerald-500" :
                isDraft ? "bg-gray-500" :
                status === "OVERDUE" ? "bg-rose-500" :
                "bg-blue-500"
              }`} />
              {status ? status.charAt(0) + status.slice(1).toLowerCase() : "-"}
            </span>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Content */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6 bg-[#FAFAFA]">
          
          {/* Alert Banner */}
          <div className="flex items-center gap-2 bg-[#FFF9EB] border border-[#FFE8B3] rounded-xl px-4 py-3 shadow-sm">
            <FileEdit className="w-4 h-4 text-[#D97706]" />
            <span className="text-[13px] font-bold text-[#B45309]">
              Editing Document Details for <span className="text-[#92400E]">{record.title}</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="col-span-1">
              <label className="block text-[13px] font-bold text-[#111827] mb-2">Document Number</label>
              <input 
                type="text" 
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-[14px] font-medium text-gray-900 focus:outline-none focus:border-[#5438FF] focus:ring-1 focus:ring-[#5438FF] shadow-sm transition-all"
              />
            </div>
            <div className="col-span-1">
              <label className="block text-[13px] font-bold text-[#111827] mb-2">Client Name</label>
              <input 
                type="text" 
                value={clientName}
                disabled
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-[14px] font-bold text-gray-900 cursor-not-allowed shadow-sm"
              />
            </div>

            <div className="col-span-1">
              <label className="block text-[13px] font-bold text-[#111827] mb-2">Document Type</label>
              <select 
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-[14px] font-medium text-gray-900 focus:outline-none focus:border-[#5438FF] focus:ring-1 focus:ring-[#5438FF] shadow-sm transition-all"
              >
                <option value="INVOICE">Tax Invoice</option>
                <option value="QUOTATION">Estimate</option>
                <option value="PURCHASE_ORDER">Purchase Order</option>
              </select>
            </div>
            <div className="col-span-1">
              <label className="block text-[13px] font-bold text-[#111827] mb-2">Status</label>
              <select 
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-[14px] font-medium text-gray-900 focus:outline-none focus:border-[#5438FF] focus:ring-1 focus:ring-[#5438FF] shadow-sm transition-all"
              >
                <option value="DRAFT">Draft</option>
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
                <option value="OVERDUE">Overdue</option>
              </select>
            </div>

            <div className="col-span-1">
              <label className="block text-[13px] font-bold text-[#111827] mb-2">Total Amount (₹)</label>
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-[14px] font-medium text-gray-900 focus:outline-none focus:border-[#5438FF] focus:ring-1 focus:ring-[#5438FF] shadow-sm transition-all"
              />
            </div>
            <div className="col-span-1">
              <label className="block text-[13px] font-bold text-[#111827] mb-2">Issue Date</label>
              <input 
                type="date" 
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-[14px] font-medium text-gray-900 focus:outline-none focus:border-[#5438FF] focus:ring-1 focus:ring-[#5438FF] shadow-sm transition-all"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="block text-[13px] font-bold text-[#111827] mb-2">Line Items & Scope Description</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-[14px] font-medium text-gray-900 focus:outline-none focus:border-[#5438FF] focus:ring-1 focus:ring-[#5438FF] shadow-sm transition-all"
              placeholder="Detailed description of the deliverables and scope..."
            />
          </div>

          {/* Payment Details */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-[#5438FF]" />
                <span className="text-[14px] font-extrabold text-[#111827]">Payment QR / UPI Code</span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={includeUpi}
                  onChange={(e) => setIncludeUpi(e.target.checked)}
                  className="w-4 h-4 rounded text-[#5438FF] focus:ring-[#5438FF]"
                />
                <span className="text-[13px] font-bold text-gray-700">Include UPI/QR payment block</span>
              </label>
            </div>
            
            <div className={`grid grid-cols-2 gap-4 transition-all ${!includeUpi ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="col-span-1">
                <label className="block text-[12px] font-bold text-gray-700 mb-1.5">UPI VPA Address</label>
                <input 
                  type="text" 
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="e.g. company@upi"
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-900 focus:outline-none focus:border-[#5438FF] focus:ring-1 focus:ring-[#5438FF]"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-[12px] font-bold text-gray-700 mb-1.5">Payee Name</label>
                <input 
                  type="text" 
                  value={payeeName}
                  onChange={(e) => setPayeeName(e.target.value)}
                  placeholder="e.g. Company Legal Name"
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-900 focus:outline-none focus:border-[#5438FF] focus:ring-1 focus:ring-[#5438FF]"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-gray-200 bg-white flex items-center justify-end gap-3 rounded-b-2xl">
          <button 
            onClick={onClose}
            className="inline-flex items-center justify-center h-10 px-5 rounded-xl text-[13px] font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center justify-center h-10 px-6 rounded-xl text-[13px] font-bold text-white bg-[#5438FF] hover:bg-[#4329d9] transition-all shadow-sm shadow-[#5438FF]/20 disabled:opacity-70"
          >
            {isSaving ? "Saving..." : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Save Document
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
