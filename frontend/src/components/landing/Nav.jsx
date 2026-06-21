export default function Nav({ onLogin }) {
  return (
    <nav className="fixed inset-x-0 top-0 z-[100] flex h-[68px] items-center justify-between border-b border-border bg-bg/85 px-12 backdrop-blur-[16px] max-md:h-[60px] max-md:px-5">
      <div className="text-grad text-[20px] font-extrabold tracking-[-.4px] max-md:text-[18px]">
        Infra<span>Draw</span>
      </div>
      <div className="flex items-center gap-3">
        <a
          href="#features"
          className="rounded-lg px-3 py-1.5 text-[14px] font-medium text-muted no-underline transition-colors hover:text-text max-md:hidden"
        >
          Características
        </a>
        <a
          href="#pricing"
          className="rounded-lg px-3 py-1.5 text-[14px] font-medium text-muted no-underline transition-colors hover:text-text max-md:hidden"
        >
          Precios
        </a>
        <button
          onClick={onLogin}
          className="flex cursor-pointer items-center gap-2 rounded-[10px] border border-border2 bg-surface2 px-[18px] py-2 font-[inherit] text-[14px] font-semibold text-text transition-all hover:border-blue hover:bg-surface hover:text-blue max-md:gap-1.5 max-md:px-[14px] max-md:text-[13px]"
        >
          <span>🚀</span>
          <span className="max-md:hidden">Iniciar sesión con Google</span>
          <span className="hidden max-md:inline">Google</span>
        </button>
      </div>
    </nav>
  );
}
