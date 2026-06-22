// Sesión basada en nuestro JWT (localStorage). Sin Firebase.
// Replica 1:1 la lógica de app.html (decodeJwt, guard, authHeaders) y de
// landing.html (redirect si ya hay sesión).

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function decodeJwt(t) {
  try {
    const b = t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(b)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

export function getToken() {
  return localStorage.getItem('token') || '';
}

// Devuelve la sesión decodificada y validada (no expirada), o null.
export function getSession() {
  const token = getToken();
  if (!token) return null;
  const payload = decodeJwt(token);
  if (!payload || (payload.exp && payload.exp * 1000 < Date.now())) return null;
  return {
    token,
    name: payload.name || payload.email || '',
    email: payload.email || '',
    photo: payload.picture || '',
    plan: payload.tier || 'free',
  };
}

export function isAuthenticated() {
  return getSession() !== null;
}

export function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: 'Bearer ' + getToken() };
}

export function logout(navigate) {
  localStorage.removeItem('token');
  if (navigate) navigate('/');
  else window.location.href = '/';
}

// --- Estado de onboarding (simulado en el frontend, por usuario) ---
// Cuando exista backend, reemplazar por un flag en el perfil del usuario.
const ONBOARDING_PREFIX = 'infradraw_onboarding:';

export function isOnboardingDone(session) {
  if (!session || !session.email) return false;
  return localStorage.getItem(ONBOARDING_PREFIX + session.email) === '1';
}

export function setOnboardingDone(session) {
  if (session && session.email) {
    localStorage.setItem(ONBOARDING_PREFIX + session.email, '1');
  }
}

export function resetOnboarding(session) {
  if (session && session.email) {
    localStorage.removeItem(ONBOARDING_PREFIX + session.email);
    localStorage.removeItem(OB_STATE_PREFIX + session.email);
  }
}

// --- Onboarding granular state (per step) ---
const OB_STATE_PREFIX = 'infradraw_ob:';
const OB_STEPS_ORDER = ['plan', 'gcloud', 'project', 'telegram', 'ai'];

export function getOnboardingState(session) {
  if (!session || !session.email) return { plan: null, steps: {} };
  try {
    var raw = localStorage.getItem(OB_STATE_PREFIX + session.email);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  return { plan: null, steps: {} };
}

function _saveOBState(session, state) {
  if (session && session.email) {
    localStorage.setItem(OB_STATE_PREFIX + session.email, JSON.stringify(state));
  }
}

export function completeOnboardingStep(session, stepId, extra) {
  var state = getOnboardingState(session);
  state.steps[stepId] = true;
  if (stepId === 'plan' && extra) state.plan = extra;
  _saveOBState(session, state);
  // If all steps done, also set the legacy flag for backward compat
  if (OB_STEPS_ORDER.every(function(s) { return state.steps[s]; })) {
    setOnboardingDone(session);
  }
  return state;
}

export function getActiveOnboardingStep(session) {
  var state = getOnboardingState(session);
  for (var i = 0; i < OB_STEPS_ORDER.length; i++) {
    if (!state.steps[OB_STEPS_ORDER[i]]) return OB_STEPS_ORDER[i];
  }
  return null;
}

export function isAllOnboardingComplete(session) {
  return getActiveOnboardingStep(session) === null;
}

// Hook para páginas protegidas (ej. /app). Redirige a / si no hay sesión válida.
export function useAuthGuard() {
  const navigate = useNavigate();
  const [session, setSession] = useState(() => getSession());

  useEffect(() => {
    const s = getSession();
    if (!s) {
      navigate('/', { replace: true });
      return;
    }
    setSession(s);
  }, [navigate]);

  return session;
}
