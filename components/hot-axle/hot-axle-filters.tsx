"use client";

import { cn } from "@/lib/utils";
import {
  Train,
  Cpu,
  Layers,
  ArrowUpDown,
  RotateCcw,
  ChevronDown,
  X,
  SlidersHorizontal,
} from "lucide-react";

export type SortOption =
  | "default"
  | "temp-desc"
  | "temp-asc"
  | "status"
  | "coach"
  | "device"
  | "newest";

export interface FilterState {
  trainNumber: string;
  coachType: string;
  uniqueId: string;
  status: string;
  sortBy: SortOption;
}

export interface UniqueIdOption {
  value: string;
  label: string;
}

export interface StatusCounts {
  all: number;
  good: number;
  warning: number;
  critical: number;
}

interface HotAxleFiltersProps {
  trainOptions: string[];
  coachTypeOptions: string[];
  uniqueIdOptions: UniqueIdOption[];
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  onClearFilters: () => void;
  statusCounts?: StatusCounts;
  totalCoaches?: number;
  filteredCount?: number;
}

export function HotAxleFilters({
  trainOptions,
  coachTypeOptions,
  uniqueIdOptions,
  filters,
  setFilters,
  onClearFilters,
  statusCounts = { all: 0, good: 0, warning: 0, critical: 0 },
  totalCoaches = 0,
  filteredCount = 0,
}: HotAxleFiltersProps) {
  const updateFilter = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const hasActiveFilters =
    filters.trainNumber !== "All" ||
    filters.coachType !== "All" ||
    filters.uniqueId !== "All" ||
    filters.status !== "All" ||
    filters.sortBy !== "default";

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5 w-full space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
            <SlidersHorizontal className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Filters & Telemetry Sort
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">
              Showing {filteredCount} of {totalCoaches} available {totalCoaches === 1 ? "coach" : "coaches"}
            </p>
          </div>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200/60 px-3 py-1.5 rounded-xl transition-all shadow-2xs self-start sm:self-auto cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Clear Filters</span>
          </button>
        )}
      </div>

      {/* Main Filter Controls Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Train Number Filter */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Train className="h-3 w-3 text-slate-400" />
            <span>Train Number</span>
          </label>
          <div className="relative">
            <select
              value={filters.trainNumber}
              onChange={(e) => updateFilter("trainNumber", e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white focus:bg-white py-2 pl-8 pr-8 text-xs font-semibold text-slate-800 shadow-2xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer min-w-0 truncate"
            >
              <option value="All">
                All Trains ({trainOptions.length})
              </option>
              {trainOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <Train className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>

        {/* Coach Type / No Filter */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Layers className="h-3 w-3 text-slate-400" />
            <span>Coach No / Type</span>
          </label>
          <div className="relative">
            <select
              value={filters.coachType}
              onChange={(e) => updateFilter("coachType", e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white focus:bg-white py-2 pl-8 pr-8 text-xs font-semibold text-slate-800 shadow-2xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer min-w-0 truncate"
            >
              <option value="All">
                All Coaches ({coachTypeOptions.length})
              </option>
              {coachTypeOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <Layers className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>

        {/* Device ID / Hot Axle Unique ID Filter */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Cpu className="h-3 w-3 text-slate-400" />
            <span>Hot Axle Device ID</span>
          </label>
          <div className="relative">
            <select
              value={filters.uniqueId}
              onChange={(e) => updateFilter("uniqueId", e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white focus:bg-white py-2 pl-8 pr-8 text-xs font-semibold text-slate-800 shadow-2xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer min-w-0 truncate font-mono"
            >
              <option value="All">
                All Devices ({uniqueIdOptions.length})
              </option>
              {uniqueIdOptions.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
            <Cpu className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>

        {/* Sort By Filter */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <ArrowUpDown className="h-3 w-3 text-slate-400" />
            <span>Sort By</span>
          </label>
          <div className="relative">
            <select
              value={filters.sortBy}
              onChange={(e) => updateFilter("sortBy", e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white focus:bg-white py-2 pl-8 pr-8 text-xs font-semibold text-slate-800 shadow-2xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer min-w-0 truncate"
            >
              <option value="default">Default Order</option>
              <option value="temp-desc">Max Temp: High to Low</option>
              <option value="temp-asc">Max Temp: Low to High</option>
              <option value="status">Status: Critical First</option>
              <option value="coach">Coach No (A - Z)</option>
              <option value="device">Device ID (A - Z)</option>
              <option value="newest">Latest Telemetry (Newest)</option>
            </select>
            <ArrowUpDown className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Status Bar Pills with dynamic counts */}
      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Filter Status:
          </span>
          {[
            { id: "All", label: "All", count: statusCounts.all, color: "text-blue-600 bg-blue-50" },
            { id: "Good", label: "Good", count: statusCounts.good, color: "text-emerald-600 bg-emerald-50" },
            { id: "Warning", label: "Warning", count: statusCounts.warning, color: "text-amber-600 bg-amber-50" },
            { id: "Critical", label: "Critical", count: statusCounts.critical, color: "text-red-600 bg-red-50" },
          ].map((s) => {
            const isSelected = filters.status === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => updateFilter("status", s.id)}
                className={cn(
                  "text-xs py-1.5 px-3 rounded-xl font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer border shadow-2xs",
                  isSelected
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm ring-2 ring-slate-900/10"
                    : "bg-slate-50/80 text-slate-600 hover:bg-slate-100 border-slate-200/80 hover:border-slate-300"
                )}
              >
                <span>{s.label}</span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full font-extrabold",
                    isSelected
                      ? "bg-white/20 text-white"
                      : s.color
                  )}
                >
                  {s.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Filters Summary Chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
            {filters.trainNumber !== "All" && (
              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg text-[10.5px] font-semibold border border-slate-200">
                Train: {filters.trainNumber}
                <button
                  onClick={() => updateFilter("trainNumber", "All")}
                  className="hover:text-red-500 cursor-pointer"
                  title="Remove filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.coachType !== "All" && (
              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg text-[10.5px] font-semibold border border-slate-200">
                Coach: {filters.coachType}
                <button
                  onClick={() => updateFilter("coachType", "All")}
                  className="hover:text-red-500 cursor-pointer"
                  title="Remove filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.uniqueId !== "All" && (
              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg text-[10.5px] font-semibold border border-slate-200">
                Device: {uniqueIdOptions.find(o => o.value === filters.uniqueId)?.label || filters.uniqueId}
                <button
                  onClick={() => updateFilter("uniqueId", "All")}
                  className="hover:text-red-500 cursor-pointer"
                  title="Remove filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.sortBy !== "default" && (
              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg text-[10.5px] font-semibold border border-blue-200">
                Sorted
                <button
                  onClick={() => updateFilter("sortBy", "default")}
                  className="hover:text-red-500 cursor-pointer"
                  title="Reset sort"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
