import { useState, useEffect, useRef, useCallback } from "react";
import { Check, ChevronDown, Search, Plus, Loader2 } from "lucide-react";
import { platformsApi, type AssetPlatform } from "@/api/platforms";

interface CreatablePlatformSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function CreatablePlatformSelect({
  value,
  onChange,
  disabled = false,
}: CreatablePlatformSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [platforms, setPlatforms] = useState<AssetPlatform[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Load platforms from API
  const loadPlatforms = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await platformsApi.list();
      const list = res.data?.data ?? [];
      setPlatforms(list.sort((a, b) => a.name.localeCompare(b.name)));
    } catch {
      // fallback: keep existing list
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlatforms();
  }, [loadPlatforms]);

  // Close on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        setSearch("");
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Focus search when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filteredPlatforms = platforms.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const searchTrimmed = search.trim();
  const exactMatch = platforms.some(
    (p) => p.name.toLowerCase() === searchTrimmed.toLowerCase()
  );
  const showCreateOption = searchTrimmed.length > 0 && !exactMatch;

  const handleSelect = (name: string) => {
    onChange(name);
    setIsOpen(false);
    setSearch("");
  };

  const handleCreate = async () => {
    if (!searchTrimmed || isCreating) return;
    setIsCreating(true);
    try {
      const res = await platformsApi.create(searchTrimmed);
      const created = res.data?.data;
      if (created) {
        setPlatforms((prev) =>
          [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
        );
        onChange(created.name);
      } else {
        // 409 returns existing in data field — handle gracefully
        onChange(searchTrimmed);
      }
    } catch (err: any) {
      // If duplicate, just select the typed value
      onChange(searchTrimmed);
    } finally {
      setIsCreating(false);
      setIsOpen(false);
      setSearch("");
    }
  };

  const selectedLabel = value || "Select platform...";

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`
          relative flex items-center h-[38px] w-full bg-white border rounded-lg px-0 overflow-hidden transition-all
          ${isOpen
            ? "border-blue-500 ring-2 ring-blue-500/15"
            : "border-gray-200 hover:border-gray-300"
          }
          ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
        `}
      >
        {/* Badge */}
        <div className="h-full px-2.5 flex items-center justify-center shrink-0 border-r bg-indigo-50 text-indigo-600 border-indigo-100">
          <Search className="w-3.5 h-3.5" />
        </div>
        <span className={`flex-1 pl-2.5 text-xs font-medium text-left truncate ${value ? "text-gray-900" : "text-gray-400"}`}>
          {selectedLabel}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-gray-400 mr-2.5 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown */}
      <div
        className={`
          absolute z-50 left-0 right-0 top-[calc(100%+4px)]
          bg-white border border-gray-200 rounded-xl shadow-xl
          overflow-hidden
          transition-all duration-200 origin-top
          ${isOpen ? "opacity-100 scale-y-100 pointer-events-auto" : "opacity-0 scale-y-95 pointer-events-none"}
        `}
        style={{ transformOrigin: "top" }}
      >
        {/* Search input */}
        <div className="p-2 border-b border-gray-100">
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-400/15 transition-all">
            <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search or create platform..."
              className="flex-1 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none font-medium"
            />
            {isLoading && <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin shrink-0" />}
          </div>
        </div>

        {/* Options list */}
        <div className="max-h-48 overflow-y-auto py-1">
          {filteredPlatforms.length === 0 && !showCreateOption && (
            <div className="px-3 py-4 text-center text-xs text-gray-400 font-medium">
              No platforms found
            </div>
          )}

          {filteredPlatforms.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSelect(p.name)}
              className={`
                w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-left
                transition-colors hover:bg-indigo-50 hover:text-indigo-700
                ${value === p.name ? "bg-indigo-50/60 text-indigo-700" : "text-gray-700"}
              `}
            >
              <span>{p.name}</span>
              {value === p.name && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
            </button>
          ))}

          {/* Create new option */}
          {showCreateOption && (
            <>
              {filteredPlatforms.length > 0 && (
                <div className="mx-2 my-1 border-t border-gray-100" />
              )}
              <button
                type="button"
                onClick={handleCreate}
                disabled={isCreating}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold text-left text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-60"
              >
                {isCreating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                ) : (
                  <Plus className="w-3.5 h-3.5 shrink-0" />
                )}
                <span>
                  {isCreating ? "Adding..." : <>Add <span className="font-bold">"{searchTrimmed}"</span></>}
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
