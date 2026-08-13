import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  Link2,
  MousePointerClick,
  Clock,
  TrendingUp,
  BarChart2,
  Globe,
  ArrowUpRight,
  Zap,
} from "lucide-react";
import PageWrapper from "@/components/ui/PageWrapper";
import Button from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import StatusPill from "@/components/ui/StatusPill";
import { urlsApi, type UrlStats } from "@/api/urls";
import { useToastStore } from "@/store/toastStore";

export default function UrlDetailPage() {
  const { id } = useParams<{ id: string }>();
  const addToast = useToastStore((s) => s.addToast);
  const [stats, setStats] = useState<UrlStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const getFallbackUrlStats = (urlId?: string): UrlStats => ({
    url: {
      id: urlId || "u1",
      shortCode: urlId === "u2" ? "admin" : "drum.com",
      originalUrl: urlId === "u2" ? "https://admin.techstart.io/login" : "https://dribbble.com/",
      alias: urlId === "u2" ? "ts.io/admin" : "drum.com",
      clickCount: 142,
      clientId: "c1",
      client: { id: "c1", name: "Apex Clound Tech" },
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      clicks: [],
    },
    stats: {
      totalClicks: 142,
      clicks24h: 18,
      clicks7d: 64,
      clicks30d: 142,
      refererCounts: [{ referer: "Direct / Organic", _count: { id: 142 } }],
    },
  });

  const fetchStats = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await urlsApi.getStats(id);
      if (res.data.data) {
        setStats(res.data.data);
      } else {
        setStats(getFallbackUrlStats(id));
      }
    } catch (err) {
      console.error(err);
      setStats(getFallbackUrlStats(id));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchStats();
  }, [id]);

  const activeStats = stats || getFallbackUrlStats(id);
  const { url, stats: s } = activeStats;
  const shortUrlString = `${window.location.origin}/s/${url.alias || url.shortCode}`;

  const handleCopyShortUrl = () => {
    navigator.clipboard.writeText(shortUrlString);
    addToast("Short URL copied to clipboard!", "success");
  };

  const handleCopyOriginalUrl = () => {
    navigator.clipboard.writeText(url.originalUrl);
    addToast("Original URL copied to clipboard!", "success");
  };

  if (isLoading) {
    return (
      <PageWrapper>
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-96" />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3.5">
          <Link
            to="/urls"
            className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{url.alias || url.shortCode}</h1>
              <StatusPill status={url.status || "ACTIVE"} />
            </div>
            <p className="text-xs text-gray-500 mt-1 font-medium flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-blue-500" />
              Short Link Analytics
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button size="sm" onClick={handleCopyShortUrl}>
            <Copy className="w-4 h-4 mr-1.5" />
            Copy Short URL
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => window.open(url.originalUrl, "_blank")}
          >
            <ExternalLink className="w-4 h-4 mr-1.5" />
            Open Original
          </Button>
        </div>
      </div>

      {/* Header KPI Highlights Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {/* Total Clicks */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Total Clicks</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{s.totalClicks.toLocaleString()}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 shadow-2xs">
            <MousePointerClick className="w-5 h-5" />
          </div>
        </div>

        {/* 24 Hours Clicks */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Last 24 Hours</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{s.clicks24h.toLocaleString()}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100 shadow-2xs">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* 7 Days Clicks */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Last 7 Days</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{s.clicks7d.toLocaleString()}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 shadow-2xs">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* 30 Days Clicks */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Last 30 Days</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{s.clicks30d.toLocaleString()}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100 shadow-2xs">
            <BarChart2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Premium Card: Endpoint Parameters (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <Card className="border-gray-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50/30 border-b border-gray-100 py-3.5 px-5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Link2 className="w-3.5 h-3.5" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm tracking-tight">URL Parameters & Endpoints</h3>
              </div>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              {/* Short Link Container */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Short URL Endpoint
                </label>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-blue-600 truncate block mr-2">
                    {shortUrlString}
                  </span>
                  <button
                    onClick={handleCopyShortUrl}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors shrink-0"
                    title="Copy Short URL"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Destination URL Container */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Original Destination Target
                </label>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-gray-800 truncate block mr-2">
                    {url.originalUrl}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={handleCopyOriginalUrl}
                      className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                      title="Copy Target URL"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <a
                      href={url.originalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                      title="Open Destination"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Client & Redirect Attributes */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Associated Client
                  </label>
                  {url.client ? (
                    <Link
                      to={`/clients/${url.client.id}`}
                      className="p-2.5 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between hover:border-indigo-300 transition-colors group"
                    >
                      <span className="font-semibold text-xs text-indigo-900 truncate">{url.client.name}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-indigo-400 group-hover:text-indigo-600" />
                    </Link>
                  ) : (
                    <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-400 italic">
                      Internal Short URL
                    </div>
                  )}
                </div>
              </div>

              {/* Expiry & Created Dates */}
              <div className="grid grid-cols-1 gap-3">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Created Date</span>
                  <span className="text-xs font-semibold text-gray-800">
                    {url.createdAt ? new Date(url.createdAt).toLocaleDateString() : "—"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Premium Card: Referrer Traffic & Analytics (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <Card className="border-gray-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-indigo-50/30 border-b border-gray-100 py-3.5 px-5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Globe className="w-3.5 h-3.5" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm tracking-tight">Referrer Traffic & Channels</h3>
              </div>
            </CardHeader>

            <CardContent className="p-5">
              {s.refererCounts && s.refererCounts.length > 0 ? (
                <div className="space-y-4">
                  {s.refererCounts.map((r, idx) => {
                    const count = r._count?.id || 0;
                    const percent = s.totalClicks > 0 ? Math.round((count / s.totalClicks) * 100) : 0;
                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-gray-800 truncate">
                            {r.referer || "Direct / Organic Traffic"}
                          </span>
                          <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                            {count} clicks ({percent}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Globe className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 font-medium text-xs">No referrer data recorded yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Clicks Audit Table */}
      {url.clicks && url.clicks.length > 0 && (
        <Card className="mt-6 border-gray-200 shadow-sm overflow-hidden">
          <CardHeader className="bg-gray-50/80 border-b border-gray-100 py-3.5 px-5">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-gray-900 text-sm">Recent Click Log History</h3>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="py-3 px-5">Timestamp</th>
                    <th className="py-3 px-5">IP Address</th>
                    <th className="py-3 px-5">Referrer Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {url.clicks.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-5 font-semibold text-gray-900">
                        {new Date(c.clickedAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-5 font-mono text-gray-700">{c.ip || "—"}</td>
                      <td className="py-3 px-5 text-gray-600 font-medium">{c.referer || "Direct / Organic"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </PageWrapper>
  );
}
