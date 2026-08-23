# Project Memory

This file tracks what has actually been built, in order, so any agent or
future contributor knows the real state of the project without re-reading
every commit. Append only — never delete or rewrite past entries.

## 2026-08-23 — Project scaffolded
- What changed: initial repo structure per ARCHITECTURE.md, no features yet
- Layers touched: all (scaffolding only)
- Apps affected: customer-web, desktop-reporter, backend
- Why: baseline before first real feature

## 2026-08-23 — Domain & Schema scaffolded
- What changed: Created TS types in shared/domain and Postgres schema in backend/src/infrastructure for Customer, Staff, Service, QueueTicket, Transaction, Expense, BonusType, Product.
- Layers touched: domain, infrastructure
- Apps affected: shared, backend
- Why: Step 1 of suggested build order in ARCHITECTURE.md

## 2026-08-23 — Receipt Entry & Daily Report Screens (In-Memory Stubs)
- What changed: Scaffolded Tauri v2+React+Vite in desktop-reporter. Added RecordTransaction, RecordProductUsage, CompleteAndAdvance, GenerateDailyReport use cases. Built ReceiptEntryScreen and DailyReportScreen using TailwindCSS.
- Layers touched: application, infrastructure (InMemoryRepos stubs), presentation
- Apps affected: desktop-reporter
- Why: Step 2 of build order in ARCHITECTURE.md. Currently using in-memory stubs for repos; Postgres/Supabase connection and BonusType computation are explicitly pending next steps.

## 2026-08-23 — Bonus System & Expenses (In-Memory)
- What changed: Added ComputeBonus (with all 4 strategy calculators), UpdateBonusType, and RecordExpense use cases. Built BonusConfigScreen for live strategy testing and ExpensesScreen for outcome tracking. Updated DailyReportScreen to reflect staff bonuses and calculate true net.
- Layers touched: application, infrastructure (InMemoryStaffRepo, InMemoryBonusTypeRepo), presentation
- Apps affected: desktop-reporter
- Why: Steps 3 and 4 of build order in ARCHITECTURE.md. 

## 2026-08-23 — Supabase Integration (Real DB via Repos)
- What changed: Swapped InMemoryRepos with PostgresRepos using Supabase JS client. Initialized Supabase CLI, created `init_schema` migration, and deleted standalone `schema.sql`. Added `.env.example` and seed data script guarded by `VITE_SUPABASE_ENV=local`.
- Layers touched: infrastructure (added PostgresRepos, SupabaseClient, SeedData), presentation (updated App.tsx injection).
- Apps affected: desktop-reporter, backend (schema moved to migrations).
- Why: Step 1 & 2 infrastructure rollout, moving from stubs to live database without changing application layer.

*Note: Migrations now live in `supabase/migrations/` and `schema.sql` is superseded by that going forward. Supabase is now live for desktop-reporter. Phase 5 (queue engine + customer-web) is the only remaining phase to complete the system.*

## 2026-08-23 � Phase 5: Queue Engine + Customer Web App
- What changed: Built the core queue engine, rolling average durations, realtime position syncing, Desktop Admin Queue UI, and the customer-facing web app.
- Layers touched: domain / application / infrastructure / presentation
- Apps affected: customer-web, desktop-reporter, backend
- Why: This completes the core MVP and answers the barber's objection about artificial queue limits, moving from fixed slots to a live EMA-based waitlist.
