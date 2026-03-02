export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-4xl items-center px-4 py-10">
      {children}
    </div>
  );
}
