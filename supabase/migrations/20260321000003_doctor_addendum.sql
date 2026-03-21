-- Add doctor_note column to insights table for human-in-the-loop validation
alter table insights add column if not exists doctor_note text;
