type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
};

export function SectionHeading({ eyebrow, title, subtitle }: SectionHeadingProps) {
  return (
    <div className="space-y-2">
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-wide text-secondary">{eyebrow}</p>
      ) : null}
      <h2 className="text-2xl font-semibold">{title}</h2>
      {subtitle ? <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
    </div>
  );
}
