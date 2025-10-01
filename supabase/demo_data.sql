-- Demo user and attempts for local showcase
insert into pk_users (id, name, agency, function)
values
  ('00000000-0000-0000-0000-000000000001', 'Casey Planner', 'Starcom', 'Media Strategist')
on conflict (id) do nothing;

insert into pk_quiz_attempts (id, user_id, category_slug, level_slug, total_score, duration_seconds)
values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'media-planning', 'beginner', 70, 120),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'performance', 'intermediate', 95, 140)
on conflict (id) do nothing;
