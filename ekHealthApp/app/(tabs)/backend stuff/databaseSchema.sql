-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.diagnoses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_visit_id uuid NOT NULL,
  doctor_id uuid,
  diagnosis text NOT NULL,
  prescription text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT diagnoses_pkey PRIMARY KEY (id),
  CONSTRAINT diagnoses_patient_visit_id_fkey FOREIGN KEY (patient_visit_id) REFERENCES public.patient_visits(id),
  CONSTRAINT diagnoses_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(id)
);
CREATE TABLE public.doctors (
  id uuid NOT NULL DEFAULT auth.uid() UNIQUE,
  name text NOT NULL,
  specialization text,
  activity_status USER-DEFINED DEFAULT 'offline'::activity_status,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT doctors_pkey PRIMARY KEY (id),
  CONSTRAINT doctors_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.patient_visits (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text,
  nrc text,
  blood_pressure text,
  pulse integer,
  temperature numeric,
  sickness text,
  intensity USER-DEFINED,
  status USER-DEFINED DEFAULT 'waiting'::visit_status,
  doctor_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT patient_visits_pkey PRIMARY KEY (id),
  CONSTRAINT patient_visits_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(id)
);