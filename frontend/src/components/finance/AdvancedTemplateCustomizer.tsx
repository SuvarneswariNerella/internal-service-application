import { useState, useEffect, useRef } from "react";
import { X, Code2, MonitorPlay, Save, RotateCcw, Copy } from "lucide-react";

interface Props {
  designName: string;
  initialHtml?: string;
  initialCss?: string;
  previewData?: Record<string, string>;
  onSave: (html: string, css: string) => void;
  onClose: () => void;
}

const MOCK_DATA: Record<string, string> = {
  "company.name": "Edunura",
  "company.logo": "<div style='width:60px;height:40px;background:#1e293b;border-radius:4px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:bold;'>LOGO</div>",
  "company.address": "101 Knowledge Park, Vashi, Navi Mumbai, Maharashtra 400703",
  "company.gstin": "27AAACE1234F1Z1",
  "company.email": "billing@edunura.in",
  "doc.type": "Invoice",
  "doc.number": "#EDU/2026/004",
  "doc.issuedDate": "2026-08-08",
  "doc.dueDate": "2026-09-07",
  "client.name": "Luminus Technologies",
  "client.address": "45 Tech Park, Andheri East, Mumbai",
  "client.gstin": "27BBBBF9876E1Z5",
  "lineItems.html": "<tr><td>Web Application Development</td><td style='text-align: center;'>1</td><td style='text-align: right;'>₹5,000.00</td><td style='text-align: center;'>18%</td><td style='text-align: right;'>₹5,000.00</td></tr><tr><td>Server Maintenance (Monthly)</td><td style='text-align: center;'>1</td><td style='text-align: right;'>₹500.00</td><td style='text-align: center;'>18%</td><td style='text-align: right;'>₹500.00</td></tr>",
  "financial.subtotal": "₹5,500.00",
  "financial.tax": "₹990.00",
  "financial.total": "₹6,490.00"
};

