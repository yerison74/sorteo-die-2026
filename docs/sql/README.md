# Scripts SQL — Supabase

Ejecutar en **Supabase → SQL Editor** en este orden:

| Orden | Archivo | Qué hace |
|-------|---------|----------|
| 1 | `01_validar_codigos_oferentes.sql` | Diagnóstico (solo lectura). Revise los resultados. |
| 2 | `02_corregir_codigos_oferentes.sql` | Normaliza códigos, alinea `lote_habilitado`, crea índice único y vista. |
| 3 | `03_fn_validar_ganador_principal.sql` | *(Opcional)* Función y trigger para bloquear doble ganador principal en BD. |
| 4 | `04_habilitar_realtime.sql` | **Recomendado** — sincronización en vivo (QR, pantalla pública). |
| 5 | `05_sorteo_estado_lote_activo.sql` | **Recomendado** — lote seleccionado en operador → público + QR. |

## Formato de código

```
DIE-2026-S01-{A|B}-{000}
```

- Una fila por código en `oferentes_sorteo`.
- Misma empresa en A y B = dos filas (mismo RNC/RPE, códigos distintos).

## Antes de corregir

1. Exporte o haga snapshot de `oferentes_sorteo`.
2. Ejecute **01** y resuelva duplicados de `codigo` antes del índice único en **02**.
3. Si hay filas `AB` / ambas tombolas en una sola fila, cree la segunda fila a mano (plantilla en **02**, sección F).

## Después de corregir

Vuelva a ejecutar las consultas 1–4 de **01** y confirme `codigos_invalidos = 0`.
