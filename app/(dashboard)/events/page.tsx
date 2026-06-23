"use client";

import { useEventHistory } from "@/services/queries";
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
import { History } from "lucide-react";

export default function EventHistoryPage() {
  const { data: events, isLoading, error } = useEventHistory();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <History className="w-6 h-6 text-blue-500" />
          Event History
        </h1>
      </div>

      <Card className="bg-zinc-950 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-lg text-zinc-100">System Events Log</CardTitle>
        </CardHeader>
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
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-zinc-500">
                      Loading events...
                    </TableCell>
                  </TableRow>
                )}
                {error && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-red-500">
                      Error loading events: {(error as Error).message}
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
                {!isLoading && events?.length === 0 && (
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
      </Card>
    </div>
  );
}
