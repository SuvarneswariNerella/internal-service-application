import { useState, useEffect, useRef } from "react";
import {
  QrCode as QrIcon,
  X,
  Tag,
  ChevronDown,
  User,
  FolderKanban,
  Link as LinkIcon,
  Sparkles,
  Wifi,
  Mail,
  MessageSquare,
  Phone,
  Contact,
  Calendar,
  ShieldAlert,
  Lock,
  Download,
  Loader2,
  FileText,
} from "lucide-react";
import { qrCodesApi, type QrCodeItem } from "@/api/qrCodes";
import { clientsApi, type Client } from "@/api/clients";
import { projectsApi, type Project } from "@/api/projects";
import { urlsApi, type ShortUrl } from "@/api/urls";
import { useToastStore } from "@/store/toastStore";
import { useWorkspaceStore } from "@/store/workspaceStore";

const TYPE_OPTIONS = [
  { value: "URL", label: "URL", icon: LinkIcon },
  { value: "TEXT", label: "Plain Text", icon: FileText },
  { value: "EMAIL", label: "Email", icon: Mail },
  { value: "PHONE", label: "Phone Number", icon: Phone },
  { value: "SMS", label: "SMS", icon: MessageSquare },
  { value: "WIFI", label: "Wi-Fi", icon: Wifi },
  { value: "VCARD", label: "vCard", icon: Contact },
];

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "ARCHIVED", label: "Archived" },
  { value: "EXPIRED", label: "Expired" },
];

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
  disabled = false,
}: {
  badge?: React.ReactNode;
  badgeBg?: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <div
      className={`relative flex items-center h-[38px] w-full bg-white border border-gray-200 rounded-lg transition-all overflow-hidden ${
        disabled
          ? "opacity-60 bg-gray-50 cursor-not-allowed"
          : "focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/15"
      } ${className}`}
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

interface QrCodeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrItem?: QrCodeItem | null;
  onSuccess?: (updatedQr?: QrCodeItem) => void;
}

