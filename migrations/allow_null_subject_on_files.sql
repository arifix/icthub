-- Allow files without a subject (global files)
ALTER TABLE public.files
  ALTER COLUMN subject_id DROP NOT NULL,
  ALTER COLUMN subject_id SET DEFAULT NULL;

-- Update foreign key to SET NULL on subject deletion instead of CASCADE
ALTER TABLE public.files DROP CONSTRAINT IF EXISTS files_subject_id_fkey;
ALTER TABLE public.files
  ADD CONSTRAINT files_subject_id_fkey
  FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE SET NULL;
