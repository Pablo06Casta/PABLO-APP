-- Permite que cada persona elimine exclusivamente su propia cuenta.
-- La clave foránea public.budgets.user_id usa ON DELETE CASCADE, por lo que
-- todos sus presupuestos sincronizados se eliminan en la misma operación.
create or replace function public.delete_current_user()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from auth.users where id = auth.uid();
$$;

revoke all on function public.delete_current_user() from public;
grant execute on function public.delete_current_user() to authenticated;
