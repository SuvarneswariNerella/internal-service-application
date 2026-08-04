import { useState, useEffect } from "react";
import {
  X,
  ChevronDown,
  FileText,
  DollarSign,
  Calendar,
  ClipboardList,
  FolderGit2,
  StickyNote,
  Link,
} from "lucide-react";
import { projectsApi, type Project } from "@/api/projects";
import { financeApi, type FinanceRecord } from "@/api/finance";
import { useToastStore } from "@/store/toastStore";

const FINANCE_TYPE_OPTIONS = [
  { value: "INVOICE", label: "Invoice" },
  { value: "RECEIPT", label: "Receipt" },
  { value: "QUOTATION", label: "Quotation" },
  { value: "CONTRACT", label: "Contract" },
  { value: "EXPENSE", label: "Expense" },
];

const FINANCE_STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "PAID", label: "Paid" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "DRAFT", label: "Draft" },
];

const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "GBP", label: "GBP (£)" },
  { value: "INR", label: "INR (₹)" },
  { value: "AUD", label: "AUD (A$)" },
  { value: "CAD", label: "CAD (C$)" },
];

function FormField({
  label,
  required,
  children,
  className = "",
}: {
  label?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wider mb-1">
          {label}
          {required && <span className="text-red-500 font-bold ml-0.5">*</span>}
        </label>
      )}
      {children}
    </div>
  );
}

