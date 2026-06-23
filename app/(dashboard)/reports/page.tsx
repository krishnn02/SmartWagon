"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, FileSpreadsheet } from "lucide-react";

export default function ReportsPage() {
  const handleExport = (type: string, format: string) => {
    alert(`Exporting ${type} Report as ${format} would trigger here.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <FileText className="w-6 h-6 text-emerald-500" />
          System Reports
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg text-zinc-100">Daily Report</CardTitle>
            <CardDescription className="text-zinc-400">Telemetry, faults, and performance for today.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => handleExport("Daily", "PDF")} variant="outline" className="w-full bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-white">
              <Download className="w-4 h-4 mr-2" /> Export PDF
            </Button>
            <Button onClick={() => handleExport("Daily", "Excel")} variant="outline" className="w-full bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-white">
              <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-500" /> Export Excel
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg text-zinc-100">Weekly Report</CardTitle>
            <CardDescription className="text-zinc-400">7-day trends and aggregate system health.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => handleExport("Weekly", "PDF")} variant="outline" className="w-full bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-white">
              <Download className="w-4 h-4 mr-2" /> Export PDF
            </Button>
            <Button onClick={() => handleExport("Weekly", "Excel")} variant="outline" className="w-full bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-white">
              <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-500" /> Export Excel
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg text-zinc-100">Monthly Report</CardTitle>
            <CardDescription className="text-zinc-400">Complete monthly overview of B1 coach.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => handleExport("Monthly", "PDF")} variant="outline" className="w-full bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-white">
              <Download className="w-4 h-4 mr-2" /> Export PDF
            </Button>
            <Button onClick={() => handleExport("Monthly", "Excel")} variant="outline" className="w-full bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-white">
              <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-500" /> Export Excel
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
