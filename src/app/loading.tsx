import { LoadingSkeleton } from "@/components/shared/loading-skeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <LoadingSkeleton lines={6} />
    </div>
  );
}
