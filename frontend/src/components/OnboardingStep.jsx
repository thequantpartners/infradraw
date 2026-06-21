// Un paso del wizard de onboarding. Encapsula los 3 estados visuales:
// done (check verde), active (resaltado con glow) y todo (atenuado).

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export default function OnboardingStep({
  index,
  title,
  description,
  icon,
  status = 'todo', // 'done' | 'active' | 'todo'
  actionLabel,
  onAction,
  busy = false,
  children,
}) {
  const done = status === 'done';
  const active = status === 'active';

  return (
    <div
      className={[
        'relative rounded-2xl border px-5 py-[18px] transition-all duration-300 max-md:px-4 max-md:py-4',
        active
          ? 'border-blue/50 bg-[linear-gradient(120deg,rgba(79,140,255,0.08),rgba(124,90,240,0.06))] shadow-[0_0_0_1px_rgba(79,140,255,0.15),0_18px_40px_-20px_rgba(79,140,255,0.6)]'
          : done
            ? 'border-emerald/25 bg-emerald/[0.04]'
            : 'border-border bg-surface2/40',
      ].join(' ')}
    >
      <div className="flex items-center gap-4 max-md:gap-3">
        {/* Indicador de estado */}
        <div
          className={[
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[15px] font-bold transition-all duration-300 max-md:h-10 max-md:w-10',
            done
              ? 'bg-emerald text-[#04140e] shadow-[0_6px_18px_-6px_rgba(16,185,129,0.8)]'
              : active
                ? 'bg-grad text-white shadow-glow'
                : 'border border-border2 bg-surface text-dim',
          ].join(' ')}
        >
          {done ? <CheckIcon /> : index}
        </div>

        {/* Texto */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {icon && <span className={done ? 'opacity-60' : ''}>{icon}</span>}
            <h3
              className={[
                'truncate text-[15px] font-bold tracking-[-.2px] max-md:text-[14px]',
                done ? 'text-muted line-through decoration-emerald/40' : 'text-text',
              ].join(' ')}
            >
              {title}
            </h3>
          </div>
          <p className="mt-0.5 line-clamp-2 text-[13px] leading-[1.5] text-muted max-md:text-[12px]">{description}</p>
        </div>

        {/* Acción / estado a la derecha */}
        <div className="shrink-0">
          {done ? (
            <span className="hidden items-center gap-1.5 rounded-full border border-emerald/30 bg-emerald/10 px-3 py-1.5 text-[12px] font-bold text-emerald sm:inline-flex">
              <CheckIcon />
              Listo
            </span>
          ) : active && actionLabel ? (
            <button
              onClick={onAction}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl bg-grad px-4 py-2.5 text-[13px] font-bold text-white shadow-accent transition-all hover:-translate-y-px hover:shadow-accent-hover active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 max-md:px-3 max-md:py-2 max-md:text-[12px]"
            >
              {busy && <span className="h-[14px] w-[14px] animate-spin-fast rounded-full border-2 border-white/30 border-t-white" />}
              {actionLabel}
            </button>
          ) : (
            !active && (
              <span className="rounded-full border border-border bg-surface px-3 py-1.5 text-[12px] font-semibold text-dim max-md:hidden">
                Pendiente
              </span>
            )
          )}
        </div>
      </div>

      {/* Contenido expandible solo en el paso activo */}
      {active && children && <div className="mt-4 animate-fadeIn border-t border-border/60 pt-4">{children}</div>}
    </div>
  );
}
