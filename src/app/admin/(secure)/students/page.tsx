import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StudentManager } from "@/components/student-manager";
import {
  createStudent,
  deleteStudentById,
  getStudents,
  getTeams,
  getPrograms,
  updateStudentById,
} from "@/lib/data";
import { getProgramRegistrations } from "@/lib/team-data";

function generateNextChestNumber(teamName: string, existingStudents: Array<{ chest_no: string }>): string {
  const prefix = teamName.slice(0, 2).toUpperCase();
  const teamStudents = existingStudents.filter((student) => {
    const chest = student.chest_no.toUpperCase();
    return chest.startsWith(prefix) && /^\d{3}$/.test(chest.slice(2));
  });

  if (teamStudents.length === 0) {
    return `${prefix}001`;
  }

  const numbers = teamStudents
    .map((student) => {
      const numStr = student.chest_no.toUpperCase().slice(2);
      const num = parseInt(numStr, 10);
      return isNaN(num) ? 0 : num;
    })
    .filter((num) => num > 0);

  const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
  const nextNumber = maxNumber + 1;
  return `${prefix}${String(nextNumber).padStart(3, "0")}`;
}

const studentSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  team_id: z.string().min(2),
  chest_no: z.string().optional(),
});

const csvStudentSchema = z.object({
  name: z.string().min(2, "Student name is required"),
  team_id: z.string().min(2).optional(),
  team_name: z.string().min(2).optional(),
  chest_no: z.string().optional(),
}).refine((data) => data.team_id || data.team_name, {
  message: "Either team_id or team_name is required",
  path: ["team_id"],
});

async function upsertStudent(formData: FormData, mode: "create" | "update") {
  const parsed = studentSchema.safeParse({
    id: String(formData.get("id") ?? "").trim() || undefined,
    name: String(formData.get("name") ?? "").trim(),
    team_id: String(formData.get("team_id") ?? "").trim(),
    chest_no: String(formData.get("chest_no") ?? "").trim() || undefined,
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((issue) => issue.message).join(", "));
  }
  const payload = parsed.data;

  let chest_no = payload.chest_no;
  
  if (mode === "create" && !chest_no) {
    const [students, teams] = await Promise.all([getStudents(), getTeams()]);
    const team = teams.find((t) => t.id === payload.team_id);
    if (!team) {
      throw new Error("Team not found");
    }
    chest_no = generateNextChestNumber(team.name, students);
  } else if (mode === "update" && !chest_no) {
    const students = await getStudents();
    const current = students.find((s) => s.id === payload.id);
    if (!current) {
      throw new Error("Student not found");
    }
    chest_no = current.chest_no;
  }

  if (mode === "create") {
    await createStudent({
      name: payload.name,
      team_id: payload.team_id,
      chest_no: chest_no!,
    });
  } else {
    if (!payload.id) throw new Error("Student ID missing");
    await updateStudentById(payload.id, {
      name: payload.name,
      team_id: payload.team_id,
      chest_no: chest_no!,
    });
  }

  revalidatePath("/admin/students");
}

async function deleteStudentAction(formData: FormData) {
  "use server";
  const id = String(formData.get("id") ?? "");
  await deleteStudentById(id);
  revalidatePath("/admin/students");
}

async function bulkDeleteStudentsAction(formData: FormData) {
  "use server";
  const ids = String(formData.get("student_ids") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (ids.length === 0) {
    throw new Error("No students selected for deletion.");
  }
  for (const id of ids) {
    await deleteStudentById(id);
  }
  revalidatePath("/admin/students");
}

async function createStudentAction(formData: FormData) {
  "use server";
  await upsertStudent(formData, "create");
}

async function updateStudentAction(formData: FormData) {
  "use server";
  await upsertStudent(formData, "update");
}

function parseStudentCsv(content: string) {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];
  const [headerLine, ...rows] = lines;
  const headers = headerLine
    .split(",")
    .map((header) => header.trim().toLowerCase());
  
  // Accept either team_id or team_name
  const hasTeamId = headers.includes("team_id");
  const hasTeamName = headers.includes("team_name");
  
  if (!hasTeamId && !hasTeamName) {
    throw new Error('Missing "team_id" or "team_name" column in CSV header.');
  }
  
  const requiredHeaders = ["name"];
  if (hasTeamId) requiredHeaders.push("team_id");
  if (hasTeamName) requiredHeaders.push("team_name");
  
  for (const column of requiredHeaders) {
    if (!headers.includes(column)) {
      throw new Error(`Missing "${column}" column in CSV header.`);
    }
  }
  const indexes = requiredHeaders.map((column) => headers.indexOf(column));
  return rows.map((row, index) => {
    const cells = row.split(",").map((cell) => cell.trim());
    if (cells.length < headers.length) {
      throw new Error(`Row ${index + 2} is incomplete.`);
    }
    const data = Object.fromEntries(
      requiredHeaders.map((column, idx) => [column, cells[indexes[idx]] ?? ""]),
    );
    return { row: index + 2, data };
  });
}

