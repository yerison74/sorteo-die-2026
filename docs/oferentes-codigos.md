# Códigos y datos de oferentes

## Estructura del código

```
DIE-2026-S01-{TIPO_TOMBOLA}-{NUMERO_REGISTRO}
```

Ejemplos:

- `DIE-2026-S01-A-005` — 5.º oferente registrado en tombola **A**
- `DIE-2026-S01-B-016` — 16.º oferente registrado en tombola **B**

## Tabla `oferentes_sorteo`

Recomendación: **una fila por código** (una fila por inscripción en cada tombola).

| codigo | lote_habilitado | nombre_oferente | rnc | rpe |
|--------|-----------------|-----------------|-----|-----|
| DIE-2026-S01-A-005 | A | Empresa X | … | … |
| DIE-2026-S01-B-016 | B | Empresa X | … | … |

Misma empresa en A y B = dos filas con el **mismo RNC/RPE** y códigos distintos. El sistema detecta al ganador principal por RNC/RPE aunque el `id` sea distinto.

## Validación en la app

Implementada en `src/services/sorteoRules.js` y usada en **Panel Operador**.

## Scripts SQL (Supabase)

Ver carpeta [`sql/`](./sql/README.md):

1. **01_validar** — informes de códigos inválidos, duplicados y desalineados.
2. **02_corregir** — normalización automática y índice único en `codigo`.
3. **03_fn_validar_ganador_principal** — *(opcional)* trigger en base de datos.
