import { useState, useEffect } from "react";
import { X, Save, Calendar, Type, Tag, Flag, Activity, Building2, Briefcase, ChevronDown, User as UserIcon } from "lucide-react";
import Button from "@/components/ui/Button";

import { maintenanceApi, type MaintenanceRecord } from "@/api/maintenance";
import { clientsApi } from "@/api/clients";
import { projectsApi, type Project } from "@/api/projects";
import { usersApi, type User } from "@/api/users";
import { useToastStore } from "@/store/toastStore";
import { useWorkspaceStore } from "@/store/workspaceStore";

function FormField({ label, required, children, className = "" }: any) {
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

function InputBox({ badge, badgeBg = "bg-gray-50 text-gray-900 border-gray-200", children, className = "" }: any) {
  return (
    <div className={`relative flex items-center h-[38px] w-full bg-white border border-gray-200 rounded-lg focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/15 transition-all overflow-hidden ${className}`}>
      {badge && (
        <div className={`h-full px-2.5 flex items-center justify-center shrink-0 border-r ${badgeBg}`}>
          {badge}
        </div>
      )}
      {children}
    </div>
  );
}

interface MaintenanceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  record?: MaintenanceRecord;
  onSuccess: () => void;
}

export default function MaintenanceFormModal({ isOpen, onClose, record, onSuccess }: MaintenanceFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const { globalWorkspaceId } = useWorkspaceStore();
  
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "MAINTENANCE",
    status: "PENDING",
    priority: "MEDIUM",
    scheduledDate: "",
    targetCompletionDate: "",
    completedDate: "",
    clientId: "",
    projectId: "",
    assigneeInput: "",
  });

  const addToast = useToastStore((s) => s.addToast);

  useEffect(() => {
    if (isOpen) {
      clientsApi.getOptions({ workspaceId: globalWorkspaceId === "all" ? undefined : globalWorkspaceId })
        .then(res => {
          if (res.data?.success && res.data?.data) {
             setClients(res.data.data);
          }
        })
        .catch(console.error);

      usersApi.list()
        .then((res: any) => {
          if (res.data?.success && res.data?.data) {
            setUsers(res.data.data);
          }
        })
        .catch(console.error);
    }
  }, [isOpen, globalWorkspaceId]);

  useEffect(() => {
    if (isOpen) {
      const fetchProjects = async () => {
        try {
          const wsId = globalWorkspaceId === "all" ? undefined : globalWorkspaceId;
          const params = { workspaceId: wsId, pageSize: 1000 };
          const res = await projectsApi.list(params);
          if (res.data?.success && res.data?.data) {
            setProjects(res.data.data);
          } else {
            setProjects([]);
          }
        } catch (err) {
          console.error(err);
        }
      };
      fetchProjects();
    }
  }, [isOpen, globalWorkspaceId]);

  useEffect(() => {
    if (record) {
      setForm({
        title: record.title || "",
        description: record.description || "",
        type: record.type || "MAINTENANCE",
        status: record.status || "PENDING",
        priority: record.priority || "MEDIUM",
        scheduledDate: record.scheduledDate ? (record.scheduledDate.split("T")[0] || "") : "",
        targetCompletionDate: record.targetCompletionDate ? (record.targetCompletionDate.slice(0, 16) || "") : "",
        completedDate: record.completedDate ? (record.completedDate.split("T")[0] || "") : "",
        clientId: record.clientId || record.client?.id || "",
        projectId: record.projectId || record.project?.id || "",
        assigneeInput: record.assigneeId ? ((record as any).assignee?.name || "") : (record.assigneeName || ""),
      });
    } else {
      setForm({
        title: "",
        description: "",
        type: "MAINTENANCE",
        status: "PENDING",
        priority: "MEDIUM",
        scheduledDate: "",
        targetCompletionDate: "",
        completedDate: "",
        clientId: "",
        projectId: "",
        assigneeInput: "",
      });
    }
  }, [record, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const selectedUser = users.find(u => u.name === form.assigneeInput);
      const isCustomAssignee = !selectedUser && form.assigneeInput.trim() !== "";
      
      const payload: Partial<MaintenanceRecord> = {
        ...form,
        scheduledDate: form.scheduledDate ? new Date(form.scheduledDate).toISOString() : undefined,
        targetCompletionDate: form.targetCompletionDate ? new Date(form.targetCompletionDate).toISOString() : undefined,
        completedDate: form.completedDate ? new Date(form.completedDate).toISOString() : undefined,
        workspaceId: globalWorkspaceId === "all" ? null : globalWorkspaceId,
        assigneeId: selectedUser ? selectedUser.id : null,
        assigneeName: isCustomAssignee ? form.assigneeInput.trim() : null,
      };
      
      // Clean up UI-only fields
      delete (payload as any).assigneeInput;

      if (record?.id) {
        await maintenanceApi.update(record.id, payload);
        addToast("Maintenance record updated", "success");
      } else {
        await maintenanceApi.create(payload);
        addToast("Maintenance record created", "success");
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Submission error:", error);
      addToast(error.response?.data?.message || "Operation failed", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">
            {record ? "Edit Maintenance Record" : "Add Maintenance Record"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="md:col-span-2">
              <FormField label="Title" required>
                <InputBox badge={<Type className="w-3.5 h-3.5" />} badgeBg="bg-blue-50 text-blue-600 border-blue-100">
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g., Server upgrade, SSL renewal..."
                    className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none font-medium"
                  />
                </InputBox>
              </FormField>
            </div>
            
            <div className="md:col-span-2">
              <FormField label="Description">
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all resize-none font-medium"
                />
              </FormField>
            </div>

            <div>
              <FormField label="Type" required>
                <InputBox badge={<Tag className="w-3.5 h-3.5" />} badgeBg="bg-purple-50 text-purple-600 border-purple-100">
                  <select
                    required
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 appearance-none focus:outline-none cursor-pointer font-medium"
                  >
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="SUPPORT">Support</option>
                    <option value="BUG">Bug</option>
                    <option value="UPDATE">Update</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 mr-2.5 shrink-0 pointer-events-none" />
                </InputBox>
              </FormField>
            </div>

            <div>
              <FormField label="Priority" required>
                <InputBox badge={<Flag className="w-3.5 h-3.5" />} badgeBg="bg-red-50 text-red-600 border-red-100">
                  <select
                    required
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 appearance-none focus:outline-none cursor-pointer font-medium"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 mr-2.5 shrink-0 pointer-events-none" />
                </InputBox>
              </FormField>
            </div>

            <div>
              <FormField label="Status" required>
                <InputBox badge={<Activity className="w-3.5 h-3.5" />} badgeBg="bg-emerald-50 text-emerald-600 border-emerald-100">
                  <select
                    required
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 appearance-none focus:outline-none cursor-pointer font-medium"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 mr-2.5 shrink-0 pointer-events-none" />
                </InputBox>
              </FormField>
            </div>

            <div>
              <FormField label="Scheduled Date">
                <InputBox badge={<Calendar className="w-3.5 h-3.5" />}>
                  <input
                    type="datetime-local"
                    value={form.scheduledDate}
                    onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
                    className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none font-medium"
                  />
                </InputBox>
              </FormField>
            </div>
            
            <div>
              <FormField label="Target Completion Date">
                <InputBox badge={<Calendar className="w-3.5 h-3.5" />}>
                  <input
                    type="datetime-local"
                    value={form.targetCompletionDate}
                    onChange={(e) => setForm({ ...form, targetCompletionDate: e.target.value })}
                    className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none font-medium"
                  />
                </InputBox>
              </FormField>
            </div>

            <div>
              <FormField label="Client">
                <InputBox badge={<Building2 className="w-3.5 h-3.5" />} badgeBg="bg-blue-50 text-blue-600 border-blue-100">
                  <select
                    value={form.clientId}
                    onChange={(e) => setForm({ ...form, clientId: e.target.value, projectId: "" })}
                    className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 appearance-none focus:outline-none cursor-pointer font-medium"
                  >
                    <option value="">No Client</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 mr-2.5 shrink-0 pointer-events-none" />
                </InputBox>
              </FormField>
            </div>

            <div>
              <FormField label="Project">
                <InputBox badge={<Briefcase className="w-3.5 h-3.5" />} badgeBg="bg-amber-50 text-amber-600 border-amber-100">
                  <select
                    value={form.projectId}
                    onChange={(e) => {
                      const newProjectId = e.target.value;
                      const selectedProject = projects.find(p => p.id === newProjectId);
                      setForm(prev => ({ 
                        ...prev, 
                        projectId: newProjectId,
                        ...(selectedProject?.clientId ? { clientId: selectedProject.clientId } : {})
                      }));
                    }}
                    className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 appearance-none focus:outline-none cursor-pointer font-medium"
                  >
                    <option value="">No Project</option>
                    {(form.clientId ? projects.filter(p => p.clientId === form.clientId) : projects).map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 mr-2.5 shrink-0 pointer-events-none" />
                </InputBox>
              </FormField>
            </div>

            <div>
              <FormField label="Assignee">
                <InputBox badge={<UserIcon className="w-3.5 h-3.5" />} badgeBg="bg-indigo-50 text-indigo-600 border-indigo-100">
                  <input
                    type="text"
                    list="assignee-users"
                    value={form.assigneeInput}
                    onChange={(e) => setForm({ ...form, assigneeInput: e.target.value })}
                    placeholder="Select or enter name..."
                    className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none font-medium"
                  />
                  <datalist id="assignee-users">
                    {users.map((u) => (
                      <option key={u.id} value={u.name} />
                    ))}
                  </datalist>
                </InputBox>
              </FormField>
            </div>
            
            {form.status === "RESOLVED" && (
              <div>
                <FormField label="Completed Date">
                  <InputBox badge={<Calendar className="w-3.5 h-3.5" />}>
                    <input
                      type="datetime-local"
                      value={form.completedDate}
                      onChange={(e) => setForm({ ...form, completedDate: e.target.value })}
                      className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none font-medium"
                    />
                  </InputBox>
                </FormField>
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {record ? "Update Record" : "Create Record"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
