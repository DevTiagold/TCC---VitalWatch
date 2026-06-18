import { Activity, ArrowLeft, CheckCircle, ChevronDown, ChevronRight, Settings, Wifi } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  DEFAULT_CONFIG,
  deviceConfigService,
  type DeviceConfig,
  type SamplingConfig,
  type ThresholdsConfig,
  type WifiConfig,
} from '../services/deviceConfigService';
import { patientService } from '../services/patientService';

type SectionKey = 'wifi' | 'sampling' | 'thresholds';

interface PublishState {
  wifi: 'idle' | 'publishing' | 'ok' | 'error';
  sampling: 'idle' | 'publishing' | 'ok' | 'error';
  thresholds: 'idle' | 'publishing' | 'ok' | 'error';
}

// --------------- helpers ---------------

function SectionHeader({
  icon,
  title,
  subtitle,
  publishState,
  open,
  onToggle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  publishState: PublishState[SectionKey];
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between gap-4 p-5 text-left transition hover:bg-vital-card-soft/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vital-blue/60"
    >
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-vital-blue/10 text-vital-blue">
          {icon}
        </div>
        <div>
          <p className="text-sm font-black text-vital-text">{title}</p>
          <p className="text-xs font-semibold text-vital-muted">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {publishState === 'publishing' && (
          <span className="text-xs font-bold text-vital-blue">Publicando...</span>
        )}
        {publishState === 'ok' && (
          <span className="flex items-center gap-1 text-xs font-bold text-vital-green">
            <CheckCircle size={13} strokeWidth={2.5} />
            Publicado
          </span>
        )}
        {publishState === 'error' && (
          <span className="text-xs font-bold text-vital-red">Erro ao publicar</span>
        )}
        {open ? <ChevronDown size={16} className="text-vital-muted" /> : <ChevronRight size={16} className="text-vital-muted" />}
      </div>
    </button>
  );
}

function ConfigField({
  label,
  description,
  value,
  type = 'number',
  step,
  min,
  onChange,
  onCommit,
}: {
  label: string;
  description?: string;
  value: string | number;
  type?: 'text' | 'password' | 'number';
  step?: number;
  min?: number;
  onChange: (v: string) => void;
  onCommit: () => void;
}) {
  return (
    <div className="grid gap-1">
      <label className="text-xs font-black text-vital-muted uppercase tracking-wide">{label}</label>
      {description && <p className="text-[11px] text-vital-muted/70">{description}</p>}
      <input
        type={type}
        value={value}
        step={step}
        min={min}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onCommit}
        onKeyDown={(e) => e.key === 'Enter' && onCommit()}
        className="h-10 w-full rounded-xl border border-vital-border bg-vital-card-soft/50 px-3 text-sm font-bold text-vital-text outline-none transition focus:border-vital-blue focus:ring-2 focus:ring-vital-blue/20"
      />
    </div>
  );
}

// --------------- main page ---------------

