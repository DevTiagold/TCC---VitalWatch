import { io, type Socket } from 'socket.io-client';
import { API_BASE_URL } from './api';
import type { BackendVitalMeasure } from '../types/vital';

export function connectVitalsSocket(
  token: string,
  onMeasure: (measure: BackendVitalMeasure) => void,
  onConnectionError?: (message: string) => void,
): Socket {
  const socket = io(API_BASE_URL, {
    auth: { token },
  });

  socket.on('novaMedida', onMeasure);
  socket.on('connect_error', (error) => {
    onConnectionError?.(error.message);
  });

  return socket;
}
