"use client";

import { FileDown } from "lucide-react";

interface ReportTriggerButtonProps {
  onClick: () => void;
  className?: string;
}

export function ReportTriggerButton({ onClick, className }: ReportTriggerButtonProps) {
  return (
    <button
      onClick={onClick}
      id="report-trigger-btn"
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95 ${className || ""}`}
    >
      <FileDown className="h-3.5 w-3.5" />
      <span>Download Report</span>
    </button>
  );
}
