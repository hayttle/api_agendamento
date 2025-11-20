-- Migration para corrigir políticas RLS seguindo melhores práticas
-- Remove políticas antigas que causam recursão e cria novas usando funções SECURITY DEFINER

-- Remover políticas antigas
DROP POLICY IF EXISTS "super_admin_all_companies" ON companies;
DROP POLICY IF EXISTS "admin_own_company" ON companies;
DROP POLICY IF EXISTS "users_own_record" ON users;
DROP POLICY IF EXISTS "super_admin_all_users" ON users;
DROP POLICY IF EXISTS "admin_own_company_users" ON users;
DROP POLICY IF EXISTS "admin_own_company_api_clients" ON api_clients;
DROP POLICY IF EXISTS "admin_own_company_api_keys" ON api_keys;
DROP POLICY IF EXISTS "admin_own_company_professionals" ON professionals;
DROP POLICY IF EXISTS "admin_own_company_services" ON services;

-- Remover funções antigas se existirem
DROP FUNCTION IF EXISTS is_super_admin();
DROP FUNCTION IF EXISTS get_user_company_id();

-- Criar funções SECURITY DEFINER seguindo melhores práticas
-- Essas funções executam com privilégios elevados e não são afetadas por RLS
-- Criadas no schema public (não podemos criar no schema auth)
CREATE OR REPLACE FUNCTION public.user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM users WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.user_company_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT company_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

-- RLS Policies for companies
-- Política 1: Super admin pode ver todas as companies
CREATE POLICY "companies_all_for_super_admin" ON companies
  FOR ALL
  USING (public.user_role() = 'super_admin')
  WITH CHECK (public.user_role() = 'super_admin');

-- Política 2: Admin pode ver apenas sua própria company
CREATE POLICY "companies_select_own" ON companies
  FOR SELECT
  USING (id = public.user_company_id());

-- RLS Policies for users
-- Política 1: Qualquer usuário autenticado pode ver seu próprio registro
CREATE POLICY "users_select_own" ON users
  FOR SELECT
  USING (auth_user_id = auth.uid());

-- Política 2: Super admin pode ver todos os usuários
CREATE POLICY "users_all_for_super_admin" ON users
  FOR SELECT
  USING (public.user_role() = 'super_admin');

-- Política 3: Admin pode ver usuários da mesma company
CREATE POLICY "users_select_same_company" ON users
  FOR SELECT
  USING (
    company_id = public.user_company_id()
    OR auth_user_id = auth.uid()
  );

-- Política 4: Super admin pode inserir/atualizar/deletar usuários
CREATE POLICY "users_modify_for_super_admin" ON users
  FOR ALL
  USING (public.user_role() = 'super_admin')
  WITH CHECK (public.user_role() = 'super_admin');

-- RLS Policies for api_clients
CREATE POLICY "api_clients_all_for_admin" ON api_clients
  FOR ALL
  USING (company_id = public.user_company_id())
  WITH CHECK (company_id = public.user_company_id());

-- RLS Policies for api_keys
CREATE POLICY "api_keys_all_for_admin" ON api_keys
  FOR ALL
  USING (
    api_client_id IN (
      SELECT id FROM api_clients WHERE company_id = public.user_company_id()
    )
  )
  WITH CHECK (
    api_client_id IN (
      SELECT id FROM api_clients WHERE company_id = public.user_company_id()
    )
  );

-- RLS Policies for professionals
CREATE POLICY "professionals_all_for_admin" ON professionals
  FOR ALL
  USING (company_id = public.user_company_id())
  WITH CHECK (company_id = public.user_company_id());

-- RLS Policies for services
CREATE POLICY "services_all_for_admin" ON services
  FOR ALL
  USING (company_id = public.user_company_id())
  WITH CHECK (company_id = public.user_company_id());

