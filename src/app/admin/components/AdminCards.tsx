import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";

export function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail?: string;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
      {detail ? <p className="mt-1 text-sm font-bold text-slate-500">{detail}</p> : null}
    </article>
  );
}

export function ResourceCard({
  title,
  href,
  count,
  detail,
}: {
  title: string;
  href: string;
  count: number;
  detail: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-600 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-600">{title}</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{count}</p>
          <p className="mt-1 text-sm font-bold text-slate-500">{detail}</p>
        </div>
        <FiArrowRight className="mt-1 text-blue-600 transition group-hover:translate-x-1" aria-hidden="true" />
      </div>
    </Link>
  );
}

export function AdminPanel({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-bold text-slate-950">{title}</h2>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}
