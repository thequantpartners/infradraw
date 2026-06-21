export default function EmptyState({ creating, onCreate }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-surface/70 px-8 py-20 text-center backdrop-blur-[8px]">
      <div className="mb-4 animate-float text-[64px] opacity-70">🗂️</div>
      <div className="mb-2 text-[20px] font-extrabold text-text">Sin proyectos aún</div>
      <div className="mb-6 max-w-[440px] text-[15px] leading-[1.6] text-muted">
        Crea tu primer diagrama de infraestructura. Puedes diseñar redes Docker, stacks de monitoreo, flujos CI/CD y más.
      </div>
      <button
        className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-[10px] border-none bg-grad px-5 py-2.5 text-[14px] font-bold text-white shadow-accent transition-all hover:-translate-y-px hover:opacity-95 hover:shadow-accent-hover disabled:transform-none disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
        disabled={creating}
        onClick={onCreate}
      >
        {creating ? (
          <div className="h-[14px] w-[14px] animate-spin-fast rounded-full border-2 border-white/30 border-t-white" />
        ) : (
          <span>+</span>
        )}
        {creating ? 'Creando…' : 'Crear primer proyecto'}
      </button>
    </div>
  );
}
