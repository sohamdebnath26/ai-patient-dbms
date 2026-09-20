-- Migration 00024: Add height_cm and weight_kg to patients table
-- Supports Physical Measurements feature in Patient Info and Patient Overview

ALTER TABLE public.patients
  ADD COLUMN height_cm numeric(5,1),
  ADD COLUMN weight_kg numeric(5,1);