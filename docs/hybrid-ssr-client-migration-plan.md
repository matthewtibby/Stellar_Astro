# 🚀 Stellar Astro: Hybrid SSR/Client Data Fetching Migration Plan

---

## I. Project Stack & Current State Review

### A. Stack Overview
- **Framework:** Next.js (App Router and/or Pages Router)
- **Auth:** Supabase, using SSR helpers (`@supabase/ssr`)
- **State:** Zustand for client state, custom hooks (e.g., `useProjects`)
- **API:** Next.js API routes for some server logic
- **Data:** Supabase Postgres (projects, activity_log, etc.)

### B. Current Data Fetching
- **Auth:** SSR for login/session, but Zustand/client for most user state
- **Dashboard:** Projects fetched client-side via Zustand and `useProjects`
- **Other Pages:** Mostly client-side fetching

---

## II. Migration Goals

1. **SSR for Critical Pages:**  
   Login, Auth, Dashboard (and any other critical/SEO pages) should fetch data server-side for instant, secure, flicker-free loads.
2. **Client-Side for Others:**  
   All other pages/components can continue to use Zustand/hooks/client fetch.
3. **No Deletion of Critical Pages:**  
   All important pages (e.g., Dashboard) must be preserved and refactored, not removed.
4. **Dependency Awareness:**  
   All upstream (data providers, API routes) and downstream (components, hooks, stores) dependencies must be updated as needed.

---

## III. Migration Plan: Logical Sections & Steps

### A. Audit & Preparation

1. **Inventory All Pages & Data Fetching** ✅
   - List all pages/components that fetch user/project data:
     - **Pages:**
       - `app/dashboard/page.tsx` (Dashboard SSR target)
       - `app/login/page.tsx` (Login SSR target)
       - `app/profile/page.tsx` (Profile SSR target)
     - **Components:**
       - `app/dashboard/DashboardClient.tsx`
       - `src/components/DashboardPage.tsx`
       - `src/components/NewProjectModal.tsx`
       - `src/components/ProjectManagementPanel.tsx`
       - `src/components/ProjectChecklist.tsx`
       - `src/components/FileManagementPanel.tsx`
       - `src/components/UniversalFileUpload.tsx`
       - `src/components/AutoSaveIndicator.tsx`
     - **Hooks:**
       - `src/hooks/useProjects.ts`
       - `src/hooks/useAutoSave.ts`
     - **Zustand Stores:**
       - `src/store/project.ts`
       - `src/store/user.ts`
     - **API Routes:**
       - `/api/projects` (referenced in components)
       - `/api/activity-feed` (referenced in ActivityFeed)
       - `/api/notifications` (referenced in NotificationCenter)
   - Identify which should be SSR: Dashboard, Login, Profile (see above).
   - Identify all hooks, Zustand stores, and API routes that touch project/user data (see above).

2. **Backup & Version Control**
   - Ensure all code is committed and pushed.
   - Tag the current state for rollback if needed.

---

### B. Refactor Critical Pages to SSR

#### 1. Dashboard Page

a. **Move Project Fetching to Server**
- In `app/dashboard/page.tsx` (or `pages/dashboard.tsx` if using Pages Router):
  - Use `createServerClient` from `@supabase/ssr` to fetch projects for the logged-in user.
  - Pass projects as props to the dashboard client component.

b. **Update Dashboard Client Component**
- Accept `projects` as a prop.
- Render projects from props on initial load.
- Optionally, allow client-side updates (e.g., for real-time or user actions).

c. **Remove Initial Zustand/Hook Fetch**
- Do not fetch projects on initial client render in the dashboard.
- Only use client fetch for updates or background refreshes.

d. **Ensure Auth is SSR**
- Use SSR session to get the user; redirect to login if not authenticated.

#### 2. Login & Auth Pages
- Ensure all auth/session logic is SSR (already done, but review for consistency).

#### 3. Profile/Other Critical Pages
- Repeat the above for any other pages that should be SSR.

---

### C. Maintain/Refactor Client-Side Fetching for Other Pages

- Leave Zustand/hooks/client fetch in place for non-critical pages.
- Ensure these do not interfere with SSR-fetched data (e.g., don't overwrite SSR data on mount).

---

### D. Update Upstream/Downstream Dependencies

#### 1. Zustand Stores & Hooks
- Update `useProjects` and Zustand project store to accept initial data as an argument (for hydration from SSR).
- Ensure they do not refetch on mount if SSR data is present.

#### 2. API Routes
- Review any API routes that are used for project/user data.
- Ensure they are not being called unnecessarily from the client after SSR.

#### 3. Components
- Update any components that expect projects from Zustand to accept them as props (for SSR hydration).

#### 4. Types
- Ensure type consistency between DB, API, and client (e.g., `user_id` vs `userId`).

---

### E. Testing & Validation

1. **Manual Testing**
   - Test login, dashboard, and profile pages for SSR data loading.
   - Test navigation and client-side updates for projects.

2. **Automated Testing**
   - Add/Update tests for SSR data fetching and hydration.
   - Test edge cases (no projects, unauthenticated, etc.).

3. **Performance & UX**
   - Check for flicker/hydration mismatches.
   - Ensure instant load of projects on dashboard.

---

### F. Senior Architect/Engineer Review

1. **Code Review**
   - Review all changes for SSR/client split, data flow, and type safety.
   - Ensure no critical pages/components were deleted or broken.

2. **Dependency Audit**
   - Check all upstream (API, DB) and downstream (components, hooks) dependencies for breakage.

3. **Security & Privacy**
   - Ensure no sensitive data is leaked to the client.
   - Ensure SSR data is only available to authenticated users.

4. **Final Sign-Off**
   - Approve migration for production deployment.

---

## IV. Example: Dashboard SSR Refactor

### A. Server Component (App Router)

```tsx
// app/dashboard/page.tsx
import { createServerClient } from '@supabase/ssr';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    // Redirect to login
  }
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id);

  return <DashboardClient user={user} projects={projects || []} />;
}
```

### B. Dashboard Client Component

```tsx
// app/dashboard/DashboardClient.tsx
export default function DashboardClient({ user, projects }) {
  // Render projects from props
  // Use Zustand/hooks only for updates, not initial load
}
```

---

## V. Checklist for Migration

- [ ] Inventory all data-fetching pages/components
- [ ] Refactor Dashboard to SSR project fetching
- [ ] Update DashboardClient to accept SSR data
- [ ] Update Zustand/hooks for SSR hydration
- [ ] Review and update API routes as needed
- [ ] Test all critical flows (SSR and client)
- [ ] Senior engineer review and sign-off

---

## VI. Final Review & Sign-Off

- **No critical pages deleted**
- **SSR for critical pages, client fetch for others**
- **All dependencies updated**
- **Manual and automated tests pass**
- **Performance and security validated** 