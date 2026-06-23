"use client";

import { useBrakeFaults } from "@/services/queries";
import { formatIST } from "@/lib/utils/time";
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
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Faults & Alerts</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Recorded Faults</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-card-foreground">{faults?.length || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active / Recent Faults</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${activeFaults > 0 ? "text-red-600" : "text-emerald-600"}`}>
              {activeFaults}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {activeFaults > 0 ? (
                <>
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                  <span className="text-xl font-bold text-red-600">Needs Attention</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-8 h-8 text-emerald-600" />
                  <span className="text-xl font-bold text-emerald-600">Healthy</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg text-card-foreground">Fault Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground font-medium w-[200px]">Timestamp</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Fault Name</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Event Message</TableHead>
                  <TableHead className="text-muted-foreground font-medium text-right">Duration (s)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
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
                  <TableRow key={`${fault.timestamp}-${index}`} className="border-border hover:bg-muted/50 transition-colors">
                    <TableCell className="text-foreground">
                      {formatIST(fault.timestamp)}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-semibold border ${
                        fault.fault_name !== "None" ? "bg-red-100 text-red-800 border-red-200" : "bg-emerald-100 text-emerald-800 border-emerald-200"
                      }`}>
                        {fault.fault_name || "None"}
                      </span>
                    </TableCell>
                    <TableCell className="text-foreground">{fault.event_message}</TableCell>
                    <TableCell className="text-right text-muted-foreground font-medium">
                      {fault.fault_duration || "-"}
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && faults?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
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
