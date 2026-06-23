import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { BpcPressure, BrakeFaultEvent, EventPublish } from '@/types/database';
import { formatIST } from './time';

export type ReportType = 'Daily' | 'Weekly' | 'Monthly';

export interface ReportData {
  telemetry: BpcPressure[];
  faults: BrakeFaultEvent[];
  events: EventPublish[];
}

export function generatePdfReport(data: ReportData, type: ReportType) {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(18);
  doc.text(`SmartWagon ${type} System Report`, 14, 20);
  
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Coach ID: Raspberry4_7`, 14, 28);
  doc.text(`Generated: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`, 14, 34);

  let currentY = 45;

  // Overview Stats
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text('Overview Statistics', 14, currentY);
  currentY += 8;
  
  const totalFaults = data.faults.length;
  const totalTelemetry = data.telemetry.length;
  const avgBp = totalTelemetry > 0 ? (data.telemetry.reduce((acc, curr) => acc + (curr.bp || 0), 0) / totalTelemetry).toFixed(2) : 0;
  const avgBc = totalTelemetry > 0 ? (data.telemetry.reduce((acc, curr) => acc + (curr.bc || 0), 0) / totalTelemetry).toFixed(2) : 0;
  
  autoTable(doc, {
    startY: currentY,
    head: [['Metric', 'Value']],
    body: [
      ['Total Faults Logged', totalFaults.toString()],
      ['Telemetry Data Points', totalTelemetry.toString()],
      ['Average Brake Pipe (BP)', `${avgBp} kg/cm²`],
      ['Average Brake Cylinder (BC)', `${avgBc} kg/cm²`]
    ],
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] }
  });

  // @ts-ignore
  currentY = doc.lastAutoTable.finalY + 15;

  // Faults Table
  if (data.faults.length > 0) {
    doc.setFontSize(14);
    doc.text('Brake Fault Log', 14, currentY);
    currentY += 8;

    const faultRows = data.faults.map(f => [
      formatIST(f.timestamp),
      f.fault_name || 'Unknown',
      f.event_message || '',
      f.fault_duration ? `${f.fault_duration}s` : '-'
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Timestamp', 'Fault', 'Message', 'Duration']],
      body: faultRows,
      theme: 'striped',
      headStyles: { fillColor: [192, 57, 43] } // Red header for faults
    });

    // @ts-ignore
    currentY = doc.lastAutoTable.finalY + 15;
  }

  // Sample Telemetry Table (limit to last 50 to avoid massive PDFs)
  doc.setFontSize(14);
  doc.text('Telemetry Sample (Latest 50 entries)', 14, currentY);
  currentY += 8;

  const telemetrySample = data.telemetry.slice(0, 50);
  const telemetryRows = telemetrySample.map(t => [
    formatIST(t.timestamp),
    t.bp?.toFixed(2) || '-',
    t.fp?.toFixed(2) || '-',
    t.cr?.toFixed(2) || '-',
    t.bc?.toFixed(2) || '-',
    t.brake_status || '-'
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Timestamp', 'BP', 'FP', 'CR', 'BC', 'Status']],
    body: telemetryRows,
    theme: 'grid'
  });

  doc.save(`SmartWagon_${type}_Report.pdf`);
}

export function generateExcelReport(data: ReportData, type: ReportType) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Overview
  const totalFaults = data.faults.length;
  const totalTelemetry = data.telemetry.length;
  const avgBp = totalTelemetry > 0 ? (data.telemetry.reduce((acc, curr) => acc + (curr.bp || 0), 0) / totalTelemetry).toFixed(2) : 0;
  
  const overviewData = [
    ['Metric', 'Value'],
    ['Report Type', type],
    ['Coach ID', 'Raspberry4_7'],
    ['Generated Time (IST)', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })],
    ['Total Faults Logged', totalFaults],
    ['Telemetry Data Points', totalTelemetry],
    ['Average Brake Pipe (BP)', avgBp],
  ];
  const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
  XLSX.utils.book_append_sheet(wb, wsOverview, "Overview");

  // Sheet 2: Faults
  if (data.faults.length > 0) {
    const faultRows = data.faults.map(f => ({
      Timestamp: formatIST(f.timestamp),
      'Fault Name': f.fault_name || 'Unknown',
      Message: f.event_message || '',
      'Duration (s)': f.fault_duration || ''
    }));
    const wsFaults = XLSX.utils.json_to_sheet(faultRows);
    XLSX.utils.book_append_sheet(wb, wsFaults, "Faults");
  }

  // Sheet 3: Telemetry
  if (data.telemetry.length > 0) {
    const telemetryRows = data.telemetry.map(t => ({
      Timestamp: formatIST(t.timestamp),
      'BP (kg/cm²)': t.bp,
      'FP (kg/cm²)': t.fp,
      'CR (kg/cm²)': t.cr,
      'BC (kg/cm²)': t.bc,
      Status: t.brake_status
    }));
    const wsTelemetry = XLSX.utils.json_to_sheet(telemetryRows);
    XLSX.utils.book_append_sheet(wb, wsTelemetry, "Telemetry Log");
  }

  // Sheet 4: System Events
  if (data.events.length > 0) {
      const eventRows = data.events.map(e => ({
          Timestamp: formatIST(e.timestamp),
          Message: e.event_message,
          Status: e.event_status
      }));
      const wsEvents = XLSX.utils.json_to_sheet(eventRows);
      XLSX.utils.book_append_sheet(wb, wsEvents, "System Events");
  }

  // Write and download
  XLSX.writeFile(wb, `SmartWagon_${type}_Report.xlsx`);
}
