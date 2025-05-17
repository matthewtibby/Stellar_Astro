This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Supabase SSR Authentication

This project uses [`@supabase/ssr`](https://supabase.com/docs/guides/auth/server-side/nextjs) for all authentication and server-side rendering (SSR) with Supabase. 

- **All legacy usage of `@supabase/auth-helpers-nextjs` has been removed.**
- Middleware and API routes now use `createServerClient` from `@supabase/ssr` for secure, modern SSR authentication.
- See `middleware.ts` and `src/lib/supabase.ts` for implementation details.

**If you are looking for examples of SSR authentication, refer to these files:**
- `middleware.ts` (protects routes, handles session cookies)
- `pages/api/dashboard-stats.ts` (uses SSR client for authenticated API access)
- `src/lib/supabase.ts` (exports helpers for browser and server usage)

For more information, see the [Supabase SSR docs](https://supabase.com/docs/guides/auth/server-side/nextjs).
