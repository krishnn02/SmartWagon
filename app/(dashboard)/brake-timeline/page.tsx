"use client";

import { usePressureHistory } from "@/services/queries";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function BrakeTimelinePage() {
  const { data: history, isLoading, error } = usePressureHistory(100);

  const handleExportCSV = () => {
    // Stub for CSV export
    console.log("Exporting CSV...");
    alert("Export CSV feature would trigger here.");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-white">Brake Timeline</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <Card className="bg-zinc-950 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-lg text-zinc-100">Historical Telemetry Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-zinc-800 overflow-hidden">
            <Table>
              <TableHeader className="bg-zinc-900/50">
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400 font-medium">Timestamp</TableHead>
                  <TableHead className="text-zinc-400 font-medium text-right">BP</TableHead>
                  <TableHead className="text-zinc-400 font-medium text-right">FP</TableHead>
                  <TableHead className="text-zinc-400 font-medium text-right">CR</TableHead>
                  <TableHead className="text-zinc-400 font-medium text-right">BC</TableHead>
                  <TableHead className="text-zinc-400 font-medium">Status</TableHead>
                  <TableHead className="text-zinc-400 font-medium">Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-zinc-500">
                      Loading timeline data...
                    </TableCell>
                  </TableRow>
                )}
                {error && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-red-500">
                      Error loading data: {(error as Error).message}
                    </TableCell>
                  </TableRow>
                )}
                {history?.map((row, index) => (
                  <TableRow key={`${row.timestamp}-${index}`} className="border-zinc-800 hover:bg-zinc-900/50 transition-colors">
                    <TableCell className="text-zinc-300">
                      {format(new Date(row.timestamp), "yyyy-MM-dd HH:mm:ss")}
                    </TableCell>
                    <TableCell className="text-right text-emerald-400 font-medium">{row.bp?.toFixed(2) || "-"}</TableCell>
                    <TableCell className="text-right text-zinc-300 font-medium">{row.fp?.toFixed(2) || "-"}</TableCell>
                    <TableCell className="text-right text-blue-400 font-medium">{row.cr?.toFixed(2) || "-"}</TableCell>
                    <TableCell className="text-right text-red-400 font-medium">{row.bc?.toFixed(2) || "-"}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        row.brake_status === "Brake Applied" ? "bg-amber-500/10 text-amber-500" :
                        row.brake_status === "Brake Released" ? "bg-emerald-500/10 text-emerald-500" :
                        "bg-zinc-800 text-zinc-400"
                      }`}>
                        {row.brake_status || "Unknown"}
                      </span>
                    </TableCell>
                    <TableCell className="text-zinc-400">
                      {row.brake_duration ? `${row.brake_duration}s` : "-"}
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && history?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-zinc-500">
                      No data available
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
