function CanvasMock() {
  const gridBg = {
    backgroundImage:
      'repeating-linear-gradient(0deg,transparent,transparent 31px,rgba(30,45,68,.4) 31px,rgba(30,45,68,.4) 32px),repeating-linear-gradient(90deg,transparent,transparent 31px,rgba(30,45,68,.4) 31px,rgba(30,45,68,.4) 32px)',
  };
  return (
    <div
      className="mt-[60px] w-full max-w-[900px] animate-fadeUp max-md:mt-10 max-[480px]:hidden"
      style={{ animationDelay: '.4s' }}
    >
      <div className="overflow-hidden rounded-[20px] border border-border2 bg-surface shadow-mock">
        {/* topbar */}
        <div className="flex items-center gap-2 border-b border-border bg-surface2 px-5 py-[14px] max-md:px-4 max-md:py-2.5">
          <div className="h-3 w-3 rounded-full bg-[#ff5f57] max-md:h-2.5 max-md:w-2.5" />
          <div className="h-3 w-3 rounded-full bg-[#febc2e] max-md:h-2.5 max-md:w-2.5" />
          <div className="h-3 w-3 rounded-full bg-[#28c840] max-md:h-2.5 max-md:w-2.5" />
          <div className="flex-1 text-center text-[13px] font-medium text-muted max-md:text-[12px]">
            🛸 InfraDraw — mi-startup.io
          </div>
        </div>
        {/* body */}
        <div className="flex min-h-[320px] max-md:min-h-[180px]">
          {/* sidebar */}
          <div className="flex w-[120px] flex-col gap-1.5 border-r border-border bg-surface2 px-2 py-3 max-md:hidden">
            <div className="mb-1 px-1 py-0.5 text-[10px] font-bold text-dim">NODOS</div>
            {['🖥️ VPS', '🐘 PostgreSQL', '⚡ Redis', '🔀 Traefik', '🌐 Cloudflare'].map((label) => (
              <div
                key={label}
                className="cursor-pointer rounded-lg border border-border bg-surface px-2 py-[7px] text-[11px] text-muted transition-all hover:border-blue hover:text-blue"
              >
                {label}
              </div>
            ))}
            <div className="cursor-pointer rounded-lg border border-blue bg-surface px-2 py-[7px] text-[11px] text-blue transition-all">
              🤖 DevOps Bot
            </div>
          </div>
          {/* canvas area */}
          <div className="relative flex-1 overflow-hidden" style={gridBg}>
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full"
              viewBox="0 0 700 320"
              preserveAspectRatio="none"
            >
              <path d="M 180 100 C 240 100 240 80 300 80" stroke="rgba(79,140,255,.35)" strokeWidth="2" fill="none" strokeDasharray="4" />
              <path d="M 180 100 C 240 100 240 200 300 200" stroke="rgba(79,140,255,.25)" strokeWidth="2" fill="none" strokeDasharray="4" />
              <path d="M 460 140 C 500 140 520 180 540 180" stroke="rgba(124,90,240,.3)" strokeWidth="2" fill="none" strokeDasharray="4" />
            </svg>
            <div
              className="absolute rounded-xl border-[1.5px] border-dashed border-border2 bg-blue/[.04] px-2.5 py-2 text-[10px] font-semibold uppercase tracking-[.02em] text-dim max-md:text-[9px]"
              style={{ left: 30, top: 30, width: 200, height: 240 }}
            >
              🌐 Red Pública
            </div>
            <div
              className="absolute rounded-xl border-[1.5px] border-dashed border-border2 bg-blue/[.04] px-2.5 py-2 text-[10px] font-semibold uppercase tracking-[.02em] text-dim max-md:text-[9px]"
              style={{ left: 270, top: 30, width: 200, height: 280 }}
            >
              🔒 Red Interna
            </div>
            <div
              className="absolute flex items-center gap-1.5 whitespace-nowrap rounded-[10px] border border-blue bg-surface2 px-3 py-2 text-[11px] font-semibold text-text shadow-[0_0_0_2px_rgba(79,140,255,.25)] max-md:text-[10px]"
              style={{ left: 58, top: 88 }}
            >
              <span className="h-2 w-2 rounded-full bg-blue" /> 🖥️ VPS · cx31
            </div>
            <div
              className="absolute flex items-center gap-1.5 whitespace-nowrap rounded-[10px] border border-border2 bg-surface2 px-3 py-2 text-[11px] font-semibold text-text shadow-[0_4px_16px_rgba(0,0,0,.3)] max-md:text-[10px]"
              style={{ left: 298, top: 58 }}
            >
              <span className="h-2 w-2 rounded-full bg-cyan" /> 🔀 Traefik
            </div>
            <div
              className="absolute flex items-center gap-1.5 whitespace-nowrap rounded-[10px] border border-border2 bg-surface2 px-3 py-2 text-[11px] font-semibold text-text shadow-[0_4px_16px_rgba(0,0,0,.3)] max-md:text-[10px]"
              style={{ left: 298, top: 168 }}
            >
              <span className="h-2 w-2 rounded-full bg-green" /> 🐘 PostgreSQL
            </div>
            <div
              className="absolute flex items-center gap-1.5 whitespace-nowrap rounded-[10px] border border-border2 bg-surface2 px-3 py-2 text-[11px] font-semibold text-text shadow-[0_4px_16px_rgba(0,0,0,.3)] max-md:text-[10px]"
              style={{ left: 520, top: 100 }}
            >
              <span className="h-2 w-2 rounded-full bg-purple" /> 🤖 DevOps Bot
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Hero({ onCta }) {
  return (
    <div className="relative z-[1] flex min-h-screen flex-col items-center justify-center px-6 pb-20 pt-[120px] text-center max-md:min-h-0 max-md:px-5 max-md:pb-14 max-md:pt-[88px] max-[480px]:pb-12">
      <div className="mb-7 inline-flex animate-fadeUp-fast items-center gap-2 rounded-full border border-blue/25 bg-blue/10 px-[14px] py-[5px] text-[13px] font-semibold text-blue max-md:mb-5 max-md:text-[12px]">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan" /> Infraestructura inteligente y visual
      </div>
      <h1
        className="max-w-[900px] animate-fadeUp text-[clamp(40px,7vw,80px)] font-black leading-[1.08] tracking-[-.04em] max-md:tracking-[-.03em]"
        style={{ animationDelay: '.1s' }}
      >
        Diseña y despliega
        <br />
        <span className="text-grad2">infraestructura real</span>
        <br />
        en minutos
      </h1>
      <p
        className="mt-5 max-w-[580px] animate-fadeUp text-[clamp(16px,2.5vw,20px)] leading-[1.65] text-muted max-md:max-w-full max-md:text-[16px]"
        style={{ animationDelay: '.2s' }}
      >
        Arrastra nodos, conecta servicios, y exporta Docker Compose, Terraform y scripts de producción listos para usar. Con un asistente DevOps en Telegram que monitorea tu infra.
      </p>
      <div
        className="mt-10 flex flex-wrap justify-center gap-[14px] animate-fadeUp max-md:mt-7 max-md:flex-col max-md:items-stretch max-md:gap-2.5"
        style={{ animationDelay: '.3s' }}
      >
        <button
          onClick={onCta}
          className="inline-flex cursor-pointer items-center gap-2.5 rounded-[14px] bg-grad px-7 py-[14px] font-[inherit] text-[16px] font-bold text-white no-underline shadow-glow transition-all hover:-translate-y-0.5 hover:shadow-glow-lg max-md:w-full max-md:justify-center max-md:px-5 max-md:text-[15px]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
          Empezar gratis
        </button>
        <a
          href="#features"
          className="inline-flex cursor-pointer items-center gap-2.5 rounded-[14px] border border-border2 bg-transparent px-7 py-[14px] font-[inherit] text-[16px] font-semibold text-text no-underline transition-all hover:border-blue hover:bg-blue/[.06] hover:text-blue max-md:w-full max-md:justify-center"
        >
          Ver características →
        </a>
      </div>
      <CanvasMock />
    </div>
  );
}
