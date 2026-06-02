import type { Patient, PatientEvent, PatientStatus, VitalPoint } from '../types/vital';

export type { Patient, PatientEvent, PatientStatus, VitalPoint } from '../types/vital';

export const statusMeta: Record<
  PatientStatus,
  {
    label: string;
    textClass: string;
    borderClass: string;
    bgClass: string;
    ringClass: string;
  }
> = {
  normal: {
    label: 'Normal',
    textClass: 'text-vital-green',
    borderClass: 'border-vital-green',
    bgClass: 'bg-vital-green/12',
    ringClass: 'ring-vital-green/30',
  },
  attention: {
    label: 'Atenção',
    textClass: 'text-vital-yellow',
    borderClass: 'border-vital-yellow',
    bgClass: 'bg-vital-yellow/12',
    ringClass: 'ring-vital-yellow/30',
  },
  critical: {
    label: 'Crítico',
    textClass: 'text-vital-red',
    borderClass: 'border-vital-red',
    bgClass: 'bg-vital-red/12',
    ringClass: 'ring-vital-red/30',
  },
  waiting: {
    label: 'Aguardando dados',
    textClass: 'text-vital-muted',
    borderClass: 'border-vital-border',
    bgClass: 'bg-vital-card-soft',
    ringClass: 'ring-vital-blue/20',
  },
};

const events: PatientEvent[] = [
  {
    id: 'evt-1',
    title: 'Batimentos elevados detectados',
    time: 'Há 8 minutos',
    tone: 'danger',
  },
  {
    id: 'evt-2',
    title: 'Oxigenação normalizada',
    time: 'Há 24 minutos',
    tone: 'success',
  },
  {
    id: 'evt-3',
    title: 'Monitoramento iniciado',
    time: 'Hoje, 08:10',
    tone: 'info',
  },
];

const baseChartData: VitalPoint[] = [
  { time: '08:00', bpm: 72, spo2: 98 },
  { time: '09:00', bpm: 78, spo2: 97 },
  { time: '10:00', bpm: 82, spo2: 96 },
  { time: '11:00', bpm: 76, spo2: 98 },
  { time: '12:00', bpm: 88, spo2: 95 },
  { time: '13:00', bpm: 81, spo2: 97 },
  { time: '14:00', bpm: 75, spo2: 98 },
];

const makeChartData = (bpm: number, spo2: number): VitalPoint[] =>
  baseChartData.map((point, index) => ({
    ...point,
    bpm: Math.max(55, Math.round((point.bpm + bpm) / 2 + (index % 2 === 0 ? -3 : 4))),
    spo2: Math.min(100, Math.max(82, Math.round((point.spo2 + spo2) / 2 + (index % 3 === 0 ? 1 : -1)))),
  }));

export const patients: Patient[] = [
  {
    id: 'maria-silva',
    name: 'Maria Silva',
    age: 65,
    status: 'normal',
    bpm: 75,
    spo2: 98,
    braceletId: 'VW-1001',
    cpf: '123.456.789-10',
    relativeEmail: 'familia.maria@email.com',
    phone: '(35) 99999-1001',
    room: 'Leito 204A',
    updatedAt: 'Atualizado agora',
    chartData: makeChartData(75, 98),
    events,
  },
  {
    id: 'joao-santos',
    name: 'João Santos',
    age: 58,
    status: 'attention',
    bpm: 92,
    spo2: 94,
    braceletId: 'VW-1002',
    cpf: '234.567.891-01',
    relativeEmail: 'familia.joao@email.com',
    phone: '(35) 99999-1002',
    room: 'Leito 112B',
    updatedAt: 'Há 1 minuto',
    chartData: makeChartData(92, 94),
    events,
  },
  {
    id: 'ana-costa',
    name: 'Ana Costa',
    age: 72,
    status: 'critical',
    bpm: 110,
    spo2: 88,
    braceletId: 'VW-1003',
    cpf: '345.678.912-02',
    relativeEmail: 'familia.ana@email.com',
    phone: '(35) 99999-1003',
    room: 'UTI 03',
    updatedAt: 'Há 30 segundos',
    chartData: makeChartData(110, 88),
    events,
  },
  {
    id: 'pedro-oliveira',
    name: 'Pedro Oliveira',
    age: 45,
    status: 'normal',
    bpm: 68,
    spo2: 99,
    braceletId: 'VW-1004',
    cpf: '456.789.123-03',
    relativeEmail: 'familia.pedro@email.com',
    phone: '(35) 99999-1004',
    room: 'Leito 309A',
    updatedAt: 'Há 2 minutos',
    chartData: makeChartData(68, 99),
    events,
  },
  {
    id: 'carla-mendes',
    name: 'Carla Mendes',
    age: 53,
    status: 'normal',
    bpm: 72,
    spo2: 97,
    braceletId: 'VW-1005',
    cpf: '567.891.234-04',
    relativeEmail: 'familia.carla@email.com',
    phone: '(35) 99999-1005',
    room: 'Leito 221C',
    updatedAt: 'Há 3 minutos',
    chartData: makeChartData(72, 97),
    events,
  },
  {
    id: 'roberto-lima',
    name: 'Roberto Lima',
    age: 67,
    status: 'attention',
    bpm: 95,
    spo2: 93,
    braceletId: 'VW-1006',
    cpf: '678.912.345-05',
    relativeEmail: 'familia.roberto@email.com',
    phone: '(35) 99999-1006',
    room: 'Leito 118A',
    updatedAt: 'Há 4 minutos',
    chartData: makeChartData(95, 93),
    events,
  },
];

export const patientSummary = patients.reduce(
  (summary, patient) => ({
    ...summary,
    [patient.status]: summary[patient.status] + 1,
  }),
  { normal: 0, attention: 0, critical: 0, waiting: 0 } satisfies Record<PatientStatus, number>,
);
