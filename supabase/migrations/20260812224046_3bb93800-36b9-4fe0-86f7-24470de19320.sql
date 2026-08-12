create type public.app_role as enum ('admin','moderator','user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "read own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);
create policy "admins read all roles" on public.user_roles for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admins manage roles" on public.user_roles for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  project_id uuid,
  feature text not null default 'general',
  model text,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  total_tokens integer not null default 0,
  credits numeric not null default 0,
  created_at timestamptz not null default now()
);
grant select, insert on public.ai_usage_events to authenticated;
grant all on public.ai_usage_events to service_role;
alter table public.ai_usage_events enable row level security;
create policy "own ai usage" on public.ai_usage_events for select to authenticated using (auth.uid() = user_id);
create policy "insert own ai usage" on public.ai_usage_events for insert to authenticated with check (auth.uid() = user_id);
create policy "admins read ai usage" on public.ai_usage_events for select to authenticated using (public.has_role(auth.uid(),'admin'));
create index ai_usage_events_created_idx on public.ai_usage_events (created_at desc);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  plan text not null default 'pro',
  status text not null default 'active',
  amount_cents integer not null default 0,
  currency text not null default 'usd',
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, plan)
);
grant select on public.subscriptions to authenticated;
grant all on public.subscriptions to service_role;
alter table public.subscriptions enable row level security;
create policy "own subscription" on public.subscriptions for select to authenticated using (auth.uid() = user_id);
create policy "admins read subscriptions" on public.subscriptions for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admins manage subscriptions" on public.subscriptions for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create trigger t_subscriptions_updated before update on public.subscriptions for each row execute function public.set_updated_at();