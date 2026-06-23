"use client";

import { usePressureHistory, useBrakeFaults } from "@/services/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Activity, ShieldAlert } from "lucide-react";

export default function AnalyticsPage() {
  const { data: history, isLoading: isHistoryLoading } = usePressureHistory(1000);
  const { data: faults, isLoading: isFaultsLoading } = useBrakeFaults();

  const isLoading = isHistoryLoading || isFaultsLoading;

  // Calculate Totals
  const totalApplications = history?.filter((h) => h.brake_status === "Brake Applied").length || 0;
  const totalReleases = history?.filter((h) => h.brake_status === "Brake Released").length || 0;
  const totalFaults = faults?.filter((f) => f.fault_name && f.fault_name !== "None").length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-purple-500" />
          Analytics Dashboard
        </h1>
      </div>

      {isLoading ? (
        <div className="text-zinc-500">Calculating analytics...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-zinc-950 border-zinc-800">
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="p-4 bg-amber-500/10 rounded-full">
                  <Activity className="w-8 h-8 text-amber-500" />
                </div>
                <div>
                  <div className="text-sm text-zinc-400 font-medium">Brake Applications</div>
                  <div className="text-3xl font-bold text-zinc-100">{totalApplications}</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-950 border-zinc-800">
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="p-4 bg-emerald-500/10 rounded-full">
                  <Activity className="w-8 h-8 text-emerald-500" />
                </div>
                <div>
                  <div className="text-sm text-zinc-400 font-medium">Brake Releases</div>
                  <div className="text-3xl font-bold text-zinc-100">{totalReleases}</div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-950 border-zinc-800">
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="p-4 bg-red-500/10 rounded-full">
                  <ShieldAlert className="w-8 h-8 text-red-500" />
                </div>
                <div>
                  <div className="text-sm text-zinc-400 font-medium">Total Faults</div>
                  <div className="text-3xl font-bold text-red-500">{totalFaults}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