const TEMPLATES: Record<string, { html: string, css: string }> = {
  CLASSIC: {
    html: `
<div class="invoice-box classic-theme">
  <div class="header">
    <div class="brand">
      {{company.logo}}
      <div class="company-info">
        <h1>{{company.name}}</h1>
        <p>{{company.address}}</p>
        <p>GSTIN: {{company.gstin}} | Email: {{company.email}}</p>
      </div>
    </div>
    <div class="doc-meta">
      <span class="doc-type">{{doc.type}}</span>
      <h2>{{doc.number}}</h2>
      <p>Issue Date: {{doc.issuedDate}}</p>
      <p>Due Date: {{doc.dueDate}}</p>
    </div>
  </div>
  
  <div class="billing">
    <h3>Billed To</h3>
    <p><strong>{{client.name}}</strong></p>
    <p>{{client.address}}</p>
    <p>GSTIN: {{client.gstin}}</p>
  </div>
  
  <table class="items">
    <thead>
      <tr>
        <th>Item Description</th>
        <th style="text-align: center;">Qty</th>
        <th style="text-align: right;">Rate</th>
        <th style="text-align: center;">GST %</th>
        <th style="text-align: right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      {{lineItems.html}}
    </tbody>
  </table>
  
  <div class="totals">
    <p>Subtotal: <strong>{{financial.subtotal}}</strong></p>
    <p>Total GST: <strong>{{financial.tax}}</strong></p>
    <h3 class="grand-total">Total: {{financial.total}}</h3>
  </div>
</div>
`,
    css: `
.invoice-box.classic-theme {
  font-family: 'Georgia', serif;
  color: #1e293b;
  padding: 32px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 2px solid #1e293b;
  padding-bottom: 24px;
  margin-bottom: 24px;
}

.brand .company-info h1 {
  margin: 12px 0 4px;
  font-size: 28px;
  color: #0f172a;
}

.company-info p {
  margin: 2px 0;
  font-size: 12px;
  color: #64748b;
}

.doc-meta {
  text-align: right;
}

.doc-type {
  display: inline-block;
  padding: 4px 12px;
  background: #f1f5f9;
  border-radius: 4px;
  font-weight: bold;
  text-transform: uppercase;
  font-size: 12px;
  letter-spacing: 1px;
}

.doc-meta h2 {
  margin: 12px 0 8px;
  font-size: 24px;
}

.doc-meta p {
  margin: 2px 0;
  font-size: 12px;
  color: #475569;
}

.billing {
  margin-bottom: 32px;
}

.billing h3 {
  font-size: 14px;
  text-transform: uppercase;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 8px;
  margin-bottom: 12px;
  color: #64748b;
}

.items {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 32px;
}

.items th {
  text-align: left;
  padding: 12px;
  background: #f8fafc;
  border-bottom: 2px solid #cbd5e1;
  font-size: 13px;
  text-transform: uppercase;
}

.items td {
  padding: 16px 12px;
  border-bottom: 1px solid #e2e8f0;
  font-size: 14px;
}

.totals {
  width: 300px;
  margin-left: auto;
  text-align: right;
}

.totals p {
  margin: 8px 0;
  color: #475569;
}

.grand-total {
  font-size: 20px;
  color: #0f172a;
  border-top: 2px solid #1e293b;
  padding-top: 12px;
  margin-top: 12px;
}
`
  },
  MODERN: {
    html: `
<div class="invoice-box modern-theme">
  <div class="accent-bar"></div>
  <div class="header">
    <div class="brand">
      {{company.logo}}
      <div class="company-info">
        <h1>{{company.name}}</h1>
        <p>{{company.address}}</p>
        <p>GSTIN: {{company.gstin}} | Email: {{company.email}}</p>
      </div>
    </div>
    <div class="doc-meta">
      <span class="doc-type">{{doc.type}}</span>
      <h2>{{doc.number}}</h2>
      <p>Issue Date: <strong>{{doc.issuedDate}}</strong></p>
      <p>Due Date: <strong>{{doc.dueDate}}</strong></p>
    </div>
  </div>
  
  <div class="billing-container">
    <div class="billing">
      <h3>Billed To</h3>
      <p class="client-name">{{client.name}}</p>
      <p>{{client.address}}</p>
      <p>GSTIN: {{client.gstin}}</p>
    </div>
  </div>
  
  <table class="items">
    <thead>
      <tr>
        <th>Item Description</th>
        <th style="text-align: center;">Qty</th>
        <th style="text-align: right;">Rate</th>
        <th style="text-align: center;">GST %</th>
        <th style="text-align: right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      {{lineItems.html}}
    </tbody>
  </table>
  
  <div class="totals-container">
    <div class="totals">
      <div class="row"><span>Subtotal:</span> <strong>{{financial.subtotal}}</strong></div>
      <div class="row"><span>Total GST:</span> <strong>{{financial.tax}}</strong></div>
      <div class="grand-total"><span>Total:</span> <span>{{financial.total}}</span></div>
    </div>
  </div>
</div>
`,
    css: `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
.invoice-box.modern-theme {
  padding: 40px; background: #ffffff; color: #1e293b;
  font-family: 'Inter', sans-serif; position: relative;
}
.accent-bar { position: absolute; top: 0; left: 0; right: 0; height: 8px; background: linear-gradient(90deg, #5438FF, #00d4ff); }
.header { display: flex; justify-content: space-between; margin-bottom: 40px; margin-top: 10px; }
.company-info h1 { margin: 10px 0 4px; font-size: 24px; font-weight: 800; color: #0f172a; }
.company-info p { margin: 2px 0; font-size: 11px; color: #64748b; }
.doc-meta { text-align: right; }
.doc-type { display: inline-block; padding: 6px 12px; background: #eef2ff; color: #5438FF; border-radius: 6px; font-weight: 800; text-transform: uppercase; font-size: 10px; letter-spacing: 1px; }
.doc-meta h2 { margin: 12px 0 8px; font-size: 20px; font-weight: 800; color: #0f172a; }
.doc-meta p { margin: 4px 0; font-size: 12px; color: #475569; }
.billing-container { background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 40px; }
.billing h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin: 0 0 10px 0; }
.client-name { font-weight: 800; font-size: 16px; color: #0f172a; margin: 0 0 4px 0; }
.billing p { margin: 2px 0; font-size: 13px; color: #475569; }
.items { width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 40px; }
.items th { text-align: left; padding: 16px; background: #f1f5f9; font-size: 11px; text-transform: uppercase; font-weight: 800; color: #475569; }
.items th:first-child { border-radius: 8px 0 0 8px; }
.items th:last-child { border-radius: 0 8px 8px 0; }
.items td { padding: 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
.totals-container { display: flex; justify-content: flex-end; }
.totals { width: 320px; }
.row { display: flex; justify-content: space-between; padding: 8px 0; color: #475569; font-size: 14px; }
.grand-total { display: flex; justify-content: space-between; font-size: 20px; font-weight: 800; color: #5438FF; background: #eef2ff; padding: 16px; border-radius: 8px; margin-top: 12px; }
`
  },
  MINIMAL: {
    html: `
<div class="invoice-box minimal-theme">
  <div class="header">
    <div class="brand">
      {{company.logo}}
      <h1 class="company-name">{{company.name}}</h1>
    </div>
    <div class="doc-meta">
      <h2 class="doc-type">{{doc.type}}</h2>
      <p class="doc-number">{{doc.number}}</p>
    </div>
  </div>
  
  <div class="contact-grid">
    <div>
      <p class="label">From</p>
      <p>{{company.address}}</p>
      <p>GSTIN: {{company.gstin}}</p>
      <p>{{company.email}}</p>
    </div>
    <div>
      <p class="label">Billed To</p>
      <p><strong>{{client.name}}</strong></p>
      <p>{{client.address}}</p>
      <p>GSTIN: {{client.gstin}}</p>
    </div>
    <div class="dates">
      <p class="label">Date</p>
      <p>{{doc.issuedDate}}</p>
      <p class="label" style="margin-top: 16px;">Due</p>
      <p>{{doc.dueDate}}</p>
    </div>
  </div>
  
  <table class="items">
    <thead>
      <tr>
        <th>Description</th>
        <th style="text-align: center;">Qty</th>
        <th style="text-align: right;">Rate</th>
        <th style="text-align: center;">GST %</th>
        <th style="text-align: right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      {{lineItems.html}}
    </tbody>
  </table>
  
  <div class="totals">
    <div class="row"><span>Subtotal</span> <span>{{financial.subtotal}}</span></div>
    <div class="row"><span>Total GST</span> <span>{{financial.tax}}</span></div>
    <div class="grand-total"><span>Total</span> <span>{{financial.total}}</span></div>
  </div>
</div>
`,
    css: `
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;700&display=swap');
.invoice-box.minimal-theme {
  padding: 40px; background: #ffffff; color: #111;
  font-family: 'Roboto', sans-serif; font-weight: 300;
}
.header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 60px; }
.company-name { font-size: 24px; font-weight: 400; margin: 10px 0 0; }
.doc-meta { text-align: right; }
.doc-type { font-size: 32px; font-weight: 300; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 2px; }
.doc-number { font-size: 14px; font-weight: 400; color: #666; margin: 0; }
.contact-grid { display: grid; grid-template-columns: 1fr 1fr 150px; gap: 40px; margin-bottom: 60px; font-size: 13px; line-height: 1.6; }
.contact-grid p { margin: 0; }
.label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-bottom: 8px !important; }
.dates { text-align: right; }
.items { width: 100%; border-collapse: collapse; margin-bottom: 60px; }
.items th { text-align: left; padding: 0 0 16px 0; border-bottom: 1px solid #111; font-size: 11px; text-transform: uppercase; font-weight: 400; letter-spacing: 1px; color: #666; }
.items td { padding: 16px 0; border-bottom: 1px solid #eee; font-size: 14px; }
.totals { width: 250px; margin-left: auto; }
.row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
.grand-total { display: flex; justify-content: space-between; font-size: 18px; font-weight: 700; border-top: 1px solid #111; padding-top: 16px; margin-top: 8px; }
`
  },
  EXECUTIVE: {
    html: `
<div class="invoice-box executive-theme">
  <div class="executive-header">
    <div class="header-left">
      <h1 class="doc-type">{{doc.type}}</h1>
      <p class="doc-number">N° {{doc.number}}</p>
    </div>
    <div class="header-right">
      {{company.logo}}
    </div>
  </div>
  
  <div class="executive-body">
    <div class="contact-grid">
      <div>
        <p class="label">Pay To</p>
        <p class="company-name"><strong>{{company.name}}</strong></p>
        <p>{{company.address}}</p>
        <p>GSTIN: {{company.gstin}} | {{company.email}}</p>
      </div>
      <div>
        <p class="label">Bill To</p>
        <p class="client-name"><strong>{{client.name}}</strong></p>
        <p>{{client.address}}</p>
        <p>GSTIN: {{client.gstin}}</p>
      </div>
      <div class="dates">
        <p class="label">Date</p>
        <p>{{doc.issuedDate}}</p>
        <p class="label" style="margin-top: 14px;">Due Date</p>
        <p>{{doc.dueDate}}</p>
      </div>
    </div>
    
    <div class="gold-divider"></div>
    
    <table class="items">
      <thead>
        <tr>
          <th>Description</th>
          <th style="text-align: center;">Qty</th>
          <th style="text-align: right;">Price</th>
          <th style="text-align: center;">GST %</th>
          <th style="text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        {{lineItems.html}}
      </tbody>
    </table>
    
    <div class="gold-divider"></div>
    
    <div class="totals-container">
      <div class="totals">
        <div class="row"><span>Subtotal:</span> <strong>{{financial.subtotal}}</strong></div>
        <div class="row"><span>Total GST:</span> <strong>{{financial.tax}}</strong></div>
        <div class="grand-total"><span>Total:</span> <span>{{financial.total}}</span></div>
      </div>
    </div>
  </div>
  
  <div class="executive-footer">
    <div class="terms">
      <p class="terms-title">Terms & Conditions</p>
      <p class="terms-text">All claims relating to quantity or errors shall be made within thirty (30) days after delivery.</p>
    </div>
  </div>
</div>
`,
    css: `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
.invoice-box.executive-theme {
  padding: 0; background: #ffffff; color: #2B1810;
  font-family: 'Plus Jakarta Sans', sans-serif; border-radius: 8px; overflow: hidden;
}
.executive-header {
  background: #4A2E2B; padding: 36px 40px; display: flex; justify-content: space-between; align-items: center; color: #fff;
}
.executive-header .doc-type { font-size: 36px; font-weight: 800; text-transform: uppercase; margin: 0; letter-spacing: 2px; }
.executive-header .doc-number { font-size: 18px; font-weight: 600; color: #C89D4B; margin: 6px 0 0; }
.executive-body { padding: 36px 40px; }
.contact-grid { display: grid; grid-template-columns: 1.2fr 1.2fr 0.8fr; gap: 30px; margin-bottom: 24px; font-size: 13px; line-height: 1.6; }
.contact-grid p { margin: 0; color: #6B5E59; }
.contact-grid .label { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #2B1810; margin-bottom: 6px; }
.gold-divider { height: 2px; background: #C89D4B; margin: 20px 0; }
.items { width: 100%; border-collapse: collapse; margin: 10px 0; }
.items th { text-align: left; padding: 12px 10px; font-size: 12px; text-transform: uppercase; font-weight: 800; letter-spacing: 1px; color: #2B1810; }
.items td { padding: 14px 10px; border-bottom: 1px solid #f2ece9; font-size: 13px; }
.totals-container { display: flex; justify-content: flex-end; margin-top: 10px; }
.totals { width: 280px; }
.row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; color: #2B1810; }
.grand-total { display: flex; justify-content: space-between; font-size: 16px; font-weight: 800; color: #4A2E2B; padding-top: 8px; }
.executive-footer { background: #4A2E2B; padding: 24px 40px; color: #fff; }
.terms-title { font-size: 11px; font-weight: 800; color: #C89D4B; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 6px; }
.terms-text { font-size: 11px; color: #dfd5d3; margin: 0; line-height: 1.5; }
`
  }
};

