"use client";

import { useEffect, useState } from "react";
import { FiCheck, FiX, FiAlertTriangle } from "react-icons/fi";
import type { LiveSquadPlayer } from "@/lib/admin-fixtures";
import { calculateMatchTimerState } from "@/lib/match-timer-utils";

type TeamInfo = {
  id: string;
  competitionTeamId: string;
  name: string;
  shortName: string;
  squad: LiveSquadPlayer[];
};

type LiveEventLoggerProps = {
  matchId: string;
  matchStatus: string;
  matchMinute?: string | null;
  currentPeriod?: string | null;
  firstHalfStartedAt?: string | Date | null;
  secondHalfStartedAt?: string | Date | null;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  databaseReady: boolean;
  onLogGoal: (fd: FormData) => Promise<void>;
  onLogDisallowedGoal: (fd: FormData) => Promise<void>;
  onLogCard: (fd: FormData) => Promise<void>;
  onLogSubstitution: (fd: FormData) => Promise<void>;
  onLogPenalty: (fd: FormData) => Promise<void>;
};

export default function LiveEventLogger({
  matchId,
  matchStatus,
  matchMinute,
  currentPeriod,
  firstHalfStartedAt,
  secondHalfStartedAt,
  homeTeam,
  awayTeam,
  databaseReady,
  onLogGoal,
  onLogDisallowedGoal,
  onLogCard,
  onLogSubstitution,
  onLogPenalty,
}: LiveEventLoggerProps) {
  const [activeTab, setActiveTab] = useState<
    "goal" | "disallow" | "card" | "sub" | "penalty"
  >("goal");
  const [selectedTeamId, setSelectedTeamId] = useState<string>(
    homeTeam.competitionTeamId,
  );
  const [now, setNow] = useState(() => new Date());

  const currentTeam =
    selectedTeamId === homeTeam.competitionTeamId ? homeTeam : awayTeam;
  const timerState = calculateMatchTimerState(
    {
      status: matchStatus,
      minuteLabel: matchMinute,
      currentPeriod,
      firstHalfStartedAt,
      secondHalfStartedAt,
    },
    now,
  );
  const maxEventMinute = getMaxEventMinute(
    timerState.totalSeconds,
    timerState.status,
  );
  const canLogTimedEvents = databaseReady && maxEventMinute > 0;

  useEffect(() => {
    if (timerState.isPaused || !timerState.isLive) return;

    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, [timerState.isPaused, timerState.isLive]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-950">
            Record Match Event
          </h3>
          <p className="text-xs font-semibold text-slate-500">
            Log real-time goals, discipline, substitutions, or penalty
            shootouts.
          </p>
        </div>
      </div>

      {/* Team Switcher Pills */}
      <div className="my-4">
        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-[0.08em]">
          Active Team
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setSelectedTeamId(homeTeam.competitionTeamId)}
            className={`flex items-center justify-center gap-2 rounded-xl h-10 px-3 text-xs font-bold transition border ${
              selectedTeamId === homeTeam.competitionTeamId
                ? "border-red-500 bg-red-50 text-red-500 shadow-sm"
                : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-red-500" />
            {homeTeam.name} ({homeTeam.shortName})
          </button>
          <button
            type="button"
            onClick={() => setSelectedTeamId(awayTeam.competitionTeamId)}
            className={`flex items-center justify-center gap-2 rounded-xl h-10 px-3 text-xs font-bold transition border ${
              selectedTeamId === awayTeam.competitionTeamId
                ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm"
                : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-indigo-600" />
            {awayTeam.name} ({awayTeam.shortName})
          </button>
        </div>
      </div>

      {/* Event Category Tabs */}
      <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab("goal")}
          className={`flex-1 min-w-[70px] rounded-lg h-10 transition ${
            activeTab === "goal"
              ? "bg-white text-red-500 shadow-sm"
              : "text-slate-600 hover:text-slate-950"
          }`}
        >
          Goal
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("disallow")}
          className={`flex-1 min-w-[70px] rounded-lg h-10 transition ${
            activeTab === "disallow"
              ? "bg-white text-red-700 shadow-sm"
              : "text-slate-600 hover:text-slate-950"
          }`}
        >
          Disallow
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("card")}
          className={`flex-1 min-w-[70px] rounded-lg h-10 transition ${
            activeTab === "card"
              ? "bg-white text-amber-700 shadow-sm"
              : "text-slate-600 hover:text-slate-950"
          }`}
        >
          Card
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("sub")}
          className={`flex-1 min-w-[70px] rounded-lg h-10 transition ${
            activeTab === "sub"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-950"
          }`}
        >
          Sub
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("penalty")}
          className={`flex-1 min-w-[70px] rounded-lg h-10 transition ${
            activeTab === "penalty"
              ? "bg-white text-purple-700 shadow-sm"
              : "text-slate-600 hover:text-slate-950"
          }`}
        >
          Shootout
        </button>
      </div>

      {/* Tab 1: Goal Form */}
      {activeTab === "goal" && (
        <form action={onLogGoal} className="mt-4 space-y-4">
          <input type="hidden" name="matchId" value={matchId} />
          <input
            type="hidden"
            name="competitionTeamId"
            value={selectedTeamId}
          />

          <div className="grid gap-3 sm:grid-cols-3">
            <MatchMinuteField
              maxMinute={maxEventMinute}
              disabled={!canLogTimedEvents}
            />
            <label className="block text-xs font-bold text-slate-700">
              Goal Type
              <select
                name="goalType"
                defaultValue="GOAL"
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600"
              >
                <option value="GOAL">Regular Goal</option>
                <option value="PENALTY_SCORED">Penalty Kick Scored</option>
                <option value="OWN_GOAL">Own Goal</option>
              </select>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-bold text-slate-700">
              Goalscorer ({currentTeam.shortName})
              <select
                name="playerId"
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600"
              >
                <option value="">Select Scorer</option>
                {currentTeam.squad.map((p) => (
                  <option key={p.id} value={p.id}>
                    #{p.number} {p.name} ({p.position})
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-xs font-bold text-slate-700">
              Assist Provider (optional)
              <select
                name="assistPlayerId"
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600"
              >
                <option value="">None / Solo Effort</option>
                {currentTeam.squad.map((p) => (
                  <option key={p.id} value={p.id}>
                    #{p.number} {p.name} ({p.position})
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block text-xs font-bold text-slate-700">
            Note / Description (optional)
            <input
              type="text"
              name="note"
              placeholder="e.g. Header from corner kick, 25-yard strike"
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600"
            />
          </label>

          <button
            type="submit"
            disabled={!canLogTimedEvents}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-blue-700 text-xs font-bold text-white shadow-sm transition hover:bg-blue-800 disabled:bg-slate-300"
          >
            Log Goal &amp; Increment Score
          </button>
        </form>
      )}

      {/* Tab 2: Disallowed Goal Form */}
      {activeTab === "disallow" && (
        <form action={onLogDisallowedGoal} className="mt-4 space-y-4">
          <input type="hidden" name="matchId" value={matchId} />
          <input
            type="hidden"
            name="competitionTeamId"
            value={selectedTeamId}
          />

          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-800 flex items-start gap-2">
            <FiAlertTriangle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
            <span>
              Disallowed goals appear in the timeline and remove one goal from
              the active team&apos;s score.
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <MatchMinuteField
              maxMinute={maxEventMinute}
              disabled={!canLogTimedEvents}
            />
            <label className="block text-xs font-bold text-slate-700">
              Disallow Reason
              <select
                name="reason"
                defaultValue="Offside"
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600"
              >
                <option value="Offside">Offside</option>
                <option value="Foul in buildup">Foul in buildup</option>
                <option value="Handball">Handball</option>
                <option value="Ball out of play">Ball out of play</option>
                <option value="VAR Overturned">VAR Overturned</option>
              </select>
            </label>
          </div>

          <label className="block text-xs font-bold text-slate-700">
            Player Involved ({currentTeam.shortName})
            <select
              name="playerId"
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600"
            >
              <option value="">Select Player</option>
              {currentTeam.squad.map((p) => (
                <option key={p.id} value={p.id}>
                  #{p.number} {p.name} ({p.position})
                </option>
              ))}
            </select>
          </label>

          <label className="block text-xs font-bold text-slate-700">
            Additional Note (optional)
            <input
              type="text"
              name="note"
              placeholder="e.g. Flag raised by assistant referee, referee consulted monitor"
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600"
            />
          </label>

          <button
            type="submit"
            disabled={!canLogTimedEvents}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-red-600 text-xs font-bold text-white shadow-sm transition hover:bg-red-700 disabled:bg-slate-300"
          >
            Record Disallowed Goal
          </button>
        </form>
      )}

      {/* Tab 3: Card Form */}
      {activeTab === "card" && (
        <form action={onLogCard} className="mt-4 space-y-4">
          <input type="hidden" name="matchId" value={matchId} />
          <input
            type="hidden"
            name="competitionTeamId"
            value={selectedTeamId}
          />

          <div className="grid gap-3 sm:grid-cols-3">
            <MatchMinuteField
              maxMinute={maxEventMinute}
              disabled={!canLogTimedEvents}
            />
            <label className="block text-xs font-bold text-slate-700">
              Card Type
              <select
                name="cardType"
                defaultValue="YELLOW_CARD"
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600"
              >
                <option value="YELLOW_CARD">Yellow Card</option>
                <option value="RED_CARD">Red Card</option>
              </select>
            </label>
          </div>

          <label className="block text-xs font-bold text-slate-700">
            Player ({currentTeam.shortName})
            <select
              name="playerId"
              required
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600"
            >
              <option value="">Select Carded Player</option>
              {currentTeam.squad.map((p) => (
                <option key={p.id} value={p.id}>
                  #{p.number} {p.name} ({p.position})
                </option>
              ))}
            </select>
          </label>

          <label className="block text-xs font-bold text-slate-700">
            Reason / Note (optional)
            <input
              type="text"
              name="note"
              placeholder="e.g. Tactical foul, dissent, dangerous tackle"
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600"
            />
          </label>

          <button
            type="submit"
            disabled={!canLogTimedEvents}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-amber-600 text-xs font-bold text-white shadow-sm transition hover:bg-amber-700 disabled:bg-slate-300"
          >
            Record Disciplinary Event
          </button>
        </form>
      )}

      {/* Tab 4: Substitution Form */}
      {activeTab === "sub" && (
        <form action={onLogSubstitution} className="mt-4 space-y-4">
          <input type="hidden" name="matchId" value={matchId} />
          <input
            type="hidden"
            name="competitionTeamId"
            value={selectedTeamId}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <MatchMinuteField
              maxMinute={maxEventMinute}
              disabled={!canLogTimedEvents}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-bold text-slate-700">
              Player Out (Subbed off)
              <select
                name="playerOutId"
                required
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600"
              >
                <option value="">Select Player Out</option>
                {currentTeam.squad.map((p) => (
                  <option key={p.id} value={p.id}>
                    #{p.number} {p.name} ({p.position})
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-xs font-bold text-slate-700">
              Player In (Subbed on)
              <select
                name="playerInId"
                required
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600"
              >
                <option value="">Select Player In</option>
                {currentTeam.squad.map((p) => (
                  <option key={p.id} value={p.id}>
                    #{p.number} {p.name} ({p.position})
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block text-xs font-bold text-slate-700">
            Note / Tactical Context (optional)
            <input
              type="text"
              name="note"
              placeholder="e.g. Tactical substitution, injury replacement"
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600"
            />
          </label>

          <button
            type="submit"
            disabled={!canLogTimedEvents}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-slate-800 text-xs font-bold text-white shadow-sm transition hover:bg-slate-900 disabled:bg-slate-300"
          >
            Record Substitution
          </button>
        </form>
      )}

      {/* Tab 5: Penalty Shootout Form */}
      {activeTab === "penalty" && (
        <form action={onLogPenalty} className="mt-4 space-y-4">
          <input type="hidden" name="matchId" value={matchId} />
          <input
            type="hidden"
            name="competitionTeamId"
            value={selectedTeamId}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-bold text-slate-700">
              Penalty Taker ({currentTeam.shortName})
              <select
                name="takerId"
                required
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600"
              >
                <option value="">Select Taker</option>
                {currentTeam.squad.map((p) => (
                  <option key={p.id} value={p.id}>
                    #{p.number} {p.name} ({p.position})
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-xs font-bold text-slate-700">
              Shootout Round
              <select
                name="round"
                defaultValue="1"
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600"
              >
                <option value="1">Round 1</option>
                <option value="2">Round 2</option>
                <option value="3">Round 3</option>
                <option value="4">Round 4</option>
                <option value="5">Round 5</option>
                <option value="6">Sudden Death (Round 6+)</option>
              </select>
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Attempt Outcome
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 p-3 font-bold text-xs text-emerald-800 has-[:checked]:border-emerald-600 has-[:checked]:bg-emerald-100">
                <input
                  type="radio"
                  name="scored"
                  value="true"
                  defaultChecked
                  className="accent-emerald-600"
                />
                <FiCheck className="text-emerald-700" /> Scored
              </label>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-300 bg-red-50 p-3 font-bold text-xs text-red-800 has-[:checked]:border-red-600 has-[:checked]:bg-red-100">
                <input
                  type="radio"
                  name="scored"
                  value="false"
                  className="accent-red-600"
                />
                <FiX className="text-red-700" /> Missed / Saved
              </label>
            </div>
          </div>

          <label className="block text-xs font-bold text-slate-700">
            Note (optional)
            <input
              type="text"
              name="note"
              placeholder="e.g. Bottom left corner, saved by keeper"
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600"
            />
          </label>

          <button
            type="submit"
            disabled={!databaseReady}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-purple-700 text-xs font-bold text-white shadow-sm transition hover:bg-purple-800 disabled:bg-slate-300"
          >
            Record Shootout Attempt
          </button>
        </form>
      )}
    </div>
  );
}

function getMaxEventMinute(totalSeconds: number, status: string) {
  const normalizedStatus = status.toUpperCase();
  if (normalizedStatus === "UPCOMING" || normalizedStatus === "POSTPONED")
    return 0;

  const elapsedMinutes = Math.floor(Math.max(0, totalSeconds) / 60);
  const hasStarted =
    totalSeconds > 0 ||
    normalizedStatus === "HALFTIME" ||
    normalizedStatus === "FULLTIME";
  return Math.min(120, Math.max(hasStarted ? 1 : 0, elapsedMinutes));
}

function MatchMinuteField({
  maxMinute,
  disabled,
}: {
  maxMinute: number;
  disabled: boolean;
}) {
  const cappedMax = Math.min(120, Math.max(0, Math.floor(maxMinute)));
  const minuteOptions = Array.from(
    { length: cappedMax },
    (_, index) => index + 1,
  );

  return (
    <label className="block text-xs font-bold text-slate-700">
      Minute
      <select
        name="minute"
        defaultValue={cappedMax > 0 ? String(cappedMax) : ""}
        disabled={disabled || cappedMax === 0}
        required
        className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 font-semibold outline-none focus:border-blue-600 disabled:bg-slate-100"
      >
        {cappedMax === 0 ? (
          <option value="">--</option>
        ) : (
          minuteOptions.map((minute) => (
            <option key={minute} value={minute}>
              {minute}&apos;
            </option>
          ))
        )}
      </select>
    </label>
  );
}
