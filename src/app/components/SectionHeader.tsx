import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
};

export default function SectionHeader({
  eyebrow,
  title,
  description,
  actionHref,
  actionLabel,
}: SectionHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-600">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-[15px] font-bold tracking-normal text-slate-950 sm:text-lg">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm leading-5 text-slate-600">{description}</p>
        ) : null}
      </div>

      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="inline-flex shrink-0 items-center gap-1 text-[13px] font-bold text-blue-600"
        >
          {actionLabel}
          <FiArrowRight aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  );
}
