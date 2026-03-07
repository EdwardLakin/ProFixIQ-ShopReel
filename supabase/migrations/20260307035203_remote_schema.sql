drop policy "agent_actions_deny_all" on "public"."agent_actions";

drop policy "agent_messages_deny_all" on "public"."agent_messages";

drop policy "Public can read published reviews" on "public"."shop_reviews";

revoke delete on table "public"."ai_events" from "authenticated";

revoke update on table "public"."ai_events" from "authenticated";

revoke delete on table "public"."customers" from "anon";

revoke insert on table "public"."customers" from "anon";

revoke references on table "public"."customers" from "anon";

revoke select on table "public"."customers" from "anon";

revoke trigger on table "public"."customers" from "anon";

revoke truncate on table "public"."customers" from "anon";

revoke update on table "public"."customers" from "anon";

revoke delete on table "public"."inspections" from "anon";

revoke insert on table "public"."inspections" from "anon";

revoke references on table "public"."inspections" from "anon";

revoke select on table "public"."inspections" from "anon";

revoke trigger on table "public"."inspections" from "anon";

revoke truncate on table "public"."inspections" from "anon";

revoke update on table "public"."inspections" from "anon";

revoke delete on table "public"."shops" from "authenticated";

revoke insert on table "public"."shops" from "authenticated";

revoke delete on table "public"."vehicles" from "anon";

revoke insert on table "public"."vehicles" from "anon";

revoke references on table "public"."vehicles" from "anon";

revoke select on table "public"."vehicles" from "anon";

revoke trigger on table "public"."vehicles" from "anon";

revoke truncate on table "public"."vehicles" from "anon";

revoke update on table "public"."vehicles" from "anon";

revoke delete on table "public"."work_order_lines" from "anon";

revoke insert on table "public"."work_order_lines" from "anon";

revoke references on table "public"."work_order_lines" from "anon";

revoke select on table "public"."work_order_lines" from "anon";

revoke trigger on table "public"."work_order_lines" from "anon";

revoke truncate on table "public"."work_order_lines" from "anon";

revoke update on table "public"."work_order_lines" from "anon";

revoke references on table "public"."work_order_lines" from "authenticated";

revoke trigger on table "public"."work_order_lines" from "authenticated";

revoke truncate on table "public"."work_order_lines" from "authenticated";


  create policy "agent_actions_deny_all"
  on "public"."agent_actions"
  as permissive
  for all
  to anon, authenticated
using (false)
with check (false);



  create policy "agent_messages_deny_all"
  on "public"."agent_messages"
  as permissive
  for all
  to anon, authenticated
using (false)
with check (false);



  create policy "Public can read published reviews"
  on "public"."shop_reviews"
  as permissive
  for select
  to anon, authenticated
using ((is_public = true));


CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


  create policy "chat_realtime_insert"
  on "realtime"."messages"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.conversation_participants cp
  WHERE (((cp.conversation_id)::text = split_part(messages.topic, ':'::text, 2)) AND (cp.user_id = auth.uid())))));



  create policy "chat_realtime_select"
  on "realtime"."messages"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.conversation_participants cp
  WHERE (((cp.conversation_id)::text = split_part(messages.topic, ':'::text, 2)) AND (cp.user_id = auth.uid())))));



  create policy "conversation_members_can_read"
  on "realtime"."messages"
  as permissive
  for select
  to authenticated
using (((topic ~~ 'conversation:%:messages'::text) AND (EXISTS ( SELECT 1
   FROM public.conversation_participants cp
  WHERE ((cp.user_id = auth.uid()) AND (cp.conversation_id = (split_part(messages.topic, ':'::text, 2))::uuid))))));



  create policy "conversation_members_can_write"
  on "realtime"."messages"
  as permissive
  for insert
  to authenticated
