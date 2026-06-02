import { Activity, CheckCircle2, Siren } from 'lucide-react';
import type { PatientEvent } from '../data/patients';

interface EventHistoryProps {
  events: PatientEvent[];
}

const eventTone = {
  danger: {
    icon: Siren,
    className: 'text-vital-red bg-vital-red/12 ring-vital-red/25',
  },
  success: {
    icon: CheckCircle2,
    className: 'text-vital-green bg-vital-green/12 ring-vital-green/25',
  },
  info: {
    icon: Activity,
    className: 'text-vital-blue bg-vital-blue/12 ring-vital-blue/25',
  },
};

export function EventHistory({ events }: EventHistoryProps) {
  return (
    <section className="panel p-5">
      <h3 className="text-lg font-black text-vital-text">Histórico de Eventos</h3>
      <div className="mt-5 flex flex-col gap-4">
        {events.length === 0 ? (
          <div className="rounded-xl bg-vital-card-soft/60 p-4 text-sm font-bold text-vital-muted">
            Nenhum evento registrado.
          </div>
        ) : null}
        {events.map((event) => {
          const tone = eventTone[event.tone];
          const Icon = tone.icon;

          return (
            <div key={event.id} className="flex items-center gap-4 rounded-xl bg-vital-card-soft/60 p-4">
              <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ring-1 ${tone.className}`}>
                <Icon size={20} strokeWidth={2.4} />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-vital-text">{event.title}</p>
                <p className="mt-1 text-sm font-semibold text-vital-muted">{event.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
