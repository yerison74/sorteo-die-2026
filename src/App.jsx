import { Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import { useAppData } from './hooks/useAppData';
import { useAuth } from './context/AuthContext';
import Topbar from './components/Topbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import AccessDenied from './pages/AccessDenied';
import DashboardPage from './pages/DashboardPage';
import OperatorPanel from './pages/OperatorPanel';
import PublicScreen from './pages/PublicScreen';
import PublicMobile from './pages/PublicMobile';
import GanadoresPage from './pages/GanadoresPage';
import ConfiguracionPage from './pages/ConfiguracionPage';
import { LoadingSpinner } from './components/UI';

function AuthShell({ children, onRefresh, loading, lastSyncAt }) {
  return (
    <>
      <Topbar onRefresh={onRefresh} loading={loading} lastSyncAt={lastSyncAt} />
      {children}
    </>
  );
}

function ErrorBanner({ error }) {
  return (
    <div style={{
      padding: '10px 24px', background: 'rgba(224,80,80,0.08)',
      borderBottom: '1px solid rgba(224,80,80,0.2)',
      display: 'flex', alignItems: 'flex-start', gap: 10,
    }}>
      <span>⚠️</span>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--red)' }}>Error de conexión</div>
        <div style={{ fontSize: 12, color: 'var(--red)', opacity: 0.8, marginTop: 2, fontFamily: "'DM Mono',monospace" }}>{error}</div>
      </div>
    </div>
  );
}

function FullPageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: 16 }}>
      <LoadingSpinner size={44} />
      <div style={{ color: 'var(--text-dim)', fontSize: 14 }}>Cargando datos del sorteo…</div>
    </div>
  );
}

export default function App() {
  const { authenticated } = useAuth();
  const {
    lotes, items, oferentes, resultados,
    loteActivo, setLoteActivo,
    loading, syncing, lastSyncAt, estadoLoaded, error, refresh, refreshAfterDelete,
  } = useAppData();

  const isConfigured =
    process.env.REACT_APP_SUPABASE_URL &&
    !process.env.REACT_APP_SUPABASE_URL.includes('YOUR_PROJECT_ID');

  if (!isConfigured) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div className="card card-gold" style={{ maxWidth: 540, width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>⚙️</div>
            <div className="section-title">Configuración Requerida</div>
          </div>
          <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: 16, fontFamily: "'DM Mono',monospace", fontSize: 13, lineHeight: 1.9, border: '1px solid var(--border2)' }}>
            <div style={{ color: 'var(--text-dim)' }}># .env</div>
            <div><span style={{ color: 'var(--brand-navy)' }}>REACT_APP_SUPABASE_URL</span>=https://xxxx.supabase.co</div>
            <div><span style={{ color: 'var(--brand-navy)' }}>REACT_APP_SUPABASE_ANON_KEY</span>=eyJhb...</div>
          </div>
        </div>
      </div>
    );
  }

  const initialLoading = loading && lotes.length === 0;
  const shellProps = { onRefresh: refresh, loading: loading || syncing, lastSyncAt };

  return (
    <div className="app">
      <Routes>

        {/* ══ PUBLIC ROUTES (no login required) ═══════════════════════════ */}

        {/* QR mobile page */}
        <Route path="/info" element={
          <main className="main">
            <PublicMobile
              lotes={lotes} items={items} resultados={resultados}
              loteActivo={loteActivo} lastSyncAt={lastSyncAt} syncing={syncing}
              estadoLoaded={estadoLoaded}
            />
          </main>
        } />

        {/* Login — redirects to / if already authenticated */}
        <Route path="/login" element={
          authenticated ? <Navigate to="/" replace /> : <LoginPage />
        } />

        {/* Access denied page */}
        <Route path="/403" element={<AccessDenied />} />

        {/* ══ PROTECTED ROUTES (require login) ════════════════════════════ */}

        <Route path="/" element={
          <ProtectedRoute>
            <AuthShell {...shellProps}>
              {error && <ErrorBanner error={error} />}
              {initialLoading ? <FullPageLoader /> : <main className="main"><DashboardPage lotes={lotes} items={items} resultados={resultados} /></main>}
            </AuthShell>
          </ProtectedRoute>
        } />

        <Route path="/operador" element={
          <ProtectedRoute>
            <AuthShell {...shellProps}>
              {error && <ErrorBanner error={error} />}
              {initialLoading ? <FullPageLoader /> : (
                <main className="main">
                  <OperatorPanel
                    lotes={lotes} items={items} oferentes={oferentes} resultados={resultados}
                    loteActivo={loteActivo} onRefresh={refresh} onDelete={refreshAfterDelete} onLoteActivoChange={setLoteActivo}
                  />
                </main>
              )}
            </AuthShell>
          </ProtectedRoute>
        } />

        <Route path="/publico" element={
          <ProtectedRoute>
            <AuthShell {...shellProps}>
              {error && <ErrorBanner error={error} />}
              <PublicScreen
                lotes={lotes} items={items} resultados={resultados}
                loteActivo={loteActivo} lastSyncAt={lastSyncAt} syncing={syncing}
                estadoLoaded={estadoLoaded}
              />
            </AuthShell>
          </ProtectedRoute>
        } />

        <Route path="/ganadores" element={
          <ProtectedRoute>
            <AuthShell {...shellProps}>
              {error && <ErrorBanner error={error} />}
              {initialLoading ? <FullPageLoader /> : <main className="main"><GanadoresPage lotes={lotes} items={items} resultados={resultados} /></main>}
            </AuthShell>
          </ProtectedRoute>
        } />

        <Route path="/configuracion" element={
          <ProtectedRoute>
            <AuthShell {...shellProps}>
              <main className="main"><ConfiguracionPage /></main>
            </AuthShell>
          </ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={
          authenticated ? <Navigate to="/" replace /> : <AccessDenied />
        } />

      </Routes>
    </div>
  );
}
