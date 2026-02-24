import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,       // 5 dakika
      gcTime: 1000 * 60 * 10,          // 10 dakika cache'te tut
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});
