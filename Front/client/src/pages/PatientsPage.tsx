import { Plus, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PatientCard } from '../components/PatientCard';
import { patients } from '../data/patients';

export function PatientsPage() {
  return (
    <div className="page-shell">
      <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-normal text-vital-text sm:text-4xl">Pacientes</h2>
          <p className="mt-2 text-base font-semibold text-vital-muted">Painel completo dos pacientes monitorados</p>
        </div>
        <Link
          to="/cadastrar-paciente"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-vital-blue px-5 text-sm font-black text-white shadow-lg shadow-vital-blue/25 transition hover:bg-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vital-blue/60"
        >
          <Plus size={19} strokeWidth={2.6} />
          Adicionar Paciente
        </Link>
      </header>

      <section className="panel p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-vital-muted" />
            <input className="field pl-12" placeholder="Buscar paciente" aria-label="Buscar paciente" />
          </div>
          <div className="flex flex-wrap gap-2 text-sm font-bold text-vital-muted">
            <span className="rounded-full bg-vital-card-soft px-3 py-2">{patients.length} pacientes</span>
            <span className="rounded-full bg-vital-green/12 px-3 py-2 text-vital-green">Normal</span>
            <span className="rounded-full bg-vital-yellow/12 px-3 py-2 text-vital-yellow">Atenção</span>
            <span className="rounded-full bg-vital-red/12 px-3 py-2 text-vital-red">Crítico</span>
          </div>
        </div>
      </section>

      <section className="grid auto-rows-fr gap-5 md:grid-cols-2 xl:grid-cols-3">
        {patients.map((patient) => (
          <PatientCard key={patient.id} patient={patient} />
        ))}
      </section>
    </div>
  );
}
