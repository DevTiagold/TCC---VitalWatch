import { Activity, HeartPulse } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Patient } from '../data/patients';
import { statusMeta } from '../data/patients';

interface PatientCardProps {
  patient: Patient;
}

export function PatientCard({ patient }: PatientCardProps) {
  const meta = statusMeta[patient.status];
  const initial = patient.name.charAt(0);

  return (
    <Link
      to={`/paciente/${patient.id}`}
      className={`group block rounded-2xl border border-l-4 ${meta.borderClass} bg-vital-panel p-5 shadow-xl shadow-black/15 transition hover:-translate-y-1 hover:border-vital-blue/70 hover:shadow-vital-blue/10 focus-visible:outline-none focus-visible:ring-2 ${meta.ringClass}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-full text-xl font-black ${meta.bgClass} ${meta.textClass}`}>
            {initial}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-lg font-black text-vital-text">{patient.name}</h3>
            <p className="mt-1 text-sm font-semibold text-vital-muted">{patient.age} anos</p>
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${meta.bgClass} ${meta.textClass}`}>
          {meta.label}
        </span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-vital-card-soft/70 px-4 py-3">
          <div className="flex items-center gap-2 text-vital-red">
            <HeartPulse size={18} strokeWidth={2.5} />
            <span className="text-xs font-black uppercase text-vital-muted">BPM</span>
          </div>
          <p className="mt-2 text-2xl font-black text-vital-text">{patient.bpm}</p>
        </div>
        <div className="rounded-xl bg-vital-card-soft/70 px-4 py-3">
          <div className="flex items-center gap-2 text-vital-cyan">
            <Activity size={18} strokeWidth={2.5} />
            <span className="text-xs font-black uppercase text-vital-muted">SpO2</span>
          </div>
          <p className="mt-2 text-2xl font-black text-vital-text">{patient.spo2}%</p>
        </div>
      </div>
    </Link>
  );
}
