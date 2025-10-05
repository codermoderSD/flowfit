-- Add major break settings to user_settings table
alter table public.user_settings
add column if not exists major_break_interval integer not null default 4,
add column if not exists major_break_duration integer not null default 15;

-- Update existing rows with default values
update public.user_settings
set major_break_interval = 4, major_break_duration = 15
where major_break_interval is null or major_break_duration is null;
