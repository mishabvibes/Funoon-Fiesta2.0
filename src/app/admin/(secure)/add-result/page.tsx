import { redirect } from "next/navigation";
import { AddResultForm } from "@/components/forms/add-result-form";
import { getJuries, getPrograms, getStudents, getTeams } from "@/lib/data";
import { getProgramRegistrations } from "@/lib/team-data";
import { ensureRegisteredCandidates } from "@/lib/registration-guard";
import { submitResultToPending } from "@/lib/result-service";

type PenaltyFormPayload = {
  id: string;
  type: "student" | "team";
  points: number;
};

function parsePenaltyPayloads(formData: FormData): PenaltyFormPayload[] {
  const rowValue = String(formData.get("penalty_rows") ?? "");
  const rowIds = rowValue
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return rowIds
    .map((rowId) => {
      const target = String(formData.get(`penalty_target_${rowId}`) ?? "").trim();
      const type = String(formData.get(`penalty_type_${rowId}`) ?? "").trim();
      const pointsRaw = String(formData.get(`penalty_points_${rowId}`) ?? "").trim();
      const points = pointsRaw ? Math.abs(Number(pointsRaw)) : 0;
      if (!target || points <= 0 || (type !== "student" && type !== "team") || Number.isNaN(points)) {
        return null;
      }
      return {
        id: target,
        type,
        points,
      } satisfies PenaltyFormPayload;
    })
    .filter((penalty): penalty is PenaltyFormPayload => Boolean(penalty));
}

async function submitResultAction(formData: FormData) {
  "use server";

  const programId = String(formData.get("program_id") ?? "");
  const juryId = String(formData.get("jury_id") ?? "");

  const winners = ([
    { key: "winner_1", gradeKey: "grade_1", position: 1 as const },
    { key: "winner_2", gradeKey: "grade_2", position: 2 as const },
    { key: "winner_3", gradeKey: "grade_3", position: 3 as const },
  ] as const).map(({ key, gradeKey, position }) => {
    const value = String(formData.get(key) ?? "");
    if (!value) throw new Error("All placements are required");
    return {
      position,
      id: value,
      grade: String(formData.get(gradeKey) ?? "none") as
        | "A"
        | "B"
        | "C"
        | "none",
    };
  });

  const penalties = parsePenaltyPayloads(formData);

  await ensureRegisteredCandidates(programId, [
    ...winners.map((winner) => winner.id),
    ...penalties.map((penalty) => penalty.id),
  ]);

  await submitResultToPending({
    programId,
    juryId,
    winners,
    penalties,
  });

  redirect("/admin/pending-results");
}

export default async function AddResultPage() {
  const [programs, students, teams, juries, registrations] = await Promise.all([
    getPrograms(),
    getStudents(),
    getTeams(),
    getJuries(),
    getProgramRegistrations(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Add result (3 steps)</h1>
      <AddResultForm
        programs={programs}
        students={students}
        teams={teams}
        juries={juries}
        registrations={registrations}
        action={submitResultAction}
      />
    </div>
  );
}

