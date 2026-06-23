"use client";

import { useState } from "react";
import { useEventHistory, usePressureHistory } from "@/services/queries";
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
import { History, ChevronDown, ChevronUp } from "lucide-react";

export default function EventHistoryPage() {
  const { data: events, isLoading: isEventsLoading, error: eventsError } = useEventHistory();
  const { data: history, isLoading: isHistoryLoading, error: historyError } = usePressureHistory(100);

  const [systemEventsExpanded, setSystemEventsExpanded] = useState(true);
  const [brakeTimelineExpanded, setBrakeTimelineExpanded] = useState(true);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <History className="w-6 h-6 text-blue-500" />
          Event History
        </h1>
      </div>

      <Card className="bg-zinc-950 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div 
            className="flex items-center gap-2 cursor-pointer select-none group" 
            onClick={() => setSystemEventsExpanded(!systemEventsExpanded)}
          >
            <CardTitle className="text-lg text-zinc-100 group-hover:text-white transition-colors">System Events Log</CardTitle>
            {systemEventsExpanded ? <ChevronUp className="w-5 h-5 text-zinc-400 group-hover:text-zinc-300" /> : <ChevronDown className="w-5 h-5 text-zinc-400 group-hover:text-zinc-300" />}
          </div>
        </CardHeader>
        {systemEventsExpanded && (
          <CardContent>
            <div className="rounded-md border border-zinc-800 overflow-hidden">
              <Table>
                <TableHeader className="bg-zinc-900/50">
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-zinc-400 font-medium w-[200px]">Timestamp</TableHead>
                    <TableHead className="text-zinc-400 font-medium">Event Message</TableHead>
                    <TableHead className="text-zinc-400 font-medium text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isEventsLoading && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-zinc-500">
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
                    <TableRow key={`${event.timestamp}-${index}`} className="border-zinc-800 hover:bg-zinc-900/50 transition-colors">
                      <TableCell className="text-zinc-300">
                        {format(new Date(event.timestamp), "yyyy-MM-dd HH:mm:ss")}
                      </TableCell>
                      <TableCell className="text-zinc-200 font-medium">
                        {event.event_message}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          event.event_status === "Success" ? "bg-emerald-500/10 text-emerald-500" :
                          event.event_status === "Failed" ? "bg-red-500/10 text-red-500" :
                          "bg-blue-500/10 text-blue-500"
                        }`}>
                          {event.event_status || "Unknown"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!isEventsLoading && events?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-zinc-500">
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

      <Card className="bg-zinc-950 border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div 
            className="flex items-center gap-2 cursor-pointer select-none group" 
            onClick={() => setBrakeTimelineExpanded(!brakeTimelineExpanded)}
          >
            <CardTitle className="text-lg text-zinc-100 group-hover:text-white transition-colors">Brake Timeline</CardTitle>
            {brakeTimelineExpanded ? <ChevronUp className="w-5 h-5 text-zinc-400 group-hover:text-zinc-300" /> : <ChevronDown className="w-5 h-5 text-zinc-400 group-hover:text-zinc-300" />}
          </div>
        </CardHeader>
        {brakeTimelineExpanded && (
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
                  {isHistoryLoading && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-zinc-500">
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
                  {!isHistoryLoading && history?.length === 0 && (
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
        )}
      </Card>
    </div>
  );
}
