import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Users,
  FolderKanban,
  Globe,
  Server,
  ArrowRight,
  IndianRupee,
  Link2,
  Plus,
  TrendingUp,
  Clock,
  ShieldCheck,
  Activity,
  Layers,
  ChevronRight,
  BarChart3,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import PageWrapper from "@/components/ui/PageWrapper";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import Button from "@/components/ui/Button";
import { dashboardApi, type DashboardStats } from "@/api/dashboard";
import { serversApi, type Server as ServerType } from "@/api/servers";
import { domainsApi, type Domain } from "@/api/domains";
import { useWorkspaceStore } from "@/store/workspaceStore";

const STATUS_COLORS: Record<string, string> = {
  IN_PROGRESS: "#3b82f6", // Blue
  PLANNING: "#8b5cf6",    // Purple
  TESTING: "#f59e0b",     // Amber
  COMPLETED: "#10b981",   // Emerald
  ON_HOLD: "#ef4444",     // Red
  ARCHIVED: "#6b7280",    // Gray
};

function getDaysUntil(dateStr: string | undefined): number | null {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function MetricCard({
  title,
  value,
  subtext,
  icon: Icon,
  badgeText,
  gradientBg,
  iconColor,
  borderColor = "border-gray-200",
  linkTo,
}: {
  title: string;
  value: string | number;
  subtext?: string;
  icon: React.ElementType;
  badgeText?: string;
  gradientBg: string;
  iconColor: string;
  borderColor?: string;
  linkTo?: string;
}) {
  const content = (
    <div className={`p-5 rounded-2xl bg-white border ${borderColor} shadow-xs hover:shadow-md transition-all duration-200 relative overflow-hidden group`}>
      {/* Background Accent glow */}
      <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-10 group-hover:scale-125 transition-transform duration-300 pointer-events-none ${gradientBg}`} />

      <div className="flex items-start justify-between mb-3 relative z-10">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-xs border ${gradientBg} ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
        {badgeText && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
            {badgeText}
          </span>
        )}
      </div>

      <div className="relative z-10">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">{title}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">{value}</span>
        </div>
        {subtext && <p className="text-xs font-medium text-gray-400 mt-1">{subtext}</p>}
      </div>
    </div>
  );

  return linkTo ? <Link to={linkTo} className="block">{content}</Link> : content;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { globalWorkspaceId } = useWorkspaceStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [expiringServers, setExpiringServers] = useState<ServerType[]>([]);
  const [expiringDomains, setExpiringDomains] = useState<Domain[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const wsId = globalWorkspaceId === "all" ? undefined : globalWorkspaceId;
        const [statsRes, serversRes, domainsRes] = await Promise.all([
          dashboardApi.getStats({ workspaceId: wsId }),
          serversApi.getExpiring({ workspaceId: wsId }),
          domainsApi.getExpiring({ workspaceId: wsId }),
        ]);
        if (statsRes.data.data) setStats(statsRes.data.data);
        if (serversRes.data.data) setExpiringServers(serversRes.data.data);
        if (domainsRes.data.data) setExpiringDomains(domainsRes.data.data);
      } catch (err) {
        console.error("Failed to load dashboard statistics:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [globalWorkspaceId]);

  // Format Project Status data for Pie/Donut Chart
  const projectStatusData =
    stats?.projectsByStatus.map((p) => ({
      name: p.status.replace("_", " "),
      rawStatus: p.status,
      value: p.count,
      color: STATUS_COLORS[p.status] || "#94a3b8",
    })) || [];

  // Expiry forecast chart data
  const expiryChartData = stats
    ? [
        { name: "Within 30 Days", Servers: stats.expiringServers.within30Days, Domains: stats.expiringDomains.within30Days },
        { name: "Within 60 Days", Servers: stats.expiringServers.within60Days, Domains: stats.expiringDomains.within60Days },
        { name: "Within 90 Days", Servers: stats.expiringServers.within90Days, Domains: stats.expiringDomains.within90Days },
      ]
    : [];

  // Top URLs traffic chart data
  const urlTrafficData =
    stats?.topUrls.map((u) => ({
      name: u.alias || u.shortCode,
      clicks: u.clickCount,
      shortCode: u.shortCode,
    })) || [];

  return (
    <PageWrapper>
      {/* Executive Command Center Banner */}
      <div className="relative mb-6 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white shadow-xl overflow-hidden">
        {/* Background Decorative Element */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-32 -bottom-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase tracking-wider">
                Operations Command Center
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live Operational Sync
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Internal Operations Dashboard</h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Monitor active client infrastructure, ongoing project workflows, upcoming domain/server renewals, and short link traffic analytics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => navigate("/projects")}
              className="bg-white text-slate-900 hover:bg-slate-100 font-semibold shadow-md border-0"
            >
              <Plus className="w-4 h-4 mr-1.5 text-indigo-600" /> New Project
            </Button>
            <Button
              onClick={() => navigate("/urls")}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md border-0"
            >
              <Link2 className="w-4 h-4 mr-1.5" /> Short Link
            </Button>
          </div>
        </div>
      </div>

      {/* Top 6 KPI Metric Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-4"><Skeleton className="h-24" /></Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          <MetricCard
            title="Total Clients"
            value={stats?.overview.totalClients ?? 0}
            subtext="Registered clients"
            icon={Users}
            gradientBg="bg-indigo-50 border-indigo-100"
            iconColor="text-indigo-600"
            linkTo="/clients"
          />
          <MetricCard
            title="Active Projects"
            value={stats?.overview.activeProjects ?? 0}
            subtext={`Out of ${stats?.overview.totalProjects ?? 0} total`}
            icon={FolderKanban}
            badgeText={`${stats?.overview.totalProjects ? Math.round(((stats.overview.activeProjects || 0) / stats.overview.totalProjects) * 100) : 0}% Active`}
            gradientBg="bg-emerald-50 border-emerald-100"
            iconColor="text-emerald-600"
            linkTo="/projects"
          />
          <MetricCard
            title="Servers (Exp. 30d)"
            value={stats?.expiringServers.within30Days ?? 0}
            subtext={`${stats?.overview.totalServers ?? 0} total servers`}
            icon={Server}
            badgeText={stats?.expiringServers.within30Days ? "Renewal Due" : "All Normal"}
            gradientBg="bg-amber-50 border-amber-100"
            iconColor="text-amber-600"
            linkTo="/servers"
          />
          <MetricCard
            title="Domains (Exp. 30d)"
            value={stats?.expiringDomains.within30Days ?? 0}
            subtext={`${stats?.overview.totalDomains ?? 0} total domains`}
            icon={Globe}
            badgeText={stats?.expiringDomains.within30Days ? "Renewal Due" : "Protected"}
            gradientBg="bg-purple-50 border-purple-100"
            iconColor="text-purple-600"
            linkTo="/domains"
          />
          <MetricCard
            title="Short Short URLs"
            value={stats?.overview.totalUrls ?? 0}
            subtext="Tracked links"
            icon={Link2}
            gradientBg="bg-sky-50 border-sky-100"
            iconColor="text-sky-600"
            linkTo="/urls"
          />
          <MetricCard
            title="Overdue Billing"
            value={`₹${stats?.pendingBilling.totalAmount.toLocaleString() ?? "0"}`}
            subtext={`${stats?.pendingBilling.count ?? 0} overdue invoices`}
            icon={IndianRupee}
            gradientBg="bg-rose-50 border-rose-100"
            iconColor="text-rose-600"
          />
        </div>
      )}

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Project Status Breakdown Donut Chart */}
        <Card className="shadow-xs border border-gray-200 rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-3.5">
            <div>
              <h3 className="font-bold text-gray-900 text-sm tracking-tight flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" /> Project Status Distribution
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Overview of project pipeline stages</p>
            </div>
            <Link to="/projects" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              Projects Page <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <Skeleton className="h-64" />
            ) : projectStatusData.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-gray-400 text-xs">
                <FolderKanban className="w-8 h-8 mb-2 stroke-1" />
                No project data recorded.
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-around gap-4">
                <div className="w-full sm:w-1/2 h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={projectStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {projectStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length && payload[0]) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-slate-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg border border-slate-700 font-medium">
                                <p className="font-bold text-slate-200">{data.name}</p>
                                <p className="text-indigo-400 font-semibold">{data.value} Projects</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="w-full sm:w-1/2 space-y-2">
                  {projectStatusData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="font-semibold text-gray-700 capitalize">{item.name.toLowerCase()}</span>
                      </div>
                      <span className="font-bold text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200 shadow-xs">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Infrastructure Expiry Forecast Bar Chart */}
        <Card className="shadow-xs border border-gray-200 rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-3.5">
            <div>
              <h3 className="font-bold text-gray-900 text-sm tracking-tight flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-600" /> Infrastructure Expiry Forecast
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Upcoming server & domain renewal deadlines</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-medium">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" /> Servers</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-purple-500 inline-block" /> Domains</span>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <Skeleton className="h-64" />
            ) : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={expiryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-slate-900 text-white text-xs p-3 rounded-lg shadow-lg border border-slate-700">
                              <p className="font-bold mb-1">{label}</p>
                              {payload.map((p: any) => (
                                <p key={p.name} style={{ color: p.color }} className="font-semibold">
                                  {p.name}: {p.value}
                                </p>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="Servers" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={32} />
                    <Bar dataKey="Domains" fill="#8b5cf6" radius={[6, 6, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Short URLs Performance Chart */}
      {urlTrafficData.length > 0 && (
        <Card className="shadow-xs border border-gray-200 rounded-xl mb-6">
          <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-3.5">
            <div>
              <h3 className="font-bold text-gray-900 text-sm tracking-tight flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-sky-600" /> Top Short Links by Click Volume
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Most engaged short links across services</p>
            </div>
            <Link to="/urls" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              Short URLs Page <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={urlTrafficData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length && payload[0]) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white text-xs p-2.5 rounded-lg shadow-lg border border-slate-700">
                            <p className="font-bold text-sky-400">{data.name}</p>
                            <p className="text-slate-300 font-mono text-[11px]">/s/{data.shortCode}</p>
                            <p className="font-semibold text-white mt-1">{data.clicks} total clicks</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="clicks" fill="#0ea5e9" radius={[6, 6, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 3-Column Operations Stream Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Expiring Servers Card */}
        <Card className="shadow-xs border border-gray-200 rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Server className="w-4 h-4 text-amber-500" /> Expiring Servers
            </h3>
            <Link to="/servers" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="pt-3">
            {isLoading ? (
              <Skeleton className="h-40" />
            ) : expiringServers.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-xs">
                <ShieldCheck className="w-7 h-7 mx-auto mb-1.5 text-emerald-500 opacity-80" />
                All server infrastructure active & protected.
              </div>
            ) : (
              <div className="space-y-2">
                {expiringServers.slice(0, 5).map((s) => {
                  const days = getDaysUntil(s.expiryDate);
                  const isCritical = days !== null && days <= 15;
                  return (
                    <Link
                      key={s.id}
                      to={`/servers/${s.id}`}
                      className="flex items-center justify-between p-2.5 rounded-lg hover:bg-amber-50/50 border border-gray-100 hover:border-amber-200 transition-colors group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                          <Server className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-xs text-gray-900 group-hover:text-amber-700 truncate">{s.name}</p>
                          <p className="text-[11px] text-gray-500 truncate">{s.client?.name || "Internal Infrastructure"}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${isCritical ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                          {days !== null ? `${days}d left` : "Expired"}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expiring Domains Card */}
        <Card className="shadow-xs border border-gray-200 rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-purple-500" /> Expiring Domains
            </h3>
            <Link to="/domains" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="pt-3">
            {isLoading ? (
              <Skeleton className="h-40" />
            ) : expiringDomains.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-xs">
                <ShieldCheck className="w-7 h-7 mx-auto mb-1.5 text-emerald-500 opacity-80" />
                All domain records healthy & renewed.
              </div>
            ) : (
              <div className="space-y-2">
                {expiringDomains.slice(0, 5).map((d) => {
                  const days = getDaysUntil(d.expirationDate);
                  const isCritical = days !== null && days <= 15;
                  return (
                    <Link
                      key={d.id}
                      to={`/domains/${d.id}`}
                      className="flex items-center justify-between p-2.5 rounded-lg hover:bg-purple-50/50 border border-gray-100 hover:border-purple-200 transition-colors group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                          <Globe className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-xs text-gray-900 group-hover:text-purple-700 truncate">{d.domain}</p>
                          <p className="text-[11px] text-gray-500 truncate">{d.client?.name || "System Domain"}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${isCritical ? "bg-red-100 text-red-700" : "bg-purple-100 text-purple-700"}`}>
                          {days !== null ? `${days}d left` : "Expired"}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Live System Activity Log */}
        <Card className="shadow-xs border border-gray-200 rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-500" /> Recent System Activity
            </h3>
          </CardHeader>
          <CardContent className="pt-3">
            {isLoading ? (
              <Skeleton className="h-40" />
            ) : !stats?.recentActivity.length ? (
              <div className="py-8 text-center text-gray-400 text-xs">No recent activity logs recorded.</div>
            ) : (
              <div className="space-y-2">
                {stats.recentActivity.slice(0, 5).map((act) => (
                  <div key={act.id} className="p-2.5 rounded-lg border border-gray-100 bg-gray-50/50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-gray-900">{act.title}</span>
                      <span className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        {new Date(act.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600 line-clamp-1">{act.message}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
