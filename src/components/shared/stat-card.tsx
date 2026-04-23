type StatCardProps = {
  label: string;
  value: string;
  description?: string;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
  descriptionClassName?: string;
};

export function StatCard({
  label,
  value,
  description,
  className,
  labelClassName,
  valueClassName,
  descriptionClassName
}: StatCardProps) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className ?? ""}`}
    >
      <p className={`text-xs font-semibold uppercase text-slate-500 ${labelClassName ?? ""}`}>{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${valueClassName ?? ""}`}>{value}</p>
      {description ? (
        <p className={`mt-1 text-sm text-slate-500 ${descriptionClassName ?? ""}`}>{description}</p>
      ) : null}
    </div>
  );
}
