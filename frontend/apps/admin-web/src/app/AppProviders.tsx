import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { AnnouncerProvider } from "@/components/announcer/AnnouncerProvider";
import { ThemeProvider } from "@/features/theme/ThemeProvider";

// Shared by main.tsx and the tests, so both render the app with the same providers
export function AppProviders({
  queryClient,
  children,
}: {
  queryClient: QueryClient;
  children: ReactNode;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AnnouncerProvider>{children}</AnnouncerProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
