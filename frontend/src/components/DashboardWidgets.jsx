import { useState } from 'react';

/* ============================================================
   Iconos inline (sin dependencias). stroke = currentColor.
   ============================================================ */
const I = {
  grid: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  folder: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  ),
  pulse: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M3 12h4l2 6 4-14 2 8h6" />
    </svg>
  ),
  spark: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
    </svg>
  ),
  gear: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.17V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 7.5 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 3 13.5a1.65 1.65 0 0 0-1.5-1H1a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 3 7.5a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 8.5 3 1.65 1.65 0 0 0 9.5 1.5V1a2 2 0 0 1 4 0v.09c0 .67.39 1.27 1 1.51.61.25 1.31.11 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 21 8.5c.24.61.84 1 1.51 1H22a2 2 0 0 1 0 4h-.09c-.67 0-1.27.39-1.51 1Z" />
    </svg>
  ),
  logout: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  ),
  search: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
    </svg>
  ),
  plus: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  bell: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  ),
  server: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="3" y="4" width="18" height="7" rx="2" /><rect x="3" y="13" width="18" height="7" rx="2" />
      <path d="M7 7.5h.01M7 16.5h.01" />
    </svg>
  ),
  coins: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <ellipse cx="12" cy="6" rx="8" ry="3" /><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
    </svg>
  ),
  shield: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M12 3 4 6v6c0 5 3.5 7.5 8 9 4.5-1.5 8-4 8-9V6z" /><path d="m9 12 2 2 4-4" />
    </svg>
  ),
  lock: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 1 1 8 0v4" />
    </svg>
  ),
  check: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
};

export const Icon = I;

/* ============================================================
   Sidebar — riel vertical en desktop, barra inferior en mobile.
   ============================================================ */
const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: 'grid' },
  { key: 'projects', label: 'Proyectos', icon: 'folder' },
  { key: 'monitoring', label: 'Monitoreo', icon: 'pulse' },
  { key: 'ai', label: 'Architect AI', icon: 'spark' },
  { key: 'settings', label: 'Ajustes', icon: 'gear' },
];

const OB_STEPS = [
  { key: 'plan', step: 1, label: 'Elige tu plan' },
  { key: 'gcloud', step: 2, label: 'Conecta Google Cloud' },
  { key: 'project', step: 3, label: 'Crea tu primer proyecto' },
  { key: 'telegram', step: 4, label: 'Configura Telegram' },
  { key: 'ai', step: 5, label: 'Genera estrategia IA' },
];

function OnboardingNavBtn({ item, status, onClick, mobile }) {
  const done = status === 'done';
  const active = status === 'active';
  const locked = status === 'locked';
  return (
    <button
      title={item.label + (done ? ' ✓' : locked ? ' (bloqueado)' : '')}
      onClick={() => !locked && onClick(item.key)}
      disabled={locked}
      className={[
        'group relative flex items-center justify-center rounded-xl transition-all duration-300',
        mobile ? 'h-11 w-11' : 'h-12 w-12',
        done
          ? 'bg-emerald/20 text-emerald ring-1 ring-emerald/30'
          : active
            ? 'bg-grad text-white shadow-glow animate-pulse'
            : 'border border-border/40 text-dim cursor-not-allowed opacity-40',
      ].join(' ')}
    >
      {done ? (
        <I.check className={mobile ? 'h-4 w-4' : 'h-5 w-5'} />
      ) : (
        <span className={['font-bold', mobile ? 'text-[13px]' : 'text-[14px]'].join(' ')}>
          {item.step}
        </span>
      )}
      {!mobile && (
        <span className="pointer-events-none absolute left-[58px] z-50 origin-left scale-90 whitespace-nowrap rounded-lg border border-border bg-surface2 px-2.5 py-1 text-[12px] font-semibold text-text opacity-0 shadow-card transition-all group-hover:scale-100 group-hover:opacity-100">
          {item.label}{done ? ' ✓' : locked ? ' 🔒' : ''}
        </span>
      )}
    </button>
  );
}

