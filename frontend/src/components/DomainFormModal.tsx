import { useState, useEffect } from "react";
import {
  Globe,
  X,
  User,
  Calendar,
  Shield,
  Server,
  Lock,
  ChevronDown,
  FolderGit2,
} from "lucide-react";
import { clientsApi, type Client } from "@/api/clients";
import { projectsApi, type Project } from "@/api/projects";
import { domainsApi, type Domain } from "@/api/domains";
import { useToastStore } from "@/store/toastStore";

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

interface DomainFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  domain?: Domain | null;
  onSuccess?: (updatedDomain?: Domain) => void;
}

export default function DomainFormModal({
  isOpen,
  onClose,
  domain,
  onSuccess,
}: DomainFormModalProps) {
  const addToast = useToastStore((s) => s.addToast);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    domain: "",
    registrar: "",
    dnsProvider: "",
    clientId: "",
    projectId: "",
    purchaseDate: "",
    expirationDate: "",
    sslExpiration: "",
    renewalCost: "",
    autoRenewal: false,
  });

  const isEdit = !!domain;

  useEffect(() => {
    if (isOpen) {
      clientsApi
        .list({ pageSize: 100 })
        .then((res) => {
          if (res.data?.success && res.data?.data) {
            setClients(res.data.data);
          } else if (Array.isArray(res.data)) {
            setClients(res.data as any);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch clients for domain modal:", err);
        });
    }
  }, [isOpen]);

  useEffect(() => {
    if (domain) {
      setForm({
        domain: domain.domain || "",
        registrar: domain.registrar || "",
        dnsProvider: domain.dnsProvider || "",
        clientId: domain.clientId || domain.client?.id || "",
        projectId: domain.projectId || domain.project?.id || "",
        purchaseDate: domain.purchaseDate ? (domain.purchaseDate.split("T")[0] || "") : "",
        expirationDate: domain.expirationDate ? (domain.expirationDate.split("T")[0] || "") : "",
        sslExpiration: domain.sslExpiration ? (domain.sslExpiration.split("T")[0] || "") : "",
        renewalCost: domain.renewalCost ? String(domain.renewalCost) : "",
        autoRenewal: !!domain.autoRenewal,
      });
    } else {
      setForm({
        domain: "",
        registrar: "",
        dnsProvider: "",
        clientId: "",
        projectId: "",
        purchaseDate: "",
        expirationDate: "",
        sslExpiration: "",
        renewalCost: "",
        autoRenewal: false,
      });
    }
  }, [domain, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (form.clientId) {
      projectsApi
        .list({ clientId: form.clientId, pageSize: 1000 })
        .then((res) => {
          if (res.data?.success && res.data?.data) {
            setProjects(res.data.data);
          } else {
            setProjects([]);
          }
        })
        .catch((err) => console.error("Failed to fetch projects for selected client:", err));
    } else {
      projectsApi
        .list({ pageSize: 1000 })
        .then((res) => {
          if (res.data?.success && res.data?.data) {
            setProjects(res.data.data);
          } else {
            setProjects([]);
          }
        })
        .catch((err) => console.error("Failed to fetch projects for domain modal:", err));
    }
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

  const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.domain) {
      setError("Please fill in all required fields.");
      return;
    }
    setError("");
    setIsSaving(true);
    try {
      const payload = {
        domain: form.domain,
        registrar: form.registrar || undefined,
        dnsProvider: form.dnsProvider || undefined,
        clientId: form.clientId || undefined,
        projectId: form.projectId || undefined,
        purchaseDate: form.purchaseDate || undefined,
        expirationDate: form.expirationDate || undefined,
        sslExpiration: form.sslExpiration || undefined,
        renewalCost: form.renewalCost ? Number(form.renewalCost) : undefined,
        autoRenewal: form.autoRenewal,
      };

      if (isEdit && domain?.id) {
        const res = await domainsApi.update(domain.id, payload);
        if (res.data.success && res.data.data) {
          addToast("Domain updated successfully", "success");
          onSuccess?.(res.data.data);
          onClose();
        }
      } else {
        const res = await domainsApi.create(payload);
        if (res.data.success && res.data.data) {
          addToast("Domain created successfully", "success");
          onSuccess?.(res.data.data);
          onClose();
        }
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        `Failed to ${isEdit ? "update" : "create"} domain`;
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
            {isEdit ? "Edit Domain" : "Add Domain"}
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

          {/* Row 1: Domain Name & Registrar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Domain Name" required>
              <InputBox
                badge={<Globe className="w-3.5 h-3.5" />}
                badgeBg="bg-blue-50 text-blue-600 border-blue-100"
              >
                <input
                  type="text"
                  className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none font-medium"
                  placeholder="example.com"
                  value={form.domain}
                  onChange={(e) => set("domain", e.target.value)}
                  required
                />
              </InputBox>
            </FormField>

            <FormField label="Registrar">
              <InputBox
                badge={<Shield className="w-3.5 h-3.5" />}
                badgeBg="bg-purple-50 text-purple-600 border-purple-100"
              >
                <input
                  type="text"
                  className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none font-medium"
                  placeholder="e.g. GoDaddy, Namecheap"
                  value={form.registrar}
                  onChange={(e) => set("registrar", e.target.value)}
                />
              </InputBox>
            </FormField>
          </div>

          {/* Row 2: Client & Project */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Client">
              <InputBox
                badge={<User className="w-3.5 h-3.5" />}
                badgeBg="bg-purple-50 text-purple-600 border-purple-100"
              >
                <select
                  className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 appearance-none focus:outline-none cursor-pointer font-medium"
                  value={form.clientId}
                  onChange={(e) => handleClientChange(e.target.value)}
                >
                  <option value="" className="text-gray-400">No client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id} className="text-gray-900">{c.name}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 mr-2.5 shrink-0 pointer-events-none" />
              </InputBox>
            </FormField>

            <FormField label="Project">
              <InputBox
                badge={<FolderGit2 className="w-3.5 h-3.5" />}
                badgeBg="bg-indigo-50 text-indigo-600 border-indigo-100"
              >
                <select
                  className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 appearance-none focus:outline-none cursor-pointer font-medium"
                  value={form.projectId}
                  onChange={(e) => set("projectId", e.target.value)}
                >
                  <option value="" className="text-gray-400">No project</option>
                  {filteredProjects.map((p) => (
                    <option key={p.id} value={p.id} className="text-gray-900">{p.name}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 mr-2.5 shrink-0 pointer-events-none" />
              </InputBox>
            </FormField>
          </div>

          {/* Row 3: DNS Provider */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="DNS Provider">
              <InputBox
                badge={<Server className="w-3.5 h-3.5" />}
                badgeBg="bg-indigo-50 text-indigo-600 border-indigo-100"
              >
                <input
                  type="text"
                  className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none font-medium"
                  placeholder="e.g. Cloudflare, Route53"
                  value={form.dnsProvider}
                  onChange={(e) => set("dnsProvider", e.target.value)}
                />
              </InputBox>
            </FormField>
          </div>

          {/* Row 3: Purchase Date & Expiration Date */}
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

            <FormField label="Expiration Date">
              <InputBox
                badge={<Calendar className="w-3.5 h-3.5" />}
                badgeBg="bg-red-50 text-red-600 border-red-100"
              >
                <input
                  type="date"
                  className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none font-medium"
                  value={form.expirationDate}
                  onChange={(e) => set("expirationDate", e.target.value)}
                />
              </InputBox>
            </FormField>
          </div>

          {/* Row 4: SSL Expiration & Renewal Cost */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="SSL Expiration">
              <InputBox
                badge={<Lock className="w-3.5 h-3.5" />}
                badgeBg="bg-emerald-50 text-emerald-600 border-emerald-100"
              >
                <input
                  type="date"
                  className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none font-medium"
                  value={form.sslExpiration}
                  onChange={(e) => set("sslExpiration", e.target.value)}
                />
              </InputBox>
            </FormField>

            <FormField label="Renewal Cost">
              <InputBox
                badge={<span className="font-bold text-xs">₹</span>}
                badgeBg="bg-teal-50 text-teal-600 border-teal-100"
              >
                <input
                  type="number"
                  className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none font-medium"
                  placeholder="e.g. 1200"
                  value={form.renewalCost}
                  onChange={(e) => set("renewalCost", e.target.value)}
                />
              </InputBox>
            </FormField>
          </div>

          {/* Row 5: Auto Renewal */}
          <FormField label="Auto Renewal">
            <InputBox
              badge={<Shield className="w-3.5 h-3.5" />}
              badgeBg="bg-blue-50 text-blue-600 border-blue-100"
            >
              <select
                className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 appearance-none focus:outline-none cursor-pointer font-medium"
                value={form.autoRenewal ? "true" : "false"}
                onChange={(e) => set("autoRenewal", e.target.value === "true")}
              >
                <option value="false" className="text-gray-900">Disabled</option>
                <option value="true" className="text-gray-900">Enabled</option>
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
                  {isEdit ? "Saving..." : "Adding..."}
                </span>
              ) : isEdit ? (
                "Edit"
              ) : (
                "Add Domain"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
