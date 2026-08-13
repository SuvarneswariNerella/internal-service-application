import { useState, useEffect } from "react";
import { Eye, LayoutTemplate, X, Plus, FileText, Layers, Trash2 } from "lucide-react";
import { useToastStore } from "@/store/toastStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import DesignTemplateFormModal from "./DesignTemplateFormModal";
import { templatesApi, DesignTemplate } from "@/api/templates";

const GROUP_CONFIGS = [
  { type: "INVOICES", label: "INVOICES", icon: <div className="w-5 h-5 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100"><span className="text-[10px] font-bold">$</span></div> },
  { type: "PROPOSALS", label: "PROPOSALS & ESTIMATES", icon: <div className="w-5 h-5 rounded bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100"><FileText className="w-3 h-3" /></div> },
  { type: "PURCHASE_ORDERS", label: "PURCHASE ORDERS (POs)", icon: <div className="w-5 h-5 rounded bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100"><Layers className="w-3 h-3" /></div> }
];

export default function TemplateLibraryView({ onUseTemplate }: { onUseTemplate?: (template: DesignTemplate) => void }) {
  const [previewTemplate, setPreviewTemplate] = useState<DesignTemplate | null>(null);
  const [activeTemplateType, setActiveTemplateType] = useState<string>("ALL");
  const [showCustomTemplateModal, setShowCustomTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DesignTemplate | null>(null);
  const [savedTemplates, setSavedTemplates] = useState<DesignTemplate[]>([]);
  const addToast = useToastStore((s) => s.addToast);
  const { globalWorkspaceId } = useWorkspaceStore();

  const fetchTemplates = () => {
    const wsId = globalWorkspaceId === "all" ? undefined : globalWorkspaceId;
    templatesApi.list(wsId).then(res => {
      if (res.data && res.data.success) {
        setSavedTemplates(res.data.data);
      }
    }).catch(console.error);
  };

  useEffect(() => {
    fetchTemplates();
  }, [globalWorkspaceId]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this template?")) return;
    try {
      await templatesApi.delete(id);
      addToast("Template deleted successfully", "success");
      fetchTemplates();
    } catch (err) {
      console.error(err);
      addToast("Failed to delete template", "error");
    }
  };

  const getPreviewHtml = () => {
    if (!previewTemplate) return "";
    let html = previewTemplate.customHtml || "";
    if (previewTemplate.customCss) {
      html = html.replace('</head>', `${previewTemplate.customCss}</head>`);
    }
    return html;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#5438FF]/10 flex items-center justify-center border border-[#5438FF]/20">
            <LayoutTemplate className="w-6 h-6 text-[#5438FF]" />
          </div>
          <div>
            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
              System Templates
            </h2>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Browse and preview the available design blueprints for your documents.
            </p>
          </div>
        </div>
        
        <button 
          onClick={() => {
            setEditingTemplate(null);
            setShowCustomTemplateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-[#5438FF] text-white text-sm font-bold rounded-xl hover:bg-[#4328E0] transition-colors shadow-sm shadow-[#5438FF]/20"
        >
          <Plus className="w-4 h-4" />
          Custom Template
        </button>
      </div>

      {/* Template Type Filter Bar */}
      <div className="flex flex-wrap gap-2">
        {["ALL", "PROPOSALS", "INVOICES", "PURCHASE_ORDERS"].map(t => (
          <button
            key={t}
            onClick={() => setActiveTemplateType(t)}
            className={`px-5 py-2 rounded-full text-[13px] font-bold transition-colors border ${
              activeTemplateType === t 
                ? "bg-[#5438FF] text-white border-[#5438FF] shadow-md shadow-[#5438FF]/20" 
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 shadow-sm"
            }`}
          >
            {t === "ALL" ? "All Templates" : t === "PROPOSALS" ? "Proposals" : t === "INVOICES" ? "Invoices" : "Purchase Orders"}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 md:p-8 space-y-12 bg-gray-50/30">
          
          {GROUP_CONFIGS.map(group => {
            if (activeTemplateType !== "ALL" && activeTemplateType !== group.type) return null;
            
            const groupTemplates = savedTemplates.filter(t => t.type === group.type);
            if (groupTemplates.length === 0) return null;

            return (
              <div key={group.type}>
                <div className="flex items-center gap-2 mb-4 pl-1">
                  {group.icon}
                  <h3 className="text-[11px] font-extrabold text-gray-900 uppercase tracking-widest">{group.label} ({groupTemplates.length})</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {groupTemplates.map(template => (
                    <div key={template.id} className="group rounded-2xl border border-gray-200 hover:border-[#5438FF] hover:shadow-xl hover:shadow-[#5438FF]/10 transition-all bg-white flex flex-col overflow-hidden">
                      {/* Top Section: Tags and Mockup */}
                      <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white text-gray-700 border border-gray-200 shadow-sm">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#5438FF]" />
                            {template.design}
                          </span>
                          {template.isDefault && (
                            <span className="text-[9px] font-bold text-[#5438FF] bg-[#5438FF]/10 px-2 py-0.5 rounded uppercase tracking-wider">Default</span>
                          )}
                        </div>

                        {/* Mockup Box */}
                        <div className="bg-white rounded-xl border border-gray-200 p-3 min-h-[104px] flex flex-col justify-between shadow-sm">
                          <div className="flex justify-between items-center text-[10px] font-extrabold text-gray-400">
                            <span className="capitalize">{group.type.toLowerCase().replace('_', ' ')}</span>
                          </div>
                          
                          <div className="space-y-2.5 mt-4">
                            <div className="w-5/6 h-2.5 rounded-full bg-[#5438FF]"></div>
                            <div className="w-2/3 h-2.5 rounded-full bg-gray-100"></div>
                          </div>
                          
                          <div className="flex justify-between items-end mt-auto text-[10px] font-extrabold text-gray-400">
                            <button 
                              onClick={() => setPreviewTemplate(template)}
                              className="flex items-center gap-1 text-[#5438FF] hover:text-[#4328E0] transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5"/> Preview
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Section: Details and Actions */}
                      <div className="p-4 flex flex-col flex-1 bg-white">
                        <h4 className="font-extrabold text-gray-900 text-[13px] mb-1.5">{template.title}</h4>
                        <p className="text-[11px] text-gray-500 font-medium line-clamp-2 leading-relaxed mb-4">{template.description}</p>
                        
                        <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-50">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleDelete(template.id)}
                              className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors"
                              title="Delete Template"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => setPreviewTemplate(template)}
                              className="w-8 h-8 rounded-lg bg-[#5438FF]/10 text-[#5438FF] hover:bg-[#5438FF]/20 flex items-center justify-center transition-colors"
                              title="Preview Template"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => {
                                setEditingTemplate(template);
                                setShowCustomTemplateModal(true);
                              }}
                              className="px-3 py-1.5 rounded-lg text-gray-600 font-bold text-[11px] hover:bg-gray-100 transition-colors"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => {
                                if (onUseTemplate) onUseTemplate(template);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-[#5438FF] text-white font-bold text-[11px] hover:bg-[#4328E0] shadow-sm shadow-[#5438FF]/20 transition-colors"
                            >
                              Use Design
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          
          {savedTemplates.length === 0 && (
             <div className="text-center py-20">
               <LayoutTemplate className="w-12 h-12 text-gray-300 mx-auto mb-4" />
               <h3 className="text-sm font-bold text-gray-900 mb-1">No templates found</h3>
               <p className="text-xs text-gray-500">Create a custom template to see it here.</p>
             </div>
          )}

        </div>
      </div>

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#f8f9fc] rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-white border-b border-gray-200 flex items-center justify-between shrink-0">
              <h3 className="text-lg font-bold text-gray-900 capitalize flex items-center gap-2">
                <LayoutTemplate className="w-5 h-5 text-[#5438FF]" />
                {previewTemplate.title} Preview
              </h3>
              <button 
                onClick={() => setPreviewTemplate(null)}
                className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Body (Iframe) */}
            <div className="flex-1 overflow-y-auto p-8 flex justify-center custom-scrollbar">
              <div className="w-full max-w-[800px] bg-white shadow-xl relative min-h-[1131px]">
                <iframe
                  title={`${previewTemplate.title} Preview`}
                  srcDoc={getPreviewHtml()}
                  className="w-full h-full border-none absolute inset-0"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Template Modal */}
      <DesignTemplateFormModal
        isOpen={showCustomTemplateModal}
        template={editingTemplate}
        onClose={() => {
          setShowCustomTemplateModal(false);
          setEditingTemplate(null);
        }}
        onSuccess={() => {
          setShowCustomTemplateModal(false);
          setEditingTemplate(null);
          fetchTemplates();
          addToast("Custom template saved successfully!", "success");
        }}
      />
    </div>
  );
}
