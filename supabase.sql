-- 1. ตารางข้อมูลโปรไฟล์ผู้ใช้งาน (Profiles)
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

-- 2. ฟังก์ชันค้นหาใบงาน (track_ticket)
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

-- 3. ฟังก์ชันสำหรับให้ผู้แจ้งยกเลิกใบงานของตัวเอง (cancel_my_ticket)
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
