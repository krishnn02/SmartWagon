"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BpcPressure } from "@/types/database";
import { Activity, AlertOctagon, Clock, ShieldCheck, AlertTriangle } from "lucide-react";
import { formatISTTime12 } from "@/lib/utils/time";

export function StatusPanel({ data }: { data: BpcPressure | null }) {
  const isApplied = data?.brake_status === "Brake Applied";
  const isReleased = data?.brake_status === "Brake Released";
  const isOffline = data?.brake_status === "Device Offline";
  
  const hasFault = data?.brake_fault && data.brake_fault !== "None";

  const getStatusColor = () => {
    if (isApplied) return "bg-blue-100 text-blue-800 border-blue-200";
    if (isReleased) return "bg-emerald-100 text-emerald-800 border-emerald-200";
    if (isOffline) return "bg-red-100 text-red-800 border-red-200";
    return "bg-slate-100 text-slate-800 border-slate-200";
  };

  const getStatusIcon = () => {
    if (isOffline) return <AlertOctagon className="w-5 h-5 text-red-600" />;
    if (isApplied) return <Activity className="w-5 h-5 text-blue-600" />;
    return <ShieldCheck className="w-5 h-5 text-emerald-600" />;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Current Brake Status */}
      <Card className="bg-card border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            System State
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg border ${getStatusColor()}`}>
              {getStatusIcon()}
            </div>
            <div>
              <div className={`text-xl font-bold ${getStatusColor().split(' ')[1]}`}>
                {data?.brake_status || "Unknown"}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Last updated: {data?.timestamp ? formatISTTime12(data.timestamp) : "--:--:--"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Brake Fault */}
      <Card className="bg-card border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            Active Faults
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg border ${hasFault ? 'bg-red-100 border-red-200' : 'bg-emerald-100 border-emerald-200'}`}>
              {hasFault ? (
                <AlertTriangle className="w-5 h-5 text-red-600 animate-pulse" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              )}
            </div>
            <div>
              <div className={`text-xl font-bold ${hasFault ? 'text-red-600' : 'text-emerald-600'}`}>
                {data?.brake_fault || "None"}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {hasFault ? "Requires attention" : "System normal"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Brake Duration */}
      <Card className="bg-card border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            Timing Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div className="w-full">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-muted-foreground">Duration</span>
                <span className="font-semibold text-card-foreground">{data?.brake_duration || 0}s</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Applied</span>
                <span className="text-xs font-medium text-foreground">{data?.brake_applied_time ? formatISTTime12(data.brake_applied_time) : "--:--:--"}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
