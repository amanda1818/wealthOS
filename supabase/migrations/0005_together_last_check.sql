-- Stores the household's last real "Together" check-in observation, so the
-- next visit can show an honest delta (Freedom Date / net worth movement)
-- instead of a fabricated trend. Nullable: a fresh household has no prior
-- observation, which is exactly the honest-empty-state signal.

alter table household_settings
  add column if not exists last_check_freedom_year integer,
  add column if not exists last_check_net_worth numeric,
  add column if not exists last_check_date date;
