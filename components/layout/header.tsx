"use client";

import { useAuth } from "@/lib/auth";
import { Menu, TrainFront, ShieldAlert, ArrowLeft } from "lucide-react";

export function Header({ toggleSidebar }: { toggleSidebar?: () => void }) {
  const { user, exitImpersonation } = useAuth();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6 z-20 relative">
      <div className="flex items-center gap-2 md:gap-4">
        <button
          onClick={toggleSidebar}
          className="text-slate-500 hover:text-slate-900 p-2 -ml-2 rounded-md hover:bg-slate-100 transition-colors"
        >
          <Menu className="h-5 w-5 md:h-6 md:w-6" />
        </button>

        <div className="flex items-center gap-2 mr-2 md:mr-4">
          <div className="flex items-center justify-center rounded-lg bg-blue-600 p-1.5 shadow-sm shadow-blue-500/20 shrink-0 hidden sm:flex">
            <TrainFront className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-base md:text-lg font-bold text-slate-900 tracking-tight whitespace-nowrap">
            Smart Coach
          </h1>
        </div>

        <div className="h-8 w-px bg-slate-200 hidden lg:block" />

        <h2 className="text-base font-bold bg-gradient-to-r from-blue-800 to-indigo-600 bg-clip-text text-transparent hidden xl:block">
          Smart Coach Console
        </h2>
      </div>

      {/* Impersonation Banner if in preview mode */}
      {user?.isImpersonating && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-300 text-amber-900 px-3 py-1 rounded-xl text-xs font-semibold shadow-sm animate-pulse">
          <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
          <span className="hidden sm:inline">
            Previewing: <strong>{user.first_name} {user.last_name}</strong> ({user.division_name})
          </span>
          <button
            onClick={exitImpersonation}
            className="ml-1 px-2 py-0.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            <span>Exit Preview</span>
          </button>
        </div>
      )}

      <div className="flex items-center gap-3 md:gap-4">
        {user && (
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
            <span className="font-bold text-slate-800">{user.first_name} {user.last_name}</span>
            {user.role && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                {user.role}
              </span>
            )}
            {user.division_name && (
              <>
                <span className="text-slate-300">|</span>
                <span className="font-medium text-slate-600">{user.division_name}</span>
              </>
            )}
          </div>
        )}

        <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 border border-emerald-200 shadow-sm shrink-0">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
          </div>
          <span className="text-[10px] font-bold text-emerald-700 tracking-wider hidden sm:inline-block">
            LIVE
          </span>
        </div>
      </div>
    </header>
  );
}
