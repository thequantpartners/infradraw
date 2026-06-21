const SHIMMER =
  'bg-[linear-gradient(90deg,#111c2e_25%,#222d3e_50%,#111c2e_75%)] bg-[length:200%_100%] animate-shimmer rounded-lg';

export default function Skeleton() {
  return (
    <div className="h-[300px] overflow-hidden rounded-[20px] border border-border bg-surface/70">
      <div className={`h-[140px] ${SHIMMER}`} />
      <div className="flex flex-col gap-3 p-[22px]">
        <div className={`h-4 w-full ${SHIMMER}`} />
        <div className={`h-4 w-1/2 ${SHIMMER}`} />
      </div>
      <div className={`h-[70px] border-t border-border ${SHIMMER}`} />
    </div>
  );
}
