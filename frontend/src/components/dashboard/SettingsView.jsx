import { useState } from 'react';
import { Panel } from '../DashboardWidgets.jsx';

function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-semibold text-muted">{label}</span>
      <input
        {...props}
        className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-[13px] text-text outline-none transition-colors placeholder:text-dim focus:border-blue"
      />
    </label>
  );
}

function SecretField({ label, value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-semibold text-muted">{label}</span>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 pr-16 font-mono text-[13px] text-text outline-none transition-colors placeholder:text-dim focus:border-blue"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-[11px] font-semibold text-muted transition-colors hover:text-text"
        >
          {show ? 'Ocultar' : 'Ver'}
        </button>
      </div>
    </label>
  );
}

function SaveButton({ onClick, children = 'Guardar cambios' }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-xl bg-grad px-4 py-2.5 text-[13px] font-bold text-white shadow-accent transition-all hover:-translate-y-px hover:shadow-accent-hover"
    >
      {children}
    </button>
  );
}

function IntegrationHeader({ logo, name, connected }) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface2 text-[18px]">{logo}</span>
      <span className="text-[14px] font-bold text-text">{name}</span>
      <span
        className={[
          'ml-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold',
          connected ? 'bg-emerald/10 text-emerald' : 'bg-muted/10 text-muted',
        ].join(' ')}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-emerald' : 'bg-muted'}`} />
        {connected ? 'Conectado' : 'Sin conectar'}
      </span>
    </div>
  );
}

export default function SettingsView({ session, plan = 'starter', onToast }) {
  const [name, setName] = useState(session?.name || '');
  const [email, setEmail] = useState(session?.email || '');
  const [gcpProject, setGcpProject] = useState('infradraw-prod-01');
  const [gcpKey, setGcpKey] = useState('');
  const [tgToken, setTgToken] = useState('');

  const isPaid = plan !== 'free' && plan !== 'starter';
  const save = (msg) => onToast?.(msg);
  const initial = (name || session?.name || 'U')[0]?.toUpperCase();

  return (
    <div className="flex animate-fadeIn flex-col gap-5">
      <header>
        <h1 className="text-[20px] font-extrabold tracking-[-.5px] text-text max-md:text-[18px]">Ajustes</h1>
        <p className="mt-0.5 text-[13px] text-muted">Gestiona tu perfil, plan e integraciones de infraestructura.</p>
      </header>

      <div className="grid grid-cols-[1.4fr_1fr] items-start gap-5 max-lg:grid-cols-1">
        {/* Columna izquierda */}
        <div className="flex flex-col gap-5">
          {/* Perfil */}
          <Panel title="Perfil">
            <div className="mb-5 flex items-center gap-4">
              {session?.photo ? (
                <img src={session.photo} className="h-16 w-16 rounded-full border-2 border-border object-cover" alt="" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-grad text-[24px] font-extrabold text-white shadow-accent">
                  {initial}
                </div>
              )}
              <div className="min-w-0">
                <div className="truncate text-[15px] font-bold text-text">{name || 'Operador'}</div>
                <div className="truncate text-[12px] text-muted">{email || 'sin correo'}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
              <Field label="Nombre" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" />
              <Field label="Correo" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" />
            </div>
            <div className="mt-5 flex justify-end">
              <SaveButton onClick={() => save('Perfil actualizado')} />
            </div>
          </Panel>

          {/* Integraciones */}
          <Panel title="Integraciones">
            <div className="rounded-xl border border-border bg-surface2/40 p-4">
              <IntegrationHeader logo="☁️" name="Google Cloud" connected={true} />
              <div className="flex flex-col gap-3">
                <Field
                  label="Project ID"
                  value={gcpProject}
                  onChange={(e) => setGcpProject(e.target.value)}
                  placeholder="mi-proyecto-gcp"
                />
                <SecretField
                  label="Service Account Key (JSON)"
                  value={gcpKey}
                  onChange={(e) => setGcpKey(e.target.value)}
                  placeholder="••••••••••••••••••••"
                />
              </div>
              <div className="mt-4 flex justify-end">
                <SaveButton onClick={() => save('Google Cloud guardado')}>Conectar</SaveButton>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-border bg-surface2/40 p-4">
              <IntegrationHeader logo="✈️" name="Bot de Telegram" connected={true} />
              <SecretField
                label="Token del bot"
                value={tgToken}
                onChange={(e) => setTgToken(e.target.value)}
                placeholder="123456789:AA–token–de–ejemplo"
              />
              <p className="mt-2 text-[11px] leading-[1.5] text-dim">
                Recibe alertas y controla tu infraestructura desde Telegram (Autopilot).
              </p>
              <div className="mt-4 flex justify-end">
                <SaveButton onClick={() => save('Bot de Telegram guardado')}>Conectar</SaveButton>
              </div>
            </div>
          </Panel>
        </div>

        {/* Columna derecha */}
        <aside className="flex flex-col gap-5">
          <Panel title="Suscripción">
            <div className="flex items-center gap-3">
              <span
                className={[
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-extrabold uppercase tracking-wider',
                  'border border-blue/35 bg-blue/15 text-blue'
                ].join(' ')}
              >
                {plan === 'free' ? 'TRIAL 14 DÍAS' : plan.toUpperCase()}
              </span>
              <div className="min-w-0">
                <div className="text-[14px] font-bold text-text">Plan {plan === 'free' ? 'Starter (Trial)' : plan.charAt(0).toUpperCase() + plan.slice(1)}</div>
                <div className="text-[12px] text-muted">
                  Renovación el 21 jul 2026
                </div>
              </div>
            </div>

            <ul className="mt-4 space-y-2 text-[13px]">
              {[
                'Proyectos ilimitados',
                'Architect AI + simulador de costos',
                'Bot de Telegram y Autopilot',
              ].map((f) => (
                <li key={f} className="flex items-center gap-2 text-muted">
                  <span className="text-emerald">✓</span>
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => save('Abriendo portal de facturación…')}
              className="mt-5 block w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-center text-[13px] font-bold text-text transition-colors hover:border-blue hover:text-blue"
            >
              Gestionar suscripción
            </button>
          </Panel>

          <Panel title="Preferencias">
            <ul className="flex flex-col divide-y divide-border/60">
              {[
                { label: 'Alertas por correo', desc: 'Recibe avisos de incidencias', on: true },
                { label: 'Modo oscuro', desc: 'Tema premium del cockpit', on: true },
                { label: 'Telemetría anónima', desc: 'Ayuda a mejorar InfraDraw', on: false },
              ].map((p) => (
                <li key={p.label} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0 pr-3">
                    <div className="text-[13px] font-semibold text-text">{p.label}</div>
                    <div className="text-[11px] text-dim">{p.desc}</div>
                  </div>
                  <Toggle defaultOn={p.on} />
                </li>
              ))}
            </ul>
          </Panel>
        </aside>
      </div>
    </div>
  );
}

function Toggle({ defaultOn = false }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      type="button"
      onClick={() => setOn((v) => !v)}
      className={[
        'relative h-6 w-11 shrink-0 rounded-full transition-colors',
        on ? 'bg-grad' : 'bg-surface2 border border-border',
      ].join(' ')}
    >
      <span
        className={[
          'absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white shadow transition-all',
          on ? 'left-[24px]' : 'left-1',
        ].join(' ')}
      />
    </button>
  );
}
