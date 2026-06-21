export default function UpgradeBanner({ count }) {
  return (
    <div className="mb-8 flex animate-fadeIn items-center justify-between gap-4 rounded-2xl border border-blue/25 bg-[linear-gradient(90deg,rgba(79,140,255,0.1)_0%,rgba(124,90,240,0.1)_100%)] px-6 py-4 text-[14px] text-[#a5b4fc] shadow-[0_8px_32px_rgba(0,0,0,0.2)] max-md:flex-col max-md:items-start max-md:rounded-xl max-md:p-4">
      <span>🚀 Estás en el plan FREE — {count}/3 proyectos. </span>
      <a
        href="/#pricing"
        className="rounded-lg bg-grad px-4 py-2 text-[13px] font-bold text-white no-underline shadow-accent transition-all hover:-translate-y-px hover:shadow-accent-hover max-md:w-full max-md:text-center"
      >
        Actualizar a PRO →
      </a>
    </div>
  );
}
