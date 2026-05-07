import { Activity, HeartPulse, Share2, UserRound } from 'lucide-react';
import { Navigate, useParams } from 'react-router-dom';
import { BackToDashboard } from '../components/BackToDashboard';
import { EventHistory } from '../components/EventHistory';
import { PatientChart } from '../components/PatientChart';
import { VitalMetricCard } from '../components/VitalMetricCard';
import { patients, statusMeta } from '../data/patients';

export function PatientDetailsPage() {
  const { id } = useParams();
  const patient = patients.find((currentPatient) => currentPatient.id === id);

  if (!patient) {
    return <Navigate to="/dashboard" replace />;
  }

  const meta = statusMeta[patient.status];

  return (
    <div className="page-shell">
      <div className="flex flex-col gap-3">
        <BackToDashboard />
        <div>
          <h2 className="text-3xl font-black tracking-normal text-vital-text sm:text-4xl">Detalhes do Paciente</h2>
          <p className="mt-2 text-base font-semibold text-vital-muted">{patient.room} • {patient.updatedAt}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className={`panel border-t-4 ${meta.borderClass} p-6`}>
          <div className="flex flex-col items-center text-center">
            <div className={`grid h-24 w-24 place-items-center rounded-full text-4xl font-black ${meta.bgClass} ${meta.textClass}`}>
              {patient.name.charAt(0)}
            </div>
            <h3 className="mt-5 text-2xl font-black text-vital-text">{patient.name}</h3>
            <p className="mt-1 text-sm font-bold text-vital-muted">{patient.age} anos</p>
            <span className={`mt-4 rounded-full px-4 py-2 text-sm font-black ${meta.bgClass} ${meta.textClass}`}>
              {meta.label}
            </span>
          </div>

          <div className="mt-7 grid gap-4">
            <VitalMetricCard icon={HeartPulse} label="Batimentos" value={`${patient.bpm} BPM`} helper="Leitura atual" tone="heart" />
            <VitalMetricCard icon={Activity} label="Oxigenação" value={`${patient.spo2}%`} helper="SpO2" tone="oxygen" />
            <VitalMetricCard icon={UserRound} label="Pulseira" value={patient.braceletId} helper={patient.relativeEmail} tone="neutral" />
          </div>

          <button
            type="button"
            className="mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-vital-blue px-5 text-sm font-black text-white shadow-lg shadow-vital-blue/25 transition hover:bg-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vital-blue/60"
          >
            <Share2 size={19} strokeWidth={2.6} />
            Compartilhar Acesso
          </button>
        </aside>

        <section className="grid min-w-0 gap-6">
          <div className="grid min-w-0 gap-6 lg:grid-cols-2">
            <PatientChart title="Gráfico de Batimentos" data={patient.chartData} metric="bpm" color="#ff5168" suffix=" BPM" />
            <PatientChart title="Gráfico de Oxigenação" data={patient.chartData} metric="spo2" color="#32c7ff" suffix="%" />
          </div>
          <EventHistory events={patient.events} />
        </section>
      </div>
    </div>
  );
}
