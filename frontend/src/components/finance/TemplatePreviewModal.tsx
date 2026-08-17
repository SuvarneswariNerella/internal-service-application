
import { X, ShieldCheck } from 'lucide-react';
import { Workspace } from '@/api/workspaces';

interface TemplatePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: any | null; // From TemplateLibraryView
  workspace: Workspace | null;
}

export default function TemplatePreviewModal({ isOpen, onClose, template, workspace }: TemplatePreviewModalProps) {
  if (!isOpen || !template) return null;
  
  // If the currentRecord has no items, we can optionally provide a dummy item so the preview isn't entirely blank.
  const items = [
    { name: "Sample Service / Product", description: "This is a placeholder item for preview purposes.", hsn: "998311", quantity: 1, rate: 1000, tax: 18 }
  ];
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const clientName = "Sample Client";
  const workspaceName = workspace?.displayName || "Workspace Name Not Set";
  
  // Calculate Totals
  const baseTotal = items.reduce((acc: number, item: any) => acc + ((item.quantity || 0) * (item.rate || 0)), 0);
  const taxPercentage = 18;
  const subtotal = items.reduce((acc: number, item: any) => acc + (((item.quantity || 0) * (item.rate || 0)) * (1 + taxPercentage / 100)), 0);
  const taxAmount = (baseTotal * taxPercentage) / 100;
  const total = subtotal + taxAmount;
  
  // Dummy state for preview
  const isIntraState = true;

  // Formatting dates
  const issueDate = template.createdAt ? new Date(template.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  const dueDateStr = "30 Days Net";

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-gray-900/50 backdrop-blur-sm p-4 sm:p-6 md:p-12 animate-in fade-in duration-200">
      
      {/* Modal Header */}
      <div className="bg-white rounded-t-2xl shadow-sm border-b border-gray-100 flex items-center justify-between px-6 py-4 mx-auto w-full max-w-5xl flex-shrink-0">
        <div>
          <h2 className="text-lg font-extrabold text-gray-900">Live Template Preview</h2>
          <p className="text-xs font-medium text-gray-500 mt-0.5">{workspaceName} {template.type} ({template.design})</p>
        </div>
        <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Modal Body / Scrollable Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50/50 rounded-b-2xl mx-auto w-full max-w-5xl shadow-2xl relative custom-scrollbar p-4 md:p-8">
        
        {/* Invoice Paper Document */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 md:p-12 max-w-4xl mx-auto">
          
          {/* Document Header */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
            <div className="flex gap-4 items-start">
              {workspace?.logoUrl ? (
                <img src={workspace.logoUrl} alt="Logo" className="w-16 h-16 rounded-xl object-contain border border-gray-200 p-1 bg-white shadow-sm" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center font-bold text-2xl shadow-sm">
                  {workspaceName.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="text-xl font-extrabold text-gray-900 mb-1">{workspaceName}</h1>
                <p className="text-xs text-gray-500 font-medium leading-relaxed max-w-xs">
                  {workspace?.address || "Address not provided in workspace settings."}
                </p>
                {workspace?.gstin && (
                  <p className="text-[11px] font-bold text-gray-600 mt-1 uppercase">GSTIN: {workspace.gstin}</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-blue-600 text-white text-[10px] font-extrabold tracking-widest uppercase rounded-full shadow-sm mb-3">
                {template.type?.replace('_', ' ') || 'DOCUMENT'}
              </span>
              <h2 className="text-lg font-extrabold text-gray-900 mb-1">{template.title || "DOC-001"}</h2>
              <p className="text-[11px] text-gray-500 font-medium">Issue: {issueDate} | Due: {dueDateStr}</p>
            </div>
          </div>

          {/* Client & Tax Info Box */}
          <div className="bg-gray-50 rounded-xl border border-gray-100 p-6 flex flex-col md:flex-row justify-between gap-6 mb-10">
            <div>
              <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">Client Account:</p>
              <h3 className="text-sm font-extrabold text-gray-900 mb-1">{clientName}</h3>
            </div>
            <div className="md:text-right flex flex-col md:items-end justify-center">
              <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1.5">GST Tax Supply:</p>
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-full text-[11px] font-bold ${isIntraState ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                <ShieldCheck className="w-3.5 h-3.5" />
                {isIntraState ? "Intra-State (CGST+SGST)" : "Inter-State (IGST)"}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-10 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-y border-gray-200">
                  <th className="py-3 px-4 text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">Item Description</th>
                  <th className="py-3 px-4 text-[10px] font-extrabold text-gray-500 uppercase tracking-widest text-right">Qty</th>
                  <th className="py-3 px-4 text-[10px] font-extrabold text-gray-500 uppercase tracking-widest text-right">HSN/SAC</th>
                  <th className="py-3 px-4 text-[10px] font-extrabold text-gray-500 uppercase tracking-widest text-right">Rate</th>
                  <th className="py-3 px-4 text-[10px] font-extrabold text-gray-500 uppercase tracking-widest text-right">GST %</th>
                  <th className="py-3 px-4 text-[10px] font-extrabold text-gray-500 uppercase tracking-widest text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.length > 0 ? items.map((item: any, idx: number) => (
                  <tr key={idx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-4">
                      <p className="text-xs font-extrabold text-gray-900">{item.name || 'Item Name'}</p>
                      {item.description && <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{item.description}</p>}
                    </td>
                    <td className="py-4 px-4 text-xs font-bold text-gray-900 text-right">{item.quantity}</td>
                    <td className="py-4 px-4 text-xs font-medium text-gray-600 text-right">{item.hsn || '-'}</td>
                    <td className="py-4 px-4 text-xs font-medium text-gray-600 text-right">{formatCurrency(item.rate)}</td>
                    <td className="py-4 px-4 text-xs font-medium text-gray-600 text-right">{taxPercentage}%</td>
                    <td className="py-4 px-4 text-xs font-extrabold text-gray-900 text-right">{formatCurrency((item.quantity * item.rate) * (1 + taxPercentage / 100))}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-gray-500 italic">No line items specified.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals & Notes */}
          <div className="flex flex-col md:flex-row justify-between gap-8">
            <div className="flex-1">
              <h4 className="text-[11px] font-extrabold text-gray-900 mb-2">Bank Wire Remittance & Terms:</h4>
              <p className="text-[10px] text-gray-500 leading-relaxed pr-8">
                Payment due within 30 days. Thank you for your business.
              </p>
            </div>
            
            <div className="w-full md:w-72 bg-gray-50 rounded-xl p-5 border border-gray-100 flex flex-col gap-3">
              <div className="flex justify-between items-center text-xs text-gray-600 font-medium">
                <span>Subtotal:</span>
                <span className="font-extrabold text-gray-900">{formatCurrency(subtotal)}</span>
              </div>
              
              {taxPercentage > 0 && (
                isIntraState ? (
                  <>
                    <div className="flex justify-between items-center text-xs text-gray-600 font-medium">
                      <span>CGST ({(taxPercentage/2).toFixed(1)}%):</span>
                      <span className="font-extrabold text-gray-900">{formatCurrency(taxAmount / 2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-600 font-medium">
                      <span>SGST ({(taxPercentage/2).toFixed(1)}%):</span>
                      <span className="font-extrabold text-gray-900">{formatCurrency(taxAmount / 2)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between items-center text-xs text-gray-600 font-medium">
                    <span>IGST ({taxPercentage.toFixed(1)}%):</span>
                    <span className="font-extrabold text-gray-900">{formatCurrency(taxAmount)}</span>
                  </div>
                )
              )}
              
              <div className="mt-2 pt-3 border-t border-gray-200 flex justify-between items-center bg-blue-600 text-white p-3 rounded-lg shadow-sm shadow-blue-500/20">
                <span className="text-xs font-extrabold">Grand Total:</span>
                <span className="text-sm font-extrabold">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-16 pt-6 border-t border-gray-100 flex justify-between items-center text-[9px] font-medium text-gray-400">
            <span>Computer Generated Document</span>
            <span className="flex items-center gap-1.5 text-blue-600 font-bold">
              Powered by Agency Operations Engine
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}
