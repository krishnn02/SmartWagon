"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard,
  LogOut,
  Thermometer,
  Shield,
  Building2,
  MapPin,
} from "lucide-react";

export function Sidebar({
  isCollapsed,
  closeSidebar,
}: {
  isCollapsed: boolean;
  closeSidebar?: () => void;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isAdmin =
    user?.role === "Administrator" ||
    user?.email?.toLowerCase() === "admin@vasp.com";

  // Check if user has ANY selected device for the device types
  const hasBrakeDevices =
    isAdmin ||
    user?.allowedDevices?.["brake-binding"]?.includes("ALL") ||
    (user?.allowedDevices?.["brake-binding"]?.length ?? 0) > 0;

  const hasAxleDevices =
    isAdmin ||
    user?.allowedDevices?.["hot-axle"]?.includes("ALL") ||
    (user?.allowedDevices?.["hot-axle"]?.length ?? 0) > 0;

  // Dynamic navigation: device type must NOT be in the sidebar if 0 devices are selected
  const navigationItems = [
    {
      id: "brake-binding",
      name: "Brake Binding",
      href: "/",
      icon: LayoutDashboard,
      visible:
        isAdmin ||
        (user?.allowedModules?.includes("brake-binding") && hasBrakeDevices),
    },
    {
      id: "hot-axle",
      name: "Hot Axle",
      href: "/hot-axle",
      icon: Thermometer,
      visible:
        isAdmin ||
        (user?.allowedModules?.includes("hot-axle") && hasAxleDevices),
    },
    {
      id: "user-console",
      name: "User Console",
      href: "/user-console",
      icon: Shield,
      visible: isAdmin,
      adminOnly: true,
    },
  ].filter((item) => item.visible);

  return (
    <>
      {!isCollapsed && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden transition-opacity"
          onClick={closeSidebar}
        />
      )}

      <div
        className={cn(
          "flex h-full flex-col bg-white border-r border-slate-200 transition-all duration-300 relative overflow-hidden whitespace-nowrap",
          "absolute md:relative z-50 md:z-0",
          isCollapsed
            ? "-translate-x-full md:translate-x-0 md:w-0 border-r-0"
            : "translate-x-0 w-64 border-r"
        )}
      >
        <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6">
          {/* User info card with Railway Hierarchy */}
          {user && (
            <div className="mb-6 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/40 border border-slate-200/80 p-3.5 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-xs font-bold text-white shadow-sm shrink-0">
                  {user.first_name?.[0]}
                  {user.last_name?.[0] || user.first_name?.[1] || ""}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {user.first_name} {user.last_name}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                      {user.role || (isAdmin ? "Admin" : "Staff")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-200/60 text-[10px] text-slate-500 space-y-0.5">
                {user.zone_name && (
                  <div className="flex items-center gap-1 truncate text-slate-600">
                    <Building2 className="h-3 w-3 text-slate-400 shrink-0" />
                    <span className="truncate">{user.zone_name}</span>
                  </div>
                )}
                {user.division_name && (
                  <div className="flex items-center gap-1 truncate text-slate-600">
                    <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                    <span className="truncate">Div: <strong>{user.division_name}</strong></span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation Items */}
          <div className="mb-2 px-1">
            <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
              Railway Telemetry
            </span>
          </div>

          <nav className="flex-1 space-y-1">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => {
                    if (window.innerWidth < 768) closeSidebar?.();
                  }}
                  className={cn(
                    isActive
                      ? "bg-blue-50 text-blue-700 font-bold shadow-sm border-l-4 border-blue-600 -ml-4 pl-7 rounded-r-xl rounded-l-none"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium",
                    "group flex items-center justify-between rounded-xl px-3 py-2.5 text-xs transition-all"
                  )}
                >
                  <div className="flex items-center min-w-0">
                    <item.icon
                      className={cn(
                        isActive
                          ? "text-blue-600"
                          : "text-slate-400 group-hover:text-slate-600",
                        "mr-3 h-4 w-4 shrink-0"
                      )}
                    />
                    <span className="truncate">{item.name}</span>
                  </div>

                  {item.adminOnly && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-purple-100 text-purple-700">
                      Maker
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Sign Out */}
          <div className="mt-auto pt-4 border-t border-slate-200">
            <button
              onClick={logout}
              className="flex items-center w-full rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut className="mr-3 h-4 w-4 shrink-0" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
