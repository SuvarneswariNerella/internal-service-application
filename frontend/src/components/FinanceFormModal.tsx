import { useState, useEffect } from "react";
import {
  X,
  FileText,
  Layers,
  ChevronDown,
  Trash2,
  Plus,
  QrCode,
  CheckCircle2,
  Eye,
  Download,
  Send,
  Save,
  RotateCcw,
  Building2,
  Palette
} from "lucide-react";
import { projectsApi, type Project } from "@/api/projects";
import { financeApi, type FinanceRecord } from "@/api/finance";
import { workspacesApi, type Workspace } from "@/api/workspaces";
import { useToastStore } from "@/store/toastStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import AdvancedTemplateCustomizer from "./finance/AdvancedTemplateCustomizer";

interface FinanceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  record?: FinanceRecord | null;
  onSuccess?: (updatedRecord?: FinanceRecord) => void;
}

interface LineItem {
  id: string;
  description: string;
  qty: number;
  rate: number;
  gst: number;
}

export default function FinanceFormModal({
  isOpen,
  onClose,
  record,
  onSuccess,
}: FinanceFormModalProps) {
  const addToast = useToastStore((s) => s.addToast);
  const { globalWorkspaceId } = useWorkspaceStore();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  // Basic Form State
  const [type, setType] = useState("INVOICE");
  const [projectId, setProjectId] = useState("");
  const [docNumber, setDocNumber] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  
  // Advanced Form State (Metadata)
  const [enableRecurring, setEnableRecurring] = useState(false);
  const [poDirection, setPoDirection] = useState("INCOMING"); // "INCOMING" or "OUTGOING"
  const [designTemplate, setDesignTemplate] = useState("MODERN");
  const [customHtml, setCustomHtml] = useState("");
  const [customCss, setCustomCss] = useState("");
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [includeUpi, setIncludeUpi] = useState(true);
  const [upiId, setUpiId] = useState("edn@upi");
  const [payeeName, setPayeeName] = useState("Edunura Education Tech Private Limited");
  const [paymentNote, setPaymentNote] = useState("Scan QR using any UPI app (GPay, PhonePe, Paytm, BHIM) to settle payment");
  const [notes, setNotes] = useState("1. Payment due within 30 days of issue date.\n2. Bank Transfer: HDFC Bank | A/C: 50200088112233 | IFSC: HDFC0000123 | Branch: Vashi.\n3. Please quote document ID in all transaction remarks.");
  
  const [discount, setDiscount] = useState(0);
  const [taxType, setTaxType] = useState<"INTRA" | "INTER">("INTRA");
  
  // Line Items
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: "1", description: "Full-Stack Web App Development & Cloud API Deployment", qty: 1, rate: 45000, gst: 18 },
    { id: "2", description: "24/7 DevOps SLA & AWS Server Maintenance", qty: 1, rate: 15000, gst: 18 }
  ]);

  const isEdit = !!record;

  useEffect(() => {
    if (isOpen) {
      workspacesApi.list().then(res => {
        setWorkspaces(res.data);
        if (globalWorkspaceId !== "all") {
          setActiveWorkspace(res.data.find(w => w.id === globalWorkspaceId) || res.data[0] || null);
        } else {
          setActiveWorkspace(res.data[0] || null);
        }
      }).catch(console.error);

      projectsApi.list({ pageSize: 1000, workspaceId: globalWorkspaceId === "all" ? undefined : globalWorkspaceId })
        .then((res) => {
          if (res.data?.success && res.data?.data) {
            setProjects(res.data.data);
          }
        })
        .catch((err) => console.error(err));
    }
  }, [isOpen, globalWorkspaceId]);

  useEffect(() => {
    if (!isEdit && activeWorkspace && isOpen) {
      let prefix = "";
      let seq = 1;
      if (type === "INVOICE") { prefix = activeWorkspace.invoicePrefix || "INV-"; seq = activeWorkspace.invoiceNextSeq || 1; }
      else if (type === "QUOTATION") { prefix = activeWorkspace.estimatePrefix || "EST-"; seq = activeWorkspace.estimateNextSeq || 1; }
      else if (type === "PURCHASE_ORDER") { prefix = activeWorkspace.poPrefix || "PO-"; seq = activeWorkspace.poNextSeq || 1; }
      
      const formattedSeq = seq.toString().padStart(3, '0');
      setDocNumber(`${prefix}${formattedSeq}`);

      const defaultNotes = `1. Payment due within 30 days of issue date.\n2. Bank Transfer: ${activeWorkspace.bankName || "Your Bank"} | A/C: ${activeWorkspace.accountNumber || "123456789"} | IFSC: ${activeWorkspace.ifscCode || "IFSC0001234"} | Branch: ${activeWorkspace.bankBranch || "Main Branch"}.\n3. Please quote document ID in all transaction remarks.`;
      setNotes(defaultNotes);
    }
  }, [type, activeWorkspace, isEdit, isOpen]);

  useEffect(() => {
    if (record && isOpen) {
      setType(record.type || "INVOICE");
      setProjectId(record.projectId || "");
      setDocNumber(record.title || "");
      setIssueDate(record.createdAt ? record.createdAt.split("T")[0] || "" : "");
      setDueDate(record.dueDate ? record.dueDate.split("T")[0] || "" : "");
      setNotes(record.notes || "");
      
      if (record.metadata) {
        const meta = record.metadata as any;
        setEnableRecurring(meta.enableRecurring || false);
        setPoDirection(meta.poDirection || "INCOMING");
        setDesignTemplate(meta.designTemplate || "MODERN");
        setIncludeUpi(meta.includeUpi ?? true);
        setUpiId(meta.upiId || "edn@upi");
        setPayeeName(meta.payeeName || "Edunura Education Tech");
        setPaymentNote(meta.paymentNote || "");
        if (meta.lineItems && Array.isArray(meta.lineItems)) {
          setLineItems(meta.lineItems);
        }
        if (meta.discount !== undefined) setDiscount(meta.discount);
        if (meta.taxType !== undefined) setTaxType(meta.taxType);
        if (meta.customHtml) setCustomHtml(meta.customHtml);
        if (meta.customCss) setCustomCss(meta.customCss);
      }
    } else if (isOpen) {
      // Defaults for new
      setType("INVOICE");
      setProjectId("");
      setNotes("");
      setDiscount(0);
      setLineItems([
        { id: "1", description: "Full-Stack Web App Development & Cloud API Deployment", qty: 1, rate: 45000, gst: 18 },
        { id: "2", description: "24/7 DevOps SLA & AWS Server Maintenance", qty: 1, rate: 15000, gst: 18 }
      ]);
      const today = new Date().toISOString().split("T")[0] || "";
      setIssueDate(today);
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      setDueDate(nextMonth.toISOString().split("T")[0] || "");
    }
  }, [record, isOpen]);

  // Calculations
  const subtotal = lineItems.reduce((acc, item) => acc + (item.qty * item.rate), 0);
  const totalGst = lineItems.reduce((acc, item) => acc + ((item.qty * item.rate * item.gst) / 100), 0);
  const grandTotal = Math.max(0, subtotal - discount + totalGst);

  const handleAddLineItem = () => {
    setLineItems([...lineItems, { id: Date.now().toString(), description: "", qty: 1, rate: 0, gst: 18 }]);
  };

  const handleRemoveLineItem = (id: string) => {
    setLineItems(lineItems.filter(item => item.id !== id));
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
    setLineItems(lineItems.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleSubmit = async (status: string) => {
    if (!projectId || lineItems.length === 0) {
      addToast("Please select a client/project and add at least one line item.", "error");
      return;
    }
    
    setIsSaving(true);
    try {
      const finalType = type === "PURCHASE_ORDER" ? (poDirection === "OUTGOING" ? "PURCHASE_ORDER_OUTGOING" : "PURCHASE_ORDER_INCOMING") : type;
      
      const payload = {
        projectId,
        type: finalType,
        title: docNumber,
        amount: grandTotal,
        currency: "INR",
        status: status,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        notes: notes,
        workspaceId: activeWorkspace?.id,
        metadata: {
          enableRecurring,
          poDirection,
          designTemplate,
          includeUpi,
          upiId,
          payeeName,
          paymentNote,
          lineItems,
          subtotal,
          discount,
          taxType,
          totalGst,
          customHtml,
          customCss
        }
      };

      if (isEdit && record?.id) {
        const res = await financeApi.update(record.id, payload);
        if (res.data.success) {
          addToast("Document updated successfully", "success");
          onSuccess?.(res.data.data);
          onClose();
        }
      } else {
        const res = await financeApi.create(payload);
        if (res.data.success) {
          addToast("Document created successfully", "success");
          onSuccess?.(res.data.data);
          onClose();
        }
      }
    } catch (err: any) {
      addToast(err?.response?.data?.error || "Failed to save document", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const previewData: Record<string, string> = {
    "company.name": activeWorkspace?.legalName || activeWorkspace?.displayName || "Your Company Name",
    "company.logo": activeWorkspace?.logoUrl 
      ? `<img src="${activeWorkspace.logoUrl}" style="max-height: 40px; object-fit: contain;" />` 
      : `<div style="width:60px;height:40px;background:#1e293b;border-radius:4px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:bold;">LOGO</div>`,
    "company.address": activeWorkspace?.address || "Company Address",
    "company.gstin": activeWorkspace?.gstin || "N/A",
    "company.email": activeWorkspace?.contactEmail || "billing@company.com",
    "doc.type": type === "INVOICE" ? "Tax Invoice" : type === "QUOTATION" ? "Estimate / Proposal" : "Purchase Order",
    "doc.number": docNumber || "EDU/2026/001",
    "doc.issuedDate": issueDate || "N/A",
    "doc.dueDate": dueDate || "N/A",
    "client.name": projects.find(p => p.id === projectId)?.client?.name || "Client Name",
    "client.address": projects.find(p => p.id === projectId)?.client?.address || "N/A",
    "client.gstin": projects.find(p => p.id === projectId)?.client?.notes || "N/A",
    "lineItems.html": lineItems.map(item => `
      <tr>
        <td>${item.description || '—'}</td>
        <td style="text-align: center;">${item.qty}</td>
        <td style="text-align: right;">₹${(item.rate || 0).toLocaleString()}</td>
        <td style="text-align: right;">₹${((item.qty || 0) * (item.rate || 0)).toLocaleString()}</td>
      </tr>
    `).join(''),
    "financial.subtotal": `₹${subtotal.toLocaleString()}`,
    "financial.tax": `₹${totalGst.toLocaleString()}`,
    "financial.total": `₹${grandTotal.toLocaleString()}`
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500/20 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-[1100px] max-h-[95vh] bg-[#F8F9FA] rounded-2xl shadow-2xl flex flex-col border border-gray-200 overflow-hidden">
        
        {showPreview ? (
          <>
            {/* Live Layout Preview Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
               <div className="flex items-center gap-4">
                  <div className="bg-[#EEF0FF] p-2.5 rounded-xl text-[#5438FF]">
                    <Palette className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-[16px] font-extrabold text-[#111827]">Live Layout Preview</h2>
                    <p className="text-[12px] text-gray-500 font-medium mt-0.5">Switch designs live to compare layout aesthetics before sending</p>
                  </div>
               </div>
               <div className="flex items-center gap-6">
                 <div className="flex bg-gray-100 rounded-lg p-1 border border-gray-200/50">
                   {["CLASSIC", "MODERN", "MINIMAL"].map(t => (
                     <button
                       key={t}
                       onClick={() => setDesignTemplate(t)}
                       className={`px-4 py-1.5 rounded-md text-[13px] font-bold transition-all ${
                         designTemplate === t ? "bg-[#5438FF] text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
                       }`}
                     >
                       {t === "CLASSIC" ? "Classic" : t === "MODERN" ? "Modern" : "Minimal"}
                     </button>
                   ))}
                 </div>
                 <button onClick={() => setShowPreview(false)} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
                   <X className="w-4 h-4" />
                 </button>
               </div>
            </div>

            {/* Document Preview Canvas */}
            <div className="p-6 overflow-y-auto flex-1 min-h-0 bg-[#F8F9FA] flex justify-center items-start">
              <div className="w-full max-w-[850px] h-fit bg-white rounded-2xl border border-gray-200 shadow-sm p-10">
                
                {/* Header Row */}
                <div className="flex justify-between items-start mb-8 border-b border-gray-100 pb-8">
                  <div className="flex items-start gap-4">
                    {activeWorkspace?.logoUrl ? (
                      <img src={activeWorkspace.logoUrl} alt="Logo" className="w-14 h-14 rounded-lg object-contain bg-white" />
                    ) : (
                      <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(activeWorkspace?.displayName || 'Company')}&background=random`} alt="Logo" className="w-14 h-14 rounded-lg object-cover" />
                    )}
                    <div>
                      <h1 className="text-[18px] font-extrabold text-[#111827]">{activeWorkspace?.legalName || activeWorkspace?.displayName || "Your Company Name"}</h1>
                      <p className="text-[12px] text-gray-500 font-medium mt-0.5">{activeWorkspace?.address || "Company Address"}, {activeWorkspace?.city || "City"}, {activeWorkspace?.state || "State"} {activeWorkspace?.postalCode || "ZIP"}</p>
                      <p className="text-[12px] font-bold text-gray-700 mt-0.5">GSTIN: {activeWorkspace?.gstin || "N/A"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="inline-block px-3 py-1 bg-[#5438FF] text-white text-[11px] font-extrabold tracking-widest uppercase rounded-full mb-3 shadow-sm shadow-[#5438FF]/20">
                      {type === "INVOICE" ? "Tax Invoice" : type === "QUOTATION" ? "Estimate / Proposal" : "Purchase Order"}
                    </div>
                    <div className="text-[20px] font-extrabold text-[#111827]">{docNumber || "EDU/2026/001"}</div>
                    <div className="text-[11px] text-gray-500 font-medium mt-1">Issue: {issueDate} | Due: {dueDate}</div>
                  </div>
                </div>

                {/* Client Account Row */}
                <div className="border border-gray-100 rounded-xl p-5 mb-8 bg-gray-50/50 flex justify-between items-start">
                  <div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Client Account:</div>
                    <div className="text-[15px] font-extrabold text-[#111827] mb-0.5">{projects.find(p => p.id === projectId)?.name || "Amazon Web Services India Private Limited"}</div>
                    <div className="text-[12px] text-gray-600 font-medium">GSTIN: <span className="font-bold text-[#111827]">{projects.find(p => p.id === projectId)?.client?.notes || "N/A"}</span></div>
                    <div className="text-[12px] text-gray-600 font-medium mt-0.5">{projects.find(p => p.id === projectId)?.client?.address || "No address on file"}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">GST Tax Supply:</div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[11px] font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Intra-State (CGST+SGST)
                    </div>
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="mb-8 border border-gray-100 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="py-3 px-4 text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">Item Description</th>
                        <th className="py-3 px-4 text-[10px] font-extrabold text-gray-500 uppercase tracking-widest text-center">Qty</th>
                        <th className="py-3 px-4 text-[10px] font-extrabold text-gray-500 uppercase tracking-widest text-right">Rate</th>
                        <th className="py-3 px-4 text-[10px] font-extrabold text-gray-500 uppercase tracking-widest text-center">GST %</th>
                        <th className="py-3 px-4 text-[10px] font-extrabold text-gray-500 uppercase tracking-widest text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {lineItems.map((item, idx) => (
                        <tr key={idx} className="bg-white hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-4 text-[13px] font-bold text-[#111827]">{item.description || "—"}</td>
                          <td className="py-4 px-4 text-[13px] font-bold text-gray-700 text-center">{item.qty}</td>
                          <td className="py-4 px-4 text-[13px] font-medium text-gray-600 text-right">₹{(item.rate || 0).toLocaleString()}</td>
                          <td className="py-4 px-4 text-[13px] font-medium text-gray-600 text-center">{item.gst}%</td>
                          <td className="py-4 px-4 text-[13px] font-bold text-[#111827] text-right">₹{((item.qty || 0) * (item.rate || 0)).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Footer Section */}
                <div className="flex justify-between items-start border-t border-gray-100 pt-8 pb-10">
                  <div className="w-[55%]">
                    <div className="text-[12px] font-extrabold text-[#111827] mb-2">Bank Wire Remittance & Terms:</div>
                    <div className="text-[11px] text-gray-500 font-medium whitespace-pre-line leading-relaxed">
                      {notes || "1. Payment due within 30 days of issue date.\n2. Bank Transfer: HDFC Bank | A/C: 50200088112233 | IFSC: HDFC0000123 | Branch: Vashi.\n3. Please quote document ID in all transaction remarks."}
                    </div>
                  </div>
                  
                  <div className="w-[40%] bg-[#F8F9FA] rounded-2xl border border-gray-100 p-5">
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between text-[12px]">
                        <span className="text-gray-500 font-medium">Subtotal:</span>
                        <span className="font-bold text-[#111827]">₹{subtotal.toLocaleString()}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-[12px]">
                          <span className="text-gray-500 font-medium">Discount:</span>
                          <span className="font-bold text-rose-500">-₹{discount.toLocaleString()}</span>
                        </div>
                      )}
                      {taxType === "INTRA" ? (
                        <>
                          <div className="flex justify-between text-[12px]">
                            <span className="text-gray-500 font-medium">CGST (Intra-State):</span>
                            <span className="font-bold text-[#111827]">₹{(totalGst/2).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-[12px]">
                            <span className="text-gray-500 font-medium">SGST (Intra-State):</span>
                            <span className="font-bold text-[#111827]">₹{(totalGst/2).toLocaleString()}</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between text-[12px]">
                          <span className="text-gray-500 font-medium">IGST (Inter-State):</span>
                          <span className="font-bold text-[#111827]">₹{totalGst.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    <div className="bg-[#5438FF] text-white rounded-xl p-3 flex justify-between items-center shadow-md shadow-[#5438FF]/20">
                      <span className="text-[13px] font-extrabold uppercase tracking-wide">Grand Total:</span>
                      <span className="text-[18px] font-extrabold">₹{grandTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                {/* Bottom Watermark */}
                <div className="flex justify-between items-center border-t border-gray-100 pt-6">
                   <div className="text-[10px] font-medium text-gray-400">Computer Generated Document</div>
                   <div className="text-[10px] font-bold text-[#5438FF] flex items-center gap-1.5">
                     <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                       <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z"/>
                     </svg>
                     Powered by Agency Operations Engine
                   </div>
                </div>

              </div>
            </div>
          </>
        ) : (
          <>
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="bg-[#5438FF] p-2.5 rounded-xl text-white">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-[20px] font-extrabold text-[#111827]">Create Financial Document</h2>
                <span className="px-2.5 py-0.5 rounded-md bg-[#EEF0FF] text-[#5438FF] text-[10px] font-extrabold tracking-wider uppercase">Fast Flow</span>
              </div>
              <p className="text-[13px] text-gray-500 font-medium">Auto-calculated GST split, multi-entity prefix series, and instant PDF formatting.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex bg-gray-100/80 rounded-full p-1 border border-gray-200/50">
              {["INVOICE", "QUOTATION", "PURCHASE_ORDER"].map(t => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`px-4 py-1.5 rounded-full text-[13px] font-bold transition-all ${
                    type === t ? "bg-white text-[#5438FF] shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {t === "INVOICE" ? "Invoice" : t === "QUOTATION" ? "Estimate / Proposal" : "Purchase Order"}
                </button>
              ))}
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 min-h-0">
          
          {/* Section 1: Header & Party Details */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[12px] font-extrabold text-gray-900 uppercase tracking-widest flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#5438FF]" />
                1. Header & Party Details
              </h3>
              <span className="text-[12px] font-bold text-gray-500">
                Issuing Entity: {activeWorkspace ? `${activeWorkspace.legalName} (${activeWorkspace.shortCode})` : "Not Selected"}
              </span>
            </div>

            {type === "INVOICE" && (
              <div className="bg-[#F8F9FF] border border-[#E0E7FF] rounded-xl p-4 mb-6 flex items-start gap-3">
                <input 
                  type="checkbox" 
                  checked={enableRecurring}
                  onChange={(e) => setEnableRecurring(e.target.checked)}
                  className="mt-1 rounded text-[#5438FF] focus:ring-[#5438FF] w-4 h-4 border-gray-300"
                />
                <div>
                  <div className="text-[14px] font-bold text-[#111827] flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-[#5438FF]" />
                    Enable Recurring / Retainer Auto-Generation
                  </div>
                  <div className="text-[12px] text-[#5438FF] font-medium mt-0.5">Auto-generate invoice each month or period based on saved line items.</div>
                </div>
              </div>
            )}

            {type === "PURCHASE_ORDER" && (
              <div className="bg-[#F8F9FF] border border-[#E0E7FF] rounded-xl p-4 mb-6 flex items-center justify-between">
                <div>
                  <div className="text-[14px] font-bold text-[#111827] flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#5438FF]" />
                    PO Direction Configuration
                  </div>
                  <div className="text-[12px] text-[#5438FF] font-medium mt-0.5">
                    {poDirection === "INCOMING" 
                      ? "Incoming PO: A client issues a PO to my agency as a commitment (convertible to invoice)."
                      : "Outgoing PO: My agency issues a PO to a vendor to order goods/services."}
                  </div>
                </div>
                <div className="flex bg-white rounded-lg p-1 border border-[#E0E7FF]">
                  <button 
                    onClick={() => setPoDirection("OUTGOING")}
                    className={`px-4 py-1.5 rounded-md text-[13px] font-bold transition-colors ${poDirection === "OUTGOING" ? "text-white bg-[#5438FF] shadow-sm" : "text-[#5438FF] hover:bg-[#F8F9FF]"}`}
                  >
                    Outgoing (To Vendor)
                  </button>
                  <button 
                    onClick={() => setPoDirection("INCOMING")}
                    className={`px-4 py-1.5 rounded-md text-[13px] font-bold transition-colors ${poDirection === "INCOMING" ? "text-white bg-[#5438FF] shadow-sm" : "text-[#5438FF] hover:bg-[#F8F9FF]"}`}
                  >
                    Incoming (From Client)
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-5 gap-6">
              <div className="col-span-1">
                <label className="block text-[12px] font-bold text-gray-700 mb-2">Issuing Company</label>
                <div className="relative">
                  <select 
                    value={activeWorkspace?.id || ""} 
                    disabled={globalWorkspaceId !== "all"}
                    onChange={(e) => setActiveWorkspace(workspaces.find(w => w.id === e.target.value) || null)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-[13px] font-bold text-gray-900 appearance-none focus:outline-none focus:ring-2 focus:ring-[#5438FF]/20"
                  >
                    <option value="">Select Company...</option>
                    {workspaces.map(w => (
                      <option key={w.id} value={w.id}>{w.displayName}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
                <p className="text-[11px] text-gray-400 font-medium mt-1.5">GSTIN: {activeWorkspace?.gstin || "N/A"}</p>
              </div>

              <div className="col-span-1">
                <label className="block text-[12px] font-bold text-gray-700 mb-2">Bill To Client / Project</label>
                <div className="relative">
                  <select 
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-[13px] font-bold text-gray-900 appearance-none focus:outline-none focus:ring-2 focus:ring-[#5438FF]/20"
                  >
                    <option value="">Select Project...</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.client?.name || 'Unknown'} - {p.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
                <p className="text-[11px] text-gray-400 font-medium mt-1.5">State: 27 - Maharashtra</p>
              </div>

              <div className="col-span-1">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[12px] font-bold text-gray-700">Document Number</label>
                  <button 
                    onClick={() => {
                      if (!activeWorkspace) return;
                      let prefix = ""; let seq = 1;
                      if (type === "INVOICE") { prefix = activeWorkspace.invoicePrefix || "INV-"; seq = activeWorkspace.invoiceNextSeq || 1; }
                      else if (type === "QUOTATION") { prefix = activeWorkspace.estimatePrefix || "EST-"; seq = activeWorkspace.estimateNextSeq || 1; }
                      else if (type === "PURCHASE_ORDER") { prefix = activeWorkspace.poPrefix || "PO-"; seq = activeWorkspace.poNextSeq || 1; }
                      setDocNumber(`${prefix}${seq.toString().padStart(3, '0')}`);
                    }}
                    className="text-[#5438FF] text-[11px] font-bold flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3"/> Reset
                  </button>
                </div>
                <input 
                  type="text" 
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-[13px] font-bold text-[#5438FF] focus:outline-none focus:ring-2 focus:ring-[#5438FF]/20"
                />
                <p className="text-[11px] text-gray-400 font-medium mt-1.5">
                  Series: {type === "INVOICE" ? activeWorkspace?.invoicePrefix : type === "QUOTATION" ? activeWorkspace?.estimatePrefix : activeWorkspace?.poPrefix}
                </p>
              </div>

              <div className="col-span-1">
                <label className="block text-[12px] font-bold text-gray-700 mb-2">Issue Date</label>
                <div className="relative">
                  <input 
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-[13px] font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5438FF]/20"
                  />
                </div>
              </div>

              <div className="col-span-1">
                <label className="block text-[12px] font-bold text-gray-700 mb-2">Due Date</label>
                <div className="relative">
                  <input 
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-[13px] font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5438FF]/20"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Template Selection */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[12px] font-extrabold text-gray-900 uppercase tracking-widest flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#EEF0FF] flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-[#5438FF]"></div>
                </div>
                Select Predefined Document Design
              </h3>
              <span className="text-[12px] font-bold text-gray-500">Company Default: <span className="text-[#5438FF]">Modern</span></span>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {/* Classic */}
              <div 
                onClick={() => setDesignTemplate("CLASSIC")}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${designTemplate === "CLASSIC" ? "border-[#5438FF] bg-[#F8F9FF]" : "border-gray-100 hover:border-gray-200"}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full bg-amber-700"></div>
                    <span className="font-extrabold text-[14px]">Classic</span>
                  </div>
                </div>
                <div className="text-[12px] font-bold text-gray-700 mb-1">Formal Corporate Layout</div>
                <div className="text-[12px] text-gray-500 mb-6 line-clamp-2">Traditional serif header rule, structured grid table & boxed financial summaries.</div>
                <div className="flex justify-between items-center text-[11px] font-bold text-gray-400">
                  <span className="truncate">Serif / Formal</span>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => { setDesignTemplate("CLASSIC"); setShowCustomizer(true); }} className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-gray-500 hover:text-[#5438FF] hover:bg-[#5438FF]/10 rounded transition-colors" title="Edit HTML/CSS">
                      &lt;/&gt; HTML/CSS
                    </button>
                    <span className={designTemplate === "CLASSIC" ? "text-[#5438FF] flex items-center gap-1" : "cursor-pointer"} onClick={() => setDesignTemplate("CLASSIC")}>
                      {designTemplate === "CLASSIC" && <CheckCircle2 className="w-3 h-3"/>} {designTemplate === "CLASSIC" ? "Selected" : "Apply"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Modern */}
              <div 
                onClick={() => setDesignTemplate("MODERN")}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all relative ${designTemplate === "MODERN" ? "border-[#5438FF] bg-[#F8F9FF]" : "border-gray-100 hover:border-gray-200"}`}
              >
                <span className="absolute top-4 right-4 bg-[#EEF0FF] text-[#5438FF] text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase">Default</span>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full bg-[#5438FF]"></div>
                    <span className="font-extrabold text-[14px]">Modern</span>
                  </div>
                </div>
                <div className="text-[12px] font-bold text-gray-700 mb-1">Contemporary Clean Accent</div>
                <div className="text-[12px] text-gray-500 mb-6 line-clamp-2">Vibrant company brand color bar, rounded status pills & clean tabular layout.</div>
                <div className="flex justify-between items-center text-[11px] font-bold text-gray-400">
                  <span className="truncate">Sans / Vibrant</span>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => { setDesignTemplate("MODERN"); setShowCustomizer(true); }} className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-gray-500 hover:text-[#5438FF] hover:bg-[#5438FF]/10 rounded transition-colors" title="Edit HTML/CSS">
                      &lt;/&gt; HTML/CSS
                    </button>
                    <span className={designTemplate === "MODERN" ? "text-[#5438FF] flex items-center gap-1" : "cursor-pointer"} onClick={() => setDesignTemplate("MODERN")}>
                      {designTemplate === "MODERN" && <CheckCircle2 className="w-3 h-3"/>} {designTemplate === "MODERN" ? "Selected" : "Apply"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Minimal */}
              <div 
                onClick={() => setDesignTemplate("MINIMAL")}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${designTemplate === "MINIMAL" ? "border-[#5438FF] bg-[#F8F9FF]" : "border-gray-100 hover:border-gray-200"}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full bg-slate-800"></div>
                    <span className="font-extrabold text-[14px]">Minimal</span>
                  </div>
                </div>
                <div className="text-[12px] font-bold text-gray-700 mb-1">Sleek High Negative Space</div>
                <div className="text-[12px] text-gray-500 mb-6 line-clamp-2">Ultra-clean layout with high contrast whitespace, hairline rules & minimal stack.</div>
                <div className="flex justify-between items-center text-[11px] font-bold text-gray-400">
                  <span className="truncate">Minimal / Crisp</span>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => { setDesignTemplate("MINIMAL"); setShowCustomizer(true); }} className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-gray-500 hover:text-[#5438FF] hover:bg-[#5438FF]/10 rounded transition-colors" title="Edit HTML/CSS">
                      &lt;/&gt; HTML/CSS
                    </button>
                    <span className={designTemplate === "MINIMAL" ? "text-[#5438FF] flex items-center gap-1" : "cursor-pointer"} onClick={() => setDesignTemplate("MINIMAL")}>
                      {designTemplate === "MINIMAL" && <CheckCircle2 className="w-3 h-3"/>} {designTemplate === "MINIMAL" ? "Selected" : "Apply"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Line Items */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[12px] font-extrabold text-gray-900 uppercase tracking-widest flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                2. Line Items Table
              </h3>
            </div>

            <table className="w-full text-left border-spacing-y-3 border-separate -mt-3">
              <thead>
                <tr className="text-[11px] font-extrabold text-gray-500 uppercase tracking-widest">
                  <th className="px-2 pb-2">Item / Description</th>
                  <th className="px-2 pb-2 w-24">Qty</th>
                  <th className="px-2 pb-2 w-32">Rate (₹)</th>
                  <th className="px-2 pb-2 w-28">GST %</th>
                  <th className="px-2 pb-2 text-right w-32">Amount (₹)</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map(item => (
                  <tr key={item.id} className="bg-white">
                    <td className="px-1 py-1">
                      <input 
                        type="text" 
                        value={item.description}
                        onChange={(e) => updateLineItem(item.id, "description", e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#5438FF]/20"
                        placeholder="Description"
                      />
                    </td>
                    <td className="px-1 py-1">
                      <input 
                        type="number" 
                        value={item.qty}
                        onChange={(e) => updateLineItem(item.id, "qty", Number(e.target.value))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#5438FF]/20 text-center"
                        min="1"
                      />
                    </td>
                    <td className="px-1 py-1">
                      <input 
                        type="number" 
                        value={item.rate}
                        onChange={(e) => updateLineItem(item.id, "rate", Number(e.target.value))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#5438FF]/20 text-right"
                      />
                    </td>
                    <td className="px-1 py-1 relative">
                      <select 
                        value={item.gst}
                        onChange={(e) => updateLineItem(item.id, "gst", Number(e.target.value))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] font-bold text-gray-800 appearance-none focus:outline-none focus:ring-2 focus:ring-[#5438FF]/20"
                      >
                        <option value="0">0%</option>
                        <option value="5">5%</option>
                        <option value="12">12%</option>
                        <option value="18">18%</option>
                        <option value="28">28%</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-gray-500 pointer-events-none" />
                    </td>
                    <td className="px-2 py-1 text-right font-extrabold text-[14px] text-gray-900">
                      ₹{(item.qty * item.rate).toLocaleString()}
                    </td>
                    <td className="px-1 py-1 text-center">
                      <button onClick={() => handleRemoveLineItem(item.id)} className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex items-center justify-between mt-2 pt-4 border-t border-gray-100">
              <button onClick={handleAddLineItem} className="flex items-center gap-2 bg-[#5438FF] text-white px-4 py-2 rounded-lg text-[13px] font-bold hover:bg-[#4328E0] transition-colors shadow-sm">
                <Plus className="w-4 h-4" /> Add Line Item
              </button>
            </div>
          </div>

          {/* Section 4: QR & UPI */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 relative overflow-hidden">
            <div className={`flex items-center justify-between ${includeUpi ? "mb-6" : ""}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#EEF0FF] flex items-center justify-center text-[#5438FF]">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[13px] font-extrabold text-gray-900 uppercase tracking-widest flex items-center gap-2">
                    Payment QR / UPI Details
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 text-[9px] tracking-wider uppercase">Instant Settlement</span>
                  </h3>
                  <p className="text-[12px] text-gray-500 font-medium">Include interactive UPI QR code on document preview and exported PDF.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[13px] font-bold text-[#111827]">Include UPI/QR payment block</span>
                <div 
                  onClick={() => setIncludeUpi(!includeUpi)}
                  className={`w-12 h-6 rounded-full cursor-pointer transition-colors relative ${includeUpi ? "bg-[#5438FF]" : "bg-gray-200"}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${includeUpi ? "left-7" : "left-1"}`}></div>
                </div>
              </div>
            </div>

            {includeUpi && (
              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-bold text-gray-700 mb-2">UPI ID / VPA Address</label>
                    <input 
                      type="text" 
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-[13px] font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5438FF]/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-gray-700 mb-2">Payee / Account Name</label>
                    <input 
                      type="text" 
                      value={payeeName}
                      onChange={(e) => setPayeeName(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-[13px] font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5438FF]/20"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[12px] font-bold text-gray-700 mb-2">Payment Instructions / Note</label>
                    <input 
                      type="text" 
                      value={paymentNote}
                      onChange={(e) => setPaymentNote(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-[13px] font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#5438FF]/20"
                    />
                  </div>
                </div>

                <div className="col-span-1 border border-gray-100 rounded-xl p-4 flex items-center gap-4 bg-gray-50/50">
                  <div className="w-20 h-20 bg-white p-1 rounded-lg border border-gray-200 shrink-0">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay" alt="QR" className="w-full h-full object-contain opacity-50 grayscale" />
                  </div>
                  <div>
                    <div className="text-[12px] font-bold text-gray-900 leading-tight">{payeeName}</div>
                    <div className="text-[12px] text-[#5438FF] font-medium my-0.5">{upiId}</div>
                    <div className="text-[10px] text-gray-500 leading-snug">Scan QR using any UPI app (GPay, PhonePe...)</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 5: Summary & Notes */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-[#5438FF]" />
                <h3 className="text-[12px] font-extrabold text-gray-900 uppercase tracking-widest">Notes, Payment Terms & Bank Remittance</h3>
              </div>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full h-[120px] bg-white border border-gray-200 rounded-xl px-4 py-3 text-[13px] text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#5438FF]/20 resize-none mb-4"
              />
              
              <div 
                className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex gap-3 cursor-pointer select-none transition-colors hover:bg-emerald-100/50"
                onClick={() => setTaxType(taxType === "INTRA" ? "INTER" : "INTRA")}
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <div className="text-[13px] font-extrabold text-emerald-900">
                    {taxType === "INTRA" 
                      ? "Intra-State Supply (27 → 27): CGST (9%) + SGST (9%)" 
                      : "Inter-State Supply: IGST (18%)"}
                  </div>
                  <div className="text-[12px] font-medium text-emerald-700 mt-0.5">
                    Click to toggle Tax Type. Calculated based on supplier entity state vs recipient state.
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="bg-[#101426] rounded-2xl p-6 text-white h-full flex flex-col justify-between">
                <h3 className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-6">Live Calculation Summary</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] text-gray-400 font-medium">Subtotal Amount</span>
                    <span className="text-[14px] font-bold">₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] text-gray-400 font-medium">Discount (₹)</span>
                    <input 
                      type="number"
                      value={discount || ""}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                      className="bg-[#1C2136] px-3 py-1 rounded-md text-[14px] font-bold text-gray-300 w-24 text-right focus:outline-none focus:ring-1 focus:ring-[#5438FF] border border-transparent focus:border-[#5438FF]"
                      min="0"
                      placeholder="0"
                    />
                  </div>
                  
                  {taxType === "INTRA" ? (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-[13px] font-bold text-gray-200">CGST (Intra-State Split)</span>
                        <span className="text-[14px] font-bold">₹{(totalGst / 2).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center pb-4 border-b border-gray-700">
                        <span className="text-[13px] font-bold text-gray-200">SGST (Intra-State Split)</span>
                        <span className="text-[14px] font-bold">₹{(totalGst / 2).toLocaleString()}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between items-center pb-4 border-b border-gray-700">
                      <span className="text-[13px] font-bold text-gray-200">IGST (Inter-State)</span>
                      <span className="text-[14px] font-bold">₹{totalGst.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-end mt-6">
                  <span className="text-[16px] font-extrabold text-[#FBBF24] uppercase">Grand Total</span>
                  <span className="text-[28px] font-extrabold text-emerald-400 leading-none">₹{grandTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-white border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-bold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <Eye className="w-4 h-4" /> Preview Document
            </button>
            <button 
              onClick={() => addToast("PDF Generation initiated...", "info")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-bold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <Download className="w-4 h-4" /> Download PDF
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => handleSubmit("DRAFT")}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <Save className="w-4 h-4" /> Save Draft
            </button>
            <button 
              onClick={() => handleSubmit("PENDING")}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-[13px] font-bold text-white bg-[#5438FF] hover:bg-[#4328E0] transition-colors shadow-lg shadow-[#5438FF]/30"
            >
              <Send className="w-4 h-4" /> Send Document
            </button>
          </div>
        </div>
          </>
        )}
      </div>

      {showCustomizer && (
        <AdvancedTemplateCustomizer
          designName={designTemplate}
          initialHtml={customHtml}
          initialCss={customCss}
          previewData={previewData}
          onClose={() => setShowCustomizer(false)}
          onSave={(newHtml, newCss) => {
            setCustomHtml(newHtml);
            setCustomCss(newCss);
            setShowCustomizer(false);
          }}
        />
      )}
    </div>
  );
}