export function DeviceConfigPage() {
  const { id } = useParams<{ id: string }>();
  const [patientName, setPatientName] = useState('');
  const [config, setConfig] = useState<DeviceConfig>(() =>
    id ? deviceConfigService.load(id) : structuredClone(DEFAULT_CONFIG),
  );
  const [publishState, setPublishState] = useState<PublishState>({
    wifi: 'idle',
    sampling: 'idle',
    thresholds: 'idle',
  });
  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    wifi: true,
    sampling: true,
    thresholds: true,
  });

  const publishTimers = useRef<Record<SectionKey, ReturnType<typeof setTimeout> | null>>({
    wifi: null,
    sampling: null,
    thresholds: null,
  });

  useEffect(() => {
    if (!id) return;
    patientService.getPatientById(id).then((p) => {
      if (p) setPatientName(p.name);
    });
  }, [id]);

  const toggleSection = (section: SectionKey) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const setPublishResult = useCallback((section: SectionKey, result: 'ok' | 'error') => {
    setPublishState((prev) => ({ ...prev, [section]: result }));
    if (publishTimers.current[section]) clearTimeout(publishTimers.current[section]!);
    publishTimers.current[section] = setTimeout(() => {
      setPublishState((prev) => ({ ...prev, [section]: 'idle' }));
    }, 3000);
  }, []);

  const publishSection = useCallback(
    async (section: SectionKey) => {
      if (!id) return;
      deviceConfigService.save(id, config);
      setPublishState((prev) => ({ ...prev, [section]: 'publishing' }));
      try {
        await deviceConfigService.publish(id, section, config[section]);
        setPublishResult(section, 'ok');
      } catch {
        setPublishResult(section, 'error');
      }
    },
    [id, config, setPublishResult],
  );

  // ---- wifi helpers ----
  const setWifi = <K extends keyof WifiConfig>(key: K, value: string) => {
    setConfig((prev) => ({ ...prev, wifi: { ...prev.wifi, [key]: value } }));
  };

  // ---- sampling helpers ----
  const setSampling = <K extends keyof SamplingConfig>(key: K, value: string) => {
    setConfig((prev) => ({
      ...prev,
      sampling: { ...prev.sampling, [key]: Number(value) },
    }));
  };

  // ---- thresholds helpers ----
  const setThreshold = <K extends keyof ThresholdsConfig>(key: K, value: string) => {
    setConfig((prev) => ({
      ...prev,
      thresholds: { ...prev.thresholds, [key]: Number(value) },
    }));
  };

  const t = config.thresholds;
  const s = config.sampling;
  const w = config.wifi;

  return (
    <div className="page-shell">
      {/* header */}
      <div className="flex flex-col gap-3">
        <Link
          to={`/paciente/${id}`}
          className="inline-flex items-center gap-2 text-sm font-bold text-vital-muted transition hover:text-vital-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vital-blue/60"
        >
          <ArrowLeft size={18} strokeWidth={2.4} />
          Voltar ao paciente
        </Link>
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-vital-blue/10 text-vital-blue">
            <Settings size={20} strokeWidth={2.4} />
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-normal text-vital-text">Configurações do Dispositivo</h2>
            {patientName && (
              <p className="mt-1 text-sm font-semibold text-vital-muted">{patientName}</p>
            )}
          </div>
        </div>
        <p className="text-sm font-semibold text-vital-muted">
          Edite um campo e pressione <kbd className="rounded bg-vital-card-soft px-1.5 py-0.5 text-xs font-black">Enter</kbd> ou clique fora para enviar ao dispositivo via MQTT.
        </p>
      </div>

      {/* WiFi */}
      <div className="panel overflow-hidden">
        <SectionHeader
          icon={<Wifi size={18} strokeWidth={2.4} />}
          title="Configuração de Wi-Fi"
          subtitle="SSID e senha da rede do dispositivo"
          publishState={publishState.wifi}
          open={openSections.wifi}
          onToggle={() => toggleSection('wifi')}
        />
        {openSections.wifi && (
          <div className="grid gap-4 border-t border-vital-border px-5 pb-5 pt-4 sm:grid-cols-2">
            <ConfigField
              label="SSID"
              description="Nome da rede Wi-Fi"
              value={w.ssid}
              type="text"
              onChange={(v) => setWifi('ssid', v)}
              onCommit={() => publishSection('wifi')}
            />
            <ConfigField
              label="Senha"
              description="Senha da rede Wi-Fi"
              value={w.password}
              type="password"
              onChange={(v) => setWifi('password', v)}
              onCommit={() => publishSection('wifi')}
            />
          </div>
        )}
      </div>

      {/* Sampling */}
      <div className="panel overflow-hidden">
        <SectionHeader
          icon={<Activity size={18} strokeWidth={2.4} />}
          title="Intervalos de Medição"
          subtitle="Frequência de leitura e publicação do sensor"
          publishState={publishState.sampling}
          open={openSections.sampling}
          onToggle={() => toggleSection('sampling')}
        />
        {openSections.sampling && (
          <div className="border-t border-vital-border px-5 pb-5 pt-4">
            <ConfigField
              label="Intervalo de Leitura (ms)"
              description="Tempo entre leituras do sensor MAX30102"
              value={s.sampling_interval_ms}
              min={100}
              step={100}
              onChange={(v) => setSampling('sampling_interval_ms', v)}
              onCommit={() => publishSection('sampling')}
            />
          </div>
        )}
      </div>

      {/* Thresholds */}
      <div className="panel overflow-hidden">
        <SectionHeader
          icon={<Activity size={18} strokeWidth={2.4} />}
          title="Limiares de Alerta"
          subtitle="Limites para disparo de alertas de FC e SpO2"
          publishState={publishState.thresholds}
          open={openSections.thresholds}
          onToggle={() => toggleSection('thresholds')}
        />
        {openSections.thresholds && (
          <div className="flex flex-col gap-6 border-t border-vital-border px-5 pb-5 pt-4">

            {/* FC Repouso */}
            <div>
              <p className="mb-3 text-xs font-black uppercase tracking-widest text-vital-muted">
                Frequência Cardíaca — Repouso (BPM)
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <ConfigField
                  label="Muito Baixo"
                  value={t.hr_very_low}
                  min={0}
                  onChange={(v) => setThreshold('hr_very_low', v)}
                  onCommit={() => publishSection('thresholds')}
                />
                <ConfigField
                  label="Baixo"
                  value={t.hr_low}
                  min={0}
                  onChange={(v) => setThreshold('hr_low', v)}
                  onCommit={() => publishSection('thresholds')}
                />
                <ConfigField
                  label="Alto"
                  value={t.hr_high}
                  min={0}
                  onChange={(v) => setThreshold('hr_high', v)}
                  onCommit={() => publishSection('thresholds')}
                />
                <ConfigField
                  label="Muito Alto"
                  value={t.hr_very_high}
                  min={0}
                  onChange={(v) => setThreshold('hr_very_high', v)}
                  onCommit={() => publishSection('thresholds')}
                />
              </div>
            </div>

            {/* FC Correndo */}
            <div>
              <p className="mb-3 text-xs font-black uppercase tracking-widest text-vital-muted">
                Frequência Cardíaca — Em Movimento (BPM)
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <ConfigField
                  label="Muito Baixo"
                  value={t.hr_running_very_low}
                  min={0}
                  onChange={(v) => setThreshold('hr_running_very_low', v)}
                  onCommit={() => publishSection('thresholds')}
                />
                <ConfigField
                  label="Baixo"
                  value={t.hr_running_low}
                  min={0}
                  onChange={(v) => setThreshold('hr_running_low', v)}
                  onCommit={() => publishSection('thresholds')}
                />
                <ConfigField
                  label="Alto"
                  value={t.hr_running_high}
                  min={0}
                  onChange={(v) => setThreshold('hr_running_high', v)}
                  onCommit={() => publishSection('thresholds')}
                />
                <ConfigField
                  label="Muito Alto"
                  value={t.hr_running_very_high}
                  min={0}
                  onChange={(v) => setThreshold('hr_running_very_high', v)}
                  onCommit={() => publishSection('thresholds')}
                />
              </div>
            </div>

            {/* SpO2 */}
            <div>
              <p className="mb-3 text-xs font-black uppercase tracking-widest text-vital-muted">
                Saturação de Oxigênio — SpO2 (%)
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                <ConfigField
                  label="Muito Baixo"
                  value={t.spo2_very_low}
                  min={0}
                  onChange={(v) => setThreshold('spo2_very_low', v)}
                  onCommit={() => publishSection('thresholds')}
                />
                <ConfigField
                  label="Baixo"
                  value={t.spo2_low}
                  min={0}
                  onChange={(v) => setThreshold('spo2_low', v)}
                  onCommit={() => publishSection('thresholds')}
                />
                <ConfigField
                  label="Normal (máx)"
                  value={t.spo2_normal}
                  min={0}
                  onChange={(v) => setThreshold('spo2_normal', v)}
                  onCommit={() => publishSection('thresholds')}
                />
              </div>
            </div>

            {/* Movimento */}
            <div>
              <p className="mb-3 text-xs font-black uppercase tracking-widest text-vital-muted">
                Detecção de Movimento (MPU-6050)
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                <ConfigField
                  label="Limiar de Movimento (g)"
                  description="Aceleração mínima para detectar movimento"
                  value={t.motion_threshold}
                  step={0.1}
                  min={0}
                  onChange={(v) => setThreshold('motion_threshold', v)}
                  onCommit={() => publishSection('thresholds')}
                />
                <ConfigField
                  label="Intervalo Mínimo (ms)"
                  description="Mínimo entre detecções de movimento"
                  value={t.motion_min_interval_ms}
                  min={0}
                  step={50}
                  onChange={(v) => setThreshold('motion_min_interval_ms', v)}
                  onCommit={() => publishSection('thresholds')}
                />
                <ConfigField
                  label="Intervalo Máximo (ms)"
                  description="Máximo para considerar ainda em movimento"
                  value={t.motion_max_interval_ms}
                  min={0}
                  step={50}
                  onChange={(v) => setThreshold('motion_max_interval_ms', v)}
                  onCommit={() => publishSection('thresholds')}
                />
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
