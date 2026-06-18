import { Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PatientCard } from '../components/PatientCard';
import { StatusSummaryCard } from '../components/StatusSummaryCard';
import { useAuth } from '../context/auth';
import { patientService } from '../services/patientService';
import { connectVitalsSocket } from '../services/realtimeService';
import type { BackendAlertEvent, BackendVitalMeasure, Patient } from '../types/vital';

export function DashboardPage() {
  const { token } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [socketError, setSocketError] = useState('');

  const summary = useMemo(
    () =>
      patients.reduce(
        (currentSummary, patient) => ({
          ...currentSummary,
          [patient.status]: currentSummary[patient.status] + 1,
        }),
        { normal: 0, attention: 0, critical: 0, waiting: 0 },
      ),
    [patients],
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
            setPatients((latestPatients) => {
              const latestResult = patientService.applyVitalMeasure([patient, ...latestPatients], measure);
              return latestResult.patients;
            });
          });
        }

        return result.patients;
      });
    };

    const handleAlert = (alert: BackendAlertEvent) => {
      setPatients((currentPatients) => patientService.applyAlertEvent(currentPatients, alert));
    };

    const socket = connectVitalsSocket(token, handleMeasure, setSocketError, handleAlert);
    return () => {
      socket.disconnect();
    };
  }, [token]);

  return (
    <div className="page-shell">
      <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-normal text-vital-text sm:text-4xl">Monitoramento em Tempo Real</h2>
          <p className="mt-2 text-base font-semibold text-vital-muted">{patients.length} pacientes em observacao</p>
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
        <StatusSummaryCard status="normal" count={summary.normal} />
        <StatusSummaryCard status="attention" count={summary.attention} />
        <StatusSummaryCard status="critical" count={summary.critical} />
      </section>

      {error || socketError ? (
        <section className="rounded-xl border border-vital-yellow/40 bg-vital-yellow/10 px-4 py-3 text-sm font-bold text-vital-text">
          {error || `Tempo real indisponivel: ${socketError}`}
        </section>
      ) : null}

      {loading ? (
        <section className="panel p-6 text-sm font-bold text-vital-muted">Carregando pacientes...</section>
      ) : (
        <section className="grid auto-rows-fr gap-5 md:grid-cols-2 xl:grid-cols-3">
          {patients.map((patient) => (
            <PatientCard key={patient.id} patient={patient} />
          ))}
        </section>
      )}
    </div>
  );
}
