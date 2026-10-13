-- Usage events for interactive visualisations (consent-based as before, never for children's accounts):
-- a prediction was made, the controls were used. Content kind "visual".
alter table public.events drop constraint events_name_check;
alter table public.events add constraint events_name_check check (name in (
  'session_start', 'feed_view', 'clip_start', 'clip_complete', 'animation_start', 'animation_complete', 'insight_complete', 'book_open', 'content_save', 'search',
  'recall_known', 'recall_again', 'clip_quiz_retry', 'animation_predict', 'visual_predict', 'visual_explore'
));
alter table public.events drop constraint events_content_kind_check;
alter table public.events add constraint events_content_kind_check check (content_kind is null or content_kind in ('item', 'clip', 'animation', 'insight', 'book', 'visual'));
