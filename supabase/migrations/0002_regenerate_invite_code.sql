-- Lets the household owner (CFO) rotate the invite code from inside the app.
-- Viewing the code needs no new policy: households_select (0001_init.sql)
-- already lets any household member read their household row, invite_code
-- included -- this RPC only adds a safe, owner-gated write path.

create or replace function regenerate_invite_code(p_household_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_code text;
begin
  if not exists (
    select 1 from household_members
    where household_id = p_household_id and id = auth.uid() and role = 'CFO'
  ) then
    raise exception 'Only the household owner can regenerate the invite code';
  end if;

  v_new_code := substr(md5(random()::text || clock_timestamp()::text), 1, 8);
  update households set invite_code = v_new_code where id = p_household_id;

  return v_new_code;
end;
$$;

grant execute on function regenerate_invite_code(uuid) to authenticated;
