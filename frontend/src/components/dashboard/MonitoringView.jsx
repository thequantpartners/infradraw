import { useEffect, useRef, useState } from 'react';
import { Panel } from '../DashboardWidgets.jsx';

/* ============================================================
   Mini-iconos locales de recursos (stroke = currentColor).
   ============================================================ */
const G = {
  cpu: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="7" y="7" width="10" height="10" rx="2" />
      <path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" />
    </svg>
  ),
  memory: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="3" y="7" width="18" height="10" rx="2" />
      <path d="M7 7V5M12 7V5M17 7V5M7 21v-2M12 21v-2M17 21v-2" />
    </svg>
  ),
  disk: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="2.5" /><path d="m15.5 8.5-2.6 2.6" />
    </svg>
  ),
  net: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M5 12.5a7 7 0 0 1 14 0M2 9a11 11 0 0 1 20 0M8.5 16a3.5 3.5 0 0 1 7 0" />
      <circle cx="12" cy="20" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  ),
};

const ACCENT = {
  blue: { text: 'text-blue', bg: 'bg-blue/12', bar: 'bg-blue' },
  cyan: { text: 'text-cyan', bg: 'bg-cyan/12', bar: 'bg-cyan' },
  purple: { text: 'text-purple', bg: 'bg-purple/12', bar: 'bg-purple' },
  emerald: { text: 'text-emerald', bg: 'bg-emerald/12', bar: 'bg-emerald' },
};

const LEVELS = {
  info: 'text-muted',
  ok: 'text-emerald',
  warn: 'text-amber-400',
  err: 'text-danger',
};

const STATUS = {
  ok: { dot: 'bg-emerald', text: 'text-emerald', label: 'OK' },
  warn: { dot: 'bg-amber-400', text: 'text-amber-400', label: 'Aviso' },
  info: { dot: 'bg-blue', text: 'text-blue', label: 'Info' },
  err: { dot: 'bg-danger', text: 'text-danger', label: 'Error' },
};

/* ============================================================
   Helpers de datos simulados (mock / random walk acotado).
   ============================================================ */
function clampWalk(v, min, max) {
  const next = v + (Math.random() - 0.5) * 16;
  return Math.max(min, Math.min(max, next));
}
function seedHist(n, base) {
  return Array.from({ length: n }, (_, i) =>
    Math.max(8, Math.min(95, base + Math.sin(i / 2.2) * 16 + (Math.random() - 0.5) * 14))
  );
}
const NOW = () => new Date().toLocaleTimeString('es-ES', { hour12: false });

const LOG_POOL = [
  { level: 'ok', msg: '✓ Healthcheck OK — api-gateway respondió en 38ms' },
  { level: 'info', msg: '→ Redis: 1.2k ops/s · hit ratio 98.7%' },
  { level: 'info', msg: '→ PostgreSQL: 14 conexiones activas · 0 locks' },
  { level: 'warn', msg: '⚠ CPU de worker-2 supera el 80% durante 30s' },
  { level: 'ok', msg: '✓ Deploy v2.4.1 propagado a 3/3 réplicas' },
  { level: 'info', msg: '→ Autoscaler: réplicas 3 → 4 (carga ↑)' },
  { level: 'err', msg: '✗ Timeout en webhook lemonsqueezy — reintentando' },
  { level: 'ok', msg: '✓ Backup incremental completado (412 MB)' },
  { level: 'info', msg: '→ TLS renovado para *.infradraw.app' },
];
const randomLog = () => ({ t: NOW(), ...LOG_POOL[Math.floor(Math.random() * LOG_POOL.length)] });

const INITIAL_LOGS = [
  { t: '12:40:02', level: 'info', msg: '→ Iniciando monitor de infraestructura…' },
  { t: '12:40:03', level: 'ok', msg: '✓ Conectado a 5 servicios · 3 réplicas activas' },
  { t: '12:40:06', level: 'info', msg: '→ PostgreSQL: 14 conexiones · 0 locks' },
  { t: '12:40:09', level: 'ok', msg: '✓ Healthcheck api-gateway OK (38ms)' },
];

