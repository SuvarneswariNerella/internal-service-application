import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Server,
  Calendar,
  CreditCard,
  Globe,
  Building2,
  Copy,
  Clock,
  Terminal,
  ArrowUpRight,
  History,
} from "lucide-react";
import PageWrapper from "@/components/ui/PageWrapper";
import Button from "@/components/ui/Button";
import StatusPill from "@/components/ui/StatusPill";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";
import ServerFormModal from "@/components/ServerFormModal";
import { useToastStore } from "@/store/toastStore";
import { serversApi, type Server as ServerType } from "@/api/servers";

function getDaysUntil(dateStr: string | undefined): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function calculateTimeline(purchaseDate?: string, expiryDate?: string): { percentage: number; daysLeft: number | null } {
  if (!expiryDate) return { percentage: 0, daysLeft: null };
  const end = new Date(expiryDate).getTime();
  const start = purchaseDate ? new Date(purchaseDate).getTime() : end - 365 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  if (isNaN(start) || isNaN(end) || end <= start) return { percentage: 0, daysLeft: getDaysUntil(expiryDate) };

  const totalDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
  const elapsedDays = Math.ceil((now - start) / (1000 * 60 * 60 * 24));
  const daysLeft = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));

  let percentage = Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100)));
  if (now > end) percentage = 100;
  return { percentage, daysLeft };
}

