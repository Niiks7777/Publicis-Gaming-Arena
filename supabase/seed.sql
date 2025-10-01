insert into pk_categories (slug, label)
values
  ('media-planning', 'Media Planning'),
  ('performance', 'Performance'),
  ('seo', 'SEO'),
  ('creative', 'Creative'),
  ('strategy', 'Strategy')
on conflict (slug) do nothing;

insert into pk_levels (slug, label)
values
  ('beginner', 'Beginner'),
  ('intermediate', 'Intermediate'),
  ('expert', 'Expert')
on conflict (slug) do nothing;