export default function AdvancedTemplateCustomizer({ designName, initialHtml, initialCss, previewData, onSave, onClose }: Props) {
  const mergedData = previewData || MOCK_DATA;
  
  const templateHtml = TEMPLATES[designName]?.html || TEMPLATES['CLASSIC']!.html;
  const templateCss = TEMPLATES[designName]?.css || TEMPLATES['CLASSIC']!.css;

  const [html, setHtml] = useState(initialHtml || templateHtml.trim());
  const [css, setCss] = useState(initialCss || templateCss.trim());
  const [activeTab, setActiveTab] = useState<"html" | "css">("html");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const updatePreview = () => {
    if (!iframeRef.current) return;
    
    let processedHtml = html;
    // Replace tokens
    Object.keys(mergedData).forEach(key => {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      processedHtml = processedHtml.replace(regex, mergedData[key] || '');
    });

    const doc = iframeRef.current.contentDocument;
    if (doc) {
      doc.open();
      doc.write(`
        <html>
          <head>
            <style>
              body { margin: 0; padding: 16px; background: transparent; font-family: sans-serif; }
              ${css}
            </style>
          </head>
          <body>
            ${processedHtml}
          </body>
        </html>
      `);
      doc.close();
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updatePreview();
    }, 500); // Debounce preview update
    return () => clearTimeout(timeoutId);
  }, [html, css]);

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset to default code? All your changes will be lost.")) {
      setHtml((TEMPLATES[designName]?.html || TEMPLATES['CLASSIC']!.html).trim());
      setCss((TEMPLATES[designName]?.css || TEMPLATES['CLASSIC']!.css).trim());
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-[#0f111a]/80 backdrop-blur-sm">
      <div className="w-full max-w-[1280px] h-[90vh] flex flex-col bg-[#161925] rounded-xl border border-gray-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#12141d]">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-[#5438FF]/20 rounded-lg text-[#8b7fff]">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Edit HTML/CSS Template — <span className="text-[#a59fff]">{designName}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 ml-2">ADVANCED CUSTOMIZER</span>
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">Customize template layout & styling directly using raw HTML, CSS, and dynamic merge tokens.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleReset} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 text-xs font-semibold hover:bg-gray-800 transition-colors">
              <RotateCcw className="w-3.5 h-3.5" /> Reset Defaults
            </button>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Panel: Editor */}
          <div className="w-1/2 flex flex-col border-r border-gray-800 bg-[#0f111a]">
            {/* Editor Tabs */}
            <div className="flex items-center px-4 py-2 bg-[#12141d] border-b border-gray-800 gap-2">
              <button 
                onClick={() => setActiveTab("html")}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${activeTab === "html" ? "bg-[#5438FF] text-white" : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"}`}
              >
                <Code2 className="w-3.5 h-3.5" /> HTML Template
              </button>
              <button 
                onClick={() => setActiveTab("css")}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${activeTab === "css" ? "bg-[#5438FF] text-white" : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"}`}
              >
                <Code2 className="w-3.5 h-3.5" /> CSS Stylesheet
              </button>
              <div className="ml-auto text-[10px] font-mono text-gray-500">{activeTab === 'html' ? html.length : css.length} chars</div>
            </div>

            {/* Textarea Editor */}
            <div className="flex-1 relative">
              <textarea
                value={activeTab === "html" ? html : css}
                onChange={(e) => activeTab === "html" ? setHtml(e.target.value) : setCss(e.target.value)}
                className="w-full h-full p-5 bg-transparent text-[#a6accd] font-mono text-sm resize-none focus:outline-none leading-relaxed"
                spellCheck={false}
                style={{ tabSize: 2 }}
              />
            </div>

            {/* Merge Tokens Guide */}
            <div className="p-5 bg-[#12141d] border-t border-gray-800 h-[240px] overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-gray-300 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#5438FF]" /> AVAILABLE MERGE TOKENS (CLICK TO COPY)
                </h3>
                <span className="text-[10px] text-gray-500">Replaced with company & document data</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.keys(mergedData).map(token => (
                  <button 
                    key={token} 
                    onClick={() => navigator.clipboard.writeText(`{{${token}}}`)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#1a1d2d] hover:bg-[#23273c] border border-gray-700/50 rounded text-xs font-mono text-[#8b7fff] transition-colors group"
                  >
                    {"{{" + token + "}}"}
                    <Copy className="w-3 h-3 text-gray-600 group-hover:text-gray-400" />
                  </button>
                ))}
              </div>
              <div className="mt-4 p-3 rounded bg-blue-500/10 border border-blue-500/20 flex items-start gap-2">
                <MonitorPlay className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                <p className="text-[11px] text-blue-200/70">Custom HTML/CSS template overrides the default layout engine for {designName}. Ensure responsive layout using standard CSS.</p>
              </div>
            </div>
          </div>

          {/* Right Panel: Preview */}
          <div className="w-1/2 flex flex-col bg-[#1e2130]">
            <div className="flex items-center justify-between px-6 py-2.5 bg-[#161925] border-b border-gray-800">
              <h3 className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Rendered Document Preview
              </h3>
              <span className="text-[10px] font-bold text-emerald-500/50 uppercase tracking-widest">Reactively Synced</span>
            </div>
            <div className="flex-1 p-6 overflow-hidden flex items-center justify-center relative bg-[#F8F9FA]">
              <div className="absolute inset-0 pattern-dots pattern-gray-400 pattern-bg-transparent pattern-size-4 pattern-opacity-10" />
              <div className="w-full h-full max-w-[850px] bg-white shadow-xl rounded-lg border border-gray-200 overflow-hidden relative z-10 flex flex-col">
                <iframe
                  ref={iframeRef}
                  className="w-full h-full flex-1 border-0"
                  title="Live Preview"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#12141d] border-t border-gray-800 flex items-center justify-end gap-4">
          <button onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-gray-400 hover:text-white transition-colors">
            Cancel
          </button>
          <button 
            onClick={() => onSave(html, css)}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#5438FF] hover:bg-[#432AC9] text-white text-sm font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(84,56,255,0.3)]"
          >
            <Save className="w-4 h-4" /> Apply & Save HTML/CSS
          </button>
        </div>
      </div>
    </div>
  );
}

const Layers = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 12 12 17 22 12"/><polyline points="2 17 12 22 22 17"/></svg>
);
