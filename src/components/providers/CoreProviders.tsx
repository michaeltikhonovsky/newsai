import { ReactNode } from "react";
import { Toaster } from "sonner";
import { TRPCReactProvider } from "@/trpc/react";
import { GlobalVideoProgressProvider } from "./GlobalVideoProgressProvider";

export function CoreProviders({ children }: { children: ReactNode }) {
  return (
    <TRPCReactProvider>
      <GlobalVideoProgressProvider>
        <Toaster />
        {children}
      </GlobalVideoProgressProvider>
    </TRPCReactProvider>
  );
}
