import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Folder,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Plus,
  ExternalLink,
  GitBranch,
  Database,
  FileText,
  Palette,
  Link2,
  Building2,
  Calendar,
  Clock,
  Sparkles,
  Cpu,
  ShieldCheck,
  User,
  Mail,
  Phone,
  Layers,
  ArrowUpRight,
  X,
  Lock,
  Globe,
  Globe as GlobeIcon,
  Server as ServerIcon,
  Terminal,
  Wallet,
  Download,
  Check,
} from "lucide-react";
import PageWrapper from "@/components/ui/PageWrapper";
import Button from "@/components/ui/Button";
import StatusPill from "@/components/ui/StatusPill";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";
import ProjectFormModal from "@/components/ProjectFormModal";
import ProjectAssetsModal from "@/components/ProjectAssetsModal";
import FinanceDocumentViewModal from "@/components/FinanceDocumentViewModal";
import FinanceEditModal from "@/components/FinanceEditModal";
import { format } from "date-fns";
import { useToastStore } from "@/store/toastStore";
import { projectsApi, type Project, type Asset } from "@/api/projects";
import { credentialsApi } from "@/api/credentials";
import { serversApi, type Server } from "@/api/servers";
import { domainsApi, type Domain } from "@/api/domains";

import { financeApi, type FinanceRecord } from "@/api/finance";


function calculateProgress(startDate?: string, endDate?: string): { percentage: number; daysLeft: number | null; totalDays: number | null } {
  if (!startDate || !endDate) return { percentage: 0, daysLeft: null, totalDays: null };
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const now = Date.now();
  if (isNaN(start) || isNaN(end) || end <= start) return { percentage: 0, daysLeft: null, totalDays: null };

  const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  const elapsedDays = Math.ceil((now - start) / (1000 * 60 * 60 * 24));
  const daysLeft = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));

  let percentage = Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100)));
  if (now > end) percentage = 100;
  return { percentage, daysLeft, totalDays };
}

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

