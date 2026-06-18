import { patients as fallbackPatients } from '../data/patients';
import type {
  BackendAlertRecente,
  BackendAlertWs,
  BackendVitalMeasure,
  Patient,
  PatientCardResponse,
  PatientEvent,
  RegisterPatientRequest,
  RegisterPatientResponse,
  VitalPoint,
} from '../types/vital';
import { apiRequest } from './api';

const PATIENT_CACHE_KEY = 'vitalwatch_registered_patients';

type CachedPatient = Partial<Patient> & { id: string };

const fallbackEvents: PatientEvent[] = [
  {
    id: 'evt-waiting',
    title: 'Aguardando primeiras leituras reais',
    time: 'Sem historico recente',
    tone: 'info',
  },
];

function getCachedPatients(): CachedPatient[] {
  const rawCache = window.localStorage.getItem(PATIENT_CACHE_KEY);
  if (!rawCache) return [];

  try {
    return JSON.parse(rawCache) as CachedPatient[];
  } catch {
    return [];
  }
}

function saveCachedPatients(patients: CachedPatient[]) {
  window.localStorage.setItem(PATIENT_CACHE_KEY, JSON.stringify(patients));
}

function mergeCachedPatient(patient: Patient) {
  const patients = getCachedPatients();
  const nextPatients = [patient, ...patients.filter((currentPatient) => currentPatient.id !== patient.id)];
  saveCachedPatients(nextPatients);
}

