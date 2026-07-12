-- Household-level toggle: TRANSPARENT (partners can see each other's private
-- reserve / personal totals) vs PRIVATE (each partner's own row only).
-- This is enforced at the RLS layer, not just hidden in the client -- a
-- "Private" household genuinely cannot read the other member's
-- private_reserves row via any client, not just the app UI.

alter table household_settings
  add column if not exists balance_visibility text not null default 'TRANSPARENT'
  check (balance_visibility in ('TRANSPARENT', 'PRIVATE'));

-- Defaults to TRANSPARENT even when a household has no household_settings
-- row yet (e.g. immediately after create_household, before the client's
-- first settings push), matching the product default.
create or replace function household_balance_visibility(p_household_id uuid)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select balance_visibility from household_settings where household_id = p_household_id),
    'TRANSPARENT'
  );
$$;

grant execute on function household_balance_visibility(uuid) to authenticated;

-- Split the old single "for all" policy: visibility (SELECT) depends on the
-- household's mode, but writing another member's reserve is never allowed,
-- regardless of mode.
drop policy if exists private_reserves_owner_only on private_reserves;

create policy private_reserves_select on private_reserves
  for select using (
    owner_user_id = auth.uid()
    or (is_household_member(household_id) and household_balance_visibility(household_id) = 'TRANSPARENT')
  );

create policy private_reserves_insert on private_reserves
  for insert with check (owner_user_id = auth.uid());

create policy private_reserves_update on private_reserves
  for update using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());

create policy private_reserves_delete on private_reserves
  for delete using (owner_user_id = auth.uid());

-- Give every newly created household an explicit settings row (TRANSPARENT
-- by default) instead of relying on the coalesce fallback above, so the
-- setting is visible/editable in the UI from the very first session.
create or replace function create_household(p_household_name text, p_display_name text)
returns household_members
language plpgsql
security definer
set search_path = public
as $$
declare
  v_household households;
  v_member household_members;
begin
  if exists (select 1 from household_members where id = auth.uid()) then
    raise exception 'User already belongs to a household';
  end if;

  insert into households (name) values (coalesce(nullif(p_household_name, ''), 'Our Household'))
  returning * into v_household;

  insert into household_members (id, household_id, role, display_name, email)
  values (auth.uid(), v_household.id, 'CFO', coalesce(nullif(p_display_name, ''), 'Member'), auth.jwt() ->> 'email')
  returning * into v_member;

  insert into household_settings (household_id, balance_visibility) values (v_household.id, 'TRANSPARENT');

  return v_member;
end;
$$;
