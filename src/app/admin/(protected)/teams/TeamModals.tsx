"use client";

import { useState } from "react";
import { FiPlus, FiSave } from "react-icons/fi";
import { AdminModal } from "@/app/admin/components/AdminModal";
import { ImageUploadInput } from "@/app/admin/components/ImageUploadInput";
import { createTeam, updateTeam } from "./actions";
import type { AdminTeamRecord } from "@/lib/admin-teams";

// ─── Create Team Modal ────────────────────────────────────────────────────────

export function CreateTeamButton({ canWrite }: { canWrite: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-500 px-4 text-sm font-bold text-white transition hover:bg-red-600"
      >
        <FiPlus aria-hidden="true" />
        Team
      </button>

      <AdminModal
        title="Create Team"
        description="Add a new club to the current season's roster."
        isOpen={open}
        onClose={() => setOpen(false)}
      >
        <form
          action={createTeam}
          className="grid gap-4"
          onSubmit={() => setOpen(false)}
        >
          <TeamInput
            label="Team name"
            name="name"
            placeholder="e.g. Oyemekun FC"
            disabled={!canWrite}
          />
          <TeamInput
            label="Short name (3–4 letters)"
            name="shortName"
            placeholder="OYE"
            disabled={!canWrite}
          />
          <TeamInput
            label="City / Community / LGA"
            name="community"
            placeholder="Akure South"
            disabled={!canWrite}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <TeamInput
              label="Coach name"
              name="coachName"
              placeholder="Coach name"
              disabled={!canWrite}
            />
            <TeamInput
              label="Captain name"
              name="captainName"
              placeholder="Captain name"
              disabled={!canWrite}
            />
          </div>

          <ImageUploadInput
            name="logoUrl"
            label="Club Crest / Logo"
            disabled={!canWrite}
            aspectRatio="square"
          />

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-11 flex-1 rounded-lg border border-slate-200 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canWrite}
              className="h-11 flex-1 rounded-lg bg-blue-700 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Create team
            </button>
          </div>

          {!canWrite && (
            <p className="rounded-lg bg-amber-50 p-3 text-sm font-bold leading-6 text-amber-700">
              Connect Supabase in <code>.env</code> to enable team creation.
            </p>
          )}
        </form>
      </AdminModal>
    </>
  );
}

// ─── Edit Team Modal ──────────────────────────────────────────────────────────

export function EditTeamButton({
  team,
  canWrite,
}: {
  team: AdminTeamRecord;
  canWrite: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={!canWrite}
        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 text-sm font-bold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        <FiSave aria-hidden="true" />
        Edit team
      </button>

      <AdminModal
        title={`Edit — ${team.name}`}
        description="Update coach, captain and community for the current season."
        isOpen={open}
        onClose={() => setOpen(false)}
      >
        <form
          action={updateTeam.bind(null, team.teamSeasonId ?? team.id)}
          className="grid gap-4"
          onSubmit={() => setOpen(false)}
        >
          <TeamInput
            label="Community / LGA"
            name="community"
            defaultValue={team.community}
            disabled={!canWrite}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <TeamInput
              label="Coach name"
              name="coachName"
              defaultValue={team.coachName}
              disabled={!canWrite}
            />
            <TeamInput
              label="Captain name"
              name="captainName"
              defaultValue={team.captainName}
              disabled={!canWrite}
            />
          </div>

          <ImageUploadInput
            name="logoUrl"
            label="Replace Crest / Logo"
            initialUrl={team.logoUrl}
            disabled={!canWrite}
            aspectRatio="square"
          />

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-11 flex-1 rounded-lg border border-slate-200 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canWrite}
              className="h-11 flex-1 rounded-lg bg-blue-700 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Save changes
            </button>
          </div>
        </form>
      </AdminModal>
    </>
  );
}

// ─── Shared input component ───────────────────────────────────────────────────

function TeamInput({
  label,
  name,
  defaultValue,
  placeholder,
  disabled,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  disabled: boolean;
}) {
  return (
    <label className="grid min-w-0 gap-2 text-sm font-bold text-slate-700">
      {label}
      <input
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        disabled={disabled}
        className="h-11 min-w-0 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500"
      />
    </label>
  );
}
