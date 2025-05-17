create type "public"."file_type" as enum ('light', 'dark', 'flat', 'bias', 'master', 'final');

create type "public"."processing_status" as enum ('pending', 'processing', 'completed', 'failed');

create sequence "public"."fits_metadata_id_seq";

drop policy "Service role can do anything on profiles" on "public"."profiles";

drop policy "Project files are viewable by project owner and if project is p" on "public"."project_files";

drop policy "Users can create files in their own projects" on "public"."project_files";

drop policy "Project shares are viewable by anyone" on "public"."project_shares";

drop policy "Project shares can be created by project owners" on "public"."project_shares";

drop policy "Project shares can be deleted by project owners" on "public"."project_shares";

drop policy "Projects are viewable by owner and if public" on "public"."projects";

drop policy "Super users have full access to projects" on "public"."projects";

drop policy "Service role can do anything on subscriptions" on "public"."subscriptions";

drop policy "Public projects are viewable by anyone" on "public"."projects";

drop policy "Users can create their own projects" on "public"."projects";

drop policy "Users can delete their own projects" on "public"."projects";

drop policy "Users can update their own projects" on "public"."projects";

revoke delete on table "public"."project_shares" from "anon";

revoke insert on table "public"."project_shares" from "anon";

revoke references on table "public"."project_shares" from "anon";

revoke select on table "public"."project_shares" from "anon";

revoke trigger on table "public"."project_shares" from "anon";

revoke truncate on table "public"."project_shares" from "anon";

revoke update on table "public"."project_shares" from "anon";

revoke delete on table "public"."project_shares" from "authenticated";

revoke insert on table "public"."project_shares" from "authenticated";

revoke references on table "public"."project_shares" from "authenticated";

revoke select on table "public"."project_shares" from "authenticated";

revoke trigger on table "public"."project_shares" from "authenticated";

revoke truncate on table "public"."project_shares" from "authenticated";

revoke update on table "public"."project_shares" from "authenticated";

revoke delete on table "public"."project_shares" from "service_role";

revoke insert on table "public"."project_shares" from "service_role";

revoke references on table "public"."project_shares" from "service_role";

revoke select on table "public"."project_shares" from "service_role";

revoke trigger on table "public"."project_shares" from "service_role";

revoke truncate on table "public"."project_shares" from "service_role";

revoke update on table "public"."project_shares" from "service_role";

alter table "public"."project_files" drop constraint "project_files_project_id_fkey";

alter table "public"."project_shares" drop constraint "project_shares_project_id_fkey";

alter table "public"."project_shares" drop constraint "project_shares_project_id_key";

alter table "public"."projects" drop constraint "projects_user_id_fkey";

drop function if exists "public"."is_project_shared"(project_id uuid);

alter table "public"."project_shares" drop constraint "project_shares_pkey";

drop index if exists "public"."project_shares_pkey";

drop index if exists "public"."project_shares_project_id_key";

drop table "public"."project_shares";

create table "public"."comments" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid not null,
    "post_id" uuid not null,
    "content" text not null,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);


alter table "public"."comments" enable row level security;

create table "public"."community_posts" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid not null,
    "project_id" uuid,
    "title" text not null,
    "content" text,
    "image_url" text,
    "likes_count" integer default 0,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);


alter table "public"."community_posts" enable row level security;

create table "public"."fits_files" (
    "id" uuid not null default uuid_generate_v4(),
    "project_id" uuid not null,
    "file_type" file_type not null,
    "file_path" text not null,
    "file_size" bigint not null,
    "metadata" jsonb,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now())
);


alter table "public"."fits_files" enable row level security;

create table "public"."fits_metadata" (
    "id" integer not null default nextval('fits_metadata_id_seq'::regclass),
    "file_path" text not null,
    "project_id" uuid not null,
    "user_id" uuid not null,
    "metadata" jsonb not null,
    "created_at" timestamp with time zone default now()
);


