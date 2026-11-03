// The daily rates job, run once from the laptop against the project in the local env file
// (ADR-022). The first run is the 2018 backfill.
import rates from '../netlify/functions/rates.ts'

await rates()
