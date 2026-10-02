# Database session time

The installed `@prisma/adapter-pg` 7.10.0 serializes Date parameters as UTC wall-clock text and normalizes timestamptz result offsets to UTC. Every application pool connection must use PostgreSQL `TimeZone=UTC`.

`createDatabase` enforces the setting through PostgreSQL startup options, including when DATABASE_URL supplies a different timezone. Other startup options and TLS settings are preserved. Localized display remains a presentation concern; application comparisons use instants.

Browser catalog acceptance found that an SQL-created current price on the local Asia/Jakarta database appeared seven hours ahead through the prior adapter connection. Fixed-time Prisma-to-Prisma tests had masked the mismatch because write and read conversion cancelled each other. A regression test now writes and reads a timestamptz field independently through Prisma and native PostgreSQL connections with different timezone settings, compares exact instants and checks the application database clock.

This correction does not rewrite historical data. Earlier isolated integration fixtures can contain timestamps written under the previous connection convention; they must not be treated as production data or imported. Any pre-existing production database populated using a non-UTC adapter session requires a separate backed-up, source-aware time audit before correcting data. Legacy storefront files remain untouched.

Fields declared as plain Prisma DateTime without a native timestamptz annotation remain timestamp-without-time-zone columns; do not compare those to timestamptz using a local driver's implicit timezone conversion. Schema alignment and any conversion must use an explicit, documented interpretation of the stored wall-clock values.
