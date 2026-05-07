import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useTheme } from '../context/useTheme';
import type { VitalPoint } from '../data/patients';

interface PatientChartProps {
  title: string;
  data: VitalPoint[];
  metric: 'bpm' | 'spo2';
  color: string;
  suffix: string;
}

export function PatientChart({ title, data, metric, color, suffix }: PatientChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const chartColors = {
    axis: isDark ? '#91a6bd' : '#64748b',
    grid: isDark ? '#24415f' : '#d8e1ec',
    tooltipBg: isDark ? '#0a1627' : '#ffffff',
    tooltipBorder: isDark ? '#24415f' : '#d8e1ec',
    tooltipText: isDark ? '#f5f8fc' : '#162033',
    dotFill: isDark ? '#0f2138' : '#ffffff',
  };

  return (
    <section className="panel p-5">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h3 className="text-lg font-black text-vital-text">{title}</h3>
        <span className="rounded-full bg-vital-card-soft px-3 py-1 text-xs font-black text-vital-muted">
          Tempo real
        </span>
      </div>

      <div className="h-64 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
            <CartesianGrid stroke={chartColors.grid} strokeDasharray="4 6" vertical={false} />
            <XAxis dataKey="time" stroke={chartColors.axis} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
            <YAxis stroke={chartColors.axis} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                background: chartColors.tooltipBg,
                border: `1px solid ${chartColors.tooltipBorder}`,
                borderRadius: 12,
                color: chartColors.tooltipText,
                fontWeight: 700,
              }}
              labelStyle={{ color: chartColors.axis }}
              formatter={(value) => [`${value}${suffix}`, title]}
            />
            <Line
              type="monotone"
              dataKey={metric}
              stroke={color}
              strokeWidth={3}
              dot={{ r: 3, strokeWidth: 2, fill: chartColors.dotFill }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