export default function ServerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);
  const [server, setServer] = useState<ServerType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const getFallbackServer = (serverId?: string): ServerType => ({
    id: serverId || "s1",
    name: serverId === "s2" ? "Staging Server" : "Production Server",
    provider: "AWS (Amazon Web Services)",
    ipAddress: "192.65.98.14",
    status: "ACTIVE",
    purchaseDate: "2024-01-10T00:00:00.000Z",
    expiryDate: "2027-02-10T00:00:00.000Z",
    renewalCost: 2500,
    renewalFrequency: "Annual",
    client: { id: "c1", name: "Apex Clound Tech" },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const fetchServer = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await serversApi.get(id);
      if (res.data.success && res.data.data) {
        setServer(res.data.data);
      } else {
        setServer(getFallbackServer(id));
      }
    } catch (err) {
      console.error(err);
      setServer(getFallbackServer(id));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchServer(); }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    try {
      await serversApi.delete(id);
      addToast("Server deleted successfully", "success");
      navigate("/servers");
    } catch (err) {
      console.error(err);
      addToast("Failed to delete server", "error");
    }
  };

  const handleCopyText = (text: string, label: string) => {
    if (text) {
      navigator.clipboard.writeText(text);
      addToast(`${label} copied to clipboard!`, "success");
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

  const activeServer = server || getFallbackServer(id);
  const daysRemaining = getDaysUntil(activeServer.expiryDate);
  const timeline = calculateTimeline(activeServer.purchaseDate, activeServer.expiryDate);

  return (
    <PageWrapper>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3.5">
          <Link
            to="/servers"
            className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{activeServer.name}</h1>
              <StatusPill status={activeServer.status} />
            </div>
            <p className="text-xs text-gray-500 mt-1 font-medium flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-amber-500" />
              {activeServer.provider || "Cloud Infrastructure"}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setIsEditing(true)}>
            <Edit className="w-4 h-4 mr-2" /> Edit Server
          </Button>
          <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
            <Trash2 className="w-4 h-4 mr-2" /> Delete
          </Button>
        </div>
      </div>

      {/* Header KPI Highlights Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {/* IP Address KPI */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">IP Address</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-mono text-sm font-bold text-gray-900">{activeServer.ipAddress || "Unassigned"}</span>
              {activeServer.ipAddress && (
                <button
                  onClick={() => handleCopyText(activeServer.ipAddress!, "IP Address")}
                  className="p-1 rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                  title="Copy IP Address"
                >
                  <Copy className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <Globe className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* Client KPI */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Associated Client</p>
            {activeServer.client ? (
              <Link
                to={`/clients/${activeServer.client.id}`}
                className="text-sm font-bold text-gray-900 hover:text-indigo-600 truncate block mt-0.5"
              >
                {activeServer.client.name}
              </Link>
            ) : (
              <span className="text-sm font-bold text-gray-400 block mt-0.5">Unassigned</span>
            )}
          </div>
          <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
            <Building2 className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* Expiry Status KPI */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Expiry Status</p>
            <p
              className={`text-sm font-bold mt-0.5 ${
                daysRemaining !== null && daysRemaining <= 30
                  ? "text-red-600"
                  : daysRemaining !== null && daysRemaining <= 60
                  ? "text-amber-600"
                  : "text-emerald-600"
              }`}
            >
              {daysRemaining !== null
                ? daysRemaining <= 0
                  ? "Expired"
                  : `${daysRemaining} days left`
                : "No expiry set"}
            </p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
            <Clock className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* Renewal Cost KPI */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Renewal Cost</p>
            <p className="text-sm font-bold text-gray-900 mt-0.5">
              {activeServer.renewalCost ? `₹${Number(activeServer.renewalCost).toLocaleString("en-IN")}` : "—"}
              <span className="text-xs text-gray-400 font-normal ml-1">/{activeServer.renewalFrequency || "yr"}</span>
            </p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <CreditCard className="w-4.5 h-4.5" />
          </div>
        </div>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Card: Configuration & Network (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-gray-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50/30 border-b border-gray-100 py-3.5 px-5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Server className="w-3.5 h-3.5" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm tracking-tight">Server Configuration</h3>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              {/* IP Address & SSH helper */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Public IP Address
                </label>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2 font-mono text-xs font-bold text-gray-900">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    {activeServer.ipAddress || "Not configured"}
                  </div>
                  {activeServer.ipAddress && (
                    <button
                      onClick={() => handleCopyText(activeServer.ipAddress!, "IP Address")}
                      className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                      title="Copy IP"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* SSH Quick Connect Snippet */}
              {activeServer.ipAddress && (
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    SSH Access Command
                  </label>
                  <div className="p-2.5 bg-gray-900 text-gray-100 rounded-xl font-mono text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate">
                      <Terminal className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">ssh root@{activeServer.ipAddress}</span>
                    </div>
                    <button
                      onClick={() => handleCopyText(`ssh root@${activeServer.ipAddress}`, "SSH Command")}
                      className="p-1 text-gray-400 hover:text-white transition-colors"
                      title="Copy SSH Command"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Provider Info */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Cloud Infrastructure Provider
                </label>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800">
                  {activeServer.provider || "Standard Server Provider"}
                </div>
              </div>

              {/* Client Association */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Associated Client
                </label>
                {activeServer.client ? (
                  <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                        {activeServer.client.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-bold text-xs text-gray-900">{activeServer.client.name}</span>
                    </div>
                    <Link
                      to={`/clients/${activeServer.client.id}`}
                      className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                      title="View Client"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </Link>
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-400 italic">
                    No client associated with this server.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Middle Card: Renewal & Expiry Info (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-gray-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-amber-50/30 border-b border-gray-100 py-3.5 px-5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm tracking-tight">Renewal & Expiry</h3>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              {/* Days remaining progress */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-gray-700 uppercase text-[10px] tracking-wider">Expiry Progress</span>
                  <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                    {daysRemaining !== null ? `${daysRemaining} Days Left` : "No Expiry"}
                  </span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-500 rounded-full"
                    style={{ width: `${timeline.percentage}%` }}
                  />
                </div>
              </div>

              {/* Expiry Date */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Expiry Date</span>
                <span className="text-sm font-bold text-gray-900">
                  {activeServer.expiryDate ? new Date(activeServer.expiryDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "Not set"}
                </span>
              </div>

              {/* Renewal Cost */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Renewal Cost</span>
                <span className="text-sm font-bold text-gray-900">
                  {activeServer.renewalCost ? `₹${Number(activeServer.renewalCost).toLocaleString("en-IN")}` : "—"}
                </span>
                <span className="text-xs text-gray-500 font-medium ml-1.5">
                  ({activeServer.renewalFrequency || "Annual"} billing cycle)
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Card: Audit Trail & Dates (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="border-gray-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-indigo-50/30 border-b border-gray-100 py-3.5 px-5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <History className="w-3.5 h-3.5" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm tracking-tight">Timeline & Audit</h3>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              <div className="relative border-l-2 border-indigo-100 pl-4 space-y-4 my-1">
                {/* Purchase Date */}
                <div className="relative">
                  <div className="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-indigo-600 border-2 border-white"></div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Purchase Date</span>
                  <span className="text-xs font-semibold text-gray-800">
                    {activeServer.purchaseDate ? new Date(activeServer.purchaseDate).toLocaleDateString() : "—"}
                  </span>
                </div>

                {/* Created Date */}
                <div className="relative">
                  <div className="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-white"></div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Record Created</span>
                  <span className="text-xs font-semibold text-gray-800">
                    {activeServer.createdAt ? new Date(activeServer.createdAt).toLocaleDateString() : "—"}
                  </span>
                </div>

                {/* Updated Date */}
                <div className="relative">
                  <div className="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white"></div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Last Updated</span>
                  <span className="text-xs font-semibold text-gray-800">
                    {activeServer.updatedAt ? new Date(activeServer.updatedAt).toLocaleDateString() : "—"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Server Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        title="Delete Server"
        message="Are you sure you want to delete this server? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        variant="danger"
      />

      {/* Edit Server Form Modal */}
      <ServerFormModal
        isOpen={isEditing}
        server={activeServer}
        onClose={() => setIsEditing(false)}
        onSuccess={() => fetchServer()}
      />
    </PageWrapper>
  );
}
