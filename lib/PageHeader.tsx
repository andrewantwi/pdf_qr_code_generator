export default function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4 mb-8 animate-slide-up">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="text-sm text-faint mt-1.5">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}
