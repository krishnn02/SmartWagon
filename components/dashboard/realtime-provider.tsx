"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { COACH_INFO } from "@/constants";
import { BpcPressure } from "@/types/database";

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Subscribe to bpc_pressure inserts
    const channel = supabase
      .channel("bpc_pressure_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "bpc_pressure",
          filter: `device_id=eq.${COACH_INFO.device_id}`,
        },
        (payload) => {
          const newRow = payload.new as BpcPressure;
          
          // We need to carefully update the query cache without mutating it directly
          queryClient.setQueriesData({ queryKey: ["pressure_history"] }, (oldData: BpcPressure[] | undefined) => {
            if (!oldData) return oldData;
            
            // Add the new row at the beginning (since it's ordered descending)
            // and keep the array length within the limit (usually 100)
            const newData = [newRow, ...oldData];
            if (newData.length > 100) {
              newData.pop();
            }
            return newData;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return <>{children}</>;
}
