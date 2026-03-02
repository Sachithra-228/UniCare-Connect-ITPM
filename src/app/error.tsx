"use client";

import { useEffect } from "react";
import { Button } from "@/components/shared/button";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-10">
      <h1 className="text-3xl font-semibold">Something went wrong</h1>
      <p className="text-sm text-slate-500">
        Please try again or contact support if the issue persists.
      </p>
      <Button onClick={reset}>Retry</Button>
    </div>
  );
}