create table "public"."likes" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid not null,
    "post_id" uuid not null,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now())
);


alter table "public"."likes" enable row level security;

create table "public"."payment_methods" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid not null,
    "stripe_payment_method_id" text not null,
    "type" text not null,
    "card_brand" text,
    "card_last4" text,
    "card_exp_month" integer,
    "card_exp_year" integer,
    "is_default" boolean default false,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);


alter table "public"."payment_methods" enable row level security;

create table "public"."processing_steps" (
    "id" uuid not null default uuid_generate_v4(),
    "project_id" uuid not null,
    "step_name" text not null,
    "status" processing_status not null default 'pending'::processing_status,
    "input_files" uuid[] not null,
    "output_files" uuid[],
    "parameters" jsonb,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);


alter table "public"."processing_steps" enable row level security;

alter table "public"."projects" drop column "current_step";

alter sequence "public"."fits_metadata_id_seq" owned by "public"."fits_metadata"."id";

CREATE UNIQUE INDEX comments_pkey ON public.comments USING btree (id);

CREATE UNIQUE INDEX community_posts_pkey ON public.community_posts USING btree (id);

CREATE UNIQUE INDEX fits_files_pkey ON public.fits_files USING btree (id);

CREATE UNIQUE INDEX fits_metadata_file_path_key ON public.fits_metadata USING btree (file_path);

CREATE UNIQUE INDEX fits_metadata_pkey ON public.fits_metadata USING btree (id);

CREATE UNIQUE INDEX likes_pkey ON public.likes USING btree (id);

CREATE UNIQUE INDEX likes_user_id_post_id_key ON public.likes USING btree (user_id, post_id);

CREATE UNIQUE INDEX payment_methods_pkey ON public.payment_methods USING btree (id);

CREATE UNIQUE INDEX processing_steps_pkey ON public.processing_steps USING btree (id);

alter table "public"."comments" add constraint "comments_pkey" PRIMARY KEY using index "comments_pkey";

alter table "public"."community_posts" add constraint "community_posts_pkey" PRIMARY KEY using index "community_posts_pkey";

alter table "public"."fits_files" add constraint "fits_files_pkey" PRIMARY KEY using index "fits_files_pkey";

alter table "public"."fits_metadata" add constraint "fits_metadata_pkey" PRIMARY KEY using index "fits_metadata_pkey";

alter table "public"."likes" add constraint "likes_pkey" PRIMARY KEY using index "likes_pkey";

alter table "public"."payment_methods" add constraint "payment_methods_pkey" PRIMARY KEY using index "payment_methods_pkey";

alter table "public"."processing_steps" add constraint "processing_steps_pkey" PRIMARY KEY using index "processing_steps_pkey";

alter table "public"."comments" add constraint "comments_post_id_fkey" FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE not valid;

alter table "public"."comments" validate constraint "comments_post_id_fkey";

alter table "public"."comments" add constraint "comments_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."comments" validate constraint "comments_user_id_fkey";

alter table "public"."community_posts" add constraint "community_posts_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE not valid;

alter table "public"."community_posts" validate constraint "community_posts_project_id_fkey";

alter table "public"."community_posts" add constraint "community_posts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."community_posts" validate constraint "community_posts_user_id_fkey";

alter table "public"."fits_files" add constraint "fits_files_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE not valid;

alter table "public"."fits_files" validate constraint "fits_files_project_id_fkey";

alter table "public"."fits_metadata" add constraint "fits_metadata_file_path_key" UNIQUE using index "fits_metadata_file_path_key";

alter table "public"."likes" add constraint "likes_post_id_fkey" FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE not valid;

alter table "public"."likes" validate constraint "likes_post_id_fkey";

alter table "public"."likes" add constraint "likes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."likes" validate constraint "likes_user_id_fkey";

alter table "public"."likes" add constraint "likes_user_id_post_id_key" UNIQUE using index "likes_user_id_post_id_key";

