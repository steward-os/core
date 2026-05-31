import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import App from "./App.jsx";
import "@khmyznikov/pwa-install";
import posthog from "./posthog.js";
import { PostHogErrorBoundary, PostHogProvider } from "@posthog/react";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <PostHogProvider client={posthog}>
      <PostHogErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <App />
          <pwa-install install-description="Installeer de fanfare app op je apparaat om snel toegang te krijgen tot het aan-en afmeldsysteem, vrijwilligerstaken en meer."></pwa-install>
        </QueryClientProvider>
      </PostHogErrorBoundary>
    </PostHogProvider>
  </StrictMode>
);
