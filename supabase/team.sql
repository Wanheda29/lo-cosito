-- Completar los correos de usuarios ya creados en Authentication > Users.
-- Ejecutar desde SQL Editor en el proyecto de Lo Cosito.
do $$
declare
  team_emails text[] := array[]::text[];
  team_email text;
  member_id uuid;
  lo_cosito_id constant uuid := 'c2edbe22-8d5b-4b48-bc3c-897aeb810728';
begin
  if cardinality(team_emails) = 0 then
    raise exception 'Agregá los correos del equipo a team_emails antes de ejecutar.';
  end if;

  insert into public.businesses (id, name) values (lo_cosito_id, 'Lo Cosito')
  on conflict (id) do nothing;

  foreach team_email in array team_emails loop
    select id into member_id from auth.users where lower(email) = lower(trim(team_email));
    if member_id is null then
      raise exception 'Falta crear la cuenta de % en Supabase Auth.', team_email;
    end if;

    insert into public.memberships (business_id, user_id) values (lo_cosito_id, member_id)
    on conflict (business_id, user_id) do nothing;
  end loop;
end;
$$;
