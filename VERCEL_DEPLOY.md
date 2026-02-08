# V-Ledge Deployment Instructions

## Vercel Configuration

### Build Settings

- **Build Command**: `prisma generate && next build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### Environment Variables Required

Add these in Vercel Project Settings > Environment Variables:

```
DATABASE_URL=postgresql://postgres.xxx:password@aws-1-us-east-1.pooler.supabase.com:6543/postgres
DIRECT_URL=postgresql://postgres.xxx:password@aws-1-us-east-1.pooler.supabase.com:5432/postgres
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

### Important Notes

1. `prisma` package MUST be in `dependencies`, not `devDependencies`
2. `postinstall` script runs `prisma generate` automatically
3. Prisma v7 requires `prisma.config.ts` and driver adapters
4. Connection pooling is handled via Supabase pooler (port 6543)
