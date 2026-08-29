"use client";
import { FiPrinter } from "react-icons/fi";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-red-600 print:hidden"
    >
      <FiPrinter aria-hidden="true" />
      Print Team Sheet
    </button>
  );
}
