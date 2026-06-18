import { Activity, HeartPulse, Play, RotateCcw, Settings, Share2, Square, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { deviceConfigService } from '../services/deviceConfigService';
import { BackToDashboard } from '../components/BackToDashboard';
import { EventHistory } from '../components/EventHistory';
import { PatientChart } from '../components/PatientChart';
import { VitalMetricCard } from '../components/VitalMetricCard';
import { useAuth } from '../context/auth';
import { statusMeta } from '../data/patients';
import { patientService } from '../services/patientService';
import { connectVitalsSocket } from '../services/realtimeService';
import { vitalsService } from '../services/vitalsService';
import type { BackendVitalMeasure, Patient } from '../types/vital';

const emptyChartData = [{ time: 'Aguardando', bpm: 0, spo2: 0 }];

export function PatientDetailsPage() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [commandState, setCommandState] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle');

  const sendCommand = async (command: 'START' | 'STOP' | 'REBOOT') => {
    if (!id || commandState === 'sending') return;
    setCommandState('sending');
    try {
      await deviceConfigService.sendCommand(id, command);
      setCommandState('ok');
    } catch {
      setCommandState('error');
    } finally {
      setTimeout(() => setCommandState('idle'), 2500);
    }
  };

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

        setPatient(nextPatient);

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

    const socket = connectVitalsSocket(token, handleMeasure, (message) => setError(`Tempo real indisponivel: ${message}`));
    return () => {
      socket.disconnect();
    };
  }, [id, token]);

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

          <div className="mt-7 grid gap-3">
            <button
              type="button"
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-vital-blue px-5 text-sm font-black text-white shadow-lg shadow-vital-blue/25 transition hover:bg-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vital-blue/60"
            >
              <Share2 size={19} strokeWidth={2.6} />
              Compartilhar Acesso
            </button>
            <Link
              to={`/paciente/${patient.id}/configurar`}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-vital-border bg-vital-card-soft px-5 text-sm font-black text-vital-text transition hover:border-vital-blue/50 hover:text-vital-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vital-blue/60"
            >
              <Settings size={19} strokeWidth={2.4} />
              Configurar Dispositivo
            </Link>

            <div className="flex items-center gap-3 pt-1">
              <div className="h-px flex-1 bg-vital-border" />
              <span className="text-xs font-black uppercase tracking-widest text-vital-muted">Pulseira</span>
              <div className="h-px flex-1 bg-vital-border" />
            </div>

            {/* Feedback de comando */}
            {commandState === 'ok' && (
              <p className="text-center text-xs font-bold text-vital-green">Comando enviado para a pulseira</p>
            )}
            {commandState === 'error' && (
              <p className="text-center text-xs font-bold text-vital-red">Falha ao enviar comando</p>
            )}

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                disabled={commandState === 'sending'}
                onClick={() => sendCommand('START')}
                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-emerald-500/15 px-2 text-xs font-black text-emerald-400 transition hover:bg-emerald-500/25 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
              >
                <Play size={14} strokeWidth={2.6} />
                Iniciar
              </button>
              <button
                type="button"
                disabled={commandState === 'sending'}
                onClick={() => sendCommand('STOP')}
                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-vital-red/15 px-2 text-xs font-black text-vital-red transition hover:bg-vital-red/25 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vital-red/60"
              >
                <Square size={14} strokeWidth={2.6} />
                Parar
              </button>
              <button
                type="button"
                disabled={commandState === 'sending'}
                onClick={() => sendCommand('REBOOT')}
                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-vital-border bg-vital-card-soft px-2 text-xs font-black text-vital-muted transition hover:border-vital-blue/40 hover:text-vital-text disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vital-blue/60"
              >
                <RotateCcw size={14} strokeWidth={2.6} />
                Reiniciar
              </button>
            </div>
            <p className="text-center text-xs font-bold text-vital-muted">Controle remoto da pulseira de monitoramento</p>
          </div>
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
