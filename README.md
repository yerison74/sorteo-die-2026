# Sistema de Sorteo DIE-2026-S01

Aplicación web para la gestión del sorteo de oferentes de obras del Ministerio de Educación.

## 🚀 Instalación y configuración

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
Copie el archivo de ejemplo y edítelo con sus credenciales de Supabase:
```bash
cp .env.example .env
```

Edite `.env`:
```
REACT_APP_SUPABASE_URL=https://TU_PROYECTO.supabase.co
REACT_APP_SUPABASE_ANON_KEY=TU_ANON_KEY
```

> Las credenciales las encuentra en su proyecto de Supabase → **Settings → API**

### 3. Iniciar en desarrollo
```bash
npm start
```

### 4. Build para producción
```bash
npm run build
```

---

## 🗄️ Base de datos (Supabase)

Asegúrese de haber ejecutado los siguientes scripts SQL en su proyecto de Supabase:

1. `supabase_sorteo_sql.txt` — tablas `lotes` e `items_lote`
2. `oferentes_supabase.sql` — tabla `oferentes_sorteo` con todos los oferentes
3. `resultados_sorteo_supabase.txt` — tabla `resultados_sorteo`

### Row Level Security (RLS)
Para que la aplicación pueda leer y escribir, puede:
- **Opción A (desarrollo):** Deshabilitar RLS en las tablas relevantes.
- **Opción B (producción):** Crear políticas RLS que permitan `SELECT` e `INSERT` con `anon` role.

Ejemplo de política permisiva para desarrollo:
```sql
-- Permitir todo al anon (solo para desarrollo)
ALTER TABLE public.lotes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items_lote       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oferentes_sorteo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resultados_sorteo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all" ON public.lotes             FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON public.items_lote        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON public.oferentes_sorteo  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON public.resultados_sorteo FOR ALL USING (true) WITH CHECK (true);
```

---

## 📺 Pantallas

| Pantalla | Ruta | Descripción |
|---|---|---|
| Dashboard | `/` | Estadísticas, progreso, inversión por provincia |
| Panel Operador | Pestaña Operador | Registro de ganadores, búsqueda por tómbola |
| Pantalla Pública | Pestaña Pública | Vista proyectable, actualización automática |
| Ganadores | Pestaña Ganadores | Historial completo expandible |

---

## ⚙️ Lógica del sorteo

- El operador selecciona un **lote** y una **posición** (Ganador Principal, Suplente 1, Suplente 2).
- Ingresa el número extraído de la tómbola (ej: `001`).
- El sistema genera automáticamente el código: `DIE-2026-S01-A-001` o `DIE-2026-S01-B-001`.
- Si el oferente ya fue **Ganador Principal** en otro lote, el registro es bloqueado.
- Los **Suplentes** pueden continuar participando en otros lotes.
- La pantalla pública se actualiza automáticamente via **Supabase Realtime**.

---

## 🛠️ Stack tecnológico

- **React 18** + Create React App
- **@supabase/supabase-js v2** — cliente oficial con Realtime
- **Google Fonts** — Playfair Display, DM Mono, Outfit
- CSS puro con variables personalizadas (sin frameworks CSS)
