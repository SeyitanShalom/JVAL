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
    <article className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
        {label}
      </p>
      <p className="mt-1.5 text-xl font-bold text-slate-950 sm:mt-2 sm:text-2xl">
        {value}
      </p>
      {detail ? (
        <p className="mt-1 text-xs font-bold text-slate-500 sm:text-sm">
          {detail}
        </p>
      ) : null}
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
      className="group rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:border-red-500 hover:shadow-md sm:p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-red-500">
            {title}
          </p>
          <p className="mt-1.5 text-xl font-bold text-slate-950 sm:mt-2 sm:text-2xl">
            {count}
          </p>
          <p className="mt-1 text-xs font-bold text-slate-500 sm:text-sm">
            {detail}
          </p>
        </div>
        <FiArrowRight
          className="mt-1 text-red-500 transition group-hover:translate-x-1"
          aria-hidden="true"
        />
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
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
        <h2 className="text-sm font-bold text-slate-950">{title}</h2>
        {action}
      </div>
      <div className="p-3 sm:p-4">{children}</div>
    </section>
  );
}
