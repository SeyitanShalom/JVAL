type Option = {
  value: string;
  label: string;
};

type FilterSelectProps = {
  label: string;
  name: string;
  value?: string;
  options: Option[];
};

export default function FilterSelect({ label, name, value, options }: FilterSelectProps) {
  return (
    <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-semibold text-slate-600">
      <span>{label}</span>
      <select
        name={name}
        defaultValue={value}
        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-semibold text-slate-900 outline-none transition focus:border-blue-500"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="text-slate-700">
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
