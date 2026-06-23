import { COACH_INFO } from "@/constants";
import { Menu, TrainFront } from "lucide-react";

export function Header({ toggleSidebar }: { toggleSidebar?: () => void }) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-background px-6 z-20 relative">
      <div className="flex items-center gap-4">
        {/* Toggle Button */}
        <button onClick={toggleSidebar} className="text-muted-foreground hover:text-foreground p-2 -ml-2 rounded-md hover:bg-muted transition-colors">
          <Menu className="h-5 w-5" />
        </button>

        {/* Smart Wagon Logo */}
        <div className="flex items-center gap-3 mr-4">
          <div className="flex items-center justify-center rounded-md bg-blue-600 p-1.5 shadow-sm shadow-blue-500/20 shrink-0">
            <TrainFront className="h-5 w-5 text-foreground" />
          </div>
          <h1 className="text-lg font-bold text-foreground tracking-tight whitespace-nowrap">Smart Wagon</h1>
        </div>

        <div className="h-8 w-px bg-border hidden md:block" />

        {/* Placeholder for Railway Logo */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-xs font-bold text-white shadow-md shadow-blue-500/20">
          RW
        </div>
        <h2 className="text-xl font-bold bg-gradient-to-r from-blue-800 to-indigo-600 bg-clip-text text-transparent drop-shadow-sm hidden md:block">
          Railway Brake Monitoring System
        </h2>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex flex-col items-end">
            <span className="font-medium text-foreground">Coach: {COACH_INFO.coach_no}</span>
            <span className="text-xs text-muted-foreground">ID: {COACH_INFO.Actual_id}</span>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="flex flex-col items-start">
            <span className="font-medium text-foreground">Train: {COACH_INFO.Train_no}</span>
            <span className="text-xs text-muted-foreground">Loc: {COACH_INFO.Location}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 border border-emerald-200 shadow-sm">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600 shadow-[0_0_8px_rgba(5,150,105,0.4)]"></span>
          </div>
          <span className="text-xs font-bold text-emerald-700 tracking-wider">LIVE DATA</span>
        </div>
      </div>
    </header>
  );
}