function NavButton({ item, active, onClick, mobile, locked }) {
  const Glyph = I[item.icon];
  return (
    <button
      title={locked ? item.label + ' (bloqueado)' : item.label}
      onClick={() => !locked && onClick(item.key)}
      disabled={locked}
      className={[
        'group relative flex items-center justify-center rounded-xl transition-all duration-200',
        mobile ? 'h-11 w-11' : 'h-12 w-12',
        locked
          ? 'text-dim/25 cursor-not-allowed'
          : active
            ? 'bg-grad text-white shadow-accent'
            : 'text-muted hover:bg-surface2 hover:text-text',
      ].join(' ')}
    >
      <Glyph className={mobile ? 'h-5 w-5' : 'h-[22px] w-[22px]'} />
      {locked && !mobile && (
        <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-surface2 text-dim">
          <I.lock className="h-2.5 w-2.5" />
        </span>
      )}
      {!mobile && (
        <span className="pointer-events-none absolute left-[58px] z-50 origin-left scale-90 whitespace-nowrap rounded-lg border border-border bg-surface2 px-2.5 py-1 text-[12px] font-semibold text-text opacity-0 shadow-card transition-all group-hover:scale-100 group-hover:opacity-100">
          {item.label}{locked ? ' 🔒' : ''}
        </span>
      )}
    </button>
  );
}

export function Sidebar({ active, onNavigate, onSignout, obState, obComplete, activeStep }) {
  const showOb = !obComplete;

  return (
    <>
      {/* Desktop rail */}
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-[76px] flex-col items-center justify-between border-r border-border bg-surface/60 py-5 backdrop-blur-xl md:flex">
        <div className="flex flex-col items-center gap-2">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-grad text-[18px] font-extrabold text-white shadow-glow">
            ID
          </div>

          {showOb ? (
            <>
              {/* Onboarding steps */}
              {OB_STEPS.map((item) => {
                var done = obState && obState.steps && obState.steps[item.key];
                var isActive = item.key === activeStep;
                var status = done ? 'done' : isActive ? 'active' : 'locked';
                return (
                  <OnboardingNavBtn key={item.key} item={item} status={status} onClick={onNavigate} />
                );
              })}

              {/* Separator */}
              <div className="my-1.5 h-px w-8 bg-border/50" />

              {/* Locked nav items */}
              {NAV.map((item) => (
                <NavButton key={item.key} item={item} active={false} onClick={onNavigate} locked />
              ))}
            </>
          ) : (
            NAV.map((item) => (
              <NavButton key={item.key} item={item} active={active === item.key} onClick={onNavigate} />
            ))
          )}
        </div>
        <button
          title="Cerrar sesión"
          onClick={onSignout}
          className="flex h-12 w-12 items-center justify-center rounded-xl text-muted transition-all hover:bg-danger/10 hover:text-danger"
        >
          <I.logout className="h-[22px] w-[22px]" />
        </button>
      </aside>

      {/* Mobile bottom bar */}
      <nav className="fixed bottom-0 left-0 z-30 flex w-full items-center justify-around border-t border-border bg-surface/90 px-2 py-2 backdrop-blur-xl md:hidden">
        {showOb ? (
          OB_STEPS.map((item) => {
            var done = obState && obState.steps && obState.steps[item.key];
            var isActive = item.key === activeStep;
            var status = done ? 'done' : isActive ? 'active' : 'locked';
            return (
              <OnboardingNavBtn key={item.key} item={item} status={status} onClick={onNavigate} mobile />
            );
          })
        ) : (
          <>
            {NAV.map((item) => (
              <NavButton key={item.key} item={item} active={active === item.key} onClick={onNavigate} mobile />
            ))}
            <NavButton item={{ key: 'logout', label: 'Salir', icon: 'logout' }} active={false} onClick={onSignout} mobile />
          </>
        )}
      </nav>
    </>
  );
}

/* ============================================================
   TopBar — saludo, buscador, badge de plan, CTA, usuario.
   ============================================================ */
