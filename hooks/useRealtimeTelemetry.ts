"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BpcPressure, BrakeFaultEvent } from "@/types/database";
import { COACH_INFO } from "@/constants";

// Temporary mock data generator for UI development without actual DB access
const generateMockTelemetry = (): BpcPressure => ({
  timestamp: new Date().toISOString(),
  bp: 5.0 + (Math.random() * 0.2 - 0.1),
  fp: 6.0 + (Math.random() * 0.2 - 0.1),
  cr: 5.0 + (Math.random() * 0.1 - 0.05),
  bc: Math.random() > 0.8 ? 2.5 : 0.0,
  brake_status: Math.random() > 0.8 ? "Brake Applied" : "Brake Released",
  brake_fault: "None",
  coach_no: COACH_INFO.coach_no,
  device_id: COACH_INFO.device_id,
  Location: COACH_INFO.Location,
  Train_no: COACH_INFO.Train_no,
});

export function useRealtimeTelemetry() {
  const queryClient = useQueryClient();
  const [latestData, setLatestData] = useState<BpcPressure | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // For development without DB:
  const isMockMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your_supabase');

  useEffect(() => {
    if (isMockMode) {
      setIsConnected(true);
      setLatestData(generateMockTelemetry());
      const interval = setInterval(() => {
        setLatestData(generateMockTelemetry());
      }, 2000);
      return () => clearInterval(interval);
    }

    const channel = supabase
      .channel("realtime:bpc_pressure")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "bpc_pressure",
          filter: `device_id=eq.${COACH_INFO.device_id}`,
        },
        (payload) => {
          const newData = payload.new as BpcPressure;
          setLatestData(newData);
          // Invalidate or update other queries if needed
          queryClient.invalidateQueries({ queryKey: ["pressure_history"] });
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setIsConnected(true);
        } else {
          setIsConnected(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, isMockMode]);

  return { latestData, isConnected, isMockMode };
}
