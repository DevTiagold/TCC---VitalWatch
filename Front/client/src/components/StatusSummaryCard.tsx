import type { PatientStatus } from '../data/patients';
import { statusMeta } from '../data/patients';

interface StatusSummaryCardProps {
  status: PatientStatus;
  count: number;
}

export function StatusSummaryCard({ status, count }: StatusSummaryCardProps) {
  const meta = statusMeta[status];

  return (
    <article className={`panel border-l-4 ${meta.borderClass} p-5`}>
      <p className="text-sm font-bold text-vital-muted">{meta.label}</p>
      <div className="mt-4 flex items-end justify-between gap-4">
        <strong className={`text-4xl font-black ${meta.textClass}`}>{count}</strong>
        <span className={`rounded-full px-3 py-1 text-xs font-black ${meta.bgClass} ${meta.textClass}`}>
          Pacientes
        </span>
      </div>
    </article>
  );
}
