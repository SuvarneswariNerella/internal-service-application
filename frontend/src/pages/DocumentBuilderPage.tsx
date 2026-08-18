import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { ArrowLeft, Download, Save, Plus, Trash2, LayoutTemplate, Upload, Image as ImageIcon } from "lucide-react";
import { financeApi } from "@/api/finance";
import { clientsApi, type Client } from "@/api/clients";
import { templatesApi } from "@/api/templates";
import { itemsApi, type ItemCode } from "@/api/items";
import { projectsApi, type Project } from "@/api/projects";
import { useToastStore } from "@/store/toastStore";
import { useWorkspaceStore } from "@/store/workspaceStore";

// @ts-ignore
import classicTemplate from "../Invoice_Templates/Classic.html?raw";
// @ts-ignore
import minimalTemplate from "../Invoice_Templates/Minimal.html?raw";
// @ts-ignore
import modernTemplate from "../Invoice_Templates/Modern.html?raw";
// @ts-ignore
import executiveTemplate from "../Invoice_Templates/Executive.html?raw";

const templates: Record<string, string> = {
  classic: classicTemplate,
  minimal: minimalTemplate,
  modern: modernTemplate,
  executive: executiveTemplate,
};

interface Item {
  name: string;
  description: string;
  hsn: string;
  price: number;
  qty: number;
  gst: number;
}

interface FormData {
  template: string;
  invoiceNo: string;
  date: string;
  dueDate: string;
  clientName: string;
  clientAddress: string;
  clientEmail: string;
  clientState: string;
  projectId: string;
  logoBase64?: string;
  companyName: string;
  companyAddress: string;
  companyEmail: string;
  companyState: string;
  paymentMethod: string;
  paymentInfo: string;
  terms: string;
  signatureName: string;
  signatureRole: string;
  items: Item[];
  primaryColor: string;
}

const normalizeState = (state?: string) => {
  if (!state) return "";
  return state.replace(/^\d+[\s-]*\s*/, '').trim().toLowerCase();
};

