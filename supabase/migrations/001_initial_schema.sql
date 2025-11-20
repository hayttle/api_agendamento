-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Companies table
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table (linked to Supabase Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'admin')),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API Clients table
CREATE TABLE api_clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  label VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API Keys table
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_client_id UUID NOT NULL REFERENCES api_clients(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL,
  key_prefix VARCHAR(10) NOT NULL,
  revoked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  revoked_at TIMESTAMP WITH TIME ZONE
);

-- Professionals table
CREATE TABLE professionals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Services table
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  duration_minutes INTEGER NOT NULL,
  price DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Availabilities table
CREATE TABLE availabilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Slots table
CREATE TABLE slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  slot_id UUID NOT NULL REFERENCES slots(id) ON DELETE CASCADE,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity Logs table
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  resource_id UUID,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_api_clients_company_id ON api_clients(company_id);
CREATE INDEX idx_api_keys_api_client_id ON api_keys(api_client_id);
CREATE INDEX idx_api_keys_revoked ON api_keys(revoked);
CREATE INDEX idx_professionals_company_id ON professionals(company_id);
CREATE INDEX idx_services_company_id ON services(company_id);
CREATE INDEX idx_availabilities_professional_id ON availabilities(professional_id);
CREATE INDEX idx_slots_professional_id ON slots(professional_id);
CREATE INDEX idx_slots_service_id ON slots(service_id);
CREATE INDEX idx_slots_start_time ON slots(start_time);
CREATE INDEX idx_slots_is_available ON slots(is_available);
CREATE INDEX idx_bookings_company_id ON bookings(company_id);
CREATE INDEX idx_bookings_professional_id ON bookings(professional_id);
CREATE INDEX idx_bookings_slot_id ON bookings(slot_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_activity_logs_company_id ON activity_logs(company_id);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);

-- RPC Function: create_booking_safely
-- This function atomically creates a booking and marks the slot as unavailable
CREATE OR REPLACE FUNCTION create_booking_safely(
  p_company_id UUID,
  p_professional_id UUID,
  p_service_id UUID,
  p_slot_id UUID,
  p_customer_name VARCHAR,
  p_customer_email VARCHAR DEFAULT NULL,
  p_customer_phone VARCHAR DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_booking_id UUID;
  v_slot_available BOOLEAN;
BEGIN
  -- Check if slot is available
  SELECT is_available INTO v_slot_available
  FROM slots
  WHERE id = p_slot_id AND professional_id = p_professional_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Slot not found';
  END IF;

  IF NOT v_slot_available THEN
    RAISE EXCEPTION 'Slot is not available';
  END IF;

  -- Create booking and mark slot as unavailable in a transaction
  INSERT INTO bookings (
    company_id,
    professional_id,
    service_id,
    slot_id,
    customer_name,
    customer_email,
    customer_phone,
    status
  ) VALUES (
    p_company_id,
    p_professional_id,
    p_service_id,
    p_slot_id,
    p_customer_name,
    p_customer_email,
    p_customer_phone,
    'confirmed'
  ) RETURNING id INTO v_booking_id;

  -- Mark slot as unavailable
  UPDATE slots
  SET is_available = FALSE
  WHERE id = p_slot_id;

  RETURN v_booking_id;
END;
$$;

-- Row Level Security (RLS) Policies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE availabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for companies
-- Best Practice: Usar funções SECURITY DEFINER para evitar recursão

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
-- Best Practice: Funções SECURITY DEFINER para evitar recursão infinita
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

-- Política 1: Qualquer usuário autenticado pode ver seu próprio registro
-- Esta é a política mais básica e deve vir primeiro
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

-- RLS Policies for api_clients and api_keys
-- Best Practice: Usar funções SECURITY DEFINER

-- Política para api_clients: Admin pode gerenciar apenas os da sua company
CREATE POLICY "api_clients_all_for_admin" ON api_clients
  FOR ALL
  USING (company_id = public.user_company_id())
  WITH CHECK (company_id = public.user_company_id());

-- Política para api_keys: Admin pode gerenciar apenas as keys dos seus api_clients
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

-- RLS Policies for professionals, services, etc.
-- Best Practice: Usar funções SECURITY DEFINER

CREATE POLICY "professionals_all_for_admin" ON professionals
  FOR ALL
  USING (company_id = public.user_company_id())
  WITH CHECK (company_id = public.user_company_id());

CREATE POLICY "services_all_for_admin" ON services
  FOR ALL
  USING (company_id = public.user_company_id())
  WITH CHECK (company_id = public.user_company_id());

-- Note: API Key authentication will be handled at application level, not RLS
-- RLS policies above are for JWT-based panel access

