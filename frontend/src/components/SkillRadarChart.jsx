import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

export default function SkillRadarChart({ skills = [] }) {
  const data = skills.map(s => ({ skill: s.name, value: Math.min(100, Math.round(s.currentXP || 0)) }));

  // Fallback to simple items if no skills passed
  const chartData = data.length > 0 ? data : [
    { skill: 'Focus', value: 0 },
    { skill: 'Discipline', value: 0 },
    { skill: 'Health', value: 0 },
    { skill: 'Learning', value: 0 },
    { skill: 'Creativity', value: 0 },
    { skill: 'Social', value: 0 },
  ];

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4 text-foreground">Skill Stats</h3>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chartData}>
            <PolarGrid stroke="var(--border)" />
            <PolarAngleAxis dataKey="skill" tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} />
            <Radar name="Skills" dataKey="value" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.3} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
