-- Phase 4: Safe Apply Changes - audit log table
create table if not exists public.ai_patch_audit (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id),
  file_path text not null,
  diff_hash text not null,
  applied_hunks jsonb not null default '[]'::jsonb,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists ai_patch_audit_user_idx on public.ai_patch_audit(user_id);
create index if not exists ai_patch_audit_file_idx on public.ai_patch_audit(file_path);
