const FEATURES = [
  { icon: '🎨', title: 'Canvas drag-and-drop', desc: 'Diseña tu arquitectura visualmente. Arrastra nodos, conecta servicios, organiza en redes. Sin código.' },
  { icon: '📦', title: 'Export completo a IaC', desc: 'Genera Docker Compose, Terraform, scripts de setup, Traefik, backups automáticos y Makefile en un ZIP.' },
  { icon: '☁️', title: 'Private Cloud + GCP', desc: 'Soporte para Hetzner, DigitalOcean, Vultr y Google Cloud Platform con Terraform nativo para cada proveedor.' },
  { icon: '🤖', title: 'Asistente DevOps IA', desc: 'Bot de Telegram que monitorea tu infra 24/7. Si algo falla, Gemini AI diagnostica el error y sugiere la solución.' },
  { icon: '💻', title: 'CLI Agentic', desc: 'CLI con salidas JSON para integrar InfraDraw en tus pipelines de CI/CD o flujos de IA automatizados.' },
  { icon: '🔒', title: 'Seguridad por defecto', desc: 'El validador de arquitectura detecta riesgos de seguridad y cuellos de botella de RAM en tiempo real al diseñar.' },
];

export default function Features() {
  return (
    <section
      id="features"
      className="relative z-[1] border-y border-border bg-surface px-6 py-24 max-md:px-5 max-md:py-16 max-[480px]:px-4 max-[480px]:py-[52px]"
    >
      <div className="mx-auto max-w-[1100px]">
        <div className="mb-[14px] text-[12px] font-bold uppercase tracking-[.12em] text-blue">Características</div>
        <h2 className="max-w-[640px] text-[clamp(28px,4vw,46px)] font-extrabold leading-[1.15] tracking-[-.03em] max-md:max-w-full">
          Todo lo que necesitas para producción
        </h2>
        <p className="mt-4 max-w-[520px] text-[17px] leading-[1.65] text-muted max-md:max-w-full max-md:text-[15px]">
          De un diagrama visual a un stack completo de producción en segundos, no en días.
        </p>
        <div className="mt-14 grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5 max-lg:grid-cols-[repeat(auto-fill,minmax(260px,1fr))] max-md:mt-9 max-md:grid-cols-1 max-md:gap-[14px] max-[480px]:gap-2.5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-border bg-bg p-7 transition-all hover:-translate-y-1 hover:border-blue hover:shadow-[0_12px_40px_rgba(79,140,255,.1)] max-md:p-[22px] max-[480px]:p-[18px]"
            >
              <div className="mb-4 text-[28px] max-md:mb-3 max-md:text-[24px]">{f.icon}</div>
              <div className="mb-2 text-[17px] font-bold max-md:text-[16px]">{f.title}</div>
              <div className="text-[14px] leading-[1.6] text-muted">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
