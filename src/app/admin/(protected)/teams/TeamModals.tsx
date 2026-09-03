"use client";

import { useState } from "react";
import { FiPlus, FiSave } from "react-icons/fi";
import { AdminModal } from "@/app/admin/components/AdminModal";
import { ImageUploadInput } from "@/app/admin/components/ImageUploadInput";
import { createTeam, updateTeam } from "./actions";
import type { AdminTeamRecord } from "@/lib/admin-teams";

type CompetitionOption = {
  id: string;
  name: string;
};

// ─── Create Team Modal ────────────────────────────────────────────────────────

export function CreateTeamButton({
  canWrite,
  competitionOptions,
}: {
  canWrite: boolean;
  competitionOptions: CompetitionOption[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-500 px-4 text-xs font-bold text-white transition hover:bg-red-600"
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
            placeholder="e.g. Community FC"
            disabled={!canWrite}
          />
          <TeamInput
            label="Short name (3-4 letters)"
            name="shortName"
            placeholder="CFC"
            disabled={!canWrite}
          />
          <TeamInput
            label="City / Community / LGA"
            name="community"
            placeholder="Community or LGA"
            disabled={!canWrite}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <TeamInput
              label="Manager"
              name="managerName"
              placeholder="Manager name"
              disabled={!canWrite}
            />
            <TeamInput
              label="Coach 1"
              name="coachName"
              placeholder="Coach 1 name"
              disabled={!canWrite}
            />
            <TeamInput
              label="Coach 2"
              name="coachTwoName"
              placeholder="Coach 2 name"
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

          <CompetitionCheckboxes
            options={competitionOptions}
            disabled={!canWrite}
          />

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-10 flex-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canWrite}
              className="h-10 flex-1 rounded-lg bg-blue-700 text-xs font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
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
  competitionOptions,
}: {
  team: AdminTeamRecord;
  canWrite: boolean;
  competitionOptions: CompetitionOption[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={!canWrite}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 text-xs font-bold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        <FiSave aria-hidden="true" />
        Edit team
      </button>

      <AdminModal
        title={`Edit — ${team.name}`}
        description="Update staff, captain and community for the current season."
        isOpen={open}
        onClose={() => setOpen(false)}
      >
        <form
          action={updateTeam.bind(null, team.teamSeasonId ?? team.id)}
          className="grid gap-4"
          onSubmit={() => setOpen(false)}
        >
          <input type="hidden" name="competitionIdsSubmitted" value="1" />
          <TeamInput
            label="Community / LGA"
            name="community"
            defaultValue={team.community}
            disabled={!canWrite}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <TeamInput
              label="Manager"
              name="managerName"
              defaultValue={team.managerName}
              disabled={!canWrite}
            />
            <TeamInput
              label="Coach 1"
              name="coachName"
              defaultValue={team.coachName}
              disabled={!canWrite}
            />
            <TeamInput
              label="Coach 2"
              name="coachTwoName"
              defaultValue={team.coachTwoName}
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

          <CompetitionCheckboxes
            options={competitionOptions}
            selectedIds={team.competitionIds}
            disabled={!canWrite}
          />

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-10 flex-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canWrite}
              className="h-10 flex-1 rounded-lg bg-blue-700 text-xs font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
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

function CompetitionCheckboxes({
  options,
  selectedIds = [],
  disabled,
}: {
  options: CompetitionOption[];
  selectedIds?: string[];
  disabled: boolean;
}) {
  return (
    <fieldset className="grid gap-2 rounded-lg border border-slate-200 p-3">
      <legend className="px-1 text-sm font-bold text-slate-700">
        Competition entries
      </legend>
      {options.length ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {options.map((competition) => (
            <label
              key={competition.id}
              className="flex min-w-0 items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700"
            >
              <input
                type="checkbox"
                name="competitionIds"
                value={competition.id}
                defaultChecked={selectedIds.includes(competition.id)}
                disabled={disabled}
                className="h-4 w-4 shrink-0 rounded border-slate-300 text-red-500 focus:ring-red-500"
              />
              <span className="min-w-0 truncate">{competition.name}</span>
            </label>
          ))}
        </div>
      ) : (
        <p className="text-xs font-semibold text-slate-500">
          Create a competition first, then assign this team to it.
        </p>
      )}
    </fieldset>
  );
}
