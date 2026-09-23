// The app's local-time helpers (app/e/_lib/format.ts) read the machine's zone; the tests pin it to
// the city's, so "Tonight" means the same thing on every machine and in CI.
process.env.TZ = "Europe/Amsterdam";
