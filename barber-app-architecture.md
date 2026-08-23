# Barber Queue & Reporting System — Project Architecture

## 0. What this document is

This is the single source of truth for the system's shape. Any human or AI agent
picking up this repo reads this file first, then `memory.md` for what's actually
been built so far. This file describes *how things must be structured*.
`memory.md` describes *what currently exists*. They are not the same file and
should never merge.

---

## 1. System overview

Three deployable surfaces, one shared domain:

```
customer-web/     -> mobile-first web app: join queue, pick hero, track ETA
desktop-reporter/ -> Tauri v2 desktop app: receipts, income/outcome, bonuses, reports
backend/           -> API + realtime queue engine + shared source of truth (Postgres/Supabase)
shared/            -> domain types, DTOs, validation shared by all three
```

Why three surfaces and not one app: customers need something disposable and
fast (a web link, no install). The barber needs something that lives on his
desktop all day, works offline-ish, and doubles as his receipt book. Both talk
to the same backend so there is exactly one truth for queue state and money.

---

## 2. Core domain model (lives in `shared/domain`, referenced everywhere)

- `Customer` — walk-in or remote, optional loyalty to a specific Hero
- `Staff` — role: `hero` | `helper`, has an assigned `BonusType`
- `Service` — type (buzz, fade, full grooming, ...), has a rolling average
  duration per (staff, service) pair, not a fixed number
- `QueueTicket` — a customer's place in line: `status` moves through
  `waiting -> with_hero -> done`. Only two transitions exist because the hero
  gives no reliable manual signal mid-service — `with_hero` covers the whole
  physical pipeline (cut + finishing) as one busy block from the customer's
  point of view, and `done` only fires when the receipt is entered on the
  desktop reporter. The hero+helper pipeline still happens physically (§4),
  it's just not separately tracked in queue status since there's no trustworthy
  event to split it on.
- `Transaction` (income) — receipt entry: staff, service, amount, tip, linked
  ticket, timestamp
- `Expense` (outcome) — supplies, rent, salaries paid out — same ledger
  concept as Transaction but negative direction
- `BonusType` — a strategy object, not a hardcoded formula (see §5)
- `Product` — a good used or sold during service (cream, wax, shampoo, etc.):
  `name`, `stock_qty`, `low_stock_threshold`, `unit_cost`, optional `sale_price`
  if it's also sold directly to customers rather than just consumed in-service

This model is the two-stage pipeline discussed earlier: Hero stage and Helper
stage are separate queues with separate throughput, not one combined slot.

---

## 3. Clean Architecture layering (applies inside each of the 3 apps)

```
/src
  /domain          <- entities, value objects. Zero framework imports. Zero I/O.
  /application      <- use cases (one file per action verb). Depends on domain only.
  /infrastructure   <- Postgres/Supabase repos, Tauri commands, realtime channels.
                       Implements interfaces defined in /application.
  /presentation     <- React components, screens, view-models. Talks to
                       /application only, never directly to /infrastructure.
```

Rule that must never be broken: **presentation never imports infrastructure
directly.** Every screen calls a use case; every use case depends on an
interface; infrastructure is the only layer allowed to know Postgres or Tauri
exist. This is what lets you swap Supabase for something else later, or move
a use case from desktop to web, without touching UI code.

### Example use cases (`/application`)
`JoinQueue`, `AssignHero` (waiting -> with_hero),
`CompleteAndAdvance` (with_hero -> done, and auto-flips the next waiting
ticket — triggered only by `RecordTransaction`, never by a standalone button),
`RecordTransaction`, `RecordExpense`, `ComputeBonus`, `GenerateDailyReport`,
`UpdateBonusType`, `RecordProductUsage`, `GetInventoryStatus`

Each use case is small, testable in isolation, and named as a verb — this
matters for agents: an AI agent adding a feature should almost always be
adding one new use case + one new UI screen, not touching everything.

---

## 4. Realtime queue engine (`backend`)

- Postgres tables: `queue_tickets`, `staff`, `services`, `transactions`,
  `expenses`, `bonus_types`
- Rolling average duration = exponential moving average per
  `(staff_id, service_id)`, recalculated on every `CompleteCut` /
  `CompleteFinish` event — never a hardcoded constant
- Realtime channel (Supabase Realtime) pushes queue position + ETA to
  `customer-web` clients as tickets move through stages
- No fixed time slots anywhere in the schema — only events and rolling
  averages, per the design discussed earlier in this project
- **Auto-advance rule**: when ticket N's `Transaction` is recorded (§8 Receipt
  Entry) and its status flips to `done`, the next `waiting` ticket in that
  hero's line automatically flips to `with_hero`. This is the only place
  queue movement happens for the hero stage — there is no separate manual
  "next customer" button, so the barber never has to touch the queue itself,
  only the receipt screen he already uses

---

## 5. Bonus system — configurable, not hardcoded

`BonusType` is a strategy pattern, deliberately built before the actual rule
is known, so the barber can change it anytime without a rebuild.

