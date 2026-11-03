-- ========================================================
-- ระบบแจ้งซ่อมและบริการอาคาร อุทยานวิทยาศาสตร์ มหาวิทยาลัยนเรศวร (Sci.Park@NU)
-- สคริปต์สร้างฐานข้อมูล Supabase (DDL, Functions & Policies)
-- ========================================================

-- 1. ตารางใบแจ้งซ่อม (tickets)
create table if not exists public.tickets (
  id text primary key,
  name text not null,
  email text not null,
  org text,
  ext text,
  tel text,
  cat text not null default 'ซ่อมแซม',
  bld text not null,
  flr text not null,
  room text not null,
  types text[] default '{}',
  items jsonb default '[]'::jsonb,
  urgent boolean default false,
  photos text[] default '{}',
  done_photos text[] default '{}',
  tech_id text,
  tech_name text,
  status text not null default 'accepted' check (status in ('accepted', 'doing', 'done', 'deleted')),
  history jsonb default '[]'::jsonb,
  note text,
  blocked boolean default false,
  budget numeric,
  cannot boolean default false,
  done_type text,
  done_at timestamptz,
  deleted_at timestamptz,
  deleted_by text,
  created_at timestamptz default now()
);

-- 2. ตารางการเบิกใช้วัสดุอุปกรณ์ (usage)
create table if not exists public.usage (
  id bigserial primary key,
  ticket_id text references public.tickets(id) on delete cascade,
  name text not null,
  qty numeric not null default 1,
  unit text default 'ชิ้น',
  tech_name text,
  created_at timestamptz default now()
);

-- เปิด RLS สำหรับ tickets และ usage
alter table public.tickets enable row level security;
alter table public.usage enable row level security;

create policy "Allow insert tickets for all" on public.tickets for insert with check (true);
create policy "Allow select tickets" on public.tickets for select using (true);
create policy "Allow update tickets" on public.tickets for update using (true);

create policy "Allow all on usage" on public.usage for all using (true) with check (true);

-- 3. ตารางข้อมูลโปรไฟล์ผู้ใช้งาน (Profiles)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  role text default 'reporter' check (role in ('reporter', 'tech', 'admin')),
  tel text,
  org text,
  created_at timestamptz default now()
);

-- Trigger สร้างข้อมูลลง profiles อัตโนมัติเมื่อมีการ Register ผ่าน auth.users
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, name, role, tel, org)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'reporter'),
    new.raw_user_meta_data->>'tel',
    new.raw_user_meta_data->>'org'
  )
  on conflict (id) do update set
    name = excluded.name,
    role = excluded.role,
    tel = excluded.tel,
    org = excluded.org;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- เปิด RLS สำหรับ profiles
alter table public.profiles enable row level security;
create policy "Allow read profiles" on public.profiles for select using (true);
create policy "Allow update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Allow insert own profile" on public.profiles for insert with check (true);

-- 4. ฟังก์ชันค้นหาใบงาน (track_ticket)
create or replace function track_ticket(p_id text, p_email text default null)
returns setof tickets language plpgsql security definer as $$
begin
  if p_email is not null and trim(p_email) <> '' then
    return query 
    select * from tickets 
    where upper(trim(id)) = upper(trim(p_id)) 
      and lower(email) = lower(trim(p_email));
  else
    return query 
    select * from tickets 
    where upper(trim(id)) = upper(trim(p_id));
  end if;
end;
$$;

grant execute on function track_ticket to anon, authenticated;

-- 5. ฟังก์ชันสำหรับให้ผู้แจ้งยกเลิกใบงานของตัวเอง (cancel_my_ticket)
create or replace function cancel_my_ticket(p_id text, p_email text) 
returns void language plpgsql security definer set search_path=public as $$
begin
  update tickets 
  set status = 'deleted', 
      deleted_at = now(), 
      deleted_by = 'ผู้แจ้ง (ยกเลิกเอง)', 
      history = history || jsonb_build_object('s', 'deleted', 'at', extract(epoch from now()) * 1000)
  where upper(trim(id)) = upper(trim(p_id)) 
    and lower(email) = lower(trim(p_email)) 
    and status = 'accepted' 
    and tech_id is null;
end $$;

grant execute on function cancel_my_ticket to anon, authenticated;

-- 6. ฟังก์ชันดึงประวัติใบงานทั้งหมดของผู้แจ้งด้วยอีเมล (get_my_tickets)
create or replace function get_my_tickets(p_email text)
returns setof tickets language plpgsql security definer as $$
begin
  return query 
  select * from tickets 
  where lower(trim(email)) = lower(trim(p_email))
  order by created_at desc;
end;
$$;

grant execute on function get_my_tickets to anon, authenticated;
