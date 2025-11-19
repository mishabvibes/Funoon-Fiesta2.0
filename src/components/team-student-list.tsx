import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { PortalStudent } from "@/lib/types";

interface Props {
  students: PortalStudent[];
  updateAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
}

export function TeamStudentList({ students, updateAction, deleteAction }: Props) {
  if (students.length === 0) {
    return <p className="text-sm text-white/60">No students added yet.</p>;
  }

  return (
    <div className="space-y-4">
      {students.map((student) => (
        <Card key={student.id} className="space-y-3 border-white/10 bg-white/5 p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-white">{student.name}</p>
              <p className="text-sm text-white/60">Chest: {student.chestNumber}</p>
            </div>
            <form action={deleteAction} className="text-right">
              <input type="hidden" name="studentId" value={student.id} />
              <Button type="submit" variant="danger">
                Delete
              </Button>
            </form>
          </div>
          <form action={updateAction} className="grid gap-3 md:grid-cols-2">
            <input type="hidden" name="studentId" value={student.id} />
            <input type="hidden" name="chestNumber" value={student.chestNumber} />
            <Input name="name" defaultValue={student.name} placeholder="Student name" required />
            <Button type="submit" className="w-full">
              Update name
            </Button>
          </form>
        </Card>
      ))}
    </div>
  );
}

