export default function Toast({ message }) {
  return (
    <div className="fixed bottom-8 right-8 z-[100] flex animate-slideIn items-center gap-2 rounded-xl border border-border bg-surface2 px-5 py-[14px] text-[14px] font-semibold text-text shadow-toast">
      ✓ {message}
    </div>
  );
}
