"use client";

import { useState } from "react";
import { useEventHistory, usePressureHistory } from "@/services/queries";
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
import { History, ChevronDown, ChevronUp } from "lucide-react";

export default function EventHistoryPage() {
  const { data: events, isLoading: isEventsLoading, error: eventsError } = useEventHistory();
  const { data: history, isLoading: isHistoryLoading, error: historyError } = usePressureHistory(100);

  const [systemEventsExpanded, setSystemEventsExpanded] = useState(true);
  const [brakeTimelineExpanded, setBrakeTimelineExpanded] = useState(true);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <History className="w-6 h-6 text-blue-500" />
          Event History
        </h1>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div 
            className="flex items-center gap-2 cursor-pointer select-none group" 
            onClick={() => setSystemEventsExpanded(!systemEventsExpanded)}
          >
            <CardTitle className="text-lg text-card-foreground group-hover:text-foreground transition-colors">System Events Log</CardTitle>
            {systemEventsExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground group-hover:text-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />}
          </div>
        </CardHeader>
        {systemEventsExpanded && (
          <CardContent>
            <div className="rounded-md border border-border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground font-medium w-[200px]">Timestamp</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Event Message</TableHead>
                    <TableHead className="text-muted-foreground font-medium text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isEventsLoading && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        Loading events...
                      </TableCell>
                    </TableRow>
                  )}
                  {eventsError && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-red-500">
                        Error loading events: {(eventsError as Error).message}
                      </TableCell>
                    </TableRow>
                  )}
                  {events?.map((event, index) => (
                    <TableRow key={`${event.timestamp}-${index}`} className="border-border hover:bg-muted/50 transition-colors">
                      <TableCell className="text-foreground">
                        {formatIST(event.timestamp)}
                      </TableCell>
                      <TableCell className="text-card-foreground font-medium">
                        {event.event_message}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`px-2 py-1 rounded text-xs font-semibold border ${
                          event.event_status === "Success" ? "bg-emerald-100 text-emerald-800 border-emerald-200" :
                          event.event_status === "Failed" ? "bg-red-100 text-red-800 border-red-200" :
                          "bg-blue-100 text-blue-800 border-blue-200"
                        }`}>
                          {event.event_status || "Unknown"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!isEventsLoading && events?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        No events recorded
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        )}
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div 
            className="flex items-center gap-2 cursor-pointer select-none group" 
            onClick={() => setBrakeTimelineExpanded(!brakeTimelineExpanded)}
          >
            <CardTitle className="text-lg text-card-foreground group-hover:text-foreground transition-colors">Brake Timeline</CardTitle>
            {brakeTimelineExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground group-hover:text-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />}
          </div>
        </CardHeader>
        {brakeTimelineExpanded && (
          <CardContent>
            <div className="rounded-md border border-border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground font-medium">Timestamp</TableHead>
                    <TableHead className="text-muted-foreground font-medium text-right">BP</TableHead>
                    <TableHead className="text-muted-foreground font-medium text-right">FP</TableHead>
                    <TableHead className="text-muted-foreground font-medium text-right">CR</TableHead>
                    <TableHead className="text-muted-foreground font-medium text-right">BC</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isHistoryLoading && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Loading timeline data...
                      </TableCell>
                    </TableRow>
                  )}
                  {historyError && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-red-500">
                        Error loading data: {(historyError as Error).message}
                      </TableCell>
                    </TableRow>
                  )}
                  {history?.map((row, index) => (
                    <TableRow key={`${row.timestamp}-${index}`} className="border-border hover:bg-muted/50 transition-colors">
                      <TableCell className="text-foreground">
                        {formatIST(row.timestamp)}
                      </TableCell>
                      <TableCell className="text-right text-emerald-600 font-semibold">{row.bp?.toFixed(2) || "-"}</TableCell>
                      <TableCell className="text-right text-slate-700 font-semibold">{row.fp?.toFixed(2) || "-"}</TableCell>
                      <TableCell className="text-right text-blue-600 font-semibold">{row.cr?.toFixed(2) || "-"}</TableCell>
                      <TableCell className="text-right text-red-600 font-semibold">{row.bc?.toFixed(2) || "-"}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-semibold border ${
                          row.brake_status === "Brake Applied" ? "bg-blue-100 text-blue-800 border-blue-200" :
                          row.brake_status === "Brake Released" ? "bg-emerald-100 text-emerald-800 border-emerald-200" :
                          "bg-slate-100 text-slate-800 border-slate-200"
                        }`}>
                          {row.brake_status || "Unknown"}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.brake_duration ? `${row.brake_duration}s` : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!isHistoryLoading && history?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No data available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
