# Sistema de Sorteo DIE-2026-S01

## 🚀 Instalación

```bash
npm install
cp .env.example .env   # edite con sus credenciales
npm start
```

---

## ⚙️ Variables de entorno (.env)

```env
REACT_APP_SUPABASE_URL=https://TU_PROYECTO.supabase.co
REACT_APP_SUPABASE_ANON_KEY=TU_ANON_KEY

# URL pública para el QR
REACT_APP_PUBLIC_URL=https://su-dominio.com

# Credenciales del panel privado
REACT_APP_ADMIN_USER=admin
REACT_APP_ADMIN_PASSWORD=sorteo2026
```

> **Importante:** cambie `REACT_APP_ADMIN_USER` y `REACT_APP_ADMIN_PASSWORD` antes de poner en producción.

---

## 🔐 Sistema de acceso

| Ruta | Acceso | Descripción |
|---|---|---|
| `/info` | **Público** | Página móvil del QR — resultados en tiempo real |
| `/login` | **Público** | Formulario de inicio de sesión |
| `/403` | **Público** | Página de acceso denegado |
| `/` | 🔒 Privado | Dashboard |
| `/operador` | 🔒 Privado | Panel del operador |
| `/publico` | 🔒 Privado | Pantalla proyectable con QR |
| `/ganadores` | 🔒 Privado | Historial de ganadores |

- La sesión dura **8 horas** y se guarda en `sessionStorage` (se cierra al cerrar el navegador).
- Cualquier ruta privada sin sesión redirige a `/login`.
- Rutas desconocidas sin sesión muestran la página `/403`.

---

## 🗄️ Base de datos (Supabase)

Ejecute en orden los SQL de la carpeta `/docs/sql/`:

1. `01_validar_codigos_oferentes.sql`
2. `02_corregir_codigos_oferentes.sql`
3. `03_fn_validar_ganador_principal.sql`
4. `04_habilitar_realtime.sql`
5. `05_sorteo_estado_lote_activo.sql`

### Deshabilitar RLS (desarrollo)

```sql
ALTER TABLE public.lotes              DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.items_lote         DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.oferentes_sorteo   DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.resultados_sorteo  DISABLE ROW LEVEL SECURITY;
```
