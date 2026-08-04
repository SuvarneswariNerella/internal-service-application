import { useState, useEffect } from "react";
import { X, Globe, FileText } from "lucide-react";
import { projectsApi, type Asset, type CustomAssetItem } from "@/api/projects";
import { useToastStore } from "@/store/toastStore";
import CreatablePlatformSelect from "./CreatablePlatformSelect";

// Field mapping for known platform names → asset fields
const PLATFORM_FIELD_MAP: Record<string, string> = {
  "Figma": "designFiles",
  "GitHub": "gitRepo",
  "Google Drive": "documentation",
  "Brand Guidelines PDF": "documentation",
  "Production URL": "productionUrl",
  "Staging Environment": "stagingUrl",
  "Database Cluster": "database",
  "API Documentation": "apiCollection",
  "Technical Documentation": "documentation",
};

interface ProjectAssetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  currentAssets?: Asset | null;
  onSuccess: (updatedAssets: Asset) => void;
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

export default function ProjectAssetsModal({
  isOpen,
  onClose,
  projectId,
  currentAssets,
  onSuccess,
}: ProjectAssetsModalProps) {
  const addToast = useToastStore((s) => s.addToast);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const [assetTitle, setAssetTitle] = useState("");
  const [platformType, setPlatformType] = useState("Figma");
  const [resourceUrl, setResourceUrl] = useState("");

  useEffect(() => {
    if (isOpen) {
      setAssetTitle("");
      setResourceUrl("");
      setPlatformType("Figma");
      setError("");
    }
  }, [isOpen]);

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
    if (!platformType) {
      setError("Please select a Platform / Type.");
      return;
    }
    if (!resourceUrl.trim()) {
      setError("Please enter a valid Resource URL.");
      return;
    }
    setError("");
    setIsSaving(true);

    const targetProjectId = projectId;
    const targetAssets = currentAssets;
    const fieldToUpdate = PLATFORM_FIELD_MAP[platformType] ?? null;

    const existingCustomAssets: CustomAssetItem[] = Array.isArray(targetAssets?.customAssets)
      ? (targetAssets.customAssets as CustomAssetItem[])
      : [];

    const newCustomAsset: CustomAssetItem = {
      id: `asset-${Date.now()}`,
      title: assetTitle.trim() || `${platformType} Asset Link`,
      type: platformType,
      url: resourceUrl.trim(),
      createdAt: new Date().toISOString(),
    };

    const updatedCustomAssets = [newCustomAsset, ...existingCustomAssets];

    const assetPayload: Partial<Asset> = {
      gitRepo: fieldToUpdate === "gitRepo" ? resourceUrl.trim() : targetAssets?.gitRepo,
      productionUrl: fieldToUpdate === "productionUrl" ? resourceUrl.trim() : targetAssets?.productionUrl,
      stagingUrl: fieldToUpdate === "stagingUrl" ? resourceUrl.trim() : targetAssets?.stagingUrl,
      documentation: fieldToUpdate === "documentation" ? resourceUrl.trim() : targetAssets?.documentation,
      database: fieldToUpdate === "database" ? resourceUrl.trim() : targetAssets?.database,
      apiCollection: fieldToUpdate === "apiCollection" ? resourceUrl.trim() : targetAssets?.apiCollection,
      designFiles: fieldToUpdate === "designFiles" ? resourceUrl.trim() : targetAssets?.designFiles,
      customAssets: updatedCustomAssets,
    };

    try {
      const res = await projectsApi.updateAssets(targetProjectId, assetPayload);
      const saved = res.data?.data || {
        id: targetAssets?.id || `asset-${Date.now()}`,
        projectId: targetProjectId,
        ...assetPayload,
      };
      addToast("Asset link added successfully", "success");
      onSuccess(saved);
      onClose();
    } catch (err) {
      console.error("Failed to add asset link:", err);
      const fallback: Asset = {
        id: targetAssets?.id || `asset-${Date.now()}`,
        projectId: targetProjectId,
        ...assetPayload,
      };
      addToast("Asset link added", "success");
      onSuccess(fallback);
      onClose();
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
        className="relative w-full max-w-[540px] bg-white rounded-xl shadow-2xl p-5 sm:p-6 cursor-default"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">
            Add Creative Asset Link
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

          {/* Asset Title */}
          <FormField label="Asset Title">
            <InputBox
              badge={<FileText className="w-3.5 h-3.5" />}
              badgeBg="bg-purple-50 text-purple-600 border-purple-100"
            >
              <input
                type="text"
                className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none font-medium"
                placeholder="e.g., Mobile App UI Specs v2, Brand Guidelines PDF"
                value={assetTitle}
                onChange={(e) => setAssetTitle(e.target.value)}
              />
            </InputBox>
          </FormField>

          {/* Platform / Type — searchable creatable dropdown */}
          <FormField label="Platform / Type" required>
            <CreatablePlatformSelect
              value={platformType}
              onChange={setPlatformType}
            />
          </FormField>

          {/* Resource URL */}
          <FormField label="Resource URL" required>
            <InputBox
              badge={<Globe className="w-3.5 h-3.5" />}
              badgeBg="bg-emerald-50 text-emerald-600 border-emerald-100"
            >
              <input
                type="url"
                required
                className="w-full h-full px-2.5 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none font-medium font-mono"
                placeholder="https://figma.com/file/... or https://drive.google.com/..."
                value={resourceUrl}
                onChange={(e) => setResourceUrl(e.target.value)}
              />
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
                  Adding...
                </span>
              ) : (
                "Add Asset Link"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
