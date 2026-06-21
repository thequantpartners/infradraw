function Yes({ children }) {
  return (
    <div className="flex items-start gap-2.5 text-[14px] text-muted max-[480px]:text-[13px]">
      <span className="mt-0.5 shrink-0 text-green">✓</span>
      <span>{children}</span>
    </div>
  );
}

function No({ children }) {
  return (
    <div className="flex items-start gap-2.5 text-[14px] text-muted max-[480px]:text-[13px]">
      <span className="mt-0.5 shrink-0 text-dim">✗</span>
      <span className="opacity-50">{children}</span>
    </div>
  );
}

export default function Pricing({ onFree, onPro }) {
  return (
    <section
      id="pricing"
      className="relative z-[1] border-t border-border bg-surface px-6 py-24 max-md:px-5 max-md:py-16 max-[480px]:px-4 max-[480px]:py-[52px]"
    >
      <div className="mx-auto max-w-[900px] text-center">
        <div className="mb-[14px] text-[12px] font-bold uppercase tracking-[.12em] text-blue">Precios</div>
        <h2 className="mx-auto text-center text-[clamp(28px,4vw,46px)] font-extrabold leading-[1.15] tracking-[-.03em]">
          Comienza gratis, escala cuando lo necesites
        </h2>
        <p className="mx-auto mt-4 text-center text-[17px] leading-[1.65] text-muted max-md:text-[15px]">
          Sin tarjeta de crédito para empezar. Cancela en cualquier momento.
        </p>
        <div className="mt-14 grid grid-cols-2 gap-6 max-lg:gap-4 max-md:mt-10 max-md:grid-cols-1 max-md:gap-7">
          {/* FREE */}
          <div className="relative rounded-[20px] border border-border bg-bg px-8 py-9 text-left transition-all hover:-translate-y-1 max-md:px-6 max-md:py-7 max-[480px]:px-5 max-[480px]:py-6">
            <div className="mb-3 text-[13px] font-bold uppercase tracking-[.08em] text-muted">Free</div>
            <div className="text-[48px] font-black leading-none tracking-[-.04em] max-md:text-[40px]">
              <span className="mt-2 inline-block align-top text-[24px]">$</span>0
              <span className="text-[16px] font-medium text-muted">/mes</span>
            </div>
            <div className="mt-3 text-[14px] leading-[1.6] text-muted">Perfecto para proyectos personales y explorar InfraDraw.</div>
            <hr className="my-6 border-t border-border" />
            <div className="mb-7 flex flex-col gap-2.5 max-[480px]:gap-2">
              <Yes>Hasta <strong className="text-text">3 proyectos</strong></Yes>
              <Yes><strong className="text-text">Private Cloud</strong> (Hetzner, DO, Vultr, etc.)</Yes>
              <Yes>Export completo a Docker Compose + Terraform</Yes>
              <Yes>DevOps Bot: <strong className="text-text">check semanal</strong> + alerta de errores</Yes>
              <Yes>Tu propia API key de Gemini</Yes>
              <No>Google Cloud (GCP)</No>
              <No>Auto-escalado automático</No>
              <No>Chequeos configurables (horario/diario)</No>
            </div>
            <button
              onClick={onFree}
              className="block w-full cursor-pointer rounded-xl border border-border2 bg-surface2 py-[14px] text-center font-[inherit] text-[15px] font-bold text-text no-underline transition-all hover:border-blue hover:bg-blue/[.06] hover:text-blue"
            >
              Empezar gratis →
            </button>
          </div>
          {/* PRO */}
          <div className="relative rounded-[20px] border border-blue bg-bg px-8 py-9 text-left shadow-pro-card transition-all hover:-translate-y-1 max-md:order-first max-md:px-6 max-md:py-7 max-[480px]:px-5 max-[480px]:py-6">
            <div className="absolute -top-[13px] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-grad px-4 py-1 text-[12px] font-bold text-white">
              ⭐ MÁS POPULAR
            </div>
            <div className="mb-3 text-[13px] font-bold uppercase tracking-[.08em] text-blue">PRO</div>
            <div className="text-[48px] font-black leading-none tracking-[-.04em] max-md:text-[40px]">
              <span className="text-grad mt-2 inline-block align-top text-[24px]">$</span>
              <span className="text-grad">99</span>
              <span className="text-[16px] font-medium text-muted">/mes</span>
            </div>
            <div className="mt-3 text-[14px] leading-[1.6] text-muted">Para equipos y productos en producción que necesitan el control total.</div>
            <hr className="my-6 border-t border-border" />
            <div className="mb-7 flex flex-col gap-2.5 max-[480px]:gap-2">
              <Yes><strong className="text-text">Proyectos ilimitados</strong></Yes>
              <Yes>Private Cloud completo</Yes>
              <Yes>Export completo a Docker Compose + Terraform</Yes>
              <Yes><strong className="text-text">Google Cloud Platform (GCP)</strong> nativo</Yes>
              <Yes>DevOps Bot: chequeos <strong className="text-text">configurables</strong> (horario/diario/semanal)</Yes>
              <Yes><strong className="text-text">Auto-escalado automático</strong> de VMs en GCP</Yes>
              <Yes>API key de Gemini incluida en el sistema</Yes>
              <Yes>Soporte prioritario</Yes>
            </div>
            <button
              onClick={onPro}
              className="block w-full cursor-pointer rounded-xl bg-grad py-[14px] text-center font-[inherit] text-[15px] font-bold text-white no-underline shadow-glow transition-all hover:-translate-y-px hover:opacity-90"
            >
              Obtener PRO →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