with check (((topic ~~ 'conversation:%:messages'::text) AND (EXISTS ( SELECT 1
   FROM public.conversation_participants cp
  WHERE ((cp.user_id = auth.uid()) AND (cp.conversation_id = (split_part(messages.topic, ':'::text, 2))::uuid))))));



  create policy "admin_delete_all_inspection_photos"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'inspection_photos'::text) AND public.is_admin()));



  create policy "admin_read_all_inspection_photos"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'inspection_photos'::text) AND public.is_admin()));



  create policy "admin_update_all_inspection_photos"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'inspection_photos'::text) AND public.is_admin()))
with check (((bucket_id = 'inspection_photos'::text) AND public.is_admin()));



  create policy "agent_uploads_delete"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'agent_uploads'::text) AND ((storage.foldername(name))[1] = (public.current_shop_id())::text) AND ((storage.foldername(name))[2] = (auth.uid())::text)));



  create policy "agent_uploads_delete_auth"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using ((bucket_id = 'agent_uploads'::text));



  create policy "agent_uploads_insert_auth"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'agent_uploads'::text));



  create policy "agent_uploads_objects_delete"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'agent_uploads'::text) AND (owner = auth.uid())));



  create policy "agent_uploads_objects_insert"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'agent_uploads'::text));



  create policy "agent_uploads_objects_select"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using ((bucket_id = 'agent_uploads'::text));



  create policy "agent_uploads_objects_update"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using ((bucket_id = 'agent_uploads'::text));



  create policy "agent_uploads_read"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'agent_uploads'::text) AND ((storage.foldername(name))[1] = (public.current_shop_id())::text)));



  create policy "agent_uploads_select_auth"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using ((bucket_id = 'agent_uploads'::text));



  create policy "agent_uploads_update"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'agent_uploads'::text) AND ((storage.foldername(name))[1] = (public.current_shop_id())::text) AND ((storage.foldername(name))[2] = (auth.uid())::text)))
with check (((bucket_id = 'agent_uploads'::text) AND ((storage.foldername(name))[1] = (public.current_shop_id())::text) AND ((storage.foldername(name))[2] = (auth.uid())::text)));



  create policy "agent_uploads_update_auth"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using ((bucket_id = 'agent_uploads'::text))
with check ((bucket_id = 'agent_uploads'::text));



  create policy "agent_uploads_write"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'agent_uploads'::text) AND ((storage.foldername(name))[1] = (public.current_shop_id())::text) AND ((storage.foldername(name))[2] = (auth.uid())::text)));



  create policy "edocs_bucket_guard"
  on "storage"."objects"
  as permissive
  for all
  to public
using ((bucket_id = 'employee_docs'::text))
with check ((bucket_id = 'employee_docs'::text));



  create policy "fleet-forms uploads (images + pdf)"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'fleet-forms'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text) AND (lower(storage.extension(name)) = ANY (ARRAY['jpg'::text, 'jpeg'::text, 'png'::text, 'gif'::text, 'webp'::text, 'heic'::text, 'heif'::text, 'tif'::text, 'tiff'::text, 'pdf'::text]))));



  create policy "fleet_forms_service_role_all"
  on "storage"."objects"
  as permissive
  for all
  to service_role
using ((bucket_id = 'fleet-forms'::text))
with check ((bucket_id = 'fleet-forms'::text));



  create policy "fleet_forms_user_delete"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'fleet-forms'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));



  create policy "fleet_forms_user_insert"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'fleet-forms'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));



  create policy "fleet_forms_user_select"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'fleet-forms'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));



  create policy "fleet_forms_user_update"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'fleet-forms'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)))
