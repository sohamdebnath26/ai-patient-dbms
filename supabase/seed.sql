-- Seed: Development fixtures
-- Creates test users for local development. Passwords are "password123" for all.
--
-- Run with: supabase db reset

CREATE EXTENSION IF NOT EXISTS pgcrypto;

------------------------------------------------------------
-- 1 Admin  |  admin@clinic.local
------------------------------------------------------------
DO $$
DECLARE
  admin_id uuid := '11111111-1111-1111-1111-111111111111';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@clinic.local') THEN
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      admin_id,
      'authenticated',
      'authenticated',
      'admin@clinic.local',
      crypt('password123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"role":"admin"}',
      now(),
      now()
    );

    INSERT INTO public.profiles (id, email, first_name, last_name, role)
    VALUES (admin_id, 'admin@clinic.local', 'System', 'Admin', 'admin');
  END IF;
END;
$$;

------------------------------------------------------------
-- 2 Doctors
------------------------------------------------------------
DO $$
DECLARE
  d1_id uuid := '22222222-1111-1111-1111-111111111111';
  d2_id uuid := '22222222-2222-2222-2222-222222222222';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'dr.sarah@clinic.local') THEN
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      d1_id, 'authenticated', 'authenticated',
      'dr.sarah@clinic.local',
      crypt('password123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"role":"doctor"}',
      now(), now()
    );
    INSERT INTO public.profiles (id, email, first_name, last_name, role)
    VALUES (d1_id, 'dr.sarah@clinic.local', 'Sarah', 'Chen', 'doctor');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'dr.james@clinic.local') THEN
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      d2_id, 'authenticated', 'authenticated',
      'dr.james@clinic.local',
      crypt('password123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"role":"doctor"}',
      now(), now()
    );
    INSERT INTO public.profiles (id, email, first_name, last_name, role)
    VALUES (d2_id, 'dr.james@clinic.local', 'James', 'Rodriguez', 'doctor');
  END IF;
END;
$$;

------------------------------------------------------------
-- 1 Receptionist
------------------------------------------------------------
DO $$
DECLARE
  r_id uuid := '33333333-3333-3333-3333-333333333333';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'reception@clinic.local') THEN
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      r_id, 'authenticated', 'authenticated',
      'reception@clinic.local',
      crypt('password123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"role":"receptionist"}',
      now(), now()
    );
    INSERT INTO public.profiles (id, email, first_name, last_name, role)
    VALUES (r_id, 'reception@clinic.local', 'Maria', 'Garcia', 'receptionist');
  END IF;
END;
$$;