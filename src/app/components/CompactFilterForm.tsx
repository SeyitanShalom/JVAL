import type { ReactNode } from "react";
import { FiChevronDown, FiFilter } from "react-icons/fi";
import AutoSubmitFilterForm from "./AutoSubmitFilterForm";

type CompactFilterFormProps = {
  children: ReactNode;
  resultLabel?: string;
};

export default function CompactFilterForm({
  children,
  resultLabel,
}: CompactFilterFormProps) {
  return (
    <details className="motion-panel group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 sm:px-4 [&::-webkit-details-marker]:hidden">
        <span className="inline-flex min-w-0 items-center gap-2 text-sm font-bold text-slate-950">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500">
            <FiFilter className="h-4 w-4" aria-hidden="true" />
          </span>
          Filters
        </span>

        <span className="inline-flex min-w-0 items-center justify-end gap-2">
          {resultLabel ? (
            <span className="hidden truncate text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 sm:block">
              {resultLabel}
            </span>
          ) : null}
          <FiChevronDown
            className="h-4 w-4 shrink-0 text-slate-400 transition group-open:rotate-180"
            aria-hidden="true"
          />
        </span>
      </summary>

      <AutoSubmitFilterForm className="border-t border-slate-100 p-3 sm:p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))]">
          {children}
        </div>
      </AutoSubmitFilterForm>
    </details>
  );
}
