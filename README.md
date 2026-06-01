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
REACT_APP_PUBLIC_URL=https://sorteo-die-2026.vercel.app
```

> Las credenciales las encuentra en su proyecto de Supabase → **Settings → API**

### QR en Pantalla Pública

El código QR abre la ruta `/info` en el celular. **No use `localhost` en el QR**: los teléfonos no pueden acceder a su PC.

- **Producción (Vercel):** `REACT_APP_PUBLIC_URL=https://sorteo-die-2026.vercel.app`
- **Prueba en la misma red Wi‑Fi:** `REACT_APP_PUBLIC_URL=http://192.168.x.x:3000` (IP de su PC) y ejecute `set HOST=0.0.0.0` antes de `npm start` en Windows, o `HOST=0.0.0.0 npm start` en Mac/Linux.

Tras cambiar `.env`, reinicie `npm start`.

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
4. **`docs/sql/`** — validar y corregir códigos `DIE-2026-S01-{A|B}-{000}` ([guía](./docs/sql/README.md))

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

### Códigos de oferentes (tómbola)

Formato: `DIE-2026-S01-{A|B}-{000}`

- `{A|B}` = tipo de tombola (no el número de lote de obra).
- `{000}` = número de registro del oferente en esa tombola (orden creciente).
- Un mismo oferente inscrito en A y en B tiene **dos códigos** (ej. `…-A-005` y `…-B-016`), normalmente **dos filas** en `oferentes_sorteo`.

### Reglas de adjudicación

| Situación | ¿Puede volver a salir? |
|-----------|-------------------------|
| Ya fue **Ganador Principal** (cualquier lote) | **No**, en ninguna posición |
| Solo fue **Suplente** (1 o 2) | **Sí**, en cualquier posición y lote |

Mensaje al bloquear: *El oferente {nombre} ya gano en el lote {NN} de la tombola {A|B}.*

### Flujo operador

- Selecciona un **lote** y una **posición** (Ganador Principal, Suplente 1, Suplente 2).
- Ingresa el **número de tómbola** (ej. `5` → código `DIE-2026-S01-A-005` si el lote es tipo A).
- Al **Registrar** en Panel Operador, los datos se propagan a:
  - Dashboard, Ganadores, Pantalla Pública (misma PC u otra pestaña)
  - Celulares en **`/info`** (QR) vía Supabase Realtime + respaldo cada 8 s
- En Supabase ejecute `docs/sql/04_habilitar_realtime.sql` o active **Replication** en `resultados_sorteo`.

---

## 🛠️ Stack tecnológico

- **React 18** + Create React App
- **@supabase/supabase-js v2** — cliente oficial con Realtime
- **Google Fonts** — Playfair Display, DM Mono, Outfit
- CSS puro con variables personalizadas (sin frameworks CSS)
