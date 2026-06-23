"use client";

import { useBrakeFaults } from "@/services/queries";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, ShieldCheck } from "lucide-react";

export default function FaultsAlertsPage() {
  const { data: faults, isLoading, error } = useBrakeFaults();

  // Basic stats
  const activeFaults = faults?.filter((f) => f.fault_name && f.fault_name !== "None").length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-white">Faults & Alerts</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Total Recorded Faults</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-zinc-100">{faults?.length || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Active / Recent Faults</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${activeFaults > 0 ? "text-red-500" : "text-emerald-500"}`}>
              {activeFaults}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {activeFaults > 0 ? (
                <>
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                  <span className="text-xl font-bold text-red-500">Needs Attention</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-8 h-8 text-emerald-500" />
                  <span className="text-xl font-bold text-emerald-500">Healthy</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-zinc-950 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-lg text-zinc-100">Fault Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-zinc-800 overflow-hidden">
            <Table>
              <TableHeader className="bg-zinc-900/50">
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400 font-medium w-[200px]">Timestamp</TableHead>
                  <TableHead className="text-zinc-400 font-medium">Fault Name</TableHead>
                  <TableHead className="text-zinc-400 font-medium">Event Message</TableHead>
                  <TableHead className="text-zinc-400 font-medium text-right">Duration (s)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-zinc-500">
                      Loading faults...
                    </TableCell>
                  </TableRow>
                )}
                {error && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-red-500">
                      Error loading faults: {(error as Error).message}
                    </TableCell>
                  </TableRow>
                )}
                {faults?.map((fault, index) => (
                  <TableRow key={`${fault.timestamp}-${index}`} className="border-zinc-800 hover:bg-zinc-900/50 transition-colors">
                    <TableCell className="text-zinc-300">
                      {format(new Date(fault.timestamp), "yyyy-MM-dd HH:mm:ss")}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        fault.fault_name !== "None" ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"
                      }`}>
                        {fault.fault_name || "None"}
                      </span>
                    </TableCell>
                    <TableCell className="text-zinc-300">{fault.event_message}</TableCell>
                    <TableCell className="text-right text-zinc-400 font-medium">
                      {fault.fault_duration || "-"}
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && faults?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-zinc-500">
                      No faults recorded
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
