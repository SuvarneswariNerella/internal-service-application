import { useState, useEffect } from "react";
import {
  Server,
  X,
  User,
  Calendar,
  Clock,
  ChevronDown,
  HardDrive,
  Network,
  RefreshCw,
  FolderGit2,
  Lock,
} from "lucide-react";
import { clientsApi, type Client } from "@/api/clients";
import { projectsApi, type Project } from "@/api/projects";
import { serversApi, type Server as ServerType } from "@/api/servers";
import { useToastStore } from "@/store/toastStore";

const SERVER_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "EXPIRING_SOON", label: "Expiring Soon" },
  { value: "EXPIRED", label: "Expired" },
  { value: "DECOMMISSIONED", label: "Decommissioned" },
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

interface ServerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  server?: ServerType | null;
  lockedClientId?: string;
  lockedProjectId?: string;
  onSuccess?: (updatedServer?: ServerType) => void;
}

export default function ServerFormModal({
  isOpen,
  onClose,
  server,
  lockedClientId,
  lockedProjectId,
  onSuccess,
}: ServerFormModalProps) {
  const addToast = useToastStore((s) => s.addToast);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    provider: "",
    ipAddress: "",
    purchaseDate: "",
    expiryDate: "",
    renewalCost: "",
    renewalFrequency: "",
    status: "ACTIVE",
    clientId: "",
    projectId: "",
  });

  const isEdit = !!server;

  useEffect(() => {
    if (isOpen) {
      clientsApi
        .getOptions()
        .then((res) => {
          if (res.data?.success && res.data?.data) {
            setClients(res.data.data as any);
          }
        })
        .catch(() => clientsApi.list({ pageSize: 1000 }))
        .then((res: any) => {
          if (res?.data?.success && res?.data?.data) {
            setClients(res.data.data);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch clients for server modal:", err);
        });

      projectsApi
        .list({ pageSize: 1000 })
        .then((res) => {
          if (res.data?.success && res.data?.data) {
            setProjects(res.data.data);
          }
        })
        .catch((err) => console.error("Failed to fetch all projects for server modal:", err));
    }
  }, [isOpen]);

  useEffect(() => {
    if (server) {
      setForm({
        name: server.name || "",
        provider: server.provider || "",
        ipAddress: server.ipAddress || "",
        purchaseDate: server.purchaseDate ? (server.purchaseDate.split("T")[0] || "") : "",
        expiryDate: server.expiryDate ? (server.expiryDate.split("T")[0] || "") : "",
        renewalCost: server.renewalCost ? String(server.renewalCost) : "",
        renewalFrequency: server.renewalFrequency || "",
        status: server.status || "ACTIVE",
        clientId: server.clientId || server.client?.id || "",
        projectId: server.projectId || server.project?.id || "",
      });
    } else {
      setForm({
        name: "",
        provider: "",
        ipAddress: "",
        purchaseDate: "",
        expiryDate: "",
        renewalCost: "",
        renewalFrequency: "",
        status: "ACTIVE",
        clientId: lockedClientId || "",
        projectId: lockedProjectId || "",
      });
    }
  }, [server, isOpen, lockedClientId, lockedProjectId]);

  useEffect(() => {
    if (!isOpen || !form.clientId) return;
    projectsApi
      .list({ clientId: form.clientId, pageSize: 1000 })
      .then((res) => {
        const projectData = res.data?.data;
        if (res.data?.success && Array.isArray(projectData) && projectData.length > 0) {
          setProjects((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const newItems = projectData.filter((p: Project) => !existingIds.has(p.id));
            return [...prev, ...newItems];
          });
        }
      })
      .catch((err) => console.error("Failed to fetch projects for selected client:", err));
  }, [form.clientId, isOpen]);

  const filteredProjects = form.clientId
    ? projects.filter((p) => p.clientId === form.clientId || p.client?.id === form.clientId)
    : projects;

  const handleClientChange = (newClientId: string) => {
    setForm((f) => {
      const selectedProj = projects.find((p) => p.id === f.projectId);
      const isProjValid =
        selectedProj &&
        (!newClientId ||
          selectedProj.clientId === newClientId ||
          selectedProj.client?.id === newClientId);
      return {
        ...f,
        clientId: newClientId,
        projectId: isProjValid ? f.projectId : "",
      };
    });
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.provider) {
      setError("Please fill in all required fields.");
      return;
    }
    setError("");
    setIsSaving(true);
    try {
      const payload = {
        name: form.name,
        provider: form.provider,
        ipAddress: form.ipAddress || undefined,
        purchaseDate: form.purchaseDate || undefined,
        expiryDate: form.expiryDate || undefined,
        renewalCost: form.renewalCost ? Number(form.renewalCost) : undefined,
        renewalFrequency: form.renewalFrequency || undefined,
        status: form.status,
        clientId: form.clientId || undefined,
        projectId: form.projectId || undefined,
      };

      if (isEdit && server?.id) {
        const res = await serversApi.update(server.id, payload);
        if (res.data.success && res.data.data) {
          addToast("Server updated successfully", "success");
          onSuccess?.(res.data.data);
          onClose();
        }
      } else {
        const res = await serversApi.create(payload);
        if (res.data.success && res.data.data) {
          addToast("Server created successfully", "success");
          onSuccess?.(res.data.data);
          onClose();
        }
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        `Failed to ${isEdit ? "update" : "create"} server`;
      setError(message);
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
        className="relative w-full max-w-[680px] bg-white rounded-xl shadow-2xl p-5 sm:p-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] cursor-default"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">
            {isEdit ? "Edit Server" : "Add Server"}
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

          {/* Row 1: Server Name & Provider */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Server Name" required>
              <InputBox
                badge={<Server className="w-3.5 h-3.5" />}
                badgeBg="bg-amber-50 text-amber-600 border-amber-100"
              >
                <input
                  type="text"
                  className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none font-medium"
                  placeholder="Enter server name"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  required
                />
              </InputBox>
            </FormField>

            <FormField label="Provider" required>
              <InputBox
                badge={<HardDrive className="w-3.5 h-3.5" />}
                badgeBg="bg-purple-50 text-purple-600 border-purple-100"
              >
                <input
                  type="text"
                  className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none font-medium"
                  placeholder="e.g. AWS, DigitalOcean, Hetzner"
                  value={form.provider}
                  onChange={(e) => set("provider", e.target.value)}
                  required
                />
              </InputBox>
            </FormField>
          </div>

          {/* Row 2: Client & Project */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Client">
              <InputBox
                badge={<User className="w-3.5 h-3.5" />}
                badgeBg={!isEdit && lockedProjectId ? "bg-gray-100 text-gray-500 border-gray-200" : "bg-purple-50 text-purple-600 border-purple-100"}
              >
                <select
                  disabled={!isEdit && !!lockedProjectId}
                  className={`w-full h-full px-2.5 bg-transparent text-xs text-gray-900 appearance-none focus:outline-none font-medium ${!isEdit && lockedProjectId ? "cursor-not-allowed text-gray-500" : "cursor-pointer"}`}
                  value={form.clientId}
                  onChange={(e) => handleClientChange(e.target.value)}
                >
                  <option value="" className="text-gray-400">No client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id} className="text-gray-900">{c.name}</option>
                  ))}
                </select>
                {!isEdit && lockedProjectId ? (
                  <Lock className="w-3.5 h-3.5 text-gray-400 mr-2.5 shrink-0 pointer-events-none" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 mr-2.5 shrink-0 pointer-events-none" />
                )}
              </InputBox>
            </FormField>

            {form.clientId && (
              <FormField label="Project">
                <InputBox
                  badge={<FolderGit2 className="w-3.5 h-3.5" />}
                  badgeBg={!isEdit && lockedProjectId ? "bg-indigo-100 text-indigo-700 border-indigo-200" : "bg-indigo-50 text-indigo-600 border-indigo-100"}
                >
                  <select
                    disabled={!isEdit && !!lockedProjectId}
                    className={`w-full h-full px-2.5 bg-transparent text-xs appearance-none focus:outline-none font-medium ${!isEdit && lockedProjectId ? "cursor-not-allowed text-indigo-900 font-semibold" : "text-gray-900 cursor-pointer"}`}
                    value={form.projectId}
                    onChange={(e) => set("projectId", e.target.value)}
                  >
                    <option value="" className="text-gray-400">No project</option>
                    {filteredProjects.map((p) => (
                      <option key={p.id} value={p.id} className="text-gray-900">{p.name}</option>
                    ))}
                  </select>
                  {!isEdit && lockedProjectId ? (
                    <Lock className="w-3.5 h-3.5 text-indigo-500 mr-2.5 shrink-0 pointer-events-none" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400 mr-2.5 shrink-0 pointer-events-none" />
                  )}
                </InputBox>
              </FormField>
            )}
          </div>

          {/* Row 3: IP Address & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="IP Address">
              <InputBox
                badge={<Network className="w-3.5 h-3.5" />}
                badgeBg="bg-blue-50 text-blue-600 border-blue-100"
              >
                <input
                  type="text"
                  className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none font-medium font-mono"
                  placeholder="e.g. 192.168.1.1"
                  value={form.ipAddress}
                  onChange={(e) => set("ipAddress", e.target.value)}
                />
              </InputBox>
            </FormField>

            <FormField label="Status">
              <InputBox
                badge={<Clock className="w-3.5 h-3.5" />}
                badgeBg="bg-teal-50 text-teal-600 border-teal-100"
              >
                <select
                  className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 appearance-none focus:outline-none cursor-pointer font-medium"
                  value={form.status}
                  onChange={(e) => set("status", e.target.value)}
                >
                  {SERVER_STATUS_OPTIONS.map((st) => (
                    <option key={st.value} value={st.value} className="text-gray-900">{st.label}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 mr-2.5 shrink-0 pointer-events-none" />
              </InputBox>
            </FormField>
          </div>

          {/* Row 4: Purchase Date & Expiry Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Purchase Date">
              <InputBox
                badge={<Calendar className="w-3.5 h-3.5" />}
                badgeBg="bg-amber-50 text-amber-600 border-amber-100"
              >
                <input
                  type="date"
                  className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none font-medium"
                  value={form.purchaseDate}
                  onChange={(e) => set("purchaseDate", e.target.value)}
                />
              </InputBox>
            </FormField>

            <FormField label="Expiry Date">
              <InputBox
                badge={<Calendar className="w-3.5 h-3.5" />}
                badgeBg="bg-red-50 text-red-600 border-red-100"
              >
                <input
                  type="date"
                  className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none font-medium"
                  value={form.expiryDate}
                  onChange={(e) => set("expiryDate", e.target.value)}
                />
              </InputBox>
            </FormField>
          </div>

          {/* Row 5: Renewal Cost & Renewal Frequency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Renewal Cost">
              <InputBox
                badge={<span className="font-bold text-xs">₹</span>}
                badgeBg="bg-emerald-50 text-emerald-600 border-emerald-100"
              >
                <input
                  type="number"
                  className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none font-medium"
                  placeholder="e.g. 5000"
                  value={form.renewalCost}
                  onChange={(e) => set("renewalCost", e.target.value)}
                />
              </InputBox>
            </FormField>

            <FormField label="Renewal Frequency">
              <InputBox
                badge={<RefreshCw className="w-3.5 h-3.5" />}
                badgeBg="bg-teal-50 text-teal-600 border-teal-100"
              >
                <input
                  type="text"
                  className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none font-medium"
                  placeholder="e.g. Monthly, Annual"
                  value={form.renewalFrequency}
                  onChange={(e) => set("renewalFrequency", e.target.value)}
                />
              </InputBox>
            </FormField>
          </div>

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
                  {isEdit ? "Saving..." : "Adding..."}
                </span>
              ) : isEdit ? (
                "Edit"
              ) : (
                "Add Server"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
