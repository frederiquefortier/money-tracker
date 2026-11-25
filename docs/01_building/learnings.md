# Learnings

What the author learned while building this: a concept explained in teacher mode, the answer to "how does this work?", or a lesson from the author's own mistake. Technical findings the assistant made along the way are not learnings: they go in code comments, ADRs or bugs.md.

<!-- Newest first: a new entry goes directly below this line. Template at the bottom. -->

### 2026-11-25 - Where a page's data comes from, and why some reloads and some does not

**What Was New:**
- On the dashboard the charts showed at once on a second visit, but the heat map showed its loading skeleton every time. I asked why.

**Key Points:**
- A route **loader** fetches a page's data before the page shows. The router keeps that answer for a while, so coming back reuses it: that is why the charts were instant.
- A component that fetches by itself (in a `useEffect`) starts from nothing every time it appears, unless someone writes a cache for it. The heat map did that, so it loaded again on each visit.
- A query library (TanStack Query) is that cache, written once: each read has a key (`['year-activity', 2026]`), a second visit shows the last answer at once, and a save marks it stale so it refreshes.
- Two places to load data, two behaviours: the rule now is a loader for the page, a query for what a component asks later (ADR-073).

**Sources:**
- TanStack Router docs, "Data Loading"
- TanStack Query docs, "Query Keys" and "Caching"

**Where to Learn More:**
- What does "stale" mean in a cache, and how is it different from "expired"?
- When should data be loaded on the server instead of in the browser?

**Applied In:**
- The heat map and eight other reads (ADR-073).

### 2026-11-18 - How to check that the database is encrypted

**What Was New:**
- I asked how to check that my financial data is encrypted in Supabase.

**Key Points:**
- **Encryption at rest** happens on the disk under Postgres. The database reads and writes plain data, so no SQL query can show it; the proof is the provider's documentation and certifications (SOC 2).
- **Encryption in transit** is TLS: every connection to the database and to the API is encrypted, which can be checked from the connection itself.
- What I can check myself: the backup dump is encrypted with my own key (`age`), and RLS keeps each user's rows away from every other user. Encryption does not protect from a wrong policy: RLS does.

**Sources:**
- Supabase docs, "Security" and "Platform: SOC 2"

**Where to Learn More:**
- What is the difference between encryption at rest, in transit and at the application level?
- Why would encrypting amounts in the app make totals impossible in SQL?

**Applied In:**
- security.md ("Is Supabase up to it?", Backups).

### 2026-11-18 - A return without my own deposits (modified Dietz)

**What Was New:**
- An investment I feed every month showed a very high yearly change. I asked why: the figure counted my deposits as growth.

**Key Points:**
- A **change in value** says how much the account grew, whatever the reason. Money I put in makes it grow too.
- A **return** says how much the money itself earned: the change in value, less the money put in, plus the money taken out.
- The percent divides that by the money that was there, with each deposit counted for the share of the period it was invested (**modified Dietz**). A deposit the day before the end barely counts.
- The other method, the time-weighted return, needs a value at every deposit. My values are typed months apart, so it would read each deposit as a loss, then a jump.

**Sources:**
- CFA Institute, Global Investment Performance Standards (GIPS), money-weighted and time-weighted returns

**Where to Learn More:**
- What is the difference between a money-weighted and a time-weighted return?
- Why do fund reports use time-weighted returns?

**Applied In:**
- An investment's row on the net worth page (ADR-062).

### 2026-11-02 - A password inside a connection string is part of a URL

**What Was New:**
- The nightly backup was refused with a password I knew was right. It had special characters, and it sat inside a connection string: `postgresql://user:password@host:port/db`.

**Key Points:**
- A connection string is a URL. In a password, `@ : / ? # %` are URL syntax: `@` ends the credentials, `:` starts a port, `#` a fragment. The parser reads another user or host without complaining, and the server answers "authentication failed", which points at the wrong thing.
- Two fixes: percent-encode the password, or use a long password of letters and digits only. Length gives the strength the symbols would have.
- Test a connection string on the laptop before putting it in a CI secret.

**Sources:**
- RFC 3986, sections 3.2.1 (user information) and 2.1 (percent-encoding)

**Where to Learn More:**
- Which other secrets are URLs and have the same trap (Redis, SMTP)?

**Applied In:**
- `SUPABASE_DB_URL`, setup.md step 4.

---

## Format

### YYYY-MM-DD - Learning Title

**What Was New:**
- Core concept or technique learned
- Context of when it came up

**Key Points:**
- Important details to remember
- How it works or why it matters

**Sources:**
- Documentation links
- Articles or tutorials referenced
- Code examples or repositories

**Where to Learn More:**
- Advanced resources
- Related topics to explore
- Practice exercises or projects

**Applied In:**
- Where/how this was used in practice (optional)
