import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Landing from './pages/Landing.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Onboarding from './pages/Onboarding.jsx';
import { useAuthGuard, isOnboardingDone } from './lib/auth.js';

const ADMIN_EMAIL = 'thequantpartners@gmail.com';

// /canvas y /admin son páginas legacy servidas estáticamente desde public/.
// React Router solo maneja las rutas de la SPA; para el resto navegación dura.
function LegacyRedirect({ to }) {
  useEffect(() => {
    window.location.href = to;
  }, [to]);
  return null;
}

// Punto de entrada tras el login (/app). Decide a dónde aterrizar:
// superadmin -> /admin, onboarding pendiente -> /onboarding, si no -> /dashboard.
function AppGate() {
  const session = useAuthGuard();
  if (!session) return null;
  if (session.email === ADMIN_EMAIL) {
    return <LegacyRedirect to="/admin.html" />;
  }
  return <Navigate to={isOnboardingDone(session) ? '/dashboard' : '/onboarding'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/app" element={<AppGate />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/canvas" element={<LegacyRedirect to={'/canvas.html' + window.location.search} />} />
      <Route path="/admin" element={<LegacyRedirect to="/admin.html" />} />
      <Route path="*" element={<Landing />} />
    </Routes>
  );
}