export default function DocumentBuilderPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const type = searchParams.get("type") || "invoice";
  const initialTemplate = searchParams.get("template") || "classic";
  const templateId = searchParams.get("templateId");
  const addToast = useToastStore((s) => s.addToast);
  
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const draftKey = `docBuilderDraft_${type}`;
  const savedDraft = sessionStorage.getItem(draftKey);
  const parsedDraft = savedDraft ? JSON.parse(savedDraft) : null;

  const { register, control, watch, handleSubmit, setValue } = useForm<FormData>({
    defaultValues: parsedDraft || {
      template: initialTemplate,
      invoiceNo: "INV-001",
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      clientName: "Acme Corp",
      clientAddress: "123 Business St, NY",
      clientEmail: "billing@acme.com",
      clientState: "Maharashtra",
      projectId: "",
      logoBase64: "",
      companyName: "Laralink Ltd",
      companyAddress: "86-90 Paul Street, London\nEngland EC2A 4NE",
      companyEmail: "demo@gmail.com",
      companyState: "Maharashtra",
      paymentMethod: "Paypal, Western Union",
      paymentInfo: "Credit Card - 236***********928\nAmount: ₹1732",
      terms: "All claims relating to quantity or shipping errors shall be waived by Buyer unless made in writing to\nSeller within thirty (30) days after delivery of goods to the address stated.",
      signatureName: "Jhon Donate",
      signatureRole: "Accounts Manager",
      items: [
        { name: "Web Development", description: "Frontend and Backend", hsn: "998311", price: 1500, qty: 1, gst: 18 }
      ],
      primaryColor: "#007aff",
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  const formData = watch();

  useEffect(() => {
    sessionStorage.setItem(draftKey, JSON.stringify(formData));
  }, [formData, draftKey]);

  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const { globalWorkspaceId, workspaces, fetchWorkspaces } = useWorkspaceStore();
  const activeWorkspace = workspaces.find(w => w.id === globalWorkspaceId) || (workspaces.length > 0 ? workspaces[0] : null);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  // Auto-fill workspace data & logo
  useEffect(() => {
    if (workspaces.length > 0 && activeWorkspace) {
      // Auto-connect workspace logo if available
      const wsLogo = activeWorkspace.logoUrl || "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=120&h=120&fit=crop";
      if (!formData.logoBase64 || formData.logoBase64.includes("placehold.co")) {
        setValue("logoBase64", wsLogo);
      }
      
      if (activeWorkspace.displayName) {
        setValue("companyName", activeWorkspace.displayName);
      }
      if (activeWorkspace.contactEmail) {
        setValue("companyEmail", activeWorkspace.contactEmail);
      }
        
        const addressParts = [
          activeWorkspace.address,
          activeWorkspace.city,
          activeWorkspace.postalCode,
          activeWorkspace.country
        ].filter(Boolean);
        
        if (addressParts.length > 0) {
          setValue("companyAddress", addressParts.join(", "));
        }
        
        if (activeWorkspace.state) {
          setValue("companyState", activeWorkspace.state);
        }
        
        // Auto-fill sequential document number
        let prefix = "";
        let seq = 1;
        if (type === "estimate") {
          prefix = activeWorkspace.estimatePrefix || "EST";
          seq = activeWorkspace.estimateNextSeq || 1;
        } else if (type === "po") {
          prefix = activeWorkspace.poPrefix || "PO";
          seq = activeWorkspace.poNextSeq || 1;
        } else {
          prefix = activeWorkspace.invoicePrefix || "INV";
          seq = activeWorkspace.invoiceNextSeq || 1;
        }
        const paddedSeq = String(seq).padStart(3, '0');
        setValue("invoiceNo", `${prefix}-${paddedSeq}`);
      }
  }, [globalWorkspaceId, workspaces, activeWorkspace, setValue, type, formData.logoBase64]);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const wsId = globalWorkspaceId === "all" ? undefined : globalWorkspaceId;
        const clientRes = await clientsApi.list({ workspaceId: wsId });
        if (clientRes.data.success) {
          setClients(clientRes.data.data || []);
        }
      } catch (err) {
        console.error("Failed to load clients", err);
      }
    };
    fetchClients();
  }, [globalWorkspaceId]);

  useEffect(() => {
    if (selectedClientId) {
      projectsApi.list({ clientId: selectedClientId }).then(res => {
        if (res.data.success) setProjects(res.data.data || []);
      }).catch(err => console.error(err));
    } else {
      setProjects([]);
    }
  }, [selectedClientId]);

  const [itemCodes, setItemCodes] = useState<ItemCode[]>([]);

  useEffect(() => {
    const fetchItemCodes = async () => {
      try {
        const res = await itemsApi.list();
        if (res.data.success) {
          setItemCodes(res.data.data);
        }
      } catch (err) {
        console.error("Failed to load item codes", err);
      }
    };
    fetchItemCodes();
  }, []);

  const [customTemplate, setCustomTemplate] = useState<any>(null);

  useEffect(() => {
    if (templateId) {
      templatesApi.get(templateId).then(res => {
        if (res.data.success && res.data.data) {
            const tmpl = res.data.data;
            setCustomTemplate(tmpl);
            if (tmpl.customHtml) {
              const match = tmpl.customHtml.match(/<meta name="template-config" content="(.*?)" \/>/);
              if (match && match[1]) {
                try {
                  const config = JSON.parse(match[1].replace(/&quot;/g, '"'));
                  if (config.color) setValue('primaryColor', config.color);
                } catch (e) {}
              }
            }
            setValue('template', 'custom');
          }
        });
    }
  }, [templateId, setValue]);

  // Calculate totals
  const taxAmount = formData.items.reduce((acc, item) => acc + (item.price * item.qty * ((item.gst || 0) / 100)), 0);
  const subtotal = formData.items.reduce((acc, item) => acc + (item.price * item.qty * (1 + (item.gst || 0) / 100)), 0);
  const total = subtotal + taxAmount;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setValue("logoBase64", event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  let docTitle = "INVOICE";
  let numberLabel = "Invoice No";
  let dateLabel = "Date";
  let dueDateLabel = "Due Date";
  let clientLabel = "Invoice To";
  let companyLabel = "Pay To";

  if (type === "po") {
    docTitle = "PURCHASE ORDER";
    numberLabel = "PO Number";
    dateLabel = "Order Date";
    dueDateLabel = "Expected Delivery";
    clientLabel = "Vendor Info";
    companyLabel = "Deliver To";
  } else if (type === "estimate") {
    docTitle = "ESTIMATE";
    numberLabel = "Estimate No";
    dateLabel = "Issue Date";
    dueDateLabel = "Valid Until";
    clientLabel = "Prepared For";
    companyLabel = "Prepared By";
  }

  // 1. Load template into iframe when template changes
  useEffect(() => {
    if (!iframeRef.current) return;
    
    let rawHtml = "";
    if (formData.template === "custom" && customTemplate) {
      rawHtml = customTemplate.customHtml || "";
      if (customTemplate.customCss) {
        rawHtml = rawHtml.replace('</head>', `${customTemplate.customCss}</head>`);
      }
    } else {
      rawHtml = templates[formData.template] || templates.classic || "";
    }
    
    // Dynamically replace hardcoded labels based on type
    rawHtml = rawHtml.replace(/Invoice No:/g, `${numberLabel}:`);
    rawHtml = rawHtml.replace(/>NO:\s*/g, `>${numberLabel}: `);
    rawHtml = rawHtml.replace(/Date:/g, `${dateLabel}:`);
    rawHtml = rawHtml.replace(/Due Date:/g, `${dueDateLabel}:`);
    rawHtml = rawHtml.replace(/Invoice To:/g, `${clientLabel}:`);
    rawHtml = rawHtml.replace(/>Bill To:</g, `>${clientLabel}:<`);
    rawHtml = rawHtml.replace(/Pay To:/g, `${companyLabel}:`);
    rawHtml = rawHtml.replace(/>From:</g, `>${companyLabel}:<`);

    // Inject dynamic data spans for reliable hydration across all templates
    rawHtml = rawHtml.replace(/#LL93784/g, '<span class="dyn-inv-no"></span>');
    rawHtml = rawHtml.replace(/01\.07\.2022/g, '<span class="dyn-date"></span>');
    rawHtml = rawHtml.replace(/30\.07\.2022/g, '<span class="dyn-due-date"></span>');

    // Dynamically inject custom primary color by overriding template defaults
    rawHtml = rawHtml.replace(/#007aff/gi, formData.primaryColor); // Classic/Minimal primary
    rawHtml = rawHtml.replace(/#003b8e/gi, formData.primaryColor); // Modern primary
    rawHtml = rawHtml.replace(/#0056b3/gi, formData.primaryColor); // Modern gradient secondary
    rawHtml = rawHtml.replace(/#4A2E2B/gi, formData.primaryColor); // Executive primary
    rawHtml = rawHtml.replace(/#4a2e2b/gi, formData.primaryColor); // Executive primary lowercase

    // Replace placeholder logo with actual logo
    if (formData.logoBase64) {
      rawHtml = rawHtml.replace(/https:\/\/placehold\.co\/200x50\/000000\/FFFFFF\/png\?text=LOGO/g, formData.logoBase64);
    }
     
    const iframeDoc = iframeRef.current.contentDocument;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(rawHtml || "");
      iframeDoc.close();
      
      // Give the iframe a tiny bit of time to parse the DOM before we hydrate it
      setTimeout(() => {
        hydrateIframeDOM();
      }, 50);
    }
  }, [formData.template, type, formData.primaryColor, customTemplate]);

  // 2. Hydrate the DOM in place when form data changes
  const hydrateIframeDOM = () => {
    if (!iframeRef.current) return;
    const doc = iframeRef.current.contentDocument;
    if (!doc) return;

    // Title / Type
    const titleEl = doc.querySelector('.tm_invoice_right .tm_f50, .modern-header h1, .executive-header h1, .executive-title');
    if (titleEl) {
      titleEl.textContent = docTitle;
    }

    // Logo
    const logoImg = doc.querySelector('.tm_logo img, .company-logo img, img[alt="Logo"]') as HTMLImageElement | null;
    if (logoImg && formData.logoBase64) {
      logoImg.src = formData.logoBase64;
    }

    // Invoice Details
    doc.querySelectorAll('.dyn-inv-no').forEach(el => el.textContent = `#${formData.invoiceNo}`);
    doc.querySelectorAll('.dyn-date').forEach(el => el.textContent = formData.date);
    doc.querySelectorAll('.dyn-due-date').forEach(el => el.textContent = formData.dueDate);

    // Helper to find the paragraph following a specific label
    const updateInfoBlock = (labelText: string, newHtml: string) => {
      const labels = Array.from(doc.querySelectorAll('h3, h4, p, b'));
      const labelEl = labels.find(el => el.textContent?.trim().toLowerCase().startsWith(labelText.toLowerCase()));
      
      let targetP = null;
      if (labelEl) {
        if (labelEl.tagName.toLowerCase() === 'b' && labelEl.parentElement?.tagName.toLowerCase() === 'p') {
          targetP = labelEl.parentElement.nextElementSibling;
        } else {
          targetP = labelEl.nextElementSibling;
        }
      }
      if (targetP && targetP.tagName.toLowerCase() === 'p') {
        targetP.innerHTML = newHtml;
      }
    };

    const isIntraState = normalizeState(formData.companyState) === normalizeState(formData.clientState);

    updateInfoBlock(clientLabel, `${formData.clientName} <br> ${formData.clientAddress.replace(/\n/g, '<br>')} <br> ${formData.clientEmail} <br> <b>State:</b> ${formData.clientState}`);
    updateInfoBlock(companyLabel, `${formData.companyName} <br> ${formData.companyAddress.replace(/\n/g, '<br>')} <br> ${formData.companyEmail} <br> <b>State:</b> ${formData.companyState}`);
    updateInfoBlock("Payment info", formData.paymentInfo.replace(/\n/g, '<br>'));
    updateInfoBlock("Terms & Conditions", formData.terms.replace(/\n/g, '<br>'));

    // Payment Method (inline text node after <b>)
    const bEls = Array.from(doc.querySelectorAll('b'));
    const pmLabel = bEls.find(el => el.textContent?.trim().startsWith("Payment Method"));
    if (pmLabel && pmLabel.nextSibling) {
      pmLabel.nextSibling.textContent = ` ${formData.paymentMethod}`;
    }

    // Signature Block
    const signImg = doc.querySelector('img[alt="Sign"], img[alt="Signature"]');
    if (signImg && signImg.parentElement) {
      const pTags = Array.from(signImg.parentElement.querySelectorAll('p'));
      if (pTags.length >= 2) {
        if (pTags[0]) pTags[0].textContent = formData.signatureName;
        if (pTags[1]) pTags[1].textContent = formData.signatureRole;
      }
    }

    // Active base design for hydration logic
    const activeDesign = formData.template === "custom" ? customTemplate?.design?.toLowerCase() || "classic" : formData.template;

    // Fix Classic.html blue banner width for longer labels
    if (activeDesign === "classic") {
      const sep = doc.querySelector('.tm_invoice_seperator') as HTMLElement | null;
      if (sep) {
        // Set to 85% to ensure the entire label text is fully covered by the blue banner
        if (type === 'estimate') {
          sep.style.width = '85%';
        } else if (type === 'po') {
          sep.style.width = '85%';
        } else {
          // Increased to 85% to ensure the entire 'Invoice No' text is fully covered
          sep.style.width = '85%';
        }
      }
    }

    // Replace items
    const tbody = doc.querySelector('.tm_table tbody, .modern-table tbody');
    if (tbody) {
      // Remove old item rows (rows without colspan)
      const existingRows = Array.from(tbody.querySelectorAll('tr'));
      const itemRows = existingRows.filter(tr => !tr.querySelector('td[colspan]'));
      itemRows.forEach(tr => tr.remove());
      
      // Insert new items before the first remaining total row
      const firstTotalRow = tbody.querySelector('tr');
      
      formData.items.forEach((item, index) => {
        const tr = doc.createElement('tr');
        if (activeDesign === "modern") {
          tr.innerHTML = `
            <td>${index + 1}. ${item.name}</td>
            <td>${item.description}</td>
            <td style="text-align: center;">${item.hsn || ''}</td>
            <td style="text-align: center;">₹${Number(item.price).toFixed(2)}</td>
            <td style="text-align: center;">${item.qty}</td>
            <td style="text-align: center;">${item.gst || 0}%</td>
            <td style="text-align: center;">₹${((Number(item.price) * Number(item.qty)) * (1 + (item.gst || 0) / 100)).toFixed(2)}</td>
          `;
        } else if (activeDesign === "executive") {
          tr.innerHTML = `
            <td style="font-weight: 700; color: #2B1810; padding: 12px 10px;">${index + 1}. ${item.name}</td>
            <td style="color: #6B5E59; padding: 12px 10px;">${item.description}</td>
            <td style="text-align: center; color: #6B5E59; padding: 12px 10px;">${item.hsn || ''}</td>
            <td style="text-align: center; font-weight: 600; padding: 12px 10px;">₹${Number(item.price).toFixed(2)}</td>
            <td style="text-align: center; padding: 12px 10px;">${item.qty}</td>
            <td style="text-align: center; padding: 12px 10px;">${item.gst || 0}%</td>
            <td style="text-align: right; font-weight: 700; color: #2B1810; padding: 12px 10px;">₹${((Number(item.price) * Number(item.qty)) * (1 + (item.gst || 0) / 100)).toFixed(2)}</td>
          `;
        } else {
          tr.innerHTML = `
            <td class="tm_width_3">${index + 1}. ${item.name}</td>
            <td class="tm_width_3">${item.description}</td>
            <td class="tm_width_2">${item.hsn || ''}</td>
            <td class="tm_width_2">₹${Number(item.price).toFixed(2)}</td>
            <td class="tm_width_1">${item.qty}</td>
            <td class="tm_width_1">${item.gst || 0}%</td>
            <td class="tm_width_2 tm_text_right">₹${((Number(item.price) * Number(item.qty)) * (1 + (item.gst || 0) / 100)).toFixed(2)}</td>
          `;
        }
        
        if (firstTotalRow) {
          tbody.insertBefore(tr, firstTotalRow);
        } else {
          tbody.appendChild(tr);
        }
      });
    }

    // Totals - Cross Template
    const findTotalRow = (labelMatch: string) => {
      const tds = Array.from(doc.querySelectorAll('td'));
      for (const td of tds) {
        if (td.textContent?.trim().toLowerCase().includes(labelMatch.toLowerCase())) {
          return td.parentElement;
        }
      }
      return null;
    };
    
    const updateVal = (row: HTMLElement | null, text: string) => {
        if (!row) return;
        const valTd = row.lastElementChild;
        if (valTd) {
            const b = valTd.querySelector('b');
            if (b) b.textContent = text;
            else valTd.textContent = text;
        }
    };

    const updateLabel = (row: HTMLElement | null, text: string) => {
        if (!row) return;
        const tds = Array.from(row.querySelectorAll('td'));
        if (tds.length >= 2) {
            const labelTd = tds[tds.length - 2];
            if (labelTd) {
                const b = labelTd.querySelector('b');
                if (b) b.textContent = text;
                else labelTd.textContent = text;
            }
        }
    };

    const subtotalRow = findTotalRow('Subtoal') || findTotalRow('Sub Total');
    updateVal(subtotalRow, `₹${subtotal.toFixed(2)}`);

    const taxRow = findTotalRow('Total GST') || findTotalRow('Tax') || findTotalRow('CGST') || findTotalRow('IGST');
    
    // Clean up any previously injected SGST row to prevent duplicates on re-render
    const possibleSgstRow = findTotalRow('SGST');
    if (possibleSgstRow) possibleSgstRow.remove();

    if (taxRow) {
      if (isIntraState) {
        const cgstAmount = taxAmount / 2;
        const sgstAmount = taxAmount / 2;
        
        updateVal(taxRow, `+₹${cgstAmount.toFixed(2)}`);
        updateLabel(taxRow, `CGST`);
        
        const sgstRow = taxRow.cloneNode(true) as HTMLElement;
        updateVal(sgstRow, `+₹${sgstAmount.toFixed(2)}`);
        updateLabel(sgstRow, `SGST`);
        taxRow.parentNode?.insertBefore(sgstRow, taxRow.nextSibling);
      } else {
        updateVal(taxRow, `+₹${taxAmount.toFixed(2)}`);
        updateLabel(taxRow, `IGST`);
      }
    }

    const totalRow = findTotalRow('Grand Total');
    updateVal(totalRow, `₹${total.toFixed(2)}`);
    
    // Hide discount row in Minimal template
    const discountRow = findTotalRow('Discount');
    if (discountRow) {
      (discountRow as HTMLElement).style.display = 'none';
    }

    // Hide the native print/download buttons across all templates
    const btns = doc.querySelector('.tm_invoice_btns') as HTMLElement;
    if (btns) btns.style.display = 'none';

    // Hide the "Note" block specifically in the Modern template
    if (activeDesign === 'modern') {
      const noteLabel = Array.from(doc.querySelectorAll('h4')).find(el => el.textContent?.trim() === 'Note:');
      if (noteLabel && noteLabel.parentElement) {
        noteLabel.parentElement.style.display = 'none';
      }
    }
  };

  // Run hydration whenever form data changes
  useEffect(() => {
    hydrateIframeDOM();
  }, [formData, type, subtotal, taxAmount, total]);

  const handleDownload = () => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) return;
    
    // Always use the native print dialog for reliable PDF generation
    // The internal template scripts (html2canvas) often fail to load in the iframe context
    iframeRef.current.contentWindow.print();
  };

  const handleSave = async (data: FormData) => {
    let matchedClientId = undefined;
    if (data.clientName) {
      const selected = clients.find(c => c.name === data.clientName);
      if (selected) matchedClientId = selected.id;
    }

    try {
      const payload = {
        projectId: data.projectId || undefined,
        clientId: matchedClientId,
        type: type === "po" ? "PURCHASE_ORDER" : type === "estimate" ? "QUOTATION" : "INVOICE",
        title: data.invoiceNo || `${type.toUpperCase()} - ${data.clientName}`,
        amount: total,
        currency: "INR",
        status: "DRAFT",
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
        workspaceId: globalWorkspaceId === "all" ? undefined : globalWorkspaceId,
        metadata: {
          builderData: data,
          lineItems: data.items.map(item => ({
            description: item.name + (item.description ? ` - ${item.description}` : ''),
            hsn: item.hsn,
            qty: item.qty,
            rate: item.price,
            gst: item.gst || 0
          })),
          companyState: data.companyState,
          clientState: data.clientState,
          isIntraState: normalizeState(data.companyState) === normalizeState(data.clientState),
          taxType: (normalizeState(data.companyState) === normalizeState(data.clientState)) ? "INTRA" : "INTER",
          subtotal,
          taxAmount,
          totalGst: taxAmount,
          total,
          generatedHtml: iframeRef.current?.contentDocument?.documentElement.outerHTML || ""
        }
      };
      
      const res = await financeApi.create(payload);
      if (res.data.success) {
        addToast("Document Saved!", "success");
        navigate("/finance");
      }
    } catch (err) {
      addToast("Failed to save document", "error");
    }
  };

  const typeDisplay = type === "po" ? "Purchase Order" : type === "estimate" ? "Estimate" : "Invoice";

  return (
    <div className="flex h-screen w-full bg-white overflow-hidden">
      {/* Left Pane: Form */}
      <div className="w-[45%] h-full flex flex-col border-r border-gray-200 bg-white z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        {/* Header */}
        <div className="h-16 px-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate("/finance")}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">Create {typeDisplay}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleDownload}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" /> Download PDF
            </button>
            <button 
              onClick={handleSubmit(handleSave)}
              className="px-4 py-2 bg-[#5438FF] hover:bg-[#4328E0] text-white text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors"
            >
              <Save className="w-4 h-4" /> Save
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          
          {/* Template Selection */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <LayoutTemplate className="w-4 h-4" /> Design Template
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500">Theme Color</span>
                <input type="color" {...register("primaryColor")} className="w-6 h-6 p-0 border-0 rounded cursor-pointer" />
              </div>
            </div>

            {customTemplate && (
              <button
                type="button"
                onClick={() => setValue("template", "custom")}
                className={`w-full px-4 py-2.5 text-sm font-bold rounded-xl border transition-all ${
                  formData.template === "custom"
                    ? "bg-[#EEF0FF] text-[#5438FF] border-[#5438FF]"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                }`}
              >
                Custom Design ({customTemplate.title})
              </button>
            )}

            <div className="grid grid-cols-4 gap-3">
              {["classic", "minimal", "modern", "executive"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setValue("template", t)}
                  className={`border-2 rounded-xl p-3 text-center transition-all ${formData.template === t ? 'border-[#5438FF] bg-[#5438FF]/5 text-[#5438FF]' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                >
                  <span className="font-semibold capitalize text-sm">{t}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Details */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Document Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Company Logo</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                    {formData.logoBase64 ? (
                      <img src={formData.logoBase64} alt="Logo preview" className="w-full h-full object-contain p-1" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 hover:border-[#5438FF] hover:text-[#5438FF] rounded-lg text-xs font-bold transition-colors shadow-sm">
                        <Upload className="w-3.5 h-3.5" /> {formData.logoBase64 ? "Change Photo / Logo" : "Upload Logo"}
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                      </label>
                      {activeWorkspace?.logoUrl && formData.logoBase64 !== activeWorkspace.logoUrl && (
                        <button
                          type="button"
                          onClick={() => setValue("logoBase64", activeWorkspace.logoUrl)}
                          className="px-2.5 py-2 text-xs font-medium text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                          title="Reset to current workspace logo"
                        >
                          Reset to Workspace
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1.5">PNG, JPG up to 2MB (Auto-connected from {activeWorkspace?.displayName || "current workspace"})</p>
                  </div>
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">{numberLabel}</label>
                <input {...register("invoiceNo")} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#5438FF]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{dateLabel}</label>
                <input type="date" {...register("date")} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#5438FF]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{dueDateLabel}</label>
                <input type="date" {...register("dueDate")} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#5438FF]" />
              </div>
            </div>
          </section>

          {/* Client Info */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">{clientLabel}</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Client Name</label>
                <input 
                  list="client-names"
                  {...register("clientName", {
                    onChange: (e) => {
                      const selected = clients.find(c => c.name === e.target.value);
                      if (selected) {
                        setValue("clientEmail", selected.email || "");
                        setValue("clientAddress", selected.address || "");
                        const addrParts = (selected.address || "").split(",").map(s => s.trim());
                        setValue("clientState", selected.state || addrParts[1] || "");
                        setSelectedClientId(selected.id);
                      } else {
                        setSelectedClientId("");
                      }
                    }
                  })} 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#5438FF]" 
                  autoComplete="off"
                />
                <datalist id="client-names">
                  {clients.map(c => (
                    <option key={c.id} value={c.name} />
                  ))}
                </datalist>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">State</label>
                <input {...register("clientState")} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#5438FF]" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Project</label>
                <select {...register("projectId")} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#5438FF] bg-white">
                  <option value="">Select Project (Optional)</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
                <input {...register("clientEmail")} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#5438FF]" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Address</label>
                <textarea {...register("clientAddress")} rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#5438FF] resize-none" />
              </div>
            </div>
          </section>

          {/* Company Info */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">{companyLabel}</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Company Name</label>
                <input {...register("companyName")} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#5438FF]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">State</label>
                <input {...register("companyState")} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#5438FF]" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
                <input {...register("companyEmail")} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#5438FF]" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Address</label>
                <textarea {...register("companyAddress")} rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#5438FF] resize-none" />
              </div>
            </div>
          </section>

          {/* Payment & Terms */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Additional Info</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Payment Method (Header)</label>
                <input {...register("paymentMethod")} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#5438FF]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Payment Info (Footer)</label>
                <textarea {...register("paymentInfo")} rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#5438FF] resize-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Terms & Conditions</label>
                <textarea {...register("terms")} rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#5438FF] resize-none" />
              </div>
            </div>
          </section>

          {/* Signature */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Signature</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Name</label>
                <input {...register("signatureName")} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#5438FF]" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Role / Title</label>
                <input {...register("signatureRole")} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#5438FF]" />
              </div>
            </div>
          </section>

          {/* Items */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Line Items</h2>
              <button 
                type="button"
                onClick={() => append({ name: "", description: "", hsn: "", price: 0, qty: 1, gst: 18 })}
                className="text-xs font-bold text-[#5438FF] flex items-center gap-1 hover:text-[#4328E0]"
              >
                <Plus className="w-3 h-3" /> Add Item
              </button>
            </div>
            
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="p-4 border border-gray-100 bg-gray-50/50 rounded-xl space-y-3 relative group">
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      type="button" 
                      onClick={() => remove(index)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-md"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-12">
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Item Name</label>
                      <input 
                        list={`item-codes-list-${index}`}
                        {...register(`items.${index}.name` as const, {
                          onChange: (e) => {
                            const selected = itemCodes.find(i => i.name === e.target.value);
                            if (selected) {
                              setValue(`items.${index}.hsn`, selected.code);
                            }
                          }
                        })} 
                        className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm focus:outline-none focus:border-[#5438FF]" 
                        autoComplete="off"
                      />
                      <datalist id={`item-codes-list-${index}`}>
                        {itemCodes.map(c => (
                          <option key={c.id} value={c.name} />
                        ))}
                      </datalist>
                    </div>
                    <div className="col-span-8">
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Description</label>
                      <input {...register(`items.${index}.description` as const)} className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm focus:outline-none focus:border-[#5438FF]" />
                    </div>
                    <div className="col-span-4">
                      <label className="block text-xs font-semibold text-gray-500 mb-1">HSN/SAC</label>
                      <input {...register(`items.${index}.hsn` as const)} className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm focus:outline-none focus:border-[#5438FF]" />
                    </div>
                    <div className="col-span-3">
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Qty</label>
                      <input type="number" {...register(`items.${index}.qty` as const, { valueAsNumber: true })} className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm focus:outline-none focus:border-[#5438FF]" />
                    </div>
                    <div className="col-span-5">
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Price (₹)</label>
                      <input type="number" {...register(`items.${index}.price` as const, { valueAsNumber: true })} className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm focus:outline-none focus:border-[#5438FF]" />
                    </div>
                    <div className="col-span-4">
                      <label className="block text-xs font-semibold text-gray-500 mb-1">GST (%)</label>
                      <input type="number" {...register(`items.${index}.gst` as const, { valueAsNumber: true })} className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm focus:outline-none focus:border-[#5438FF]" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Financials */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Financials</h2>
            
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2 mt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total GST</span>
                <span className="font-semibold">₹{taxAmount.toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t border-gray-200 flex justify-between text-base font-bold text-[#5438FF]">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Right Pane: Live Preview */}
      <div className="w-[55%] h-full bg-[#f8f9fc] flex flex-col relative">
        <div className="h-16 px-6 flex items-center justify-between border-b border-gray-200 bg-[#f8f9fc]">
          <h2 className="text-sm font-bold text-gray-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Live Preview
          </h2>
        </div>
        
        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar flex justify-center">
          <div className="w-full max-w-[800px] h-full shadow-2xl bg-white relative transition-all duration-300">
            <iframe 
              ref={iframeRef}
              title="Document Preview" 
              className="w-full h-full border-none absolute inset-0"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
