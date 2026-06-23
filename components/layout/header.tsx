import { COACH_INFO } from "@/constants";

export function Header() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-6">
      <div className="flex items-center gap-4">
        {/* Placeholder for Railway Logo */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-xs font-bold text-white shadow-lg shadow-blue-500/20">
          RW
        </div>
        <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent drop-shadow-sm">
          Railway Brake Monitoring System
        </h2>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4 text-sm text-zinc-400">
          <div className="flex flex-col items-end">
            <span className="font-medium text-zinc-200">Coach: {COACH_INFO.coach_no}</span>
            <span className="text-xs text-zinc-500">ID: {COACH_INFO.Actual_id}</span>
          </div>
          <div className="h-8 w-px bg-zinc-800" />
          <div className="flex flex-col items-start">
            <span className="font-medium text-zinc-200">Train: {COACH_INFO.Train_no}</span>
            <span className="text-xs text-zinc-500">Loc: {COACH_INFO.Location}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full bg-zinc-900/80 backdrop-blur-sm px-3 py-1.5 border border-zinc-800/50 shadow-sm">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
          </div>
          <span className="text-xs font-bold text-emerald-400 tracking-wider">LIVE DATA</span>
        </div>
      </div>
    </header>
  );
}
