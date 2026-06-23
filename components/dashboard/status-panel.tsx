"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BpcPressure } from "@/types/database";
import { Activity, AlertOctagon, Clock, ShieldCheck, AlertTriangle } from "lucide-react";

export function StatusPanel({ data }: { data: BpcPressure | null }) {
  const isApplied = data?.brake_status === "Brake Applied";
  const isReleased = data?.brake_status === "Brake Released";
  const isOffline = data?.brake_status === "Device Offline";
  
  const hasFault = data?.brake_fault && data.brake_fault !== "None";

  const getStatusColor = () => {
    if (isApplied) return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    if (isReleased) return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    if (isOffline) return "bg-red-500/10 text-red-500 border-red-500/20";
    return "bg-blue-500/10 text-blue-500 border-blue-500/20";
  };

  const getStatusIcon = () => {
    if (isOffline) return <AlertOctagon className="w-5 h-5 text-red-500" />;
    if (isApplied) return <Activity className="w-5 h-5 text-amber-500" />;
    return <ShieldCheck className="w-5 h-5 text-emerald-500" />;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Current Brake Status */}
      <Card className="bg-zinc-950 border-zinc-800 shadow-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
            System State
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800">
              {getStatusIcon()}
            </div>
            <div>
              <div className={`text-xl font-bold ${getStatusColor().split(' ')[1]}`}>
                {data?.brake_status || "Unknown"}
              </div>
              <div className="text-sm text-zinc-500 mt-1">
                Last updated: {data?.timestamp ? new Date(data.timestamp).toLocaleTimeString() : "--:--:--"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Brake Fault */}
      <Card className="bg-zinc-950 border-zinc-800 shadow-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
            Active Faults
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg border ${hasFault ? 'bg-red-500/10 border-red-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
              {hasFault ? (
                <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
              )}
            </div>
            <div>
              <div className={`text-xl font-bold ${hasFault ? 'text-red-500' : 'text-emerald-500'}`}>
                {data?.brake_fault || "None"}
              </div>
              <div className="text-sm text-zinc-500 mt-1">
                {hasFault ? "Requires attention" : "System normal"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Brake Duration */}
      <Card className="bg-zinc-950 border-zinc-800 shadow-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
            Timing Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800">
              <Clock className="w-5 h-5 text-blue-500" />
            </div>
            <div className="w-full">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-zinc-400">Duration</span>
                <span className="font-semibold text-zinc-200">{data?.brake_duration || 0}s</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-500">Applied</span>
                <span className="text-xs text-zinc-300">{data?.brake_applied_time ? new Date(data.brake_applied_time).toLocaleTimeString() : "--:--:--"}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
