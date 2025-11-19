import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { logoutTeam, getCurrentTeam } from "@/lib/auth";

async function logoutAction() {
  "use server";
  await logoutTeam();
  redirect("/team/login");
}

export default async function TeamLayout({ children }: { children: ReactNode }) {
  const team = await getCurrentTeam();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-5 py-10 md:px-8">
        <header
          className="rounded-3xl border border-white/10 bg-white/5 px-6 py-4"
          style={{ borderColor: team?.themeColor ?? "#0ea5e9" }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Badge tone="cyan">Team Portal</Badge>
              <h1 className="text-2xl font-semibold">
                {team ? `${team.teamName} · ${team.leaderName}` : "Team Portal"}
              </h1>
            </div>
            {team && (
              <form action={logoutAction}>
                <Button type="submit" variant="ghost">
                  Logout
                </Button>
              </form>
            )}
          </div>
        </header>
        {team && (
          <nav className="flex flex-wrap gap-3 rounded-3xl border border-white/10 bg-white/5 p-4">
            <a href="/team/dashboard" className="rounded-2xl px-4 py-2 text-sm font-semibold hover:bg-white/10">
              Dashboard
            </a>
            <a href="/team/register-students" className="rounded-2xl px-4 py-2 text-sm font-semibold hover:bg-white/10">
              Register Students
            </a>
            <a href="/team/program-register" className="rounded-2xl px-4 py-2 text-sm font-semibold hover:bg-white/10">
              Program Registration
            </a>
          </nav>
        )}
        <section>{children}</section>
      </div>
    </div>
  );
}

