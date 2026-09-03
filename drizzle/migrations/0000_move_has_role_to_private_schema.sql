create schema if not exists private;
revoke all on schema private from anon, authenticated;
grant usage on schema private to authenticated, service_role;

create or replace function private.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

revoke all on function private.has_role(uuid, public.app_role) from public, anon;
grant execute on function private.has_role(uuid, public.app_role) to authenticated, service_role;

drop policy if exists "admins read all roles" on public.user_roles;
drop policy if exists "admins manage roles" on public.user_roles;
drop policy if exists "admins read all profiles" on public.profiles;

create policy "admins read all roles" on public.user_roles
  for select to authenticated using (private.has_role(auth.uid(), 'admin'));

create policy "admins manage roles" on public.user_roles
  for all to authenticated
  using (private.has_role(auth.uid(), 'admin'))
  with check (private.has_role(auth.uid(), 'admin'));

create policy "admins read all profiles" on public.profiles
  for select to authenticated using (private.has_role(auth.uid(), 'admin'));

drop function if exists public.has_role(uuid, public.app_role);