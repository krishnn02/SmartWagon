"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export const queryClientInstance = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

export function resetAppQueries() {
  try {
    queryClientInstance.cancelQueries();
    queryClientInstance.clear();
  } catch {
    // Ignore error if cancelling
  }
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClientInstance}>
      {children}
    </QueryClientProvider>
  );
}
