import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Plus,
  Search,
  Trash2,
  Eye,
  QrCode,
  Download,
  Edit,
  Building2,
  FolderKanban,
} from "lucide-react";
import PageWrapper from "@/components/ui/PageWrapper";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Skeleton from "@/components/ui/Skeleton";
import StatusPill from "@/components/ui/StatusPill";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";
import QrCodeFormModal from "@/components/QrCodeFormModal";
import { useToastStore } from "@/store/toastStore";
import { qrCodesApi, type QrCodeItem } from "@/api/qrCodes";
import { clientsApi, type Client } from "@/api/clients";

const TYPE_FILTER_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "URL", label: "URL" },
  { value: "TEXT", label: "Plain Text" },
  { value: "EMAIL", label: "Email" },
  { value: "PHONE", label: "Phone Number" },
  { value: "SMS", label: "SMS" },
  { value: "WIFI", label: "Wi-Fi" },
  { value: "VCARD", label: "vCard" },
];

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "ARCHIVED", label: "Archived" },
  { value: "EXPIRED", label: "Expired" },
];

export default function QrCodesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const clientIdParam = searchParams.get("clientId") || "";
  const addToast = useToastStore((s) => s.addToast);

  const [codes, setCodes] = useState<QrCodeItem[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState(clientIdParam);
  const [selectedType, setSelectedType] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Modal & Delete confirmation states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingQr, setEditingQr] = useState<QrCodeItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Download menu target
  const [downloadTargetQr, setDownloadTargetQr] = useState<QrCodeItem | null>(null);

  // Load clients options
  useEffect(() => {
    clientsApi
      .list({ pageSize: 1000 })
      .then((res) => {
        if (res.data?.data) {
          setClients(res.data.data);
        }
      })
      .catch(console.error);
  }, []);

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

  useEffect(() => {
    fetchCodes();
  }, [search, selectedClientId, selectedType, selectedStatus]);

  const fetchCodes = async () => {
    setIsLoading(true);
    try {
      const res = await qrCodesApi.list({
        search: search || undefined,
        clientId: selectedClientId || undefined,
        type: selectedType || undefined,
        status: selectedStatus || undefined,
        pageSize: 100,
      });
      if (res.data?.data) {
        setCodes(res.data.data);
      } else {
        setCodes([]);
      }
    } catch (err) {
      console.error(err);
      setCodes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await qrCodesApi.delete(deleteId);
      setCodes(codes.filter((c) => c.id !== deleteId));
      addToast("QR code deleted successfully", "success");
      setDeleteId(null);
    } catch (err) {
      addToast("Failed to delete QR code", "error");
    }
  };

  const executeDownload = (qr: QrCodeItem, requestedFormat: "PNG" | "SVG") => {
    if (!qr.qrData) return;
    const link = document.createElement("a");
    if (requestedFormat === "PNG") {
      if (qr.qrData.startsWith("data:image/png")) {
        link.href = qr.qrData;
        link.download = `${qr.name}.png`;
        link.click();
      } else {
        const svgBlob = new Blob([qr.qrData], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(svgBlob);
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = 512;
          canvas.height = 512;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, 512, 512);
            ctx.drawImage(img, 0, 0, 512, 512);
            link.href = canvas.toDataURL("image/png");
            link.download = `${qr.name}.png`;
            link.click();
            URL.revokeObjectURL(url);
            addToast("Downloaded QR code as PNG", "success");
          }
        };
        img.src = url;
        return;
      }
    } else {
      const blob = new Blob([qr.qrData], { type: "image/svg+xml" });
      link.href = URL.createObjectURL(blob);
      link.download = `${qr.name}.svg`;
      link.click();
    }
    addToast(`Downloaded QR code as ${requestedFormat}`, "success");
  };

  return (
    <PageWrapper>
      <PageHeader
        title="QR Codes"
        description="Generate, customize, and manage dynamic QR codes across clients and projects"
        action={
          <Button
            onClick={() => {
              setEditingQr(null);
              setIsAddOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            New QR Code
          </Button>
        }
      />

      {/* Search & Filters Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search QR codes by name, content, tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 text-xs"
            />
          </div>

          {/* Client Filter */}
          <div className="relative">
            <select
              value={selectedClientId}
              onChange={(e) => handleClientFilterChange(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-gray-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">All Clients (Full System)</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.company})
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div className="relative">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-gray-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              {TYPE_FILTER_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-gray-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              {STATUS_FILTER_OPTIONS.map((st) => (
                <option key={st.value} value={st.value}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Content */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-none">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-lg" />
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
      ) : codes.length === 0 ? (
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <QrCode className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-semibold mb-1">No QR codes found</p>
              <p className="text-gray-400 text-xs mb-4">
                {search || selectedClientId || selectedType || selectedStatus
                  ? "Try clearing filters to view all records"
                  : "Generate your first QR code to get started"}
              </p>
              <Button
                onClick={() => {
                  setEditingQr(null);
                  setIsAddOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" /> New QR Code
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4 w-14">Preview</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Content</th>
                  <th className="py-3 px-4">Client / Project</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                {codes.map((qr) => (
                  <tr
                    key={qr.id}
                    className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                    onClick={() => navigate(`/qr-codes/${qr.id}`)}
                  >
                    {/* QR Thumbnail Preview */}
                    <td className="py-2.5 px-4" onClick={(e) => e.stopPropagation()}>
                      <div
                        className="w-9 h-9 rounded-lg border border-gray-200 bg-white p-1 flex items-center justify-center overflow-hidden shadow-2xs hover:scale-110 transition-transform cursor-pointer"
                        title="Click to view QR code detail"
                        onClick={() => navigate(`/qr-codes/${qr.id}`)}
                      >
                        {qr.qrData ? (
                          <div
                            className="w-full h-full flex items-center justify-center"
                            dangerouslySetInnerHTML={{
                              __html: qr.qrData.startsWith("data:")
                                ? `<img src="${qr.qrData}" alt="Thumbnail" class="w-full h-full object-contain" />`
                                : qr.qrData,
                            }}
                          />
                        ) : (
                          <QrCode className="w-4 h-4 text-indigo-600" />
                        )}
                      </div>
                    </td>

                    {/* Name */}
                    <td className="py-3 px-4 font-semibold text-gray-900 max-w-[180px]">
                      <span className="font-semibold text-gray-900 block truncate" title={qr.name}>
                        {qr.name}
                      </span>
                      {qr.tags && (
                        <div className="flex gap-1 flex-wrap mt-0.5">
                          {qr.tags.split(",").map((t, idx) => (
                            <span
                              key={idx}
                              className="text-[9px] font-medium bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded"
                            >
                              #{t.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Type */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-xs font-semibold border border-purple-100">
                        {qr.type}
                      </span>
                    </td>

                    {/* Content (Truncated) */}
                    <td className="py-3 px-4 max-w-xs truncate text-gray-600 font-mono text-[11px]">
                      {qr.content}
                    </td>

                    {/* Client / Project Column */}
                    <td className="py-3 px-4 font-medium text-gray-600">
                      <div className="flex flex-col gap-0.5">
                        {qr.client?.name ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600">
                            <Building2 className="w-3 h-3" />
                            {qr.client.name}
                          </span>
                        ) : (
                          <span className="text-gray-400">Internal</span>
                        )}
                        {qr.project?.name && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                            <FolderKanban className="w-3 h-3" />
                            {qr.project.name}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 font-medium">
                      <StatusPill status={qr.status || "ACTIVE"} />
                    </td>

                    {/* Created Date */}
                    <td className="py-3 px-4 text-gray-600 font-medium whitespace-nowrap">
                      {new Date(qr.createdAt).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setDownloadTargetQr(qr)}
                          className="p-1.5 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Download QR code"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingQr(qr);
                            setIsAddOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Edit QR Code"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => navigate(`/qr-codes/${qr.id}`)}
                          className="p-1.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteId(qr.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete QR Code"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Format Selection Download Modal */}
      {downloadTargetQr && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 cursor-pointer"
          onClick={() => setDownloadTargetQr(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-xl p-5 max-w-xs w-full text-center space-y-4 cursor-default"
          >
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Select Download Format</h3>
              <p className="text-xs text-gray-500 mt-1">Choose preferred image format for {downloadTargetQr.name}</p>
            </div>
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  executeDownload(downloadTargetQr, "PNG");
                  setDownloadTargetQr(null);
                }}
                className="py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-2xs"
              >
                Download PNG
              </button>
              <button
                type="button"
                onClick={() => {
                  executeDownload(downloadTargetQr, "SVG");
                  setDownloadTargetQr(null);
                }}
                className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs transition-colors shadow-2xs"
              >
                Download SVG
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!deleteId}
        title="Delete QR Code"
        message="Are you sure you want to delete this QR code? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        variant="danger"
      />

      {/* Add / Edit QR Code Form Modal */}
      <QrCodeFormModal
        isOpen={isAddOpen}
        qrItem={editingQr}
        onClose={() => {
          setIsAddOpen(false);
          setEditingQr(null);
        }}
        onSuccess={() => fetchCodes()}
      />
    </PageWrapper>
  );
}
