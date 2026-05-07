import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PatientCard } from '../components/PatientCard';
import { StatusSummaryCard } from '../components/StatusSummaryCard';
import { patientSummary, patients } from '../data/patients';

export function DashboardPage() {
  return (
    <div className="page-shell">
      <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-normal text-vital-text sm:text-4xl">Monitoramento em Tempo Real</h2>
          <p className="mt-2 text-base font-semibold text-vital-muted">{patients.length} pacientes em observação</p>
        </div>
        <Link
          to="/cadastrar-paciente"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-vital-blue px-5 text-sm font-black text-white shadow-lg shadow-vital-blue/25 transition hover:bg-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vital-blue/60"
        >
          <Plus size={19} strokeWidth={2.6} />
          Adicionar Paciente
        </Link>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <StatusSummaryCard status="normal" count={patientSummary.normal} />
        <StatusSummaryCard status="attention" count={patientSummary.attention} />
        <StatusSummaryCard status="critical" count={patientSummary.critical} />
      </section>

      <section className="grid auto-rows-fr gap-5 md:grid-cols-2 xl:grid-cols-3">
        {patients.map((patient) => (
          <PatientCard key={patient.id} patient={patient} />
        ))}
      </section>
    </div>
  );
}
