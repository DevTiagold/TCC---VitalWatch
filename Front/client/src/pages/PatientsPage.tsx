import { Plus, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PatientCard } from '../components/PatientCard';
import { useAuth } from '../context/auth';
import { patientService } from '../services/patientService';
import { connectVitalsSocket } from '../services/realtimeService';
import type { BackendVitalMeasure, Patient } from '../types/vital';

export function PatientsPage() {
  const { token } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const filteredPatients = useMemo(
    () => patients.filter((patient) => patient.name.toLowerCase().includes(search.toLowerCase())),
    [patients, search],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadPatients() {
      setLoading(true);
      setError('');

      try {
        const nextPatients = await patientService.getPatients();
        if (isMounted) setPatients(nextPatients);
      } catch (apiError) {
        if (isMounted) {
          setError(apiError instanceof Error ? apiError.message : 'Nao foi possivel carregar pacientes.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void loadPatients();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!token) return undefined;

    const handleMeasure = (measure: BackendVitalMeasure) => {
      setPatients((currentPatients) => {
        const result = patientService.applyVitalMeasure(currentPatients, measure);

        if (!result.foundPatient) {
          void patientService.getPatientFromRealtimeId(measure.paciente_id).then((patient) => {
            if (!patient) return;
            setPatients((latestPatients) => patientService.applyVitalMeasure([patient, ...latestPatients], measure).patients);
          });
        }

        return result.patients;
      });
    };

    const socket = connectVitalsSocket(token, handleMeasure, (message) => setError(`Tempo real indisponivel: ${message}`));
    return () => {
      socket.disconnect();
    };
  }, [token]);

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
            <input
              className="field pl-12"
              placeholder="Buscar paciente"
              aria-label="Buscar paciente"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2 text-sm font-bold text-vital-muted">
            <span className="rounded-full bg-vital-card-soft px-3 py-2">{filteredPatients.length} pacientes</span>
            <span className="rounded-full bg-vital-green/12 px-3 py-2 text-vital-green">Normal</span>
            <span className="rounded-full bg-vital-yellow/12 px-3 py-2 text-vital-yellow">Atencao</span>
            <span className="rounded-full bg-vital-red/12 px-3 py-2 text-vital-red">Critico</span>
          </div>
        </div>
      </section>

      {error ? (
        <section className="rounded-xl border border-vital-yellow/40 bg-vital-yellow/10 px-4 py-3 text-sm font-bold text-vital-text">
          {error}
        </section>
      ) : null}

      {loading ? (
        <section className="panel p-6 text-sm font-bold text-vital-muted">Carregando pacientes...</section>
      ) : (
        <section className="grid auto-rows-fr gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredPatients.map((patient) => (
            <PatientCard key={patient.id} patient={patient} />
          ))}
        </section>
      )}
    </div>
  );
}
