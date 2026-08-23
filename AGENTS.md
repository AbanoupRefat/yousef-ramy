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