function getCoreTechnicalAssets(assets?: Asset | null) {
  if (!assets) return [];
  const list = [
    { icon: GitBranch, label: "Git Repository", value: assets.gitRepo, color: "text-purple-600 bg-purple-50 border-purple-100" },
    { icon: ExternalLink, label: "Production URL", value: assets.productionUrl, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
    { icon: ExternalLink, label: "Staging URL", value: assets.stagingUrl, color: "text-blue-600 bg-blue-50 border-blue-100" },
    { icon: FileText, label: "Documentation", value: assets.documentation, color: "text-amber-600 bg-amber-50 border-amber-100" },
    { icon: Database, label: "Database System", value: assets.database, color: "text-red-600 bg-red-50 border-red-100" },
    { icon: Link2, label: "API Collection", value: assets.apiCollection, color: "text-sky-600 bg-sky-50 border-sky-100" },
    { icon: Palette, label: "Design Files", value: assets.designFiles, color: "text-pink-600 bg-pink-50 border-pink-100" },
  ];
  const items = list.filter((item) => Boolean(item.value));

  if (Array.isArray(assets.customAssets)) {
    assets.customAssets.forEach((cItem) => {
      if (cItem.url && !items.some((i) => i.value === cItem.url)) {
        items.push({
          icon: cItem.type === "Figma" ? Palette : cItem.type === "GitHub" ? GitBranch : cItem.type === "Google Drive" ? Layers : Link2,
          label: cItem.title || cItem.type,
          value: cItem.url,
          color: cItem.type === "Figma" ? "text-pink-600 bg-pink-50 border-pink-100" : "text-indigo-600 bg-indigo-50 border-indigo-100",
        });
      }
    });
  }

  return items;
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "assets" | "credentials" | "finance">("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Credential modal
  const [showCredentialModal, setShowCredentialModal] = useState(false);
  const [credentialForm, setCredentialForm] = useState({ portalName: "", username: "", password: "", notes: "", assetCategory: "", loginUrl: "", minRoleAccess: "" });
  const [showModalPassword, setShowModalPassword] = useState(false);
  const [isSavingCred, setIsSavingCred] = useState(false);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, string>>({});



  // Dynamic IOMS Assets state
  const [showAssetsModal, setShowAssetsModal] = useState(false);
  const [linkedServers, setLinkedServers] = useState<Server[]>([]);
  const [linkedDomains, setLinkedDomains] = useState<Domain[]>([]);
  const [projectFinanceRecords, setProjectFinanceRecords] = useState<FinanceRecord[]>([]);

  // Finance states
  const [viewingRecord, setViewingRecord] = useState<FinanceRecord | null>(null);
  const [quickEditRecord, setQuickEditRecord] = useState<FinanceRecord | null>(null);
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);

  const fetchProject = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await projectsApi.get(id);
      if (res.data.success && res.data.data) {
        setProject(res.data.data);
      } else {
        setProject(null);
      }
    } catch (err) {
      console.error("Failed to fetch project:", err);
      setProject(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (project?.id || id) {
      const pId = project?.id || id || "";
      const cId = project?.clientId || "";

      Promise.all([
        serversApi.list({ projectId: pId, clientId: cId || undefined, pageSize: 1000 }).catch(() => ({ data: { data: [] } })),
        domainsApi.list({ projectId: pId, clientId: cId || undefined, pageSize: 1000 }).catch(() => ({ data: { data: [] } })),
        financeApi.list({ projectId: pId }).catch(() => ({ data: { data: [] } })),
      ])
        .then(([serversRes, domainsRes, financeRes]) => {
          setLinkedServers(serversRes.data?.data || []);
          setLinkedDomains(domainsRes.data?.data || []);
          setProjectFinanceRecords(financeRes.data?.data || []);
        });
    }
  }, [project?.id, project?.clientId, id]);

  useEffect(() => {
    fetchProject();
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    try {
      await projectsApi.delete(id);
      setShowDeleteConfirm(false);
      addToast("Project deleted successfully", "success");
      navigate("/projects");
    } catch (err: unknown) {
      console.error("Failed to delete project:", err);
      const message =
        (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data?.error ||
        (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data?.message ||
        "Failed to delete project";
      addToast(message, "error");
      setShowDeleteConfirm(false);
    }
  };

  const handleAddCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !credentialForm.portalName || !credentialForm.username || !credentialForm.password) {
      addToast("Please fill in required credential fields", "error");
      return;
    }
    setIsSavingCred(true);
    try {
      await credentialsApi.create(id, credentialForm);
      setShowCredentialModal(false);
      setCredentialForm({ portalName: "", username: "", password: "", notes: "", assetCategory: "", loginUrl: "", minRoleAccess: "" });
      fetchProject();
      addToast("Credential saved successfully", "success");
    } catch (err) {
      console.error("Failed to add credential:", err);
      addToast("Failed to add credential", "error");
    } finally {
      setIsSavingCred(false);
    }
  };

  const handleRevealPassword = async (credId: string) => {
    if (revealedPasswords[credId]) {
      setRevealedPasswords((prev) => { const next = { ...prev }; delete next[credId]; return next; });
      return;
    }
    try {
      const res = await credentialsApi.reveal(credId);
      if (res.data.success && res.data.data) {
        setRevealedPasswords((prev) => ({ ...prev, [credId]: res.data.data!.password }));
      }
    } catch (err) {
      console.error("Failed to reveal password:", err);
    }
  };

  const handleCopyText = (text: string | undefined, label: string) => {
    if (text) {
      navigator.clipboard.writeText(text);
      addToast(`${label} copied to clipboard!`, "success");
    }
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
        // refresh finance records
        const pId = project?.id || id || "";
        financeApi.list({ projectId: pId }).then(fRes => setProjectFinanceRecords(fRes.data?.data || []));
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
      // refresh finance records
      const pId = project?.id || id || "";
      financeApi.list({ projectId: pId }).then(fRes => setProjectFinanceRecords(fRes.data?.data || []));
    } catch (error) {
      console.error("Failed to mark as paid:", error);
      addToast("Failed to update status", "error");
    } finally {
      setMarkingPaidId(null);
    }
  };



  if (isLoading) {
    return (
      <PageWrapper>
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-96" />
      </PageWrapper>
    );
  }

  if (!project) {
    return (
      <PageWrapper>
        <Card className="p-12 text-center max-w-lg mx-auto mt-10">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Project Not Found</h2>
          <p className="text-sm text-gray-500 mb-6">The requested project could not be found or has been deleted.</p>
          <Button onClick={() => navigate("/projects")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Projects
          </Button>
        </Card>
      </PageWrapper>
    );
  }

  const activeProject = project;
  const coreAssets = getCoreTechnicalAssets(activeProject.assets);
  const techList = activeProject.technology ? activeProject.technology.split(",").map((t) => t.trim()).filter(Boolean) : [];
  const timelineProgress = calculateProgress(activeProject.startDate, activeProject.endDate);

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: Layers },
    { id: "assets" as const, label: "Assets", icon: GitBranch },
    { id: "credentials" as const, label: "Credentials", icon: ShieldCheck },
    { id: "finance" as const, label: "Finance & Docs", icon: Wallet },
  ];

  return (
    <PageWrapper>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3.5">
          <Link
            to="/projects"
            className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{activeProject.name}</h1>
              <StatusPill status={activeProject.status} />
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
              {activeProject.client && (
                <Link
                  to={`/clients/${activeProject.client.id}`}
                  className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:underline"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  {activeProject.client.name}
                </Link>
              )}
              {techList.length > 0 && (
                <>
                  <span>•</span>
                  <span className="font-medium text-gray-600">{techList.join(" · ")}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setIsEditing(true)}>
            <Edit className="w-4 h-4 mr-2" /> Edit Project
          </Button>
          <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
            <Trash2 className="w-4 h-4 mr-2" /> Delete
          </Button>
        </div>
      </div>

      {/* Premium Header KPI Highlights Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        {/* Client KPI */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Associated Client</p>
            {activeProject.client ? (
              <Link
                to={`/clients/${activeProject.client.id}`}
                className="text-sm font-bold text-gray-900 hover:text-indigo-600 truncate block mt-0.5"
              >
                {activeProject.client.name}
              </Link>
            ) : (
              <span className="text-sm font-bold text-gray-400 block mt-0.5">—</span>
            )}
          </div>
          <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
            <Building2 className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* Tech Stack KPI */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Primary Stack</p>
            <p className="text-sm font-bold text-gray-900 truncate mt-0.5">
              {techList[0] || "General"} {techList.length > 1 ? `+${techList.length - 1}` : ""}
            </p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
            <Cpu className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* Timeline KPI */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Timeline</p>
            <p className="text-sm font-bold text-gray-900 mt-0.5">
              {timelineProgress.daysLeft !== null ? `${timelineProgress.daysLeft} days left` : "Flexible"}
            </p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
            <Clock className="w-4.5 h-4.5" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6 bg-white rounded-t-xl px-2 pt-1">
        <nav className="flex gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  isSelected
                    ? "border-indigo-600 text-indigo-600 bg-indigo-50/40 rounded-t-lg"
                    : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Overview Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Premium Card: Project Details (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="border-gray-200 shadow-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-indigo-50/30 border-b border-gray-100 py-3.5 px-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm tracking-tight">Project Details</h3>
                  </div>
                  <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                    ID: {activeProject.id.slice(0, 8)}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="p-5 space-y-5">
                {/* Description */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Description
                  </label>
                  <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-200/80 text-xs font-medium text-gray-700 leading-relaxed">
                    {activeProject.description || "No project description provided."}
                  </div>
                </div>

                {/* Technologies */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Technologies & Frameworks
                  </label>
                  {techList.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {techList.map((tech, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-2xs"
                        >
                          <Cpu className="w-3 h-3 text-indigo-500" />
                          {tech}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No technologies tagged.</p>
                  )}
                </div>

                {/* Timeline Progress Bar */}
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold text-gray-700 uppercase text-[10px] tracking-wider flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-indigo-500" /> Timeline & Schedule
                    </span>
                    <span className="font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {timelineProgress.percentage}% Progress
                    </span>
                  </div>

                  {/* Progress track */}
                  <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden mb-3">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-blue-600 transition-all duration-500 rounded-full"
                      style={{ width: `${timelineProgress.percentage}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50/70 p-3 rounded-xl border border-gray-200/80">
                    <div>
                      <span className="text-[10px] font-semibold text-gray-400 block uppercase">Start Date</span>
                      <span className="font-bold text-gray-800">
                        {activeProject.startDate ? new Date(activeProject.startDate).toLocaleDateString() : "Not set"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-gray-400 block uppercase">Target End Date</span>
                      <span className="font-bold text-gray-800">
                        {activeProject.endDate ? new Date(activeProject.endDate).toLocaleDateString() : "Flexible / Ongoing"}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Premium Card: Client Information (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="border-gray-200 shadow-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50/30 border-b border-gray-100 py-3.5 px-5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm tracking-tight">Client Association</h3>
                </div>
              </CardHeader>

              <CardContent className="p-5">
                {activeProject.client ? (
                  <div className="space-y-4">
                    {/* Client Main Banner */}
                    <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50/70 via-blue-50/40 to-white border border-indigo-100/80 flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white font-bold text-lg flex items-center justify-center shadow-sm">
                          {(activeProject.client.name || "C").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <Link
                            to={`/clients/${activeProject.client.id}`}
                            className="font-bold text-base text-gray-900 hover:text-indigo-600 transition-colors flex items-center gap-1 group"
                          >
                            {activeProject.client.name}
                            <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                          </Link>
                          {activeProject.client.company && (
                            <span className="text-xs font-semibold text-indigo-700 bg-indigo-100/60 px-2 py-0.5 rounded-md inline-block mt-0.5">
                              {activeProject.client.company}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Contact details */}
                    <div className="space-y-2.5 pt-1 text-xs">
                      {activeProject.client.contactPerson && (
                        <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                          <User className="w-4 h-4 text-indigo-500 shrink-0" />
                          <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase block">Contact Person</span>
                            <span className="font-semibold text-gray-800">{activeProject.client.contactPerson}</span>
                          </div>
                        </div>
                      )}

                      {activeProject.client.email && (
                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Mail className="w-4 h-4 text-blue-500 shrink-0" />
                            <div className="min-w-0">
                              <span className="text-[10px] font-bold text-gray-400 uppercase block">Email Address</span>
                              <span className="font-semibold text-gray-800 truncate block">{activeProject.client.email}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleCopyText(activeProject.client?.email || "", "Client Email")}
                            className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                            title="Copy email"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {activeProject.client.phone && (
                        <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                          <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                          <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase block">Phone Number</span>
                            <span className="font-semibold text-gray-800">{activeProject.client.phone}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* View Profile Action */}
                    <div className="pt-2">
                      <Link
                        to={`/clients/${activeProject.client.id}`}
                        className="w-full h-9 rounded-lg text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors flex items-center justify-center gap-1.5"
                      >
                        View Full Client Profile
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic py-4 text-center">No client associated with this project.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Assets Tab Content */}
      {activeTab === "assets" && (
        <div className="space-y-6">
          {/* Main Assets Dashboard Container */}
          <Card className="border-gray-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-gray-50 via-indigo-50/10 to-white border-b border-gray-100 py-3.5 px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-2xs">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Assets</h3>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button size="sm" onClick={() => setShowAssetsModal(true)}>
                  <Plus className="w-4 h-4 mr-1" /> Add Asset
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {coreAssets.length === 0 && linkedServers.length === 0 && linkedDomains.length === 0 ? (
                <div className="p-8 rounded-xl border border-dashed border-gray-200 text-center bg-gray-50/50">
                  <p className="text-xs text-gray-500 font-medium">No assets configured for this project.</p>
                </div>
              ) : (
                <>
                  {/* Section 1: Core Code & Services */}
                  {coreAssets.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                          <GitBranch className="w-3.5 h-3.5 text-indigo-600" /> Core Services & Repository Links ({coreAssets.length})
                        </h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {coreAssets.map((asset) => (
                          <div
                            key={asset.label}
                            className="p-4 rounded-xl border border-gray-200/80 bg-white hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${asset.color}`}>
                                <asset.icon className="w-4 h-4" />
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleCopyText(asset.value!, asset.label)}
                                  className="p-1.5 rounded-md text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                  title="Copy URL"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                {asset.value?.startsWith("http") && (
                                  <a
                                    href={asset.value}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1.5 rounded-md text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                    title="Open link"
                                  >
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                  </a>
                                )}
                              </div>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{asset.label}</p>
                              {asset.value?.startsWith("http") ? (
                                <a
                                  href={asset.value}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs font-semibold text-indigo-600 hover:underline truncate block mt-1"
                                >
                                  {asset.value}
                                </a>
                              ) : (
                                <span className="text-xs font-semibold text-gray-800 truncate block mt-1">
                                  {asset.value}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Section 2: Linked Servers & Infrastructure Nodes */}
                  {linkedServers.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                          <ServerIcon className="w-3.5 h-3.5 text-emerald-600" /> Linked Server Instances & Hardware Nodes ({linkedServers.length})
                        </h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {linkedServers.map((server) => (
                          <div
                            key={server.id}
                            className="p-4 rounded-xl border border-gray-200/80 bg-white hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between"
                          >
                            <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
                                  <ServerIcon className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                  <span className="font-bold text-gray-900 text-xs block">{server.name}</span>
                                  <span className="text-[10px] text-gray-400 font-medium">{server.provider}</span>
                                </div>
                              </div>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  server.status === "ACTIVE"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                    : "bg-amber-50 text-amber-700 border-amber-100"
                                }`}
                              >
                                {server.status}
                              </span>
                            </div>

                            <div className="space-y-2 pt-1 text-xs">
                              <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg border border-gray-100">
                                <span className="text-[10px] font-bold text-gray-400 uppercase">IP Address:</span>
                                <div className="flex items-center gap-1 font-mono text-xs font-semibold text-gray-800">
                                  {server.ipAddress || "N/A"}
                                  {server.ipAddress && (
                                    <button
                                      onClick={() => handleCopyText(server.ipAddress, "IP Address")}
                                      className="p-1 hover:text-indigo-600 text-gray-400 transition-colors"
                                      title="Copy IP"
                                    >
                                      <Copy className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {server.ipAddress && (
                                <button
                                  onClick={() => handleCopyText(`ssh root@${server.ipAddress}`, "SSH Command")}
                                  className="w-full text-left bg-gray-900 text-emerald-400 p-2 rounded-lg font-mono text-[11px] flex items-center justify-between hover:bg-gray-800 transition-colors"
                                >
                                  <span className="flex items-center gap-1.5 truncate">
                                    <Terminal className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                    ssh root@{server.ipAddress}
                                  </span>
                                  <span className="text-[10px] text-gray-400 uppercase font-sans shrink-0">Copy SSH</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Section 3: Domains & DNS Endpoints */}
                  {linkedDomains.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                          <GlobeIcon className="w-3.5 h-3.5 text-blue-600" /> Associated Domains & SSL Endpoints ({linkedDomains.length})
                        </h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {linkedDomains.map((domain) => (
                          <div
                            key={domain.id}
                            className="p-4 rounded-xl border border-gray-200/80 bg-white hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between"
                          >
                            <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
                                  <GlobeIcon className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                  <a
                                    href={`https://${domain.domain}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-bold text-gray-900 text-xs hover:text-indigo-600 hover:underline flex items-center gap-1"
                                  >
                                    {domain.domain}
                                    <ArrowUpRight className="w-3 h-3 text-gray-400" />
                                  </a>
                                  <span className="text-[10px] text-gray-400 font-medium">{domain.registrar || "Registrar configured"}</span>
                                </div>
                              </div>
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3 text-emerald-600" /> SSL Active
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-gray-600 bg-gray-50 p-2 rounded-lg">
                              <span className="text-gray-400 font-medium">DNS Provider:</span>
                              <span className="font-semibold text-gray-800">{domain.dnsProvider || "Cloudflare / Route53"}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Credentials Tab Content */}
      {activeTab === "credentials" && (
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="bg-gray-50/80 border-b border-gray-100 py-3.5 px-5 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-gray-900 text-sm">Stored Access Credentials</h3>
            </div>
            <Button size="sm" onClick={() => setShowCredentialModal(true)}>
              <Plus className="w-4 h-4 mr-1" /> Add Credential
            </Button>
          </CardHeader>
          <CardContent className="p-5">
            {activeProject.credentials && activeProject.credentials.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeProject.credentials.map((cred) => (
                  <div key={cred.id} className="group relative overflow-hidden p-4 rounded-2xl border border-gray-200/60 bg-gradient-to-br from-white to-gray-50/50 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300">
                    {/* Decorative glow */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-110 duration-500"></div>
                    
                    <div className="relative flex items-center justify-between pb-2 mb-3 border-b border-gray-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-sm">
                          <Globe className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-gray-900 text-sm tracking-tight">{cred.portalName}</span>
                      </div>
                      <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60 shadow-sm">
                        Encrypted
                      </span>
                    </div>
                    
                    <div className="relative mt-2">
                      {/* Username Section */}
                      <div className="mb-2.5">
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 ml-1">Username / Handle</h4>
                        <div className="flex items-center justify-between px-3 py-2 bg-slate-50/70 rounded-xl border border-slate-200/60 hover:border-indigo-200 hover:bg-white transition-colors group/input">
                          <span className="font-mono text-[13px] font-semibold text-slate-800 truncate pr-4">{cred.username}</span>
                          <div className="flex items-center gap-2.5 shrink-0 text-slate-400">
                            <button onClick={() => handleCopyText(cred.username, "Username")} className="hover:text-indigo-600 transition-colors" title="Copy username">
                              <Copy className="w-4 h-4" />
                            </button>
                            {cred.loginUrl && (
                              <a href={cred.loginUrl} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 transition-colors" title="Open Portal">
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Password Section */}
                      <div className="mb-2.5">
                        <div className="flex items-center justify-between mb-1 ml-1">
                          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Encrypted Secret</h4>
                          <button onClick={() => handleRevealPassword(cred.id)} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-wider mr-1">
                            {revealedPasswords[cred.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            {revealedPasswords[cred.id] ? "Hide" : "Reveal"}
                          </button>
                        </div>
                        <div className="flex items-center justify-between px-3 py-2 bg-slate-50/70 rounded-xl border border-slate-200/60 hover:border-indigo-200 hover:bg-white transition-colors group/input">
                          <span className={`font-mono ${revealedPasswords[cred.id] ? "text-[13px]" : "text-lg"} leading-none font-bold text-slate-800 tracking-widest pt-0.5`}>
                            {revealedPasswords[cred.id] ? revealedPasswords[cred.id] : "••••••••••••"}
                          </span>
                          <div className="flex items-center gap-2.5 shrink-0 text-slate-400">
                            {revealedPasswords[cred.id] ? (
                              <button onClick={() => handleCopyText(revealedPasswords[cred.id], "Password")} className="hover:text-indigo-600 transition-colors" title="Copy password">
                                <Copy className="w-4 h-4" />
                              </button>
                            ) : (
                              <div className="w-4 h-4"></div> /* Placeholder for layout stability */
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Meta fields */}
                      {(cred.assetCategory || cred.minRoleAccess) && (
                        <div className="grid grid-cols-2 gap-3 mb-2.5">
                          {cred.assetCategory && (
                            <div>
                              <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 ml-1">Category</h4>
                              <div className="px-3 py-1.5 bg-white rounded-lg border border-slate-200/60 flex items-center gap-2 shadow-sm">
                                <Folder className="w-3.5 h-3.5 text-orange-500" />
                                <span className="text-xs font-semibold text-slate-700 truncate">{cred.assetCategory}</span>
                              </div>
                            </div>
                          )}
                          {cred.minRoleAccess && (
                            <div>
                              <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 ml-1">Min Role</h4>
                              <div className="px-3 py-1.5 bg-white rounded-lg border border-slate-200/60 flex items-center gap-2 shadow-sm">
                                <ShieldCheck className="w-3.5 h-3.5 text-rose-500" />
                                <span className="text-xs font-semibold text-slate-700 truncate">{cred.minRoleAccess}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Notes Row */}
                      {cred.notes && (
                        <div className="p-2.5 bg-amber-50/50 rounded-xl border border-amber-100/50">
                          <h4 className="text-[9px] font-bold text-amber-600/80 uppercase tracking-wider mb-1 ml-1">Notes</h4>
                          <p className="text-[11px] text-amber-800/80 italic leading-relaxed ml-1">{cred.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ShieldCheck className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 font-medium text-xs">No access credentials stored for this project.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Finance Tab Content */}
      {activeTab === "finance" && (
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="bg-gray-50/80 border-b border-gray-100 py-3.5 px-5 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-gray-900 text-sm">Project Finance & Documents</h3>
            </div>
            <Button size="sm" onClick={() => navigate("/finance")}>
              <ArrowUpRight className="w-4 h-4 mr-1" /> Open Finance Portal
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {projectFinanceRecords && projectFinanceRecords.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-white border-b border-gray-200">
                      <th className="px-6 py-4 text-[11px] font-extrabold text-gray-500 uppercase tracking-widest">Client</th>
                      <th className="px-6 py-4 text-[11px] font-extrabold text-gray-500 uppercase tracking-widest">Document ID</th>
                      <th className="px-6 py-4 text-[11px] font-extrabold text-gray-500 uppercase tracking-widest text-center">Type</th>
                      <th className="px-6 py-4 text-[11px] font-extrabold text-gray-500 uppercase tracking-widest text-right">Amount (₹)</th>
                      <th className="px-6 py-4 text-[11px] font-extrabold text-gray-500 uppercase tracking-widest">Issue Date</th>
                      <th className="px-6 py-4 text-[11px] font-extrabold text-gray-500 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-4 text-[11px] font-extrabold text-gray-500 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {projectFinanceRecords.map(record => {
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
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Wallet className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 font-medium text-xs">No finance records associated with this project.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}



      {/* Ultra-Premium Add Credential Modal */}
      {showCredentialModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm overflow-hidden cursor-pointer"
          onClick={() => setShowCredentialModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[700px] bg-white rounded-xl shadow-2xl p-6 cursor-default border border-gray-100"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <ShieldCheck className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base tracking-tight">Add Access Credential</h3>
                  <p className="text-xs text-gray-500">Securely store portal login credentials for this project</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCredentialModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddCredential} className="grid grid-cols-2 gap-4">
              <FormField label="Portal / Service Name" required>
                <InputBox badge={<Globe className="w-3.5 h-3.5" />} badgeBg="bg-blue-50 text-blue-600 border-blue-100">
                  <input
                    type="text"
                    className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none font-medium"
                    placeholder="e.g. AWS Console, Production CPanel, Staging Server"
                    value={credentialForm.portalName}
                    onChange={(e) => setCredentialForm({ ...credentialForm, portalName: e.target.value })}
                    required
                  />
                </InputBox>
              </FormField>

              <FormField label="Username / Email" required>
                <InputBox badge={<User className="w-3.5 h-3.5" />} badgeBg="bg-purple-50 text-purple-600 border-purple-100">
                  <input
                    type="text"
                    className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none font-medium"
                    placeholder="e.g. admin@techstart.io or root"
                    autoComplete="new-password"
                    value={credentialForm.username}
                    onChange={(e) => setCredentialForm({ ...credentialForm, username: e.target.value })}
                    required
                  />
                </InputBox>
              </FormField>

              <FormField label="Password" required>
                <InputBox badge={<Lock className="w-3.5 h-3.5" />} badgeBg="bg-emerald-50 text-emerald-600 border-emerald-100">
                  <input
                    type={showModalPassword ? "text" : "password"}
                    className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none font-mono"
                    placeholder="••••••••••••"
                    autoComplete="new-password"
                    value={credentialForm.password}
                    onChange={(e) => setCredentialForm({ ...credentialForm, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowModalPassword(!showModalPassword)}
                    className="px-2.5 h-full text-gray-400 hover:text-gray-700 transition-colors shrink-0"
                    title={showModalPassword ? "Hide password" : "Show password"}
                  >
                    {showModalPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </InputBox>
              </FormField>

              <FormField label="Asset Category">
                <InputBox badge={<Folder className="w-3.5 h-3.5" />} badgeBg="bg-orange-50 text-orange-600 border-orange-100">
                  <select
                    className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 appearance-none focus:outline-none cursor-pointer font-medium"
                    value={credentialForm.assetCategory}
                    onChange={(e) => setCredentialForm({ ...credentialForm, assetCategory: e.target.value })}
                  >
                    <option value="" disabled>Select category...</option>
                    <option value="Server / Hosting">Server / Hosting</option>
                    <option value="Database">Database</option>
                    <option value="Dashboard / CMS">Dashboard / CMS</option>
                    <option value="Domain / DNS">Domain / DNS</option>
                    <option value="Third-Party API">Third-Party API</option>
                    <option value="Other">Other</option>
                  </select>
                </InputBox>
              </FormField>

              <FormField label="Login Portal URL">
                <InputBox badge={<Link2 className="w-3.5 h-3.5" />} badgeBg="bg-teal-50 text-teal-600 border-teal-100">
                  <input
                    type="url"
                    className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none font-medium"
                    placeholder="https://..."
                    value={credentialForm.loginUrl}
                    onChange={(e) => setCredentialForm({ ...credentialForm, loginUrl: e.target.value })}
                  />
                </InputBox>
              </FormField>

              <FormField label="Min Role Access Policy">
                <InputBox badge={<ShieldCheck className="w-3.5 h-3.5" />} badgeBg="bg-rose-50 text-rose-600 border-rose-100">
                  <select
                    className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 appearance-none focus:outline-none cursor-pointer font-medium"
                    value={credentialForm.minRoleAccess}
                    onChange={(e) => setCredentialForm({ ...credentialForm, minRoleAccess: e.target.value })}
                  >
                    <option value="" disabled>Select minimum role...</option>
                    <option value="Tech Lead">Tech Lead</option>
                    <option value="Super Admin">Super Admin</option>
                    <option value="Creative Directory">Creative Directory</option>
                  </select>
                </InputBox>
              </FormField>

              <div className="col-span-2">
                <FormField label="Notes / Access Details (Optional)">
                <div className="relative flex items-start w-full bg-white border border-gray-200 rounded-lg focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/15 transition-all overflow-hidden p-2.5">
                  <textarea
                    rows={2}
                    className="w-full bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none font-medium resize-none"
                    placeholder="Add optional notes, IP restrictions, or 2FA keys..."
                    value={credentialForm.notes}
                    onChange={(e) => setCredentialForm({ ...credentialForm, notes: e.target.value })}
                  />
                </div>
                </FormField>
              </div>

              {/* Action Buttons */}
              <div className="col-span-2 flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100 mt-2">
                <button
                  type="button"
                  onClick={() => setShowCredentialModal(false)}
                  className="h-9 px-4 rounded-lg text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingCred}
                  className="h-9 px-4 rounded-lg text-xs font-semibold text-white bg-[#0052FF] hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-60 flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  {isSavingCred ? "Saving..." : "Save Credential"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* Delete Project Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        title="Delete Project"
        message="Are you sure you want to delete this project? This action cannot be undone and will also delete all associated credentials and billing records."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        variant="danger"
      />

      {/* Edit Project Form Modal */}
      <ProjectFormModal
        isOpen={isEditing}
        project={activeProject}
        onClose={() => setIsEditing(false)}
        onSuccess={() => fetchProject()}
      />

      {/* Configure Technical Assets Modal */}
      <ProjectAssetsModal
        isOpen={showAssetsModal}
        onClose={() => setShowAssetsModal(false)}
        projectId={activeProject.id}
        currentAssets={activeProject.assets}
        onSuccess={(updatedAssets) => {
          setProject((prev) => (prev ? { ...prev, assets: updatedAssets } : prev));
        }}
      />
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
            const pId = project?.id || id || "";
            financeApi.list({ projectId: pId }).then(fRes => setProjectFinanceRecords(fRes.data?.data || []));
            const res = await financeApi.get(newInvoiceId);
            if (res.data.success && res.data.data) {
              setViewingRecord(res.data.data);
              addToast("Invoice created successfully", "success");
            }
          } catch (err) {
            console.error(err);
            const pId = project?.id || id || "";
            financeApi.list({ projectId: pId }).then(fRes => setProjectFinanceRecords(fRes.data?.data || []));
          }
        }}
      />

      <FinanceEditModal
        isOpen={!!quickEditRecord}
        onClose={() => setQuickEditRecord(null)}
        record={quickEditRecord}
        onSuccess={() => {
          const pId = project?.id || id || "";
          financeApi.list({ projectId: pId }).then(fRes => setProjectFinanceRecords(fRes.data?.data || []));
        }}
      />
    </PageWrapper>
  );
}
