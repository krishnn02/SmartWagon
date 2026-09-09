"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ListFilter } from "lucide-react";

interface HotAxleFiltersProps {
  trainOptions: string[];
  coachTypeOptions: string[];
  uniqueIdOptions: string[];
  filters: {
    trainNumber: string;
    coachType: string;
    uniqueId: string;
    status: string;
  };
  setFilters: (f: any) => void;
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
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-blue-500 flex items-center gap-1">
          Filters
        </h3>
        <button
          onClick={onClearFilters}
          className="flex items-center gap-1.5 text-xs font-bold text-blue-500 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <ListFilter className="h-3.5 w-3.5" /> Clear Filters
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3 gap-3">
        <div>
          <label className="text-[10px] font-semibold text-slate-500 mb-1 block">Train Number</label>
          <select
            value={filters.trainNumber}
            onChange={(e) => updateFilter("trainNumber", e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="All">All Trains</option>
            {trainOptions.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-semibold text-slate-500 mb-1 block">Coach Type</label>
          <select
            value={filters.coachType}
            onChange={(e) => updateFilter("coachType", e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="All">All Types</option>
            {coachTypeOptions.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-semibold text-slate-500 mb-1 block">Unique ID</label>
          <select
            value={filters.uniqueId}
            onChange={(e) => updateFilter("uniqueId", e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="All">All Unique IDs</option>
            {uniqueIdOptions.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-[10px] font-semibold text-slate-500 mb-2 block">Status</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-2">
          {["All", "Good", "Warning", "Critical"].map((s) => (
            <button
              key={s}
              onClick={() => updateFilter("status", s)}
              className={cn(
                "text-[11px] py-1.5 rounded-lg border font-semibold transition-colors text-center w-full",
                filters.status === s
                  ? "border-blue-500 text-blue-500 bg-white"
                  : "border-slate-200 text-slate-500 hover:bg-slate-50"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