function formatHour(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Determina o status do paciente baseado nos sinais vitais e no alertLevel.
 *
 * Prioridade: alertLevel (vindo do ESP32 via backend) > cálculo local (fallback).
 */
export function getStatusFromVitals(
  bpm: number | null,
  spo2: number | null,
  alertLevel?: 1 | 2 | 3,
): Patient['status'] {
  // Se há alertLevel vindo do backend, usa ele como prioridade
  if (alertLevel !== undefined) {
    if (alertLevel === 3) return 'critical';
    if (alertLevel === 2) return 'attention';
    return 'normal';
  }

  // Fallback: cálculo local com thresholds hardcoded
  if (bpm === null || spo2 === null) return 'waiting';
  if (spo2 < 90 || bpm > 110 || bpm < 50) return 'critical';
  if (spo2 < 95 || bpm > 100 || bpm < 60) return 'attention';
  return 'normal';
}

function normalizePatient(
  id: string,
  card?: PatientCardResponse,
  cached?: CachedPatient,
  vitals?: Partial<Pick<Patient, 'bpm' | 'spo2' | 'chartData' | 'updatedAt'>>,
): Patient {
  const bpm = vitals?.bpm ?? cached?.bpm ?? null;
  const spo2 = vitals?.spo2 ?? cached?.spo2 ?? null;

  return {
    id,
    name: card?.nome || cached?.name || 'Paciente sem nome',
    age: card?.idade ?? cached?.age ?? null,
    status: getStatusFromVitals(bpm, spo2),
    bpm,
    spo2,
    braceletId: cached?.braceletId || 'Aguardando',
    cpf: cached?.cpf || 'Nao informado',
    relativeEmail: card?.email || cached?.relativeEmail || 'Nao informado',
    phone: cached?.phone || 'Nao informado',
    room: cached?.room || 'Sem leito definido',
    updatedAt: vitals?.updatedAt || cached?.updatedAt || 'Aguardando dados',
    chartData: vitals?.chartData || cached?.chartData || [],
    events: cached?.events || fallbackEvents,
  };
}

async function getPatientCard(id: string) {
  return apiRequest<PatientCardResponse>(`/infoPaciente/card/${id}`);
}

// ================================================
// Helpers de Alerta
// ================================================

/**
 * Gera um título legível em PT-BR para o alerta (no caso de alertas vindos do REST).
 */
function generateAlertTitleFromRecente(tipo: string, severidade: string): string {
  const titles: Record<string, string> = {
    heart_rate_very_low: 'Batimento cardíaco muito baixo',
    heart_rate_low: 'Batimento cardíaco baixo',
    heart_rate_normal: 'Batimento cardíaco normalizado',
    heart_rate_high: 'Batimento cardíaco elevado',
    heart_rate_very_high: 'Batimento cardíaco muito alto',
    spo2_very_low: 'Oxigenação crítica',
    spo2_low: 'Oxigenação baixa',
    spo2_normal: 'Oxigenação normalizada',
  };

  return titles[`${tipo}_${severidade}`] || `Alerta: ${tipo} (${severidade})`;
}

/**
 * Converte nível de alerta para o tone do EventHistory.
 */
function alertLevelToTone(nivel: number): PatientEvent['tone'] {
  if (nivel === 3) return 'danger';
  if (nivel === 2) return 'info';
  return 'success';
}

/**
 * Converte um alerta bruto do REST em PatientEvent para o EventHistory.
 */
export function alertRecenteToEvent(alerta: BackendAlertRecente): PatientEvent {
  return {
    id: `alert-${alerta.time}-${alerta.tipo}`,
    title: generateAlertTitleFromRecente(alerta.tipo, alerta.severidade),
    time: formatHour(alerta.time),
    tone: alertLevelToTone(alerta.nivel),
  };
}

/**
 * Converte um alerta WebSocket em PatientEvent para o EventHistory.
 */
export function alertWsToEvent(alerta: BackendAlertWs): PatientEvent {
  return {
    id: `alert-${alerta.criado_em}-${alerta.tipo}`,
    title: alerta.titulo,
    time: formatHour(alerta.criado_em),
    tone: alertLevelToTone(alerta.alertLevel),
  };
}

// ================================================
// Patient Service
// ================================================

export const patientService = {
  async createPatient(payload: RegisterPatientRequest) {
    const response = await apiRequest<RegisterPatientResponse>('/auth/pacienteRegistro', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const profile = response.paciente.perfil;
    const patient = normalizePatient(
      response.paciente.id,
      {
        nome: profile.nome ?? payload.nome,
        idade: profile.idade ?? (Number(payload.idade) || null),
        email: response.paciente.email,
      },
      {
        id: response.paciente.id,
        cpf: profile.cpf ?? payload.cpf ?? 'Nao informado',
        phone: profile.telefone ?? payload.telefone ?? 'Nao informado',
        braceletId: profile.id_micro ?? payload.id_micro ?? 'Aguardando',
        relativeEmail: response.paciente.email,
      },
    );

    mergeCachedPatient(patient);
    return { response, patient };
  },

  async getPatients() {
    const cachedPatients = getCachedPatients();

    if (cachedPatients.length === 0) {
      // O backend ainda nao possui rota de listagem de pacientes; estes mocks ficam isolados aqui.
      return fallbackPatients;
    }

    const realPatients = await Promise.all(
      cachedPatients.map(async (cachedPatient) => {
        try {
          const card = await getPatientCard(cachedPatient.id);
          return normalizePatient(cachedPatient.id, card, cachedPatient);
        } catch {
          return normalizePatient(cachedPatient.id, undefined, cachedPatient);
        }
      }),
    );

    return realPatients;
  },

  async getPatientById(id: string) {
    const cachedPatient = getCachedPatients().find((patient) => patient.id === id);
    const fallbackPatient = fallbackPatients.find((patient) => patient.id === id);

    try {
      const card = await getPatientCard(id);
      return normalizePatient(id, card, cachedPatient ?? fallbackPatient);
    } catch {
      return cachedPatient ? normalizePatient(id, undefined, cachedPatient) : fallbackPatient ?? null;
    }
  },

  async getPatientFromRealtimeId(id: string) {
    const cachedPatient = getCachedPatients().find((patient) => patient.id === id);

    try {
      const card = await getPatientCard(id);
      const patient = normalizePatient(id, card, cachedPatient);
      mergeCachedPatient(patient);
      return patient;
    } catch {
      return cachedPatient ? normalizePatient(id, undefined, cachedPatient) : null;
    }
  },

  applyVitalMeasure(patients: Patient[], measure: BackendVitalMeasure) {
    const measuredAt = formatHour(measure.time);
    let foundPatient = false;

    const nextPatients = patients.map((patient) => {
      if (patient.id !== measure.paciente_id) return patient;
      foundPatient = true;

      const chartPoint: VitalPoint = {
        time: measuredAt,
        bpm: measure.batimentos,
        spo2: measure.oxigenacao,
      };

      const nextPatient = {
        ...patient,
        bpm: measure.batimentos,
        spo2: measure.oxigenacao,
        status: getStatusFromVitals(measure.batimentos, measure.oxigenacao, measure.alertLevel),
        updatedAt: 'Atualizado agora',
        chartData: [...patient.chartData.slice(-6), chartPoint],
        events: [
          {
            id: `${measure.paciente_id}-${measure.time}`,
            title: 'Nova leitura recebida',
            time: measuredAt,
            tone: 'info' as const,
          },
          ...patient.events.slice(0, 4),
        ],
      };

      mergeCachedPatient(nextPatient);
      return nextPatient;
    });

    return { patients: nextPatients, foundPatient };
  },

  /**
   * Aplica um alerta WebSocket ao array de pacientes.
   * Atualiza o status do card e adiciona o evento ao histórico.
   */
  applyAlert(patients: Patient[], alert: BackendAlertWs) {
    let foundPatient = false;

    const nextPatients = patients.map((patient) => {
      if (patient.id !== alert.paciente_id) return patient;
      foundPatient = true;

      const event = alertWsToEvent(alert);
      const newStatus = getStatusFromVitals(patient.bpm, patient.spo2, alert.alertLevel);

      const nextPatient = {
        ...patient,
        status: newStatus,
        events: [event, ...patient.events.slice(0, 9)],
      };

      mergeCachedPatient(nextPatient);
      return nextPatient;
    });

    return { patients: nextPatients, foundPatient };
  },

  /**
   * Busca alertas recentes (últimas 2h) de um paciente via REST.
   */
  async getAlertasRecentes(pacienteId: string) {
    return apiRequest<BackendAlertRecente[]>(`/alertas/recentes/${pacienteId}`);
  },

  async shareAccess(emailDestino: string) {
    return apiRequest<{ message: string }>('/infoPaciente/compartilharAcesso', {
      method: 'POST',
      body: JSON.stringify({ emailDestino }),
    });
  },
};
