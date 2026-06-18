import { Activity, HeartPulse, Share2, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { BackToDashboard } from '../components/BackToDashboard';
import { EventHistory } from '../components/EventHistory';
import { PatientChart } from '../components/PatientChart';
import { VitalMetricCard } from '../components/VitalMetricCard';
import { useAuth } from '../context/auth';
import { statusMeta } from '../data/patients';
import { patientService, alertRecenteToEvent, alertWsToEvent } from '../services/patientService';
import { connectVitalsSocket } from '../services/realtimeService';
import { vitalsService } from '../services/vitalsService';
import type { BackendAlertWs, BackendVitalMeasure, Patient, PatientEvent } from '../types/vital';

const emptyChartData = [{ time: 'Aguardando', bpm: 0, spo2: 0 }];

export function PatientDetailsPage() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isSharing, setIsSharing] = useState(false);
  const [shareMessage, setShareMessage] = useState({ text: '', type: '' });

  // Carga inicial: dados do paciente + alertas recentes do banco
  useEffect(() => {
    let isMounted = true;

    async function loadPatient() {
      if (!id) return;
      setLoading(true);
      setError('');

      try {
        const nextPatient = await patientService.getPatientById(id);
        if (!isMounted) return;

        if (!nextPatient) {
          setError('Paciente nao encontrado.');
          setPatient(null);
          return;
        }

        // Buscar alertas recentes do banco de dados
        let alertEvents: PatientEvent[] = [];
        try {
          const alertas = await patientService.getAlertasRecentes(id);
          alertEvents = alertas.map(alertRecenteToEvent);
        } catch {
          // Sem alertas disponíveis (endpoint pode não estar disponível ainda)
        }

        // Mesclar alertas do banco com eventos existentes
        const mergedEvents = alertEvents.length > 0
          ? [...alertEvents, ...nextPatient.events.filter((e) => !e.id.startsWith('alert-'))].slice(0, 10)
          : nextPatient.events;

        setPatient({ ...nextPatient, events: mergedEvents });

        // O backend so expoe medias horarias para o paciente autenticado; para enfermeiras vendo outro paciente,
        // o historico permanece mockado/aguardando ate existir uma rota por paciente_id.
        if (user?.id === id) {
          const chartData = await vitalsService.getAuthenticatedPatientHourlyVitals();
          if (isMounted) setPatient((currentPatient) => (currentPatient ? { ...currentPatient, chartData } : currentPatient));
        }
      } catch (apiError) {
        if (isMounted) setError(apiError instanceof Error ? apiError.message : 'Nao foi possivel carregar o paciente.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void loadPatient();

    return () => {
      isMounted = false;
    };
  }, [id, user?.id]);

  // WebSocket: medidas + alertas em tempo real
  useEffect(() => {
    if (!token || !id) return undefined;

    const handleMeasure = (measure: BackendVitalMeasure) => {
      if (measure.paciente_id !== id) return;

      setPatient((currentPatient) => {
        if (!currentPatient) return currentPatient;
        const result = patientService.applyVitalMeasure([currentPatient], measure);
        return result.patients[0] ?? currentPatient;
      });
    };

    const handleAlert = (alert: BackendAlertWs) => {
      if (alert.paciente_id !== id) return;

      setPatient((currentPatient) => {
        if (!currentPatient) return currentPatient;

        const event = alertWsToEvent(alert);
        const result = patientService.applyAlert([currentPatient], alert);
        const updatedPatient = result.patients[0] ?? currentPatient;

        // Garantir que o evento do alerta está no topo do histórico
        const hasEvent = updatedPatient.events.some((e) => e.id === event.id);
        if (!hasEvent) {
          return {
            ...updatedPatient,
            events: [event, ...updatedPatient.events.slice(0, 9)],
          };
        }

        return updatedPatient;
      });
    };

    const socket = connectVitalsSocket(token, handleMeasure, (message) => setError(`Tempo real indisponivel: ${message}`), handleAlert);
    return () => {
      socket.disconnect();
    };
  }, [id, token]);

  const handleShareAccess = async () => {
    const email = window.prompt("Digite o e-mail para compartilhar o acesso:");
    if (!email) return;

    setIsSharing(true);
    setShareMessage({ text: '', type: '' });
    try {
      const response = await patientService.shareAccess(email);
      setShareMessage({ text: response.message || 'Acesso compartilhado com sucesso!', type: 'success' });
    } catch (err: any) {
      setShareMessage({ text: err.message || 'Erro ao compartilhar acesso.', type: 'error' });
    } finally {
      setIsSharing(false);
    }
  };

  if (loading) {
    return (
      <div className="page-shell">
        <BackToDashboard />
        <section className="panel p-6 text-sm font-bold text-vital-muted">Carregando paciente...</section>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="page-shell">
        <BackToDashboard />
        <section className="panel p-6 text-sm font-bold text-vital-muted">{error || 'Paciente nao encontrado.'}</section>
      </div>
    );
  }

  const meta = statusMeta[patient.status];
  const chartData = patient.chartData.length > 0 ? patient.chartData : emptyChartData;
  const bpm = patient.bpm === null ? 'Aguardando' : `${patient.bpm} BPM`;
  const spo2 = patient.spo2 === null ? 'Aguardando' : `${patient.spo2}%`;

  return (
    <div className="page-shell">
      <div className="flex flex-col gap-3">
        <BackToDashboard />
        <div>
          <h2 className="text-3xl font-black tracking-normal text-vital-text sm:text-4xl">Detalhes do Paciente</h2>
          <p className="mt-2 text-base font-semibold text-vital-muted">
            {patient.room} - {patient.updatedAt}
          </p>
        </div>
      </div>

      {error ? (
        <section className="rounded-xl border border-vital-yellow/40 bg-vital-yellow/10 px-4 py-3 text-sm font-bold text-vital-text">
          {error}
        </section>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className={`panel border-t-4 ${meta.borderClass} p-6`}>
          <div className="flex flex-col items-center text-center">
            <div className={`grid h-24 w-24 place-items-center rounded-full text-4xl font-black ${meta.bgClass} ${meta.textClass}`}>
              {patient.name.charAt(0)}
            </div>
            <h3 className="mt-5 text-2xl font-black text-vital-text">{patient.name}</h3>
            <p className="mt-1 text-sm font-bold text-vital-muted">
              {patient.age === null ? 'Idade nao informada' : `${patient.age} anos`}
            </p>
            <span className={`mt-4 rounded-full px-4 py-2 text-sm font-black ${meta.bgClass} ${meta.textClass}`}>{meta.label}</span>
          </div>

          <div className="mt-7 grid gap-4">
            <VitalMetricCard icon={HeartPulse} label="Batimentos" value={bpm} helper="Leitura atual" tone="heart" />
            <VitalMetricCard icon={Activity} label="Oxigenacao" value={spo2} helper="SpO2" tone="oxygen" />
            <VitalMetricCard icon={UserRound} label="Pulseira" value={patient.braceletId} helper={patient.relativeEmail} tone="neutral" />
          </div>

          <button
            type="button"
            onClick={handleShareAccess}
            disabled={isSharing}
            className="mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-vital-blue px-5 text-sm font-black text-white shadow-lg shadow-vital-blue/25 transition hover:bg-blue-400 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vital-blue/60"
          >
            <Share2 size={19} strokeWidth={2.6} />
            {isSharing ? 'Enviando...' : 'Compartilhar Acesso'}
          </button>
          {shareMessage.text && (
            <p className={`mt-3 text-center text-sm font-bold ${shareMessage.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
              {shareMessage.text}
            </p>
          )}
        </aside>

        <section className="grid min-w-0 gap-6">
          <div className="grid min-w-0 gap-6 lg:grid-cols-2">
            <PatientChart title="Grafico de Batimentos" data={chartData} metric="bpm" color="#ff5168" suffix=" BPM" />
            <PatientChart title="Grafico de Oxigenacao" data={chartData} metric="spo2" color="#32c7ff" suffix="%" />
          </div>
          <EventHistory events={patient.events} />
        </section>
      </div>
    </div>
  );
}
