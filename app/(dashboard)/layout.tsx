"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { RealtimeProvider } from "@/components/dashboard/realtime-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <RealtimeProvider>
      <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
        <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <div className="flex flex-1 overflow-hidden relative">
          <Sidebar isCollapsed={!isSidebarOpen} closeSidebar={() => setIsSidebarOpen(false)} />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 w-full">
            {children}
          </main>
        </div>
      </div>
    </RealtimeProvider>
  );
}
