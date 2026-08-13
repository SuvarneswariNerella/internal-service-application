import { X, Building2, Upload, ShieldCheck, DollarSign, SlidersHorizontal, Save, Code, Trash2 } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { workspacesApi } from "@/api/workspaces";

interface AddWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'add' | 'edit';
  initialData?: any;
}

export default function AddWorkspaceModal({ isOpen, onClose, mode = 'add', initialData }: AddWorkspaceModalProps) {
  const [formData, setFormData] = useState({
    displayName: "",
    legalName: "",
    shortCode: "",
    contactEmail: "",
    logoUrl: "",
    gstin: "",
    state: "",
    defaultCurrency: "INR",
    bankName: "",
    accountHolder: "",
    accountNumber: "",
    ifscCode: "",
    bankBranch: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
    invoicePrefix: "",
    invoiceNextSeq: 1,
    estimatePrefix: "",
    estimateNextSeq: 1,
    poPrefix: "",
    poNextSeq: 1,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && mode === 'edit' && initialData) {
      setFormData({
        displayName: initialData.displayName || "",
        legalName: initialData.legalName || "",
        shortCode: initialData.shortCode || "",
        contactEmail: initialData.contactEmail || "",
        logoUrl: initialData.logoUrl || "",
        gstin: initialData.gstin || "",
        state: initialData.state || "",
        defaultCurrency: initialData.defaultCurrency || "INR",
        bankName: initialData.bankName || "",
        accountHolder: initialData.accountHolder || "",
        accountNumber: initialData.accountNumber || "",
        ifscCode: initialData.ifscCode || "",
        bankBranch: initialData.bankBranch || "",
        address: initialData.address || "",
        city: initialData.city || "",
        postalCode: initialData.postalCode || "",
        country: initialData.country || "",
        invoicePrefix: initialData.invoicePrefix || "",
        invoiceNextSeq: initialData.invoiceNextSeq || 1,
        estimatePrefix: initialData.estimatePrefix || "",
        estimateNextSeq: initialData.estimateNextSeq || 1,
        poPrefix: initialData.poPrefix || "",
        poNextSeq: initialData.poNextSeq || 1,
      });
    } else if (isOpen && mode === 'add') {
      setFormData({
        displayName: "",
        legalName: "",
        shortCode: "",
        contactEmail: "",
        logoUrl: "",
        gstin: "",
        state: "",
        defaultCurrency: "INR",
        bankName: "",
        accountHolder: "",
        accountNumber: "",
        ifscCode: "",
        bankBranch: "",
        address: "",
        city: "",
        postalCode: "",
        country: "",
        invoicePrefix: "",
        invoiceNextSeq: 1,
        estimatePrefix: "",
        estimateNextSeq: 1,
        poPrefix: "",
        poNextSeq: 1,
      });
    }
  }, [isOpen, mode, initialData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      if (mode === 'edit' && initialData?.id) {
        await workspacesApi.update(initialData.id, formData);
      } else {
        await workspacesApi.create(formData);
      }
      onClose();
      window.location.reload();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Sticky Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between bg-white z-10 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600 font-bold text-lg border border-red-100">
              CO
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900">
                {mode === 'edit' ? "Edit Company Workspace" : "+ Add New Company Workspace"}
              </h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-10 custom-scrollbar">
          
          {/* Section 1: COMPANY IDENTITY & BRANDING */}
          <section>
            <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
              <Building2 className="w-4 h-4 text-indigo-700" />
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">1. Company Identity & Branding</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Company Display Name</label>
                <input type="text" name="displayName" value={formData.displayName} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Legal Registered Entity Name</label>
                <input type="text" name="legalName" value={formData.legalName} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Company Short Code</label>
                <input type="text" name="shortCode" value={formData.shortCode} onChange={handleInputChange} placeholder="e.g. EDU, BIG, VOL, APR" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-mono text-sm placeholder:text-gray-400" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Contact Email Address</label>
                <input type="email" name="contactEmail" value={formData.contactEmail} onChange={handleInputChange} placeholder="billing@company.com" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm placeholder:text-gray-400" />
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-100 rounded-xl p-5">
              <label className="block text-sm font-bold text-gray-900 mb-4">Company Logo (PNG, SVG, WebP)</label>
              <div className="flex items-start gap-6">
                <div className="flex flex-col items-center gap-2 shrink-0">
                  {formData.logoUrl ? (
                    <img src={formData.logoUrl} alt="Logo Preview" className="w-20 h-20 rounded-2xl object-cover shadow-sm border border-gray-200" />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-red-100 flex items-center justify-center text-red-700 font-black text-2xl shadow-sm border border-red-200">
                      CO
                    </div>
                  )}
                  <span className="text-[9px] font-black text-gray-500 uppercase tracking-wider">Live Preview</span>
                </div>
                <div className="flex-1 space-y-4">
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/png, image/svg+xml, image/webp, image/jpeg" className="hidden" />
                  <div className="flex items-center gap-3">
                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm transition-colors shadow-sm">
                      <Upload className="w-4 h-4" />
                      Upload PNG / SVG File
                    </button>
                    {formData.logoUrl && (
                      <button onClick={() => setFormData(prev => ({ ...prev, logoUrl: "" }))} className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg font-bold text-sm transition-colors shadow-sm">
                        <Trash2 className="w-4 h-4" />
                        Remove Logo
                      </button>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Or paste Logo Image URL:</label>
                    <input type="text" name="logoUrl" value={formData.logoUrl} onChange={handleInputChange} placeholder="https://example.com/logo.png or data:image/png;base64,..." className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm font-mono placeholder:text-gray-400 bg-white" />
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Recommended: PNG/SVG image on transparent background. If no logo is uploaded, company initials (CO) will be rendered as fallback across all document templates and PDF exports.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: LEGAL, TAX & DEFAULT CURRENCY */}
          <section>
            <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">2. Legal, Tax & Default Currency</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">GSTIN Number</label>
                <input type="text" name="gstin" value={formData.gstin} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Registered State & Code</label>
                <input type="text" name="state" value={formData.state} onChange={handleInputChange} placeholder="e.g. 27 - Maharashtra" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-gray-400" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Default Invoicing Currency</label>
                <select name="defaultCurrency" value={formData.defaultCurrency} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-bold text-indigo-700 bg-white">
                  <option value="INR">₹ INR (Indian Rupee)</option>
                  <option value="USD">$ USD (US Dollar)</option>
                </select>
              </div>
            </div>

            <div className="mb-4 max-w-sm">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-bold text-gray-700">Default Document Template</label>
                <button className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                  <Code className="w-3 h-3" />
                  Edit HTML/CSS
                </button>
              </div>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-bold text-indigo-700 bg-white">
                <option>Modern — Contemporary Cl...</option>
                <option>Classic — Traditional</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Registered Office Address</label>
              <textarea name="address" value={formData.address} onChange={handleInputChange} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">City</label>
                <input type="text" name="city" value={formData.city} onChange={handleInputChange} placeholder="Mumbai" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-gray-500" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Postal Code</label>
                <input type="text" name="postalCode" value={formData.postalCode} onChange={handleInputChange} placeholder="400001" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-gray-500" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Country</label>
                <input type="text" name="country" value={formData.country} onChange={handleInputChange} placeholder="India" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-gray-500" />
              </div>
            </div>
          </section>

          {/* Section 3: BANK ACCOUNT & SETTLEMENT DETAILS */}
          <section>
            <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
              <DollarSign className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">3. Bank Account & Settlement Details</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Bank Name</label>
                <input type="text" name="bankName" value={formData.bankName} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Account Holder Name</label>
                <input type="text" name="accountHolder" value={formData.accountHolder} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Account Number</label>
                <input type="text" name="accountNumber" value={formData.accountNumber} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">IFSC Code</label>
                <input type="text" name="ifscCode" value={formData.ifscCode} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all uppercase font-mono text-sm" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Branch Name</label>
                <input type="text" name="bankBranch" value={formData.bankBranch} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" />
              </div>
            </div>
          </section>

          {/* Section 4: DOCUMENT NUMBER SERIES & PREFIXES */}
          <section>
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-indigo-700" />
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">4. Document Number Series & Prefixes</h3>
                </div>
                <span className="px-3 py-1 rounded bg-indigo-100 text-indigo-800 text-[10px] font-bold">Auto-Increments Per Company & Type</span>
              </div>
              <p className="text-sm text-gray-600 mb-6 max-w-3xl">
                Set unique prefix patterns for this entity. Document numbers automatically increment independently per document type whenever a new record is created.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Invoice Prefix */}
                <div className="bg-white border border-indigo-100 shadow-sm rounded-xl p-4 flex flex-col">
                  <h4 className="font-bold text-indigo-900 text-sm mb-3">Invoice Prefix Series</h4>
                  <input type="text" name="invoicePrefix" value={formData.invoicePrefix} onChange={handleInputChange} placeholder="e.g. EDU/2026/" className="w-full px-3 py-2 mb-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono text-sm placeholder:text-gray-400" />
                  <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                    <span className="text-xs text-gray-600 font-semibold">Next Sequence:</span>
                    <input type="number" name="invoiceNextSeq" value={formData.invoiceNextSeq} onChange={handleInputChange} className="w-16 px-2 py-1 text-center border border-gray-200 rounded font-bold text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                  </div>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Live Preview:</span>
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded text-xs font-bold font-mono">
                      {formData.invoicePrefix || "DOC-"}{String(formData.invoiceNextSeq).padStart(3, '0')}
                    </span>
                  </div>
                </div>

                {/* Estimate Prefix */}
                <div className="bg-white border border-amber-200 shadow-sm rounded-xl p-4 flex flex-col">
                  <h4 className="font-bold text-amber-900 text-sm mb-3">Estimate Prefix Series</h4>
                  <input type="text" name="estimatePrefix" value={formData.estimatePrefix} onChange={handleInputChange} placeholder="e.g. EDU/EST/2026/" className="w-full px-3 py-2 mb-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-mono text-sm placeholder:text-gray-400" />
                  <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                    <span className="text-xs text-gray-600 font-semibold">Next Sequence:</span>
                    <input type="number" name="estimateNextSeq" value={formData.estimateNextSeq} onChange={handleInputChange} className="w-16 px-2 py-1 text-center border border-gray-200 rounded font-bold text-sm focus:outline-none focus:ring-1 focus:ring-amber-500" />
                  </div>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Live Preview:</span>
                    <span className="px-2 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded text-xs font-bold font-mono">
                      {formData.estimatePrefix || "DOC-"}{String(formData.estimateNextSeq).padStart(3, '0')}
                    </span>
                  </div>
                </div>

                {/* PO Prefix */}
                <div className="bg-white border border-fuchsia-200 shadow-sm rounded-xl p-4 flex flex-col">
                  <h4 className="font-bold text-fuchsia-900 text-sm mb-3">Purchase Order Prefix</h4>
                  <input type="text" name="poPrefix" value={formData.poPrefix} onChange={handleInputChange} placeholder="e.g. EDU/PO/2026/" className="w-full px-3 py-2 mb-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-fuchsia-500 transition-all font-mono text-sm placeholder:text-gray-400" />
                  <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
                    <span className="text-xs text-gray-600 font-semibold">Next Sequence:</span>
                    <input type="number" name="poNextSeq" value={formData.poNextSeq} onChange={handleInputChange} className="w-16 px-2 py-1 text-center border border-gray-200 rounded font-bold text-sm focus:outline-none focus:ring-1 focus:ring-fuchsia-500" />
                  </div>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Live Preview:</span>
                    <span className="px-2 py-1 bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-100 rounded text-xs font-bold font-mono">
                      {formData.poPrefix || "DOC-"}{String(formData.poNextSeq).padStart(3, '0')}
                    </span>
                  </div>
                </div>

              </div>
            </div>
          </section>
        </div>

        {/* Sticky Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4 z-10 shrink-0">
          <p className="text-sm text-gray-600">Changes apply across all future invoices, estimates & PO generation for this entity.</p>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button 
              onClick={onClose}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-bold text-sm transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-colors shadow-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? "Saving..." : mode === 'edit' ? "Save Changes" : "Create Workspace"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
