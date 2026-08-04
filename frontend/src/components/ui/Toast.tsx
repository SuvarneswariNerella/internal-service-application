import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { useToastStore, type ToastType } from "@/store/toastStore";

const icons: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const colors: Record<ToastType, string> = {
  success: "bg-green-50 border-green-200 text-green-800",
  error: "bg-red-50 border-red-200 text-red-800",
  warning: "bg-amber-50 border-amber-200 text-amber-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
};

const iconColors: Record<ToastType, string> = {
  success: "text-green-500",
  error: "text-red-500",
  warning: "text-amber-500",
  info: "text-blue-500",
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map((toast) => {
        const Icon = icons[toast.type];
        return (
          <div
            key={toast.id}
            className={`flex items-center gap-3 p-4 rounded-lg border shadow-lg ${colors[toast.type]} animate-slide-in`}
          >
            <Icon className={`w-5 h-5 shrink-0 ${iconColors[toast.type]}`} />
            <p className="text-sm font-medium flex-1">{toast.message}</p>
            <button onClick={() => removeToast(toast.id)} className="shrink-0 hover:opacity-70">
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
