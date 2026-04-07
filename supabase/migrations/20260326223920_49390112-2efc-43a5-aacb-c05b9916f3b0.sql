-- Add payment and referral columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS trial_start_date timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'trialing',
  ADD COLUMN IF NOT EXISTS subscription_end_date timestamptz,
  ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS successful_referrals integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_influencer boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS influencer_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_customer_id text;

-- Create user_roles table
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role check
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create influencer_sales table
CREATE TABLE public.influencer_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id uuid NOT NULL REFERENCES public.profiles(id),
  buyer_user_id uuid NOT NULL REFERENCES public.profiles(id),
  sale_amount integer NOT NULL DEFAULT 0,
  commission_amount integer NOT NULL DEFAULT 0,
  sale_date timestamptz NOT NULL DEFAULT now(),
  paid_out boolean NOT NULL DEFAULT false,
  stripe_payment_intent_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.influencer_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Influencers view own sales" ON public.influencer_sales
  FOR SELECT TO authenticated
  USING (auth.uid() = influencer_id);

CREATE POLICY "Admins manage all sales" ON public.influencer_sales
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Function to generate a unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  new_code text;
  code_exists boolean;
BEGIN
  LOOP
    new_code := upper(substr(md5(random()::text), 1, 8));
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE referral_code = new_code) INTO code_exists;
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$;

-- Update the handle_new_user trigger function to include referral code and trial
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, trial_start_date, referral_code)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', ''),
    now(),
    public.generate_referral_code()
  );
  RETURN NEW;
END;
$$;

-- Make sure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Generate referral codes for existing users that don't have one
UPDATE public.profiles
SET referral_code = public.generate_referral_code(),
    trial_start_date = COALESCE(trial_start_date, created_at)
WHERE referral_code IS NULL;