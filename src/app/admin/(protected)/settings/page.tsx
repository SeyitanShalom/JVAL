import { AdminPanel, MetricCard } from "../../components/AdminCards";
import AdminPageHeader from "../../components/AdminPageHeader";
import {
  getAdminDashboardMetrics,
  tournamentRuleSummary,
} from "@/lib/admin-dashboard-data";
import { getAdminCompetitionData } from "@/lib/admin-competitions";
import { requireAdminPermission } from "@/lib/admin-auth";
import {
  contactFieldConfigs,
  getAdminSettingsData,
} from "@/lib/admin-settings";
import {
  saveAboutContentAction,
  saveContactLinksAction,
} from "./actions";

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ saved?: string; error?: string }>;
}) {
  await requireAdminPermission("manageSettings");

  const [query, metrics, competitionData, settingsData] = await Promise.all([
    searchParams
      ? searchParams
      : Promise.resolve({} as { saved?: string; error?: string }),
    getAdminDashboardMetrics(),
    getAdminCompetitionData(),
    getAdminSettingsData(),
  ]);
  const canWrite = settingsData.databaseReady;
  const message = getPageMessage(query, settingsData.error);

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        eyebrow="Site Control"
        title="Settings and content"
        description="Manage sponsor wording, contact links, about content, season defaults, and tournament rules."
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Sponsor"
          value="Johnvents Foods"
          detail="Only sponsor"
        />
        <MetricCard
          label="Seasons"
          value={competitionData.seasons.length}
          detail={metrics.currentSeasonLabel}
        />
        <MetricCard
          label="Competitions"
          value={competitionData.competitions.length}
          detail="All seasons"
        />
        <MetricCard
          label="Write mode"
          value={canWrite ? "On" : "Off"}
          detail={canWrite ? "Prisma connected" : "Needs Supabase env"}
        />
      </section>

      {message ? (
        <div
          className={`rounded-lg border px-4 py-3 text-sm font-bold ${
            message.tone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-amber-200 bg-amber-50 text-amber-800"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-2">
        <AdminPanel title="About Content">
          <form action={saveAboutContentAction} className="grid gap-4">
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Official name
              <input
                name="officialName"
                defaultValue={settingsData.about.officialName}
                disabled={!canWrite}
                className="h-11 rounded-lg border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 disabled:bg-slate-100 disabled:text-slate-500"
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Sponsor wording
              <input
                name="sponsorWording"
                defaultValue={settingsData.about.sponsorWording}
                disabled={!canWrite}
                className="h-11 rounded-lg border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 disabled:bg-slate-100 disabled:text-slate-500"
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              About copy
              <textarea
                name="aboutCopy"
                defaultValue={settingsData.about.aboutCopy}
                disabled={!canWrite}
                className="min-h-32 rounded-lg border border-slate-200 px-3 py-3 text-sm font-semibold leading-6 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 disabled:bg-slate-100 disabled:text-slate-500"
              />
            </label>
            <button
              type="submit"
              disabled={!canWrite}
              className="h-10 rounded-lg bg-red-500 px-4 text-xs font-bold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Save about content
            </button>
          </form>
        </AdminPanel>

        <AdminPanel title="Contact Links">
          <form action={saveContactLinksAction} className="grid gap-4">
            {contactFieldConfigs.map((field) => (
              <div key={field.field} className="grid gap-2">
                <p className="text-sm font-bold text-slate-700">
                  {field.label}
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    name={`${field.field}Value`}
                    defaultValue={settingsData.contacts[field.field].value}
                    disabled={!canWrite}
                    className="h-11 rounded-lg border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500"
                    placeholder={`${field.label} value`}
                  />
                  <input
                    name={`${field.field}Url`}
                    defaultValue={settingsData.contacts[field.field].url}
                    disabled={!canWrite}
                    className="h-11 rounded-lg border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500"
                    placeholder="Optional link URL"
                  />
                </div>
              </div>
            ))}
            <button
              type="submit"
              disabled={!canWrite}
              className="h-10 rounded-lg bg-blue-700 px-4 text-xs font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Save contact links
            </button>
          </form>
        </AdminPanel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <AdminPanel title="Tournament Rules">
          <div className="grid gap-3 sm:grid-cols-2">
            {tournamentRuleSummary.map((rule) => (
              <div key={rule.label} className="rounded-lg bg-slate-50 p-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                  {rule.label}
                </p>
                <p className="mt-1 text-sm font-bold text-slate-950">
                  {rule.value}
                </p>
              </div>
            ))}
          </div>
        </AdminPanel>

        <AdminPanel title="Admin Login">
          <div className="grid gap-3">
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                Account model
              </p>
              <p className="mt-1 text-sm font-bold text-slate-950">
                Super admin and admin roles
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                Environment keys
              </p>
              <p className="mt-1 break-words text-xs font-bold leading-5 text-slate-950 sm:text-sm">
                SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD_HASH, ADMIN_EMAIL,
                ADMIN_PASSWORD_HASH, ADMIN_SESSION_SECRET
              </p>
            </div>
          </div>
        </AdminPanel>
      </section>
    </div>
  );
}

function getPageMessage(
  query: { saved?: string; error?: string },
  fallbackError?: string,
) {
  if (query.saved === "about") {
    return { tone: "success" as const, text: "About content saved." };
  }
  if (query.saved === "contacts") {
    return { tone: "success" as const, text: "Contact links saved." };
  }
  if (query.error === "missing") {
    return {
      tone: "warning" as const,
      text: "Official name, sponsor wording, and about copy are required.",
    };
  }
  if (query.error === "database") {
    return {
      tone: "warning" as const,
      text: "Database is not connected. Add Supabase env values before saving settings.",
    };
  }
  if (query.error === "save") {
    return {
      tone: "warning" as const,
      text: "Settings could not be saved. Check the database connection.",
    };
  }
  if (fallbackError) return { tone: "warning" as const, text: fallbackError };
  return null;
}
