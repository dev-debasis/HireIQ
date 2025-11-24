import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./routes/AppRoutes";
import { initApiClient } from "./services/api";
import { useEffect } from "react";

const queryClient = new QueryClient();

const CLERK_PUBLISHABLE_KEY =
  (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string) || "";

const App = () => {
  const ApiInitializer = () => {
    const { getToken } = useAuth();

    useEffect(() => {
      const eject = initApiClient(async () => {
        try {
          const token = await getToken();
          return token || null;
        } catch (e) {
          return null;
        }
      });

      return () => {
        if (typeof eject === "function") eject();
      };
    }, [getToken]);

    return null;
  };

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <ThemeProvider attribute="class">
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <ApiInitializer />
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ClerkProvider>
  );
};

export default App;
