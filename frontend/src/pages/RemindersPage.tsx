import { useState, useEffect } from "react";
import { Bell, Server, Globe, AlertTriangle, Clock, FolderKanban, Wrench, ArrowRight, CheckCircle } from "lucide-react";
import PageWrapper from "@/components/ui/PageWrapper";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import { remindersApi, type Reminder } from "@/api/reminders";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useWorkspaceStore } from "@/store/workspaceStore";

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [stats, setStats] = useState({ expired: 0, in30: 0, in90: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("all");
  const { globalWorkspaceId } = useWorkspaceStore();
  const navigate = useNavigate();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const workspaceId = globalWorkspaceId === "all" ? undefined : globalWorkspaceId;
      const typeParam = activeTab === "all" ? undefined : activeTab;
      
      const [remindersRes, summaryRes] = await Promise.all([
        remindersApi.getReminders({ type: typeParam, workspaceId }),
        remindersApi.getSummary({ workspaceId })
      ]);
      
      if (remindersRes.data.success && remindersRes.data.data) {
        setReminders(remindersRes.data.data);
      }
      if (summaryRes.data.success && summaryRes.data.data) {
        setStats(summaryRes.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, globalWorkspaceId]);

  const getUrgencyColor = (days: number) => {
    if (days < 0) return "text-red-600 bg-red-50 border-red-100";
    if (days <= 30) return "text-amber-600 bg-amber-50 border-amber-100";
    return "text-blue-600 bg-blue-50 border-blue-100";
  };

  const getUrgencyText = (days: number) => {
    if (days < 0) return "Expired";
    if (days === 0) return "Due Today";
    return `${days} Days left`;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "projects": return <FolderKanban className="w-4 h-4 text-purple-500" />;
      case "servers": return <Server className="w-4 h-4 text-blue-500" />;
      case "domains": return <Globe className="w-4 h-4 text-emerald-500" />;
      case "maintenance": return <Wrench className="w-4 h-4 text-orange-500" />;
      default: return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const tabs = [
    { id: "all", label: "All Items" },
    { id: "projects", label: "Projects" },
    { id: "servers", label: "Servers" },
    { id: "domains", label: "Domains" },
    { id: "maintenance", label: "Maintenance" },
  ];

  return (
    <PageWrapper>
      <PageHeader 
        title="Reminders" 
        description="Centralized view of expiring and due items across your workspace"
        icon={<Bell className="w-5 h-5" />}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card><CardContent className="flex items-center gap-4">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center"><AlertTriangle className="w-6 h-6 text-red-600" /></div>
          <div><p className="text-2xl font-bold text-gray-900">{stats.expired}</p><p className="text-sm text-gray-500">Expired</p></div>
        </CardContent></Card>
        <Card><CardContent className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center"><Clock className="w-6 h-6 text-amber-600" /></div>
          <div><p className="text-2xl font-bold text-gray-900">{stats.in30}</p><p className="text-sm text-gray-500">Expiring in 30 days</p></div>
        </CardContent></Card>
        <Card><CardContent className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center"><Bell className="w-6 h-6 text-blue-600" /></div>
          <div><p className="text-2xl font-bold text-gray-900">{stats.in90}</p><p className="text-sm text-gray-500">Expiring in 90 days</p></div>
        </CardContent></Card>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id)} 
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/50 border-b border-gray-100 text-gray-500 uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Client / Project</th>
                <th className="px-6 py-4">Due Date</th>
                <th className="px-6 py-4">Status / Priority</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    <Skeleton className="h-6 w-full max-w-md mx-auto" />
                  </td>
                </tr>
              ) : reminders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      </div>
                      <p className="font-medium text-gray-900 mb-1">All Caught Up!</p>
                      <p className="text-sm">There are no items due or expiring soon.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                reminders.map((item) => (
                  <tr 
                    key={`${item.type}-${item.id}`} 
                    className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
                    onClick={() => navigate(item.redirect_url)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center">
                          {getTypeIcon(item.type)}
                        </div>
                        <span className="capitalize font-medium text-gray-700 text-xs">{item.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-900">{item.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-gray-900">{item.client_name || "-"}</span>
                        {item.project_name && <span className="text-xs text-gray-500">{item.project_name}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5 items-start">
                        <span className="text-gray-900 font-medium">
                          {format(new Date(item.due_date), "MMM d, yyyy")}
                        </span>
                        <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${getUrgencyColor(item.days_remaining)}`}>
                          {getUrgencyText(item.days_remaining)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-700 capitalize">
                          {item.status.replace(/_/g, " ").toLowerCase()}
                        </span>
                        {item.priority && (
                          <span className={`text-[11px] font-medium ${
                            item.priority === "CRITICAL" ? "text-red-600" :
                            item.priority === "HIGH" ? "text-orange-500" :
                            "text-gray-500"
                          }`}>
                            {item.priority.charAt(0) + item.priority.slice(1).toLowerCase()}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        className="p-2 text-gray-400 hover:text-[#5438FF] hover:bg-[#EEF0FF] rounded-lg transition-colors inline-flex items-center justify-center"
                        onClick={(e) => { e.stopPropagation(); navigate(item.redirect_url); }}
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageWrapper>
  );
}
