create extension if not exists "pgcrypto";

create table if not exists pk_users (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null,
  agency text not null,
  function text not null
);

create table if not exists pk_categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  label text not null
);

create table if not exists pk_levels (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  label text not null
);

create table if not exists pk_questions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  category_slug text references pk_categories(slug) on delete set null,
  level_slug text references pk_levels(slug) on delete set null,
  question text not null,
  choices jsonb not null,
  correct_index int not null check (correct_index between 0 and 3),
  topic_cluster text,
  rationale text,
  hash_hint text,
  unique (category_slug, level_slug, question)
);

create table if not exists pk_quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  user_id uuid references pk_users(id) on delete cascade,
  category_slug text not null references pk_categories(slug),
  level_slug text not null references pk_levels(slug),
  total_score int not null default 0,
  duration_seconds int not null
);

create table if not exists pk_attempt_items (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid references pk_quiz_attempts(id) on delete cascade,
  question_id uuid references pk_questions(id) on delete set null,
  user_answer_index int,
  correct boolean not null,
  time_taken_seconds int not null,
  score_delta int not null
);

create table if not exists pk_leaderboard (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references pk_users(id) on delete cascade,
  agency text not null,
  category_slug text references pk_categories(slug) on delete set null,
  level_slug text references pk_levels(slug) on delete set null,
  score int not null,
  occurred_at timestamptz default now()
);

create index if not exists pk_questions_category_level_idx on pk_questions (category_slug, level_slug);
create index if not exists pk_attempt_items_attempt_idx on pk_attempt_items (attempt_id);
create index if not exists pk_leaderboard_score_idx on pk_leaderboard (score desc);

alter table pk_users enable row level security;
alter table pk_quiz_attempts enable row level security;
alter table pk_attempt_items enable row level security;

create policy "Users can view their profile" on pk_users
  for select
  using (auth.uid() = id);

create policy "Users upsert their profile" on pk_users
  for insert
  with check (true);

create policy "Users update their profile" on pk_users
  for update
  using (auth.uid() = id);

create policy "Users read their attempts" on pk_quiz_attempts
  for select
  using (auth.uid() = user_id);

create policy "Users insert attempts" on pk_quiz_attempts
  for insert
  with check (auth.uid() = user_id);

create policy "Users read attempt items" on pk_attempt_items
  for select
  using (
    exists (
      select 1 from pk_quiz_attempts a
      where a.id = attempt_id and a.user_id = auth.uid()
    )
  );

create policy "Users insert attempt items" on pk_attempt_items
  for insert
  with check (
    exists (
      select 1 from pk_quiz_attempts a
      where a.id = attempt_id and a.user_id = auth.uid()
    )
  );
