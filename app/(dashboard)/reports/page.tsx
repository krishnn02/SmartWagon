"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { generatePdfReport, generateExcelReport, ReportType } from "@/lib/utils/export";
import { supabase } from "@/lib/supabase";
import { COACH_INFO } from "@/constants";

export default function ReportsPage() {
  const [isExporting, setIsExporting] = useState<{ type: string; format: string } | null>(null);

  const fetchReportData = async (type: ReportType) => {
    // Calculate the cutoff date based on the report type
    const now = new Date();
    if (type === "Daily") {
      now.setHours(now.getHours() - 24);
    } else if (type === "Weekly") {
      now.setDate(now.getDate() - 7);
    } else if (type === "Monthly") {
      now.setDate(now.getDate() - 30);
    }
    const cutoffIso = now.toISOString();

    // Fetch from all 3 tables
    const [telemetryRes, faultsRes, eventsRes] = await Promise.all([
      supabase
        .from("bpc_pressure")
        .select("*")
        .eq("device_id", COACH_INFO.device_id)
        .gte("timestamp", cutoffIso)
        .order("timestamp", { ascending: false })
        .limit(1000), // Limit telemetry to avoid crashing client
      supabase
        .from("brake_fault_event")
        .select("*")
        .eq("device_id", COACH_INFO.device_id)
        .gte("timestamp", cutoffIso)
        .order("timestamp", { ascending: false }),
      supabase
        .from("event_publish")
        .select("*")
        .eq("device_id", COACH_INFO.device_id)
        .gte("timestamp", cutoffIso)
        .order("timestamp", { ascending: false })
    ]);

    if (telemetryRes.error) throw telemetryRes.error;
    if (faultsRes.error) throw faultsRes.error;
    if (eventsRes.error) throw eventsRes.error;

    return {
      telemetry: telemetryRes.data || [],
      faults: faultsRes.data || [],
      events: eventsRes.data || [],
    };
  };

  const handleExport = async (type: ReportType, format: 'PDF' | 'Excel') => {
    try {
      setIsExporting({ type, format });
      
      const data = await fetchReportData(type);
      
      if (format === 'PDF') {
        generatePdfReport(data, type);
      } else {
        generateExcelReport(data, type);
      }
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to generate report. Please try again.");
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <FileText className="w-6 h-6 text-emerald-500" />
          System Reports
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg text-card-foreground">Daily Report</CardTitle>
            <CardDescription className="text-muted-foreground">Telemetry, faults, and performance for today.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => handleExport("Daily", "PDF")} 
              disabled={isExporting !== null}
              variant="outline" 
              className="w-full bg-muted border-border hover:bg-muted text-foreground hover:text-foreground"
            >
              {isExporting?.type === "Daily" && isExporting?.format === "PDF" ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Exporting...</>
              ) : (
                <><Download className="w-4 h-4 mr-2" /> Export PDF</>
              )}
            </Button>
            <Button 
              onClick={() => handleExport("Daily", "Excel")} 
              disabled={isExporting !== null}
              variant="outline" 
              className="w-full bg-muted border-border hover:bg-muted text-foreground hover:text-foreground"
            >
              {isExporting?.type === "Daily" && isExporting?.format === "Excel" ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin text-emerald-500" /> Exporting...</>
              ) : (
                <><FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-500" /> Export Excel</>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg text-card-foreground">Weekly Report</CardTitle>
            <CardDescription className="text-muted-foreground">7-day trends and aggregate system health.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => handleExport("Weekly", "PDF")} 
              disabled={isExporting !== null}
              variant="outline" 
              className="w-full bg-muted border-border hover:bg-muted text-foreground hover:text-foreground"
            >
              {isExporting?.type === "Weekly" && isExporting?.format === "PDF" ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Exporting...</>
              ) : (
                <><Download className="w-4 h-4 mr-2" /> Export PDF</>
              )}
            </Button>
            <Button 
              onClick={() => handleExport("Weekly", "Excel")} 
              disabled={isExporting !== null}
              variant="outline" 
              className="w-full bg-muted border-border hover:bg-muted text-foreground hover:text-foreground"
            >
              {isExporting?.type === "Weekly" && isExporting?.format === "Excel" ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin text-emerald-500" /> Exporting...</>
              ) : (
                <><FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-500" /> Export Excel</>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg text-card-foreground">Monthly Report</CardTitle>
            <CardDescription className="text-muted-foreground">Complete monthly overview of B1 coach.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => handleExport("Monthly", "PDF")} 
              disabled={isExporting !== null}
              variant="outline" 
              className="w-full bg-muted border-border hover:bg-muted text-foreground hover:text-foreground"
            >
              {isExporting?.type === "Monthly" && isExporting?.format === "PDF" ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Exporting...</>
              ) : (
                <><Download className="w-4 h-4 mr-2" /> Export PDF</>
              )}
            </Button>
            <Button 
              onClick={() => handleExport("Monthly", "Excel")} 
              disabled={isExporting !== null}
              variant="outline" 
              className="w-full bg-muted border-border hover:bg-muted text-foreground hover:text-foreground"
            >
              {isExporting?.type === "Monthly" && isExporting?.format === "Excel" ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin text-emerald-500" /> Exporting...</>
              ) : (
                <><FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-500" /> Export Excel</>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
