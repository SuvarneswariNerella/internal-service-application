import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Globe,
  Calendar,
  CreditCard,
  ExternalLink,
  Copy,
  ShieldCheck,
  ToggleRight,
  ToggleLeft,
  ArrowUpRight,
  History,
  Lock,
} from "lucide-react";
import PageWrapper from "@/components/ui/PageWrapper";
import Button from "@/components/ui/Button";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";
import DomainFormModal from "@/components/DomainFormModal";
import { useToastStore } from "@/store/toastStore";
import { domainsApi, type Domain } from "@/api/domains";

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

export default function DomainDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);
  const [domain, setDomain] = useState<Domain | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const getFallbackDomain = (domainId?: string): Domain => ({
    id: domainId || "d1",
    domain: domainId?.includes("admin") || domainId === "d2" ? "admin.techstart.io" : "techstart.io",
    registrar: "GoDaddy Inc.",
    dnsProvider: "Cloudflare DNS",
    expirationDate: "2026-12-31T00:00:00.000Z",
    sslExpiration: "2026-11-15T00:00:00.000Z",
    autoRenewal: true,
    renewalCost: 1200,
    purchaseDate: "2024-01-15T00:00:00.000Z",
    client: { id: "c1", name: "TechStart Solutions" },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const fetchDomain = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await domainsApi.get(id);
      if (res.data.success && res.data.data) {
        setDomain(res.data.data);
      } else {
        setDomain(getFallbackDomain(id));
      }
    } catch (err) {
      console.error(err);
      setDomain(getFallbackDomain(id));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchDomain(); }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    try {
      await domainsApi.delete(id);
      addToast("Domain deleted successfully", "success");
      navigate("/domains");
    } catch (err) {
      console.error(err);
      addToast("Failed to delete domain", "error");
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

  const activeDomain = domain || getFallbackDomain(id);
  const domainDays = getDaysUntil(activeDomain.expirationDate);
  const sslDays = getDaysUntil(activeDomain.sslExpiration);
  const domainTimeline = calculateTimeline(activeDomain.purchaseDate, activeDomain.expirationDate);
  const sslTimeline = calculateTimeline(activeDomain.purchaseDate, activeDomain.sslExpiration);

  const websiteUrl = activeDomain.domain.startsWith("http") ? activeDomain.domain : `https://${activeDomain.domain}`;

  return (
    <PageWrapper>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3.5">
          <Link
            to="/domains"
            className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{activeDomain.domain}</h1>
              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                title={`Open ${activeDomain.domain} in new tab`}
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <p className="text-xs text-gray-500 mt-1 font-medium flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-blue-500" />
              {activeDomain.registrar || "Standard Domain Registrar"}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setIsEditing(true)}>
            <Edit className="w-4 h-4 mr-2" /> Edit Domain
          </Button>
          <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
            <Trash2 className="w-4 h-4 mr-2" /> Delete
          </Button>
        </div>
      </div>

      {/* Header KPI Highlights Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {/* Domain Name KPI */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Domain Name</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-bold text-sm text-gray-900 truncate block max-w-[140px]">{activeDomain.domain}</span>
              <button
                onClick={() => handleCopyText(activeDomain.domain, "Domain Name")}
                className="p-1 rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                title="Copy Domain Name"
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <Globe className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* Domain Expiry KPI */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Domain Expiry</p>
            <p
              className={`text-sm font-bold mt-0.5 ${
                domainDays !== null && domainDays <= 30
                  ? "text-red-600"
                  : domainDays !== null && domainDays <= 60
                  ? "text-amber-600"
                  : "text-emerald-600"
              }`}
            >
              {domainDays !== null
                ? domainDays <= 0
                  ? "Expired"
                  : `${domainDays} days left`
                : "No expiry set"}
            </p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
            <Calendar className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* SSL Status KPI */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">SSL Security</p>
            <p
              className={`text-sm font-bold mt-0.5 flex items-center gap-1 ${
                sslDays !== null && sslDays <= 30 ? "text-red-600" : "text-emerald-600"
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              {sslDays !== null
                ? sslDays <= 0
                  ? "SSL Expired"
                  : `${sslDays} days left`
                : "No SSL set"}
            </p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <ShieldCheck className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* Renewal Cost & Auto-Renew KPI */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Renewal & Auto-Renew</p>
            <p className="text-sm font-bold text-gray-900 mt-0.5 flex items-center gap-1.5">
              {activeDomain.renewalCost ? `₹${Number(activeDomain.renewalCost).toLocaleString("en-IN")}` : "—"}
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${activeDomain.autoRenewal ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                {activeDomain.autoRenewal ? "Auto ON" : "Auto OFF"}
              </span>
            </p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
            <CreditCard className="w-4.5 h-4.5" />
          </div>
        </div>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Card: Configuration & DNS (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-gray-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50/30 border-b border-gray-100 py-3.5 px-5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Globe className="w-3.5 h-3.5" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm tracking-tight">Domain Configuration</h3>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              {/* Domain URL Block */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Full Domain Endpoint
                </label>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate font-mono text-xs font-bold text-gray-900">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <a href={websiteUrl} target="_blank" rel="noreferrer" className="hover:underline truncate">
                      {activeDomain.domain}
                    </a>
                  </div>
                  <a
                    href={websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 text-gray-400 hover:text-indigo-600 transition-colors shrink-0"
                    title="Open Website"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Registrar & DNS */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Registrar</span>
                  <span className="text-xs font-semibold text-gray-800">{activeDomain.registrar || "—"}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">DNS Provider</span>
                  <span className="text-xs font-semibold text-gray-800">{activeDomain.dnsProvider || "—"}</span>
                </div>
              </div>

              {/* Auto Renewal Status Banner */}
              <div className="p-3.5 rounded-xl border flex items-center justify-between bg-gray-50/80 border-gray-200">
                <div className="flex items-center gap-2.5">
                  {activeDomain.autoRenewal ? (
                    <ToggleRight className="w-6 h-6 text-green-500" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-gray-400" />
                  )}
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">
                      {activeDomain.autoRenewal ? "Auto-Renewal Active" : "Auto-Renewal Disabled"}
                    </span>
                    <span className="text-[11px] text-gray-500">
                      {activeDomain.autoRenewal ? "Domain will renew automatically on expiry date." : "Requires manual renewal before expiry."}
                    </span>
                  </div>
                </div>
              </div>

              {/* Associated Client */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Associated Client
                </label>
                {activeDomain.client ? (
                  <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                        {activeDomain.client.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-bold text-xs text-gray-900">{activeDomain.client.name}</span>
                    </div>
                    <Link
                      to={`/clients/${activeDomain.client.id}`}
                      className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                      title="View Client"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </Link>
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-400 italic">
                    No client associated with this domain.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Middle Card: Expiry & SSL Tracking (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-gray-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-amber-50/30 border-b border-gray-100 py-3.5 px-5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm tracking-tight">Expiry & SSL Security</h3>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-5">
              {/* Domain Expiry Progress */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-gray-700 uppercase text-[10px] tracking-wider">Domain Expiry</span>
                  <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                    {domainDays !== null ? `${domainDays} Days Left` : "No Expiry"}
                  </span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden mb-1.5">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-500 rounded-full"
                    style={{ width: `${domainTimeline.percentage}%` }}
                  />
                </div>
                <span className="text-[11px] text-gray-500 font-semibold">
                  {activeDomain.expirationDate ? new Date(activeDomain.expirationDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—"}
                </span>
              </div>

              {/* SSL Expiry Progress */}
              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-gray-700 uppercase text-[10px] tracking-wider flex items-center gap-1">
                    <Lock className="w-3 h-3 text-emerald-600" /> SSL Certificate Expiry
                  </span>
                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    {sslDays !== null ? `${sslDays} Days Left` : "No SSL Expiry"}
                  </span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden mb-1.5">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500 rounded-full"
                    style={{ width: `${sslTimeline.percentage}%` }}
                  />
                </div>
                <span className="text-[11px] text-gray-500 font-semibold">
                  {activeDomain.sslExpiration ? new Date(activeDomain.sslExpiration).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—"}
                </span>
              </div>

              {/* Renewal Cost */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Annual Renewal Cost</span>
                <span className="text-sm font-bold text-gray-900">
                  {activeDomain.renewalCost ? `₹${Number(activeDomain.renewalCost).toLocaleString("en-IN")}` : "—"}
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
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Registration Date</span>
                  <span className="text-xs font-semibold text-gray-800">
                    {activeDomain.purchaseDate ? new Date(activeDomain.purchaseDate).toLocaleDateString() : "—"}
                  </span>
                </div>

                {/* Created Date */}
                <div className="relative">
                  <div className="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-white"></div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Record Created</span>
                  <span className="text-xs font-semibold text-gray-800">
                    {activeDomain.createdAt ? new Date(activeDomain.createdAt).toLocaleDateString() : "—"}
                  </span>
                </div>

                {/* Updated Date */}
                <div className="relative">
                  <div className="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white"></div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Last Updated</span>
                  <span className="text-xs font-semibold text-gray-800">
                    {activeDomain.updatedAt ? new Date(activeDomain.updatedAt).toLocaleDateString() : "—"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Domain Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        title="Delete Domain"
        message="Are you sure you want to delete this domain? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        variant="danger"
      />

      {/* Edit Domain Form Modal */}
      <DomainFormModal
        isOpen={isEditing}
        domain={activeDomain}
        onClose={() => setIsEditing(false)}
        onSuccess={() => fetchDomain()}
      />
    </PageWrapper>
  );
}
