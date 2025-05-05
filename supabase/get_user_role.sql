create or replace function public.get_user_role()
returns text
language sql
security definer
as $$
  select role from auth.users where id = auth.uid();
$$; 