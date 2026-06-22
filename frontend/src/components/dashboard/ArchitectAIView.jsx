import { useEffect, useRef, useState } from 'react';
import { Icon } from '../DashboardWidgets.jsx';

const EXAMPLES = [
  { icon: '🟢', title: 'Generar stack MERN', desc: 'MongoDB + Express + React + Node con balanceador y CDN.' },
  { icon: '☸️', title: 'Crear clúster k8s básico', desc: '3 nodos, ingress NGINX, autoescalado y monitoreo.' },
  { icon: '🐳', title: 'Entorno Docker aislado', desc: 'Redes public / internal / db con healthchecks.' },
  { icon: '📊', title: 'Stack de observabilidad', desc: 'Prometheus + Grafana + Loki para métricas y logs.' },
];

const CHIPS = ['API Node + Postgres + Redis', 'Pipeline CI/CD con runners', 'Microservicios con gRPC'];

function buildReply(prompt) {
  return [
    `He diseñado una topología para "${prompt}".`,
    '',
    'Componentes propuestos:',
    '• Balanceador de carga + CDN en la red pública',
    '• 2 instancias de aplicación con autoescalado',
    '• Base de datos gestionada con réplica de lectura',
    '• Caché en memoria y healthchecks por servicio',
    '',
    'Costo estimado: ~$86/mes · lista para abrir en el editor.',
  ].join('\n');
}

function Spinner() {
  return <span className="h-[15px] w-[15px] animate-spin-fast rounded-full border-2 border-white/30 border-t-white" />;
}

function Empty({ onPick }) {
  return (
    <div className="flex h-full flex-col items-center justify-center py-8 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-grad text-white shadow-glow">
        <Icon.spark className="h-8 w-8" />
      </div>
      <h2 className="text-[22px] font-extrabold tracking-[-.5px] text-text">Architect AI</h2>
      <p className="mt-2 max-w-[460px] text-[14px] leading-[1.6] text-muted">
        Describe tu infraestructura en lenguaje natural y la generaré como un diagrama listo para desplegar.
      </p>
      <div className="mt-7 grid w-full max-w-[680px] grid-cols-2 gap-3 max-sm:grid-cols-1">
        {EXAMPLES.map((ex) => (
          <button
            key={ex.title}
            onClick={() => onPick(ex.title)}
            className="group flex items-start gap-3 rounded-xl border border-border bg-surface2/50 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-blue/60 hover:bg-surface2"
          >
            <span className="text-[22px] leading-none">{ex.icon}</span>
            <span className="min-w-0">
              <span className="block text-[14px] font-bold text-text">{ex.title}</span>
              <span className="mt-0.5 block text-[12px] leading-[1.5] text-muted">{ex.desc}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function UserBubble({ text }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[78%] rounded-2xl rounded-br-md bg-grad px-4 py-2.5 text-[14px] leading-[1.6] text-white shadow-accent">
        {text}
      </div>
    </div>
  );
}

function AiBubble({ text }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-grad text-white shadow-accent">
        <Icon.spark className="h-[18px] w-[18px]" />
      </div>
      <div className="max-w-[78%] rounded-2xl rounded-tl-md border border-border bg-surface2/70 px-4 py-3 text-[14px] leading-[1.65] text-text">
        <div className="whitespace-pre-wrap">{text}</div>
        <a
          href="/canvas.html"
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-blue/40 bg-blue/10 px-3 py-1.5 text-[12px] font-bold text-blue transition-colors hover:bg-blue/20"
        >
          Abrir en el editor →
        </a>
      </div>
    </div>
  );
}

function Typing() {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-grad text-white shadow-accent">
        <Icon.spark className="h-[18px] w-[18px]" />
      </div>
      <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-md border border-border bg-surface2/70 px-4 py-3.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 animate-pulse rounded-full bg-muted"
            style={{ animationDelay: `${i * 160}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

export default function ArchitectAIView({ plan = 'free' }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, sending]);

  function send(text) {
    const prompt = (text ?? input).trim();
    if (!prompt || sending) return;
    setMessages((m) => [...m, { role: 'user', text: prompt }]);
    setInput('');
    setSending(true);
    timerRef.current = setTimeout(() => {
      setMessages((m) => [...m, { role: 'ai', text: buildReply(prompt) }]);
      setSending(false);
    }, 1300);
  }

  const hasChat = messages.length > 0;

  return (
    <div className="flex animate-fadeIn flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-extrabold tracking-[-.5px] text-text max-md:text-[18px]">Architect AI</h1>
          <p className="mt-0.5 text-[13px] text-muted">Tu copiloto de arquitectura. Del prompt al diagrama.</p>
        </div>
        <span
          className={[
            'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider',
            plan === 'pro' ? 'border border-blue/35 bg-blue/15 text-blue' : 'border border-muted/20 bg-muted/10 text-muted',
          ].join(' ')}
        >
          {plan === 'pro' ? '⭐ PRO' : 'Demo'}
        </span>
      </header>

      <div className="flex min-h-[62vh] flex-col overflow-hidden rounded-2xl border border-border bg-surface/60 backdrop-blur-md">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 max-md:p-4">
          {hasChat ? (
            <div className="flex flex-col gap-4">
              {messages.map((msg, i) =>
                msg.role === 'user' ? <UserBubble key={i} text={msg.text} /> : <AiBubble key={i} text={msg.text} />
              )}
              {sending && <Typing />}
            </div>
          ) : (
            <Empty onPick={send} />
          )}
        </div>

        <div className="border-t border-border p-4">
          {!hasChat && (
            <div className="mb-3 flex flex-wrap gap-2">
              {CHIPS.map((c) => (
                <button
                  key={c}
                  onClick={() => send(c)}
                  className="rounded-full border border-border bg-surface2/60 px-3 py-1.5 text-[12px] font-semibold text-muted transition-colors hover:border-blue/50 hover:text-text"
                >
                  {c}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-end gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              placeholder="Describe tu infraestructura… (ej: API Node con Postgres y Redis)"
              className="max-h-[140px] min-h-[46px] w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-[14px] leading-[1.5] text-text outline-none transition-colors placeholder:text-dim focus:border-blue"
            />
            <button
              onClick={() => send()}
              disabled={sending || !input.trim()}
              className="inline-flex h-[46px] shrink-0 items-center gap-2 rounded-xl bg-grad px-5 text-[14px] font-bold text-white shadow-accent transition-all hover:-translate-y-px hover:shadow-accent-hover disabled:cursor-not-allowed disabled:opacity-50 max-md:px-4"
            >
              {sending ? <Spinner /> : <Icon.spark className="h-4 w-4" />}
              <span className="max-md:hidden">Generar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
