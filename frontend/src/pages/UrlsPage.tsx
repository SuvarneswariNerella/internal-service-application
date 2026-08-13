import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Search, ExternalLink, Copy, BarChart3, Trash2, Link as LinkIcon, Building2, FolderKanban, Lock, Edit, QrCode } from "lucide-react";
import PageWrapper from "@/components/ui/PageWrapper";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Skeleton from "@/components/ui/Skeleton";
import StatusPill from "@/components/ui/StatusPill";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";
import UrlFormModal from "@/components/UrlFormModal";
import QrCodeExportModal from "@/components/QrCodeExportModal";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useToastStore } from "@/store/toastStore";
import { urlsApi, type ShortUrl } from "@/api/urls";
import { clientsApi, type Client } from "@/api/clients";

export default function UrlsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const clientIdParam = searchParams.get("clientId") || "";
  const addToast = useToastStore((s) => s.addToast);

  const [urls, setUrls] = useState<ShortUrl[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState(clientIdParam);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { globalWorkspaceId } = useWorkspaceStore();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingUrl, setEditingUrl] = useState<ShortUrl | null>(null);
  const [exportQrUrl, setExportQrUrl] = useState<ShortUrl | null>(null);

  useEffect(() => {
    clientsApi.list({ 
      pageSize: 1000,
      workspaceId: globalWorkspaceId === "all" ? undefined : globalWorkspaceId
    }).then((res) => {
      if (res.data.success && res.data.data) setClients(res.data.data);
    });
  }, [globalWorkspaceId]);

  useEffect(() => {
    setSelectedClientId(clientIdParam);
  }, [clientIdParam]);

  const handleClientFilterChange = (newClientId: string) => {
    setSelectedClientId(newClientId);
    if (newClientId) {
      setSearchParams({ clientId: newClientId });
    } else {
      setSearchParams({});
    }
  };

  useEffect(() => { fetchUrls(); }, [search, selectedClientId, globalWorkspaceId]);

  const fetchUrls = async () => {
    setIsLoading(true);
    try {
      const res = await urlsApi.list({
        search: search || undefined,
        clientId: selectedClientId || undefined,
        workspaceId: globalWorkspaceId === "all" ? undefined : globalWorkspaceId,
        pageSize: 1000,
      });
      if (res.data.data) {
        setUrls(res.data.data);
      } else {
        setUrls([]);
      }
    } catch (err) {
      console.error(err);
      setUrls([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (url: ShortUrl) => {
    const domainHost = window.location.origin;
    navigator.clipboard.writeText(`${domainHost}/s/${url.shortCode}`);
    addToast("Short URL copied to clipboard!", "success");
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await urlsApi.delete(deleteId);
      setUrls(urls.filter((u) => u.id !== deleteId));
      addToast("URL deleted successfully", "success");
      setDeleteId(null);
    } catch (err) { addToast("Failed to delete URL", "error"); }
  };

  const isExpired = (url: ShortUrl) => {
    if (url.status === "EXPIRED") return true;
    return false;
  };

  return (
    <PageWrapper>
      <PageHeader
        title="URL Shortener"
        description="Create and manage short URLs across all clients, projects, and internal services"
        icon={<LinkIcon className="w-5 h-5" />}
        action={
          <Button onClick={() => { setEditingUrl(null); setIsAddOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            New Short URL
          </Button>
        }
      />

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search URLs by short link, alias, original destination, category, tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
          <select
            value={selectedClientId}
            onChange={(e) => handleClientFilterChange(e.target.value)}
            className="h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">All Clients (Full Application)</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.company})
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-none">
              <div className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <div>
                  <Skeleton className="h-4 w-40 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      ) : urls.length === 0 ? (
        <Card><CardContent><p className="text-gray-500 text-center py-8">No short URLs found.</p></CardContent></Card>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Short Link / Alias</th>
                  <th className="py-3 px-4">Client / Project</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Original URL</th>
                  <th className="py-3 px-4">Clicks</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 w-16 text-center">QR Code</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                {urls.map((url) => {
                  const expired = isExpired(url);
                  const displayClicks = url._count?.clicks ?? url.clickCount ?? 0;
                  const primaryQr = url.qrCodes?.[0];
                  return (
                    <tr
                      key={url.id}
                      className={`hover:bg-blue-50/40 transition-colors group cursor-pointer ${expired ? "opacity-60" : ""}`}
                      onClick={() => navigate(`/urls/${url.id}`)}
                    >
                      {/* Short Link / Alias */}
                      <td className="py-3 px-4 font-semibold text-gray-900">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                            <LinkIcon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-gray-900 block truncate">
                                {url.alias || url.shortCode}
                              </span>
                              {url.passwordHash && (
                                <span className="p-0.5 rounded bg-amber-100 text-amber-700 shrink-0" title="Password protected">
                                  <Lock className="w-3 h-3" />
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-gray-400 font-mono">
                              /s/{url.shortCode}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Client / Project Column */}
                      <td className="py-3 px-4 font-medium text-gray-600">
                        <div className="flex flex-col gap-0.5">
                          {url.client?.name ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600">
                              <Building2 className="w-3 h-3" />
                              {url.client.name}
                            </span>
                          ) : (
                            <span className="text-gray-400">Internal</span>
                          )}
                          {url.project?.name && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                              <FolderKanban className="w-3 h-3" />
                              {url.project.name}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 font-medium">
                        {url.category ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-xs font-medium border border-purple-100">
                            {url.category}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      {/* Original URL */}
                      <td className="py-3 px-4 max-w-xs truncate text-gray-600 font-medium">
                        <a
                          href={url.originalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline hover:text-indigo-600 transition-colors truncate block"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {url.originalUrl}
                        </a>
                      </td>

                      {/* Clicks */}
                      <td className="py-3 px-4 font-medium text-gray-800">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-xs font-semibold">
                          <BarChart3 className="w-3 h-3 text-gray-500" />
                          {displayClicks} clicks
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 font-medium">
                        <StatusPill status={url.status} />
                      </td>

                      {/* QR Code */}
                      <td className="py-3 px-4" onClick={(e) => {
                        e.stopPropagation();
                        if (primaryQr?.qrData) {
                          setExportQrUrl(url);
                        }
                      }}>
                        <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shrink-0 border border-gray-200 overflow-hidden shadow-2xs hover:scale-110 transition-transform cursor-pointer" title="Export QR Code">
                          {primaryQr?.qrData ? (
                            primaryQr.qrData.startsWith("data:") ? (
                              <img
                                src={primaryQr.qrData}
                                alt="QR Code"
                                className="w-full h-full object-cover hover:opacity-80 transition-opacity"
                              />
                            ) : (
                              <div 
                                className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full hover:opacity-80 transition-opacity"
                                dangerouslySetInnerHTML={{ __html: primaryQr.qrData }}
                              />
                            )
                          ) : (
                            <QrCode className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleCopy(url)}
                            className="p-1.5 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Copy short link"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => { setEditingUrl(url); setIsAddOpen(true); }}
                            className="p-1.5 rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="Edit Short URL"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/urls/${url.id}`)}
                            className="p-1.5 rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="View Analytics"
                          >
                            <BarChart3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => window.open(url.originalUrl, "_blank")}
                            className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                            title="Open destination URL"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteId(url.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete short link"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmationDialog
        isOpen={!!deleteId}
        title="Delete Short URL"
        message="Are you sure you want to delete this short URL? This will also delete all click analytics data."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        variant="danger"
      />

      <UrlFormModal
        isOpen={isAddOpen}
        urlItem={editingUrl}
        onClose={() => { setIsAddOpen(false); setEditingUrl(null); }}
        onSuccess={() => fetchUrls()}
      />

      <QrCodeExportModal
        isOpen={!!exportQrUrl}
        urlItem={exportQrUrl}
        onClose={() => setExportQrUrl(null)}
      />
    </PageWrapper>
  );
}
