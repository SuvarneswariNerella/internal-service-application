import { useState, useEffect } from "react";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Globe,
  Server,
  FolderKanban,
  Link2,
  QrCode,
  ChevronRight,
  ExternalLink,
  ToggleLeft,
  ToggleRight,
  Download,
  Eye,
} from "lucide-react";
import PageWrapper from "@/components/ui/PageWrapper";
import Button from "@/components/ui/Button";
import StatusPill from "@/components/ui/StatusPill";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";
import ClientFormModal from "@/components/ClientFormModal";
import QrCodeFormModal from "@/components/QrCodeFormModal";
import { useToastStore } from "@/store/toastStore";
import { clientsApi, type Client } from "@/api/clients";
import { type QrCodeItem } from "@/api/qrCodes";
import { cn } from "@/utils/cn";
import { useSidebarStatsStore } from "@/store/sidebarStatsStore";
function getDaysUntil(dateStr: string | undefined): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

const MODULE_TABS = [
  { key: "projects", label: "Projects", icon: FolderKanban },
  { key: "servers", label: "Servers", icon: Server },
  { key: "domains", label: "Domains", icon: Globe },
  { key: "urls", label: "URL Shortener", icon: Link2 },
  { key: "qr-codes", label: "QR Codes", icon: QrCode },
];

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const addToast = useToastStore((s) => s.addToast);
  const { fetchCounts } = useSidebarStatsStore();
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // QR Modal edit state
  const [isEditQrOpen, setIsEditQrOpen] = useState(false);
  const [editingQr, setEditingQr] = useState<QrCodeItem | null>(null);

  const activeModule = searchParams.get("module") || "projects";

  const setModule = (moduleKey: string) => {
    setSearchParams({ module: moduleKey });
    fetchCounts();
  };

  const fetchClient = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await clientsApi.get(id);
      if (res.data.success && res.data.data) {
        setClient(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch client:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClient();
  }, [id]);

  useEffect(() => {
    if (client) {
      fetchCounts();
    }
  }, [client, activeModule]);

  const handleDelete = async () => {
    if (!id) return;
    try {
      await clientsApi.delete(id);
      addToast("Client deleted successfully", "success");
      fetchCounts();
      navigate("/clients");
    } catch (err) {
      console.error("Failed to delete client:", err);
      addToast("Failed to delete client", "error");
    }
  };

  const handleDownloadQr = (qr: QrCodeItem) => {
    if (!qr.qrData) return;
    const link = document.createElement("a");
    if (qr.qrData.startsWith("data:image")) {
      link.href = qr.qrData;
      link.download = `${qr.name}.png`;
    } else {
      const blob = new Blob([qr.qrData], { type: "image/svg+xml" });
      link.href = URL.createObjectURL(blob);
      link.download = `${qr.name}.svg`;
    }
    link.click();
    addToast("QR code downloaded", "success");
  };

  if (isLoading) {
    return (
      <PageWrapper>
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2"><Skeleton className="h-64" /></div>
          <div><Skeleton className="h-64" /></div>
        </div>
      </PageWrapper>
    );
  }

  if (!client) {
    return (
      <PageWrapper>
        <p className="text-gray-500">Client not found</p>
      </PageWrapper>
    );
  }

  const projectsList: any[] = client.projects || [];
  const serversList: any[] = client.servers || [];
  const domainsList: any[] = client.domains || [];
  const urlsList: any[] = client.shortUrls || (client as any).urls || [];
  const qrCodesList: any[] = client.qrCodes || (client as any).qrcodes || [];

  const kpiCards = [
    { key: "projects", label: "Projects", count: projectsList.length, icon: FolderKanban, color: "text-indigo-600 bg-indigo-50 border-indigo-200 hover:border-indigo-400", pageUrl: `/projects?clientId=${client.id}` },
    { key: "servers", label: "Servers", count: serversList.length, icon: Server, color: "text-amber-600 bg-amber-50 border-amber-200 hover:border-amber-400", pageUrl: `/servers?clientId=${client.id}` },
    { key: "domains", label: "Domains", count: domainsList.length, icon: Globe, color: "text-purple-600 bg-purple-50 border-purple-200 hover:border-purple-400", pageUrl: `/domains?clientId=${client.id}` },
    { key: "urls", label: "URL Shortener", count: urlsList.length, icon: Link2, color: "text-blue-600 bg-blue-50 border-blue-200 hover:border-blue-400", pageUrl: `/urls?clientId=${client.id}` },
    { key: "qr-codes", label: "QR Codes", count: qrCodesList.length, icon: QrCode, color: "text-emerald-600 bg-emerald-50 border-emerald-200 hover:border-emerald-400", pageUrl: `/qr-codes?clientId=${client.id}` },
  ];

  return (
    <PageWrapper>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-4">
          <Link to="/clients" className="p-2 rounded-lg hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
            <p className="text-sm text-gray-500">{client.company}</p>
          </div>
          <StatusPill status={client.status} />
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setIsEditing(true)}>
            <Edit className="w-4 h-4 mr-2" /> Edit Client
          </Button>
          <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
            <Trash2 className="w-4 h-4 mr-2" /> Delete
          </Button>
        </div>
      </div>

      {/* Interactive KPI Summary Grid for Client Resources */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {kpiCards.map((kpi) => {
          const isSelected = activeModule === kpi.key;
          return (
            <div
              key={kpi.key}
              onClick={() => setModule(kpi.key)}
              className={cn(
                "p-4 rounded-xl border transition-all text-left flex flex-col justify-between cursor-pointer group shadow-sm relative",
                isSelected
                  ? "bg-white border-2 border-indigo-600 ring-2 ring-indigo-100 shadow-md scale-[1.02]"
                  : "bg-white border-gray-200 hover:border-indigo-300 hover:shadow-md",
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110", kpi.color)}>
                  <kpi.icon className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-1.5">
                  <Link
                    to={kpi.pageUrl}
                    onClick={(e) => e.stopPropagation()}
                    className="p-1 rounded-md text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                    title={`Open full ${kpi.label} page for ${client.name}`}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{kpi.count}</p>
                <p className="text-xs font-medium text-gray-500">{kpi.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Contact Info & Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader><h3 className="font-semibold text-gray-900">Contact Information</h3></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><p className="text-xs text-gray-500 font-medium">Contact Person</p><p className="text-sm font-semibold text-gray-900">{client.contactPerson}</p></div>
            <div><p className="text-xs text-gray-500 font-medium">Email</p><p className="text-sm font-semibold text-gray-900">{client.email}</p></div>
            <div><p className="text-xs text-gray-500 font-medium">Phone</p><p className="text-sm font-semibold text-gray-900">{client.phone || "—"}</p></div>
            <div><p className="text-xs text-gray-500 font-medium">Address</p><p className="text-sm font-semibold text-gray-900">{client.address || "—"}</p></div>
            <div><p className="text-xs text-gray-500 font-medium">Account Manager Lead</p><p className="text-sm font-semibold text-gray-900">{client.accountManagerLead || "—"}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><h3 className="font-semibold text-gray-900">Client Notes</h3></CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 leading-relaxed">{client.notes || "No additional notes recorded for this client."}</p>
          </CardContent>
        </Card>
      </div>

      {/* Module Resources Area */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
        {/* Module Switcher Header */}
        <div className="flex items-center gap-1 border-b border-gray-200 px-6 pt-3 bg-white overflow-x-auto">
          {MODULE_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setModule(tab.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap",
                activeModule === tab.key
                  ? "border-blue-600 text-blue-600 bg-blue-50/40"
                  : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300"
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-gray-100 text-gray-600">
                {tab.key === "projects"
                  ? projectsList.length
                  : tab.key === "servers"
                  ? serversList.length
                  : tab.key === "domains"
                  ? domainsList.length
                  : tab.key === "urls"
                  ? urlsList.length
                  : qrCodesList.length}
              </span>
            </button>
          ))}
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {activeModule === "projects" && (
            projectsList.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-xs">No projects associated with this client yet.</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider sticky top-0">
                    <th className="py-3.5 px-6">Project Name</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6">Technology</th>
                    <th className="py-3.5 px-6">Start Date</th>
                    <th className="py-3.5 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {projectsList.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => navigate(`/projects/${p.id}`)}
                      className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-6 font-semibold text-blue-600 group-hover:text-blue-800 group-hover:underline">
                        {p.name}
                      </td>
                      <td className="py-3.5 px-6">
                        <StatusPill status={p.status || "ACTIVE"} />
                      </td>
                      <td className="py-3.5 px-6 text-gray-600 font-medium">
                        {p.technology || p.technologies?.join(", ") || "—"}
                      </td>
                      <td className="py-3.5 px-6 text-gray-600 font-medium">
                        {p.startDate ? new Date(p.startDate).toLocaleDateString() : p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors inline-block" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}

          {activeModule === "servers" && (
            serversList.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-xs">No servers associated with this client yet.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 p-5 bg-gray-50/50">
                {serversList.map((server) => {
                  const days = getDaysUntil(server.expiryDate || server.expirationDate);
                  return (
                    <Card
                      key={server.id}
                      onClick={() => navigate(`/servers/${server.id}`)}
                      className="overflow-hidden hover:shadow-lg hover:border-indigo-200 transition-all duration-200 h-full flex flex-col cursor-pointer group bg-white"
                    >
                      {/* Header */}
                      <div className="px-4 pt-4 pb-3">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                              <Server className="w-5 h-5 text-white" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate group-hover:text-indigo-600 transition-colors">
                                {server.name}
                              </h3>
                              <p className="text-xs text-gray-500 mt-0.5 truncate">{server.provider || "Cloud Server"}</p>
                            </div>
                          </div>
                          <div className="shrink-0">
                            <StatusPill status={server.status || "ACTIVE"} />
                          </div>
                        </div>

                        {/* IP Address */}
                        <div className="space-y-1.5 text-xs">
                          {server.ipAddress ? (
                            <div className="flex items-center justify-between text-gray-700 bg-gray-50 px-2.5 py-1.5 rounded-md border border-gray-100">
                              <div className="flex items-center gap-2 font-mono text-xs font-semibold">
                                <Globe className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                <span>{server.ipAddress}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-gray-400 font-mono">
                              <Globe className="w-3 h-3 text-gray-300 shrink-0" />
                              <span>No IP Address</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

                      {/* KPI Grid */}
                      <div className="px-4 py-3">
                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="bg-gray-50 rounded-lg px-2.5 py-2 border border-transparent">
                            <p className="text-[9px] font-medium text-gray-500 uppercase tracking-wider mb-0.5">Renewal Cost</p>
                            <p className="text-sm font-bold text-gray-900">
                              {server.renewalCost ? `₹${Number(server.renewalCost).toLocaleString("en-IN")}` : "—"}
                            </p>
                          </div>
                          <div className={cn("bg-gray-50 rounded-lg px-2.5 py-2 border border-transparent", days !== null && days <= 30 ? "bg-red-50/80" : "")}>
                            <p className="text-[9px] font-medium text-gray-500 uppercase tracking-wider mb-0.5">Expiry Status</p>
                            <p className={cn("text-sm font-bold", days !== null && days <= 30 ? "text-red-600" : "text-gray-900")}>
                              {days !== null ? (days <= 0 ? "Expired" : `${days}d remaining`) : "—"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-auto">
                        <div className="mx-4 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                        <div className="py-2.5 text-center text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors">
                          View Server Details →
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )
          )}

          {activeModule === "domains" && (
            domainsList.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-xs">No domains associated with this client yet.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 p-5 bg-gray-50/50">
                {domainsList.map((domain) => {
                  const domainName = domain.domain || domain.name;
                  const domainDays = getDaysUntil(domain.expirationDate || domain.expiryDate);
                  const sslDays = getDaysUntil(domain.sslExpiration);
                  return (
                    <Card
                      key={domain.id}
                      onClick={() => navigate(`/domains/${domain.id}`)}
                      className="overflow-hidden hover:shadow-lg hover:border-indigo-200 transition-all duration-200 h-full flex flex-col cursor-pointer group bg-white"
                    >
                      {/* Header */}
                      <div className="px-4 pt-4 pb-3">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                              <Globe className="w-5 h-5 text-white" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate group-hover:text-indigo-600 transition-colors">
                                  {domainName}
                                </h3>
                                <a
                                  href={domainName.startsWith("http") ? domainName : `https://${domainName}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-1 rounded text-gray-400 hover:text-indigo-600 transition-colors shrink-0"
                                  title={`Open ${domainName} in new tab`}
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5 truncate">{domain.registrar || "Domain Registrar"}</p>
                            </div>
                          </div>
                          <div className="shrink-0">
                            {domain.autoRenewal !== false ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                                <ToggleRight className="w-3.5 h-3.5 text-green-600" />
                                Auto ON
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500 border border-gray-200">
                                <ToggleLeft className="w-3.5 h-3.5 text-gray-400" />
                                Auto OFF
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

                      {/* KPI Grid */}
                      <div className="px-4 py-3">
                        <div className="grid grid-cols-2 gap-2.5">
                          <div className={cn("bg-gray-50 rounded-lg px-2.5 py-2 border border-transparent", domainDays !== null && domainDays <= 30 ? "bg-red-50/80" : "")}>
                            <p className="text-[9px] font-medium text-gray-500 uppercase tracking-wider mb-0.5">Domain Expiry</p>
                            <p className={cn("text-sm font-bold", domainDays !== null && domainDays <= 30 ? "text-red-600" : "text-gray-900")}>
                              {domainDays !== null ? (domainDays <= 0 ? "Expired" : `${domainDays}d remaining`) : "—"}
                            </p>
                          </div>
                          <div className={cn("bg-gray-50 rounded-lg px-2.5 py-2 border border-transparent", sslDays !== null && sslDays <= 30 ? "bg-red-50/80" : "")}>
                            <p className="text-[9px] font-medium text-gray-500 uppercase tracking-wider mb-0.5">SSL Security</p>
                            <p className={cn("text-sm font-bold", sslDays !== null && sslDays <= 30 ? "text-red-600" : "text-gray-900")}>
                              {sslDays !== null ? (sslDays <= 0 ? "Expired" : `${sslDays}d active`) : "—"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-auto">
                        <div className="mx-4 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                        <div className="py-2.5 text-center text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors">
                          View Domain Details →
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )
          )}

          {activeModule === "urls" && (
            urlsList.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-xs">No short URLs created for this client yet.</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider sticky top-0">
                    <th className="py-3.5 px-6">Short URL</th>
                    <th className="py-3.5 px-6">Destination URL</th>
                    <th className="py-3.5 px-6">Clicks</th>
                    <th className="py-3.5 px-6">Created Date</th>
                    <th className="py-3.5 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {urlsList.map((u) => (
                    <tr
                      key={u.id}
                      onClick={() => navigate(`/urls/${u.id}`)}
                      className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-6 font-semibold text-blue-600 group-hover:text-blue-800">
                        <div>
                          <span className="group-hover:underline font-semibold block">{u.alias || u.shortCode}</span>
                          <span className="text-[11px] text-gray-400 font-mono font-normal">/s/{u.shortCode}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-6 max-w-xs truncate text-gray-600 font-mono text-xs">
                        {u.originalUrl || u.destinationUrl}
                      </td>
                      <td className="py-3.5 px-6 text-gray-700 font-semibold">
                        {u.clickCount ?? u.clicks ?? 0} clicks
                      </td>
                      <td className="py-3.5 px-6 text-gray-600 font-medium">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : u.createdDate ? new Date(u.createdDate).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors inline-block" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}

          {activeModule === "qr-codes" && (
            qrCodesList.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-xs">No QR codes created for this client yet.</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider sticky top-0">
                    <th className="py-3.5 px-6 w-14">Preview</th>
                    <th className="py-3.5 px-6">QR Name</th>
                    <th className="py-3.5 px-6">Type</th>
                    <th className="py-3.5 px-6">Content</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6">Created Date</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {qrCodesList.map((q) => (
                    <tr
                      key={q.id}
                      onClick={() => navigate(`/qr-codes/${q.id}`)}
                      className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
                    >
                      <td className="py-2.5 px-6" onClick={(e) => e.stopPropagation()}>
                        <div
                          className="w-9 h-9 rounded-lg border border-gray-200 bg-white p-1 flex items-center justify-center overflow-hidden shadow-2xs hover:scale-110 transition-transform cursor-pointer"
                          onClick={() => navigate(`/qr-codes/${q.id}`)}
                        >
                          {q.qrData ? (
                            <div
                              className="w-full h-full flex items-center justify-center"
                              dangerouslySetInnerHTML={{
                                __html: q.qrData.startsWith("data:")
                                  ? `<img src="${q.qrData}" alt="Thumbnail" class="w-full h-full object-contain" />`
                                  : q.qrData,
                              }}
                            />
                          ) : (
                            <QrCode className="w-4 h-4 text-emerald-600" />
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-6 font-semibold text-blue-600 group-hover:text-blue-800 group-hover:underline">
                        {q.name}
                      </td>
                      <td className="py-3.5 px-6">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-xs font-semibold border border-purple-100">
                          {q.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 max-w-xs truncate text-gray-600 font-mono text-xs">
                        {q.content || q.destination}
                      </td>
                      <td className="py-3.5 px-6 font-medium">
                        <StatusPill status={q.status || "ACTIVE"} />
                      </td>
                      <td className="py-3.5 px-6 text-gray-600 font-medium">
                        {q.createdAt ? new Date(q.createdAt).toLocaleDateString() : q.createdDate ? new Date(q.createdDate).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-3.5 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleDownloadQr(q)}
                            className="p-1 rounded text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Download QR code"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingQr(q);
                              setIsEditQrOpen(true);
                            }}
                            className="p-1 rounded text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="Edit QR code"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/qr-codes/${q.id}`)}
                            className="p-1 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                            title="View details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>

      {/* Edit Client Modal */}
      <ClientFormModal
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        client={client}
        onSuccess={(updatedClient) => {
          if (updatedClient) setClient(updatedClient);
          else fetchClient();
        }}
      />

      {/* Edit QR Code Modal */}
      <QrCodeFormModal
        isOpen={isEditQrOpen}
        qrItem={editingQr}
        onClose={() => {
          setIsEditQrOpen(false);
          setEditingQr(null);
        }}
        onSuccess={() => {
          fetchClient();
          fetchCounts();
        }}
      />

      {/* Delete Client Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        title="Delete Client"
        message="Are you sure you want to delete this client? This action cannot be undone and will also delete all associated projects, servers, and domains."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        variant="danger"
      />
    </PageWrapper>
  );
}
