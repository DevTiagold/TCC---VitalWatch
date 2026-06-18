export type PatientStatus = 'normal' | 'attention' | 'critical' | 'waiting';

export interface VitalPoint {
  time: string;
  bpm: number;
  spo2: number;
}

export interface PatientEvent {
  id: string;
  title: string;
  time: string;
  tone: 'danger' | 'success' | 'info';
}

export interface Patient {
  id: string;
  name: string;
  age: number | null;
  status: PatientStatus;
  bpm: number | null;
  spo2: number | null;
  braceletId: string;
  cpf: string;
  relativeEmail: string;
  phone: string;
  room: string;
  updatedAt: string;
  chartData: VitalPoint[];
  events: PatientEvent[];
}

export interface User {
  id: string;
  email: string;
  nome: string | null;
  role: 'paciente' | 'enfermeira' | string;
}

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

export interface RegisterPatientRequest {
  email: string;
  nome: string;
  idade?: number | string;
  cpf?: string;
  telefone?: string;
  id_micro?: string;
}

export interface BackendPatientProfile {
  paciente_id: string;
  enfermeira_id?: string | null;
  id_micro?: string | null;
  nome?: string | null;
  idade?: number | null;
  cpf?: string | null;
  telefone?: string | null;
}

export interface RegisterPatientResponse {
  message: string;
  paciente: {
    id: string;
    email: string;
    perfil: BackendPatientProfile;
  };
}

export interface PatientCardResponse {
  nome: string | null;
  idade: number | null;
  email: string;
}

export interface BackendVitalMeasure {
  paciente_id: string;
  batimentos: number;
  oxigenacao: number;
  time: string;
  alertLevel?: 1 | 2 | 3;
}

export interface BackendAlertRecente {
  time: string;
  paciente_id: string;
  tipo: string;
  severidade: string;
  nivel: 1 | 2 | 3;
}

export interface BackendAlertWs {
  paciente_id: string;
  alertLevel: 1 | 2 | 3;
  tipo: string;
  severidade: string;
  titulo: string;
  criado_em: string;
}

export interface BackendAlertHistorico {
  data_referencia: string;
  paciente_id: string;
  total_alertas: number;
  pior_nivel: number;
  alertas_criticos: number;
  alertas_atencao: number;
}

export interface HourlyAverageResponse {
  hora: string;
  media: number;
}