function InputBox({
  badge,
  badgeBg = "bg-blue-50/80 text-blue-600 border-blue-100",
  children,
  className = "",
}: {
  badge?: React.ReactNode;
  badgeBg?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative flex items-center h-[38px] w-full bg-white border border-gray-200 rounded-lg focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/15 transition-all overflow-hidden ${className}`}
    >
      {badge && (
        <div className={`h-full px-2.5 flex items-center justify-center shrink-0 border-r ${badgeBg}`}>
          {badge}
        </div>
      )}
      {children}
    </div>
  );
}

interface FinanceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  record?: FinanceRecord | null;
  onSuccess?: (updatedRecord?: FinanceRecord) => void;
}

export default function FinanceFormModal({
  isOpen,
  onClose,
  record,
  onSuccess,
}: FinanceFormModalProps) {
  const addToast = useToastStore((s) => s.addToast);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    projectId: "",
    type: "INVOICE",
    title: "",
    amount: "",
    currency: "USD",
    status: "PENDING",
    dueDate: "",
    paidDate: "",
    fileUrl: "",
    notes: "",
  });

  const isEdit = !!record;

  // Load projects on open
  useEffect(() => {
    if (isOpen) {
      projectsApi
        .list({ pageSize: 1000 })
        .then((res) => {
          if (res.data?.success && res.data?.data) {
            setProjects(res.data.data);
          }
        })
        .catch((err) => console.error("Failed to fetch projects:", err));
    }
  }, [isOpen]);

  // Populate form when editing
  useEffect(() => {
    if (record) {
      setForm({
        projectId: record.projectId || "",
        type: record.type || "INVOICE",
        title: record.title || "",
        amount: record.amount ? String(record.amount) : "",
        currency: record.currency || "USD",
        status: record.status || "PENDING",
        dueDate: record.dueDate ? record.dueDate.split("T")[0] || "" : "",
        paidDate: record.paidDate ? record.paidDate.split("T")[0] || "" : "",
        fileUrl: record.fileUrl || "",
        notes: record.notes || "",
      });
    } else {
      setForm({
        projectId: "",
        type: "INVOICE",
        title: "",
        amount: "",
        currency: "USD",
        status: "PENDING",
        dueDate: "",
        paidDate: "",
        fileUrl: "",
        notes: "",
      });
    }
  }, [record, isOpen]);

  // Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  // Auto-set status to PAID when paidDate is entered
  const handlePaidDateChange = (value: string) => {
    setForm((f) => ({
      ...f,
      paidDate: value,
      status: value ? "PAID" : f.status,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.projectId || !form.amount) {
      setError("Please fill in all required fields (Title, Project, Amount).");
      return;
    }
    setError("");
    setIsSaving(true);
    try {
      const payload = {
        projectId: form.projectId,
        type: form.type,
        title: form.title,
        amount: Number(form.amount),
        currency: form.currency,
        status: form.status,
        dueDate: form.dueDate || null,
        paidDate: form.paidDate || null,
        fileUrl: form.fileUrl || null,
        notes: form.notes || null,
      };

      if (isEdit && record?.id) {
        const res = await financeApi.update(record.id, payload);
        if (res.data.success && res.data.data) {
          addToast("Finance record updated successfully", "success");
          onSuccess?.(res.data.data);
          onClose();
        }
      } else {
        const res = await financeApi.create(payload);
        if (res.data.success && res.data.data) {
          addToast("Finance record created successfully", "success");
          onSuccess?.(res.data.data);
          onClose();
        }
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        `Failed to ${isEdit ? "update" : "create"} finance record`;
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const getCurrencySymbol = () => {
    const symbols: Record<string, string> = { USD: "$", EUR: "€", GBP: "£", INR: "₹", AUD: "A$", CAD: "C$" };
    return symbols[form.currency] || "$";
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/45 backdrop-blur-sm overflow-hidden cursor-pointer"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[680px] bg-white rounded-xl shadow-2xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] cursor-default"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">
            {isEdit ? "Edit Finance Record" : "New Finance Record"}
          </h2>
          <button
            onClick={onClose}
            type="button"
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="px-3 py-2 rounded-lg border text-xs bg-red-50 border-red-200 text-red-600 font-medium">
              {error}
            </div>
          )}

          {/* Row 1: Title & Project */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Title" required>
              <InputBox
                badge={<ClipboardList className="w-3.5 h-3.5" />}
                badgeBg="bg-indigo-50 text-indigo-600 border-indigo-100"
              >
                <input
                  type="text"
                  className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none font-medium"
                  placeholder="e.g. Website Development Invoice"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  required
                />
              </InputBox>
            </FormField>

            <FormField label="Project" required>
              <InputBox
                badge={<FolderGit2 className="w-3.5 h-3.5" />}
                badgeBg="bg-purple-50 text-purple-600 border-purple-100"
              >
                <select
                  className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 appearance-none focus:outline-none cursor-pointer font-medium"
                  value={form.projectId}
                  onChange={(e) => set("projectId", e.target.value)}
                  required
                >
                  <option value="" className="text-gray-400">Select project...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id} className="text-gray-900">
                      {p.name} {p.client?.name ? `(${p.client.name})` : ""}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 mr-2.5 shrink-0 pointer-events-none" />
              </InputBox>
            </FormField>
          </div>

          {/* Row 2: Type & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Type" required>
              <InputBox
                badge={<FileText className="w-3.5 h-3.5" />}
                badgeBg="bg-amber-50 text-amber-600 border-amber-100"
              >
                <select
                  className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 appearance-none focus:outline-none cursor-pointer font-medium"
                  value={form.type}
                  onChange={(e) => set("type", e.target.value)}
                >
                  {FINANCE_TYPE_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value} className="text-gray-900">{t.label}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 mr-2.5 shrink-0 pointer-events-none" />
              </InputBox>
            </FormField>

            <FormField label="Status" required>
              <InputBox
                badge={
                  <span className={`w-2 h-2 rounded-full ${
                    form.status === "PAID" ? "bg-emerald-500" :
                    form.status === "PENDING" ? "bg-amber-500" :
                    form.status === "OVERDUE" ? "bg-rose-500" :
                    form.status === "CANCELLED" ? "bg-gray-400" :
                    "bg-blue-400"
                  }`} />
                }
                badgeBg="bg-gray-50 text-gray-600 border-gray-100"
              >
                <select
                  className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 appearance-none focus:outline-none cursor-pointer font-medium"
                  value={form.status}
                  onChange={(e) => set("status", e.target.value)}
                >
                  {FINANCE_STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value} className="text-gray-900">{s.label}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 mr-2.5 shrink-0 pointer-events-none" />
              </InputBox>
            </FormField>
          </div>

          {/* Row 3: Amount & Currency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Amount" required>
              <InputBox
                badge={<span className="font-bold text-xs">{getCurrencySymbol()}</span>}
                badgeBg="bg-emerald-50 text-emerald-600 border-emerald-100"
              >
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none font-medium font-mono"
                  placeholder="e.g. 5000.00"
                  value={form.amount}
                  onChange={(e) => set("amount", e.target.value)}
                  required
                />
              </InputBox>
            </FormField>

            <FormField label="Currency">
              <InputBox
                badge={<DollarSign className="w-3.5 h-3.5" />}
                badgeBg="bg-teal-50 text-teal-600 border-teal-100"
              >
                <select
                  className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 appearance-none focus:outline-none cursor-pointer font-medium"
                  value={form.currency}
                  onChange={(e) => set("currency", e.target.value)}
                >
                  {CURRENCY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value} className="text-gray-900">{c.label}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 mr-2.5 shrink-0 pointer-events-none" />
              </InputBox>
            </FormField>
          </div>

          {/* Row 4: Due Date & Paid Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Due Date">
              <InputBox
                badge={<Calendar className="w-3.5 h-3.5" />}
                badgeBg="bg-amber-50 text-amber-600 border-amber-100"
              >
                <input
                  type="date"
                  className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none font-medium"
                  value={form.dueDate}
                  onChange={(e) => set("dueDate", e.target.value)}
                />
              </InputBox>
            </FormField>

            <FormField label="Paid Date">
              <InputBox
                badge={<Calendar className="w-3.5 h-3.5" />}
                badgeBg="bg-emerald-50 text-emerald-600 border-emerald-100"
              >
                <input
                  type="date"
                  className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none font-medium"
                  value={form.paidDate}
                  onChange={(e) => handlePaidDateChange(e.target.value)}
                />
              </InputBox>
            </FormField>
          </div>

          {/* Row 5: File URL */}
          <FormField label="File / Document URL">
            <InputBox
              badge={<Link className="w-3.5 h-3.5" />}
              badgeBg="bg-blue-50 text-blue-600 border-blue-100"
            >
              <input
                type="url"
                className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none font-medium"
                placeholder="https://drive.google.com/file/..."
                value={form.fileUrl}
                onChange={(e) => set("fileUrl", e.target.value)}
              />
            </InputBox>
          </FormField>

          {/* Row 6: Notes */}
          <FormField label="Notes">
            <div className="relative flex items-start w-full bg-white border border-gray-200 rounded-lg focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/15 transition-all overflow-hidden">
              <div className="h-full px-2.5 py-2.5 flex items-start justify-center shrink-0 border-r bg-gray-50 text-gray-500 border-gray-100">
                <StickyNote className="w-3.5 h-3.5" />
              </div>
              <textarea
                className="w-full min-h-[60px] px-2.5 py-2 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none font-medium resize-none"
                placeholder="Additional notes about this record..."
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                rows={2}
              />
            </div>
          </FormField>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3.5 border-t border-gray-100 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-lg text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="h-9 px-4 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-60"
            >
              {isSaving ? (
                <span className="inline-flex items-center gap-1.5">
                  <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {isEdit ? "Saving..." : "Creating..."}
                </span>
              ) : isEdit ? (
                "Save Changes"
              ) : (
                "Create Record"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
