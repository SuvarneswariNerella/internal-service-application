import { useState, useEffect } from "react";
import {
  Link as LinkIcon,
  X,
  Hash,
  User,
  FolderKanban,
  ShieldAlert,
  Layers,
  ChevronDown,
} from "lucide-react";
import { urlsApi, type ShortUrl } from "@/api/urls";
import { clientsApi, type Client } from "@/api/clients";
import { projectsApi, type Project } from "@/api/projects";
import { qrCodesApi } from "@/api/qrCodes";
import { useToastStore } from "@/store/toastStore";
import { useWorkspaceStore } from "@/store/workspaceStore";

const CATEGORY_OPTIONS = [
  "Client Deliverable",
  "Internal Tool",
  "Server Access",
  "Documentation",
  "Marketing",
  "Other",
];

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "PAUSED", label: "Paused" },
  { value: "EXPIRED", label: "Expired" },
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

interface UrlFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  urlItem?: ShortUrl | null;
  onSuccess?: (updatedUrl?: ShortUrl) => void;
}

export default function UrlFormModal({
  isOpen,
  onClose,
  urlItem,
  onSuccess,
}: UrlFormModalProps) {
  const addToast = useToastStore((s) => s.addToast);
  const { globalWorkspaceId } = useWorkspaceStore();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [qrPreview, setQrPreview] = useState<string>("");
  const [isCustomCategory, setIsCustomCategory] = useState(false);

  // Dropdown data
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  // Form State
  const [form, setForm] = useState({
    originalUrl: "",
    alias: "",
    clientId: "",
    projectId: "",
    category: "",
    status: "ACTIVE" as "ACTIVE" | "PAUSED" | "EXPIRED",
  });

  const isEdit = !!urlItem;

  // Fetch QR Preview
  useEffect(() => {
    if (!form.originalUrl && !form.alias) {
      setQrPreview("");
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const previewContent = form.alias 
          ? `${window.location.origin}/s/${form.alias}` 
          : form.originalUrl;
        
        const res = await qrCodesApi.preview({
          type: "URL",
          content: previewContent,
          format: "SVG"
        });
        if (res.data?.data?.qrData) {
          setQrPreview(res.data.data.qrData);
        }
      } catch (err) {
        // fail silently for preview
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [form.originalUrl, form.alias]);

  // Load clients & domains when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsLoadingClients(true);
      clientsApi
        .getOptions({ workspaceId: globalWorkspaceId === "all" ? undefined : globalWorkspaceId })
        .then((res) => {
          if (res.data?.data) setClients(res.data.data as Client[]);
        })
        .catch(() => clientsApi.list({ 
          pageSize: 1000,
          workspaceId: globalWorkspaceId === "all" ? undefined : globalWorkspaceId
        }))
        .then((res: any) => {
          if (res?.data?.data) setClients(res.data.data);
        })
        .catch(console.error)
        .finally(() => setIsLoadingClients(false));
    }
  }, [isOpen]);

  // Load projects dynamically when clientId changes
  useEffect(() => {
    if (form.clientId) {
      setIsLoadingProjects(true);
      projectsApi
        .list({ clientId: form.clientId, pageSize: 1000 })
        .then((res) => {
          if (res.data?.data) setProjects(res.data.data);
          else setProjects([]);
        })
        .catch(console.error)
        .finally(() => setIsLoadingProjects(false));
    } else {
      setProjects([]);
      setForm((f) => ({ ...f, projectId: "" }));
    }
  }, [form.clientId]);

  // Reset or initialize form
  useEffect(() => {
    if (urlItem) {
      setForm({
        originalUrl: urlItem.originalUrl || "",
        alias: urlItem.alias || "",
        clientId: urlItem.clientId || urlItem.client?.id || "",
        projectId: urlItem.projectId || urlItem.project?.id || "",
        category: urlItem.category || "",
        status: urlItem.status || "ACTIVE",
      });
      setIsCustomCategory(urlItem.category ? !CATEGORY_OPTIONS.includes(urlItem.category) : false);
    } else {
      setForm({
        originalUrl: "",
        alias: "",
        clientId: "",
        projectId: "",
        category: "",
        status: "ACTIVE",
      });
      setIsCustomCategory(false);
    }
  }, [urlItem, isOpen]);

  // Handle ESC key
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

  const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.originalUrl) {
      setError("Please enter a valid original destination URL.");
      return;
    }
    setError("");
    setIsSaving(true);

    try {
      const payload: any = {
        originalUrl: form.originalUrl,
        alias: form.alias || undefined,
        clientId: form.clientId || undefined,
        projectId: form.projectId || undefined,
        category: form.category || undefined,
        status: form.status,
        workspaceId: globalWorkspaceId === "all" ? undefined : globalWorkspaceId,
      };

      if (isEdit && urlItem?.id) {
        const res = await urlsApi.update(urlItem.id, payload);
        if (res.data.success && res.data.data) {
          addToast("Short URL updated successfully", "success");
          onSuccess?.(res.data.data);
          onClose();
        }
      } else {
        const res = await urlsApi.create(payload);
        if (res.data.success && res.data.data) {
          addToast("Short URL created successfully", "success");
          onSuccess?.(res.data.data);
          onClose();
        }
      }
    } catch (err: unknown) {
      const resData = (err as { response?: { data?: { error?: string; details?: { path: string; message: string }[] } } })?.response?.data;
      if (resData?.details && Array.isArray(resData.details) && resData.details.length > 0) {
        const detailMsg = resData.details.map((d) => `${d.path ? d.path + ": " : ""}${d.message}`).join(" | ");
        setError(detailMsg);
      } else {
        setError(resData?.error || `Failed to ${isEdit ? "update" : "create"} short URL`);
      }
    } finally {
      setIsSaving(false);
    }
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
            {isEdit ? "Edit Short URL" : "Add Short URL"}
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

          {/* Original URL */}
          <FormField label="Original Destination URL" required>
            <InputBox badge={<LinkIcon className="w-3.5 h-3.5" />} badgeBg="bg-blue-50 text-blue-600 border-blue-100">
              <input
                type="url"
                className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none font-medium"
                placeholder="https://example.com/very-long-destination-link"
                value={form.originalUrl}
                onChange={(e) => set("originalUrl", e.target.value)}
                required
              />
            </InputBox>
          </FormField>

          {/* Row 1: Custom Alias & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Custom Alias">
              <InputBox badge={<Hash className="w-3.5 h-3.5" />} badgeBg="bg-purple-50 text-purple-600 border-purple-100">
                <input
                  type="text"
                  className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none font-medium"
                  placeholder="e.g. my-custom-link"
                  value={form.alias}
                  onChange={(e) => set("alias", e.target.value)}
                />
              </InputBox>
            </FormField>

            <FormField label="Category / Type">
              <InputBox badge={<Layers className="w-3.5 h-3.5" />} badgeBg="bg-teal-50 text-teal-600 border-teal-100">
                {isCustomCategory ? (
                  <div className="flex w-full h-full items-center">
                    <input
                      type="text"
                      className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none font-medium"
                      placeholder="Type custom category..."
                      value={form.category}
                      onChange={(e) => set("category", e.target.value)}
                      autoFocus
                    />
                    <button 
                      type="button" 
                      onClick={() => { setIsCustomCategory(false); set("category", ""); }}
                      className="px-2.5 text-gray-400 hover:text-gray-600 transition-colors h-full flex items-center"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <select
                      className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 appearance-none focus:outline-none cursor-pointer font-medium"
                      value={CATEGORY_OPTIONS.includes(form.category) ? form.category : form.category ? "Other" : ""}
                      onChange={(e) => {
                        if (e.target.value === "Other") {
                          setIsCustomCategory(true);
                          set("category", "");
                        } else {
                          set("category", e.target.value);
                        }
                      }}
                    >
                      <option value="" className="text-gray-400">Select category...</option>
                      {CATEGORY_OPTIONS.map((cat) => (
                        <option key={cat} value={cat} className="text-gray-900">{cat}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400 mr-2.5 shrink-0 pointer-events-none" />
                  </>
                )}
              </InputBox>
            </FormField>
          </div>

          {/* Row 2: Client & Project */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Client">
              <InputBox badge={<User className="w-3.5 h-3.5" />} badgeBg="bg-amber-50 text-amber-600 border-amber-100">
                <select
                  className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 appearance-none focus:outline-none cursor-pointer font-medium"
                  value={form.clientId}
                  onChange={(e) => set("clientId", e.target.value)}
                >
                  <option value="">{isLoadingClients ? "Loading clients..." : "All Clients (System Internal)"}</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id} className="text-gray-900 font-medium">
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 mr-2.5 shrink-0 pointer-events-none" />
              </InputBox>
            </FormField>

            <FormField label="Project">
              <InputBox badge={<FolderKanban className="w-3.5 h-3.5" />} badgeBg="bg-indigo-50 text-indigo-600 border-indigo-100">
                <select
                  className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 appearance-none focus:outline-none cursor-pointer font-medium disabled:opacity-50"
                  value={form.projectId}
                  onChange={(e) => set("projectId", e.target.value)}
                  disabled={!form.clientId || isLoadingProjects}
                >
                  <option value="">
                    {!form.clientId
                      ? "Select a Client first"
                      : isLoadingProjects
                      ? "Loading projects..."
                      : projects.length === 0
                      ? "No projects found for client"
                      : "Select a project"}
                  </option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id} className="text-gray-900 font-medium">
                      {p.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 mr-2.5 shrink-0 pointer-events-none" />
              </InputBox>
            </FormField>
          </div>

          {/* QR Code Preview Field */}
          <div className="pt-2">
            <FormField label="Generated QR Code (Preview)">
              <div className="flex items-center justify-center p-4 bg-gray-50 border border-gray-200 rounded-lg h-[120px] overflow-hidden">
                {qrPreview ? (
                  qrPreview.startsWith("data:") ? (
                    <img src={qrPreview} alt="QR Code Preview" className="h-full object-contain mix-blend-multiply" />
                  ) : (
                    <div 
                      className="h-full flex items-center justify-center mix-blend-multiply [&>svg]:h-full [&>svg]:w-auto" 
                      dangerouslySetInnerHTML={{ __html: qrPreview }} 
                    />
                  )
                ) : (
                  <p className="text-gray-400 text-xs text-center">
                    Enter a destination URL to instantly preview the QR code that will be mapped to this link.
                  </p>
                )}
              </div>
            </FormField>
          </div>

          {/* Row 3: Status */}
          <FormField label="Status">
            <InputBox badge={<ShieldAlert className="w-3.5 h-3.5" />} badgeBg="bg-emerald-50 text-emerald-600 border-emerald-100">
              <select
                className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 appearance-none focus:outline-none cursor-pointer font-medium"
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st.value} value={st.value} className="text-gray-900">{st.label}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 mr-2.5 shrink-0 pointer-events-none" />
            </InputBox>
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
              className="h-9 px-4 rounded-lg text-xs font-semibold text-white bg-[#0052FF] hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-60"
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
                "Edit"
              ) : (
                "Add Short URL"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
