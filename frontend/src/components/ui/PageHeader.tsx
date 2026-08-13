import { cn } from "@/utils/cn";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export default function PageHeader({ title, description, action, icon, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4", className)}>
      <div>
        <h1 className="text-2xl font-bold text-[#1e1b4b] flex items-center gap-2">
          {icon && (
            <div className="bg-[#5438FF]/10 p-1.5 rounded-md text-[#5438FF]">
              {icon}
            </div>
          )}
          {title}
        </h1>
        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
