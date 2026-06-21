import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthGuard, authHeaders, logout } from '../lib/auth.js';
import Header from '../components/dashboard/Header.jsx';
import ProjectCard from '../components/dashboard/ProjectCard.jsx';
import Skeleton from '../components/dashboard/Skeleton.jsx';
import EmptyState from '../components/dashboard/EmptyState.jsx';
import Toast from '../components/dashboard/Toast.jsx';
import UpgradeBanner from '../components/dashboard/UpgradeBanner.jsx';

export default function Dashboard() {
  const navigate = useNavigate();
  const session = useAuthGuard();

  useEffect(() => {
    if (session && session.email === 'thequantpartners@gmail.com') {
      navigate('/admin', { replace: true });
    }
  }, [session, navigate]);

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const plan = session?.plan || 'free';

  function showToast(msg) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }

  function loadProjects() {
    setLoading(true);
    fetch('/api/projects', { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          setLoading(false);
          return;
        }
        setProjects(data);
        setError(null);
        setLoading(false);
      })
      .catch((err) => {
        setError('No se pudo conectar con la API. ' + err.message);
        setLoading(false);
      });
  }

  useEffect(() => {
    if (session) loadProjects();
  }, [session]);

  function createProject() {
    if (plan === 'free' && projects.length >= 3) {
      alert('Plan FREE: límite de 3 proyectos alcanzado.\nActualiza a PRO para proyectos ilimitados.');
      return;
    }
    setCreating(true);
    fetch('/api/projects', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ name: 'Nuevo diagrama' }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          if (data.code === 'LIMIT_REACHED') {
            alert('Plan FREE: límite de 3 proyectos alcanzado. Actualiza a PRO.');
          } else {
            alert('Error: ' + data.error);
          }
          setCreating(false);
          return;
        }
        window.location.href = '/canvas.html?id=' + data.id;
      })
      .catch(() => {
        alert('Error al crear el proyecto');
        setCreating(false);
      });
  }

  function openProject(id) {
    window.location.href = '/canvas.html?id=' + id;
  }

  function deleteProject(id, name) {
    if (!confirm('¿Eliminar "' + name + '"?\nEsta acción no se puede deshacer.')) return;
    fetch('/api/project?id=' + id, { method: 'DELETE', headers: authHeaders() })
      .then((r) => r.json())
      .then(() => {
        showToast('"' + name + '" eliminado');
        loadProjects();
      })
      .catch(() => alert('Error al eliminar'));
  }

  function renameProject(id, newName) {
    fetch('/api/project?id=' + id, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ name: newName }),
    })
      .then(() => {
        showToast('Renombrado a "' + newName + '"');
        setProjects((p) => p.map((proj) => (proj.id === id ? { ...proj, name: newName } : proj)));
      })
      .catch(() => alert('Error al renombrar'));
  }

  if (!session) return null;

  let mainContent;
  if (loading) {
    mainContent = (
      <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-6 max-md:grid-cols-1 max-md:gap-4">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} />
        ))}
      </div>
    );
  } else if (error) {
    mainContent = (
      <div className="mb-8 rounded-2xl border border-danger bg-danger/10 px-6 py-[18px] text-[14px] leading-[1.6] text-[#fca5a5]">
        <b className="text-[#f87171]">⚠ Error de conexión: </b>
        {error}
        <br />
        <span className="text-[12px] opacity-80">
          Asegúrate de haber configurado DATABASE_URL y JWT_SECRET en el backend.
        </span>
      </div>
    );
  } else if (projects.length === 0) {
    mainContent = (
      <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-6 max-md:grid-cols-1 max-md:gap-4">
        <EmptyState creating={creating} onCreate={createProject} />
      </div>
    );
  } else {
    mainContent = (
      <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-6 max-md:grid-cols-1 max-md:gap-4">
        {projects.map((proj) => (
          <ProjectCard
            key={proj.id}
            project={proj}
            onOpen={openProject}
            onDelete={deleteProject}
            onRename={renameProject}
          />
        ))}
      </div>
    );
  }

  return (
    <div>
      <Header
        session={session}
        plan={plan}
        creating={creating}
        onCreate={createProject}
        onSignout={() => logout(navigate)}
      />
      <div className="relative z-[1] mx-auto max-w-[1200px] px-6 py-10 max-md:px-4 max-md:py-6">
        {plan === 'free' && <UpgradeBanner count={projects.length} />}
        {!loading && !error && projects.length > 0 && (
          <div className="mb-6 flex items-center justify-between">
            <span className="text-[16px] font-bold uppercase tracking-[.5px] text-muted">Mis diagramas</span>
            <span className="rounded-[20px] border border-border bg-surface2 px-[14px] py-1 text-[12px] font-semibold text-text">
              {projects.length}
              {projects.length === 1 ? ' proyecto' : ' proyectos'}
            </span>
          </div>
        )}
        {mainContent}
      </div>
      {toast && <Toast message={toast} />}
    </div>
  );
}
