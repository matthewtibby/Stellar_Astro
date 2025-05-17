# Auth-Related Pages & Components Reference

This list tracks all files in the codebase that use authentication logic, Zustand user state, or Supabase session management. Use this as a checklist for SSR auth migration and future audits.

| File/Component                        | Auth Usage Type                |
|---------------------------------------|-------------------------------|
| app/login/page.tsx                    | Login, Zustand, redirect      |
| app/dashboard/page.tsx                | SSR user fetch, prop passing  |
| app/profile/page.tsx                  | Zustand, redirect, role fetch |
| app/admin/permissions/page.tsx        | Zustand, Supabase client      |
| app/signup/page.tsx                   | Signup                        |
| app/signup/verify-email/page.tsx      | Email verification            |
| src/components/Header.tsx              | Zustand, logout, UI           |
| src/components/AuthSync.tsx            | Zustand, session sync         |
| src/hooks/useProjects.ts               | Zustand, Supabase client      |
| src/store/user.ts                      | Zustand user/session store    |
| src/store/project.ts                   | Zustand, Supabase client      |
| middleware.ts                          | SSR user check, redirect      |
| utils/supabase/server.ts               | Server client                 |
| src/lib/supabase.ts                    | Client/server/admin clients   |
| utils/supabase/client.ts               | Browser client                |
| scripts/create_test_user.js            | Signup script                 |
| test-supabase.js                       | Auth test script              | 