export function TopBar({ session, plan, query, onQuery, creating, onCreate }) {
  return (
    <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-border bg-bg/70 px-7 py-4 backdrop-blur-xl max-md:px-4 max-md:py-3">
      <div className="min-w-0">
        <h1 className="truncate text-[20px] font-extrabold tracking-[-.5px] text-text max-md:text-[17px]">
          Hola, {(session.name || 'Operador').split(' ')[0]} 👋
        </h1>
        <p className="text-[12px] text-muted max-md:hidden">Aquí está el estado de tu infraestructura hoy.</p>
      </div>

      {/* Buscador (desktop) */}
      <div className="relative ml-auto hidden items-center md:flex">
        <I.search className="pointer-events-none absolute left-3 h-[18px] w-[18px] text-dim" />
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Buscar proyectos…"
          className="w-[220px] rounded-xl border border-border bg-surface px-3 py-2.5 pl-10 text-[13px] text-text outline-none transition-all placeholder:text-dim focus:w-[280px] focus:border-blue"
        />
      </div>

      <div className="ml-auto flex items-center gap-3 md:ml-0">
        <button className="relative hidden h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-muted transition-colors hover:text-text sm:flex">
          <I.bell className="h-[18px] w-[18px]" />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 animate-pulse rounded-full bg-blue" />
        </button>

        <span
          className={[
            'hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider sm:inline-flex',
            plan === 'pro'
              ? 'border border-blue/35 bg-blue/15 text-blue'
              : 'border border-muted/20 bg-muted/10 text-muted',
          ].join(' ')}
        >
          {plan === 'pro' ? '⭐ PRO' : 'FREE'}
        </span>

        <button
          onClick={onCreate}
          disabled={creating}
          className="inline-flex items-center gap-2 rounded-xl bg-grad px-4 py-2.5 text-[13px] font-bold text-white shadow-accent transition-all hover:-translate-y-px hover:shadow-accent-hover disabled:cursor-not-allowed disabled:opacity-60 max-md:px-3"
        >
          {creating ? (
            <span className="h-[14px] w-[14px] animate-spin-fast rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <I.plus className="h-4 w-4" />
          )}
          <span className="max-md:hidden">Nuevo proyecto</span>
        </button>

        {session.photo ? (
          <img src={session.photo} className="h-10 w-10 rounded-full border-2 border-border object-cover" alt="" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface2 text-[14px] font-bold text-muted">
            {(session.name || 'U')[0].toUpperCase()}
          </div>
        )}
      </div>
    </header>
  );
}

/* ============================================================
   StatCard — KPI con icono, valor, delta y sparkline.
   ============================================================ */
const ACCENTS = {
  blue: { ring: 'text-blue', bg: 'bg-blue/12', stroke: '#4f8cff' },
  purple: { ring: 'text-purple', bg: 'bg-purple/12', stroke: '#7c5af0' },
  cyan: { ring: 'text-cyan', bg: 'bg-cyan/12', stroke: '#22d3ee' },
  emerald: { ring: 'text-emerald', bg: 'bg-emerald/12', stroke: '#10b981' },
};

function Sparkline({ data, stroke }) {
  if (!data || data.length < 2) return null;
  const w = 90;
  const h = 30;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / span) * (h - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-8 w-[90px]" preserveAspectRatio="none">
      <polyline points={pts.join(' ')} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function StatCard({ label, value, sub, delta, deltaUp = true, icon = 'server', accent = 'blue', spark }) {
  const a = ACCENTS[accent] || ACCENTS.blue;
  const Glyph = I[icon] || I.server;
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-surface/60 p-5 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-border2 max-md:p-4">
      <div className="flex items-start justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${a.bg} ${a.ring}`}>
          <Glyph className="h-[22px] w-[22px]" />
        </div>
        {delta != null && (
          <span
            className={[
              'rounded-full px-2 py-1 text-[11px] font-bold',
              deltaUp ? 'bg-emerald/10 text-emerald' : 'bg-danger/10 text-danger',
            ].join(' ')}
          >
            {deltaUp ? '▲' : '▼'} {delta}
          </span>
        )}
      </div>
      <div className="mt-4 flex items-end justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[26px] font-extrabold leading-none tracking-[-.5px] text-text max-md:text-[22px]">{value}</div>
          <div className="mt-1.5 truncate text-[12px] font-medium text-muted">{label}</div>
          {sub && <div className="mt-0.5 truncate text-[11px] text-dim">{sub}</div>}
        </div>
        <div className="opacity-80 transition-opacity group-hover:opacity-100">
          <Sparkline data={spark} stroke={a.stroke} />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   ActivityChart — área + línea con gradiente y pestañas de rango.
   ============================================================ */
function smoothPath(points) {
  if (points.length < 2) return '';
  const d = [`M ${points[0].x} ${points[0].y}`];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 >= points.length ? points.length - 1 : i + 2];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d.push(`C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`);
  }
  return d.join(' ');
}

