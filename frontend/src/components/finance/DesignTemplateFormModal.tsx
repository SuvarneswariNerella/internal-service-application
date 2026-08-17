import { useState, useEffect, useRef } from "react";
import { X, Loader2, Layers, Palette } from "lucide-react";
import { Workspace, workspacesApi } from "@/api/workspaces";
import { DesignTemplate, templatesApi } from "@/api/templates";
import { useWorkspaceStore } from "@/store/workspaceStore";

// @ts-ignore
import classicRaw from "../../Invoice_Templates/Classic.html?raw";
// @ts-ignore
import minimalRaw from "../../Invoice_Templates/Minimal.html?raw";
// @ts-ignore
import modernRaw from "../../Invoice_Templates/Modern.html?raw";

const rawTemplates: Record<string, string> = {
  classic: minimalRaw,
  minimal: classicRaw,
  modern: modernRaw,
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  workspace?: Workspace;
  template?: DesignTemplate | null;
  onSuccess: () => void;
}

const BRAND_COLORS = [
  "#5438FF", // Primary Purple
  "#ef4444", // Red
  "#10b981", // Green
  "#f59e0b", // Orange
  "#8b5cf6", // Violet
  "#3b82f6", // Blue
  "#1e293b", // Slate
];

const FONTS = [
  "Plus Jakarta Sans",
  "Inter",
  "Roboto",
  "Georgia"
];

