import type { LucideIcon } from 'lucide-react';

interface VitalMetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  helper?: string;
  tone: 'heart' | 'oxygen' | 'neutral';
}

const toneClasses = {
  heart: 'text-vital-red bg-vital-red/12 ring-vital-red/25',
  oxygen: 'text-vital-cyan bg-vital-cyan/12 ring-vital-cyan/25',
  neutral: 'text-vital-blue bg-vital-blue/12 ring-vital-blue/25',
};

export function VitalMetricCard({ icon: Icon, label, value, helper, tone }: VitalMetricCardProps) {
  return (
    <div className="flex min-h-24 items-center gap-4 rounded-xl border border-vital-border bg-vital-card-soft/70 p-4">
      <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg ring-1 ${toneClasses[tone]}`}>
        <Icon size={22} strokeWidth={2.4} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-vital-muted">{label}</p>
        <p className="mt-1 text-xl font-black text-vital-text sm:text-2xl">{value}</p>
        {helper ? <p className="mt-1 text-xs font-semibold text-vital-muted">{helper}</p> : null}
      </div>
    </div>
  );
}
