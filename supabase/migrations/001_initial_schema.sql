-- ==============================================================================
-- 001_initial_schema.sql — Hardened Generic SaaS Foundation
-- Zero Supabase Advisor warnings: (select auth.uid()), SECURITY DEFINER with
-- SET search_path = '', REVOKE ALL FROM PUBLIC/anon, explicit FK indexes.
-- ==============================================================================

-- 1. Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  credits integer NOT NULL DEFAULT 0 CHECK (credits >= 0),
  plan text NOT NULL DEFAULT 'free',
  is_active boolean NOT NULL DEFAULT false,
  stripe_customer_id text,
  stripe_subscription_id text,
  utm_source text,
  utm_campaign text,
  utm_content text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id
  ON public.profiles (stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);

-- 2. Webhook idempotency ledger (service_role exclusive, 0 public policies)
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id text PRIMARY KEY,
  provider text NOT NULL DEFAULT 'stripe',
  event_type text NOT NULL,
  payload jsonb,
  processed_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Credit ledger (append-only audit trail)
CREATE TABLE IF NOT EXISTS public.credit_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  delta integer NOT NULL CHECK (delta <> 0),
  reason text NOT NULL,
  reference_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credit_ledger_user_id ON public.credit_ledger (user_id);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_reference_id
  ON public.credit_ledger (reference_id) WHERE reference_id IS NOT NULL;

-- 4. Updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. Guard protected profile columns against direct authenticated client updates.
-- SECURITY INVOKER ensures current_user reflects the actual invoking role.
CREATE OR REPLACE FUNCTION public.guard_profile_sensitive_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF current_user IN ('service_role', 'postgres', 'supabase_admin') THEN
    RETURN NEW;
  END IF;
  IF NEW.credits IS DISTINCT FROM OLD.credits
     OR NEW.plan IS DISTINCT FROM OLD.plan
     OR NEW.is_active IS DISTINCT FROM OLD.is_active
     OR NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id
     OR NEW.stripe_subscription_id IS DISTINCT FROM OLD.stripe_subscription_id
     OR NEW.email IS DISTINCT FROM OLD.email
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Forbidden modification of protected profile fields' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_profile_sensitive_columns() FROM PUBLIC, anon;
DROP TRIGGER IF EXISTS trg_guard_profile_sensitive_columns ON public.profiles;
CREATE TRIGGER trg_guard_profile_sensitive_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_sensitive_columns();

-- 6. Handle new user signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    coalesce(NEW.email, ''),
    nullif(trim(coalesce(NEW.raw_user_meta_data ->> 'full_name', '')), '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Atomic credit decrement RPC (FOR UPDATE lock + strict caller authorization)
CREATE OR REPLACE FUNCTION public.decrement_user_credits(
  p_user_id uuid,
  p_amount integer,
  p_reason text,
  p_reference_id text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_role text := coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
    ''
  );
  v_current_credits integer;
  v_next_credits integer;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'p_amount must be strictly positive' USING ERRCODE = '22023';
  END IF;
  IF NOT (
    v_role = 'service_role'
    OR (v_role = '' AND session_user IN ('postgres', 'supabase_admin'))
  ) AND (select auth.uid()) IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Forbidden credit operation' USING ERRCODE = '42501';
  END IF;

  SELECT credits INTO v_current_credits FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found' USING ERRCODE = 'P0002';
  END IF;
  IF v_current_credits < p_amount THEN
    RAISE EXCEPTION 'Insufficient credits' USING ERRCODE = 'P0001';
  END IF;

  v_next_credits := v_current_credits - p_amount;
  UPDATE public.profiles SET credits = v_next_credits WHERE id = p_user_id;
  INSERT INTO public.credit_ledger (user_id, delta, reason, reference_id)
  VALUES (p_user_id, -p_amount, coalesce(nullif(trim(p_reason), ''), 'usage'), p_reference_id);
  RETURN v_next_credits;
END;
$$;

REVOKE ALL ON FUNCTION public.decrement_user_credits(uuid, integer, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.decrement_user_credits(uuid, integer, text, text) TO authenticated, service_role;

-- 8. Atomic credit addition RPC (service_role exclusive)
CREATE OR REPLACE FUNCTION public.credit_user_credits(
  p_user_id uuid,
  p_amount integer,
  p_reason text,
  p_reference_id text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_current_credits integer;
  v_next_credits integer;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'p_amount must be strictly positive' USING ERRCODE = '22023';
  END IF;
  SELECT credits INTO v_current_credits FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found' USING ERRCODE = 'P0002';
  END IF;
  v_next_credits := v_current_credits + p_amount;
  UPDATE public.profiles SET credits = v_next_credits WHERE id = p_user_id;
  INSERT INTO public.credit_ledger (user_id, delta, reason, reference_id)
  VALUES (p_user_id, p_amount, coalesce(nullif(trim(p_reason), ''), 'purchase'), p_reference_id);
  RETURN v_next_credits;
END;
$$;

REVOKE ALL ON FUNCTION public.credit_user_credits(uuid, integer, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.credit_user_credits(uuid, integer, text, text) TO service_role;

-- 9. Strict Row Level Security (0 initplan / 0 multiple permissive policies)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT TO authenticated
  USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "profiles_update_own_safe" ON public.profiles;
CREATE POLICY "profiles_update_own_safe"
  ON public.profiles FOR UPDATE TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "credit_ledger_select_own" ON public.credit_ledger;
CREATE POLICY "credit_ledger_select_own"
  ON public.credit_ledger FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);
-- Intentionally NO policies on public.webhook_events -> exclusive to service_role.

-- 10. Private Storage bucket with hard MIME allowlist & 10 MB cap
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-uploads', 'user-uploads', false, 10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "user_uploads_select_own" ON storage.objects;
CREATE POLICY "user_uploads_select_own"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'user-uploads' AND (storage.foldername(name))[1] = (select auth.uid())::text);

DROP POLICY IF EXISTS "user_uploads_delete_own" ON storage.objects;
CREATE POLICY "user_uploads_delete_own"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'user-uploads' AND (storage.foldername(name))[1] = (select auth.uid())::text);