```
BonusType
  id
  kind: "percentage_commission" | "flat_per_customer" | "tiered_threshold" | "manual"
  params: jsonb   // e.g. { percent: 10 } or { amount: 20 } or { threshold: 5000, bonus_above: 500 }
```

`ComputeBonus(staff_id, period)` reads whichever `kind` is assigned to that
staff member and runs the matching calculator. Adding a new kind later is one
new calculator function, not a schema change or a rewrite of existing staff
assignments. Desktop reporter UI must let the owner reassign a staff member's
`BonusType` and see the report recompute live — that's the MVP demo moment.

---

## 6. Income & outcome (P&L)

- Income = `transactions` (receipts from `RecordTransaction`)
- Outcome = `expenses` (rent, supplies, salaries — `RecordExpense`)
- Daily/weekly/monthly report = `GenerateDailyReport` use case, pure
  aggregation over both tables, no business logic beyond summation and the
  bonus calculation from §5
- Desktop reporter is the only surface that writes `expenses` — customers and
  the queue system never touch outcome data

### 6.1 Inventory / Goods (cream, wax, etc.)

- `Product` stock lives alongside the transaction/expense ledger — buying more
  stock is an `Expense` (outcome) tied to a `Product`; using or selling stock
  is a `RecordProductUsage` event tied to a `Transaction` (income, if sold) or
  just a stock decrement (if consumed as part of the service, not billed
  separately)
- The **Receipt Entry** screen (§8) shows current stock for any product
  selected on that transaction right where he's already looking, so he sees
  what he has and what's about to run out without a separate inventory check
- `GetInventoryStatus` powers a simple low-stock list (`stock_qty <=
  low_stock_threshold`) surfaced on the desktop reporter's main screen — a
  running "about to finish" list, not a separate app to check

---

## 7. `customer-web` specifics

- Mobile-view only, no desktop layout needed
- Screens: `JoinQueue` (pick hero or "any", pick service), `TrackTicket`
  (live ETA, position), confirmation
- No login required for MVP — phone number + ticket ID is enough to track
  status; add accounts later if loyalty/history features are wanted

## 8. `desktop-reporter` specifics

- Tauri v2 + Rust + React (matches existing stack)
- Screens: `Receipt Entry` (pre-filled from the ticket that just completed,
  with a stock/inventory panel visible for any product used), `Daily Report`,
  `Bonus Config`, `Expenses`, `Inventory` (stock levels + low-stock list)
- Receipt entry is the single event that closes out a `QueueTicket`
  (`with_hero -> done`, auto-advancing the next customer), records the
  `Transaction`, feeds the rolling-average duration, and decrements product
  stock if goods were used — one screen, four effects

---

## 9. `AGENTS.md` — conventions for any AI coding agent working in this repo

Place this as a separate file at the repo root (`/AGENTS.md`). Contents:

```markdown
# Agent instructions for this repo

1. Read /ARCHITECTURE.md (this file) before writing any code.
2. Read /memory.md before starting any task — it is the current state of
   the project. Do not assume anything not listed there is already built.
3. Never let /presentation import /infrastructure directly in any app.
4. New feature = new use case in /application + new screen in /presentation,
   unless explicitly told otherwise.
5. Any new bonus calculation logic goes in the BonusType strategy list
   (§5 of ARCHITECTURE.md) — never as an if/else keyed on staff name.
6. After finishing a task, APPEND an entry to /memory.md (see template
   below). Do not rewrite or delete prior entries.
7. Ask before changing the domain model in /shared/domain — it's shared
   across all three apps and a silent change breaks the others.
```

---

## 10. `memory.md` — living build log

Place this as a separate file at the repo root (`/memory.md`). It is
append-only. Every feature addition or meaningful change gets one entry.
Never rewritten wholesale — only appended to, so history is never lost.

Template for each entry:

```markdown
## YYYY-MM-DD — <short feature name>
- What changed: <1-2 sentences>
- Layers touched: <domain / application / infrastructure / presentation>
- Apps affected: <customer-web / desktop-reporter / backend>
- Why: <the reason, if not obvious>
```

Starter file:

```markdown
# Project Memory

This file tracks what has actually been built, in order, so any agent or
future contributor knows the real state of the project without re-reading
every commit. Append only — never delete or rewrite past entries.

## YYYY-MM-DD — Project scaffolded
- What changed: initial repo structure per ARCHITECTURE.md, no features yet
- Layers touched: all (scaffolding only)
- Apps affected: customer-web, desktop-reporter, backend
- Why: baseline before first real feature
```

---

## 11. Suggested build order (given the MVP time pressure)

1. `shared/domain` entities + Postgres schema
2. `desktop-reporter`: Receipt Entry + Daily Report (this alone is demoable
   and replaces his notebook — no queue engine needed yet)
3. Bonus system (§5) — the live-switch demo moment
4. Expenses screen (§6) — completes the P&L picture
5. Queue engine + `customer-web` (the harder, higher-risk piece — build once
   the money-tracking half has already earned trust)
