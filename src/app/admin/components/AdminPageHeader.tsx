type AdminPageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export default function AdminPageHeader({
  eyebrow,
  title,
  description,
  action,
}: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600">{eyebrow}</p>
        ) : null}
        <h1 className="mt-1 text-2xl font-bold tracking-normal text-slate-950 sm:text-3xl">{title}</h1>
        {description ? <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
