-- Insert a test user into auth.users (adjust if you use a different auth system)
insert into auth.users (id, email, encrypted_password, email_confirmed_at)
values ('00000000-0000-0000-0000-000000000001', 'testuser1@example.com', crypt('password', gen_salt('bf')), now());

-- Insert into profiles table (no email, add username, avatar_url, timestamps)
insert into public.profiles (id, username, full_name, avatar_url, created_at, updated_at)
values (
  '00000000-0000-0000-0000-000000000001',
  'testuser1',
  'Test User 1',
  null,
  now(),
  now()
);

-- Insert an annual subscription for the test user (if not already present)
insert into public.subscriptions (
  user_id,
  plan,
  status,
  current_period_start,
  current_period_end,
  created_at,
  updated_at
) values (
  '00000000-0000-0000-0000-000000000001',
  'pro-annual',
  'active',
  now(),
  now() + interval '1 year',
  now(),
  now()
); 