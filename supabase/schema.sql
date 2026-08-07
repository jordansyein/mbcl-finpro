-- SenpAI database schema
-- Run this in the Supabase SQL editor (Project -> SQL Editor -> New query)
-- for a fresh project. Safe to re-run: uses IF NOT EXISTS / DROP POLICY IF EXISTS.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- lessons: one row per capture session (photo or manual/MCQ fallback)
-- ---------------------------------------------------------------------------
create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  capture_method text not null default 'manual' check (capture_method in ('photo', 'manual')),
  raw_photo_ref text, -- storage object path in the lesson-photos bucket, null if no photo
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists lessons_user_id_date_idx on public.lessons (user_id, date desc);

-- ---------------------------------------------------------------------------
-- items: discrete tagged study items produced from a lesson
-- ---------------------------------------------------------------------------
create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null check (item_type in ('vocab', 'grammar', 'corrected_sentence', 'kanji')),
  content text not null,               -- headword / grammar pattern / kanji character / original wrong sentence
  reading text,                        -- kana reading (vocab) or onyomi/kunyomi (kanji)
  meaning text,                        -- English gloss / meaning
  example_sentence text,               -- example usage, ideally reused from the lesson note
  source_correction text,              -- for corrected_sentence: the tutor's actual correction
  confidence_at_log text not null check (confidence_at_log in ('shaky', 'okay', 'solid')),
  confidence_current text not null check (confidence_current in ('shaky', 'okay', 'solid')),
  shaky_since timestamptz, -- set when item enters/stays 'shaky'; cleared once it improves. Drives the weak-point tracker.
  drill_content jsonb,     -- cached generated drill (cloze sentence, guided-construction steps, flashcard readings, etc.)
  created_at timestamptz not null default now()
);

create index if not exists items_lesson_id_idx on public.items (lesson_id);
create index if not exists items_user_id_idx on public.items (user_id);
create index if not exists items_weak_idx on public.items (user_id, shaky_since) where confidence_current = 'shaky';

-- ---------------------------------------------------------------------------
-- review_state: current SM-2 scheduling state, one row per item
-- ---------------------------------------------------------------------------
create table if not exists public.review_state (
  item_id uuid primary key references public.items(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  ease_factor real not null default 2.5,
  interval_days real not null default 0,
  repetitions integer not null default 0,
  next_due_date date not null default current_date,
  last_reviewed_at timestamptz
);

create index if not exists review_state_due_idx on public.review_state (user_id, next_due_date);

-- ---------------------------------------------------------------------------
-- review_history: append-only log of every review, so trends can be shown
-- ---------------------------------------------------------------------------
create table if not exists public.review_history (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reviewed_at timestamptz not null default now(),
  drill_type text not null,          -- 'cloze' | 'guided_construction' | 'error_correction' | 'flashcard'
  quality integer not null check (quality between 0 and 5), -- SM-2 quality score (deterministic mapping, see src/lib/sm2.ts)
  result text not null,              -- human-readable outcome, e.g. 'pass', 'fail', 'again', 'good', 'easy'
  feedback text                      -- Claude's grading feedback, for grammar / corrected_sentence drills
);

create index if not exists review_history_item_idx on public.review_history (item_id, reviewed_at);
create index if not exists review_history_user_idx on public.review_history (user_id, reviewed_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security: every table is single-user-owned, keyed on auth.uid()
-- ---------------------------------------------------------------------------
alter table public.lessons enable row level security;
alter table public.items enable row level security;
alter table public.review_state enable row level security;
alter table public.review_history enable row level security;

drop policy if exists "lessons_owner_all" on public.lessons;
create policy "lessons_owner_all" on public.lessons
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "items_owner_all" on public.items;
create policy "items_owner_all" on public.items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "review_state_owner_all" on public.review_state;
create policy "review_state_owner_all" on public.review_state
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "review_history_owner_all" on public.review_history;
create policy "review_history_owner_all" on public.review_history
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Storage: private bucket for lesson photos, one folder per user
-- (create the bucket once; policies are safe to re-run)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('lesson-photos', 'lesson-photos', false)
on conflict (id) do nothing;

drop policy if exists "lesson_photos_owner_select" on storage.objects;
create policy "lesson_photos_owner_select" on storage.objects
  for select using (bucket_id = 'lesson-photos' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "lesson_photos_owner_insert" on storage.objects;
create policy "lesson_photos_owner_insert" on storage.objects
  for insert with check (bucket_id = 'lesson-photos' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "lesson_photos_owner_delete" on storage.objects;
create policy "lesson_photos_owner_delete" on storage.objects
  for delete using (bucket_id = 'lesson-photos' and auth.uid()::text = (storage.foldername(name))[1]);
