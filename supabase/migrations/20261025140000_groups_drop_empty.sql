-- A group whose last member is gone (left, removed, or account deleted) is removed with its rounds and chat.
-- Found in the live test on 19.10.2026: deleting both accounts left an empty group behind.
create function private.drop_empty_group() returns trigger language plpgsql set search_path = '' as $$
begin
  delete from public.groups g where g.id = old.group_id and not exists (select 1 from public.group_members m where m.group_id = old.group_id);
  return null;
end $$;
create trigger group_members_drop_empty after delete on public.group_members for each row execute function private.drop_empty_group();
revoke execute on function private.drop_empty_group() from public, anon, authenticated;
delete from public.groups g where not exists (select 1 from public.group_members m where m.group_id = g.id);
