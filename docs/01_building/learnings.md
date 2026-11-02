# Learnings

Document new concepts, techniques, and knowledge gained. Reference this file to build on past learning and find resources for deeper understanding.

<!-- Newest first: a new entry goes directly below this line. Template at the bottom. -->

### 2026-11-02 - A password inside a connection string is part of a URL

**What Was New:**
- The nightly backup failed to authenticate with a correct database password. The password
  contained special characters, and it sat inside `SUPABASE_DB_URL`
  (`postgresql://user:password@host:port/db`).

**Key Points:**
- A connection string is a URL. In the password, `@ : / ? # [ ] %` (and often `&`, `+`,
  spaces) are URL syntax: `@` ends the credentials, `:` starts a port, `#` starts a fragment,
  `%` starts an escape. The parser does not fail loudly; it reads a different user, host or
  password, and the server answers "authentication failed", which points at the password
  and hides the real cause.
- Two fixes: percent-encode the password
  (`node -e 'console.log(encodeURIComponent(process.argv[1]))' 'the-password'`), or use a
  long password of letters and digits only, which never needs encoding. Chosen: the second,
  32+ characters from the password manager. Length gives the strength the symbols would
  have.
- Test a connection string locally before putting it in a CI secret:
  `npx supabase --workdir .. migration list --db-url "…"` reads only, needs no Docker, and
  its error says which part is wrong.
- The database password is separate from the app's keys: resetting it affects only what
  connects to Postgres directly (here, the backup and migrate jobs).

**Sources:**
- RFC 3986, section 3.2.1 (user information) and 2.1 (percent-encoding)
- PostgreSQL docs, "Connection URIs" (libpq connection strings)

**Where to Learn More:**
- The same trap exists in every URL-shaped secret: Redis, MongoDB, SMTP and AMQP URLs.

**Applied In:**
- `SUPABASE_DB_URL` (GitHub secret) used by `backup.yml` and the `migrate` job in `ci.yml`;
  the warning added to [setup.md](setup.md), step 4.

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
