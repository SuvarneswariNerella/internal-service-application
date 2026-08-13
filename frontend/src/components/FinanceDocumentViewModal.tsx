import { useState, useRef } from "react";
import { X, Receipt, Copy, Download, Send, CheckCircle2, FileEdit, FileOutput, Clock, Loader2, Eye, LayoutTemplate, FileText } from "lucide-react";
import { format } from "date-fns";
import { financeApi, type FinanceRecord } from "@/api/finance";
import SendDocumentModal from "./SendDocumentModal";

interface FinanceDocumentViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: FinanceRecord | null;
  onEdit?: (record: FinanceRecord) => void;
  onDuplicate?: (record: FinanceRecord) => void;
  onViewInvoice?: (invoiceId: string) => void;
  onConvertSuccess?: (newInvoiceId: string) => void;
}

export default function FinanceDocumentViewModal({
  isOpen,
  onClose,
  record,
  onEdit,
  onDuplicate,
  onViewInvoice,
  onConvertSuccess
}: FinanceDocumentViewModalProps) {
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);
  const [viewMode, setViewMode] = useState<"template" | "data">("template");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  const [showConvertConfirm, setShowConvertConfirm] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  if (!isOpen || !record) return null;

  const handleMarkPaid = async () => {
    try {
      setIsMarkingPaid(true);
      await financeApi.update(record.id, { 
        status: "PAID",
        paidDate: new Date().toISOString()
      });
      if (onClose) onClose();
      // Wait a moment for modal to close, then reload window to update tables if we don't have a direct refresh callback
      setTimeout(() => {
        window.location.reload();
      }, 300);
    } catch (error) {
      console.error("Failed to mark as paid:", error);
      alert("Failed to update status.");
    } finally {
      setIsMarkingPaid(false);
    }
  };

  const handleConvert = async () => {
    try {
      setIsConverting(true);
      const res = await financeApi.convert(record.id);
      setShowConvertConfirm(false);
      if (onConvertSuccess && res.data.success && res.data.data) {
        onConvertSuccess(res.data.data.id);
      }
    } catch (error) {
      const errorMsg = (error as any).response?.data?.error || (error as any).message || "Unknown error";
      console.error("Failed to convert:", error);
      alert(`Failed to convert ${displayType} to Invoice: ${errorMsg}`);
    } finally {
      setIsConverting(false);
    }
  };

  // Safe parsing of metadata
  const metadata = record.metadata || {};
  const lineItems: any[] = metadata.lineItems || [];
  const subtotal = metadata.subtotal || 0;
  const totalGst = metadata.totalGst || 0;
  
  // Try to determine CGST/SGST vs IGST if it's there
  const taxType = metadata.taxType || "INTRA";
  const cgst = taxType === "INTRA" ? totalGst / 2 : 0;
  const sgst = taxType === "INTRA" ? totalGst / 2 : 0;
  const igst = taxType === "INTER" ? totalGst : 0;

  // Client name
  const clientName = record.project?.client?.name || "Unknown Client";

  // Document formatting
  const docNumber = record.title || "Unknown ID";
  
  // Format Type String
  let displayType = record.type.startsWith("PURCHASE_ORDER") ? "Purchase Order" : 
                    record.type === "QUOTATION" ? "Estimate" : 
                    record.type.charAt(0) + record.type.slice(1).toLowerCase();
  
  if (record.type === "PURCHASE_ORDER_OUTGOING") {
    displayType += " (Outgoing PO)";
  } else if (record.type === "PURCHASE_ORDER_INCOMING") {
    displayType += " (Incoming PO)";
  } else if (record.type === "PURCHASE_ORDER" && metadata.poDirection) {
    displayType += metadata.poDirection === "OUTGOING" ? " (Outgoing PO)" : " (Incoming PO)";
  }

  // Safe formatting for dates
  const formatSafeDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    try {
      return format(new Date(dateStr), "yyyy-MM-dd");
    } catch {
      return "-";
    }
  };

  const isPaid = record.status === "PAID";
  const isDraft = record.status === "DRAFT" || record.status === "PENDING";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-500/20 backdrop-blur-sm p-4 print-wrapper">
      <div className="relative w-full max-w-[850px] max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col border border-gray-200 overflow-hidden print-area">
        
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
            {metadata.generatedHtml && (
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("template")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                    viewMode === "template" ? "bg-white text-[#5438FF] shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <LayoutTemplate className="w-3.5 h-3.5" /> Template
                </button>
                <button
                  onClick={() => setViewMode("data")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                    viewMode === "data" ? "bg-white text-[#5438FF] shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" /> Data
                </button>
              </div>
            )}
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-bold ${
              isPaid ? "text-emerald-700 bg-emerald-50 border border-emerald-100" :
              isDraft ? "text-[#5438FF] bg-[#EEF0FF] border border-indigo-100" :
              record.status === "OVERDUE" ? "text-rose-700 bg-rose-50 border border-rose-100" :
              "text-blue-700 bg-blue-50 border border-blue-100"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                isPaid ? "bg-emerald-500" :
                isDraft ? "bg-[#5438FF]" :
                record.status === "OVERDUE" ? "bg-rose-500" :
                "bg-blue-500"
              }`} />
              {record.status.charAt(0) + record.status.slice(1).toLowerCase()}
            </span>
            <button onClick={onClose} className="print-hidden p-2 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        {/* Scrollable Content */}
        {metadata.generatedHtml && (
          <div className={`flex-1 w-full bg-[#f8f9fc] relative flex justify-center p-6 overflow-y-auto custom-scrollbar ${viewMode === "template" ? "block" : "hidden"}`}>
            <div className="w-full max-w-[800px] bg-white shadow-lg relative min-h-[1131px] print-w-full">
              <iframe
                ref={iframeRef}
                srcDoc={metadata.generatedHtml}
                title="Document Preview"
                className="w-full h-full border-none absolute inset-0 print-relative"
              />
            </div>
          </div>
        )}
        
        <div className={`overflow-y-auto flex-1 p-6 space-y-6 bg-[#FAFAFA] print-content-scroll ${metadata.generatedHtml && viewMode === "template" ? "hidden" : "block"}`}>
          
          {/* Top Info Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center">
              <div className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">Client Profile</div>
              <div className="text-[15px] font-bold text-[#111827] truncate" title={clientName}>{clientName}</div>
              <div className="text-[12px] font-medium text-gray-500 mt-0.5">v-1</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center">
              <div className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">Issue Date</div>
              <div className="text-[15px] font-bold text-[#111827]">{formatSafeDate(record.createdAt)}</div>
              <div className="text-[12px] font-medium text-gray-500 mt-0.5">Due: {formatSafeDate(record.dueDate)}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center">
              <div className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">Doc Category</div>
              <div className="text-[15px] font-bold text-[#111827] truncate">{displayType}</div>
              <div className="text-[12px] font-medium text-[#5438FF] mt-0.5">Standard Services</div>
            </div>
            <div className="bg-[#EEF0FF] p-4 rounded-xl border border-indigo-100 shadow-sm flex flex-col justify-center">
              <div className="text-[10px] font-extrabold text-[#5438FF] uppercase tracking-widest mb-1">Total Amount</div>
              <div className="text-[20px] font-extrabold text-[#111827]">₹{Number(record.amount).toLocaleString()}</div>
            </div>
          </div>

          {/* GSTIN Section */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm grid grid-cols-2 gap-8">
            <div>
              <div className="text-[11px] font-extrabold text-gray-500 uppercase tracking-widest mb-2">Supplier / Issuing Entity GSTIN</div>
              <div className="text-[14px] font-bold text-[#111827]">27AAACE1234F1Z1</div>
              <div className="text-[12px] font-medium text-gray-500 mt-0.5">State: 27 - Maharashtra</div>
            </div>
            <div>
              <div className="text-[11px] font-extrabold text-gray-500 uppercase tracking-widest mb-2">Client / Recipient GSTIN</div>
              <div className="text-[14px] font-bold text-[#111827]">27AAACA0000A1Z1</div>
              <div className="text-[12px] font-medium text-gray-500 mt-0.5">State: 27 - Maharashtra</div>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-[13px] font-extrabold text-[#111827] uppercase tracking-wider">Itemized Line Items & Scope</h3>
              <span className="text-[12px] font-medium text-gray-500">{lineItems.length} Deliverable Item(s)</span>
            </div>
            
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-5 py-3 text-[11px] font-extrabold text-gray-500 uppercase tracking-widest">Item & Description</th>
                    <th className="px-5 py-3 text-[11px] font-extrabold text-gray-500 uppercase tracking-widest text-center w-20">Qty</th>
                    <th className="px-5 py-3 text-[11px] font-extrabold text-gray-500 uppercase tracking-widest text-right w-32">Rate</th>
                    <th className="px-5 py-3 text-[11px] font-extrabold text-gray-500 uppercase tracking-widest text-center w-20">GST %</th>
                    <th className="px-5 py-3 text-[11px] font-extrabold text-gray-500 uppercase tracking-widest text-right w-32">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lineItems.length > 0 ? (
                    lineItems.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-bold text-[#111827] text-[13px] leading-tight mb-1">{item.description}</div>
                          <div className="text-[11px] text-gray-500 leading-tight">Deliverable package according to agreement for {clientName}.</div>
                        </td>
                        <td className="px-5 py-4 text-center font-bold text-[#111827] text-[13px]">{item.qty}</td>
                        <td className="px-5 py-4 text-right font-medium text-gray-600 text-[13px]">₹{Number(item.rate).toLocaleString()}</td>
                        <td className="px-5 py-4 text-center font-medium text-gray-600 text-[13px]">{item.gst || 18}%</td>
                        <td className="px-5 py-4 text-right font-bold text-[#111827] text-[13px]">₹{(item.qty * item.rate).toLocaleString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-gray-500 font-medium">No items recorded in metadata.</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Totals */}
              <div className="bg-gray-50/50 border-t border-gray-200 px-5 py-4 flex flex-col gap-2 items-end">
                <div className="flex items-center justify-between w-[250px] text-[13px]">
                  <span className="font-semibold text-gray-600">Subtotal:</span>
                  <span className="font-bold text-[#111827]">₹{Number(subtotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                {taxType === "INTRA" ? (
                  <>
                    <div className="flex items-center justify-between w-[250px] text-[13px]">
                      <span className="font-medium text-gray-500">CGST (Intra-state):</span>
                      <span className="font-medium text-gray-700">₹{Number(cgst).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex items-center justify-between w-[250px] text-[13px]">
                      <span className="font-medium text-gray-500">SGST (Intra-state):</span>
                      <span className="font-medium text-gray-700">₹{Number(sgst).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between w-[250px] text-[13px]">
                    <span className="font-medium text-gray-500">IGST (Inter-state):</span>
                    <span className="font-medium text-gray-700">₹{Number(igst).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex items-center justify-between w-[250px] mt-2 pt-2 border-t border-gray-200">
                  <span className="font-extrabold text-[#111827] text-[14px]">Grand Total:</span>
                  <span className="font-extrabold text-[#111827] text-[15px]">₹{Number(record.amount).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          {record.emailLogs && record.emailLogs.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-[13px] font-extrabold text-[#111827] uppercase tracking-wider">Activity Timeline</h3>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <div className="space-y-4">
                  {record.emailLogs.map((log: any) => (
                    <div key={log.id} className="flex gap-4">
                      <div className="mt-1">
                        <div className="w-8 h-8 rounded-full bg-[#EEF0FF] flex items-center justify-center text-[#5438FF]">
                          <Clock className="w-4 h-4" />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">Document Sent</p>
                        <p className="text-sm text-gray-600">Sent to <span className="font-semibold">{log.recipient}</span> via email.</p>
                        <p className="text-xs text-gray-400 mt-1">{format(new Date(log.sentAt), "MMM dd, yyyy 'at' hh:mm a")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-white border-t border-gray-200 p-4 shrink-0 flex items-center justify-between print-hidden">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onEdit?.(record)}
              className="inline-flex items-center justify-center h-10 px-4 rounded-xl text-[13px] font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
            >
              <FileEdit className="w-4 h-4 mr-2" />
              Edit Details
            </button>
            <button 
              onClick={() => onDuplicate?.(record)}
              className="inline-flex items-center justify-center h-10 px-4 rounded-xl text-[13px] font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
            >
              <Copy className="w-4 h-4 mr-2" />
              Duplicate
            </button>
            {(record.type.startsWith("PURCHASE_ORDER") || record.type === "QUOTATION" || record.type === "PROPOSAL") && (
              record.convertedInvoiceId ? (
                <button 
                  onClick={() => onViewInvoice && onViewInvoice(record.convertedInvoiceId!)}
                  className="inline-flex items-center justify-center h-10 px-4 rounded-xl text-[13px] font-bold text-[#8B3DFF] bg-purple-50 hover:bg-purple-100 transition-all shadow-sm"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Invoice
                </button>
              ) : (
                <button 
                  onClick={() => setShowConvertConfirm(true)}
                  className="inline-flex items-center justify-center h-10 px-4 rounded-xl text-[13px] font-bold text-white bg-[#8B3DFF] hover:bg-[#7a32e5] transition-all shadow-sm shadow-purple-500/20"
                >
                  <FileOutput className="w-4 h-4 mr-2" />
                  Convert to Invoice
                </button>
              )
            )}
            <button 
              onClick={() => {
                if (metadata.generatedHtml && iframeRef.current?.contentWindow) {
                  iframeRef.current.contentWindow.print();
                } else {
                  window.print();
                }
              }}
              className="inline-flex items-center justify-center h-10 px-4 rounded-xl text-[13px] font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Print / Download
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSendModalOpen(true)}
              className="inline-flex items-center justify-center h-10 px-4 rounded-xl text-[13px] font-bold text-[#5438FF] bg-[#EEF0FF] hover:bg-[#e2e5ff] transition-all"
            >
              <Send className="w-4 h-4 mr-2" />
              Send Document
            </button>
            <button 
              onClick={handleMarkPaid}
              disabled={isMarkingPaid}
              className="inline-flex items-center justify-center h-10 px-4 rounded-xl text-[13px] font-bold text-white bg-[#00A86B] hover:bg-[#00915a] transition-all shadow-sm shadow-emerald-500/20 disabled:opacity-50"
            >
              {isMarkingPaid ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              Mark Paid
            </button>
          </div>
        </div>
      </div>

      <SendDocumentModal
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        record={record}
        onSuccess={() => {
          setIsSendModalOpen(false);
          if (onClose) onClose();
        }}
      />

      {/* Convert Confirm Dialog */}
      {showConvertConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => !isConverting && setShowConvertConfirm(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 m-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Convert to Invoice</h3>
            <p className="text-gray-500 text-sm mb-6">
              A new draft invoice will be created from this {displayType}. The invoice will copy all line items, totals, and client details from this document.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowConvertConfirm(false)}
                disabled={isConverting}
                className="px-4 py-2 font-semibold text-gray-600 hover:bg-gray-50 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleConvert}
                disabled={isConverting}
                className="px-4 py-2 font-bold text-white bg-[#8B3DFF] hover:bg-[#7a32e5] rounded-xl transition-colors shadow-sm shadow-purple-500/20 flex items-center disabled:opacity-50"
              >
                {isConverting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Confirm Conversion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
