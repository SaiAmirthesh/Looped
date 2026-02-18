import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const nextLevelXp = (level) => Math.floor(100 * Math.pow(level ?? 1, 1.5));

export default function SkillRadarChart({ skills = [] }) {
  // Map each skill to its % progress toward next level (0–100 scale)
  const data = skills
    .filter(s => s && s.name)
    .map(s => {
      const xp = s.current_xp ?? s.currentXP ?? 0;
      const level = s.level ?? 1;
      const maxXp = nextLevelXp(level);
      const pct = maxXp > 0 ? Math.min(100, Math.round((xp / maxXp) * 100)) : 0;
      return { skill: s.name, value: pct, xp, maxXp, level };
    });

  const chartData = data.length > 0 ? data : [
    { skill: 'Focus', value: 0 },
    { skill: 'Learning', value: 0 },
    { skill: 'Health', value: 0 },
    { skill: 'Creativity', value: 0 },
    { skill: 'Confidence', value: 0 },
    { skill: 'Social', value: 0 },
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs shadow-lg">
        <p className="font-semibold text-foreground">{d.skill}</p>
        {d.xp !== undefined && (
          <p className="text-muted-foreground">Lv.{d.level} · {d.xp}/{d.maxXp} XP ({d.value}%)</p>
        )}
      </div>
    );
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4 text-foreground">Skill Stats</h3>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chartData}>
            <PolarGrid stroke="var(--border)" />
            <PolarAngleAxis dataKey="skill" tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} />
            <Radar name="Skills" dataKey="value" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.65} strokeWidth={2} />
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
