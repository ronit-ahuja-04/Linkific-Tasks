-- Day 24: a small preview for image files.
-- The browser makes a 160 px WebP copy at upload (src/lib/images.js) and stores it next to the original; this column
-- remembers where. NULL for files that are not images, and for older files (scripts/backfill-images.mjs can add one).
-- A thumbnail lives in the owner's folder, like the file itself, so the same storage policies protect it.
alter table public.files add column thumb_path text;
alter table public.files add constraint files_thumb_in_owner_folder
  check (thumb_path is null or split_part(thumb_path, '/', 1) = split_part(path, '/', 1));
