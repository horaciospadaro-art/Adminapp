# Instructions for Vercel Deployment Configuration

## Critical: Database Schema Sync Required

The `BankAccount` and `BankTransaction` tables must exist in your production database.

### Step 1: Verify Database Connection

In Vercel Dashboard → Your Project → Settings → Environment Variables, verify:

```
DATABASE_URL=postgresql://user:password@host:6543/database?pgbouncer=true
DIRECT_URL=postgresql://user:password@host:5432/database
```

### Step 2: Run Schema Sync

Run this command locally with environment variables pointing to production database:

```bash
npx prisma db push
```

**OR** if using migrations:

```bash
npx prisma migrate deploy
```

### Step 3: Verify Tables Exist

Connect to your production database and run:

```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE '%ank%';
```

You should see:

- `BankAccount`
- `BankTransaction`

### Step 4: Redeploy

After confirming tables exist, trigger a new deployment in Vercel.

## Common Issues

1. **"prisma: command not found"** → `prisma` is now in `dependencies` ✅
2. **"Table does not exist"** → Run `npx prisma db push` against production
3. **"Connection timeout"** → Use connection pooler URL (port 6543)
4. **Build warnings** → `serverExternalPackages` is correctly configured ✅
