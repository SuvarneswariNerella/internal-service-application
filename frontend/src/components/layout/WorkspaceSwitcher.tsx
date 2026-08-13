import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, Search, Building2, Settings, Check, Plus, Layers } from "lucide-react";
import { cn } from "@/utils/cn";
import { useNavigate } from "react-router-dom";
import { useWorkspaceStore } from "@/store/workspaceStore";

export default function WorkspaceSwitcher() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { 
    globalWorkspaceId: activeWorkspaceId, 
    setGlobalWorkspaceId: setActiveWorkspaceId,
    workspaces,
    fetchWorkspaces
  } = useWorkspaceStore();

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  useEffect(() => {
    if (isOpen) {
      fetchWorkspaces();
    }
  }, [isOpen, fetchWorkspaces]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  const filteredWorkspaces = workspaces.filter(
    (w) =>
      w.displayName.toLowerCase().includes(search.toLowerCase()) ||
      w.shortCode.toLowerCase().includes(search.toLowerCase()) ||
      (w.gstin && w.gstin.toLowerCase().includes(search.toLowerCase()))
  );

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);
  const isAllWorkspaces = activeWorkspaceId === "all";

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors"
      >
        {isAllWorkspaces || !activeWorkspace ? (
          <div className="w-8 h-8 rounded bg-gradient-to-br from-fuchsia-600 to-purple-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <Layers className="w-4 h-4" />
          </div>
        ) : (
          <img src={activeWorkspace.logoUrl || "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=100&h=100&fit=crop"} alt="Workspace" className="w-8 h-8 rounded object-cover" />
        )}
        <div className="flex flex-col items-start text-left">
          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
            {isAllWorkspaces ? "All Workspaces" : activeWorkspace?.shortCode ? `${activeWorkspace.shortCode} Workspace` : "Select Workspace"}
          </span>
          <span className="text-sm font-bold text-gray-900 leading-tight">
            {isAllWorkspaces ? "Global View" : activeWorkspace?.displayName || "Loading..."}
          </span>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-gray-500 ml-2" /> : <ChevronDown className="w-4 h-4 text-gray-500 ml-2" />}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-[340px] bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-200 z-50 overflow-hidden flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="p-3 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-900 font-bold text-sm">
                <Building2 className="w-4 h-4 text-indigo-600" />
                Company Workspaces
              </div>
              <button className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors">
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="px-3 py-2.5 flex-shrink-0">
            <div className="relative flex items-center">
              <Search className="absolute left-2.5 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search company, code, GSTIN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          <div className="overflow-y-auto flex-1 custom-scrollbar">

            {/* Workspaces List */}
            <div className="px-3 py-1.5">
              <div className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-2">
                Workspaces
              </div>
              <div className="space-y-0.5 pb-3">
                <button
                  onClick={() => { setActiveWorkspaceId("all"); setIsOpen(false); }}
                  className={cn(
                    "w-full flex items-center gap-2.5 p-2 rounded-xl transition-colors text-left group mb-1",
                    isAllWorkspaces ? "bg-indigo-50/50 border border-indigo-100" : "hover:bg-gray-50 border border-transparent"
                  )}
                >
                  <div className="w-8 h-8 rounded bg-gradient-to-br from-fuchsia-600 to-purple-600 flex items-center justify-center text-white shadow-sm shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-xs truncate">All Workspaces</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold border uppercase shrink-0 bg-gray-50 text-gray-600 border-gray-200">
                        ALL
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-0.5 truncate">
                      Global View Across Companies
                    </p>
                  </div>
                  {isAllWorkspaces && <Check className="w-3.5 h-3.5 text-indigo-600 mr-1 shrink-0" />}
                </button>
                {filteredWorkspaces.map((w) => {
                  const isActive = w.id === activeWorkspaceId;
                  const badgeColor = w.shortCode === 'EDN' ? "bg-blue-50 text-blue-600 border-blue-200" : w.shortCode === 'BFC' ? "bg-red-50 text-red-600 border-red-200" : w.shortCode === 'VWM' ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-purple-50 text-purple-600 border-purple-200";
                  return (
                    <button
                      key={w.id}
                      onClick={() => { setActiveWorkspaceId(w.id); setIsOpen(false); }}
                      className={cn(
                        "w-full flex items-center gap-2.5 p-2 rounded-xl transition-colors text-left group",
                        isActive ? "bg-indigo-50/50 border border-indigo-100" : "hover:bg-gray-50 border border-transparent"
                      )}
                    >
                      <img src={w.logoUrl || "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=100&h=100&fit=crop"} alt={w.displayName} className="w-8 h-8 rounded object-cover shadow-sm shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 text-xs truncate">{w.displayName}</span>
                          <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-semibold border uppercase shrink-0", badgeColor)}>
                            {w.shortCode}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-0.5 truncate">
                          {w.activeClients} Clients • GST: {w.gstin}
                        </p>
                      </div>
                      {isActive && <Check className="w-3.5 h-3.5 text-indigo-600 mr-1 shrink-0" />}
                    </button>
                  );
                })}
                {filteredWorkspaces.length === 0 && (
                  <div className="p-4 text-center text-sm text-gray-500">No workspaces found.</div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Action */}
          <div className="p-3 border-t border-gray-100 bg-white flex-shrink-0">
            <button onClick={() => { setIsOpen(false); navigate("/settings"); }} className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-bold transition-colors">
              <Plus className="w-3.5 h-3.5" />
              Manage / Add Workspace
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
