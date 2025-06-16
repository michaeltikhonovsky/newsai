import { ReactNode } from "react";
import { Toaster } from "sonner";
import { TRPCReactProvider } from "@/trpc/react";

export function CoreProviders({ children }: { children: ReactNode }) {
  return (
    <TRPCReactProvider>
      <Toaster />
      {children}
    </TRPCReactProvider>
  );
}
