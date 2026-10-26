-- Generated "Stimmt das?" cards (kind 'fact'): import_generated takes the kind from the file (default 'question'), and
-- sample_generated draws them about a third as often as questions – so the feed does not fill up with true/false cards.

create or replace function public.sample_generated(p_categories text[], p_region text, p_age int, p_exclude text[], p_limit int default 60)
returns setof public.questions
language sql stable security invoker set search_path = public as $$
  select q.* from public.questions q
  where q.origin = 'generated' and q.status = 'published' and q.show_in_feed
    and q.min_age <= coalesce(p_age, 16) and (q.max_age is null or q.max_age >= coalesce(p_age, 16))
    and not (q.id = any (coalesce(p_exclude, '{}')))
  order by random() * (case when p_region is not null and p_region = any (coalesce(q.countries, '{}')) then 0.4 else 1 end)
                    * (case when q.category_id = any (coalesce(p_categories, '{}')) then 0.6 else 1 end)
                    * (case when q.kind = 'fact' then 3 else 1 end)
  limit least(greatest(coalesce(p_limit, 60), 1), 200);
$$;

create or replace function public.import_generated(p_url text)
returns int
language plpgsql security definer set search_path = public, extensions as $$
declare
  res extensions.http_response;
  rows jsonb;
  added int;
begin
  if p_url !~ '^https://wunder-one\.vercel\.app/gen/[a-z0-9-]+\.json$' then
    raise exception 'only files from the app site';
  end if;
  res := extensions.http_get(p_url);
  if res.status <> 200 then raise exception 'download failed: %', res.status; end if;
  rows := res.content::jsonb;
  with ins as (
    insert into public.questions (id, kind, category_id, question, options, difficulty, tags, source_name, source_url, verification_status, status, show_in_feed, min_age, translations, origin, countries, image_url, image_credit, image_source)
    select r->>'id', coalesce(r->>'kind', 'question'), r->>'category_id', r->>'question', r->'options', (r->>'difficulty')::int,
           array(select jsonb_array_elements_text(coalesce(r->'tags', '[]'))), r->>'source_name', r->>'source_url', 'ai_checked', 'published', true,
           coalesce((r->>'min_age')::int, 10),
           jsonb_build_object('en', jsonb_build_object('question', r#>>'{translations,en,question}', 'options', r#>'{translations,en,options}')),
           'generated', array(select jsonb_array_elements_text(coalesce(r->'countries', '[]'))),
           r->>'image_url', r->>'image_credit', r->>'image_source'
    from jsonb_array_elements(rows) r
    on conflict (id) do update set image_url = excluded.image_url, image_credit = excluded.image_credit, image_source = excluded.image_source
      where questions.origin = 'generated'
    returning id, (xmax = 0) as inserted
  )
  select count(*) filter (where inserted) into added from ins;
  insert into public.question_answers (question_id, correct_index, explanation, translations)
  select r->>'id', (r->>'correct_index')::int, r->>'explanation', jsonb_build_object('en', jsonb_build_object('explanation', r#>>'{translations,en,explanation}'))
  from jsonb_array_elements(rows) r
  where exists (select 1 from public.questions q where q.id = r->>'id' and q.origin = 'generated')
  on conflict (question_id) do nothing;
  return added;
end;
$$;
revoke execute on function public.import_generated(text) from public, anon, authenticated;
grant execute on function public.sample_generated(text[], text, int, text[], int) to anon, authenticated;
