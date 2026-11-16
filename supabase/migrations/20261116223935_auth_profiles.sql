-- WorkBoard · auth and profiles
-- 1. Creates the profile when a user signs up.
-- 2. Lets the sign-up form check whether a nickname is free.
-- 3. Resolves a nickname to its email for the sign-in Edge Function only.

-- ─────────────────────────────────────────────
-- 1. Profile on sign-up
-- ─────────────────────────────────────────────

-- The app sends full_name and nickname as sign-up metadata. They are used only
-- to fill in the profile (display data), never for authorization.
-- If the nickname is missing, invalid or taken, the insert fails and so does
-- the sign-up, so every account always has a valid profile.
create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, nickname)
  values (
    new.id,
    btrim(new.raw_user_meta_data ->> 'full_name'),
    lower(btrim(new.raw_user_meta_data ->> 'nickname'))
  );
  return new;
end;
$$;

revoke execute on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- ─────────────────────────────────────────────
-- 2. Nickname availability (sign-up form)
-- ─────────────────────────────────────────────

-- Runs as definer because visitors cannot read profiles. It only returns a
-- boolean: no profile data leaves the database.
create function public.is_nickname_available(candidate text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (
    select 1
    from public.profiles p
    where p.nickname = lower(btrim(candidate))
  );
$$;

comment on function public.is_nickname_available(text) is
  'True if no account uses this nickname (case-insensitive). Used by the sign-up form.';

revoke execute on function public.is_nickname_available(text) from public;
grant execute on function public.is_nickname_available(text) to anon, authenticated;

-- ─────────────────────────────────────────────
-- 3. Nickname → email (sign-in Edge Function only)
-- ─────────────────────────────────────────────

-- Only the service role (the sign-in Edge Function, using the secret key) can
-- call it, so emails are never returned to apps.
create function public.email_for_nickname(candidate text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select u.email::text
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.nickname = lower(btrim(candidate));
$$;

comment on function public.email_for_nickname(text) is
  'Email of the account with this nickname. Callable only by the service role (sign-in Edge Function).';

revoke execute on function public.email_for_nickname(text) from public, anon, authenticated;
grant execute on function public.email_for_nickname(text) to service_role;
