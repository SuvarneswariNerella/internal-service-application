import { useState, useEffect } from "react";
import { X, Send } from "lucide-react";
import { format } from "date-fns";
import { maintenanceApi, type MaintenanceRecord } from "@/api/maintenance";
import { useToastStore } from "@/store/toastStore";

interface TicketDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: string | null;
  onUpdate: () => void;
}

export default function TicketDetailModal({ isOpen, onClose, ticketId, onUpdate }: TicketDetailModalProps) {
  const [ticket, setTicket] = useState<MaintenanceRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  
  const addToast = useToastStore((s) => s.addToast);

  const fetchTicket = async () => {
    if (!ticketId) return;
    setIsLoading(true);
    try {
      const res = await maintenanceApi.get(ticketId);
      if (res.data?.success) {
        setTicket(res.data.data || null);
      }
    } catch (err) {
      console.error(err);
      addToast("Failed to load ticket details", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && ticketId) {
      fetchTicket();
    }
  }, [isOpen, ticketId]);

  if (!isOpen || !ticketId) return null;

  const handleStatusChange = async (newStatus: string) => {
    if (!ticket) return;
    try {
      const res = await maintenanceApi.update(ticket.id, { status: newStatus });
      if (res.data?.success && res.data.data) {
        setTicket({ ...ticket, status: newStatus, statusHistory: res.data.data.statusHistory });
      } else {
        setTicket({ ...ticket, status: newStatus });
      }
      onUpdate();
      addToast("Status updated", "success");
    } catch (err) {
      addToast("Failed to update status", "error");
    }
  };

  const submitComment = async () => {
    if (!commentText.trim() || !ticket) return;
    setIsSubmittingComment(true);
    try {
      const res = await maintenanceApi.addComment(ticket.id, commentText);
      if (res.data?.success && res.data.data) {
        setTicket({
          ...ticket,
          comments: [...(ticket.comments || []), res.data.data]
        });
        setCommentText("");
      }
    } catch (err) {
      addToast("Failed to add comment", "error");
    } finally {
      setIsSubmittingComment(false);
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-[16px] shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col font-sans border border-gray-100">
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4 border-b border-gray-100 bg-white shrink-0">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-[#9CA3AF] hover:text-[#4B5563] transition-colors p-1"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-3">
            <span className="bg-[#EBECEF] text-[#4F5B67] px-2.5 py-1 rounded-md text-xs font-semibold">
              {ticket?.ticketNumber || "TKT-1001"}
            </span>
            <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
              ticket?.priority === "CRITICAL" ? "bg-red-50 text-red-600" :
              ticket?.priority === "HIGH" ? "bg-[#FFF4E5] text-[#D97706]" :
              ticket?.priority === "MEDIUM" ? "bg-blue-50 text-blue-600" :
              "bg-gray-50 text-gray-600"
            }`}>
              {ticket?.priority ? ticket.priority.charAt(0) + ticket.priority.slice(1).toLowerCase() : "High"}
            </span>
            <span className="text-[#6B7280] text-[13px] flex items-center gap-1.5 font-medium">
              <span className="w-1 h-1 rounded-full bg-[#9CA3AF]"></span>
              {ticket?.client?.name || ticket?.project?.name || "Future Tech Academy"}
            </span>
          </div>
          
          <h1 className="text-[22px] font-bold text-[#0F172A] leading-tight">
            {ticket?.title || "Website experiencing slow load times on mobile"}
          </h1>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row bg-white">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center p-8 text-gray-500">
              Loading ticket details...
            </div>
          ) : (
            <>
              {/* Left Column */}
              <div className="flex-1 overflow-y-auto p-6 md:border-r border-gray-100 flex flex-col gap-6">
                
                {/* Description */}
                <div>
                  <h3 className="text-[15px] font-bold text-[#111827] mb-2.5">Description</h3>
                  <p className="text-[#6B7280] text-[15px] leading-relaxed whitespace-pre-wrap font-medium">
                    {ticket?.description || "The main website is taking over 10 seconds to load on mobile networks. Needs urgent optimization."}
                  </p>
                </div>

                  <div className="mt-2">
                    <div className="flex items-center gap-2.5 text-[#111827] font-bold text-[15px] mb-4">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                      Status History
                    </div>
                    
                    <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[1.125rem] before:w-0.5 before:bg-slate-200">
                      {/* Ticket Created */}
                      <div className="relative flex items-center gap-4">
                        <div className="flex items-center justify-center w-9 h-9 rounded-full border-[3px] border-white bg-slate-200 text-slate-500 z-10 shrink-0">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="M12 6v6l4 2"></path></svg>
                        </div>
                        <div className="flex-1 p-3 rounded-xl border border-slate-100 bg-slate-50 shadow-sm flex items-center justify-between">
                          <div>
                            <div className="font-bold text-slate-900 text-[13px]">Ticket Created</div>
                            <div className="text-xs text-slate-500 font-medium">Initial state</div>
                          </div>
                          <div className="text-xs text-slate-500 font-medium bg-white px-2 py-1 rounded-md border border-slate-200">
                            {ticket?.createdAt ? format(new Date(ticket.createdAt), "MMM d, h:mm a") : ""}
                          </div>
                        </div>
                      </div>

                      {ticket?.statusHistory?.map((history) => {
                        let formattedDuration = "-";
                        if (history.durationMinutes !== undefined && history.durationMinutes !== null) {
                          const hrs = Math.floor(history.durationMinutes / 60);
                          const mins = history.durationMinutes % 60;
                          formattedDuration = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
                        } else if (!history.exitedAt) {
                           const now = new Date();
                           const durationMs = now.getTime() - new Date(history.enteredAt).getTime();
                           const durationMins = Math.floor(durationMs / 60000);
                           const hrs = Math.floor(durationMins / 60);
                           const mins = durationMins % 60;
                           formattedDuration = hrs > 0 ? `${hrs}h ${mins}m (current)` : `${mins}m (current)`;
                        }

                        return (
                          <div key={history.id} className="relative flex items-center gap-4">
                            <div className="flex items-center justify-center w-9 h-9 rounded-full border-[3px] border-white bg-[#EEF0FF] text-[#5438FF] z-10 shrink-0">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                            </div>
                            <div className="flex-1 p-3 rounded-xl border border-slate-100 bg-white shadow-sm flex items-center justify-between">
                              <div>
                                <div className="font-bold text-slate-900 text-[13px] flex items-center gap-1.5 capitalize">
                                  {history.status.replace(/_/g, " ").toLowerCase()}
                                </div>
                                <div className="text-[11px] text-slate-500 font-medium">
                                  by {history.changedBy?.name || "System"} • {format(new Date(history.enteredAt), "MMM d, h:mm a")}
                                </div>
                              </div>
                              <div className="text-xs font-semibold text-[#5438FF] bg-[#EEF0FF] px-2 py-1 rounded-md">
                                {formattedDuration}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                {/* Activity Thread */}
                <div className="flex-1 flex flex-col min-h-[150px]">
                  <div className="flex items-center gap-2.5 text-[#111827] font-bold text-[15px] mb-4">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                    Activity Thread
                  </div>
                  
                  <div className="flex-1 mb-6 space-y-4">
                    {ticket?.comments?.length === 0 ? (
                      <p className="text-[15px] text-[#6B7280] italic text-center py-6">No comments yet. Start the conversation below.</p>
                    ) : (
                      ticket?.comments?.map(comment => (
                        <div key={comment.id} className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#EEF0FF] flex items-center justify-center shrink-0">
                            <span className="text-[#5438FF] font-bold text-xs">
                              {comment.user?.name?.charAt(0) || "U"}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-baseline gap-2">
                              <span className="font-semibold text-sm text-gray-900">{comment.user?.name}</span>
                              <span className="text-xs text-gray-500">
                                {format(new Date(comment.createdAt), "MMM d, h:mm a")}
                              </span>
                            </div>
                            <div className="mt-1 text-[15px] text-[#4B5563] bg-[#F9FAFB] p-3.5 rounded-xl rounded-tl-none border border-gray-100">
                              {comment.content}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="mt-auto relative">
                    <textarea 
                      placeholder="Type a comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="w-full border border-gray-100 rounded-[12px] pl-4 pr-14 py-3.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#5438FF]/20 focus:border-[#5438FF] resize-none h-[88px] text-[#111827] placeholder:text-[#9CA3AF]"
                    />
                    <button 
                      onClick={submitComment}
                      disabled={isSubmittingComment || !commentText.trim()}
                      className="absolute bottom-3.5 right-3.5 p-2 bg-[#DCE0FF] text-[#5438FF] rounded-lg hover:bg-[#C9CFFF] disabled:opacity-50 disabled:bg-gray-100 disabled:text-gray-400 transition-colors"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="w-full md:w-60 p-6 flex flex-col gap-6 shrink-0 bg-white">
                
                {/* Status Controls */}
                <div>
                  <h3 className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-3">Status Controls</h3>
                  <div className="flex flex-col gap-2.5">
                    {[
                      { id: "NEW", label: "New", dbValue: "NEW" },
                      { id: "IN_PROGRESS", label: "In Progress", dbValue: "IN_PROGRESS" },
                      { id: "PENDING", label: "Waiting on Client", dbValue: "PENDING" },
                      { id: "RESOLVED", label: "Resolved", dbValue: "RESOLVED" },
                      { id: "CANCELLED", label: "Closed", dbValue: "CANCELLED" }
                    ].map(status => {
                      const isActive = ticket?.status === status.dbValue || (ticket?.status === 'NEW' && status.id === 'NEW');
                      return (
                        <button
                          key={status.id}
                          onClick={() => handleStatusChange(status.dbValue)}
                          className={`flex items-center justify-between px-4 py-2.5 rounded-lg border text-[14px] font-medium transition-all ${
                            isActive 
                              ? "bg-[#EEF0FF] border-[#DCE0FF] text-[#4328E0]" 
                              : "bg-white border-gray-100 text-[#374151] hover:bg-gray-50"
                          }`}
                        >
                          {status.label}
                          {isActive && (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#5438FF]">
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                              <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {/* Assignee */}
                <div>
                  <h3 className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-2">Assignee</h3>
                  <div className="flex items-center gap-2">
                    {ticket?.assignee || ticket?.assigneeName ? (
                      <>
                        <div className="w-6 h-6 rounded-full bg-[#EEF0FF] flex items-center justify-center shrink-0">
                          <span className="text-[#5438FF] font-bold text-[10px]">
                            {(ticket.assignee?.name || ticket.assigneeName)?.charAt(0).toUpperCase() || "U"}
                          </span>
                        </div>
                        <p className="text-[14px] text-[#111827] font-medium">{ticket.assignee?.name || ticket.assigneeName}</p>
                      </>
                    ) : (
                      <p className="text-[14px] text-gray-400 italic font-medium">Unassigned</p>
                    )}
                  </div>
                </div>

                {/* Type */}
                <div>
                  <h3 className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider mb-2">Type</h3>
                  <p className="text-[14px] text-[#111827] capitalize font-medium">{ticket?.type?.toLowerCase() || "Bug"}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
