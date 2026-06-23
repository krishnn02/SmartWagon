"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Activity, 
  Clock, 
  AlertTriangle, 
  History, 
  BarChart3, 
  FileText, 
  Server,
  TrainFront,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Live Monitoring", href: "/live-monitoring", icon: Activity },
  { name: "Faults & Alerts", href: "/faults", icon: AlertTriangle },
  { name: "Event History", href: "/events", icon: History },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Reports", href: "/reports", icon: FileText },
];

export function Sidebar({ isCollapsed }: { isCollapsed: boolean }) {
  const pathname = usePathname();

  return (
    <div 
      className={cn(
        "flex h-full flex-col bg-background border-border transition-all duration-300 relative overflow-hidden whitespace-nowrap",
        isCollapsed ? "w-0 border-r-0" : "w-64 border-r"
      )}
    >
      <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6">
        <nav className="flex-1 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  isActive
                    ? "bg-blue-50 text-blue-700 font-semibold shadow-sm border-l-4 border-blue-600 -ml-4 pl-7 rounded-r-md rounded-l-none"
                    : "text-muted-foreground hover:bg-slate-50 hover:text-slate-900",
                  "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors"
                )}
              >
                <item.icon
                  className={cn(
                    isActive ? "text-blue-600" : "text-muted-foreground group-hover:text-slate-600",
                    "mr-3 h-5 w-5 flex-shrink-0"
                  )}
                  aria-hidden="true"
                />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
