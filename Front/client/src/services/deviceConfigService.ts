import { apiRequest } from './api';

export interface WifiConfig {
  ssid: string;
  password: string;
}

export interface SamplingConfig {
  sampling_interval_ms: number;
}

export interface ThresholdsConfig {
  hr_very_low: number;
  hr_low: number;
  hr_high: number;
  hr_very_high: number;
  hr_running_very_low: number;
  hr_running_low: number;
  hr_running_high: number;
  hr_running_very_high: number;
  spo2_very_low: number;
  spo2_low: number;
  spo2_normal: number;
  motion_threshold: number;
  motion_min_interval_ms: number;
  motion_max_interval_ms: number;
}

export interface DeviceConfig {
  wifi: WifiConfig;
  sampling: SamplingConfig;
  thresholds: ThresholdsConfig;
}

export const DEFAULT_CONFIG: DeviceConfig = {
  wifi: {
    ssid: '',
    password: '',
  },
  sampling: {
    sampling_interval_ms: 1000,
  },
  thresholds: {
    hr_very_low: 40,
    hr_low: 50,
    hr_high: 130,
    hr_very_high: 160,
    hr_running_very_low: 100,
    hr_running_low: 110,
    hr_running_high: 170,
    hr_running_very_high: 200,
    spo2_very_low: 90,
    spo2_low: 94,
    spo2_normal: 100,
    motion_threshold: 1.5,
    motion_min_interval_ms: 200,
    motion_max_interval_ms: 800,
  },
};

function storageKey(patientId: string) {
  return `vitalwatch_device_config_${patientId}`;
}

function deepMerge<T extends object>(defaults: T, stored: Partial<T>): T {
  const result = { ...defaults };
  for (const key of Object.keys(defaults) as (keyof T)[]) {
    if (key in stored && stored[key] !== undefined) {
      result[key] = stored[key] as T[keyof T];
    }
  }
  return result;
}

export const deviceConfigService = {
  load(patientId: string): DeviceConfig {
    try {
      const raw = window.localStorage.getItem(storageKey(patientId));
      if (!raw) return structuredClone(DEFAULT_CONFIG);
      const stored = JSON.parse(raw) as Partial<DeviceConfig>;
      return {
        wifi: deepMerge(DEFAULT_CONFIG.wifi, stored.wifi ?? {}),
        sampling: deepMerge(DEFAULT_CONFIG.sampling, stored.sampling ?? {}),
        thresholds: deepMerge(DEFAULT_CONFIG.thresholds, stored.thresholds ?? {}),
      };
    } catch {
      return structuredClone(DEFAULT_CONFIG);
    }
  },

  save(patientId: string, config: DeviceConfig) {
    window.localStorage.setItem(storageKey(patientId), JSON.stringify(config));
  },

  async publish(patientId: string, configType: 'wifi' | 'sampling' | 'thresholds', payload: object) {
    return apiRequest<{ message: string; topic: string }>(
      `/device/${patientId}/config/${configType}`,
      { method: 'POST', body: JSON.stringify(payload) },
    );
  },

  async sendCommand(patientId: string, command: 'START' | 'STOP' | 'REBOOT') {
    return apiRequest<{ message: string; topic: string }>(
      `/device/${patientId}/command`,
      { method: 'POST', body: JSON.stringify({ command }) },
    );
  },
};
