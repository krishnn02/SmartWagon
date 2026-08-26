"use client";

import { AlertTriangle, CheckCircle, ShieldAlert, Siren, Gauge } from "lucide-react";
import type { PneumaticAlerts } from "@/types/pneumatic";
import { cn } from "@/lib/utils";

interface DiagnosticFlagsProps {
  alerts: PneumaticAlerts;
}

const FLAGS = [
  { key: "binding_residual" as const, label: "Brake Binding", icon: AlertTriangle },
  { key: "binding_severe" as const, label: "Severe Brake Binding", icon: Siren },
  { key: "cr_overcharge" as const, label: "CR Overcharging", icon: ShieldAlert },
  { key: "emergency" as const, label: "Emergency Brake", icon: Siren },
  { key: "dv_defect" as const, label: "DV/BC Defect", icon: Gauge },
  { key: "leakage" as const, label: "Air Leakage", icon: AlertTriangle },
];

export function DiagnosticFlags({ alerts }: DiagnosticFlagsProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <h3 className="text-sm font-bold text-slate-900 mb-4">Diagnostic Flags</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {FLAGS.map((flag) => {
          const status = alerts[flag.key];
          const isOk = status === "green";
          return (
            <div
              key={flag.key}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-3 transition-colors",
                isOk
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-red-50 border-red-200"
              )}
            >
              {isOk ? (
                <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
              ) : (
                <flag.icon className="h-5 w-5 text-red-600 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className={cn("text-xs font-semibold", isOk ? "text-emerald-800" : "text-red-800")}>
                  {flag.label}
                </p>
                <p className={cn("text-[10px] font-medium", isOk ? "text-emerald-600" : "text-red-600")}>
                  {isOk ? "OK" : status.toUpperCase().replace("_", " ")}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