alter table "public"."payment_methods" add constraint "payment_methods_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."payment_methods" validate constraint "payment_methods_user_id_fkey";

alter table "public"."processing_steps" add constraint "processing_steps_project_id_fkey" FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE not valid;

alter table "public"."processing_steps" validate constraint "processing_steps_project_id_fkey";

alter table "public"."projects" add constraint "projects_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."projects" validate constraint "projects_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_user_role()
 RETURNS text
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  select role from auth.users where id = auth.uid();
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  insert into public.profiles (id, username, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.is_super_user(user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
begin
  return exists (
    select 1 from auth.users 
    where id = user_id and role = 'super_user'
  );
end;
$function$
;

grant delete on table "public"."comments" to "anon";

grant insert on table "public"."comments" to "anon";

grant references on table "public"."comments" to "anon";

grant select on table "public"."comments" to "anon";

grant trigger on table "public"."comments" to "anon";

grant truncate on table "public"."comments" to "anon";

grant update on table "public"."comments" to "anon";

grant delete on table "public"."comments" to "authenticated";

grant insert on table "public"."comments" to "authenticated";

grant references on table "public"."comments" to "authenticated";

grant select on table "public"."comments" to "authenticated";

grant trigger on table "public"."comments" to "authenticated";

grant truncate on table "public"."comments" to "authenticated";

grant update on table "public"."comments" to "authenticated";

grant delete on table "public"."comments" to "service_role";

grant insert on table "public"."comments" to "service_role";

grant references on table "public"."comments" to "service_role";

grant select on table "public"."comments" to "service_role";

grant trigger on table "public"."comments" to "service_role";

grant truncate on table "public"."comments" to "service_role";

grant update on table "public"."comments" to "service_role";

grant delete on table "public"."community_posts" to "anon";

grant insert on table "public"."community_posts" to "anon";

grant references on table "public"."community_posts" to "anon";

grant select on table "public"."community_posts" to "anon";

grant trigger on table "public"."community_posts" to "anon";

grant truncate on table "public"."community_posts" to "anon";

grant update on table "public"."community_posts" to "anon";

grant delete on table "public"."community_posts" to "authenticated";

grant insert on table "public"."community_posts" to "authenticated";

grant references on table "public"."community_posts" to "authenticated";

grant select on table "public"."community_posts" to "authenticated";

grant trigger on table "public"."community_posts" to "authenticated";

grant truncate on table "public"."community_posts" to "authenticated";

grant update on table "public"."community_posts" to "authenticated";

grant delete on table "public"."community_posts" to "service_role";

grant insert on table "public"."community_posts" to "service_role";

grant references on table "public"."community_posts" to "service_role";

grant select on table "public"."community_posts" to "service_role";

grant trigger on table "public"."community_posts" to "service_role";

grant truncate on table "public"."community_posts" to "service_role";

grant update on table "public"."community_posts" to "service_role";

grant delete on table "public"."fits_files" to "anon";

grant insert on table "public"."fits_files" to "anon";

grant references on table "public"."fits_files" to "anon";

grant select on table "public"."fits_files" to "anon";

grant trigger on table "public"."fits_files" to "anon";

grant truncate on table "public"."fits_files" to "anon";

grant update on table "public"."fits_files" to "anon";

grant delete on table "public"."fits_files" to "authenticated";

grant insert on table "public"."fits_files" to "authenticated";

grant references on table "public"."fits_files" to "authenticated";

grant select on table "public"."fits_files" to "authenticated";

grant trigger on table "public"."fits_files" to "authenticated";

grant truncate on table "public"."fits_files" to "authenticated";

grant update on table "public"."fits_files" to "authenticated";

grant delete on table "public"."fits_files" to "service_role";

grant insert on table "public"."fits_files" to "service_role";

grant references on table "public"."fits_files" to "service_role";

grant select on table "public"."fits_files" to "service_role";

grant trigger on table "public"."fits_files" to "service_role";

grant truncate on table "public"."fits_files" to "service_role";

grant update on table "public"."fits_files" to "service_role";

grant delete on table "public"."fits_metadata" to "anon";

grant insert on table "public"."fits_metadata" to "anon";

grant references on table "public"."fits_metadata" to "anon";

grant select on table "public"."fits_metadata" to "anon";

grant trigger on table "public"."fits_metadata" to "anon";

grant truncate on table "public"."fits_metadata" to "anon";

grant update on table "public"."fits_metadata" to "anon";

grant delete on table "public"."fits_metadata" to "authenticated";

grant insert on table "public"."fits_metadata" to "authenticated";

grant references on table "public"."fits_metadata" to "authenticated";

grant select on table "public"."fits_metadata" to "authenticated";

grant trigger on table "public"."fits_metadata" to "authenticated";

grant truncate on table "public"."fits_metadata" to "authenticated";

grant update on table "public"."fits_metadata" to "authenticated";

grant delete on table "public"."fits_metadata" to "service_role";

grant insert on table "public"."fits_metadata" to "service_role";

grant references on table "public"."fits_metadata" to "service_role";

grant select on table "public"."fits_metadata" to "service_role";

grant trigger on table "public"."fits_metadata" to "service_role";

grant truncate on table "public"."fits_metadata" to "service_role";

grant update on table "public"."fits_metadata" to "service_role";

grant delete on table "public"."likes" to "anon";

grant insert on table "public"."likes" to "anon";

grant references on table "public"."likes" to "anon";

grant select on table "public"."likes" to "anon";

grant trigger on table "public"."likes" to "anon";

grant truncate on table "public"."likes" to "anon";

grant update on table "public"."likes" to "anon";

grant delete on table "public"."likes" to "authenticated";

grant insert on table "public"."likes" to "authenticated";

grant references on table "public"."likes" to "authenticated";

grant select on table "public"."likes" to "authenticated";

grant trigger on table "public"."likes" to "authenticated";

grant truncate on table "public"."likes" to "authenticated";

grant update on table "public"."likes" to "authenticated";

grant delete on table "public"."likes" to "service_role";

grant insert on table "public"."likes" to "service_role";

grant references on table "public"."likes" to "service_role";

grant select on table "public"."likes" to "service_role";

grant trigger on table "public"."likes" to "service_role";

grant truncate on table "public"."likes" to "service_role";

grant update on table "public"."likes" to "service_role";

grant delete on table "public"."payment_methods" to "anon";

grant insert on table "public"."payment_methods" to "anon";

grant references on table "public"."payment_methods" to "anon";

grant select on table "public"."payment_methods" to "anon";

grant trigger on table "public"."payment_methods" to "anon";

grant truncate on table "public"."payment_methods" to "anon";

grant update on table "public"."payment_methods" to "anon";

grant delete on table "public"."payment_methods" to "authenticated";

grant insert on table "public"."payment_methods" to "authenticated";

grant references on table "public"."payment_methods" to "authenticated";

grant select on table "public"."payment_methods" to "authenticated";

grant trigger on table "public"."payment_methods" to "authenticated";

grant truncate on table "public"."payment_methods" to "authenticated";

grant update on table "public"."payment_methods" to "authenticated";

grant delete on table "public"."payment_methods" to "service_role";

grant insert on table "public"."payment_methods" to "service_role";

grant references on table "public"."payment_methods" to "service_role";

grant select on table "public"."payment_methods" to "service_role";

grant trigger on table "public"."payment_methods" to "service_role";

grant truncate on table "public"."payment_methods" to "service_role";

grant update on table "public"."payment_methods" to "service_role";

grant delete on table "public"."processing_steps" to "anon";

grant insert on table "public"."processing_steps" to "anon";

grant references on table "public"."processing_steps" to "anon";

grant select on table "public"."processing_steps" to "anon";

grant trigger on table "public"."processing_steps" to "anon";

grant truncate on table "public"."processing_steps" to "anon";

grant update on table "public"."processing_steps" to "anon";

grant delete on table "public"."processing_steps" to "authenticated";

grant insert on table "public"."processing_steps" to "authenticated";

grant references on table "public"."processing_steps" to "authenticated";

grant select on table "public"."processing_steps" to "authenticated";

grant trigger on table "public"."processing_steps" to "authenticated";

grant truncate on table "public"."processing_steps" to "authenticated";

grant update on table "public"."processing_steps" to "authenticated";

grant delete on table "public"."processing_steps" to "service_role";

grant insert on table "public"."processing_steps" to "service_role";

grant references on table "public"."processing_steps" to "service_role";

grant select on table "public"."processing_steps" to "service_role";

grant trigger on table "public"."processing_steps" to "service_role";

grant truncate on table "public"."processing_steps" to "service_role";

grant update on table "public"."processing_steps" to "service_role";

create policy "Anyone can view comments"
on "public"."comments"
as permissive
for select
to public
using (true);


create policy "Users can create their own comments"
on "public"."comments"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can delete their own comments"
on "public"."comments"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can update their own comments"
on "public"."comments"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Anyone can view public posts"
on "public"."community_posts"
as permissive
for select
to public
using (true);


create policy "Users can create their own posts"
on "public"."community_posts"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can delete their own posts"
on "public"."community_posts"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can update their own posts"
on "public"."community_posts"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can create files for their projects"
on "public"."fits_files"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = fits_files.project_id) AND (projects.user_id = auth.uid())))));


