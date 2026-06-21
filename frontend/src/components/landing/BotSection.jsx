const BOT_FEATURES = [
  'Chequeos de salud configurables (cada 5 min)',
  'Diagnóstico con Gemini AI de logs de contenedores',
  'Heartbeat horario de "Todo OK"',
  'Auto-escalado de VMs en GCP con un botón',
  'Chat directo para consultas DevOps',
];

export default function BotSection() {
  return (
    <section className="relative z-[1] px-6 py-24 max-md:px-5 max-md:py-16 max-[480px]:px-4 max-[480px]:py-[52px]">
      <div className="mx-auto grid max-w-[1100px] grid-cols-2 items-center gap-16 max-lg:gap-10 max-md:grid-cols-1 max-md:gap-9">
        {/* Phone */}
        <div className="overflow-hidden rounded-[20px] border border-border2 bg-surface shadow-phone max-md:order-2">
          <div className="flex items-center gap-3 border-b border-border bg-surface2 px-5 py-4">
            <div className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-grad text-[18px]">🤖</div>
            <div>
              <div className="text-[15px] font-bold">InfraDraw DevOps Bot</div>
              <div className="text-[12px] text-green">● En línea</div>
            </div>
          </div>
          <div className="flex flex-col gap-2.5 p-4">
            <div className="max-w-[85%] self-start rounded-[12px_12px_12px_4px] border border-border bg-surface2 px-[14px] py-2.5 text-[13px] leading-[1.5] text-text max-md:text-[12px]">
              🟢 <strong>Heartbeat Horario:</strong> Todos los chequeos de salud reportan "Todo OK". Recursos normales.
            </div>
            <div className="max-w-[85%] self-start rounded-[12px_12px_12px_4px] border border-danger/25 bg-danger/10 px-[14px] py-2.5 text-[13px] leading-[1.5] text-[#fca5a5] max-md:text-[12px]">
              ⚠️ <strong>ALERTA:</strong> El contenedor <code>api-backend</code> está caído.
              <br />
              <br />
              🤖 <strong>Diagnóstico (Gemini AI):</strong> El proceso crasheó por falta de memoria (OOM). Se recomienda aumentar los límites de RAM del contenedor o escalar el servidor.
            </div>
            <div className="mt-1.5 flex gap-1.5 self-start">
              <button className="cursor-pointer rounded-lg border border-blue2 bg-blue px-3 py-1.5 text-[12px] font-semibold text-white max-md:px-2.5 max-md:py-[5px] max-md:text-[11px]">
                👍 Aplicar Solución
              </button>
              <button className="cursor-pointer rounded-lg border border-border2 bg-surface px-3 py-1.5 text-[12px] font-semibold text-text max-md:px-2.5 max-md:py-[5px] max-md:text-[11px]">
                👎 Yo lo soluciono
              </button>
              <button className="cursor-pointer rounded-lg border border-border2 bg-surface px-3 py-1.5 text-[12px] font-semibold text-text max-md:px-2.5 max-md:py-[5px] max-md:text-[11px]">
                💡 Alternativa
              </button>
            </div>
            <div className="max-w-[85%] self-start rounded-[12px_12px_12px_4px] border border-border bg-surface2 px-[14px] py-2.5 text-[13px] leading-[1.5] text-text max-md:text-[12px]">
              ✅ Instancia escalada a <strong>e2-standard-2</strong> en GCP correctamente.
            </div>
          </div>
        </div>
        {/* Text */}
        <div className="max-md:order-1">
          <div className="mb-[14px] text-[12px] font-bold uppercase tracking-[.12em] text-blue">DevOps Bot en Telegram</div>
          <h2 className="max-w-[640px] text-[clamp(28px,4vw,46px)] font-extrabold leading-[1.15] tracking-[-.03em] max-md:max-w-full">
            Tu infraestructura, vigilada 24/7
          </h2>
          <p className="mt-4 max-w-[520px] text-[17px] leading-[1.65] text-muted max-md:max-w-full max-md:text-[15px]">
            El bot monitorea CPU, RAM, disco y contenedores. Si algo falla, Gemini AI analiza los logs y te envía un diagnóstico con propuesta de solución directamente a Telegram. Tú decides si aplicarla o no.
          </p>
          <br />
          <div className="mt-2 flex flex-col gap-3">
            {BOT_FEATURES.map((f) => (
              <div key={f} className="flex items-start gap-2.5 text-[14px] text-muted">
                <span className="mt-0.5 shrink-0 text-green">✓</span> {f}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
