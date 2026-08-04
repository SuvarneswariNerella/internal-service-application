import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/utils/cn";

interface DropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: "left" | "right";
  className?: string;
}

export default function Dropdown({ trigger, children, align = "left", className }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative inline-block">
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      {isOpen && (
        <div
          className={cn(
            "absolute z-50 mt-2 min-w-[180px] bg-white rounded-lg shadow-lg border border-gray-200 py-1",
            align === "right" ? "right-0" : "left-0",
            className,
          )}
          onClick={() => setIsOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

interface DropdownItemProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function DropdownItem({ children, onClick, className }: DropdownItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors",
        className,
      )}
    >
      {children}
    </button>
  );
}
