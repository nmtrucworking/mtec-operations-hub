-- MTEC Operations Hub - Database Reset Script
-- Purpose: clear operational handover data before seeding CLB member records.
--
-- Usage:
--   psql "$DATABASE_URL" -v confirm_reset=1 -f scripts/database/reset_database.sql
--
-- Safety:
--   This script preserves authentication/configuration tables:
--   users, roles, user_roles, settings_notifications, evaluation_criteria.
--   It clears operational records and member-related data.

\set ON_ERROR_STOP on

\if :{?confirm_reset}
\else
  \echo 'Reset aborted. Missing confirmation flag.'
  \echo 'Run: psql "$DATABASE_URL" -v confirm_reset=1 -f scripts/database/reset_database.sql'
  \quit 1
\endif

\if :confirm_reset
\else
  \echo 'Reset aborted. confirm_reset must be truthy.'
  \echo 'Run: psql "$DATABASE_URL" -v confirm_reset=1 -f scripts/database/reset_database.sql'
  \quit 1
\endif

BEGIN;

TRUNCATE TABLE
  evaluation_evidence,
  evaluation_appeals,
  member_evaluation_breakdowns,
  member_evaluations,
  evaluation_score_events,
  member_cycle_roles,
  discipline_cases,
  discipline_attendance_sync_logs,
  discipline_records,
  competition_results,
  competitions,
  attendances,
  meetings,
  requests,
  transactions,
  assets,
  member_skills,
  members,
  audit_logs
RESTART IDENTITY CASCADE;

-- Optional full evaluation cycle reset:
-- Uncomment only when BE wants to delete cycles as well.
-- TRUNCATE TABLE evaluation_cycles RESTART IDENTITY CASCADE;

COMMIT;

SELECT 'Database operational data reset completed.' AS result;
