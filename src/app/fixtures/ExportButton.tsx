"use client";

import { FiDownload } from "react-icons/fi";

type Props = {
  competition?: string;
  status?: string;
  team?: string;
  matchday?: string;
  season?: string;
};

export default function ExportButton({
  competition,
  status,
  team,
  matchday,
  season,
}: Props) {
  function handleExport() {
    const params = new URLSearchParams();
    if (competition && competition !== "all")
      params.set("competition", competition);
    if (status && status !== "all") params.set("status", status);
    if (team && team !== "all") params.set("team", team);
    if (matchday && matchday !== "all") params.set("matchday", matchday);
    if (season && season !== "all") params.set("season", season);

    const url = "/api/export/fixtures?" + params.toString();
    // Trigger download by creating a temporary anchor
    const a = document.createElement("a");
    a.href = url;
    a.download = "";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:border-red-500 hover:text-red-500"
    >
      <FiDownload aria-hidden="true" />
      Export CSV
    </button>
  );
}
