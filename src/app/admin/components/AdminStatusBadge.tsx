const toneClasses = {
  blue: "bg-red-50 text-red-500",
  green: "bg-emerald-50 text-emerald-700",
  slate: "bg-slate-100 text-slate-700",
  red: "bg-red-50 text-red-700",
  amber: "bg-amber-50 text-amber-700",
};

type AdminStatusBadgeProps = {
  children: React.ReactNode;
  tone?: keyof typeof toneClasses;
};

export default function AdminStatusBadge({
  children,
  tone = "slate",
}: AdminStatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold capitalize ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