create policy "Users can delete their project's files"
on "public"."fits_files"
as permissive
for delete
to public
using ((EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = fits_files.project_id) AND (projects.user_id = auth.uid())))));


create policy "Users can update their project's files"
on "public"."fits_files"
as permissive
for update
to public
using ((EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = fits_files.project_id) AND (projects.user_id = auth.uid())))));


create policy "Users can view their project's files"
on "public"."fits_files"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = fits_files.project_id) AND (projects.user_id = auth.uid())))));


create policy "Anyone can view likes"
on "public"."likes"
as permissive
for select
to public
using (true);


create policy "Users can create their own likes"
on "public"."likes"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can delete their own likes"
on "public"."likes"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can create their own payment methods"
on "public"."payment_methods"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can delete their own payment methods"
on "public"."payment_methods"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can update their own payment methods"
on "public"."payment_methods"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view their own payment methods"
on "public"."payment_methods"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can create steps for their projects"
on "public"."processing_steps"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = processing_steps.project_id) AND (projects.user_id = auth.uid())))));


create policy "Users can delete their project's steps"
on "public"."processing_steps"
as permissive
for delete
to public
using ((EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = processing_steps.project_id) AND (projects.user_id = auth.uid())))));


create policy "Users can update their project's steps"
on "public"."processing_steps"
as permissive
for update
to public
using ((EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = processing_steps.project_id) AND (projects.user_id = auth.uid())))));


create policy "Users can view their project's steps"
on "public"."processing_steps"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = processing_steps.project_id) AND (projects.user_id = auth.uid())))));


create policy "Users can view their own projects"
on "public"."projects"
as permissive
for select
to authenticated
using ((auth.uid() = user_id));


create policy "Public projects are viewable by anyone"
on "public"."projects"
as permissive
for select
to authenticated
using ((is_public = true));


create policy "Users can create their own projects"
on "public"."projects"
as permissive
for insert
to authenticated
with check ((auth.uid() = user_id));


create policy "Users can delete their own projects"
on "public"."projects"
as permissive
for delete
to authenticated
using ((auth.uid() = user_id));


create policy "Users can update their own projects"
on "public"."projects"
as permissive
for update
to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.community_posts FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.payment_methods FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.processing_steps FOR EACH ROW EXECUTE FUNCTION handle_updated_at();


