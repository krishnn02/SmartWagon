"use client";

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
  TrainFront
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Live Monitoring", href: "/live-monitoring", icon: Activity },
  { name: "Faults & Alerts", href: "/faults", icon: AlertTriangle },
  { name: "Event History", href: "/events", icon: History },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Reports", href: "/reports", icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-zinc-950 border-r border-zinc-800">
      <div className="flex h-16 shrink-0 items-center gap-3 px-6 border-b border-zinc-800">
        <div className="flex items-center justify-center rounded-md bg-blue-600 p-1.5 shadow-sm shadow-blue-500/20">
          <TrainFront className="h-5 w-5 text-white" />
        </div>
        <h1 className="text-lg font-bold text-zinc-100 tracking-tight">Smart Wagon</h1>
      </div>
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
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-white",
                  "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors"
                )}
              >
                <item.icon
                  className={cn(
                    isActive ? "text-white" : "text-zinc-500 group-hover:text-zinc-300",
                    "mr-3 h-5 w-5 flex-shrink-0"
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
