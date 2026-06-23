import { COACH_INFO } from "@/constants";

export function Header() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-6">
      <div className="flex items-center gap-4">
        {/* Placeholder for Central Railway Logo */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
          CR
        </div>
        <h2 className="text-lg font-semibold text-zinc-100">
          Central Railway Brake Monitoring System
        </h2>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4 text-sm text-zinc-400">
          <div className="flex flex-col items-end">
            <span className="font-medium text-zinc-300">Coach: {COACH_INFO.coach_no}</span>
            <span className="text-xs">ID: {COACH_INFO.Actual_id}</span>
          </div>
          <div className="h-8 w-px bg-zinc-800" />
          <div className="flex flex-col items-start">
            <span className="font-medium text-zinc-300">Train: {COACH_INFO.Train_no}</span>
            <span className="text-xs">Loc: {COACH_INFO.Location}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full bg-zinc-900 px-3 py-1 border border-zinc-800">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-medium text-emerald-500 tracking-wider">LIVE DATA</span>
        </div>
      </div>
    </header>
  );
}
