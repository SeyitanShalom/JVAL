import { AdminPanel, MetricCard } from "../../components/AdminCards";
import AdminPageHeader from "../../components/AdminPageHeader";
import { tournamentRuleSummary } from "@/lib/admin-dashboard-data";
import { competitions, seasons } from "@/lib/league-data";

const contactFields = [
  "Phone number",
  "WhatsApp",
  "Facebook",
  "Instagram",
  "Email",
];

export default function AdminSettingsPage() {
  return (
    <div className="grid gap-6">
      <AdminPageHeader
        eyebrow="Site Control"
        title="Settings and content"
        description="Manage sponsor wording, contact links, about content, season defaults, and tournament rules."
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Sponsor" value="Johnvents Foods" detail="Only sponsor" />
        <MetricCard label="Seasons" value={seasons.length} detail="Archive-ready" />
        <MetricCard label="Competitions" value={competitions.length} detail="Current season" />
        <MetricCard label="Admin accounts" value="1" detail="Fixed login" />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <AdminPanel title="About Content">
          <form className="grid gap-4">
            <label className="grid gap-2 text-sm font-black text-slate-700">
              Official name
              <input defaultValue="Johnvents Apex League" className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100" />
            </label>
            <label className="grid gap-2 text-sm font-black text-slate-700">
              Sponsor wording
              <input defaultValue="Powered by Johnvents Foods" className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100" />
            </label>
            <label className="grid gap-2 text-sm font-black text-slate-700">
              About copy
              <textarea
                defaultValue="A modern, mobile-prioritized football tournament platform for a recurring seasonal competition."
                className="min-h-32 rounded-lg border border-slate-200 px-3 py-3 font-semibold leading-6 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </label>
          </form>
        </AdminPanel>

        <AdminPanel title="Contact Links">
          <form className="grid gap-3">
            {contactFields.map((field) => (
              <label key={field} className="grid gap-2 text-sm font-black text-slate-700">
                {field}
                <input className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100" placeholder={field} />
              </label>
            ))}
          </form>
        </AdminPanel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <AdminPanel title="Tournament Rules">
          <div className="grid gap-3 sm:grid-cols-2">
            {tournamentRuleSummary.map((rule) => (
              <div key={rule.label} className="rounded-lg bg-slate-50 p-3">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">{rule.label}</p>
                <p className="mt-1 text-sm font-black text-slate-950">{rule.value}</p>
              </div>
            ))}
          </div>
        </AdminPanel>

        <AdminPanel title="Admin Login">
          <div className="grid gap-3">
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Account model</p>
              <p className="mt-1 text-sm font-black text-slate-950">Single fixed admin account</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Environment keys</p>
              <p className="mt-1 text-sm font-black text-slate-950">ADMIN_EMAIL, ADMIN_PASSWORD_HASH, ADMIN_SESSION_SECRET</p>
            </div>
          </div>
        </AdminPanel>
      </section>
    </div>
  );
}
