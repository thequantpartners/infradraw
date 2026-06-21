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
