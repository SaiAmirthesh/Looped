import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

const skillData = [
  { skill: "Focus", value: 78 },
  { skill: "Discipline", value: 65 },
  { skill: "Health", value: 70 },
  { skill: "Learning", value: 82 },
  { skill: "Consistency", value: 60 },
];

export default function SkillRadarChart() {
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4 text-white">
        Skill Stats
      </h3>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={skillData}>
            <PolarGrid stroke="var(--border)" />
            <PolarAngleAxis
              dataKey="skill"
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
            />
            <Radar
              name="Skills"
              dataKey="value"
              stroke="var(--color-primary)"
              fill="var(--color-primary)"
              fillOpacity={0.3}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
