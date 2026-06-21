import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// OAuth 2.0 Client ID público (NO es un secreto). Debe coincidir con el
// GOOGLE_CLIENT_ID configurado en el backend.
const GOOGLE_CLIENT_ID = '770982235695-impn8mtfa5msq8jplk0ht5pct6as8p3f.apps.googleusercontent.com';

export default function LoginModal({ open, onClose }) {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const gsiContainerRef = useRef(null);
  const touchStartY = useRef(0);

  // Canjea la credencial de Google por nuestro JWT y entra al dashboard.
  async function handleGoogleCredential(response) {
    setError('');
    try {
      const r = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      });
      const data = await r.json();
      if (!r.ok || !data.token) {
        throw new Error(data.error || 'No se pudo iniciar sesión.');
      }
      localStorage.setItem('token', data.token);
      
      // Decodificar el token para revisar si es el superadmin
      const base64Url = data.token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(decodeURIComponent(atob(base64).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')));
      
      if (payload.email === 'thequantpartners@gmail.com') {
        navigate('/admin');
      } else {
        navigate('/app');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message);
    }
  }

  // Inicializa GIS y renderiza el botón oficial cuando el modal se abre.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    function initGsi() {
      if (cancelled) return;
      if (!window.google || !window.google.accounts || !window.google.accounts.id) {
        setTimeout(initGsi, 100);
        return;
      }
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
      });
      const container = gsiContainerRef.current;
      if (container) {
        container.innerHTML = '';
        window.google.accounts.id.renderButton(container, {
          theme: 'filled_blue',
          size: 'large',
          shape: 'pill',
          text: 'continue_with',
          logo_alignment: 'center',
          width: 280,
        });
      }
    }
    initGsi();
    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 backdrop-blur-[8px] max-md:items-end"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-[90%] max-w-[420px] animate-fadeIn rounded-[20px] border border-border2 bg-surface p-10 text-center max-md:w-full max-md:max-w-full max-md:animate-slideUp max-md:rounded-b-none max-md:rounded-t-[16px] max-md:p-8"
        onTouchStart={(e) => {
          touchStartY.current = e.touches[0].clientY;
        }}
        onTouchEnd={(e) => {
          if (e.changedTouches[0].clientY - touchStartY.current > 60) onClose();
        }}
      >
        <div className="mx-auto mb-5 hidden h-1 w-10 rounded bg-border2 max-md:block" />
        <div className="mb-4 text-[48px] max-md:text-[40px]">🛸</div>
        <div className="mb-2 text-[22px] font-extrabold max-md:text-[20px]">Bienvenido a InfraDraw</div>
        <div className="mb-7 text-[15px] leading-[1.6] text-muted max-md:mb-[22px] max-md:text-[14px]">
          Inicia sesión con tu cuenta de Google para empezar a diseñar infraestructura en minutos.
        </div>
        <div ref={gsiContainerRef} className="flex min-h-[44px] justify-center" />
        {error && <div className="mt-2.5 text-[13px] text-danger">{error}</div>}
        <div className="mt-4 cursor-pointer text-[13px] text-muted hover:text-text" onClick={onClose}>
          Cancelar
        </div>
      </div>
    </div>
  );
}
