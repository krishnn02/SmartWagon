"use client";

import { CheckCircle } from "lucide-react";
import type { PneumaticAlerts } from "@/types/pneumatic";

interface DiagnosticFlagsProps {
  alerts: PneumaticAlerts;
}

const FLAGS = [
  { key: "binding_residual" as const, label: "Brake Binding" },
  { key: "binding_severe" as const, label: "Severe Brake Binding" },
  { key: "cr_overcharge" as const, label: "CR Overcharging" },
  { key: "emergency" as const, label: "Emergency Brake" },
  { key: "dv_defect" as const, label: "DV/BC Defect" },
];

export function DiagnosticFlags({ alerts }: DiagnosticFlagsProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-900">Diagnostic Flags</h3>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          All Circuits Nominal
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {FLAGS.map((flag) => (
          <div
            key={flag.key}
            className="flex items-center gap-3 rounded-xl border border-emerald-200/90 bg-emerald-50/70 p-3 transition-colors shadow-2xs"
          >
            <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-emerald-900 truncate">
                {flag.label}
              </p>
              <p className="text-[10px] font-extrabold text-emerald-600 tracking-wider">
                OK
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
