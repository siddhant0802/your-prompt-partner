create policy "Anyone can read project images" on storage.objects for select to anon, authenticated using (bucket_id = 'project-images');
create policy "Admins upload project images" on storage.objects for insert to authenticated with check (bucket_id = 'project-images' and public.has_role(auth.uid(), 'admin'));
create policy "Admins update project images" on storage.objects for update to authenticated using (bucket_id = 'project-images' and public.has_role(auth.uid(), 'admin'));
create policy "Admins delete project images" on storage.objects for delete to authenticated using (bucket_id = 'project-images' and public.has_role(auth.uid(), 'admin'));
create policy "Admins read deliverables" on storage.objects for select to authenticated using (bucket_id = 'project-deliverables' and public.has_role(auth.uid(), 'admin'));
create policy "Admins upload deliverables" on storage.objects for insert to authenticated with check (bucket_id = 'project-deliverables' and public.has_role(auth.uid(), 'admin'));
create policy "Admins delete deliverables" on storage.objects for delete to authenticated using (bucket_id = 'project-deliverables' and public.has_role(auth.uid(), 'admin'));