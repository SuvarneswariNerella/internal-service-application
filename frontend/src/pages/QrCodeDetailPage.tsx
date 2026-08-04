import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Trash2, Edit, Building2, FolderKanban, Link as LinkIcon } from "lucide-react";
import PageWrapper from "@/components/ui/PageWrapper";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import StatusPill from "@/components/ui/StatusPill";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";
import QrCodeFormModal from "@/components/QrCodeFormModal";
import { useToastStore } from "@/store/toastStore";
import { qrCodesApi, type QrCodeItem } from "@/api/qrCodes";

export default function QrCodeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);
  const [qr, setQr] = useState<QrCodeItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const fetchQr = async () => {
    try {
      const res = await qrCodesApi.getById(id!);
      if (res.data?.data) {
        setQr(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchQr();
  }, [id]);

  const handleDownload = (requestedFormat: "PNG" | "SVG") => {
    if (!qr?.qrData) return;
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

  const handleDelete = async () => {
    try {
      await qrCodesApi.delete(id!);
      addToast("QR code deleted successfully", "success");
      navigate("/qr-codes");
    } catch (err) {
      addToast("Failed to delete QR code", "error");
    }
  };

  if (isLoading) {
    return (
      <PageWrapper>
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-64 w-full" />
      </PageWrapper>
    );
  }

  if (!qr) {
    return (
      <PageWrapper>
        <div className="mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/qr-codes")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to QR Codes
          </Button>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500 font-medium">QR Code not found.</p>
          </CardContent>
        </Card>
      </PageWrapper>
    );
  }

  const bgColor = qr.backgroundColor || (qr as any).background || "#FFFFFF";

  return (
    <PageWrapper>
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate("/qr-codes")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to QR Codes
        </Button>

        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setIsEditOpen(true)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button size="sm" onClick={() => handleDownload("PNG")}>
            <Download className="w-4 h-4 mr-1.5" />
            Download PNG
          </Button>
          <Button size="sm" onClick={() => handleDownload("SVG")}>
            <Download className="w-4 h-4 mr-1.5" />
            Download SVG
          </Button>
          <Button variant="danger" size="sm" onClick={() => setShowDeleteConfirm(true)}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <PageHeader title={qr.name} description={`Type: ${qr.type} • Status: ${qr.status || "ACTIVE"}`} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Preview Card */}
        <Card className="lg:col-span-5">
          <CardHeader>
            <h3 className="font-bold text-gray-900 text-sm">QR Code Preview</h3>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div
              className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm mb-4 flex items-center justify-center min-w-[220px] min-h-[220px]"
              style={{ backgroundColor: bgColor }}
              dangerouslySetInnerHTML={{
                __html: qr.qrData?.startsWith("data:")
                  ? `<img src="${qr.qrData}" alt="${qr.name}" style="max-width:240px; width:100%" />`
                  : qr.qrData || "",
              }}
            />
            <p className="text-xs text-gray-500 font-mono text-center break-all max-w-sm bg-gray-50 p-2 rounded-lg border">
              {qr.content}
            </p>
          </CardContent>
        </Card>

        {/* Details Card */}
        <Card className="lg:col-span-7">
          <CardHeader>
            <h3 className="font-bold text-gray-900 text-sm">QR Parameters & Associations</h3>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 font-semibold uppercase tracking-wider text-[10px] mb-1">Name</p>
                <p className="text-sm font-semibold text-gray-900">{qr.name}</p>
              </div>
              <div>
                <p className="text-gray-400 font-semibold uppercase tracking-wider text-[10px] mb-1">Type</p>
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-semibold border border-purple-100">
                  {qr.type}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 font-semibold uppercase tracking-wider text-[10px] mb-1">Client Association</p>
                {qr.client ? (
                  <span className="inline-flex items-center gap-1.5 font-semibold text-indigo-600">
                    <Building2 className="w-3.5 h-3.5" />
                    {qr.client.name} {qr.client.company ? `(${qr.client.company})` : ""}
                  </span>
                ) : (
                  <span className="text-gray-400">Internal System</span>
                )}
              </div>
              <div>
                <p className="text-gray-400 font-semibold uppercase tracking-wider text-[10px] mb-1">Project Association</p>
                {qr.project ? (
                  <span className="inline-flex items-center gap-1.5 font-semibold text-gray-700">
                    <FolderKanban className="w-3.5 h-3.5 text-gray-500" />
                    {qr.project.name}
                  </span>
                ) : (
                  <span className="text-gray-400">None</span>
                )}
              </div>
            </div>

            {qr.shortUrl && (
              <div>
                <p className="text-gray-400 font-semibold uppercase tracking-wider text-[10px] mb-1">Linked Short URL</p>
                <span className="inline-flex items-center gap-1.5 font-mono text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                  <LinkIcon className="w-3.5 h-3.5" />
                  /s/{qr.shortUrl.shortCode} <span className="text-gray-400">({qr.shortUrl.originalUrl})</span>
                </span>
              </div>
            )}

            <div>
              <p className="text-gray-400 font-semibold uppercase tracking-wider text-[10px] mb-1">Status</p>
              <StatusPill status={qr.status || "ACTIVE"} />
            </div>

            {qr.tags && (
              <div>
                <p className="text-gray-400 font-semibold uppercase tracking-wider text-[10px] mb-1">Tags</p>
                <div className="flex gap-1.5 flex-wrap">
                  {qr.tags.split(",").map((t, i) => (
                    <span key={i} className="bg-gray-100 text-gray-700 text-[11px] font-semibold px-2 py-0.5 rounded-md border border-gray-200">
                      #{t.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {qr.rawContent && Object.keys(qr.rawContent).length > 0 && (
              <div>
                <p className="text-gray-400 font-semibold uppercase tracking-wider text-[10px] mb-1">Raw Structured Inputs</p>
                <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg text-[11px] font-mono overflow-x-auto">
                  {JSON.stringify(qr.rawContent, null, 2)}
                </pre>
              </div>
            )}

            <div className="pt-2 border-t border-gray-100 grid grid-cols-2 gap-4 text-gray-500">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider">Created At</p>
                <p className="font-medium">{new Date(qr.createdAt).toLocaleString()}</p>
              </div>
              {qr.updatedAt && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider">Last Updated</p>
                  <p className="font-medium">{new Date(qr.updatedAt).toLocaleString()}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        title="Delete QR Code"
        message="Are you sure you want to delete this QR code? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        variant="danger"
      />

      <QrCodeFormModal
        isOpen={isEditOpen}
        qrItem={qr}
        onClose={() => setIsEditOpen(false)}
        onSuccess={(updated) => {
          if (updated) setQr(updated);
          else fetchQr();
        }}
      />
    </PageWrapper>
  );
}
