// Real multi-connection races against the v15 SQL. See README.md. Exits non-zero on any failure.
import { createRequire } from "node:module"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

const base = process.env.PGCHECK_MODULES
if (!base) { console.error("Set PGCHECK_MODULES to the folder where embedded-postgres and pg are installed (see README)."); process.exit(2) }
const req = createRequire(path.join(base, "x.js"))
const EmbeddedPostgres = req("embedded-postgres").default
const { Client } = req("pg")

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")
const read = (f) => fs.readFileSync(path.join(root, f), "utf8")
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "pgconc-"))
const PORT = 54329
const U = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
const uuid = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`

const server = new EmbeddedPostgres({ databaseDir: dataDir, user: "postgres", password: "pw", port: PORT, persistent: false })
let failures = 0
const check = (name, ok, detail = "") => { console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  " + detail : ""}`); if (!ok) failures++ }

const mk = () => new Client({ host: "localhost", port: PORT, user: "postgres", password: "pw", database: "postgres" })
const connect = async () => { const c = mk(); await c.connect(); await c.query("SET ROLE service_role"); return c }
const reserve = (c, rid, plan = "starter") => c.query("SELECT public.checkout_reserve($1,'cus_1',$2,$3,60) AS r", [U, plan, rid]).then((x) => x.rows[0].r)
const publish = (c, rid, s) => c.query("SELECT public.checkout_publish($1,$2,$3,NULL) AS n", [U, rid, s]).then((x) => x.rows[0].n)

try {
  await server.initialise(); await server.start()
  const admin = mk()
  await admin.connect()
  await admin.query(read("__tests__/fixtures/supabase-shim.sql"))
  await admin.query("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role")
  await admin.query("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role")
  await admin.query("INSERT INTO auth.users (id, email) VALUES ($1,'u@example.test')", [U])
  await admin.query(read("supabase-migration-v15-checkout-reservations.sql"))
  const reset = () => admin.query("DELETE FROM billing_checkout_reservations")
  const lapse = () => admin.query("UPDATE billing_checkout_reservations SET lease_until = now() - interval '1 second'")
  const N = 16
  const clients = await Promise.all(Array.from({ length: N }, connect))

  // 1. many connections reserve at once on an empty account: exactly one owner
  let bad = 0
  for (let t = 0; t < 50; t++) {
    await reset()
    const out = await Promise.all(clients.map((c, i) => reserve(c, uuid(i + 1), ["starter", "team", "pro"][i % 3])))
    const acquired = out.filter((o) => o.outcome === "acquired").length
    const busy = out.filter((o) => o.outcome === "busy").length
    if (acquired !== 1 || busy !== N - 1) bad++
  }
  check(`50 rounds x ${N} simultaneous reserves: exactly one acquires, the rest are busy`, bad === 0, `bad rounds: ${bad}`)

  // 2. lapsed lease, many takers at once: exactly one takeover; the slow original can never publish afterwards
  bad = 0
  for (let t = 0; t < 50; t++) {
    await reset()
    await reserve(clients[0], uuid(1))
    await lapse()
    const out = await Promise.all(clients.slice(1).map((c, i) => reserve(c, uuid(i + 2))))
    const takeovers = out.filter((o) => o.outcome === "takeover").length
    const late = await publish(clients[0], uuid(1), "cs_late")
    if (takeovers !== 1 || late !== 0) bad++
  }
  check("50 rounds: lapsed lease taken over by exactly one request; the original late publish returns 0", bad === 0, `bad rounds: ${bad}`)

  // 3. slow original and successor publish at the same instant: only the successor session is recorded
  bad = 0
  for (let t = 0; t < 50; t++) {
    await reset()
    await reserve(clients[0], uuid(1))
    await lapse()
    const take = await reserve(clients[1], uuid(2), "team")
    const [a, b] = await Promise.all([publish(clients[0], uuid(1), "cs_old"), publish(clients[1], uuid(2), "cs_new")])
    const row = (await admin.query("SELECT stripe_session_id FROM billing_checkout_reservations")).rows[0]
    if (take.outcome !== "takeover" || a !== 0 || b !== 1 || row.stripe_session_id !== "cs_new") bad++
  }
  check("50 rounds: slow original and successor publish simultaneously; only the successor session is recorded", bad === 0, `bad rounds: ${bad}`)

  // 4. after a publish, mixed-plan simultaneous requests: exactly one swap owner; the rest canonical or busy
  bad = 0
  for (let t = 0; t < 50; t++) {
    await reset()
    await reserve(clients[0], uuid(1)); await publish(clients[0], uuid(1), "cs_1")
    const out = await Promise.all(clients.slice(1).map((c, i) => reserve(c, uuid(i + 2), i % 2 ? "pro" : "starter")))
    const swaps = out.filter((o) => o.outcome === "swap").length
    const canon = out.filter((o) => o.outcome === "canonical").length
    const busy = out.filter((o) => o.outcome === "busy").length
    if (swaps !== 1 || swaps + canon + busy !== N - 1) bad++
  }
  check("50 rounds: simultaneous mixed-plan requests after a publish -> exactly one swap owner", bad === 0, `bad rounds: ${bad}`)

  // 5. checkout_complete racing new requests leaves a consistent row
  bad = 0
  for (let t = 0; t < 30; t++) {
    await reset()
    await reserve(clients[0], uuid(1)); await publish(clients[0], uuid(1), "cs_1")
    await Promise.all([
      clients[1].query("SELECT public.checkout_complete($1,'cus_1','cs_1')", [U]),
      reserve(clients[2], uuid(3)), reserve(clients[3], uuid(4), "pro"),
    ])
    const rows = (await admin.query("SELECT state FROM billing_checkout_reservations")).rows
    const after = await reserve(clients[4], uuid(5))
    if (rows.length !== 1) bad++
    else if (rows[0].state === "completed" && after.outcome !== "completed") bad++
  }
  check("30 rounds: checkout_complete racing new requests leaves exactly one consistent row", bad === 0, `bad rounds: ${bad}`)

  await Promise.all(clients.map((c) => c.end())); await admin.end()
} catch (e) {
  console.error("ERROR", e); failures++
} finally {
  try { await server.stop() } catch {}
  try { fs.rmSync(dataDir, { recursive: true, force: true }) } catch {}
}
console.log(failures ? `\n${failures} FAILED` : "\nALL PASSED")
process.exit(failures ? 1 : 0)
