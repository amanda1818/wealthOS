-- Stores the household's last real Weekly Report baseline observation.
-- Deliberately a SEPARATE namespace from last_check_* (0005) -- visiting the
-- Together tab's Layer 1 instrument and opening the Weekly Report must not
-- clobber each other's comparison points. Nullable: no prior report is the
-- honest first-report signal, not a fabricated "week 1" number.

alter table household_settings
  add column if not exists last_report_freedom_year integer,
  add column if not exists last_report_net_worth numeric,
  add column if not exists last_report_date date;
