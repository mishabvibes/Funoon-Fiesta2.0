import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getLiveScores, getTeams } from "@/lib/data";
import { formatNumber } from "@/lib/utils";
import { LiveScorePulse } from "@/components/live-score-pulse";
import { TeamLeadersShowcase } from "@/components/team-leaders-showcase";

async function getHomeData() {
  const [teams, live] = await Promise.all([
    getTeams(),
    getLiveScores(),
  ]);

  const scoreMap = new Map(live.map((item) => [item.team_id, item.total_points]));
  const sorted = [...teams].sort(
    (a, b) =>
      (scoreMap.get(b.id) ?? b.total_points) -
      (scoreMap.get(a.id) ?? a.total_points),
  );

  return { teams: sorted, live: scoreMap };
}

export default async function HomePage() {
  const { teams, live } = await getHomeData();

  const highlight = teams[0];

  return (
    <main className="mx-auto max-w-6xl space-y-16 px-5 py-16 md:px-8">
      <section className="grid gap-10 rounded-[32px] border border-white/10 bg-gradient-to-r from-indigo-950/80 via-fuchsia-900/40 to-emerald-900/30 p-10 text-white shadow-[0_25px_120px_rgba(236,72,153,0.25)] backdrop-blur-2xl md:grid-cols-2">
        <div className="space-y-6">
          <Badge tone="cyan">Funoon Fiesta</Badge>
          <h1 className="text-4xl font-bold leading-tight md:text-5xl">
            A Premier Platform Showcasing the Rich Art Forms of Islamic Culture
          </h1>
          <p className="text-lg text-white/80">
            Funoon Fiesta celebrates creativity, cultural appreciation, and artistic expression. 
            Follow the live scoreboard, discover talented teams, and witness the beauty of Islamic 
            art forms presented to a wider audience. Admins and Jury members can manage programs, 
            students, and results from their secure portals.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/results">
              <Button>View Approved Results</Button>
            </Link>
            <Link href="/scoreboard">
              <Button variant="secondary">Scoreboards</Button>
            </Link>
            <Link href="/team/login">
              <Button variant="outline">Team Portal</Button>
            </Link>
          </div>
        </div>
        {highlight && (
          <Card className="h-full bg-white/10">
            <CardTitle>Live leaders — {highlight.name}</CardTitle>
            <CardDescription className="mt-2">
              {highlight.description}
            </CardDescription>
            <div className="mt-8 flex flex-wrap gap-6">
              <div>
                <p className="text-sm uppercase tracking-widest text-white/60">
                  Total Points
                </p>
                <p className="text-5xl font-bold text-rose-200">
                  {formatNumber(live.get(highlight.id) ?? highlight.total_points)}
                </p>
              </div>
              <div>
                <p className="text-sm uppercase tracking-widest text-white/60">
                  Captain
                </p>
                <p className="text-2xl font-semibold">{highlight.leader}</p>
              </div>
            </div>
          </Card>
        )}
      </section>

      <LiveScorePulse teams={teams} liveScores={live} />

      <TeamLeadersShowcase teams={teams} />

      <section className="space-y-4">
        <div>
          <Badge tone="amber">About Funoon Fiesta</Badge>
          <h2 className="mt-3 text-3xl font-semibold text-white">Celebrating Islamic Art & Culture</h2>
          <p className="text-white/70">
            Funoon Fiesta is a premier platform for students to showcase their talents and highlight 
            the rich art forms of Islamic culture. Through music, calligraphy, poetry, traditional 
            dance, visual arts, and more, we present these beautiful expressions to a wider audience, 
            fostering creativity, cultural appreciation, and artistic excellence. Each performance 
            is judged transparently and scored instantly, ensuring fair recognition of every participant.
          </p>
        </div>
        <div className="section-grid">
          {[
            { 
              title: "Cultural Heritage", 
              copy: "We celebrate the diverse and rich art forms rooted in Islamic culture, from traditional calligraphy to contemporary expressions, preserving and promoting cultural appreciation.", 
              tag: "Cultural showcase" 
            },
            { 
              title: "Student Excellence", 
              copy: "A premier platform designed for students to showcase their talents, creativity, and artistic expression in a supportive and competitive environment.", 
              tag: "Talent platform" 
            },
            { 
              title: "Transparent Judging", 
              copy: "All scoring rules are codified in the platform. Every entry is auto-scored before human review, ensuring fairness and transparency in every evaluation.", 
              tag: "Fair evaluation" 
            },
            { 
              title: "Live Updates", 
              copy: "Once admins approve submissions, both team and student scores refresh in seconds, keeping everyone connected to the action in real-time.", 
              tag: "Realtime sync" 
            },
          ].map((item) => (
            <Card key={item.title}>
              <Badge tone="emerald">{item.tag}</Badge>
              <CardTitle className="mt-4">{item.title}</CardTitle>
              <CardDescription className="mt-2">{item.copy}</CardDescription>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-6 rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur-2xl md:flex md:items-center md:justify-between">
        <div>
          <Badge tone="cyan">Need help?</Badge>
          <h2 className="mt-4 text-3xl font-semibold">Funoon Fiesta Control Room</h2>
          <p className="text-white/70">
            Contact us for support, inquiries, or assistance with the platform. 
            Our team is here to help ensure a smooth and enjoyable experience.
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Link href="/admin/login">
            <Button variant="secondary">Admin Login</Button>
          </Link>
          <Link href="/jury/login">
            <Button variant="ghost">Jury Login</Button>
          </Link>
          <Link href="/team/login">
            <Button>Team Portal</Button>
          </Link>
        </div>
      </section>
      </main>
  );
}
