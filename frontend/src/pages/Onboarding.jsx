import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthGuard, setOnboardingDone, logout } from '../lib/auth.js';
import OnboardingStep from '../components/OnboardingStep.jsx';

const STEPS = [
  {
    id: 'plan',
    title: 'Elige tu plan',
    description: 'Empieza gratis o desbloquea proyectos ilimitados y la IA con Pro.',
    icon: '💳',
  },
  {
    id: 'gcloud',
    title: 'Conecta Google Cloud',
    description: 'Vincula tu cuenta para leer costos y recursos reales de tu infraestructura.',
    icon: '☁️',
    actionLabel: 'Conectar cuenta',
    async: true,
  },
  {
    id: 'project',
    title: 'Crea tu primer proyecto',
    description: 'Dale un nombre a tu primer diagrama de infraestructura.',
    icon: '🗂️',
  },
  {
    id: 'telegram',
    title: 'Configura el bot de Telegram',
    description: 'Recibe alertas y controla despliegues directamente desde Telegram.',
    icon: '🤖',
  },
  {
    id: 'ai',
    title: 'Genera tu estrategia con IA',
    description: 'Deja que el Architect AI proponga tu primera topología optimizada.',
    icon: '✨',
    actionLabel: 'Generar setup',
    async: true,
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const session = useAuthGuard();

  const [done, setDone] = useState(() => STEPS.map(() => false));
  const [busyId, setBusyId] = useState(null);
  const [plan, setPlan] = useState(null);
  const [projectName, setProjectName] = useState('');
  const [telegramToken, setTelegramToken] = useState('');

  const activeIndex = done.findIndex((d) => !d);
  const completedCount = done.filter(Boolean).length;
  const allDone = completedCount === STEPS.length;
  const progress = useMemo(() => Math.round((completedCount / STEPS.length) * 100), [completedCount]);

  if (!session) return null;

  const firstName = (session.name || 'crack').split(' ')[0];

  function complete(index) {
    setDone((prev) => {
      const next = [...prev];
      next[index] = true;
      return next;
    });
  }

  function runAsync(step, index) {
    setBusyId(step.id);
    setTimeout(() => {
      setBusyId(null);
      complete(index);
    }, 950);
  }

  function finish() {
    setOnboardingDone(session);
    navigate('/dashboard', { replace: true });
  }

  function stepStatus(index) {
    if (done[index]) return 'done';
    if (index === activeIndex) return 'active';
    return 'todo';
  }

  // Contenido expandible para el paso activo según su tipo.
  function activeContent(step, index) {
    if (step.id === 'plan') {
      const Plan = ({ id, name, price, perks, recommended }) => (
        <button
          onClick={() => {
            setPlan(id);
            complete(index);
          }}
          className={[
            'group relative flex-1 rounded-2xl border p-4 text-left transition-all duration-200',
            plan === id
              ? 'border-blue bg-blue/10 shadow-accent'
              : 'border-border bg-surface hover:-translate-y-0.5 hover:border-blue/60',
          ].join(' ')}
        >
          {recommended && (
            <span className="absolute -top-2.5 right-3 rounded-full bg-grad px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white shadow-accent">
              Recomendado
            </span>
          )}
          <div className="flex items-baseline justify-between">
            <span className="text-[15px] font-extrabold text-text">{name}</span>
            <span className="text-[13px] font-bold text-muted">{price}</span>
          </div>
          <ul className="mt-2.5 space-y-1.5">
            {perks.map((p) => (
              <li key={p} className="flex items-center gap-2 text-[12px] text-muted">
                <span className="text-emerald">✓</span> {p}
              </li>
            ))}
          </ul>
        </button>
      );
      return (
        <div className="flex gap-3 max-sm:flex-col">
          <Plan id="free" name="Free" price="$0" perks={['3 proyectos', 'Editor de canvas', 'Export PNG']} />
          <Plan
            id="pro"
            name="Pro"
            price="$19/mes"
            recommended
            perks={['Proyectos ilimitados', 'Architect AI + costos', 'Bot de Telegram']}
          />
        </div>
      );
    }

    if (step.id === 'project') {
      return (
        <form
          className="flex gap-2 max-sm:flex-col"
          onSubmit={(e) => {
            e.preventDefault();
            if (!projectName.trim()) return;
            complete(index);
          }}
        >
          <input
            autoFocus
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Ej. Stack de producción"
            className="flex-1 rounded-xl border border-border bg-surface px-4 py-3 text-[14px] text-text outline-none transition-colors placeholder:text-dim focus:border-blue"
          />
          <button
            type="submit"
            disabled={!projectName.trim()}
            className="rounded-xl bg-grad px-5 py-3 text-[13px] font-bold text-white shadow-accent transition-all hover:-translate-y-px hover:shadow-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            Crear proyecto
          </button>
        </form>
      );
    }

    if (step.id === 'telegram') {
      return (
        <div className="flex flex-col gap-3">
          <div className="flex gap-2 max-sm:flex-col">
            <input
              value={telegramToken}
              onChange={(e) => setTelegramToken(e.target.value)}
              placeholder="Token del bot (de @BotFather)"
              className="flex-1 rounded-xl border border-border bg-surface px-4 py-3 text-[14px] text-text outline-none transition-colors placeholder:text-dim focus:border-blue"
            />
            <button
              onClick={() => complete(index)}
              disabled={!telegramToken.trim()}
              className="rounded-xl bg-grad px-5 py-3 text-[13px] font-bold text-white shadow-accent transition-all hover:-translate-y-px hover:shadow-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              Vincular
            </button>
          </div>
          <button
            onClick={() => complete(index)}
            className="self-start text-[12px] font-semibold text-muted underline-offset-2 hover:text-text hover:underline"
          >
            Lo haré más tarde →
          </button>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="relative z-[1] flex min-h-screen flex-col items-center px-4 py-10 max-md:py-6">
      {/* Marca */}
      <div className="mb-8 flex items-center gap-2 max-md:mb-6">
        <span className="text-grad text-[20px] font-extrabold tracking-[-.6px]">InfraDraw</span>
        <span className="rounded-full border border-border bg-surface2 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted">
          Setup
        </span>
      </div>

      <div className="w-full max-w-[640px] animate-fadeUp-fast">
        {/* Encabezado */}
        <div className="text-center">
          <h1 className="text-[30px] font-extrabold leading-tight tracking-[-1px] text-text max-md:text-[24px]">
            Bienvenido, {firstName} <span className="inline-block animate-float">👋</span>
          </h1>
          <p className="mx-auto mt-2 max-w-[460px] text-[15px] leading-[1.6] text-muted max-md:text-[14px]">
            Completa estos pasos para poner en marcha tu copiloto de infraestructura. Toma menos de 2 minutos.
          </p>
        </div>

        {/* Progreso */}
        <div className="mb-6 mt-7 max-md:mt-6">
          <div className="mb-2 flex items-center justify-between text-[12px] font-semibold">
            <span className="text-muted">
              {allDone ? '¡Todo listo!' : `Paso ${Math.min(activeIndex + 1, STEPS.length)} de ${STEPS.length}`}
            </span>
            <span className="text-text">{progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface2">
            <div
              className="h-full rounded-full bg-grad transition-[width] duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Tarjeta de pasos */}
        <div className="rounded-3xl border border-border bg-surface/70 p-4 shadow-mock backdrop-blur-xl max-md:p-3">
          <div className="flex flex-col gap-3">
            {STEPS.map((step, i) => {
              const status = stepStatus(i);
              return (
                <OnboardingStep
                  key={step.id}
                  index={i + 1}
                  title={step.title}
                  description={step.description}
                  icon={step.icon}
                  status={status}
                  busy={busyId === step.id}
                  actionLabel={step.actionLabel}
                  onAction={() => (step.async ? runAsync(step, i) : complete(i))}
                >
                  {status === 'active' ? activeContent(step, i) : null}
                </OnboardingStep>
              );
            })}
          </div>

          {/* Pie: estado completado o saltar */}
          <div className="mt-5 border-t border-border/60 pt-4">
            {allDone ? (
              <div className="flex flex-col items-center gap-3 text-center">
                <p className="text-[14px] font-semibold text-emerald">
                  🎉 Tu copiloto está configurado. ¡A diseñar infraestructura!
                </p>
                <button
                  onClick={finish}
                  className="w-full rounded-xl bg-grad px-6 py-3.5 text-[15px] font-bold text-white shadow-glow transition-all hover:-translate-y-px hover:shadow-glow-lg"
                >
                  Entrar al Dashboard →
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between max-sm:flex-col max-sm:gap-3">
                <p className="text-[12px] text-dim max-sm:text-center">
                  Lleva tu negocio al siguiente nivel configurando todas las integraciones.
                </p>
                <button
                  onClick={finish}
                  className="shrink-0 text-[13px] font-semibold text-muted transition-colors hover:text-text"
                >
                  Saltar configuración por ahora
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Cerrar sesión discreto */}
        <div className="mt-5 text-center">
          <button
            onClick={() => logout(navigate)}
            className="text-[12px] text-dim transition-colors hover:text-muted"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
