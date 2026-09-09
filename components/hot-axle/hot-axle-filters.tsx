"use client";

import { cn } from "@/lib/utils";
import { ListFilter } from "lucide-react";

export interface FilterState {
  trainNumber: string;
  coachType: string;
  uniqueId: string;
  status: string;
}

interface HotAxleFiltersProps {
  trainOptions: string[];
  coachTypeOptions: string[];
  uniqueIdOptions: string[];
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  onClearFilters: () => void;
}

export function HotAxleFilters({
  trainOptions,
  coachTypeOptions,
  uniqueIdOptions,
  filters,
  setFilters,
  onClearFilters,
}: HotAxleFiltersProps) {
  const updateFilter = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <h3 className="text-sm font-bold text-blue-500 flex items-center gap-1">
          Filters
        </h3>
        <button
          onClick={onClearFilters}
          className="flex items-center gap-1.5 text-xs font-bold text-blue-500 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors shrink-0"
        >
          <ListFilter className="h-3.5 w-3.5" /> Clear Filters
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end w-full">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-grow w-full">
          <div>
            <label className="text-[10px] font-semibold text-slate-500 mb-1 block uppercase tracking-wider">Train Number</label>
            <select
              value={filters.trainNumber}
              onChange={(e) => updateFilter("trainNumber", e.target.value)}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="All">All Trains</option>
              {trainOptions.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-slate-500 mb-1 block uppercase tracking-wider">Coach Type</label>
            <select
              value={filters.coachType}
              onChange={(e) => updateFilter("coachType", e.target.value)}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="All">All Types</option>
              {coachTypeOptions.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-slate-500 mb-1 block uppercase tracking-wider">Unique ID</label>
            <select
              value={filters.uniqueId}
              onChange={(e) => updateFilter("uniqueId", e.target.value)}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="All">All Unique IDs</option>
              {uniqueIdOptions.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="w-full lg:w-auto shrink-0">
          <label className="text-[10px] font-semibold text-slate-500 mb-1 block uppercase tracking-wider">Status</label>
          <div className="flex flex-wrap sm:flex-nowrap gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
            {["All", "Good", "Warning", "Critical"].map((s) => (
              <button
                key={s}
                onClick={() => updateFilter("status", s)}
                className={cn(
                  "text-[11px] py-1.5 px-4 rounded-lg font-bold transition-all flex-1 text-center whitespace-nowrap",
                  filters.status === s
                    ? "bg-white text-blue-600 shadow-sm border border-slate-200/60"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-100 border border-transparent"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
