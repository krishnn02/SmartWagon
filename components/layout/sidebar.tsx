"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard,
  LogOut,
  ChevronLeft,
  ChevronRight,
  TrainFront,
} from "lucide-react";

const navigation = [
  { name: "Brake Binding", href: "/", icon: LayoutDashboard },
];

export function Sidebar({ isCollapsed, closeSidebar }: { isCollapsed: boolean; closeSidebar?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <>
      {!isCollapsed && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden transition-opacity" onClick={closeSidebar} />
      )}

      <div
        className={cn(
          "flex h-full flex-col bg-white border-r border-slate-200 transition-all duration-300 relative overflow-hidden whitespace-nowrap",
          "absolute md:relative z-50 md:z-0",
          isCollapsed ? "-translate-x-full md:translate-x-0 md:w-0 border-r-0" : "translate-x-0 w-64 border-r"
        )}
      >
        <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6">
          {/* User info */}
          {user && (
            <div className="mb-6 rounded-xl bg-slate-50 border border-slate-200 p-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shrink-0">
                  {user.first_name?.[0]}{user.last_name?.[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900 truncate">{user.first_name} {user.last_name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user.division_name || user.region_name || "All"}</p>
                </div>
              </div>
            </div>
          )}

          <nav className="flex-1 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => {
                    if (window.innerWidth < 768) closeSidebar?.();
                  }}
                  className={cn(
                    isActive
                      ? "bg-blue-50 text-blue-700 font-semibold shadow-sm border-l-4 border-blue-600 -ml-4 pl-7 rounded-r-md rounded-l-none"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                    "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors"
                  )}
                >
                  <item.icon
                    className={cn(isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600", "mr-3 h-5 w-5 shrink-0")}
                  />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="mt-auto pt-4 border-t border-slate-200">
            <button
              onClick={logout}
              className="flex items-center w-full rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5 shrink-0" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
