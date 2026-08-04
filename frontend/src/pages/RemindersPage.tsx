import { useState, useEffect } from "react";
import { Bell, Server, Globe, CheckCheck, AlertTriangle, Clock, CheckCircle } from "lucide-react";
import PageWrapper from "@/components/ui/PageWrapper";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import { remindersApi, type Notification, type ExpiringItem } from "@/api/reminders";

function UrgencyBadge({ urgency }: { urgency: string }) {
  if (urgency === "critical") return <span className="text-xs px-2 py-0.5 rounded-full font-medium text-red-600 bg-red-50">Critical</span>;
  if (urgency === "warning") return <span className="text-xs px-2 py-0.5 rounded-full font-medium text-amber-600 bg-amber-50">Warning</span>;
  return <span className="text-xs px-2 py-0.5 rounded-full font-medium text-blue-600 bg-blue-50">Info</span>;
}

export default function RemindersPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [expiring, setExpiring] = useState<ExpiringItem[]>([]);
  const [expired, setExpired] = useState<ExpiringItem[]>([]);
  const [stats, setStats] = useState({ expiringSoon30: 0, expiringSoon60: 0, expired: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"expiring" | "notifications">("expiring");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [notifRes, expiringRes] = await Promise.all([
        remindersApi.getNotifications(),
        remindersApi.getExpiring(),
      ]);
      if (notifRes.data.success && notifRes.data.data) setNotifications(notifRes.data.data);
      if (expiringRes.data.success && expiringRes.data.data) {
        setExpiring(expiringRes.data.data.expiring);
        setExpired(expiringRes.data.data.expired);
        setStats(expiringRes.data.data.stats);
      }
    } catch (err) { console.error(err); } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleMarkAllRead = async () => {
    await remindersApi.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleDismiss = async (id: string) => {
    await remindersApi.deleteNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <PageWrapper>
      <PageHeader title="Reminders" description="Track expiring servers, domains, and notifications" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card><CardContent className="flex items-center gap-4">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center"><AlertTriangle className="w-6 h-6 text-red-600" /></div>
          <div><p className="text-2xl font-bold text-gray-900">{stats.expired}</p><p className="text-sm text-gray-500">Expired</p></div>
        </CardContent></Card>
        <Card><CardContent className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center"><Clock className="w-6 h-6 text-amber-600" /></div>
          <div><p className="text-2xl font-bold text-gray-900">{stats.expiringSoon30}</p><p className="text-sm text-gray-500">Expiring in 30 days</p></div>
        </CardContent></Card>
        <Card><CardContent className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center"><Bell className="w-6 h-6 text-blue-600" /></div>
          <div><p className="text-2xl font-bold text-gray-900">{stats.expiringSoon60}</p><p className="text-sm text-gray-500">Expiring in 90 days</p></div>
        </CardContent></Card>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6">
          {[{ id: "expiring" as const, label: "Expiring Items" }, { id: "notifications" as const, label: "Notifications" }].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>{tab.label}</button>
          ))}
        </nav>
      </div>

      {activeTab === "expiring" && (
        isLoading ? <Skeleton className="h-64" /> : expiring.length === 0 && expired.length === 0 ? (
          <Card className="p-12 text-center"><CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" /><p className="text-gray-500">No expiring items. All good!</p></Card>
        ) : (
          <div className="space-y-4">
            {expired.length > 0 && (
              <Card>
                <CardHeader><h3 className="font-semibold text-red-600">Expired ({expired.length})</h3></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {expired.map((item) => (
                      <div key={`${item.type}-${item.id}`} className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-100">
                        <div className="flex items-center gap-3">
                          {item.type === "server" ? <Server className="w-5 h-5 text-red-500" /> : <Globe className="w-5 h-5 text-red-500" />}
                          <div><p className="font-medium text-sm">{item.name}</p><p className="text-xs text-gray-500">{item.client?.name || "No client"} · {item.type === "server" ? "Server" : "Domain"}</p></div>
                        </div>
                        <span className="text-xs font-medium text-red-600">Expired</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {expiring.length > 0 && (
              <Card>
                <CardHeader><h3 className="font-semibold">Expiring Soon ({expiring.length})</h3></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {expiring.map((item) => (
                      <div key={`${item.type}-${item.id}`} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          {item.type === "server" ? <Server className="w-5 h-5 text-amber-500" /> : <Globe className="w-5 h-5 text-blue-500" />}
                          <div><p className="font-medium text-sm">{item.name}</p><p className="text-xs text-gray-500">{item.client?.name || "No client"} · {item.type === "server" ? "Server" : "Domain"}</p></div>
                        </div>
                        <div className="flex items-center gap-3">
                          <UrgencyBadge urgency={item.urgency} />
                          <span className="text-xs text-gray-500">{item.daysRemaining}d left</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )
      )}

      {activeTab === "notifications" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            <Button variant="secondary" size="sm" onClick={handleMarkAllRead}><CheckCheck className="w-4 h-4 mr-1" />Mark all read</Button>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-48" /> : notifications.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No notifications</p>
            ) : (
              <div className="space-y-2">
                {notifications.map((n) => (
                  <div key={n.id} className={`flex items-start justify-between p-3 rounded-lg ${n.isRead ? "bg-white" : "bg-indigo-50"} border border-gray-100`}>
                    <div className="flex items-start gap-3">
                      <Bell className={`w-5 h-5 mt-0.5 ${n.isRead ? "text-gray-400" : "text-indigo-500"}`} />
                      <div>
                        <p className={`text-sm font-medium ${n.isRead ? "text-gray-700" : "text-gray-900"}`}>{n.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    {!n.isRead && (
                      <Button variant="ghost" size="sm" onClick={() => handleDismiss(n.id)}>Dismiss</Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </PageWrapper>
  );
}
