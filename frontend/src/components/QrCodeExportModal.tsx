import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { qrCodesApi } from "@/api/qrCodes";
import type { ShortUrl } from "@/api/urls";
import Button from "@/components/ui/Button";

const THEME_COLORS = [
  "#1e1b4b", // dark blue
  "#5b21b6", // purple
  "#065f46", // dark green
  "#9f1239", // dark red
  "#0f172a", // black
];

interface QrCodeExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  urlItem: ShortUrl | null;
}

export default function QrCodeExportModal({ isOpen, onClose, urlItem }: QrCodeExportModalProps) {
  const [selectedColor, setSelectedColor] = useState(THEME_COLORS[0]);
  const [previewSvg, setPreviewSvg] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const qrCode = urlItem?.qrCodes?.[0];

  useEffect(() => {
    if (isOpen && qrCode) {
      // Live preview the SVG with the selected color
      const fetchPreview = async () => {
        setIsLoading(true);
        try {
          const res = await qrCodesApi.preview({
            content: qrCode.content,
            format: "SVG",
            size: 512,
            foregroundColor: selectedColor,
            backgroundColor: "#FFFFFF",
            errorCorrectionLevel: "M",
          });
          if (res.data.success && res.data.data) {
            setPreviewSvg(res.data.data.qrData);
          }
        } catch (error) {
          console.error("Preview failed", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchPreview();
    }
  }, [isOpen, qrCode, selectedColor]);

  const handleDownload = async (format: "SVG" | "PNG") => {
    if (!qrCode) return;
    try {
      const response = await qrCodesApi.download(qrCode.id, {
        format,
        color: selectedColor,
        size: 1024,
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data as any]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `qrcode-${urlItem?.alias || urlItem?.shortCode || "export"}.${format.toLowerCase()}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error) {
      console.error(`Download ${format} failed`, error);
    }
  };

  if (!isOpen || !urlItem) return null;

  const shortLinkText = urlItem.client?.company 
    ? `${urlItem.client.company.toLowerCase().replace(/\\s+/g, '')}.l1nk/${urlItem.alias || urlItem.shortCode}`
    : `${window.location.host}/s/${urlItem.alias || urlItem.shortCode}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Download className="w-4 h-4 text-indigo-500" />
            Export QR Code Asset
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 flex flex-col items-center">
          <div className="w-48 h-48 sm:w-64 sm:h-64 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center overflow-hidden mb-3 p-4 shadow-inner relative">
            {isLoading && !previewSvg && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 backdrop-blur-sm">
                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              </div>
            )}
            {previewSvg ? (
              <div 
                className="w-full h-full [&>svg]:w-full [&>svg]:h-full" 
                dangerouslySetInnerHTML={{ __html: previewSvg }} 
              />
            ) : (
              <span className="text-gray-400 text-sm">Generating Preview...</span>
            )}
          </div>
          
          <p className="text-xs font-mono font-medium text-gray-500 mb-6 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
            {shortLinkText}
          </p>

          <div className="w-full mb-6">
            <p className="text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-3">QR Accent Color Theme</p>
            <div className="flex items-center gap-3">
              {THEME_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${selectedColor === color ? 'border-indigo-400 scale-110 shadow-md ring-2 ring-indigo-100' : 'border-transparent hover:scale-105 shadow-sm'}`}
                  style={{ backgroundColor: color }}
                  title={`Color ${color}`}
                />
              ))}
            </div>
          </div>

          <div className="w-full flex flex-col sm:flex-row gap-3">
            <Button
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md border-0 flex items-center justify-center"
              onClick={() => handleDownload("SVG")}
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Download SVG Vector
            </Button>
            <Button
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-md border-0 flex items-center justify-center"
              onClick={() => handleDownload("PNG")}
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Download High-Res PNG
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
