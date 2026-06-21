const ADMIN_EMAIL = 'thequantpartners@gmail.com';

export default function Header({ session, plan, creating, onCreate, onSignout }) {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface/80 px-10 py-[18px] backdrop-blur-[12px] max-md:px-5 max-md:py-4">
      <div>
        <div className="text-grad text-[22px] font-extrabold tracking-[-.6px]">
          Infra<span className="font-extrabold">Draw</span>
        </div>
        <div className="mt-0.5 text-[11px] tracking-[.2px] text-muted">Canvas de infraestructura Docker-first</div>
      </div>
      <div className="flex items-center gap-4">
        {session.email === ADMIN_EMAIL && (
          <a
            href="/admin.html"
            className="cursor-pointer rounded-lg border border-blue bg-transparent px-[14px] py-1.5 text-[12px] font-semibold text-blue no-underline transition-all"
          >
            Admin
          </a>
        )}
        {plan === 'pro' ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-blue/35 bg-blue/15 px-[14px] py-[5px] text-[11px] font-extrabold uppercase tracking-[.5px] text-blue">
            ⭐ PRO
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-muted/20 bg-muted/10 px-[14px] py-[5px] text-[11px] font-extrabold uppercase tracking-[.5px] text-muted">
            FREE
          </span>
        )}
        {session.photo && (
          <img src={session.photo} className="h-[34px] w-[34px] rounded-full border-2 border-border object-cover" alt="" />
        )}
        <span className="max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap text-[14px] font-medium text-text max-md:hidden">
          {session.name || ''}
        </span>
        <button
          className="cursor-pointer rounded-lg border border-border bg-transparent px-[14px] py-1.5 text-[12px] font-semibold text-muted transition-all hover:border-danger hover:bg-danger/[.05] hover:text-danger"
          onClick={onSignout}
        >
          Salir
        </button>
        <button
          className="inline-flex cursor-pointer items-center gap-2 rounded-[10px] border-none bg-grad px-5 py-2.5 text-[14px] font-bold text-white shadow-accent transition-all hover:-translate-y-px hover:opacity-95 hover:shadow-accent-hover active:translate-y-px disabled:transform-none disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
          disabled={creating}
          onClick={onCreate}
        >
          {creating ? (
            <div className="h-[14px] w-[14px] animate-spin-fast rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <span>+</span>
          )}
          {creating ? 'Creando…' : 'Nuevo proyecto'}
        </button>
      </div>
    </div>
  );
}