function toPoints(values, W, H, pad) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const innerW = W - pad * 2;
  const innerH = H - pad * 2;
  return values.map((v, i) => ({
    x: pad + (i / (values.length - 1)) * innerW,
    y: pad + innerH - ((v - min) / span) * innerH,
  }));
}

export function ActivityChart({ title = 'Actividad de despliegues', datasets }) {
  const [idx, setIdx] = useState(0);
  const ds = datasets[idx];
  const W = 640;
  const H = 240;
  const pad = 18;

  const main = toPoints(ds.points, W, H, pad);
  const cmp = toPoints(ds.compare, W, H, pad);
  const line = smoothPath(main);
  const cmpLine = smoothPath(cmp);
  const area = `${line} L ${main[main.length - 1].x.toFixed(1)} ${H - pad} L ${main[0].x.toFixed(1)} ${H - pad} Z`;
  const last = main[main.length - 1];

  return (
    <div className="rounded-2xl border border-border bg-surface/60 p-5 backdrop-blur-md max-md:p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-bold text-text">{title}</h2>
          <div className="mt-1 flex items-center gap-4 text-[11px] text-muted">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue" /> Este periodo</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-purple/70" /> Anterior</span>
          </div>
        </div>
        <div className="flex rounded-xl border border-border bg-surface p-1">
          {datasets.map((d, i) => (
            <button
              key={d.label}
              onClick={() => setIdx(i)}
              className={[
                'rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all max-md:px-2.5',
                i === idx ? 'bg-grad text-white shadow-accent' : 'text-muted hover:text-text',
              ].join(' ')}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-[220px] w-full max-md:h-[180px]" preserveAspectRatio="none">
          <defs>
            <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4f8cff" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#4f8cff" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="60%" stopColor="#4f8cff" />
              <stop offset="100%" stopColor="#7c5af0" />
            </linearGradient>
          </defs>
          {/* gridlines */}
          {[0.25, 0.5, 0.75].map((t) => (
            <line key={t} x1={pad} x2={W - pad} y1={pad + (H - pad * 2) * t} y2={pad + (H - pad * 2) * t} stroke="#1e2d44" strokeWidth="1" strokeDasharray="3 6" />
          ))}
          <path d={area} fill="url(#areaFill)" />
          <path d={cmpLine} fill="none" stroke="#7c5af0" strokeOpacity="0.55" strokeWidth="2" strokeDasharray="5 6" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
          <path d={line} fill="none" stroke="url(#lineGrad)" strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={last.x} cy={last.y} r="5" fill="#4f8cff" stroke="#060b14" strokeWidth="2.5" />
        </svg>
        <div className="mt-2 flex justify-between px-1 text-[10px] text-dim">
          {ds.xLabels.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   ProjectStatusCard — proyecto reciente con dots de nodos.
   ============================================================ */
function relativeTime(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'ahora';
  if (m < 60) return `hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  const d = Math.floor(h / 24);
  return `hace ${d}d`;
}

const DOT_COLORS = ['bg-blue', 'bg-purple', 'bg-cyan', 'bg-emerald', 'bg-blue/60', 'bg-purple/60'];

export function ProjectStatusCard({ project, onOpen, onDelete }) {
  const total = project.nodeCount || 0;
  const dots = Array.from({ length: Math.min(Math.max(total, 3), 16) });
  return (
    <div
      onClick={() => onOpen(project.id)}
      className="group relative flex cursor-pointer flex-col rounded-2xl border border-border bg-surface/60 p-4 text-left backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-blue/60 hover:shadow-card-hover"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface2 text-[16px]">🗂️</span>
          <span className="truncate text-[14px] font-bold text-text">{project.name}</span>
        </div>
        {onDelete ? (
          <button
            title="Eliminar"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(project.id, project.name);
            }}
            className="shrink-0 rounded-lg p-1.5 text-dim opacity-0 transition-all hover:bg-danger/10 hover:text-danger group-hover:opacity-100"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
            </svg>
          </button>
        ) : (
          <span className="shrink-0 text-[10px] text-dim">{relativeTime(project.updatedAt || project.createdAt)}</span>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {dots.map((_, i) => (
          <span key={i} className={`h-2 w-2 rounded-full ${total > 0 ? DOT_COLORS[i % DOT_COLORS.length] : 'bg-border2'}`} />
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3">
        <span className="truncate text-[11px] font-semibold text-muted">📌 {total} nodos · 🔲 {project.areaCount || 0} áreas</span>
        <span className="shrink-0 text-[12px] font-bold text-blue transition-transform group-hover:translate-x-0.5">Abrir →</span>
      </div>
    </div>
  );
}

/* ============================================================
   Panel — contenedor de sección con encabezado.
   ============================================================ */
export function Panel({ title, action, children, className = '' }) {
  return (
    <div className={`rounded-2xl border border-border bg-surface/60 p-5 backdrop-blur-md max-md:p-4 ${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[15px] font-bold text-text">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

/* ============================================================
   ActivityFeed — lista de actividad reciente.
   ============================================================ */
export function ActivityFeed({ items }) {
  return (
    <ul className="flex flex-col gap-1">
      {items.map((it, i) => (
        <li key={i} className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-surface2/50">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[14px] ${it.bg || 'bg-blue/12'}`}>
            {it.icon}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] text-text">{it.text}</p>
            <p className="text-[11px] text-dim">{it.time}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ============================================================
   ServiceHealth — estado de servicios con dot de salud.
   ============================================================ */
const HEALTH = {
  ok: { dot: 'bg-emerald', label: 'Operativo', text: 'text-emerald' },
  warn: { dot: 'bg-amber-400', label: 'Degradado', text: 'text-amber-400' },
  down: { dot: 'bg-danger', label: 'Caído', text: 'text-danger' },
};

export function ServiceHealth({ services }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {services.map((s) => {
        const h = HEALTH[s.status] || HEALTH.ok;
        return (
          <li key={s.name} className="flex items-center justify-between">
            <span className="flex items-center gap-2.5 text-[13px] text-text">
              <span className="relative flex h-2.5 w-2.5">
                {s.status === 'ok' && <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${h.dot} opacity-60`} />}
                <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${h.dot}`} />
              </span>
              {s.name}
            </span>
            <span className={`text-[11px] font-semibold ${h.text}`}>{s.uptime || h.label}</span>
          </li>
        );
      })}
    </ul>
  );
}

/* ============================================================
   HighlightCard — tarjeta destacada con gradiente (PRO / ahorro).
   ============================================================ */
export function HighlightCard({ plan }) {
  if (plan === 'pro') {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-blue/30 bg-[linear-gradient(135deg,#3b6de8_0%,#7c5af0_100%)] p-5 text-white shadow-pro-card">
        <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10 blur-xl" />
        <I.shield className="h-7 w-7 opacity-90" />
        <div className="mt-3 text-[13px] font-semibold opacity-90">Ahorro estimado este mes</div>
        <div className="mt-1 text-[34px] font-extrabold leading-none tracking-[-1px]">$1,240</div>
        <p className="mt-2 text-[12px] leading-[1.5] opacity-80">El Architect AI optimizó tus recursos vs. el mes anterior.</p>
      </div>
    );
  }
  return (
    <div className="relative overflow-hidden rounded-2xl border border-blue/30 bg-[linear-gradient(135deg,#3b6de8_0%,#7c5af0_100%)] p-5 text-white shadow-pro-card">
      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/15 blur-xl" />
      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider">
        ⭐ Pro
      </span>
      <div className="mt-3 text-[18px] font-extrabold leading-tight">Desbloquea todo el poder</div>
      <ul className="mt-3 space-y-1.5 text-[12px] opacity-90">
        <li className="flex items-center gap-2">✓ Proyectos ilimitados</li>
        <li className="flex items-center gap-2">✓ Architect AI + simulador de costos</li>
        <li className="flex items-center gap-2">✓ Bot de Telegram y autopilot</li>
      </ul>
      <a
        href="/#pricing"
        className="mt-4 block rounded-xl bg-white py-2.5 text-center text-[13px] font-bold text-[#3b6de8] transition-transform hover:-translate-y-px"
      >
        Subir a PRO →
      </a>
    </div>
  );
}