const EVENTS = [
  { time: '12:48', service: 'api-gateway', event: 'Despliegue completado en producción', status: 'ok' },
  { time: '12:31', service: 'worker-2', event: 'Pico de CPU sostenido (84%)', status: 'warn' },
  { time: '11:59', service: 'postgres', event: 'Vacuum automático ejecutado', status: 'info' },
  { time: '11:20', service: 'redis', event: 'Failover a réplica de lectura', status: 'warn' },
  { time: '10:45', service: 'telegram-bot', event: 'Alerta enviada al operador', status: 'ok' },
  { time: '09:12', service: 'ci-runner', event: 'Pipeline #482 finalizó en verde', status: 'ok' },
];

/* ============================================================
   Subcomponentes
   ============================================================ */
function MeterCard({ icon: Glyph, label, value, unit = '%', accent = 'blue', sub }) {
  const a = ACCENT[accent];
  return (
    <div className="rounded-2xl border border-border bg-surface/60 p-5 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-border2 max-md:p-4">
      <div className="flex items-center justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${a.bg} ${a.text}`}>
          <Glyph className="h-5 w-5" />
        </div>
        <span className="text-[24px] font-extrabold tabular-nums tracking-[-.5px] text-text">
          {Math.round(value)}
          <span className="ml-0.5 text-[13px] font-bold text-muted">{unit}</span>
        </span>
      </div>
      <div className="mt-3 text-[13px] font-bold text-text">{label}</div>
      {sub && <div className="mt-0.5 text-[11px] text-dim">{sub}</div>}
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface2">
        <div
          className={`h-full rounded-full ${a.bar} transition-[width] duration-700 ease-out`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}

function HistoryBars({ data, accent = 'blue' }) {
  const a = ACCENT[accent];
  const max = Math.max(...data, 100);
  return (
    <div className="flex h-[120px] items-end gap-[3px]">
      {data.map((v, i) => (
        <div
          key={i}
          className={`flex-1 rounded-sm ${a.bar} opacity-75 transition-[height] duration-500 ease-out`}
          style={{ height: `${Math.max(4, (v / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

function Terminal({ lines, scrollRef }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-[#05080f]">
      <div className="flex items-center gap-1.5 border-b border-border/70 px-4 py-2.5">
        <span className="h-3 w-3 rounded-full bg-danger/80" />
        <span className="h-3 w-3 rounded-full bg-amber-400/80" />
        <span className="h-3 w-3 rounded-full bg-emerald/80" />
        <span className="ml-2 font-mono text-[11px] font-semibold text-dim">infra-operator — live logs</span>
      </div>
      <div ref={scrollRef} className="max-h-[300px] overflow-y-auto px-4 py-3 font-mono text-[12px] leading-[1.75]">
        {lines.map((l, i) => (
          <div key={i} className="flex gap-3">
            <span className="shrink-0 text-dim">{l.t}</span>
            <span className={`min-w-0 break-words ${LEVELS[l.level]}`}>{l.msg}</span>
          </div>
        ))}
        <div className="flex gap-3">
          <span className="text-dim">{NOW()}</span>
          <span className="inline-block h-[14px] w-[7px] animate-pulse bg-blue" />
        </div>
      </div>
    </div>
  );
}

function EventsTable({ rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse text-left">
        <thead>
          <tr className="text-[11px] uppercase tracking-wider text-dim">
            <th className="pb-3 font-semibold">Hora</th>
            <th className="pb-3 font-semibold">Servicio</th>
            <th className="pb-3 font-semibold">Evento</th>
            <th className="pb-3 text-right font-semibold">Estado</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const s = STATUS[r.status] || STATUS.info;
            return (
              <tr key={i} className="border-t border-border/60 transition-colors hover:bg-surface2/40">
                <td className="py-3 pr-4 font-mono text-[12px] text-muted">{r.time}</td>
                <td className="py-3 pr-4 text-[13px] font-semibold text-text">{r.service}</td>
                <td className="py-3 pr-4 text-[13px] text-muted">{r.event}</td>
                <td className="py-3 text-right">
                  <span className={`inline-flex items-center gap-1.5 rounded-full bg-surface2 px-2.5 py-1 text-[11px] font-bold ${s.text}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                    {s.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-emerald/30 bg-emerald/10 px-3 py-1.5 text-[11px] font-bold text-emerald">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald" />
      </span>
      En vivo
    </span>
  );
}

/* ============================================================
   Vista de Monitoreo en tiempo real
   ============================================================ */
export default function MonitoringView() {
  const [m, setM] = useState({ cpu: 42, mem: 61, disk: 38, net: 27 });
  const [cpuHist, setCpuHist] = useState(() => seedHist(32, 42));
  const [memHist, setMemHist] = useState(() => seedHist(32, 61));
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const logRef = useRef(null);

  // Random walk de métricas cada 2s.
  useEffect(() => {
    const id = setInterval(() => {
      setM((p) => ({
        cpu: clampWalk(p.cpu, 14, 92),
        mem: clampWalk(p.mem, 30, 88),
        disk: clampWalk(p.disk, 10, 70),
        net: clampWalk(p.net, 5, 82),
      }));
    }, 2000);
    return () => clearInterval(id);
  }, []);

  // Empuja el último valor al histórico.
  useEffect(() => {
    setCpuHist((h) => [...h.slice(1), m.cpu]);
    setMemHist((h) => [...h.slice(1), m.mem]);
  }, [m]);

  // Logs entrantes simulados.
  useEffect(() => {
    const id = setInterval(() => {
      setLogs((prev) => [...prev, randomLog()].slice(-40));
    }, 3500);
    return () => clearInterval(id);
  }, []);

  // Autoscroll de la terminal.
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs]);

  return (
    <div className="flex animate-fadeIn flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-extrabold tracking-[-.5px] text-text max-md:text-[18px]">
            Monitoreo en tiempo real
          </h1>
          <p className="mt-0.5 text-[13px] text-muted">Métricas de tus recursos, actualizadas cada 2&nbsp;segundos.</p>
        </div>
        <LiveBadge />
      </header>

      {/* Medidores de recursos */}
      <section className="grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1 max-md:gap-3">
        <MeterCard icon={G.cpu} label="CPU" value={m.cpu} accent="blue" sub="8 vCPU · clúster prod" />
        <MeterCard icon={G.memory} label="Memoria" value={m.mem} accent="purple" sub="16 GB asignados" />
        <MeterCard icon={G.disk} label="Disco I/O" value={m.disk} accent="cyan" sub="SSD NVMe · 512 GB" />
        <MeterCard icon={G.net} label="Red" value={m.net} unit="%" accent="emerald" sub="≈ 1.2 Gbps salida" />
      </section>

      {/* Gráficos + terminal */}
      <section className="grid grid-cols-[1.4fr_1fr] gap-5 max-lg:grid-cols-1">
        <div className="flex flex-col gap-5">
          <Panel
            title="Uso de CPU"
            action={<span className="font-mono text-[12px] font-bold tabular-nums text-blue">{Math.round(m.cpu)}%</span>}
          >
            <HistoryBars data={cpuHist} accent="blue" />
            <div className="mt-2 flex justify-between text-[10px] text-dim">
              <span>-60s</span><span>ahora</span>
            </div>
          </Panel>

          <Panel
            title="Uso de memoria"
            action={<span className="font-mono text-[12px] font-bold tabular-nums text-purple">{Math.round(m.mem)}%</span>}
          >
            <HistoryBars data={memHist} accent="purple" />
            <div className="mt-2 flex justify-between text-[10px] text-dim">
              <span>-60s</span><span>ahora</span>
            </div>
          </Panel>
        </div>

        <Panel title="Consola en vivo" action={<LiveBadge />}>
          <Terminal lines={logs} scrollRef={logRef} />
        </Panel>
      </section>

      {/* Tabla de eventos */}
      <Panel title="Eventos recientes">
        <EventsTable rows={EVENTS} />
      </Panel>
    </div>
  );
}
