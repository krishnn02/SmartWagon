"use client";

import { useRealtimeTelemetry } from "@/hooks/useRealtimeTelemetry";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";

export default function SystemStatusPage() {
  const { latestData, isConnected, isMockMode } = useRealtimeTelemetry();

  const isDataFresh = latestData?.timestamp 
    ? (new Date().getTime() - new Date(latestData.timestamp).getTime()) < 30000 
    : false;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-white">System Status</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg text-zinc-100">Connection Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Supabase Realtime</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${isConnected ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Environment</span>
              <span className="px-2 py-1 rounded text-xs font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">
                {isMockMode ? 'Mock Mode' : 'Production'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg text-zinc-100">Device Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Device Status</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${isDataFresh ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                {isDataFresh ? 'Online' : 'Warning: Stale Data'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Last Data Received</span>
              <span className="text-zinc-200">
                {latestData?.timestamp ? formatDistanceToNow(new Date(latestData.timestamp), { addSuffix: true }) : 'Never'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
