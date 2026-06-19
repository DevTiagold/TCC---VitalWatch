import { Activity, HeartPulse, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Patient } from '../data/patients';
import { statusMeta } from '../data/patients';

interface PatientCardProps {
  patient: Patient;
}

export function PatientCard({ patient }: PatientCardProps) {
  const meta = statusMeta[patient.status];
  const initial = patient.name.charAt(0);
  const bpm = patient.bpm === null ? 'Aguardando' : patient.bpm;
  const spo2 = patient.spo2 === null ? 'Aguardando' : `${patient.spo2}%`;

  return (
    <div className={`group relative rounded-2xl border border-l-4 ${meta.borderClass} bg-vital-panel shadow-xl shadow-black/15`}>
      {/* botão de configurar dispositivo — posicionado no canto superior direito */}
      <Link
        to={`/paciente/${patient.id}/configurar`}
        title="Configurar dispositivo"
        className="absolute right-3 top-3 z-10 rounded-lg p-1.5 text-vital-muted/50 transition hover:bg-vital-blue/10 hover:text-vital-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vital-blue/60"
      >
        <Settings size={15} strokeWidth={2.4} />
      </Link>

      {/* card principal — navega para detalhe do paciente */}
      <Link
        to={`/paciente/${patient.id}`}
        className={`block p-5 transition hover:-translate-y-0.5 hover:shadow-vital-blue/10 focus-visible:outline-none focus-visible:ring-2 ${meta.ringClass} rounded-2xl`}
      >
        <div className="flex items-start justify-between gap-4 pr-6">
          <div className="flex min-w-0 items-center gap-4">
            <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-full text-xl font-black ${meta.bgClass} ${meta.textClass}`}>
              {initial}
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-lg font-black text-vital-text">{patient.name}</h3>
              <p className="mt-1 text-sm font-semibold text-vital-muted">
                {patient.age === null ? 'Idade nao informada' : `${patient.age} anos`}
              </p>
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
            <p className="mt-2 text-xl font-black text-vital-text sm:text-2xl">{bpm}</p>
          </div>
          <div className="rounded-xl bg-vital-card-soft/70 px-4 py-3">
            <div className="flex items-center gap-2 text-vital-cyan">
              <Activity size={18} strokeWidth={2.5} />
              <span className="text-xs font-black uppercase text-vital-muted">SpO2</span>
            </div>
            <p className="mt-2 text-xl font-black text-vital-text sm:text-2xl">{spo2}</p>
          </div>
        </div>
      </Link>
    </div>
  );
}
