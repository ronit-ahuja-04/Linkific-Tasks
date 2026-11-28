-- Lumo M2b: lesson videos get a captions track (WebVTT in the private course-media bucket, next to the video).
alter table public.lessons add column captions_path text;
