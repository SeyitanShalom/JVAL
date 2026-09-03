"use client";

import { useState } from "react";
import { FiPlus, FiSave, FiTrash2 } from "react-icons/fi";
import { AdminModal } from "@/app/admin/components/AdminModal";
import { createVenue, deleteVenue, updateVenue } from "./actions";
import type { AdminVenueRecord } from "@/lib/admin-venues";

// ─── Create Venue Modal ───────────────────────────────────────────────────────

export function CreateVenueButton({ canWrite }: { canWrite: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-500 px-4 text-xs font-bold text-white transition hover:bg-red-600"
      >
        <FiPlus aria-hidden="true" />
        Venue
      </button>

      <AdminModal
        title="Create Venue"
        description="Add a new neutral-match venue."
        isOpen={open}
        onClose={() => setOpen(false)}
      >
        <form
          action={createVenue}
          className="grid gap-4"
          onSubmit={() => setOpen(false)}
        >
          <VenueInput
            disabled={!canWrite}
            label="Venue name"
            name="name"
            placeholder="Venue name"
          />
          <VenueInput
            disabled={!canWrite}
            label="Location"
            name="location"
            placeholder="City, state"
          />

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-11 flex-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canWrite}
              className="h-11 flex-1 rounded-lg bg-blue-700 text-xs font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Create venue
            </button>
          </div>

          {!canWrite && (
            <p className="rounded-lg bg-amber-50 p-3 text-sm font-bold leading-6 text-amber-700">
              Connect Supabase in <code>.env</code> to enable venue creation.
            </p>
          )}
        </form>
      </AdminModal>
    </>
  );
}

// ─── Edit Venue Modal ─────────────────────────────────────────────────────────

export function EditVenueButton({
  venue,
  canWrite,
  canDelete,
}: {
  venue: AdminVenueRecord;
  canWrite: boolean;
  canDelete: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={!canWrite}
        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 text-xs font-bold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        <FiSave aria-hidden="true" />
        Edit
      </button>

      <AdminModal
        title={`Edit — ${venue.name}`}
        description="Update the venue name and location."
        isOpen={open}
        onClose={() => setOpen(false)}
      >
        <form
          action={updateVenue.bind(null, venue.id)}
          className="grid gap-4"
          onSubmit={() => setOpen(false)}
        >
          <VenueInput
            defaultValue={venue.name}
            disabled={!canWrite}
            label="Venue name"
            name="name"
          />
          <VenueInput
            defaultValue={venue.location}
            disabled={!canWrite}
            label="Location"
            name="location"
          />

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-11 flex-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canWrite}
              className="h-11 flex-1 rounded-lg bg-blue-700 text-xs font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Save changes
            </button>
          </div>
        </form>

        <form
          action={deleteVenue.bind(null, venue.id)}
          className="mt-3"
          onSubmit={() => setOpen(false)}
        >
          <button
            type="submit"
            disabled={!canDelete || venue.matchCount > 0}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-red-200 text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
            title={!canDelete ? "Developer access required" : undefined}
          >
            <FiTrash2 aria-hidden="true" />
            {!canDelete
              ? "Developer access required"
              : venue.matchCount > 0
                ? "Cannot delete — used in fixtures"
                : "Delete venue"}
          </button>
        </form>
      </AdminModal>
    </>
  );
}

// ─── Shared input ─────────────────────────────────────────────────────────────

function VenueInput({
  defaultValue,
  disabled,
  label,
  name,
  placeholder,
}: {
  defaultValue?: string;
  disabled: boolean;
  label: string;
  name: string;
  placeholder?: string;
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
