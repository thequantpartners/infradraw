import { useState } from 'react';

function relativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'ahora mismo';
  if (m < 60) return 'hace ' + m + ' min';
  const hh = Math.floor(m / 60);
  if (hh < 24) return 'hace ' + hh + 'h';
  const d = Math.floor(hh / 24);
  if (d < 30) return 'hace ' + d + (d === 1 ? ' día' : ' días');
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

const ICON_SAMPLES = ['🔀', '▲', '⚙️', '🤖', '🐘', '🔴', '☁️', '🖥️', '⚖️', '🪣', '🔥', '📊', '⚡', '🎛️'];

export default function ProjectCard({ project, onOpen, onDelete, onRename }) {
  const [renaming, setRenaming] = useState(false);
  const [renameVal, setRenameVal] = useState(project.name);

  function startRename(e) {
    e.stopPropagation();
    setRenameVal(project.name);
    setRenaming(true);
  }
  function commitRename() {
    const v = renameVal.trim() || project.name;
    setRenaming(false);
    if (v !== project.name) onRename(project.id, v);
  }

  const count = Math.min(project.nodeCount || 0, 4);
  const icons = ICON_SAMPLES.slice(0, Math.max(count, 1));

  return (
    <div
      className="group flex cursor-pointer flex-col overflow-hidden rounded-[20px] border border-border bg-surface/70 shadow-card backdrop-blur-[8px] transition-all duration-[250ms] [transition-timing-function:cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-1 hover:border-blue hover:shadow-card-hover max-md:rounded-2xl"
      onClick={() => {
        if (!renaming) onOpen(project.id);
      }}
    >
      {/* preview */}
      <div className="relative flex h-[140px] items-center justify-center overflow-hidden border-b border-border bg-[linear-gradient(180deg,#111c2e_0%,rgba(17,28,46,0.4)_100%)]">
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage:
              'linear-gradient(#1e2d44 1px,transparent 1px),linear-gradient(90deg,#1e2d44 1px,transparent 1px)',
            backgroundSize: '16px 16px',
          }}
        />
        {project.nodeCount > 0 ? (
          <div className="z-[1] flex flex-wrap items-center justify-center gap-2 p-4">
            {icons.map((ic, i) => (
              <div
                key={i}
                className="flex items-center justify-center rounded-[10px] border border-border bg-[rgba(30,45,68,0.6)] px-3 py-2 text-[14px] shadow-[0_4px_10px_rgba(0,0,0,0.1)] backdrop-blur-[4px]"
              >
                <span style={{ fontSize: 16 }}>{ic}</span>
              </div>
            ))}
            {project.nodeCount > 4 && (
              <div className="flex items-center justify-center rounded-[10px] border border-border bg-[rgba(30,45,68,0.6)] px-3 py-2 text-[14px] shadow-[0_4px_10px_rgba(0,0,0,0.1)] backdrop-blur-[4px]">
                <span>+{project.nodeCount - 4}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="z-[1] text-[44px] text-muted opacity-40 transition-transform group-hover:scale-110">🗂️</div>
        )}
      </div>
      {/* body */}
      <div className="flex flex-1 flex-col gap-3 p-[22px] max-md:p-4">
        {renaming ? (
          <input
            className="w-full rounded-lg border border-blue bg-surface2 px-2.5 py-1 font-[inherit] text-[18px] font-bold text-text outline-none"
            value={renameVal}
            autoFocus
            onChange={(e) => setRenameVal(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename();
              if (e.key === 'Escape') setRenaming(false);
              e.stopPropagation();
            }}
          />
        ) : (
          <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[18px] font-bold text-text">
            {project.name}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2 text-[12px] text-muted">
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-[rgba(30,45,68,0.4)] px-2.5 py-1 font-semibold text-muted">
            📌 {project.nodeCount || 0} nodos
          </span>
          {project.areaCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-[rgba(30,45,68,0.4)] px-2.5 py-1 font-semibold text-muted">
              🔲 {project.areaCount} áreas
            </span>
          )}
          <span className="ml-auto text-[11px] text-muted">{relativeTime(project.updatedAt || project.createdAt)}</span>
        </div>
      </div>
      {/* footer */}
      <div className="flex items-center gap-2.5 border-t border-border bg-[rgba(6,11,20,0.2)] px-[22px] py-4 max-md:px-4 max-md:py-3">
        <button
          className="flex-1 cursor-pointer rounded-[10px] border-none bg-grad py-2.5 text-center font-[inherit] text-[14px] font-bold text-white shadow-accent transition-all hover:opacity-95 hover:shadow-[0_6px_16px_rgba(79,140,255,0.3)]"
          onClick={(e) => {
            e.stopPropagation();
            onOpen(project.id);
          }}
        >
          Abrir →
        </button>
        <button
          title="Renombrar"
          className="flex h-[38px] w-[38px] cursor-pointer items-center justify-center rounded-[10px] border border-border bg-surface2 text-[14px] text-muted transition-all hover:border-blue hover:bg-blue/[.05] hover:text-blue"
          onClick={startRename}
        >
          ✏️
        </button>
        <button
          title="Eliminar proyecto"
          className="flex h-[38px] w-[38px] cursor-pointer items-center justify-center rounded-[10px] border border-border bg-surface2 text-[14px] text-muted transition-all hover:border-danger hover:bg-danger/[.05] hover:text-danger"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(project.id, project.name);
          }}
        >
          🗑️
        </button>
      </div>
    </div>
  );
}
