"use client";

import { useState } from "react";
import { FiPlus, FiSave } from "react-icons/fi";
import { AdminModal } from "@/app/admin/components/AdminModal";
import { ImageUploadInput } from "@/app/admin/components/ImageUploadInput";
import { createPlayer, updatePlayer } from "./actions";
import type { AdminPlayerRecord } from "@/lib/admin-players";

const positionCategories = ["GOALKEEPER", "DEFENDER", "MIDFIELDER", "FORWARD"];
const detailedPositions = [
  "GK",
  "CB",
  "LB",
  "RB",
  "DM",
  "CM",
  "AM",
  "LW",
  "RW",
  "ST",
];

// ─── Create Player Modal ──────────────────────────────────────────────────────

export function CreatePlayerButton({
  canWrite,
  teamOptions,
}: {
  canWrite: boolean;
  teamOptions: { id: string; teamSeasonId: string; name: string }[];
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
        Player
      </button>

      <AdminModal
        title="Register Player"
        description="Add a player to a team's current season squad."
        isOpen={open}
        onClose={() => setOpen(false)}
      >
        <form
          action={createPlayer}
          className="grid gap-4"
          onSubmit={() => setOpen(false)}
        >
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Full name
            <input
              name="fullName"
              disabled={!canWrite}
              className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
              placeholder="Player full name"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Squad number
              <input
                name="squadNumber"
                type="number"
                min={1}
                max={99}
                disabled={!canWrite}
                className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
                placeholder="9"
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Date of birth
              <input
                name="dateOfBirth"
                type="date"
                disabled={!canWrite}
                className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Position category
              <select
                name="positionCategory"
                disabled={!canWrite}
                className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
              >
                {positionCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Detailed position
              <input
                name="detailedPosition"
                disabled={!canWrite}
                list="modal-position-options"
                className="h-11 rounded-lg border border-slate-200 px-3 font-semibold uppercase outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
                placeholder="ST"
              />
              <datalist id="modal-position-options">
                {detailedPositions.map((pos) => (
                  <option key={pos} value={pos} />
                ))}
              </datalist>
            </label>
          </div>

          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Team (current season)
            <select
              name="teamSeasonId"
              disabled={!canWrite || teamOptions.length === 0}
              className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
            >
              {teamOptions.map((t) => (
                <option key={t.teamSeasonId} value={t.teamSeasonId}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>

          <ImageUploadInput
            name="photoUrl"
            label="Player Portrait / Headshot"
            disabled={!canWrite}
            aspectRatio="portrait"
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
              className="h-11 flex-1 rounded-lg bg-red-500 text-xs font-bold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Register player
            </button>
          </div>

          {!canWrite && (
            <p className="rounded-lg bg-amber-50 p-3 text-sm font-bold leading-6 text-amber-700">
              Connect Supabase in <code>.env</code> to enable player creation.
            </p>
          )}
        </form>
      </AdminModal>
    </>
  );
}

// ─── Edit Player Modal ────────────────────────────────────────────────────────

export function EditPlayerButton({
  player,
  canWrite,
}: {
  player: AdminPlayerRecord;
  canWrite: boolean;
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
        Edit player
      </button>

      <AdminModal
        title={`Edit — ${player.fullName}`}
        description="Update player squad number and tactical position."
        isOpen={open}
        onClose={() => setOpen(false)}
      >
        <form
          action={updatePlayer.bind(null, player.squadPlayerId ?? player.id)}
          className="grid gap-4"
          onSubmit={() => setOpen(false)}
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Number
              <input
                name="squadNumber"
                type="number"
                min={1}
                max={99}
                defaultValue={player.squadNumber}
                className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Category
              <select
                name="positionCategory"
                defaultValue={player.positionCategory}
                className="h-11 rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                {positionCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Position
              <input
                name="detailedPosition"
                defaultValue={player.detailedPosition}
                list="edit-position-options"
                className="h-11 rounded-lg border border-slate-200 px-3 font-semibold uppercase outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                placeholder="ST"
              />
              <datalist id="edit-position-options">
                {detailedPositions.map((pos) => (
                  <option key={pos} value={pos} />
                ))}
              </datalist>
            </label>
          </div>

          <ImageUploadInput
            name="photoUrl"
            label="Player Portrait / Headshot"
            initialUrl={player.photoUrl}
            aspectRatio="portrait"
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
              className="h-11 flex-1 rounded-lg bg-blue-700 text-xs font-bold text-white transition hover:bg-blue-800"
            >
              Save changes
            </button>
          </div>
        </form>
      </AdminModal>
    </>
  );
}
