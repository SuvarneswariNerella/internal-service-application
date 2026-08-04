import { useState, useEffect } from "react";
import { Shield, Key, UserPlus, Edit, Trash2, Eye, LogIn, LogOut, Search } from "lucide-react";
import PageWrapper from "@/components/ui/PageWrapper";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import { auditLogsApi, type AuditLog, type LoginLog } from "@/api/auditLogs";
import type { PaginationMeta } from "@/types";

const actionIcons: Record<string, typeof Shield> = {
  CREATE: UserPlus,
  UPDATE: Edit,
  DELETE: Trash2,
  REVEAL_CREDENTIAL: Eye,
  LOGIN: LogIn,
  LOGIN_FAILED: LogOut,
  REGISTER: UserPlus,
};

const actionColors: Record<string, string> = {
  CREATE: "text-green-600 bg-green-50",
  UPDATE: "text-blue-600 bg-blue-50",
  DELETE: "text-red-600 bg-red-50",
  REVEAL_CREDENTIAL: "text-amber-600 bg-amber-50",
  LOGIN: "text-green-600 bg-green-50",
  LOGIN_FAILED: "text-red-600 bg-red-50",
  REGISTER: "text-indigo-600 bg-indigo-50",
};

export default function AuditLogsPage() {
  const [activeTab, setActiveTab] = useState<"audit" | "logins">("audit");
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (activeTab === "audit") {
          const res = await auditLogsApi.list({ page, pageSize: 20, action: actionFilter, entity: entityFilter });
          if (res.data.success && res.data.data) {
            setAuditLogs(res.data.data);
            if (res.data.pagination) setPagination(res.data.pagination);
          }
        } else {
          const res = await auditLogsApi.listLogins({ page, pageSize: 20 });
          if (res.data.success && res.data.data) {
            setLoginLogs(res.data.data);
            if (res.data.pagination) setPagination(res.data.pagination);
          }
        }
      } catch (err) { console.error(err); } finally { setIsLoading(false); }
    };
    fetchData();
  }, [page, activeTab, actionFilter, entityFilter]);

  return (
    <PageWrapper>
      <PageHeader title="Audit Logs" description="Track all system activities and login history" />

      <div className="flex gap-2 mb-6">
        <Button variant={activeTab === "audit" ? "primary" : "secondary"} onClick={() => { setActiveTab("audit"); setPage(1); }}>
          <Shield className="w-4 h-4 mr-2" />Audit Logs
        </Button>
        <Button variant={activeTab === "logins" ? "primary" : "secondary"} onClick={() => { setActiveTab("logins"); setPage(1); }}>
          <Key className="w-4 h-4 mr-2" />Login History
        </Button>
      </div>

      {activeTab === "audit" && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={actionFilter}
                  onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                  className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Actions</option>
                  <option value="CREATE">Create</option>
                  <option value="UPDATE">Update</option>
                  <option value="DELETE">Delete</option>
                  <option value="REVEAL_CREDENTIAL">Reveal Credential</option>
                  <option value="LOGIN">Login</option>
                  <option value="LOGIN_FAILED">Login Failed</option>
                  <option value="REGISTER">Register</option>
                </select>
              </div>
            </div>
            <select
              value={entityFilter}
              onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
              className="h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Entities</option>
              <option value="User">User</option>
              <option value="Client">Client</option>
              <option value="Project">Project</option>
              <option value="Server">Server</option>
              <option value="Domain">Domain</option>
              <option value="Credential">Credential</option>
              <option value="Billing">Billing</option>
            </select>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Card key={i} className="p-4"><Skeleton className="h-16" /></Card>)}
        </div>
      ) : activeTab === "audit" ? (
        auditLogs.length === 0 ? (
          <Card className="p-12 text-center">
            <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No audit logs found</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {auditLogs.map((log) => {
              const Icon = actionIcons[log.action] || Shield;
              const colorClass = actionColors[log.action] || "text-gray-600 bg-gray-50";
              return (
                <Card key={log.id} className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${colorClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-gray-900">{log.action.replace("_", " ")}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-sm text-gray-600">{log.entity}</span>
                        {log.entityId && <span className="text-xs text-gray-400 truncate">({log.entityId.slice(0, 8)}...)</span>}
                      </div>
                      <p className="text-xs text-gray-500">
                        by {log.user.name} ({log.user.email})
                      </p>
                      {log.details && (
                        <pre className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        )
      ) : (
        loginLogs.length === 0 ? (
          <Card className="p-12 text-center">
            <Key className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No login logs found</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {loginLogs.map((log) => (
              <Card key={log.id} className="p-4">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${log.success ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}>
                    {log.success ? <LogIn className="w-5 h-5" /> : <LogOut className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{log.user.name}</p>
                    <p className="text-xs text-gray-500">{log.email}</p>
                    {log.ipAddress && <p className="text-xs text-gray-400">IP: {log.ipAddress}</p>}
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-medium ${log.success ? "text-green-600" : "text-red-600"}`}>
                      {log.success ? "Success" : "Failed"}
                    </span>
                    <p className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {((pagination.page - 1) * pagination.pageSize) + 1} to {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total}
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
            <Button variant="secondary" size="sm" disabled={page === pagination.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
