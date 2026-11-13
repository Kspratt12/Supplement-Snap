# pg-concurrency-check

Runs the v15 reservation functions against a REAL PostgreSQL server with many simultaneous connections
(the in-memory test database used by the unit tests has a single connection, so it cannot prove locking).

Dev tool only. It is NOT a project dependency. Install the two packages in a folder outside the repo:

    mkdir %TEMP%\pgcheck && cd %TEMP%\pgcheck && npm init -y && npm install embedded-postgres pg

Then, from the repo root:

    set PGCHECK_MODULES=%TEMP%\pgcheck
    node scripts/pg-concurrency-check/run.mjs

It starts a throwaway local server on port 54329 in a temp data directory, applies the test scaffolding and
supabase-migration-v15-checkout-reservations.sql, runs the races, prints PASS/FAIL, and deletes the server.
It never touches Supabase or any production system.
