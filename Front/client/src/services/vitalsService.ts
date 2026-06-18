import type { HourlyAverageResponse, VitalPoint } from '../types/vital';
import { apiRequest } from './api';

function formatHour(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export const vitalsService = {
  async getAuthenticatedPatientHourlyVitals(date?: string): Promise<VitalPoint[]> {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    const [heart, oxygen] = await Promise.all([
      apiRequest<HourlyAverageResponse[]>(`/medidas/mediaBatimentoHora${query}`),
      apiRequest<HourlyAverageResponse[]>(`/medidas/mediaOxigenacaoHora${query}`),
    ]);

    return heart.map((heartPoint, index) => ({
      time: formatHour(heartPoint.hora),
      bpm: heartPoint.media,
      spo2: oxygen[index]?.media ?? 0,
    }));
  },
};
