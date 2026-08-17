import { useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Server,
  Globe,
  Link2,
  QrCode,
  Settings,
  Bell,
  Shield,
  Wallet,
  Wrench,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { useAuthStore } from "@/store/authStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useSidebarStatsStore, type SidebarCounts } from "@/store/sidebarStatsStore";

interface NavItem {
  to: string;
  label: string;
  icon: any;
  countKey?: keyof SidebarCounts;
}

const navItems: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/clients", label: "Clients", icon: Users, countKey: "clients" },
  { to: "/projects", label: "Projects", icon: FolderKanban, countKey: "projects" },
  { to: "/servers", label: "Servers", icon: Server, countKey: "servers" },
  { to: "/domains", label: "Domains", icon: Globe, countKey: "domains" },
  { to: "/urls", label: "URL Shortener", icon: Link2, countKey: "urls" },
  { to: "/qr-codes", label: "QR Codes", icon: QrCode, countKey: "qrCodes" },
  { to: "/finance", label: "Finance & Docs", icon: Wallet, countKey: "financeRecords" },
  { to: "/maintenance", label: "Maintenance", icon: Wrench, countKey: "maintenanceRecords" },
  { to: "/reminders", label: "Reminders", icon: Bell, countKey: "reminders" },
];

const adminItems: NavItem[] = [{ to: "/audit-logs", label: "Audit Logs", icon: Shield }];
const bottomItems: NavItem[] = [{ to: "/settings", label: "Settings", icon: Settings }];

interface SidebarProps {
  isOpen: boolean;
}

export default function Sidebar({ isOpen }: SidebarProps) {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "ADMIN";
  const { globalWorkspaceId } = useWorkspaceStore();
  const { counts, fetchCounts } = useSidebarStatsStore();

  useEffect(() => {
    // Initial fetch on mount or when workspace changes
    fetchCounts(globalWorkspaceId);

    // Poll backend every 5 seconds for real-time update
    const interval = setInterval(() => {
      fetchCounts(globalWorkspaceId);
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchCounts, globalWorkspaceId]);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-full bg-white border-r border-gray-200 z-40 transition-all duration-300",
        isOpen ? "w-60" : "w-0 overflow-hidden",
      )}
    >
      <div className="flex flex-col h-full w-60 relative">
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">IO</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-gray-900 text-base leading-none">IOMS</span>
              <span className="text-[10px] text-gray-400 font-medium tracking-wider uppercase mt-0.5">Operations</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const count = item.countKey ? counts[item.countKey] : undefined;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all group",
                    isActive
                      ? "bg-indigo-50 text-indigo-700 font-semibold"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                  )
                }
              >
                <div className="flex items-center gap-3 min-w-0">
                  <item.icon className="w-5 h-5 shrink-0 transition-transform group-hover:scale-105" />
                  <span className="truncate">{item.label}</span>
                </div>
                {count !== undefined && (
                  <span
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full transition-all shrink-0 ml-2 bg-indigo-100 text-indigo-700 group-hover:bg-indigo-200"
                  >
                    {count}
                  </span>
                )}
              </NavLink>
            );
          })}

          {isAdmin && (
            <>
              <div className="pt-4 pb-2">
                <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Admin</p>
              </div>
              {adminItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-indigo-50 text-indigo-700 font-semibold"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                    )
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </>
          )}
        </nav>

        <div className="px-3 py-4 border-t border-gray-200 space-y-1">
          {bottomItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-indigo-50 text-indigo-700 font-semibold"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                )
              }
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </aside>
  );
}
