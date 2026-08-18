import { Building2, ChevronRight, Shield, User, Plus, SlidersHorizontal, Settings2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import AddWorkspaceModal from "@/components/AddWorkspaceModal";
import GeneralSettingsView from "@/components/settings/GeneralSettingsView";
import SecuritySettingsView from "@/components/settings/SecuritySettingsView";
import { cn } from "@/utils/cn";
import { workspacesApi } from "@/api/workspaces";
import { useWorkspaceStore } from "@/store/workspaceStore";

export default function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as 'workspaces' | 'general' | 'security' | null;

  const [isAddWorkspaceModalOpen, setIsAddWorkspaceModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [activeTab, setActiveTab] = useState<'workspaces' | 'general' | 'security'>(
    tabFromUrl && ['workspaces', 'general', 'security'].includes(tabFromUrl) ? tabFromUrl : 'workspaces'
  );
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingWorkspace, setEditingWorkspace] = useState<any>(null);
  
  const { globalWorkspaceId, setGlobalWorkspaceId } = useWorkspaceStore();
  const selectedWorkspaceId = globalWorkspaceId === "all" ? null : globalWorkspaceId;
  const setSelectedWorkspaceId = (id: string | null) => setGlobalWorkspaceId(id || "all");

  const displayedWorkspaces = selectedWorkspaceId ? workspaces.filter(w => w.id === selectedWorkspaceId) : workspaces;

  useEffect(() => {
    if (tabFromUrl && ['workspaces', 'general', 'security'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const handleTabChange = (tab: 'workspaces' | 'general' | 'security') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };


  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const response = await workspacesApi.list();
        setWorkspaces(response.data);
      } catch (error) {
        console.error("Failed to fetch workspaces:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchWorkspaces();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 p-6 md:px-8 pt-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Settings & Team Governance</h1>
              <p className="text-gray-500 mt-1">Manage agency team members, configure renewal SMTP alerts, and enforce security policies.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-500">Preview as role:</span>
            <select className="bg-indigo-600 text-white font-semibold text-sm rounded-lg px-4 py-2 border-none focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none pr-8 cursor-pointer relative" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23ffffff\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' }}>
              <option value="Tech Lead">Tech Lead</option>
              <option value="Admin">Admin</option>
              <option value="Manager">Manager</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-6 md:px-8 max-w-[1400px] mx-auto flex flex-col lg:flex-row gap-6">
        {/* Left Sidebar */}
        <div className="w-full lg:w-[280px] shrink-0">
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-100">
              <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider ml-2">Control Center</h2>
            </div>
            <div className="p-2 space-y-1">
              <button 
                onClick={() => handleTabChange('workspaces')}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-xl transition-all border",
                  activeTab === 'workspaces' 
                    ? "bg-white border-indigo-100 shadow-[0_2px_10px_rgb(99,102,241,0.12)] text-indigo-700" 
                    : "hover:bg-gray-50 text-gray-600 hover:text-gray-900 border-transparent"
                )}
              >
                <div className="flex items-center gap-3">
                  <Building2 className={cn("w-5 h-5", activeTab === 'workspaces' ? "text-indigo-700" : "text-gray-400")} />
                  <span className="font-bold text-sm">Company Workspaces</span>
                </div>
                <span className={cn("px-2 py-0.5 rounded-full text-xs font-bold border", activeTab === 'workspaces' ? "bg-indigo-50 text-indigo-600 border-indigo-100" : "bg-gray-100 text-gray-600 border-transparent")}>{isLoading ? "..." : `${workspaces.length} Agencies`}</span>
              </button>

              <button 
                onClick={() => handleTabChange('general')}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-xl transition-all border",
                  activeTab === 'general' 
                    ? "bg-white border-indigo-100 shadow-[0_2px_10px_rgb(99,102,241,0.12)] text-indigo-700" 
                    : "hover:bg-gray-50 text-gray-600 hover:text-gray-900 border-transparent"
                )}
              >
                <div className="flex items-center gap-3">
                  <SlidersHorizontal className={cn("w-5 h-5", activeTab === 'general' ? "text-indigo-700" : "text-gray-400")} />
                  <span className="font-bold text-sm">General Settings</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </button>

              <button 
                onClick={() => handleTabChange('security')}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-xl transition-all border",
                  activeTab === 'security' 
                    ? "bg-white border-indigo-100 shadow-[0_2px_10px_rgb(99,102,241,0.12)] text-indigo-700" 
                    : "hover:bg-gray-50 text-gray-600 hover:text-gray-900 border-transparent"
                )}
              >
                <div className="flex items-center gap-3">
                  <Shield className={cn("w-5 h-5", activeTab === 'security' ? "text-indigo-700" : "text-gray-400")} />
                  <span className="font-bold text-sm">Security & MFA</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className={cn("flex-1 bg-white rounded-2xl shadow-sm overflow-hidden", (activeTab === 'general' || activeTab === 'security') ? "bg-transparent border-none shadow-none" : "border border-gray-200 p-6")}>
          {activeTab === 'workspaces' ? (
            <>
              {/* Main Content Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-100 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight">Multi-Company Agency Workspaces</h2>
                <p className="text-sm text-gray-500 mt-1 max-w-2xl">Manage entity details, GSTIN, legal addresses, bank accounts, default currencies, and auto-incrementing Invoice/estimate/PO prefixes.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button 
                onClick={() => {
                  setEditingWorkspace(null);
                  setModalMode('add');
                  setIsAddWorkspaceModalOpen(true);
                }} 
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add Workspace
              </button>
              <button 
                onClick={() => setSelectedWorkspaceId(null)}
                className={cn(
                  "px-4 py-2.5 rounded-lg font-bold text-sm transition-colors border",
                  selectedWorkspaceId === null 
                    ? "bg-indigo-600 hover:bg-indigo-700 border-transparent text-white shadow-sm"
                    : "bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700"
                )}
              >
                View All Companies
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            
            {isLoading ? (
              <div className="p-8 text-center col-span-full text-gray-500 font-bold">Loading workspaces...</div>
            ) : displayedWorkspaces.length === 0 ? (
              <div className="p-8 text-center col-span-full text-gray-500 font-bold">No workspaces found.</div>
            ) : displayedWorkspaces.map((workspace) => (
              <div key={workspace.id} className="rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-sm hover:border-indigo-200 transition-colors">
                <div className="p-5">
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <img src={workspace.logoUrl || "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=120&h=120&fit=crop"} alt={workspace.displayName} className="w-14 h-14 rounded-xl object-cover shadow-sm" />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-black text-gray-900">{workspace.displayName}</h3>
                          <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider", workspace.shortCode === 'EDN' ? "bg-blue-50 text-blue-600 border-blue-200" : workspace.shortCode === 'BFC' ? "bg-red-50 text-red-600 border-red-200" : workspace.shortCode === 'VWM' ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-purple-50 text-purple-600 border-purple-200")}>{workspace.shortCode}</span>
                        </div>
                        <p className="text-xs text-gray-500 font-medium">{workspace.legalName?.substring(0, 35)}{workspace.legalName?.length > 35 ? '...' : ''}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedWorkspaceId(workspace.id)}
                      className={cn(
                        "px-4 py-1.5 rounded-lg border font-bold text-xs transition-colors shadow-sm",
                        selectedWorkspaceId === workspace.id 
                          ? "bg-indigo-600 border-indigo-600 text-white" 
                          : "border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                      )}
                    >
                      {selectedWorkspaceId === workspace.id ? "Active" : "Switch"}
                    </button>
                  </div>

                  {/* Info List */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">GSTIN Number</p>
                      <p className="text-sm font-bold text-gray-900 text-right">{workspace.gstin}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Registered State</p>
                      <p className="text-sm font-bold text-gray-900 text-right">{workspace.state}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Default Currency</p>
                      <p className="text-sm font-bold text-indigo-700 text-right">{workspace.defaultCurrency === "INR" ? "₹ INR (INR)" : workspace.defaultCurrency}</p>
                    </div>
                  </div>

                  {/* Document Series */}
                  <div className="mb-6">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Document Series & Next Number</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="border border-gray-100 bg-gray-50/50 rounded-lg p-2.5 flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Invoice</span>
                        <span className="text-xs font-bold text-purple-700">{(workspace.invoicePrefix || "") + String(workspace.invoiceNextSeq || 1).padStart(3, '0')}</span>
                      </div>
                      <div className="border border-gray-100 bg-gray-50/50 rounded-lg p-2.5 flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Estimate</span>
                        <span className="text-xs font-bold text-amber-700">{(workspace.estimatePrefix || "") + String(workspace.estimateNextSeq || 1).padStart(3, '0')}</span>
                      </div>
                      <div className="border border-gray-100 bg-gray-50/50 rounded-lg p-2.5 flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">PO Series</span>
                        <span className="text-xs font-bold text-indigo-700">{(workspace.poPrefix || "") + String(workspace.poNextSeq || 1).padStart(3, '0')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bank Details */}
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Bank Details For Invoicing</p>
                    <p className="text-sm font-bold text-gray-900 mb-1">{workspace.bankName} • {workspace.bankBranch}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
                      <span>A/C: {workspace.accountNumber}</span>
                      <span>IFSC: {workspace.ifscCode}</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="bg-gray-50/50 border-t border-gray-100 p-4 flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-700">~{workspace.activeClients} Active Clients</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setEditingWorkspace(workspace);
                        setModalMode('edit');
                        setIsAddWorkspaceModalOpen(true);
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 font-bold text-xs transition-colors"
                    >
                      <Settings2 className="w-3.5 h-3.5" />
                      Edit Entity
                    </button>
                  </div>
                </div>
              </div>
            ))}

          </div>
            </>
          ) : activeTab === 'general' ? (
            <GeneralSettingsView />
          ) : activeTab === 'security' ? (
            <SecuritySettingsView />
          ) : null}
        </div>
      </div>
      <AddWorkspaceModal isOpen={isAddWorkspaceModalOpen} onClose={() => setIsAddWorkspaceModalOpen(false)} mode={modalMode} initialData={editingWorkspace} />
    </div>
  );
}