export default function DesignTemplateFormModal({ isOpen, onClose, workspace, template, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);

  // Form State
  const [type, setType] = useState(template?.type || "INVOICES");
  const [design, setDesign] = useState(template?.design || "MODERN");
  const [title, setTitle] = useState(template?.title || "");
  const [description, setDescription] = useState(template?.description || "");
  const [isDefault, setIsDefault] = useState(template?.isDefault || false);
  const [brandColor, setBrandColor] = useState(BRAND_COLORS[0] || "#5438FF");
  const [font, setFont] = useState(FONTS[0] || "Inter");
  const [headerLayout, setHeaderLayout] = useState("Left-Aligned");


  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>("");
  const { globalWorkspaceId } = useWorkspaceStore();

  useEffect(() => {
    if (isOpen) {
      workspacesApi.list().then(res => {
        if (res && res.data) {
          setWorkspaces(res.data);
          if (!workspace && res.data.length > 0) {
            if (globalWorkspaceId !== "all") {
              setSelectedWorkspaceId(globalWorkspaceId);
            } else {
              const firstId = res.data[0]?.id;
              if (firstId) setSelectedWorkspaceId(firstId);
            }
          }
        }
      });
    }
  }, [isOpen, workspace, globalWorkspaceId]);

  // Parse config on load if editing
  useEffect(() => {
    if (isOpen && template) {
      setType(template.type);
      setDesign(template.design || "MODERN");
      setTitle(template.title);
      setDescription(template.description || "");
      setIsDefault(template.isDefault);

      // Try to parse config from HTML meta tag
      if (template.customHtml) {
        const match = template.customHtml.match(/<meta name="template-config" content="(.*?)" \/>/);
        if (match && match[1]) {
          try {
            const config = JSON.parse(match[1].replace(/&quot;/g, '"'));
            if (config.color) setBrandColor(config.color);
            if (config.font) setFont(config.font);
            if (config.headerLayout) setHeaderLayout(config.headerLayout);
          } catch (e) {
            // Ignore corrupted config
          }
        }
      }
    } else if (isOpen) {
      // Reset for new
      setType("INVOICES");
      setDesign("MODERN");
      setTitle("");
      setDescription("");
      setIsDefault(false);
      setBrandColor(BRAND_COLORS[0] || "#5438FF");
      setFont(FONTS[0] || "Inter");
      setHeaderLayout("Left-Aligned");
    }
  }, [isOpen, template]);

  const updatePreview = () => {
    if (!iframeRef.current) return;
    
    let htmlToRender = rawTemplates[design.toLowerCase()] || "";

    if (type === "PROPOSALS") {
      htmlToRender = htmlToRender.replace(/INVOICE/g, "PROPOSAL")
                                 .replace(/Invoice/g, "Proposal")
                                 .replace(/Bill To:/g, "Proposal To:");
    } else if (type === "PURCHASE_ORDERS") {
      htmlToRender = htmlToRender.replace(/INVOICE/g, "PURCHASE ORDER")
                                 .replace(/Invoice/g, "Purchase Order")
                                 .replace(/Bill To:/g, "Purchase Order To:");
    }

    // For modern template, replace the hardcoded blue gradients/colors
    if (design.toLowerCase() === 'modern') {
      htmlToRender = htmlToRender.replace(/#003b8e/gi, brandColor).replace(/#0056b3/gi, brandColor);
    }

    const dynamicStyles = `
      <style>
        :root { --primary-color: ${brandColor}; }
        body, .tm_invoice, .tm_invoice_wrap { font-family: '${font}', sans-serif !important; }
        .tm_primary_color { color: ${brandColor} !important; }
        .tm_accent_bg { background-color: ${brandColor} !important; }
        
        /* Centered Layout */
        ${headerLayout === 'Centered' ? `
          .tm_invoice_in > .tm_invoice_head:first-child { text-align: center !important; flex-direction: column !important; justify-content: center !important; align-items: center !important; }
          .tm_invoice_in > .tm_invoice_head:first-child .tm_invoice_right { text-align: center !important; margin-top: 15px; width: 100%; }
          .tm_invoice_in > .tm_invoice_head:first-child .tm_invoice_left { text-align: center !important; width: 100%; display: flex; justify-content: center; }
          .tm_invoice_in > .tm_invoice_head:first-child .tm_shape_bg { width: 100% !important; left: 0 !important; right: 0 !important; }
          .modern-header { flex-direction: column !important; text-align: center !important; justify-content: center !important; }
          .modern-header h1 { text-align: center !important; max-width: 100% !important; margin-bottom: 10px !important; }
          .modern-header h3 { text-align: center !important; max-width: 100% !important; }
        ` : ''}
        
        /* Right-Aligned Layout */
        ${headerLayout === 'Right-Aligned' ? `
          .tm_invoice_in > .tm_invoice_head:first-child { flex-direction: row-reverse !important; }
          .tm_invoice_in > .tm_invoice_head:first-child .tm_invoice_left { text-align: right !important; display: flex; justify-content: flex-end; }
          .tm_invoice_in > .tm_invoice_head:first-child .tm_invoice_right { text-align: left !important; }
          .tm_invoice_in > .tm_invoice_head:first-child .tm_shape_bg { left: 0 !important; right: auto !important; transform: scaleX(-1); }
          .modern-header { flex-direction: row-reverse !important; }
          .modern-header h1 { text-align: right !important; }
          .modern-header h3 { text-align: left !important; }
        ` : ''}
      </style>
    `;

    htmlToRender = htmlToRender.replace('</head>', `${dynamicStyles}</head>`);

    const doc = iframeRef.current.contentDocument;
    if (doc) {
      doc.open();
      doc.write(htmlToRender);
      doc.close();
    }
  };

  useEffect(() => {
    if (isOpen) {
      const timeoutId = setTimeout(() => {
        updatePreview();
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, design, brandColor, font, headerLayout, type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const configString = JSON.stringify({ color: brandColor, font, headerLayout }).replace(/"/g, '&quot;');
      let customHtml = rawTemplates[design.toLowerCase()] || "";
      
      if (type === "PROPOSALS") {
        customHtml = customHtml.replace(/INVOICE/g, "PROPOSAL")
                                   .replace(/Invoice/g, "Proposal")
                                   .replace(/Bill To:/g, "Proposal To:");
      } else if (type === "PURCHASE_ORDERS") {
        customHtml = customHtml.replace(/INVOICE/g, "PURCHASE ORDER")
                                   .replace(/Invoice/g, "Purchase Order")
                                   .replace(/Bill To:/g, "Purchase Order To:");
      }
  
      if (design.toLowerCase() === 'modern') {
        customHtml = customHtml.replace(/#003b8e/gi, brandColor).replace(/#0056b3/gi, brandColor);
      }

      customHtml = customHtml.replace('</head>', `<meta name="template-config" content="${configString}" />\n</head>`);

      const dynamicStyles = `
      <style>
        :root { --primary-color: ${brandColor}; }
        body, .tm_invoice, .tm_invoice_wrap { font-family: '${font}', sans-serif !important; }
        .tm_primary_color { color: ${brandColor} !important; }
        .tm_accent_bg { background-color: ${brandColor} !important; }
        
        /* Centered Layout */
        ${headerLayout === 'Centered' ? `
          .tm_invoice_in > .tm_invoice_head:first-child { text-align: center !important; flex-direction: column !important; justify-content: center !important; align-items: center !important; }
          .tm_invoice_in > .tm_invoice_head:first-child .tm_invoice_right { text-align: center !important; margin-top: 15px; width: 100%; }
          .tm_invoice_in > .tm_invoice_head:first-child .tm_invoice_left { text-align: center !important; width: 100%; display: flex; justify-content: center; }
          .tm_invoice_in > .tm_invoice_head:first-child .tm_shape_bg { width: 100% !important; left: 0 !important; right: 0 !important; }
          .modern-header { flex-direction: column !important; text-align: center !important; justify-content: center !important; }
          .modern-header h1 { text-align: center !important; max-width: 100% !important; margin-bottom: 10px !important; }
          .modern-header h3 { text-align: center !important; max-width: 100% !important; }
        ` : ''}
        
        /* Right-Aligned Layout */
        ${headerLayout === 'Right-Aligned' ? `
          .tm_invoice_in > .tm_invoice_head:first-child { flex-direction: row-reverse !important; }
          .tm_invoice_in > .tm_invoice_head:first-child .tm_invoice_left { text-align: right !important; display: flex; justify-content: flex-end; }
          .tm_invoice_in > .tm_invoice_head:first-child .tm_invoice_right { text-align: left !important; }
          .tm_invoice_in > .tm_invoice_head:first-child .tm_shape_bg { left: 0 !important; right: auto !important; transform: scaleX(-1); }
          .modern-header { flex-direction: row-reverse !important; }
          .modern-header h1 { text-align: right !important; }
          .modern-header h3 { text-align: left !important; }
        ` : ''}
      </style>
      `;

      const data = {
        type,
        design,
        title,
        description,
        isDefault,
        customHtml,
        customCss: dynamicStyles,
        workspaceId: workspace?.id || (globalWorkspaceId !== "all" ? globalWorkspaceId : selectedWorkspaceId),
      };

      if (template) {
        await templatesApi.update(template.id, data);
      } else {
        await templatesApi.create(data);
      }
      onSuccess();
    } catch (error) {
      console.error(error);
      alert("Failed to save template");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
      <div className="w-full max-w-[1200px] h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Palette className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-gray-900 leading-none mb-1">
                {template ? "Edit Custom Layout Template" : "Create Custom Layout Template"}
              </h2>
              <p className="text-[11px] font-medium text-gray-500">
                Customize base design, colors, fonts, header layout, and footer credits.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Split View */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Panel: Form */}
          <div className="w-[450px] flex flex-col border-r border-gray-100 bg-white overflow-y-auto custom-scrollbar">
            
            <form id="template-form" onSubmit={handleSubmit} className="p-6 space-y-6">
              
              <div>
                <label className="block text-[11px] font-extrabold text-gray-900 mb-2">Template Title</label>
                <input
                  type="text"
                  required
                  placeholder="New Custom Agency Blueprint"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-extrabold text-gray-900 mb-2">Target Company</label>
                  <select 
                    value={workspace ? workspace.id : selectedWorkspaceId}
                    onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                    disabled={!!workspace}
                    className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-700 disabled:bg-gray-50"
                  >
                    {workspace ? (
                      <option value={workspace.id}>{workspace.displayName}</option>
                    ) : (
                      workspaces.map(w => (
                        <option key={w.id} value={w.id}>{w.displayName}</option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold text-gray-900 mb-2">Category</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  >
                    <option value="INVOICES">Invoices</option>
                    <option value="PROPOSALS">Proposals</option>
                    <option value="PURCHASE_ORDERS">Purchase Orders</option>
                  </select>
                </div>
              </div>


                  <div>
                    <label className="block text-[11px] font-extrabold text-gray-900 mb-2">Base PDF / Screen Design Style</label>
                    <div className="grid grid-cols-2 gap-3">
                      {["CLASSIC", "MINIMAL", "MODERN"].map((tplKey) => (
                        <button
                          key={tplKey}
                          type="button"
                          onClick={() => setDesign(tplKey)}
                          className={`h-10 px-3 rounded-lg text-xs font-bold transition-all border ${design === tplKey ? "border-blue-600 text-blue-600 bg-blue-50" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                        >
                          {tplKey.charAt(0) + tplKey.slice(1).toLowerCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-gray-900 mb-3">Brand / Accent Color</label>
                    <div className="flex items-center gap-2">
                      {BRAND_COLORS.map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setBrandColor(c)}
                          className={`w-8 h-8 rounded-full transition-transform ${brandColor === c ? "ring-2 ring-offset-2 ring-blue-500 scale-110" : "hover:scale-105"}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                      <div className={`relative w-8 h-8 rounded-full overflow-hidden transition-transform ${!BRAND_COLORS.includes(brandColor) ? "ring-2 ring-offset-2 ring-blue-500 scale-110" : "hover:scale-105"}`} style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }}>
                        <input type="color" value={BRAND_COLORS.includes(brandColor) ? '#ffffff' : brandColor} onChange={(e) => setBrandColor(e.target.value)} className="absolute inset-0 w-[200%] h-[200%] -top-1/2 -left-1/2 cursor-pointer opacity-0" title="Custom Color" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-gray-900 mb-2">Typography Font</label>
                      <select
                        value={font}
                        onChange={(e) => setFont(e.target.value)}
                        className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                      >
                        {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-gray-900 mb-2">Header Layout</label>
                      <select
                        value={headerLayout}
                        onChange={(e) => setHeaderLayout(e.target.value)}
                        className="w-full h-10 px-3 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                      >
                        <option value="Left-Aligned">Left-Aligned</option>
                        <option value="Centered">Centered</option>
                        <option value="Right-Aligned">Right-Aligned</option>
                      </select>
                    </div>
                  </div>


            </form>

            <div className="mt-auto p-6 bg-white border-t border-gray-100 flex items-center justify-end gap-3 sticky bottom-0 z-10">
              <button type="button" onClick={onClose} className="px-5 py-2 text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors">
                Cancel
              </button>
              <button 
                type="submit"
                form="template-form"
                disabled={loading}
                className="flex items-center justify-center min-w-[160px] gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-[0_4px_14px_rgba(37,99,235,0.3)] disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Template Blueprint"}
              </button>
            </div>
          </div>

          {/* Right Panel: Preview */}
          <div className="flex-1 flex flex-col bg-[#fcfcfc] border-l border-gray-100 relative">
            <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 absolute top-0 left-0 right-0 z-10">
              <h3 className="text-[11px] font-extrabold text-blue-600 flex items-center gap-2 uppercase tracking-widest">
                <Layers className="w-3.5 h-3.5" />
                Real-Time Layout Preview
              </h3>
              <span className="text-[10px] font-bold text-gray-400">
                Style: {design} | Font: {font}
              </span>
            </div>
            
            <div className="flex-1 p-6 pt-20 flex justify-center items-center overflow-hidden bg-gray-50/50">
              <div className="w-full h-full max-w-[850px] bg-white shadow-xl rounded-xl border border-gray-200 overflow-hidden flex flex-col relative">
                <iframe
                  ref={iframeRef}
                  className="w-full h-full flex-1 border-0"
                  title="Live Preview"
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