async function importStudentsAction(formData: FormData) {
  "use server";
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Please upload a CSV file.");
  }
  const text = await file.text();
  const entries = parseStudentCsv(text);
  if (entries.length === 0) {
    throw new Error("CSV file does not contain any data rows.");
  }
  const teams = await getTeams();
  const teamIds = new Set(teams.map((team) => team.id));
  const teamNameToId = new Map(teams.map((team) => [team.name.toUpperCase(), team.id]));
  
  for (const entry of entries) {
    // Skip empty rows
    if (!entry.data.name || !entry.data.name.trim()) {
      continue;
    }
    
    const parsed = csvStudentSchema.safeParse(entry.data);
    if (!parsed.success) {
      const message = parsed.error.issues.map((issue) => issue.message).join(", ");
      throw new Error(`Row ${entry.row}: ${message}`);
    }
    
    // Resolve team_id: check if provided value is a valid team_id, otherwise treat as team_name
    let resolvedTeamId = parsed.data.team_id;
    
    // If team_id is provided but not found in valid IDs, try treating it as a team name
    if (resolvedTeamId && !teamIds.has(resolvedTeamId)) {
      const teamNameUpper = resolvedTeamId.toUpperCase();
      const foundId = teamNameToId.get(teamNameUpper);
      if (foundId) {
        resolvedTeamId = foundId;
      }
    }
    
    // If still no team_id, try team_name field
    if (!resolvedTeamId && parsed.data.team_name) {
      const teamNameUpper = parsed.data.team_name.toUpperCase();
      resolvedTeamId = teamNameToId.get(teamNameUpper);
    }
    
    if (!resolvedTeamId) {
      const providedValue = parsed.data.team_id || parsed.data.team_name || "";
      throw new Error(
        `Row ${entry.row}: Team "${providedValue}" not found. Available teams: ${Array.from(teamNameToId.keys()).join(", ")}`
      );
    }
    
    const team = teams.find((t) => t.id === resolvedTeamId);
    if (!team) {
      throw new Error(`Row ${entry.row}: Team not found`);
    }
    
    const students = await getStudents();
    const chest_no = parsed.data.chest_no?.trim() || generateNextChestNumber(team.name, students);
    
    await createStudent({
      name: parsed.data.name,
      team_id: resolvedTeamId,
      chest_no,
    });
  }
  revalidatePath("/admin/students");
}

export default async function StudentsPage() {
  const [students, teams, programs, registrations] = await Promise.all([
    getStudents(),
    getTeams(),
    getPrograms(),
    getProgramRegistrations(),
  ]);

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-2">
      <Card className="h-full">
        <CardTitle>Add Student</CardTitle>
        <CardDescription className="mt-2">
          Maintain a searchable roster for quick result entry.
        </CardDescription>
        <form
          action={createStudentAction}
          className="mt-6 grid gap-4 md:grid-cols-2"
        >
          <Input name="name" placeholder="Student name" required />
          <Select name="team_id" defaultValue={teams[0]?.id} required>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </Select>
          <Button type="submit" className="md:col-span-2">
            Save Student
          </Button>
        </form>
        <p className="mt-2 text-xs text-white/60">
          Chest number will be auto-generated based on team name (e.g., {teams[0]?.name.slice(0, 2).toUpperCase()}001)
        </p>
      </Card>
      <Card className="h-full">
        <CardTitle>Bulk Import Students (CSV)</CardTitle>
        <CardDescription className="mt-2">
          Required columns: <code>name</code> and either <code>team_id</code> or <code>team_name</code>
          <br />
          <span className="text-xs text-white/50">
            Chest numbers will be auto-generated. Team names: SAMARQAND, NAHAVAND, YAMAMA, QURTUBA, MUQADDAS, BUKHARA
          </span>
        </CardDescription>
        <form
          action={importStudentsAction}
          className="mt-6 flex flex-col gap-4 md:flex-row md:items-end"
        >
          <div className="flex-1">
            <label className="text-sm font-semibold text-white/70">
              CSV File
            </label>
            <input
              type="file"
              name="file"
              accept=".csv,text/csv"
              required
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:border-fuchsia-400 focus:outline-none"
            />
          </div>
          <Button type="submit">Import CSV</Button>
        </form>
      </Card>
      </div>

      <StudentManager
        students={students}
        teams={teams}
        programs={programs}
        registrations={registrations}
        updateAction={updateStudentAction}
        deleteAction={deleteStudentAction}
        bulkDeleteAction={bulkDeleteStudentsAction}
      />
    </div>
  );
}

