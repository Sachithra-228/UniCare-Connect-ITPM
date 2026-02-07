import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-10">
      <h1 className="text-3xl font-semibold">Page not found</h1>
      <p className="text-sm text-slate-500">
        The page you are looking for does not exist. Return to the dashboard or home page.
      </p>
      <div className="flex gap-3">
        <Link className="rounded-full bg-primary px-4 py-2 text-sm text-white" href="/">
          Home
        </Link>
        <Link
          className="rounded-full border border-slate-200 px-4 py-2 text-sm dark:border-slate-700"
          href="/dashboard"
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}
