-- Riddles: a question can carry up to three hints, revealed one after another before answering.
-- Hints are public (they never contain the answer – the content check makes sure of that);
-- translated hints live in translations -> <locale> -> hints.
alter table public.questions add column hints jsonb check (
  hints is null or (jsonb_typeof(hints) = 'array' and jsonb_array_length(hints) between 1 and 3)
);
