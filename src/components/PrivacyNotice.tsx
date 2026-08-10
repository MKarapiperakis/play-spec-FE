import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "playspec.privacyNoticeDismissed";

/**
 * Not a cookie-consent banner — PlaySpec sets no cookies (no login/session;
 * the API's CORS config runs with credentials: false). This discloses what
 * actually happens to your data: nothing is written to disk or a database,
 * and the only thing kept in the browser is the current job id in
 * localStorage (see useJobId.ts), purely so you can check back on your own
 * job — never used for tracking.
 */
export function PrivacyNotice() {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(STORAGE_KEY) === "true",
  );

  if (dismissed) return null;

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setDismissed(true);
  };

  return (
    <div className="border-border/60 bg-background/95 fixed inset-x-0 bottom-0 z-20 border-t p-4 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <ShieldCheck className="text-muted-foreground mt-0.5 size-5 shrink-0" />
          <p className="text-muted-foreground text-sm">
            No tracking cookies. Your spec file and generated project are
            processed entirely in memory, never written to disk or stored in a
            database and discarded automatically once your job completes
          </p>
        </div>
        <Button size="sm" className="self-end sm:self-auto" onClick={dismiss}>
          Got it
        </Button>
      </div>
    </div>
  );
}
