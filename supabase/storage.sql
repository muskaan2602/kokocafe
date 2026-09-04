-- ============================================================
-- KOKO Café — Supabase Storage Setup
-- Run this in Supabase SQL Editor ONCE
-- ============================================================

-- Create the menu-images bucket (public so images show on customer menu)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'menu-images',
  'menu-images',
  true,
  5242880,   -- 5 MB max per file
  array['image/jpeg','image/jpg','image/png','image/webp','image/gif']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg','image/jpg','image/png','image/webp','image/gif'];

-- Allow authenticated users (managers/admins) to upload
create policy "auth_upload_menu_images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'menu-images');

-- Allow authenticated users to update/delete their uploads
create policy "auth_update_menu_images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'menu-images');

create policy "auth_delete_menu_images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'menu-images');

-- Allow EVERYONE to read/view images (needed for customer menu)
create policy "public_read_menu_images"
  on storage.objects for select
  to public
  using (bucket_id = 'menu-images');
