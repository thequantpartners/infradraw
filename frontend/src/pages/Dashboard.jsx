import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthGuard, authHeaders, logout, getOnboardingState, completeOnboardingStep, isOnboardingDone, isAllOnboardingComplete } from '../lib/auth.js';
import Skeleton from '../components/dashboard/Skeleton.jsx';
import Toast from '../components/dashboard/Toast.jsx';
import MonitoringView from '../components/dashboard/MonitoringView.jsx';
import ArchitectAIView from '../components/dashboard/ArchitectAIView.jsx';
import SettingsView from '../components/dashboard/SettingsView.jsx';
import {
  Sidebar,
  TopBar,
  StatCard,
  ActivityChart,
  ProjectStatusCard,
  Panel,
  ActivityFeed,
  ServiceHealth,
  HighlightCard,
  Icon,
} from '../components/DashboardWidgets.jsx';

const ADMIN_EMAIL = 'thequantpartners@gmail.com';

// PRNG determinista para generar series estables a partir de los datos reales.
function seeded(seed) {
  let s = (seed % 2147483647) || 1;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}
function makeSeries(n, base, rng) {
  return Array.from({ length: n }, (_, i) =>
    Math.max(0, Math.round(base + base * 0.45 * Math.sin(i / 1.6 + base) + (rng() - 0.5) * base * 0.5))
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const session = useAuthGuard();

  useEffect(() => {
    if (session && session.email === ADMIN_EMAIL) {
      navigate('/admin', { replace: true });
    }
  }, [session, navigate]);

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [query, setQuery] = useState('');
  const toastTimer = useRef(null);

  // --- Onboarding state ---
  const [obState, setObState] = useState(() => session ? getOnboardingState(session) : { steps: {} });
  const legacyDone = session ? isOnboardingDone(session) : false;
  const OB_KEYS = ['plan', 'gcloud', 'project', 'telegram', 'ai'];
  const activeObStep = legacyDone ? null : OB_KEYS.find((k) => !obState.steps || !obState.steps[k]) || null;
  const obComplete = activeObStep === null;
  const obStepIndex = activeObStep ? OB_KEYS.indexOf(activeObStep) : OB_KEYS.length;
  const obProgress = Math.round((obStepIndex / OB_KEYS.length) * 100);
  const planSelected = legacyDone || !!obState?.steps?.plan;

  const plan = session?.plan || obState?.plan || 'free';

  const [nav, setNav] = useState(planSelected ? 'dashboard' : 'onboarding');

  function showToast(msg) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }

  function loadProjects() {
    setLoading(true);
    fetch('/api/projects', { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          setLoading(false);
          return;
        }
        setProjects(Array.isArray(data) ? data : []);
        setError(null);
        setLoading(false);
      })
      .catch((err) => {
        setError('No se pudo conectar con la API. ' + err.message);
        setLoading(false);
      });
  }

  useEffect(() => {
    if (session && planSelected) loadProjects();
  }, [session, planSelected]);

  function createProject() {
    if (plan === 'free' && projects.length >= 3) {
      alert('Plan FREE: límite de 3 proyectos alcanzado.\nActualiza a PRO para proyectos ilimitados.');
      return;
    }
    setCreating(true);
    fetch('/api/projects', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ name: 'Nuevo diagrama' }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          if (data.code === 'LIMIT_REACHED') {
            alert('Plan FREE: límite de 3 proyectos alcanzado. Actualiza a PRO.');
          } else {
            alert('Error: ' + data.error);
          }
          setCreating(false);
          return;
        }
        window.location.href = '/canvas.html?id=' + data.id;
      })
      .catch(() => {
        alert('Error al crear el proyecto');
        setCreating(false);
      });
  }

  function openProject(id) {
    window.location.href = '/canvas.html?id=' + id;
  }

  function deleteProject(id, name) {
    if (!confirm('¿Eliminar "' + name + '"?\nEsta acción no se puede deshacer.')) return;
    fetch('/api/project?id=' + id, { method: 'DELETE', headers: authHeaders() })
      .then((r) => r.json())
      .then(() => {
        showToast('"' + name + '" eliminado');
        loadProjects();
      })
      .catch(() => alert('Error al eliminar'));
  }

  function handleNavigate(key) {
    if (!planSelected && key !== 'onboarding') return; // Block navigation during onboarding until plan selected
    setNav(key);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleObStepComplete(stepId, extra) {
    var newState = completeOnboardingStep(session, stepId, extra);
    setObState({ ...newState });
    
    // Check if all steps are now completed
    const nextStep = OB_KEYS.find((k) => !newState.steps || !newState.steps[k]) || null;
    if (!nextStep) {
      setNav('dashboard');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  // --- KPIs y series derivados de los proyectos reales ---
  const totalNodes = useMemo(() => projects.reduce((s, p) => s + (p.nodeCount || 0), 0), [projects]);
  const totalAreas = useMemo(() => projects.reduce((s, p) => s + (p.areaCount || 0), 0), [projects]);
  const estCost = Math.round(totalNodes * 6.4 + projects.length * 5);

  const datasets = useMemo(() => {
    const rng = seeded(totalNodes * 7 + projects.length * 31 + 13);
    const baseD = Math.max(4, totalNodes || 6);
    return [
      {
        label: 'Días',
        points: makeSeries(7, baseD, rng),
        compare: makeSeries(7, baseD * 0.8, rng),
        xLabels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
      },
      {
        label: 'Semanas',
        points: makeSeries(6, baseD * 2.4, rng),
        compare: makeSeries(6, baseD * 2, rng),
        xLabels: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'],
      },
      {
        label: 'Meses',
        points: makeSeries(6, baseD * 9, rng),
        compare: makeSeries(6, baseD * 7.5, rng),
        xLabels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
      },
    ];
  }, [totalNodes, projects.length]);

  const spark = (seed) => makeSeries(10, 10, seeded(seed));

  const services = [
    { name: 'API Gateway', status: 'ok', uptime: '99.98%' },
    { name: 'PostgreSQL', status: 'ok', uptime: '99.95%' },
    { name: 'Redis Cache', status: 'ok', uptime: '100%' },
    { name: 'Telegram Bot', status: plan === 'pro' ? 'ok' : 'warn', uptime: plan === 'pro' ? '99.9%' : 'Inactivo' },
    { name: 'CI/CD Runner', status: 'ok', uptime: '99.7%' },
  ];

  const activity = useMemo(() => {
    const recent = [...projects]
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .slice(0, 4)
      .map((p) => ({
        icon: '✏️',
        bg: 'bg-blue/12',
        text: `Editaste "${p.name}"`,
        time: timeAgo(p.updatedAt || p.createdAt),
      }));
    const synthetic = [
      { icon: '🚀', bg: 'bg-emerald/12', text: 'Despliegue completado en producción', time: 'hace 2h' },
      { icon: '🤖', bg: 'bg-purple/12', text: 'Architect AI generó una topología', time: 'hace 5h' },
    ];
    return [...recent, ...synthetic].slice(0, 5);
  }, [projects]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p) => (p.name || '').toLowerCase().includes(q));
  }, [projects, query]);

  if (!session) return null;

  return (
    <div className="min-h-screen md:pl-[76px]">
      <Sidebar
        active={nav}
        onNavigate={handleNavigate}
        onSignout={() => logout(navigate)}
        planSelected={planSelected}
      />

      {nav !== 'onboarding' && (
        <TopBar
          session={session}
          plan={plan}
          query={query}
          onQuery={setQuery}
          creating={creating}
          onCreate={createProject}
        />
      )}

      <main className="mx-auto max-w-[1320px] px-7 pb-24 pt-6 max-md:px-4 md:pb-10">
        {nav === 'dashboard' && (
          <DashboardHome
            projects={projects}
            datasets={datasets}
            spark={spark}
            services={services}
            activity={activity}
            plan={plan}
            totalNodes={totalNodes}
            totalAreas={totalAreas}
            estCost={estCost}
          />
        )}
        {nav === 'projects' && (
          <ProjectsView
            projects={projects}
            filtered={filtered}
            loading={loading}
            error={error}
            query={query}
            creating={creating}
            onCreate={createProject}
            onOpen={openProject}
            onDelete={deleteProject}
          />
        )}
        {nav === 'monitoring' && <MonitoringView />}
        {nav === 'ai' && <ArchitectAIView plan={plan} />}
        {nav === 'plans' && <PlansView currentPlan={plan} onSelectPlan={(id) => { handleObStepComplete('plan', id); showToast(`Plan actualizado a ${id.toUpperCase()}`); }} />}
        {nav === 'settings' && <SettingsView session={session} plan={plan} onToast={showToast} />}
        
        {nav === 'onboarding' && (
          <div className="mx-auto max-w-[800px] pt-4">
            <OnboardingHeader session={session} stepIndex={obStepIndex} progress={obProgress} />
            {activeObStep === 'plan' && <PlanStep onComplete={(id) => handleObStepComplete('plan', id)} />}
            {activeObStep === 'gcloud' && <GCloudStep onComplete={() => handleObStepComplete('gcloud')} />}
            {activeObStep === 'project' && <ProjectStep onComplete={() => handleObStepComplete('project')} />}
            {activeObStep === 'telegram' && <TelegramStep onComplete={() => handleObStepComplete('telegram')} />}
            {activeObStep === 'ai' && <AIStep onComplete={() => handleObStepComplete('ai')} />}
            {activeObStep === null && (
              <div className="animate-fadeUp-fast rounded-2xl border border-emerald/30 bg-emerald/10 p-8 text-center backdrop-blur-md">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald/20 text-[32px]">🎉</div>
                <h2 className="text-[24px] font-extrabold text-emerald">¡Todo configurado!</h2>
                <p className="mt-2 text-[14px] text-emerald/80">Has completado todos los pasos del setup inicial.</p>
                <button
                  onClick={() => handleNavigate('dashboard')}
                  className="mt-6 rounded-xl bg-emerald px-6 py-3 text-[14px] font-bold text-white shadow-lg transition-all hover:-translate-y-px"
                >
                  Ir al Dashboard →
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {toast && <Toast message={toast} />}
    </div>
  );
}

function DashboardHome({
  projects,
  datasets,
  spark,
  services,
  activity,
  plan,
  totalNodes,
  totalAreas,
  estCost,
}) {
  return (
    <div className="animate-fadeIn">
      {/* KPIs */}
      <section className="grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1 max-md:gap-3">
        <StatCard label="Proyectos activos" value={projects.length} delta="12%" deltaUp icon="folder" accent="blue" spark={spark(1 + projects.length)} />
        <StatCard label="Nodos desplegados" value={totalNodes} sub={`${totalAreas} áreas`} delta="8%" deltaUp icon="server" accent="cyan" spark={spark(99 + totalNodes)} />
        <StatCard label="Costo estimado" value={`$${estCost}`} sub="/ mes" delta="4%" deltaUp={false} icon="coins" accent="purple" spark={spark(7 + estCost)} />
        <StatCard label="Uptime promedio" value="99.9%" sub="últimos 30 días" delta="0.2%" deltaUp icon="shield" accent="emerald" spark={spark(42)} />
      </section>

      {/* Cuerpo: gráfico (izq) | resumen (der) */}
      <section className="mt-5 grid grid-cols-[1.65fr_1fr] gap-5 max-lg:grid-cols-1">
        <div className="flex flex-col gap-5">
          <ActivityChart datasets={datasets} />
        </div>

        {/* Columna derecha */}
        <aside className="flex flex-col gap-5">
          <HighlightCard plan={plan} />

          <Panel title="Estado de servicios" action={<span className="text-[11px] font-semibold text-emerald">● En vivo</span>}>
            <ServiceHealth services={services} />
          </Panel>

          <Panel title="Actividad reciente">
            <ActivityFeed items={activity} />
          </Panel>
        </aside>
      </section>
    </div>
  );
}

function ProjectsView({
  projects,
  filtered,
  loading,
  error,
  query,
  creating,
  onCreate,
  onOpen,
  onDelete,
}) {
  return (
    <div className="animate-fadeIn">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-[20px] font-extrabold tracking-[-.5px] text-text">
          Mis proyectos
          <span className="ml-2.5 rounded-full border border-border bg-surface2 px-3 py-1 text-[12px] font-semibold text-muted">
            {projects.length}
          </span>
        </h2>
        <button
          onClick={onCreate}
          disabled={creating}
          className="inline-flex items-center gap-2 rounded-xl bg-grad px-4 py-2.5 text-[13px] font-bold text-white shadow-accent transition-all hover:-translate-y-px hover:shadow-accent-hover disabled:opacity-60"
        >
          {creating ? (
            <span className="h-[14px] w-[14px] animate-spin-fast rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <Icon.plus className="h-4 w-4" />
          )}
          Nuevo proyecto
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-danger/40 bg-danger/10 px-5 py-4 text-[13px] leading-[1.6] text-[#fca5a5]">
          <b className="text-[#f87171]">⚠ Error de conexión: </b>
          {error}
          <div className="mt-1 text-[11px] opacity-80">
            Asegúrate de haber configurado DATABASE_URL y JWT_SECRET en el backend.
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyProjects query={query} creating={creating} onCreate={onCreate} />
      ) : (
        <div className="grid grid-cols-3 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
          {filtered.map((p) => (
            <ProjectStatusCard key={p.id} project={p} onOpen={onOpen} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'ahora';
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  const d = Math.floor(h / 24);
  return `hace ${d}d`;
}

function EmptyProjects({ query, creating, onCreate }) {
  if (query) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface/40 px-6 py-12 text-center text-[14px] text-muted">
        No hay proyectos que coincidan con “{query}”.
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface/40 px-6 py-14 text-center backdrop-blur-md">
      <div className="mb-3 animate-float text-[52px] opacity-70">🗂️</div>
      <div className="mb-1.5 text-[18px] font-extrabold text-text">Sin proyectos aún</div>
      <p className="mb-5 max-w-[380px] text-[13px] leading-[1.6] text-muted">
        Crea tu primer diagrama de infraestructura: redes Docker, stacks de monitoreo, flujos CI/CD y más.
      </p>
      <button
        onClick={onCreate}
        disabled={creating}
        className="inline-flex items-center gap-2 rounded-xl bg-grad px-5 py-2.5 text-[14px] font-bold text-white shadow-accent transition-all hover:-translate-y-px hover:shadow-accent-hover disabled:opacity-60"
      >
        {creating ? (
          <span className="h-[14px] w-[14px] animate-spin-fast rounded-full border-2 border-white/30 border-t-white" />
        ) : (
          '+'
        )}
        Crear primer proyecto
      </button>
    </div>
  );
}

// === Onboarding step views ===

const OB_STEP_LABELS = ['Elige tu plan', 'Google Cloud', 'Primer proyecto', 'Telegram', 'Estrategia IA'];

function OnboardingHeader({ session, stepIndex, progress }) {
  const firstName = (session.name || 'crack').split(' ')[0];
  return (
    <div className="mb-10 animate-fadeIn">
      <div className="mb-6 flex items-center gap-3">
        <span className="text-grad text-[20px] font-extrabold tracking-[-.6px]">InfraDraw</span>
        <span className="rounded-full border border-border bg-surface2 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted">
          Setup
        </span>
      </div>
      <h1 className="text-[28px] font-extrabold leading-tight tracking-[-1px] text-text max-md:text-[22px]">
        Bienvenido, {firstName} <span className="inline-block animate-float">👋</span>
      </h1>
      <p className="mt-2 text-[15px] text-muted max-md:text-[14px]">
        Configura tu copiloto de infraestructura en 5 pasos rápidos.
      </p>
      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between text-[12px] font-semibold">
          <span className="text-muted">Paso {stepIndex + 1} de 5 · {OB_STEP_LABELS[stepIndex]}</span>
          <span className="text-text">{progress}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface2">
          <div
            className="h-full rounded-full bg-grad transition-[width] duration-500 ease-out"
            style={{ width: progress + '%' }}
          />
        </div>
      </div>
    </div>
  );
}

function PlanStep({ onComplete }) {
  return (
    <div className="animate-fadeUp-fast">
      <div className="mb-8 text-center">
        <span className="text-[48px]">💳</span>
        <h2 className="mt-3 text-[24px] font-extrabold tracking-[-.5px] text-text">Elige tu plan</h2>
        <p className="mt-2 text-[14px] text-muted">Prueba cualquier plan gratis por 14 días. Cancela cuando quieras.</p>
      </div>
      <div className="grid grid-cols-2 gap-5 max-lg:grid-cols-1">
        {/* Starter */}
        <button
          onClick={() => onComplete('starter')}
          className="group relative flex flex-col rounded-2xl border border-border bg-surface/60 p-6 text-left backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-emerald/50 hover:shadow-card-hover"
        >
          <div className="text-[18px] font-extrabold text-text">Starter</div>
          <div className="mt-1 text-[28px] font-extrabold tracking-[-1px] text-text">
            $49<span className="text-[14px] font-medium text-muted">/mes</span>
          </div>
          <p className="mt-2 text-[12px] text-muted">Hasta $1,000/mo en Cloud Spend</p>
          <ul className="mt-4 flex-1 space-y-2.5">
            <li className="flex items-center gap-2 text-[13px] text-muted"><span className="text-emerald">✓</span> Architect AI Autopilot</li>
            <li className="flex items-center gap-2 text-[13px] text-muted"><span className="text-emerald">✓</span> Proyectos ilimitados</li>
            <li className="flex items-center gap-2 text-[13px] text-muted"><span className="text-emerald">✓</span> Alertas Telegram</li>
          </ul>
          <div className="mt-5 rounded-xl border border-border bg-surface2 py-3 text-center text-[13px] font-bold text-text transition-all group-hover:border-emerald/50 group-hover:bg-emerald/10 group-hover:text-emerald">
            Trial 14 días →
          </div>
        </button>

        {/* Growth */}
        <button
          onClick={() => onComplete('growth')}
          className="group relative flex flex-col rounded-2xl border border-blue/40 bg-[linear-gradient(135deg,rgba(59,109,232,0.08),rgba(124,90,240,0.08))] p-6 text-left backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-blue/70 hover:shadow-pro-card"
        >
          <span className="absolute -top-3 right-4 rounded-full bg-grad px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-accent">
            Most Popular
          </span>
          <div className="text-[18px] font-extrabold text-text">Growth</div>
          <div className="mt-1 text-[28px] font-extrabold tracking-[-1px] text-text">
            $199<span className="text-[14px] font-medium text-muted">/mes</span>
          </div>
          <p className="mt-2 text-[12px] text-muted">Hasta $5,000/mo en Cloud Spend</p>
          <ul className="mt-4 flex-1 space-y-2.5">
            <li className="flex items-center gap-2 text-[13px] text-text"><span className="text-blue font-bold">✓</span> Todo lo de Starter</li>
            <li className="flex items-center gap-2 text-[13px] text-text"><span className="text-blue font-bold">✓</span> Límites ampliados</li>
            <li className="flex items-center gap-2 text-[13px] text-text"><span className="text-blue font-bold">✓</span> Soporte prioritario</li>
          </ul>
          <div className="mt-5 rounded-xl bg-grad py-3 text-center text-[13px] font-bold text-white shadow-accent transition-all group-hover:-translate-y-px group-hover:shadow-glow">
            Trial 14 días →
          </div>
        </button>

        {/* Pro */}
        <button
          onClick={() => onComplete('pro')}
          className="group relative flex flex-col rounded-2xl border border-border bg-surface/60 p-6 text-left backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-card-hover"
        >
          <div className="text-[18px] font-extrabold text-text">Pro</div>
          <div className="mt-1 text-[28px] font-extrabold tracking-[-1px] text-text">
            $499<span className="text-[14px] font-medium text-muted">/mes</span>
          </div>
          <p className="mt-2 text-[12px] text-muted">Hasta $25,000/mo en Cloud Spend</p>
          <ul className="mt-4 flex-1 space-y-2.5">
            <li className="flex items-center gap-2 text-[13px] text-muted"><span className="text-emerald">✓</span> Todo lo de Growth</li>
            <li className="flex items-center gap-2 text-[13px] text-muted"><span className="text-emerald">✓</span> Límites masivos</li>
          </ul>
          <div className="mt-5 rounded-xl border border-border bg-surface2 py-3 text-center text-[13px] font-bold text-text transition-all group-hover:border-accent/50 group-hover:bg-accent/10 group-hover:text-accent">
            Trial 14 días →
          </div>
        </button>

        {/* Elite */}
        <button
          onClick={() => onComplete('elite')}
          className="group relative flex flex-col rounded-2xl border border-border bg-surface/60 p-6 text-left backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-white/50 hover:shadow-card-hover"
        >
          <div className="text-[18px] font-extrabold text-text">Elite</div>
          <div className="mt-1 text-[28px] font-extrabold tracking-[-1px] text-text">
            Custom
          </div>
          <p className="mt-2 text-[12px] text-muted">Cloud Spend personalizado</p>
          <ul className="mt-4 flex-1 space-y-2.5">
            <li className="flex items-center gap-2 text-[13px] text-muted"><span className="text-emerald">✓</span> Todo lo de Pro</li>
            <li className="flex items-center gap-2 text-[13px] text-muted"><span className="text-emerald">✓</span> Dedicated Manager</li>
          </ul>
          <div className="mt-5 rounded-xl border border-border bg-surface2 py-3 text-center text-[13px] font-bold text-text transition-all hover:bg-surface2">
            Contactar Ventas →
          </div>
        </button>
      </div>
    </div>
  );
}

function GCloudStep({ onComplete }) {
  const [busy, setBusy] = useState(false);
  function connect() {
    setBusy(true);
    setTimeout(() => { setBusy(false); onComplete(); }, 1200);
  }
  return (
    <div className="animate-fadeUp-fast">
      <div className="mb-8 text-center">
        <span className="text-[48px]">☁️</span>
        <h2 className="mt-3 text-[24px] font-extrabold tracking-[-.5px] text-text">Conecta Google Cloud</h2>
        <p className="mt-2 text-[14px] text-muted">Vincula tu cuenta para leer costos y recursos reales de tu infraestructura.</p>
      </div>
      <div className="mx-auto max-w-[440px] rounded-2xl border border-border bg-surface/60 p-8 text-center backdrop-blur-md">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue/10 text-[28px]">☁️</div>
        <p className="mb-6 text-[13px] leading-[1.6] text-muted">
          Conectaremos tu proyecto de GCP para importar recursos, monitorear costos y sincronizar tu infraestructura.
        </p>
        <button
          onClick={connect}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-xl bg-grad px-6 py-3 text-[14px] font-bold text-white shadow-accent transition-all hover:-translate-y-px hover:shadow-glow disabled:opacity-60"
        >
          {busy && <span className="h-4 w-4 animate-spin-fast rounded-full border-2 border-white/30 border-t-white" />}
          {busy ? 'Conectando...' : 'Conectar cuenta →'}
        </button>
      </div>
    </div>
  );
}

function ProjectStep({ onComplete }) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  function create() {
    if (!name.trim()) return;
    setBusy(true);
    fetch('/api/projects', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ name: name.trim() }),
    })
      .then((r) => r.json())
      .then((data) => {
        setBusy(false);
        if (data.error) { alert('Error: ' + data.error); return; }
        onComplete();
      })
      .catch(() => { setBusy(false); onComplete(); });
  }
  return (
    <div className="animate-fadeUp-fast">
      <div className="mb-8 text-center">
        <span className="text-[48px]">🗂️</span>
        <h2 className="mt-3 text-[24px] font-extrabold tracking-[-.5px] text-text">Crea tu primer proyecto</h2>
        <p className="mt-2 text-[14px] text-muted">Dale un nombre a tu primer diagrama de infraestructura.</p>
      </div>
      <div className="mx-auto max-w-[440px] rounded-2xl border border-border bg-surface/60 p-8 backdrop-blur-md">
        <form
          onSubmit={(e) => { e.preventDefault(); create(); }}
          className="flex flex-col gap-4"
        >
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Stack de producción"
            className="rounded-xl border border-border bg-surface px-4 py-3.5 text-[14px] text-text outline-none transition-colors placeholder:text-dim focus:border-blue"
          />
          <button
            type="submit"
            disabled={!name.trim() || busy}
            className="rounded-xl bg-grad px-6 py-3 text-[14px] font-bold text-white shadow-accent transition-all hover:-translate-y-px hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin-fast rounded-full border-2 border-white/30 border-t-white" />
                Creando...
              </span>
            ) : 'Crear proyecto →'}
          </button>
        </form>
      </div>
    </div>
  );
}

function TelegramStep({ onComplete }) {
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  function connect() {
    if (!token.trim()) return;
    setBusy(true);
    setTimeout(() => { setBusy(false); onComplete(); }, 1000);
  }
  return (
    <div className="animate-fadeUp-fast">
      <div className="mb-8 text-center">
        <span className="text-[48px]">🤖</span>
        <h2 className="mt-3 text-[24px] font-extrabold tracking-[-.5px] text-text">Configura el bot de Telegram</h2>
        <p className="mt-2 text-[14px] text-muted">Recibe alertas y controla despliegues desde Telegram.</p>
      </div>
      <div className="mx-auto max-w-[440px] rounded-2xl border border-border bg-surface/60 p-8 backdrop-blur-md">
        <div className="mb-4 rounded-xl border border-blue/20 bg-blue/[0.06] px-4 py-3 text-[12px] leading-[1.6] text-muted">
          💡 Obtén tu token desde <span className="font-bold text-blue">@BotFather</span> en Telegram.
        </div>
        <div className="flex flex-col gap-4">
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Token del bot"
            className="rounded-xl border border-border bg-surface px-4 py-3.5 text-[14px] text-text outline-none transition-colors placeholder:text-dim focus:border-blue"
          />
          <button
            onClick={connect}
            disabled={!token.trim() || busy}
            className="rounded-xl bg-grad px-6 py-3 text-[14px] font-bold text-white shadow-accent transition-all hover:-translate-y-px hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin-fast rounded-full border-2 border-white/30 border-t-white" />
                Vinculando...
              </span>
            ) : 'Vincular bot →'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AIStep({ onComplete }) {
  const [busy, setBusy] = useState(false);
  function generate() {
    setBusy(true);
    setTimeout(() => { setBusy(false); onComplete(); }, 1500);
  }
  return (
    <div className="animate-fadeUp-fast">
      <div className="mb-8 text-center">
        <span className="text-[48px]">✨</span>
        <h2 className="mt-3 text-[24px] font-extrabold tracking-[-.5px] text-text">Genera tu estrategia con IA</h2>
        <p className="mt-2 text-[14px] text-muted">Deja que el Architect AI proponga tu primera topología optimizada.</p>
      </div>
      <div className="mx-auto max-w-[440px] rounded-2xl border border-border bg-surface/60 p-8 text-center backdrop-blur-md">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple/10 text-[28px]">✨</div>
        <p className="mb-6 text-[13px] leading-[1.6] text-muted">
          Analizaremos tu configuración y generaremos una topología óptima para tu infraestructura.
        </p>
        <button
          onClick={generate}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-xl bg-grad px-6 py-3 text-[14px] font-bold text-white shadow-accent transition-all hover:-translate-y-px hover:shadow-glow disabled:opacity-60"
        >
          {busy && <span className="h-4 w-4 animate-spin-fast rounded-full border-2 border-white/30 border-t-white" />}
          {busy ? 'Generando estrategia...' : 'Generar setup →'}
        </button>
      </div>
    </div>
  );
}

function PlansView({ currentPlan, onSelectPlan }) {
  return (
    <div className="animate-fadeIn">
      <header className="mb-8">
        <h1 className="text-[20px] font-extrabold tracking-[-.5px] text-text max-md:text-[18px]">Planes y Suscripción</h1>
        <p className="mt-0.5 text-[13px] text-muted">Gestiona tu nivel de Cloud Spend y desbloquea el Autopilot.</p>
      </header>
      <div className="mb-6 rounded-xl border border-blue/20 bg-blue/5 p-4">
        <div className="text-[13px] font-semibold text-blue">Tu plan actual es: {currentPlan.toUpperCase()}</div>
      </div>
      <PlanStep onComplete={onSelectPlan} />
    </div>
  );
}
