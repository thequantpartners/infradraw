import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Landing from './pages/Landing.jsx';
import Dashboard from './pages/Dashboard.jsx';

// /canvas y /admin son páginas legacy servidas estáticamente desde public/.
// React Router solo maneja / y /app; para el resto hacemos navegación dura.
function LegacyRedirect({ to }) {
  useEffect(() => {
    window.location.href = to;
  }, [to]);
  return null;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/app" element={<Dashboard />} />
      <Route path="/canvas" element={<LegacyRedirect to={'/canvas.html' + window.location.search} />} />
      <Route path="/admin" element={<LegacyRedirect to="/admin.html" />} />
      <Route path="*" element={<Landing />} />
    </Routes>
  );
}
