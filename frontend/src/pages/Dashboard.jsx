import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthGuard, authHeaders, logout } from '../lib/auth.js';
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
  const [nav, setNav] = useState('dashboard');
  const [query, setQuery] = useState('');
  const toastTimer = useRef(null);

  const plan = session?.plan || 'free';

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
    if (session) loadProjects();
  }, [session]);

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
    setNav(key);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      <Sidebar active={nav} onNavigate={handleNavigate} onSignout={() => logout(navigate)} />

      <TopBar
        session={session}
        plan={plan}
        query={query}
        onQuery={setQuery}
        creating={creating}
        onCreate={createProject}
      />

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
        {nav === 'settings' && <SettingsView session={session} plan={plan} onToast={showToast} />}
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
