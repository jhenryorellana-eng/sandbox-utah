-- ============================================================================
-- 20260506000020_revoke_has_role_public_exec
--
-- Mitiga advisor `0028_anon_security_definer_function_executable`:
-- la función `public.has_role(text)` es SECURITY DEFINER y por defecto está
-- expuesta vía PostgREST en `/rest/v1/rpc/has_role`. La quitamos del rol `anon`
-- porque el público no debería poder probar membresía de roles arbitrarios.
--
-- Mantenemos EXECUTE para `authenticated` porque las RLS policies del proyecto
-- la invocan en `using/with check` y, en ese contexto, `auth.uid()` ya limita
-- la información que la función puede revelar al propio usuario.
--
-- (Advisor 0029 — "authenticated can execute" — queda como WARN aceptado: el
-- `authenticated` ya puede consultar su propia membresía vía la tabla
-- `user_roles` con su política `self read`, así que la función no expone más
-- información que la query directa.)
-- ============================================================================

revoke execute on function public.has_role(text) from anon;
revoke execute on function public.has_role(text) from public;

-- Comentario para que el advisor refleje la intención del proyecto:
comment on function public.has_role(text) is
  'Comprueba si el usuario actual tiene un rol. SECURITY DEFINER porque consulta user_roles. EXECUTE revocado a anon (advisor 0028 mitigado).';
