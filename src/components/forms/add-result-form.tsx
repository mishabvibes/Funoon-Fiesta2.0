"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { SearchSelect } from "@/components/ui/search-select";
import { Select } from "@/components/ui/select";
import type {
  GradeType,
  Jury,
  Program,
  ProgramRegistration,
  Student,
  Team,
} from "@/lib/types";

interface AddResultFormProps {
  programs: Program[];
  students: Student[];
  teams: Team[];
  juries: Jury[];
  registrations?: ProgramRegistration[];
  action: (formData: FormData) => Promise<void>;
  lockProgram?: boolean;
  initial?: Partial<
    Record<
      1 | 2 | 3,
      {
        winnerId: string;
        grade?: GradeType;
      }
    >
  >;
  initialPenalties?: {
    targetId?: string;
    points?: number;
    type?: "student" | "team";
  }[];
  submitLabel?: string;
  mode?: "default" | "jury";
  juryName?: string;
}

const gradeOptions = [
  { value: "A", label: "Grade A (+5)" },
  { value: "B", label: "Grade B (+3)" },
  { value: "C", label: "Grade C (+1)" },
  { value: "none", label: "None" },
];

export function AddResultForm({
  programs,
  students,
  teams,
  juries,
  registrations,
  action,
  lockProgram = false,
  initial,
  initialPenalties,
  submitLabel = "Submit for Approval",
  mode = "default",
  juryName,
}: AddResultFormProps) {
  const [programId, setProgramId] = useState(programs[0]?.id ?? "");
  const [showRules, setShowRules] = useState(false);
  const [penaltyRows, setPenaltyRows] = useState<
    {
      id: string;
      defaultTarget?: string;
      defaultPoints?: number;
      type?: "student" | "team";
    }[]
  >(() => {
    if (initialPenalties?.length) {
      return initialPenalties.map((penalty, index) => ({
        id: `penalty-${index}`,
        defaultTarget: penalty.targetId,
        defaultPoints: penalty.points,
        type: penalty.type,
      }));
    }
    return [{ id: "penalty-0" }];
  });
  const selectedProgram = useMemo(
    () => programs.find((program) => program.id === programId) ?? programs[0],
    [programId, programs],
  );

  const programOptions = useMemo(
    () =>
      programs.map((program) => ({
        value: program.id,
        label: program.name,
        meta: `${program.section} · Cat ${program.category}${
          program.stage ? " · On stage" : " · Off stage"
        }`,
      })),
    [programs],
  );

  const studentOptions = useMemo(
    () =>
      students.map((student) => ({
        value: student.id,
        label: student.name,
        meta: `Chest ${student.chest_no}`,
      })),
    [students],
  );

  const teamOptions = useMemo(
    () =>
      teams.map((team) => ({
        value: team.id,
        label: team.name,
        meta: team.leader ? `Leader · ${team.leader}` : undefined,
      })),
    [teams],
  );

  const registrationMap = useMemo(() => {
    const map = new Map<string, ProgramRegistration[]>();
    (registrations ?? []).forEach((registration) => {
      const list = map.get(registration.programId) ?? [];
      list.push(registration);
      map.set(registration.programId, list);
    });
    return map;
  }, [registrations]);

  const isSingle = selectedProgram?.section === "single";
  const isJuryMode = mode === "jury";
  const activeJury = juries[0];
  const programRegistrations = selectedProgram
    ? registrationMap.get(selectedProgram.id) ?? []
    : [];

  const singleCandidateOptions = programRegistrations.map((registration) => ({
    value: registration.studentId,
    label: `${registration.studentName} · ${registration.studentChest}`,
    meta: registration.teamName,
  }));

  const teamCandidateOptions = Array.from(
    new Map(
      programRegistrations.map((registration) => [
        registration.teamId,
        { value: registration.teamId, label: registration.teamName, meta: registration.programName },
      ]),
    ).values(),
  );

  const registeredOptions = isSingle ? singleCandidateOptions : teamCandidateOptions;
  const fallbackOptions = isSingle ? studentOptions : teamOptions;
  const useFallbackOptions = registeredOptions.length === 0 && !isJuryMode;
  const placementSelectOptions = useFallbackOptions ? fallbackOptions : registeredOptions;
  const penaltySelectOptions = placementSelectOptions;
  const hasPenaltyOptions = penaltySelectOptions.length > 0;
  const penaltyTypeDefault =
    initialPenalties?.[0]?.type ?? (isSingle ? "student" : "team");
  const penaltyRowIds = penaltyRows.map((row) => row.id);

  const addPenaltyRow = () => {
    setPenaltyRows((rows) => [
      ...rows,
      {
        id: `penalty-${Math.random().toString(36).slice(2, 9)}`,
      },
    ]);
  };

  const removePenaltyRow = (rowId: string) => {
    setPenaltyRows((rows) => (rows.length === 1 ? rows : rows.filter((row) => row.id !== rowId)));
  };
  const hasEligibleCandidates = placementSelectOptions.length > 0;
  const showProgramSelector = !(isJuryMode && lockProgram);

  return (
    <form action={action} className="space-y-8">
      <input type="hidden" name="program_id" value={selectedProgram?.id} />
      {isJuryMode && <input type="hidden" name="jury_id" value={activeJury?.id ?? ""} />}

      {showProgramSelector && (
      <Card>
        <Badge tone="cyan">Step 1 · Program</Badge>
          <CardTitle className="mt-4">
            {isJuryMode && lockProgram ? "Program locked in" : "Select a program"}
          </CardTitle>
        <CardDescription className="mt-2">
            {isJuryMode && lockProgram
              ? "Admins have assigned this program to you. Review the details before entering results."
              : "We auto-fill stage, section, and scoring rules."}
        </CardDescription>
        <div className="mt-6">
            {isJuryMode && lockProgram ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-white/60">Program</p>
                <p className="text-2xl font-semibold text-white">{selectedProgram?.name}</p>
              </div>
            ) : (
          <SearchSelect
            name="program_selector"
            options={programOptions}
            value={programId}
            onValueChange={(next) => setProgramId(next)}
            disabled={lockProgram}
            placeholder="Search program..."
          />
            )}
        </div>
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
          <p>Section: {selectedProgram?.section}</p>
          <p>Stage: {selectedProgram?.stage ? "On stage" : "Off stage"}</p>
          <p>Category: {selectedProgram?.category}</p>
        </div>
      </Card>
      )}

      <Card>
        <Badge tone="pink">Step 2 · Winners</Badge>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Add podium placements</CardTitle>
            <CardDescription className="mt-2">
              Select {isSingle ? "students" : "teams"} for 1st, 2nd and 3rd. Grades apply
              only to single events.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowRules(true)}
          >
            View scoring matrix
          </Button>
        </div>
        {isJuryMode && !showProgramSelector && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
            <p className="text-xs uppercase tracking-widest text-white/50">Program</p>
            <p className="text-xl font-semibold text-white">{selectedProgram?.name}</p>
            <p className="text-xs text-white/50 mt-1">
              Section: {selectedProgram?.section} · Category: {selectedProgram?.category}
            </p>
          </div>
        )}
        {!useFallbackOptions && !hasEligibleCandidates && (
          <p className="mt-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            No registered candidates for this program yet.
          </p>
        )}
        <div className="mt-6 grid gap-5">
          {[1, 2, 3].map((position) => {
            const slot = position as 1 | 2 | 3;
            return (
            <div
              key={position}
              className="rounded-2xl border border-white/10 bg-white/5 p-4"
            >
              <p className="text-sm font-semibold text-white">
                {position === 1
                  ? "1st Place"
                  : position === 2
                    ? "2nd Place"
                    : "3rd Place"}
              </p>
              <div className="mt-3">
                <SearchSelect
                  name={`winner_${position}`}
                  required
                  defaultValue={
                    initial?.[slot]?.winnerId ??
                    placementSelectOptions[0]?.value ??
                    ""
                  }
                  options={placementSelectOptions}
                  placeholder={`Search ${isSingle ? "student" : "team"}...`}
                  disabled={!hasEligibleCandidates}
                />
              </div>
              {isSingle ? (
                <Select
                  className="mt-3"
                  name={`grade_${position}`}
                  defaultValue={initial?.[slot]?.grade ?? "A"}
                  disabled={!hasEligibleCandidates}
                >
                  {gradeOptions.map((grade) => (
                    <option key={grade.value} value={grade.value}>
                      {grade.label}
                    </option>
                  ))}
                </Select>
              ) : (
                <input type="hidden" name={`grade_${position}`} value="none" />
              )}
            </div>
            );
          })}
        </div>
        {isJuryMode && !showProgramSelector && (
          <div className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
            <p className="text-xs uppercase tracking-widest text-white/50">Logged in as</p>
            <p className="text-lg font-semibold text-white">{juryName ?? activeJury?.name}</p>
            <p className="text-xs text-white/50">
              Double-check placements before submitting — edits aren’t possible afterward.
            </p>
            <Button type="submit" className="mt-2 w-full" disabled={!hasEligibleCandidates}>
              Submit evaluation
            </Button>
          </div>
        )}
      </Card>

      <Card>
        <Badge tone="amber">Optional · Minus Points</Badge>
        <CardTitle className="mt-4">No-show penalty</CardTitle>
        <CardDescription className="mt-2">
          Apply a deduction when a {isSingle ? "registered participant" : "team"} fails to appear.
          Leave blank to skip.
        </CardDescription>
        <input type="hidden" name="penalty_rows" value={penaltyRowIds.join(",")} />
        <div className="mt-6 space-y-4">
          {penaltyRows.map((row) => {
            const rowType = row.type ?? penaltyTypeDefault;
            return (
              <div
                key={row.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <input type="hidden" name={`penalty_type_${row.id}`} value={rowType} />
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  <div className="flex-1">
                    <SearchSelect
                      name={`penalty_target_${row.id}`}
                      options={penaltySelectOptions}
                      placeholder={`Select a ${isSingle ? "participant" : "team"} to penalize`}
                      defaultValue={row.defaultTarget ?? ""}
                      disabled={!hasPenaltyOptions}
                    />
                  </div>
                  <div className="flex items-center gap-3 md:w-60">
                    <Input
                      name={`penalty_points_${row.id}`}
                      type="number"
                      min={0}
                      step={1}
                      placeholder="Penalty points"
                      defaultValue={row.defaultPoints ?? ""}
                      disabled={!hasPenaltyOptions}
                      
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-xs text-white/80"
                      onClick={() => removePenaltyRow(row.id)}
                      disabled={penaltyRows.length === 1}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={addPenaltyRow}
            disabled={!hasPenaltyOptions}
          >
            Add penalty
          </Button>
        </div>
        <p className="mt-3 text-xs text-white/50">
          Enter the number of points to deduct. Each entry reduces the team total only.
        </p>
      </Card>

      {!isJuryMode && (
      <Card>
        <Badge tone="emerald">Step 3 · Submit</Badge>
        <CardTitle className="mt-4">Assign responsible jury</CardTitle>
        <CardDescription className="mt-2">
          Once you submit, the record lands in Pending Results for approval.
        </CardDescription>
        <Select
          className="mt-6"
          name="jury_id"
          required
          defaultValue={juries[0]?.id}
          disabled={lockProgram}
        >
          {juries.map((jury) => (
            <option key={jury.id} value={jury.id}>
              {jury.name}
            </option>
          ))}
        </Select>
          <Button type="submit" className="mt-4" disabled={!hasEligibleCandidates}>
          {submitLabel}
        </Button>
      </Card>
      )}
      <Modal
        open={showRules}
        onClose={() => setShowRules(false)}
        title="Scoring Matrix"
        actions={
          <Button type="button" variant="secondary" onClick={() => setShowRules(false)}>
            Close
          </Button>
        }
      >
        <div className="space-y-4 text-sm">
          <p>Single events (Category A/B/C) add grade bonus on top of podium points.</p>
          <div className="grid gap-3 rounded-2xl border border-white/10 bg-slate-900/70 p-4">
            <p className="font-semibold">Single · Podium</p>
            <p>A: 10 / 7 / 5 · B: 7 / 5 / 3 · C: 5 / 3 / 1</p>
            <p className="font-semibold">Grade Bonus</p>
            <p>A +5 · B +3 · C +1</p>
          </div>
          <div className="grid gap-3 rounded-2xl border border-white/10 bg-slate-900/70 p-4">
            <p className="font-semibold">Group</p>
            <p>1st 20 · 2nd 15 · 3rd 10</p>
            <p className="font-semibold">General</p>
            <p>1st 25 · 2nd 20 · 3rd 15</p>
          </div>
        </div>
      </Modal>
    </form>
  );
}

