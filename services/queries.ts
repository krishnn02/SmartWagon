import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { COACH_INFO } from "@/constants";
import { BpcPressure, BrakeFaultEvent, EventPublish } from "@/types/database";

export function usePressureHistory(limit = 100) {
  return useQuery({
    queryKey: ["pressure_history", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bpc_pressure")
        .select("*")
        .eq("device_id", COACH_INFO.device_id)
        .order("timestamp", { ascending: false })
        .limit(limit);

      if (error) throw new Error(error.message);
      return data as BpcPressure[];
    },
    refetchInterval: 2000, // Refetch automatically every 2 seconds
  });
}

export function useBrakeFaults() {
  return useQuery({
    queryKey: ["brake_faults"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brake_fault_event")
        .select("*")
        .eq("device_id", COACH_INFO.device_id)
        .order("timestamp", { ascending: false })
        .limit(50);

      if (error) throw new Error(error.message);
      return data as BrakeFaultEvent[];
    },
    refetchInterval: 5000, // Refetch automatically every 5 seconds
  });
}

export function useEventHistory() {
  return useQuery({
    queryKey: ["event_history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_publish")
        .select("*")
        .eq("device_id", COACH_INFO.device_id)
        .order("timestamp", { ascending: false })
        .limit(50);

      if (error) throw new Error(error.message);
      return data as EventPublish[];
    },
    refetchInterval: 5000, // Refetch automatically every 5 seconds
  });
}
