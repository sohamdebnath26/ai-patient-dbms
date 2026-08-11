-- Seed: Development fixtures
-- Creates test users and an organization for local development.
-- Passwords are "password123" for all.
-- Run with: supabase db reset

CREATE EXTENSION IF NOT EXISTS pgcrypto;

------------------------------------------------------------
-- Organization
------------------------------------------------------------
DO $$
DECLARE
  org_id uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.organizations WHERE id = org_id) THEN
    INSERT INTO public.organizations (id, name) VALUES (org_id, 'Riverdale Medical Center');

    INSERT INTO public.clinics (id, organization_id, name) VALUES
      ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', org_id, 'Main Clinic'),
      ('bbbbbbbb-2222-2222-2222-bbbbbbbbbbbb', org_id, 'North Wing');
  END IF;
END;
$$;

------------------------------------------------------------
-- 1 Admin
------------------------------------------------------------
DO $$
DECLARE
  admin_id uuid := '11111111-1111-1111-1111-111111111111';
  org_id   uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@clinic.local') THEN
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      admin_id, 'authenticated', 'authenticated',
      'admin@clinic.local',
      crypt('password123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"role":"admin"}',
      now(), now()
    );

    INSERT INTO public.profiles (id, email, first_name, last_name, role, organization_id)
    VALUES (admin_id, 'admin@clinic.local', 'System', 'Admin', 'admin', org_id);
  END IF;
END;
$$;

------------------------------------------------------------
-- 2 Doctors
------------------------------------------------------------
DO $$
DECLARE
  d1_id  uuid := '22222222-1111-1111-1111-111111111111';
  d2_id  uuid := '22222222-2222-2222-2222-222222222222';
  org_id uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
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
    INSERT INTO public.profiles (id, email, first_name, last_name, role, organization_id)
    VALUES (d1_id, 'dr.sarah@clinic.local', 'Sarah', 'Chen', 'doctor', org_id);
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
    INSERT INTO public.profiles (id, email, first_name, last_name, role, organization_id)
    VALUES (d2_id, 'dr.james@clinic.local', 'James', 'Rodriguez', 'doctor', org_id);
  END IF;
END;
$$;

------------------------------------------------------------
-- 1 Receptionist
------------------------------------------------------------
DO $$
DECLARE
  r_id   uuid := '33333333-3333-3333-3333-333333333333';
  org_id uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
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
    INSERT INTO public.profiles (id, email, first_name, last_name, role, organization_id)
    VALUES (r_id, 'reception@clinic.local', 'Maria', 'Garcia', 'receptionist', org_id);
  END IF;
END;
$$;

------------------------------------------------------------
-- Sample Patients
------------------------------------------------------------
DO $$
DECLARE
  org_id   uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  clinic_id uuid := 'bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb';
  doctor_id uuid := '22222222-1111-1111-1111-111111111111';
BEGIN
  INSERT INTO public.patients (id, organization_id, clinic_id, first_name, last_name, dob, gender, blood_group, email, phone, mrn, created_by)
  VALUES
    ('cccccccc-1111-1111-1111-cccccccccccc', org_id, clinic_id, 'Alice', 'Johnson', '1985-03-15', 'Female', 'O+', 'alice.j@email.com', '555-0101', 'MRN-001', doctor_id),
    ('cccccccc-2222-2222-2222-cccccccccccc', org_id, clinic_id, 'Bob', 'Williams', '1972-07-22', 'Male', 'A+', 'bob.w@email.com', '555-0102', 'MRN-002', doctor_id)
  ON CONFLICT DO NOTHING;
END;
$$;