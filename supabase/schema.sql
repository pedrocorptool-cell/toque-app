-- Toqué : tables, accès et ID d'invitation.
-- À coller une fois dans Supabase > SQL Editor, puis « Run ». Le relancer ne casse rien.
-- Prérequis : Authentication > Sign In / Providers > « Allow anonymous sign-ins » activé.

-- Un espace par personne, rattaché à son ID d'invitation (FolleCourgette#0001).
create table if not exists public.spaces (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  -- Pseudo, avatar, parts par défaut, sonnerie : réglages du profil.
  profile jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Téléphones rattachés à un espace : un utilisateur anonyme Supabase par installation.
create table if not exists public.space_members (
  user_id uuid primary key references auth.users (id) on delete cascade,
  space_id uuid not null references public.spaces (id) on delete cascade,
  joined_at timestamptz not null default now()
);

create table if not exists public.recipes (
  space_id uuid not null references public.spaces (id) on delete cascade,
  id text not null,
  position int not null default 0,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (space_id, id)
);

create table if not exists public.categories (
  space_id uuid not null references public.spaces (id) on delete cascade,
  id text not null,
  position int not null default 0,
  data jsonb not null,
  primary key (space_id, id)
);

create table if not exists public.shopping_items (
  space_id uuid not null references public.spaces (id) on delete cascade,
  id text not null,
  position int not null default 0,
  data jsonb not null,
  primary key (space_id, id)
);

-- Essais d'ID ratés, pour bloquer qui tenterait de deviner un ID.
create table if not exists public.join_attempts (
  user_id uuid not null,
  at timestamptz not null default now()
);
create index if not exists join_attempts_user_at on public.join_attempts (user_id, at);

-- L'espace du téléphone qui fait la demande (aucun s'il n'a pas encore saisi d'ID).
create or replace function public.my_space() returns uuid
language sql stable security definer set search_path = public as $$
  select space_id from public.space_members where user_id = auth.uid()
$$;

-- Rattache le téléphone à l'espace de cet ID. 5 essais ratés en 15 minutes bloquent les suivants.
create or replace function public.join_space(p_code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_space uuid;
  v_fails int;
begin
  if auth.uid() is null then
    raise exception 'not_signed_in';
  end if;
  select count(*) into v_fails from public.join_attempts
    where user_id = auth.uid() and at > now() - interval '15 minutes';
  if v_fails >= 5 then
    raise exception 'too_many_attempts';
  end if;
  select id into v_space from public.spaces where lower(code) = lower(trim(p_code));
  if v_space is null then
    insert into public.join_attempts (user_id) values (auth.uid());
    return null;
  end if;
  insert into public.space_members (user_id, space_id) values (auth.uid(), v_space)
    on conflict (user_id) do update set space_id = excluded.space_id, joined_at = now();
  return v_space;
end;
$$;

revoke all on function public.join_space(text) from public, anon;
grant execute on function public.join_space(text) to authenticated;
grant execute on function public.my_space() to authenticated;

-- Accès : chacun ne voit et ne modifie que son espace.
alter table public.spaces enable row level security;
alter table public.space_members enable row level security;
alter table public.recipes enable row level security;
alter table public.categories enable row level security;
alter table public.shopping_items enable row level security;
alter table public.join_attempts enable row level security;

drop policy if exists "mon espace" on public.spaces;
create policy "mon espace" on public.spaces for select to authenticated using (id = public.my_space());
drop policy if exists "mon profil" on public.spaces;
create policy "mon profil" on public.spaces for update to authenticated
  using (id = public.my_space()) with check (id = public.my_space());

drop policy if exists "mon rattachement" on public.space_members;
create policy "mon rattachement" on public.space_members for select to authenticated using (user_id = auth.uid());
drop policy if exists "me détacher" on public.space_members;
create policy "me détacher" on public.space_members for delete to authenticated using (user_id = auth.uid());

drop policy if exists "mes recettes" on public.recipes;
create policy "mes recettes" on public.recipes for all to authenticated
  using (space_id = public.my_space()) with check (space_id = public.my_space());
drop policy if exists "mes catégories" on public.categories;
create policy "mes catégories" on public.categories for all to authenticated
  using (space_id = public.my_space()) with check (space_id = public.my_space());
drop policy if exists "ma liste" on public.shopping_items;
create policy "ma liste" on public.shopping_items for all to authenticated
  using (space_id = public.my_space()) with check (space_id = public.my_space());

-- Images des recettes importées (vignettes, avatars des créateurs, photos) : lisibles par tous, chaque téléphone
-- n'écrit que dans le dossier de son espace.
insert into storage.buckets (id, name, public) values ('recipe-images', 'recipe-images', true)
  on conflict (id) do nothing;
drop policy if exists "images de mon espace" on storage.objects;
create policy "images de mon espace" on storage.objects for insert to authenticated
  with check (bucket_id = 'recipe-images' and (storage.foldername(name))[1] = public.my_space()::text);

-- Ton espace. Pour un ami, relance seulement cette ligne avec son ID.
insert into public.spaces (code) values ('FolleCourgette#0001') on conflict (code) do nothing;