export default function QrCodeFormModal({
  isOpen,
  onClose,
  qrItem,
  onSuccess,
}: QrCodeFormModalProps) {
  const addToast = useToastStore((s) => s.addToast);
  const { globalWorkspaceId } = useWorkspaceStore();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  // Association datasets
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [shortUrls, setShortUrls] = useState<ShortUrl[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isLoadingUrls, setIsLoadingUrls] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [type, setType] = useState("URL");
  const [clientId, setClientId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [shortUrlId, setShortUrlId] = useState("");
  const [content, setContent] = useState("");
  const [isContentLocked, setIsContentLocked] = useState(false);

  // Type-specific raw content inputs
  const [rawEmail, setRawEmail] = useState({ to: "", subject: "", body: "" });
  const [rawSms, setRawSms] = useState({ phone: "", message: "" });
  const [rawWifi, setRawWifi] = useState({ ssid: "", password: "", encryption: "WPA", hidden: false });
  const [rawVcard, setRawVcard] = useState({ fullName: "", phone: "", email: "", company: "", jobTitle: "" });

  // Config defaults
  const [expiryDate, setExpiryDate] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [tags, setTags] = useState("");

  // Download format selection for live preview
  const [downloadFormat, setDownloadFormat] = useState<"PNG" | "SVG">("PNG");

  // Live preview state
  const [previewQrData, setPreviewQrData] = useState("");
  const [previewEncodedString, setPreviewEncodedString] = useState("");
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const isEdit = !!qrItem;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load initial clients
  useEffect(() => {
    if (isOpen) {
      setIsLoadingClients(true);
      clientsApi
        .list({ 
          pageSize: 1000,
          workspaceId: globalWorkspaceId === "all" ? undefined : globalWorkspaceId
        })
        .then((res) => {
          if (res.data?.data) setClients(res.data.data);
        })
        .catch(console.error)
        .finally(() => setIsLoadingClients(false));
    }
  }, [isOpen]);

  // Fetch projects when clientId changes
  useEffect(() => {
    if (clientId) {
      setIsLoadingProjects(true);
      projectsApi
        .list({ clientId, pageSize: 1000 })
        .then((res) => {
          if (res.data?.data) setProjects(res.data.data);
          else setProjects([]);
        })
        .catch(console.error)
        .finally(() => setIsLoadingProjects(false));
    } else {
      setProjects([]);
      setProjectId("");
    }
  }, [clientId]);

  // Fetch short URLs when clientId or projectId changes
  useEffect(() => {
    if (isOpen) {
      setIsLoadingUrls(true);
      urlsApi
        .list({ clientId: clientId || undefined, projectId: projectId || undefined, pageSize: 1000 })
        .then((res) => {
          if (res.data?.data) setShortUrls(res.data.data);
          else setShortUrls([]);
        })
        .catch(console.error)
        .finally(() => setIsLoadingUrls(false));
    }
  }, [isOpen, clientId, projectId]);

  // Populate or reset form
  useEffect(() => {
    if (isOpen && qrItem) {
      setName(qrItem.name || "");
      setType(qrItem.type || "URL");
      setClientId(qrItem.clientId || qrItem.client?.id || "");
      setProjectId(qrItem.projectId || qrItem.project?.id || "");
      setShortUrlId(qrItem.shortUrlId || qrItem.shortUrl?.id || "");
      setContent(qrItem.content || "");
      setIsContentLocked(!!qrItem.shortUrlId);
      setExpiryDate(qrItem.expiryDate?.split("T")[0] ?? "");
      setStatus(qrItem.status || "ACTIVE");
      setTags(qrItem.tags || "");

      // Raw content parse
      const raw = qrItem.rawContent || {};
      setRawEmail({ to: raw.to || "", subject: raw.subject || "", body: raw.body || "" });
      setRawSms({ phone: raw.phone || "", message: raw.message || "" });
      setRawWifi({
        ssid: raw.ssid || "",
        password: raw.password || "",
        encryption: raw.encryption || "WPA",
        hidden: !!raw.hidden,
      });
      setRawVcard({
        fullName: raw.fullName || "",
        phone: raw.phone || "",
        email: raw.email || "",
        company: raw.company || "",
        jobTitle: raw.jobTitle || "",
      });
    } else if (isOpen && !qrItem) {
      setName("");
      setType("URL");
      setClientId("");
      setProjectId("");
      setShortUrlId("");
      setContent("");
      setIsContentLocked(false);
      setRawEmail({ to: "", subject: "", body: "" });
      setRawSms({ phone: "", message: "" });
      setRawWifi({ ssid: "", password: "", encryption: "WPA", hidden: false });
      setRawVcard({ fullName: "", phone: "", email: "", company: "", jobTitle: "" });
      setExpiryDate("");
      setStatus("ACTIVE");
      setTags("");
    }
  }, [qrItem, isOpen]);

  // Linked Short URL selection handler
  const handleShortUrlSelect = (selectedId: string) => {
    setShortUrlId(selectedId);
    if (selectedId) {
      const selected = shortUrls.find((u) => u.id === selectedId);
      if (selected) {
        const domainHost = selected.domain?.domain ? `http://${selected.domain.domain}` : window.location.origin;
        const fullShortUrl = `${domainHost}/s/${selected.shortCode}`;
        setContent(fullShortUrl);
        setIsContentLocked(true);
        if (type !== "URL") setType("URL");
      }
    } else {
      setIsContentLocked(false);
    }
  };

  // Helper to extract structured rawContent payload
  const getRawContentPayload = () => {
    switch (type) {
      case "EMAIL": return rawEmail;
      case "SMS": return rawSms;
      case "WIFI": return rawWifi;
      case "VCARD": return rawVcard;
      case "PHONE": return { phone: content };
      case "URL": return { url: content };
      case "TEXT": return { text: content };
      default: return null;
    }
  };

  // Live Debounced Preview generator
  useEffect(() => {
    if (!isOpen) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    setIsPreviewLoading(true);

    timerRef.current = setTimeout(async () => {
      try {
        const payload = {
          type,
          content,
          rawContent: getRawContentPayload(),
          format: downloadFormat,
          size: 256,
          foregroundColor: "#000000",
          backgroundColor: "#FFFFFF",
          errorCorrectionLevel: "M",
        };

        const res = await qrCodesApi.preview(payload as any);
        if (res.data?.success && res.data.data) {
          setPreviewQrData(res.data.data.qrData);
          setPreviewEncodedString(res.data.data.encodedString);
        }
      } catch (err) {
        console.error("Live preview error:", err);
      } finally {
        setIsPreviewLoading(false);
      }
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [
    isOpen,
    type,
    content,
    rawEmail,
    rawSms,
    rawWifi,
    rawVcard,
    downloadFormat,
  ]);

  // ESC key listener
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      setError("Please enter a name for the QR code.");
      return;
    }
    setError("");
    setIsSaving(true);

    try {
      const payload: any = {
        name,
        type,
        content,
        rawContent: getRawContentPayload(),
        clientId: clientId || null,
        projectId: projectId || null,
        shortUrlId: shortUrlId || null,
        format: downloadFormat,
        size: 256,
        foregroundColor: "#000000",
        backgroundColor: "#FFFFFF",
        errorCorrectionLevel: "M",
        expiryDate: expiryDate ? new Date(expiryDate).toISOString() : null,
        status,
        tags: tags || null,
        workspaceId: globalWorkspaceId === "all" ? undefined : globalWorkspaceId,
        saveToLibrary: true,
      };

      if (isEdit && qrItem?.id) {
        const res = await qrCodesApi.update(qrItem.id, payload);
        if (res.data?.success && res.data.data) {
          addToast("QR code updated successfully", "success");
          onSuccess?.(res.data.data);
          onClose();
        }
      } else {
        const res = await qrCodesApi.create(payload);
        if (res.data?.success && res.data.data) {
          addToast("QR code created successfully", "success");
          onSuccess?.(res.data.data);
          onClose();
        }
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        `Failed to ${isEdit ? "update" : "create"} QR code`;
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPreview = (fmt: "PNG" | "SVG") => {
    if (!previewQrData) return;
    const link = document.createElement("a");
    if (fmt === "PNG") {
      if (previewQrData.startsWith("data:image/png")) {
        link.href = previewQrData;
      } else {
        // Convert SVG data to PNG canvas download
        const svgBlob = new Blob([previewQrData], { type: "image/svg+xml;charset=utf-8" });
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
            link.download = `${name || "qr-code"}.png`;
            link.click();
            URL.revokeObjectURL(url);
            addToast("QR code downloaded as PNG", "success");
          }
        };
        img.src = url;
        return;
      }
      link.download = `${name || "qr-code"}.png`;
    } else {
      const blob = new Blob([previewQrData], { type: "image/svg+xml" });
      link.href = URL.createObjectURL(blob);
      link.download = `${name || "qr-code"}.svg`;
    }
    link.click();
    addToast(`QR preview downloaded as ${fmt}`, "success");
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
        className="relative w-full max-w-[880px] bg-white rounded-xl shadow-2xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] cursor-default"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <QrIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">
                {isEdit ? "Edit QR Code" : "Generate Dynamic QR Code"}
              </h2>
              <p className="text-xs text-gray-500">Configure parameters and instantly preview your dynamic QR code</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 px-3 py-2 rounded-lg border text-xs bg-red-50 border-red-200 text-red-600 font-medium">
            {error}
          </div>
        )}

        {/* Main Grid: Form Left, Preview Right */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Form Controls (7 cols) */}
          <div className="lg:col-span-7 space-y-3.5">
            {/* Name & Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="QR Name" required>
                <InputBox badge={<QrIcon className="w-3.5 h-3.5" />} badgeBg="bg-blue-50 text-blue-600 border-blue-100">
                  <input
                    type="text"
                    className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none font-medium"
                    placeholder="e.g. Wifi portal"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </InputBox>
              </FormField>

              <FormField label="QR Type" required>
                <InputBox badge={<Tag className="w-3.5 h-3.5" />} badgeBg="bg-purple-50 text-purple-600 border-purple-100">
                  <select
                    className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 appearance-none focus:outline-none cursor-pointer font-medium"
                    value={type}
                    onChange={(e) => {
                      setType(e.target.value);
                      if (isContentLocked && e.target.value !== "URL") {
                        setIsContentLocked(false);
                        setShortUrlId("");
                      }
                    }}
                  >
                    {TYPE_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value} className="text-gray-900">{t.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 mr-2.5 shrink-0 pointer-events-none" />
                </InputBox>
              </FormField>
            </div>

            {/* Association Fields: Client & Project */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Client (Optional)">
                <InputBox badge={<User className="w-3.5 h-3.5" />} badgeBg="bg-amber-50 text-amber-600 border-amber-100">
                  <select
                    className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 appearance-none focus:outline-none cursor-pointer font-medium"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                  >
                    <option value="">{isLoadingClients ? "Loading clients..." : "No Client (Internal System)"}</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id} className="text-gray-900">{c.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 mr-2.5 shrink-0 pointer-events-none" />
                </InputBox>
              </FormField>

              <FormField label="Project (Optional)">
                <InputBox
                  badge={<FolderKanban className="w-3.5 h-3.5" />}
                  badgeBg="bg-indigo-50 text-indigo-600 border-indigo-100"
                  disabled={!clientId || isLoadingProjects}
                >
                  <select
                    className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 appearance-none focus:outline-none cursor-pointer font-medium disabled:opacity-50"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    disabled={!clientId || isLoadingProjects}
                  >
                    <option value="">
                      {!clientId
                        ? "Select Client first"
                        : isLoadingProjects
                        ? "Loading..."
                        : projects.length === 0
                        ? "No projects found"
                        : "No Project (Client Direct)"}
                    </option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id} className="text-gray-900">{p.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 mr-2.5 shrink-0 pointer-events-none" />
                </InputBox>
              </FormField>
            </div>

            {/* Linked Short URL */}
            <FormField label="Linked Short URL (Optional)">
              <InputBox badge={<LinkIcon className="w-3.5 h-3.5" />} badgeBg="bg-sky-50 text-sky-600 border-sky-100">
                <select
                  className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 appearance-none focus:outline-none cursor-pointer font-medium"
                  value={shortUrlId}
                  onChange={(e) => handleShortUrlSelect(e.target.value)}
                >
                  <option value="">{isLoadingUrls ? "Loading short URLs..." : "None (Custom QR Content)"}</option>
                  {shortUrls.map((u) => (
                    <option key={u.id} value={u.id} className="text-gray-900">
                      /s/{u.shortCode} {u.alias ? `(${u.alias})` : ""} — {u.originalUrl}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 mr-2.5 shrink-0 pointer-events-none" />
              </InputBox>
            </FormField>

            {/* Dynamic Type Content Section */}
            <div className="bg-gray-50/70 p-3.5 rounded-xl border border-gray-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  {type} Dynamic Content
                </span>
                {isContentLocked && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    <Lock className="w-3 h-3" /> Auto-filled from Short URL
                  </span>
                )}
              </div>

              {/* Single Input: URL / TEXT / PHONE */}
              {(type === "URL" || type === "TEXT" || type === "PHONE") && (
                <FormField label={type === "URL" ? "URL Destination" : type === "PHONE" ? "Phone Number" : "Text Content"}>
                  <InputBox disabled={isContentLocked}>
                    <input
                      type={type === "URL" ? "url" : type === "PHONE" ? "tel" : "text"}
                      className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none font-medium"
                      placeholder={
                        type === "URL"
                          ? "https://example.com"
                          : type === "PHONE"
                          ? "+1 (555) 000-0000"
                          : "Enter plain text content..."
                      }
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      readOnly={isContentLocked}
                    />
                  </InputBox>
                </FormField>
              )}

              {/* Email Form */}
              {type === "EMAIL" && (
                <div className="space-y-2.5">
                  <FormField label="Recipient Email (To)" required>
                    <InputBox>
                      <input
                        type="email"
                        className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none font-medium"
                        placeholder="recipient@example.com"
                        value={rawEmail.to}
                        onChange={(e) => setRawEmail({ ...rawEmail, to: e.target.value })}
                      />
                    </InputBox>
                  </FormField>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <FormField label="Subject">
                      <InputBox>
                        <input
                          type="text"
                          className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 focus:outline-none font-medium"
                          placeholder="Email subject..."
                          value={rawEmail.subject}
                          onChange={(e) => setRawEmail({ ...rawEmail, subject: e.target.value })}
                        />
                      </InputBox>
                    </FormField>
                    <FormField label="Body">
                      <InputBox>
                        <input
                          type="text"
                          className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 focus:outline-none font-medium"
                          placeholder="Email body text..."
                          value={rawEmail.body}
                          onChange={(e) => setRawEmail({ ...rawEmail, body: e.target.value })}
                        />
                      </InputBox>
                    </FormField>
                  </div>
                </div>
              )}

              {/* SMS Form */}
              {type === "SMS" && (
                <div className="space-y-2.5">
                  <FormField label="Phone Number" required>
                    <InputBox>
                      <input
                        type="tel"
                        className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none font-medium"
                        placeholder="+1 (555) 000-0000"
                        value={rawSms.phone}
                        onChange={(e) => setRawSms({ ...rawSms, phone: e.target.value })}
                      />
                    </InputBox>
                  </FormField>
                  <FormField label="Message">
                    <InputBox>
                      <input
                        type="text"
                        className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 focus:outline-none font-medium"
                        placeholder="SMS pre-filled message..."
                        value={rawSms.message}
                        onChange={(e) => setRawSms({ ...rawSms, message: e.target.value })}
                      />
                    </InputBox>
                  </FormField>
                </div>
              )}

              {/* WiFi Form */}
              {type === "WIFI" && (
                <div className="space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <FormField label="Network SSID" required>
                      <InputBox>
                        <input
                          type="text"
                          className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none font-medium"
                          placeholder="MyNetworkName"
                          value={rawWifi.ssid}
                          onChange={(e) => setRawWifi({ ...rawWifi, ssid: e.target.value })}
                        />
                      </InputBox>
                    </FormField>

                    <FormField label="Encryption Type">
                      <InputBox>
                        <select
                          className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 appearance-none focus:outline-none cursor-pointer font-medium"
                          value={rawWifi.encryption}
                          onChange={(e) => setRawWifi({ ...rawWifi, encryption: e.target.value })}
                        >
                          <option value="WPA">WPA / WPA2 / WPA3</option>
                          <option value="WEP">WEP</option>
                          <option value="None">None (Open Network)</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-gray-400 mr-2.5 shrink-0 pointer-events-none" />
                      </InputBox>
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-center">
                    <FormField label="Network Password">
                      <InputBox>
                        <input
                          type="password"
                          className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 focus:outline-none font-medium"
                          placeholder="Wifi password..."
                          value={rawWifi.password}
                          onChange={(e) => setRawWifi({ ...rawWifi, password: e.target.value })}
                        />
                      </InputBox>
                    </FormField>

                    <div className="pt-4 flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="wifiHidden"
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        checked={rawWifi.hidden}
                        onChange={(e) => setRawWifi({ ...rawWifi, hidden: e.target.checked })}
                      />
                      <label htmlFor="wifiHidden" className="text-xs font-semibold text-gray-700 cursor-pointer select-none">
                        Hidden Network
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* vCard Form */}
              {type === "VCARD" && (
                <div className="space-y-2.5">
                  <FormField label="Full Name" required>
                    <InputBox>
                      <input
                        type="text"
                        className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none font-medium"
                        placeholder="John Doe"
                        value={rawVcard.fullName}
                        onChange={(e) => setRawVcard({ ...rawVcard, fullName: e.target.value })}
                      />
                    </InputBox>
                  </FormField>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <FormField label="Phone">
                      <InputBox>
                        <input
                          type="tel"
                          className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 focus:outline-none font-medium"
                          placeholder="+1 (555) 000-0000"
                          value={rawVcard.phone}
                          onChange={(e) => setRawVcard({ ...rawVcard, phone: e.target.value })}
                        />
                      </InputBox>
                    </FormField>

                    <FormField label="Email">
                      <InputBox>
                        <input
                          type="email"
                          className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 focus:outline-none font-medium"
                          placeholder="john@example.com"
                          value={rawVcard.email}
                          onChange={(e) => setRawVcard({ ...rawVcard, email: e.target.value })}
                        />
                      </InputBox>
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <FormField label="Company">
                      <InputBox>
                        <input
                          type="text"
                          className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 focus:outline-none font-medium"
                          placeholder="Acme Corp"
                          value={rawVcard.company}
                          onChange={(e) => setRawVcard({ ...rawVcard, company: e.target.value })}
                        />
                      </InputBox>
                    </FormField>

                    <FormField label="Job Title">
                      <InputBox>
                        <input
                          type="text"
                          className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 focus:outline-none font-medium"
                          placeholder="Software Engineer"
                          value={rawVcard.jobTitle}
                          onChange={(e) => setRawVcard({ ...rawVcard, jobTitle: e.target.value })}
                        />
                      </InputBox>
                    </FormField>
                  </div>
                </div>
              )}
            </div>

            {/* Status & Expiry Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Status">
                <InputBox badge={<ShieldAlert className="w-3.5 h-3.5" />} badgeBg="bg-emerald-50 text-emerald-600 border-emerald-100">
                  <select
                    className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 appearance-none focus:outline-none cursor-pointer font-medium"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    {STATUS_OPTIONS.map((st) => (
                      <option key={st.value} value={st.value}>{st.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 mr-2.5 shrink-0 pointer-events-none" />
                </InputBox>
              </FormField>

              <FormField label="Expiry Date (Optional)">
                <InputBox badge={<Calendar className="w-3.5 h-3.5" />} badgeBg="bg-amber-50 text-amber-600 border-amber-100">
                  <input
                    type="date"
                    className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 focus:outline-none font-medium"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                  />
                </InputBox>
              </FormField>
            </div>

            {/* Tags */}
            <FormField label="Tags (Comma separated)">
              <InputBox badge={<Tag className="w-3.5 h-3.5" />} badgeBg="bg-gray-100 text-gray-600 border-gray-200">
                <input
                  type="text"
                  className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none font-medium"
                  placeholder="e.g. promo, client-deliverable, wifi"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </InputBox>
            </FormField>
          </div>

          {/* Right Column: Live Interactive QR Preview Panel (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-between bg-slate-50 border border-slate-200/80 rounded-xl p-5 relative min-h-[360px]">
            <div className="w-full flex items-center justify-between border-b border-slate-200 pb-3 mb-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" /> Live QR Preview
              </span>
              <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded">
                Debounced ~300ms
              </span>
            </div>

            {/* Preview Canvas Box */}
            <div className="flex-1 flex flex-col items-center justify-center w-full my-2">
              <div className="relative bg-white p-4 rounded-xl border border-slate-200 shadow-md flex items-center justify-center min-w-[200px] min-h-[200px]">
                {isPreviewLoading && (
                  <div className="absolute inset-0 bg-white/75 backdrop-blur-[1px] flex flex-col items-center justify-center z-10 rounded-xl">
                    <Loader2 className="w-6 h-6 text-blue-600 animate-spin mb-1" />
                    <span className="text-[11px] font-semibold text-slate-600">Rendering...</span>
                  </div>
                )}

                {previewQrData ? (
                  <div
                    className="w-48 h-48 flex items-center justify-center overflow-hidden"
                    dangerouslySetInnerHTML={{
                      __html: previewQrData.startsWith("data:")
                        ? `<img src="${previewQrData}" alt="QR Code Preview" class="w-full h-full object-contain" />`
                        : previewQrData,
                    }}
                  />
                ) : (
                  <div className="text-center p-4">
                    <QrIcon className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-400 font-medium">Enter details to render preview</p>
                  </div>
                )}
              </div>

              {/* Raw Encoded Payload Output */}
              <div className="w-full mt-3 p-2.5 rounded-lg bg-slate-100 border border-slate-200 text-left">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Encoded String</p>
                <p className="text-[11px] font-mono text-slate-700 break-all leading-tight max-h-16 overflow-y-auto">
                  {previewEncodedString || content || "—"}
                </p>
              </div>
            </div>

            {/* Download Format Selector & Action */}
            <div className="w-full pt-3 border-t border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-slate-700">
                <span>Download Format:</span>
                <div className="flex gap-1 bg-slate-200/80 p-0.5 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setDownloadFormat("PNG")}
                    className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-md transition-colors ${
                      downloadFormat === "PNG" ? "bg-white text-blue-600 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    PNG
                  </button>
                  <button
                    type="button"
                    onClick={() => setDownloadFormat("SVG")}
                    className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-md transition-colors ${
                      downloadFormat === "SVG" ? "bg-white text-blue-600 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    SVG
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadPreview("PNG")}
                  disabled={!previewQrData}
                  className="flex-1 h-8 rounded-lg text-[11px] font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition-colors flex items-center justify-center gap-1 shadow-2xs disabled:opacity-50"
                >
                  <Download className="w-3 h-3 text-slate-600" />
                  PNG
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadPreview("SVG")}
                  disabled={!previewQrData}
                  className="flex-1 h-8 rounded-lg text-[11px] font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition-colors flex items-center justify-center gap-1 shadow-2xs disabled:opacity-50"
                >
                  <Download className="w-3 h-3 text-slate-600" />
                  SVG
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons Footer */}
          <div className="lg:col-span-12 flex items-center justify-end gap-2.5 pt-3.5 border-t border-gray-100 mt-2">
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
              className="h-9 px-5 rounded-lg text-xs font-semibold text-white bg-[#0052FF] hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-60 flex items-center gap-1.5"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{isEdit ? "Saving..." : "Generating..."}</span>
                </>
              ) : isEdit ? (
                "Update QR Code"
              ) : (
                "Generate QR Code"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
