import { Suspense } from "react";
import AuthCallbackContent from "./wrapper";

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <AuthCallbackContent />
    </Suspense>
  );
}
