-- Persists the merged Assistant's "postpone" state (Priorities mode) at the
-- household level, replacing the old MagicAssistant's session-only useState
-- version -- a dismissal should stick across refreshes/devices, not reset.
-- Reuses household_settings' existing RLS (already covers all household
-- members), so no new policies are needed.

alter table household_settings
  add column if not exists postponed_task_ids text[] not null default '{}';