with check (((bucket_id = 'fleet-forms'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));



  create policy "inspection pdfs read (scoped)"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'inspection_pdfs'::text) AND (EXISTS ( SELECT 1
   FROM ((public.inspections i
     JOIN public.work_orders w ON ((w.id = i.work_order_id)))
     JOIN public.profiles p ON (((p.id = auth.uid()) AND (p.shop_id = w.shop_id))))
  WHERE (i.pdf_storage_path = objects.name)))));



  create policy "inspection_pdfs_insert_shop"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'inspection_pdfs'::text) AND (name ~~ (('shops/'::text || (public.current_shop_id())::text) || '/%'::text))));



  create policy "inspection_pdfs_read_shop"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'inspection_pdfs'::text) AND (name ~~ (('shops/'::text || (public.current_shop_id())::text) || '/%'::text))));



  create policy "inspection_pdfs_update_shop"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'inspection_pdfs'::text) AND (name ~~ (('shops/'::text || (public.current_shop_id())::text) || '/%'::text))))
with check (((bucket_id = 'inspection_pdfs'::text) AND (name ~~ (('shops/'::text || (public.current_shop_id())::text) || '/%'::text))));



  create policy "inspection_photos_delete_shop"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'inspection_photos'::text) AND (name ~~ (('shops/'::text || (public.current_shop_id())::text) || '/%'::text))));



  create policy "inspection_photos_insert_shop"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'inspection_photos'::text) AND (name ~~ (('shops/'::text || (public.current_shop_id())::text) || '/%'::text))));



  create policy "inspection_photos_read_shop"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'inspection_photos'::text) AND (name ~~ (('shops/'::text || (public.current_shop_id())::text) || '/%'::text))));



  create policy "inspection_photos_update_shop"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'inspection_photos'::text) AND (name ~~ (('shops/'::text || (public.current_shop_id())::text) || '/%'::text))))
with check (((bucket_id = 'inspection_photos'::text) AND (name ~~ (('shops/'::text || (public.current_shop_id())::text) || '/%'::text))));



  create policy "job_photos_delete"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using ((bucket_id = 'job-photos'::text));



  create policy "job_photos_insert"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'job-photos'::text));



  create policy "job_photos_select"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using ((bucket_id = 'job-photos'::text));



  create policy "job_photos_update"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using ((bucket_id = 'job-photos'::text))
with check ((bucket_id = 'job-photos'::text));



  create policy "part_images_delete"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using ((bucket_id = 'part_images'::text));



  create policy "part_images_insert"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'part_images'::text));



  create policy "part_images_select"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using ((bucket_id = 'part_images'::text));



  create policy "part_images_update"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using ((bucket_id = 'part_images'::text))
with check ((bucket_id = 'part_images'::text));



  create policy "parts_bucket_guard"
  on "storage"."objects"
  as permissive
  for all
  to public
using ((bucket_id = 'parts-photos'::text))
with check ((bucket_id = 'parts-photos'::text));



  create policy "planner_uploads_delete"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'planner_uploads'::text) AND ((storage.foldername(name))[1] = (public.current_shop_id())::text) AND ((storage.foldername(name))[2] = (auth.uid())::text)));



  create policy "planner_uploads_read"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'planner_uploads'::text) AND ((storage.foldername(name))[1] = (public.current_shop_id())::text)));



  create policy "planner_uploads_update"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'planner_uploads'::text) AND ((storage.foldername(name))[1] = (public.current_shop_id())::text) AND ((storage.foldername(name))[2] = (auth.uid())::text)))
with check (((bucket_id = 'planner_uploads'::text) AND ((storage.foldername(name))[1] = (public.current_shop_id())::text) AND ((storage.foldername(name))[2] = (auth.uid())::text)));



  create policy "planner_uploads_write"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'planner_uploads'::text) AND ((storage.foldername(name))[1] = (public.current_shop_id())::text) AND ((storage.foldername(name))[2] = (auth.uid())::text)));



  create policy "pphotos_bucket_guard"
  on "storage"."objects"
  as permissive
  for all
  to public
using ((bucket_id = 'profile-photos'::text))
with check ((bucket_id = 'profile-photos'::text));



  create policy "quotes_bucket_guard"
  on "storage"."objects"
  as permissive
  for all
  to public
