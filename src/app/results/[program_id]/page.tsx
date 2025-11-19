import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trophy } from "lucide-react";
import {
  getApprovedResults,
  getJuries,
  getPrograms,
  getStudents,
  getTeams,
} from "@/lib/data";
import { formatNumber } from "@/lib/utils";

interface ProgramDetailPageProps {
  params: Promise<{ program_id: string }>;
}

async function getProgramDetail(programId: string) {
  const [results, programs, students, teams, juries] = await Promise.all([
    getApprovedResults(),
    getPrograms(),
    getStudents(),
    getTeams(),
    getJuries(),
  ]);

  const program = programs.find((p) => p.id === programId);
  const programResults = results.filter((r) => r.program_id === programId);

  const programMap = new Map(programs.map((p) => [p.id, p]));
  const studentMap = new Map(students.map((s) => [s.id, s]));
  const teamMap = new Map(teams.map((t) => [t.id, t]));
  const juryMap = new Map(juries.map((j) => [j.id, j]));

  return {
    program,
    result: programResults[0], // Get the first (and should be only) result for this program
    programMap,
    studentMap,
    teamMap,
    juryMap,
  };
}

export default async function ProgramDetailPage({ params }: ProgramDetailPageProps) {
  const { program_id } = await params;
  const data = await getProgramDetail(program_id);

  if (!data.program) {
    return (
      <main className="mx-auto max-w-5xl space-y-12 px-5 py-16 md:px-8">
        <Card>
          <CardTitle>Program not found</CardTitle>
          <CardDescription className="mt-2">
            The program you&apos;re looking for doesn&apos;t exist or has no results yet.
          </CardDescription>
          <Link href="/results" className="mt-6 inline-block">
            <Button variant="secondary">Back to Results</Button>
          </Link>
        </Card>
      </main>
    );
  }

  if (!data.result) {
    return (
      <main className="mx-auto max-w-5xl space-y-12 px-5 py-16 md:px-8">
        <Link href="/results" className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Results
        </Link>
        <Card>
          <CardTitle>{data.program.name}</CardTitle>
          <CardDescription className="mt-2">
            No approved results available for this program yet.
          </CardDescription>
        </Card>
      </main>
    );
  }

  const juryName = data.juryMap.get(data.result.jury_id)?.name ?? data.result.submitted_by;

  return (
    <main className="mx-auto max-w-5xl space-y-12 px-5 py-16 md:px-8">
      <Link
        href="/results"
        className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Results
      </Link>

      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-8 h-8 text-yellow-400" />
              <h1 className="text-4xl font-bold text-white">{data.program.name}</h1>
            </div>
            <div className="flex items-center gap-3 mt-3">
              <Badge tone="cyan">Section: {data.program.section}</Badge>
              <Badge tone="pink">Category: {data.program.category}</Badge>
              <Badge tone="emerald">Jury: {juryName}</Badge>
            </div>
          </div>
        </div>

        <Card className="border-white/5 bg-slate-900/70">
          <CardTitle className="mb-6">Podium Winners</CardTitle>
          <div className="grid gap-6 md:grid-cols-3">
            {data.result.entries
              .sort((a, b) => a.position - b.position)
              .map((entry) => {
                const student = entry.student_id
                  ? data.studentMap.get(entry.student_id)
                  : undefined;
                const team = entry.team_id
                  ? data.teamMap.get(entry.team_id)
                  : student
                    ? data.teamMap.get(student.team_id)
                    : undefined;

                const positionColors = {
                  1: "from-yellow-500/20 to-yellow-600/20 border-yellow-500/50",
                  2: "from-gray-400/20 to-gray-500/20 border-gray-400/50",
                  3: "from-orange-600/20 to-orange-700/20 border-orange-600/50",
                };

                return (
                  <div
                    key={`${data.result.id}-${entry.position}`}
                    className={`rounded-2xl border-2 bg-gradient-to-br ${positionColors[entry.position as keyof typeof positionColors]} p-6 backdrop-blur-sm`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-lg font-bold text-white">
                        {entry.position === 1
                          ? "🥇 1st Place"
                          : entry.position === 2
                            ? "🥈 2nd Place"
                            : "🥉 3rd Place"}
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-white mb-2">
                      {student?.name ?? team?.name ?? "—"}
                    </p>
                    {student && (
                      <p className="text-sm text-white/70 mb-3">
                        Chest #{student.chest_no}
                      </p>
                    )}
                    {team && (
                      <p className="text-xs uppercase text-white/60 mb-3">
                        {team.name}
                      </p>
                    )}
                    <div className="mt-4 pt-4 border-t border-white/20">
                      <p className="text-sm text-white/60">Score</p>
                      <p className="text-2xl font-bold text-emerald-300">
                        {formatNumber(entry.score)}
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
          {(data.result.penalties?.length ?? 0) > 0 && (
            <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
              <p className="text-sm font-semibold text-red-200">Minus points applied</p>
              <div className="mt-3 space-y-3">
                {data.result.penalties?.map((penalty, index) => {
                  const student = penalty.student_id
                    ? data.studentMap.get(penalty.student_id)
                    : undefined;
                  const team =
                    penalty.team_id && (!student || student.team_id === penalty.team_id)
                      ? data.teamMap.get(penalty.team_id)
                      : student
                        ? data.teamMap.get(student.team_id)
                        : data.teamMap.get(penalty.team_id ?? "");
                  return (
                    <div key={`${penalty.team_id ?? penalty.student_id ?? index}`} className="text-sm text-white/80">
                      <p className="font-semibold">
                        {student?.name ?? team?.name ?? "Unknown"} · -{penalty.points} pts
                      </p>
                      {student && (
                        <p className="text-xs text-white/60">
                          Chest #{student.chest_no} · Team {team?.name ?? "Unknown"}
                        </p>
                      )}
                      {!student && team && (
                        <p className="text-xs text-white/60">Team ID: {team.id}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <p className="mt-6 text-xs text-white/50">
            Approved on {new Date(data.result.submitted_at).toLocaleString()}
          </p>
        </Card>
      </div>
    </main>
  );
}

