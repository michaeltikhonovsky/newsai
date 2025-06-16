import { Suspense } from "react";
import SyncContent from "./wrapper";

export default function SyncPage() {
  return (
    <Suspense>
      <SyncContent />
    </Suspense>
  );
}
