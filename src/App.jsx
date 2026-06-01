import { Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import { useAppData } from './hooks/useAppData';
import Topbar from './components/Topbar';
import DashboardPage from './pages/DashboardPage';
import OperatorPanel from './pages/OperatorPanel';
import PublicScreen from './pages/PublicScreen';
import PublicMobile from './pages/PublicMobile';
import GanadoresPage from './pages/GanadoresPage';
import { LoadingSpinner } from './components/UI';

export default function App() {
  const {
    lotes, items, oferentes, resultados,
    loteActivo, setLoteActivo,
    loading, syncing, lastSyncAt, error, refresh,
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
            <div className="section-sub" style={{ marginTop: 8 }}>
              Edite el archivo <code style={{ background: 'var(--surface3)', padding: '2px 6px', borderRadius: 4 }}>.env</code> con sus credenciales de Supabase y reinicie con <code style={{ background: 'var(--surface3)', padding: '2px 6px', borderRadius: 4 }}>npm start</code>.
            </div>
          </div>
          <div style={{
            background: 'var(--surface2)', borderRadius: 'var(--radius-sm)',
            padding: 16, fontFamily: "'DM Mono',monospace", fontSize: 13,
            lineHeight: 1.9, border: '1px solid var(--border2)',
          }}>
            <div style={{ color: 'var(--text-dim)' }}># .env</div>
            <div><span style={{ color: 'var(--brand-navy)' }}>REACT_APP_SUPABASE_URL</span>=https://xxxx.supabase.co</div>
            <div><span style={{ color: 'var(--brand-navy)' }}>REACT_APP_SUPABASE_ANON_KEY</span>=eyJhb...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Topbar onRefresh={() => refresh()} loading={loading || syncing} lastSyncAt={lastSyncAt} />

      {error && (
        <div style={{
          padding: '10px 24px', background: '#fef2f2',
          borderBottom: '1px solid #fecaca',
          display: 'flex', alignItems: 'flex-start', gap: 10,
        }}>
          <span style={{ fontSize: 16 }}>⚠️</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--red)' }}>Error de conexión con Supabase</div>
            <div style={{ fontSize: 12, color: 'var(--red)', opacity: 0.8, marginTop: 2, fontFamily: "'DM Mono',monospace" }}>{error}</div>
          </div>
        </div>
      )}

      {loading && lotes.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: 16 }}>
          <LoadingSpinner size={44} />
          <div style={{ color: 'var(--text-dim)', fontSize: 14 }}>Conectando con Supabase…</div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: 'var(--text-dim)', opacity: 0.6 }}>
            {process.env.REACT_APP_SUPABASE_URL}
          </div>
        </div>
      ) : (
        <Routes>
          {/* Dashboard */}
          <Route path="/" element={
            <main className="main">
              <DashboardPage lotes={lotes} items={items} resultados={resultados} />
            </main>
          } />

          {/* Panel operador */}
          <Route path="/operador" element={
            <main className="main">
              <OperatorPanel
                lotes={lotes}
                items={items}
                oferentes={oferentes}
                resultados={resultados}
                loteActivo={loteActivo}
                onRefresh={refresh}
                onLoteActivoChange={setLoteActivo}
              />
            </main>
          } />

          {/* Pantalla pública proyectable (con QR) */}
          <Route path="/publico" element={
            <PublicScreen
              lotes={lotes}
              items={items}
              resultados={resultados}
              loteActivo={loteActivo}
              lastSyncAt={lastSyncAt}
              syncing={syncing}
            />
          } />

          {/* Página móvil que se abre con el QR */}
          <Route path="/info" element={
            <main className="main">
              <PublicMobile
                lotes={lotes}
                items={items}
                resultados={resultados}
                loteActivo={loteActivo}
                lastSyncAt={lastSyncAt}
                syncing={syncing}
              />
            </main>
          } />

          {/* Ganadores */}
          <Route path="/ganadores" element={
            <main className="main">
              <GanadoresPage lotes={lotes} items={items} resultados={resultados} />
            </main>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </div>
  );
}
