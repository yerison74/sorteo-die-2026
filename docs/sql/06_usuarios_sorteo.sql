-- =====================================================
-- TABLA DE USUARIOS DEL SISTEMA DE SORTEO
-- Ejecutar en: Supabase → SQL Editor
-- =====================================================

CREATE TABLE IF NOT EXISTS public.usuarios_sorteo (
    id            BIGSERIAL    PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL UNIQUE,
    nombre        TEXT         NOT NULL,
    password_hash TEXT         NOT NULL,
    rol           VARCHAR(20)  NOT NULL DEFAULT 'operador'
                               CHECK (rol IN ('admin', 'operador')),
    activo        BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ  DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usuarios_username
    ON public.usuarios_sorteo(username);

-- Sin RLS — la seguridad la maneja la app
ALTER TABLE public.usuarios_sorteo DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- USUARIO INICIAL
-- username : admin
-- password : Javier23*
-- rol      : admin
-- =====================================================
INSERT INTO public.usuarios_sorteo (username, nombre, password_hash, rol)
VALUES (
    'admin',
    'Administrador',
    '$2a$10$gj6hqwc7hnywGvRdcr1rWu7ZD8okhsL23fgY3DLbyckhCBmiIxm5K',
    'admin'
)
ON CONFLICT (username) DO NOTHING;

-- Verificar resultado
SELECT id, username, nombre, rol, activo, created_at
FROM public.usuarios_sorteo;