using ((bucket_id = 'quotes'::text))
with check ((bucket_id = 'quotes'::text));



  create policy "quotes_delete"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using ((bucket_id = 'quotes'::text));



  create policy "quotes_insert"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'quotes'::text));



  create policy "quotes_read"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using ((bucket_id = 'quotes'::text));



  create policy "quotes_update"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using ((bucket_id = 'quotes'::text))
with check ((bucket_id = 'quotes'::text));



  create policy "quotes_write"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'quotes'::text));



  create policy "shop-imports delete"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'shop-imports'::text) AND (split_part(name, '/'::text, 1) IN ( SELECT (profiles.shop_id)::text AS shop_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid())))));



  create policy "shop-imports insert"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'shop-imports'::text) AND (split_part(name, '/'::text, 1) IN ( SELECT (profiles.shop_id)::text AS shop_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid())))));



  create policy "shop-imports read scoped to shop folder"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'shop-imports'::text) AND ((name ~~ (('shops/'::text || ( SELECT (profiles.shop_id)::text AS shop_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))) || '/%'::text)) OR (name ~~ (( SELECT (profiles.shop_id)::text AS shop_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid())) || '/%'::text)))));



  create policy "shop-imports read"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'shop-imports'::text) AND (split_part(name, '/'::text, 1) IN ( SELECT (profiles.shop_id)::text AS shop_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid())))));



  create policy "shop-imports update"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'shop-imports'::text) AND (split_part(name, '/'::text, 1) IN ( SELECT (profiles.shop_id)::text AS shop_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid())))))
with check (((bucket_id = 'shop-imports'::text) AND (split_part(name, '/'::text, 1) IN ( SELECT (profiles.shop_id)::text AS shop_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid())))));



  create policy "shop-imports upload scoped to shop folder"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'shop-imports'::text) AND ((name ~~ (('shops/'::text || ( SELECT (profiles.shop_id)::text AS shop_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid()))) || '/%'::text)) OR (name ~~ (( SELECT (profiles.shop_id)::text AS shop_id
   FROM public.profiles
  WHERE (profiles.id = auth.uid())) || '/%'::text)))));



  create policy "signatures_delete_auth"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using ((bucket_id = 'signatures'::text));



  create policy "signatures_insert_auth"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'signatures'::text));



  create policy "signatures_select_auth"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using ((bucket_id = 'signatures'::text));



  create policy "signatures_update_auth"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using ((bucket_id = 'signatures'::text))
with check ((bucket_id = 'signatures'::text));



  create policy "storage_read_by_auth"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (true);



  create policy "user reads fleet forms"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'fleet-forms'::text) AND (COALESCE((storage.foldername(name))[1], ''::text) = (( SELECT auth.uid() AS uid))::text)));



  create policy "user reads own fleet forms"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'fleet-forms'::text) AND (COALESCE((storage.foldername(name))[1], ''::text) = (( SELECT auth.uid() AS uid))::text)));



  create policy "user uploads fleet forms"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'fleet-forms'::text) AND (COALESCE((storage.foldername(name))[1], ''::text) = (( SELECT auth.uid() AS uid))::text) AND (lower(storage.extension(name)) = ANY (ARRAY['jpg'::text, 'jpeg'::text, 'png'::text, 'heic'::text, 'pdf'::text]))));



  create policy "vdocs_bucket_guard"
  on "storage"."objects"
  as permissive
  for all
  to public
using ((bucket_id = 'vehicle-docs'::text))
with check ((bucket_id = 'vehicle-docs'::text));



  create policy "vehicle-photos delete own"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'vehicle-photos'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));



  create policy "vphotos_bucket_guard"
  on "storage"."objects"
  as permissive
  for all
  to public
using ((bucket_id = 'vehicle-photos'::text))
with check ((bucket_id = 'vehicle-photos'::text));



  create policy "workorders_bucket_guard"
  on "storage"."objects"
  as permissive
  for all
  to public
using ((bucket_id = 'workorders'::text))
with check ((bucket_id = 'workorders'::text));



