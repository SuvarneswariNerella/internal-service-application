import { useState } from "react";
import { X, Send, FileText, Loader2 } from "lucide-react";
import { financeApi, FinanceRecord } from "@/api/finance";

interface SendDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: FinanceRecord | null;
  onSuccess: () => void;
}

export default function SendDocumentModal({
  isOpen,
  onClose,
  record,
  onSuccess,
}: SendDocumentModalProps) {
  const defaultEmail = record?.metadata?.clientEmail || "";
  
  const [to, setTo] = useState(defaultEmail);
  const [subject, setSubject] = useState(`Document: ${record?.title || ""}`);
  const [message, setMessage] = useState(
    `Hello,\n\nPlease find attached the document "${record?.title || ""}".\n\nThank you.`
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !record) return null;

  const handleSend = async () => {
    if (!to) {
      setError("Please enter a recipient email address.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await financeApi.sendDocument(record.id, { to, subject, message });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Failed to send document.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-gray-500/20 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#EEF0FF] flex items-center justify-center text-[#5438FF]">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-[#111827]">Send Document</h2>
              <p className="text-sm text-gray-500 font-medium">Email to client directly</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">To (Email)</label>
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="client@example.com"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5438FF]/20 focus:border-[#5438FF] text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5438FF]/20 focus:border-[#5438FF] text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Message</label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#5438FF]/20 focus:border-[#5438FF] text-sm resize-none"
            />
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500">
              <FileText className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{record.title}.pdf</p>
              <p className="text-xs text-gray-500 font-medium">Generated dynamically</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={loading}
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-[#5438FF] hover:bg-[#4327ea] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-indigo-500/20"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Now
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
