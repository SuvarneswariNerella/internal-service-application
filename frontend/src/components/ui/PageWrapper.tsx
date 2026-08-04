import { cn } from "@/utils/cn";

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export default function PageWrapper({ children, className }: PageWrapperProps) {
  return <div className={cn("p-6", className)}>{children}</div>;
}
