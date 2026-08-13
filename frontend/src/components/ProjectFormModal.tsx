import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FolderKanban,
  X,
  User,
  Calendar,
  Clock,
  ChevronDown,
  Plus,
  Cpu,
} from "lucide-react";
import { clientsApi, type Client } from "@/api/clients";
import { projectsApi, type Project } from "@/api/projects";
import { useToastStore } from "@/store/toastStore";
import { useWorkspaceStore } from "@/store/workspaceStore";

const STATUS_OPTIONS = [
  { value: "PLANNING", label: "Planning" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "ON_HOLD", label: "On Hold" },
  { value: "COMPLETED", label: "Completed" },
  { value: "ARCHIVED", label: "Archived" },
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

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: Project | null;
  onSuccess?: (updatedProject?: Project) => void;
}

export default function ProjectFormModal({
  isOpen,
  onClose,
  project,
  onSuccess,
}: ProjectFormModalProps) {
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);
  const { globalWorkspaceId } = useWorkspaceStore();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [clientFetchError, setClientFetchError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    clientId: "",
    technology: "",
    startDate: "",
    endDate: "",
    status: "PLANNING",
    description: "",
  });

  const isEdit = !!project;

  useEffect(() => {
    if (isOpen) {
      setIsLoadingClients(true);
      setClientFetchError(false);
      clientsApi
        .getOptions({ workspaceId: globalWorkspaceId === "all" ? undefined : globalWorkspaceId })
        .then((res) => {
          const list = res.data?.data || (Array.isArray(res.data) ? res.data : []);
          if (Array.isArray(list)) {
            setClients(list as Client[]);
          } else {
            setClients([]);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch client options for project modal, trying list:", err);
          return clientsApi.list({ 
            pageSize: 1000,
            workspaceId: globalWorkspaceId === "all" ? undefined : globalWorkspaceId
          }).then((res) => {
            const list = res.data?.data || (Array.isArray(res.data) ? res.data : []);
            if (Array.isArray(list)) {
              setClients(list as Client[]);
            } else {
              setClients([]);
            }
          });
        })
        .catch((err) => {
          console.error("Failed to fetch clients for project modal:", err);
          setClientFetchError(true);
          setClients([]);
        })
        .finally(() => {
          setIsLoadingClients(false);
        });
    }
  }, [isOpen]);

  useEffect(() => {
    if (project) {
      setForm({
        name: project.name || "",
        clientId: project.clientId || project.client?.id || "",
        technology: project.technology || "",
        startDate: project.startDate ? (project.startDate.split("T")[0] || "") : "",
        endDate: project.endDate ? (project.endDate.split("T")[0] || "") : "",
        status: project.status || "PLANNING",
        description: project.description || "",
      });
    } else {
      setForm({
        name: "",
        clientId: "",
        technology: "",
        startDate: "",
        endDate: "",
        status: "PLANNING",
        description: "",
      });
    }
  }, [project, isOpen]);

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
    if (!form.name || !form.clientId) {
      setError("Please select a client and fill in all required fields.");
      return;
    }
    setError("");
    setIsSaving(true);
    try {
      const payload = {
        name: form.name,
        clientId: form.clientId,
        technology: form.technology || undefined,
        status: form.status,
        description: form.description,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        workspaceId: globalWorkspaceId === "all" ? undefined : globalWorkspaceId,
      };

      if (isEdit && project?.id) {
        const res = await projectsApi.update(project.id, payload);
        if (res.data.success && res.data.data) {
          addToast("Project updated successfully", "success");
          onSuccess?.(res.data.data);
          onClose();
        }
      } else {
        const res = await projectsApi.create(payload);
        if (res.data.success && res.data.data) {
          addToast("Project created successfully", "success");
          onSuccess?.(res.data.data);
          onClose();
        }
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        `Failed to ${isEdit ? "update" : "create"} project`;
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
            {isEdit ? "Edit Project" : "Add Project"}
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

          {/* Row 1: Project Name & Client */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Project Name" required>
              <InputBox
                badge={<FolderKanban className="w-3.5 h-3.5" />}
                badgeBg="bg-blue-50 text-blue-600 border-blue-100"
              >
                <input
                  type="text"
                  className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none font-medium"
                  placeholder="Enter project name"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  required
                />
              </InputBox>
            </FormField>

            <FormField label="Client" required>
              <div className="flex flex-col gap-1">
                <InputBox
                  badge={<User className="w-3.5 h-3.5" />}
                  badgeBg="bg-purple-50 text-purple-600 border-purple-100"
                >
                  <select
                    className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 appearance-none focus:outline-none cursor-pointer font-medium"
                    value={form.clientId}
                    onChange={(e) => set("clientId", e.target.value)}
                    required
                  >
                    <option value="" className="text-gray-400">
                      {isLoadingClients
                        ? "Loading clients..."
                        : clientFetchError
                        ? "Failed to load clients"
                        : clients.length === 0
                        ? "No clients found in database"
                        : "Select a client"}
                    </option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id} className="text-gray-900 font-medium">
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 mr-2.5 shrink-0 pointer-events-none" />
                </InputBox>

                {clients.length === 0 && !isLoadingClients && !clientFetchError && (
                  <div className="flex items-center justify-between text-[10px] mt-0.5">
                    <span className="text-amber-600 font-medium">No clients found in DB.</span>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        navigate("/clients/new");
                      }}
                      className="text-blue-600 font-bold hover:underline flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" />
                      Add New Client
                    </button>
                  </div>
                )}

                {clientFetchError && (
                  <p className="text-[10px] text-red-500 mt-0.5 font-medium">
                    Failed to load clients from database.
                  </p>
                )}
              </div>
            </FormField>
          </div>

          {/* Row 2: Start Date & End Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Start Date">
              <InputBox
                badge={<Calendar className="w-3.5 h-3.5" />}
                badgeBg="bg-amber-50 text-amber-600 border-amber-100"
              >
                <input
                  type="date"
                  className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none font-medium"
                  value={form.startDate}
                  onChange={(e) => set("startDate", e.target.value)}
                />
              </InputBox>
            </FormField>

            <FormField label="End Date">
              <InputBox
                badge={<Calendar className="w-3.5 h-3.5" />}
                badgeBg="bg-emerald-50 text-emerald-600 border-emerald-100"
              >
                <input
                  type="date"
                  className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none font-medium"
                  value={form.endDate}
                  onChange={(e) => set("endDate", e.target.value)}
                />
              </InputBox>
            </FormField>
          </div>

          {/* Row 3: Technology & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Technology">
              <InputBox
                badge={<Cpu className="w-3.5 h-3.5" />}
                badgeBg="bg-indigo-50 text-indigo-600 border-indigo-100"
              >
                <input
                  type="text"
                  className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none font-medium"
                  placeholder="e.g. React, Node.js, Python"
                  value={form.technology}
                  onChange={(e) => set("technology", e.target.value)}
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
                  {STATUS_OPTIONS.map((st) => (
                    <option key={st.value} value={st.value} className="text-gray-900">{st.label}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 mr-2.5 shrink-0 pointer-events-none" />
              </InputBox>
            </FormField>
          </div>

          {/* Row 4: Description */}
          <FormField label="Description">
            <div className="relative flex items-start w-full bg-white border border-gray-200 rounded-lg focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/15 transition-all overflow-hidden p-2.5">
              <textarea
                rows={3}
                className="w-full bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none font-medium resize-none"
                placeholder="Enter project description..."
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
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
                "Add Project"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
